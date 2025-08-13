import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAICompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  messages: ChatMessage[];
  responseFormat?: 'json' | 'text';
}

export interface OpenAIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Generic function to call OpenAI's chat completion API
 */
export async function generateCompletion(options: OpenAICompletionOptions): Promise<OpenAIResponse> {
  const {
    model = 'gpt-4o-mini', // Use GPT-4o mini for cost efficiency
    temperature = 0.7,
    maxTokens = 1000,
    messages,
    responseFormat = 'text'
  } = options;

  try {
    const completionOptions: any = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    // Add response format for JSON responses
    if (responseFormat === 'json') {
      completionOptions.response_format = { type: 'json_object' };
    }

    const completion = await openai.chat.completions.create(completionOptions);

    const choice = completion.choices[0];
    if (!choice?.message?.content) {
      throw new Error('No response content from OpenAI');
    }

    return {
      content: choice.message.content,
      usage: completion.usage ? {
        promptTokens: completion.usage.prompt_tokens,
        completionTokens: completion.usage.completion_tokens,
        totalTokens: completion.usage.total_tokens,
      } : undefined,
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error(`OpenAI API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate text using a simple prompt
 */
export async function generateText(
  prompt: string, 
  systemPrompt?: string,
  options?: Partial<OpenAICompletionOptions>
): Promise<string> {
  const messages: ChatMessage[] = [];
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  
  messages.push({ role: 'user', content: prompt });

  const response = await generateCompletion({
    ...options,
    messages,
  });

  return response.content;
}

/**
 * Generate text with conversation context
 */
export async function generateWithContext(
  userMessage: string,
  context: ChatMessage[],
  options?: Partial<OpenAICompletionOptions>
): Promise<string> {
  const messages = [
    ...context,
    { role: 'user' as const, content: userMessage }
  ];

  const response = await generateCompletion({
    ...options,
    messages,
  });

  return response.content;
}

/**
 * Summarize long text content
 */
export async function summarizeText(
  content: string,
  summaryLength: 'brief' | 'detailed' = 'brief',
  options?: Partial<OpenAICompletionOptions>
): Promise<string> {
  const lengthInstruction = summaryLength === 'brief' 
    ? 'Provide a concise summary in 2-3 sentences.'
    : 'Provide a comprehensive summary with key points and important details.';

  const systemPrompt = `You are an expert at summarizing text content. ${lengthInstruction} Focus on the most important information and maintain a professional tone.`;

  return generateText(
    `Please summarize the following content:\n\n${content}`,
    systemPrompt,
    {
      temperature: 0.3, // Lower temperature for more consistent summaries
      ...options,
    }
  );
}