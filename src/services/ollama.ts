import type { Model, Message } from '../types';

const DEFAULT_BASE_URL = 'http://localhost:11434';

export async function fetchOllamaModels(
  baseUrl: string = DEFAULT_BASE_URL
): Promise<Model[]> {
  try {
    const res = await fetch(`${baseUrl}/api/tags`);
    if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
    const data = await res.json();
    return data.models.map((m: any) => ({
      id: `ollama:${m.name}`,
      name: m.name,
      source: 'ollama' as const,
      capabilities: detectCapabilities(m.name),
      contextWindow: m.context_window || 4096,
      isFree: true,
      description: m.description,
    }));
  } catch {
    return [];
  }
}

export async function streamOllamaChat(
  baseUrl: string,
  modelName: string,
  messages: Message[],
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modelName,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
    }),
    signal,
  });

  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter((l) => l.trim());

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.message?.content) {
          fullText += parsed.message.content;
          onChunk(parsed.message.content);
        }
      } catch {
        // skip malformed lines
      }
    }
  }

  return fullText;
}

export async function generateOllamaImage(
  baseUrl: string,
  model: string,
  prompt: string
): Promise<string> {
  const res = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false }),
  });

  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const data = await res.json();
  return data.response;
}

function detectCapabilities(name: string): Model['capabilities'] {
  const lower = name.toLowerCase();
  const caps: Model['capabilities'] = ['chat'];
  if (lower.includes('coder') || lower.includes('code')) caps.push('coding');
  if (lower.includes('vision') || lower.includes('llava')) caps.push('image');
  if (lower.includes('reason') || lower.includes('r1')) caps.push('reasoning');
  return caps;
}
