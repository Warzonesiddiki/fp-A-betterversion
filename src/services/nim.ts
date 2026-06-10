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

const FINANCIAL_SYSTEM_PROMPT = `You are a senior FP&A analyst assistant embedded in FinPlan Pro.
You help with financial planning, budgeting, forecasting, variance analysis, and consolidation.
Always:
- Use precise financial terminology
- Format numbers with commas and appropriate decimal places
- Flag material variances (>10%)
- Consider both favorable and unfavorable scenarios
- Reference period-over-period trends when relevant
- Be concise but thorough`;

export async function analyzeVariance(params: {
  metric: string;
  actual: number;
  budget: number;
  period: string;
}): Promise<string> {
  const variance = params.actual - params.budget;
  const variancePct = params.budget !== 0 ? (variance / params.budget) * 100 : 0;

  const response = await nimChat(
    [
      { role: 'system', content: FINANCIAL_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Analyze this variance:
Metric: ${params.metric}
Actual: ${params.actual}
Budget: ${params.budget}
Variance: ${variance} (${variancePct.toFixed(1)}%)
Period: ${params.period}

Provide: 1) Root cause analysis, 2) Impact assessment, 3) Recommended actions.`,
      },
    ],
    { temperature: 0.3, max_tokens: 800 }
  );

  return response.choices[0]?.message?.content || 'No analysis generated.';
}

export async function generateForecastInsight(params: {
  metric: string;
  historicalData: Array<{ period: string; value: number }>;
  forecastPeriods: number;
}): Promise<string> {
  const dataStr = params.historicalData.map((d) => `${d.period}: ${d.value}`).join('\n');

  const response = await nimChat(
    [
      { role: 'system', content: FINANCIAL_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Based on this historical data for "${params.metric}":
${dataStr}

Provide a ${params.forecastPeriods}-period forecast insight including:
1) Trend direction and strength
2) Seasonality patterns
3) Key assumptions
4) Risk factors
5) Confidence level`,
      },
    ],
    { temperature: 0.4, max_tokens: 1000 }
  );

  return response.choices[0]?.message?.content || 'No insight generated.';
}

export async function explainFormula(formula: string): Promise<string> {
  const response = await nimChat(
    [
      { role: 'system', content: FINANCIAL_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Explain this financial formula in plain language:\n${formula}\n\nInclude: what it measures, when to use it, and what good/bad values look like.`,
      },
    ],
    { temperature: 0.2, max_tokens: 500 }
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
  const response = await nimChat(
    [
      { role: 'system', content: FINANCIAL_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Summarize this budget:
Name: ${budgetData.name}
Period: ${budgetData.period}
Total Revenue: ${budgetData.totalRevenue}
Total Expenses: ${budgetData.totalExpenses}
Line Items: ${budgetData.lineItemCount}

Provide a concise executive summary with key highlights.`,
      },
    ],
    { temperature: 0.3, max_tokens: 600 }
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
