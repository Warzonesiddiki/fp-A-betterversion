// =============================================================================
// NVIDIA NIM Integration Service — FinPlan Pro
// Provides AI-powered financial analysis via NVIDIA NIM API (OpenAI-compatible)
// =============================================================================

const NIM_BASE_URL = import.meta.env.VITE_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1';
const NIM_API_KEY_1 = import.meta.env.VITE_NIM_API_KEY_1 || '';
const NIM_API_KEY_2 = import.meta.env.VITE_NIM_API_KEY_2 || '';

// Round-robin key rotation for rate limit distribution
let activeKeyIndex = 0;

function getApiKey(): string {
  const keys = [NIM_API_KEY_1, NIM_API_KEY_2].filter(Boolean);
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

// --- Core API ---

async function nimFetch<T>(endpoint: string, body: unknown): Promise<T> {
  const response = await fetch(`${NIM_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`NIM API error ${response.status}: ${errorText}`);
  }

  return response.json() as Promise<T>;
}

// --- Chat Completion ---

export async function nimChat(
  messages: NIMMessage[],
  options: {
    model?: NIMModelId;
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
  } = {}
): Promise<NIMChatResponse> {
  return nimFetch<NIMChatResponse>('/chat/completions', {
    model: options.model || NIM_MODELS.DEFAULT,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 1024,
    top_p: options.top_p ?? 0.9,
    stream: false,
  });
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
  const response = await fetch(`${NIM_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: options.model || NIM_MODELS.DEFAULT,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 1024,
      stream: true,
    }),
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
  return Boolean(NIM_API_KEY_1 || NIM_API_KEY_2);
}

export function getNimKeyCount(): number {
  return [NIM_API_KEY_1, NIM_API_KEY_2].filter(Boolean).length;
}
