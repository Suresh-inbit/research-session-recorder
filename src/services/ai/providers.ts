// ============================================================
// AI Providers (Stubs for future LLM integration)
// ============================================================

export interface AIServiceConfig {
  provider: 'gemini' | 'openai' | 'ollama' | 'none';
  apiKey?: string;
  endpoint?: string;
  modelName?: string;
}

export interface SummaryResult {
  summary: string;
  topics: string[];
  keyQuestions: string[];
}

export class AIService {
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = config;
  }

  /**
   * Summarize a paper abstract or page content.
   */
  public async summarize(text: string): Promise<SummaryResult> {
    if (this.config.provider === 'none') {
      return this.mockSummarize(text);
    }

    try {
      // In the future, this will connect to the real LLM endpoint
      console.log(`[RSR AI] Summarizing using provider: ${this.config.provider}`);
      return this.mockSummarize(text);
    } catch (e) {
      console.error('[RSR AI] Error in summary generation:', e);
      return this.mockSummarize(text);
    }
  }

  /**
   * Automatically suggest relations between research items to construct the knowledge graph.
   */
  public async suggestRelations(sourceText: string, targetText: string): Promise<{ relationType: string; confidence: number } | null> {
    if (this.config.provider === 'none') return null;
    
    // In the future, LLM will classify the relationship type (e.g. cites, extends, implements, contradicts)
    return {
      relationType: 'relates_to',
      confidence: 0.7,
    };
  }

  private mockSummarize(text: string): SummaryResult {
    const words = text.split(' ').slice(0, 30).join(' ') + '...';
    return {
      summary: `[Local Summary] Preview of the page content: "${words}"`,
      topics: ['research', 'extracted-topic'],
      keyQuestions: ['What are the core contributions of this work?', 'How does this compare to baseline models?'],
    };
  }
}

export const aiService = new AIService({ provider: 'none' });
