// =============================================================================
// NVIDIA NIM Integration Service — FinPlan Pro
// Provides AI-powered financial analysis via NVIDIA NIM API (OpenAI-compatible)
// =============================================================================

import { LlmEgressHttpError, llmEgress } from './llm/llmEgress';
import { formatMoney, subtractMoney, variancePct as variancePctOf } from '../utils/money';

// SECURITY (Phase 7 audit finding, Hephaestus PATCH 2): NIM API keys MUST NOT
// be embedded in production client bundles. In production builds, force the
// use of a server-side proxy (e.g., /api/nim/*) — direct browser-to-NIM calls
// leak the key to anyone who inspects the bundle. See SECURITY_READINESS.md
// G7 v1.1 follow-up.
if (
  import.meta.env.PROD &&
  (import.meta.env.VITE_NIM_API_KEY_1 || import.meta.env.VITE_NIM_API_KEY_2)
) {
  throw new Error(
    '[SECURITY] NIM API keys are embedded in the production bundle. ' +
      'Move NIM integration behind a server-side proxy. ' +
      'See SECURITY_READINESS.md G7 v1.1 follow-up.'
  );
}

const NIM_BASE_URL = import.meta.env.VITE_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1';

// Keys are read LAZILY (per call) rather than snapshotted at module load so
// that gating consumers (e.g. AutoCommentaryEngine, W0.9 lane R19) and tests
// observe current env state; Vite inlines build-time values either way.
// Round-robin key rotation for rate limit distribution
let activeKeyIndex = 0;

function getConfiguredKeys(): string[] {
  return [import.meta.env.VITE_NIM_API_KEY_1, import.meta.env.VITE_NIM_API_KEY_2].filter(
    (key): key is string => Boolean(key)
  );
}

function getApiKey(): string {
  const keys = getConfiguredKeys();
  if (keys.length === 0) {
    throw new Error(
      'NIM API keys not configured. Set VITE_NIM_API_KEY_1 and/or VITE_NIM_API_KEY_2 in .env'
    );
  }
  const key = keys[activeKeyIndex % keys.length]!;
  activeKeyIndex++;
  return key;
}

// --- Types ---

export interface NIMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface NIMChatRequest {
  model?: string;
  messages: NIMMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

export interface NIMChatResponse {
  id: string;
  choices: Array<{
    index: number;
    message: NIMMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface NIMStreamChunk {
  id: string;
  choices: Array<{
    index: number;
    delta: Partial<NIMMessage>;
    finish_reason: string | null;
  }>;
}

// --- Available Models ---

export const NIM_MODELS = {
  // General reasoning
  LLAMA_3_1_70B: 'meta/llama-3.1-70b-instruct',
  LLAMA_3_1_8B: 'meta/llama-3.1-8b-instruct',
  // Code generation
  CODESTRAL_24B: 'mistralai/codestral-24b-instruct',
  // Financial analysis (use general models with system prompt)
  DEFAULT: 'meta/llama-3.1-70b-instruct',
} as const;

export type NIMModelId = (typeof NIM_MODELS)[keyof typeof NIM_MODELS];

// --- Core API (all model traffic flows through the LLM egress chokepoint, W0.9) ---

export async function nimChat(
  messages: NIMMessage[],
  options: {
    model?: NIMModelId;
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
  } = {}
): Promise<NIMChatResponse> {
  try {
    return await llmEgress.complete<NIMChatResponse>(messages, {
      endpoint: `${NIM_BASE_URL}/chat/completions`,
      model: options.model || NIM_MODELS.DEFAULT,
      temperature: options.temperature ?? 0.7,
      maxTokens: options.max_tokens ?? 1024,
      topP: options.top_p ?? 0.9,
      headers: () => ({ Authorization: `Bearer ${getApiKey()}` }),
    });
  } catch (error) {
    if (error instanceof LlmEgressHttpError) {
      // Preserve the historical NIM error surface for existing consumers.
      throw new Error(`NIM API error ${error.status}: ${error.bodyPreview}`);
    }
    throw error;
  }
}

// --- Streaming Chat ---

export async function* nimChatStream(
  messages: NIMMessage[],
  options: {
    model?: NIMModelId;
    temperature?: number;
    max_tokens?: number;
  } = {}
): AsyncGenerator<NIMStreamChunk, void, unknown> {
  const response = await llmEgress.openStream(messages, {
    endpoint: `${NIM_BASE_URL}/chat/completions`,
    model: options.model || NIM_MODELS.DEFAULT,
    temperature: options.temperature ?? 0.7,
    maxTokens: options.max_tokens ?? 1024,
    headers: () => ({ Authorization: `Bearer ${getApiKey()}` }),
  });

  if (!response.ok) {
    throw new Error(`NIM stream error ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') return;

        try {
          yield JSON.parse(data) as NIMStreamChunk;
        } catch {
          // skip malformed chunks
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// --- Financial Analysis Helpers ---

import {
  variancePrompt,
  forecastPrompt,
  formulaExplanationPrompt,
  budgetSummaryPrompt,
} from './nim-prompts';

export async function analyzeVariance(params: {
  metric: string;
  actual: number;
  budget: number;
  period: string;
}): Promise<string> {
  const prompt = variancePrompt(params);
  const response = await nimChat(
    [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user },
    ],
    { temperature: prompt.temperature, max_tokens: prompt.maxTokens }
  );

  return response.choices[0]?.message?.content || 'No analysis generated.';
}

/** Result of the enhanced variance pass — which path produced the text. */
export interface VarianceAnalysisResult {
  text: string;
  /** 'llm' = gated+redacted chokepoint call succeeded; 'local' = deterministic fallback. */
  source: 'llm' | 'local';
}

/** Deterministic local fallback — mirrors variancePrompt's arithmetic contract. */
function localVarianceSentence(params: {
  metric: string;
  actual: number;
  budget: number;
  period: string;
}): string {
  const variance = subtractMoney(params.actual, params.budget);
  // (actual − base) / base × 100; variancePct returns 0 for 0/0 by definition.
  const variancePct = params.budget !== 0 ? variancePctOf(params.actual, params.budget) : 0;
  const direction = variance >= 0 ? 'above' : 'below';
  return (
    `${params.metric} for ${params.period}: actual ${params.actual.toLocaleString()} vs ` +
    `budget ${params.budget.toLocaleString()} — ${Math.abs(variance).toLocaleString()} ` +
    `(${formatMoney(Math.abs(variancePct), { places: 1 })}%) ${direction} budget.`
  );
}

/**
 * W0.9 (lane R37): fail-closed variance analysis — the chokepoint-routed
 * sibling of {@link analyzeVariance}, mirroring the AutoCommentaryEngine R19
 * wiring.
 *
 * Contract:
 *  - egress disabled or NIM unconfigured → deterministic local sentence; the
 *    transport is never touched and no audit event is emitted;
 *  - enabled + allowed → facts-only variancePrompt via nimChat (kill-switch
 *    gated, host-allowlisted, redacted, audited inside the chokepoint),
 *    conservative temperature 0.2;
 *  - ANY failure (blocked/denied host, HTTP error, empty model content)
 *    degrades to the same local sentence — this never throws into the UI.
 */
export async function analyzeVarianceEnhanced(params: {
  metric: string;
  actual: number;
  budget: number;
  period: string;
}): Promise<VarianceAnalysisResult> {
  const prompt = variancePrompt(params);
  const localText = localVarianceSentence(params);
  if (!llmEgress.isEgressEnabled() || !isNimConfigured()) {
    return { text: localText, source: 'local' };
  }
  try {
    const response = await nimChat(
      [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
      { temperature: 0.2, max_tokens: 512 }
    );
    const llmText = response.choices[0]?.message?.content?.trim();
    return llmText ? { text: llmText, source: 'llm' } : { text: localText, source: 'local' };
  } catch {
    // Fail-closed: LlmEgressBlockedError, HTTP errors, network failures all
    // degrade to the deterministic local sentence.
    return { text: localText, source: 'local' };
  }
}

export async function generateForecastInsight(params: {
  metric: string;
  historicalData: Array<{ period: string; value: number }>;
  forecastPeriods: number;
}): Promise<string> {
  const prompt = forecastPrompt(params);
  const response = await nimChat(
    [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user },
    ],
    { temperature: prompt.temperature, max_tokens: prompt.maxTokens }
  );

  return response.choices[0]?.message?.content || 'No insight generated.';
}

export async function explainFormula(formula: string): Promise<string> {
  const prompt = formulaExplanationPrompt({ formula });
  const response = await nimChat(
    [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user },
    ],
    { temperature: prompt.temperature, max_tokens: prompt.maxTokens }
  );

  return response.choices[0]?.message?.content || 'No explanation generated.';
}

export async function summarizeBudget(budgetData: {
  name: string;
  totalRevenue: number;
  totalExpenses: number;
  lineItemCount: number;
  period: string;
}): Promise<string> {
  const prompt = budgetSummaryPrompt(budgetData);
  const response = await nimChat(
    [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user },
    ],
    { temperature: prompt.temperature, max_tokens: prompt.maxTokens }
  );

  return response.choices[0]?.message?.content || 'No summary generated.';
}

// --- Utility ---

export function isNimConfigured(): boolean {
  return getConfiguredKeys().length > 0;
}

export function getNimKeyCount(): number {
  return getConfiguredKeys().length;
}
