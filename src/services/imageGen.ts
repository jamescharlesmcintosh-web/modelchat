import type { Model } from '../types';

export async function generateImage(
  model: Model,
  prompt: string,
  onProgress?: (status: string) => void
): Promise<string> {
  if (model.source === 'ollama') {
    return generateOllamaImage(model.name, prompt, onProgress);
  }
  throw new Error(`Image generation via ${model.source} is not yet supported`);
}

async function generateOllamaImage(
  modelName: string,
  prompt: string,
  onProgress?: (status: string) => void
): Promise<string> {
  onProgress?.('generating');

  const res = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modelName,
      prompt: prompt,
      stream: false,
    }),
  });

  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);

  const data = await res.json();
  onProgress?.('complete');
  return data.response;
}