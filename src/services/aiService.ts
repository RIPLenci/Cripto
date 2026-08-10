import { apiRequest } from './api';

export const aiService = {
  async analyzeAudio(audioData: string, mimeType?: string, token?: string): Promise<{ analysis: string; provider?: string }> {
    return apiRequest<{ analysis: string; provider?: string }>('/api/ai/analyze-audio', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ audioData, mimeType }),
    });
  },

  async analyzeMultimodal(
    prompt: string,
    mediaItems?: Array<{ data: string; mimeType: string; filename?: string }>,
    systemPrompt?: string,
    token?: string
  ): Promise<{ analysis: string; provider?: string; combined?: boolean }> {
    return apiRequest<{ analysis: string; provider?: string; combined?: boolean }>('/api/ai/analyze-multimodal', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ prompt, mediaItems, systemPrompt }),
    });
  },
};
