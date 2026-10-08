import type { Message, Model, AppSettings } from '../types';

export async function streamMultiModelChat(
  models: Model[],
  messages: Message[],
  settings: AppSettings,
  onChunk: (modelId: string, text: string) => void,
  signal?: AbortSignal
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  const promises = models.map(async (model) => {
    let fullContent = '';
    const localOnChunk = (text: string) => {
      fullContent += text;
      onChunk(model.id, text);
    };

    if (model.source === 'ollama') {
      const { streamOllamaChat } = await import('../services/ollama');
      await streamOllamaChat(settings.ollama.baseUrl, model.name, messages, localOnChunk, signal);
    } else {
      const { streamCloudChat } = await import('../services/cloud');
      const cloud = settings.clouds.find((c) => c.provider === model.source);
      await streamCloudChat(model.source, cloud?.apiKey ?? '', model.name, messages, localOnChunk, signal);
    }

    results[model.id] = fullContent;
  });

  await Promise.allSettled(promises);
  return results;
}