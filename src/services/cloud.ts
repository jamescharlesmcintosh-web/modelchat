import type { Model, Message, ModelSource } from '../types';

const API_URLS: Record<string, string> = {
  openrouter: 'https://openrouter.ai/api/v1',
  together: 'https://api.together.xyz/v1',
  groq: 'https://api.groq.com/openai/v1',
};

const FREE_MODELS: Record<string, string[]> = {
  openrouter: [
    'meta-llama/llama-3.1-8b-instruct',
    'mistralai/mistral-7b-instruct',
    'microsoft/phi-3-mini-128k-instruct',
    'qwen/qwen-2.5-7b-instruct',
    'deepseek/deepseek-coder',
  ],
  together: [
    'meta-llama/Llama-3.1-8B-Instruct-Turbo',
    'mistralai/Mistral-7B-Instruct-v0.3',
    'Qwen/Qwen2.5-7B-Instruct-Turbo',
  ],
  groq: [
    'llama-3.1-8b-instant',
    'mixtral-8x7b-32768',
    'gemma2-9b-it',
  ],
};

export async function fetchCloudModels(
  source: ModelSource,
  apiKey: string
): Promise<Model[]> {
  try {
    const res = await fetch(`${API_URLS[source]}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) throw new Error(`${source} error: ${res.status}`);
    const data = await res.json();
    return data.data.map((m: any) => ({
      id: `${source}:${m.id}`,
      name: m.id,
      source,
      capabilities: detectCapabilities(m.id),
      contextWindow: m.context_window || 4096,
      isFree: FREE_MODELS[source]?.includes(m.id) ?? false,
    }));
  } catch {
    return [];
  }
}

export async function streamCloudChat(
  source: ModelSource,
  apiKey: string,
  modelId: string,
  messages: Message[],
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const res = await fetch(`${API_URLS[source]}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
    }),
    signal,
  });

  if (!res.ok) throw new Error(`${source} error: ${res.status}`);

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter((l) => l.trim() && l.startsWith('data: '));

    for (const line of lines) {
      const data = line.slice(6);
      if (data === '[DONE]') return fullText;
      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          fullText += content;
          onChunk(content);
        }
      } catch {
        // skip malformed lines
      }
    }
  }

  return fullText;
}

function detectCapabilities(name: string): Model['capabilities'] {
  const lower = name.toLowerCase();
  const caps: Model['capabilities'] = ['chat'];
  if (lower.includes('coder') || lower.includes('code')) caps.push('coding');
  if (lower.includes('vision') || lower.includes('dall')) caps.push('image');
  if (lower.includes('reason') || lower.includes('r1')) caps.push('reasoning');
  return caps;
}
