import { generateBPASystemPrompt } from './systemPrompt';

/**
 * Validates the incoming chat request
 * @throws Error if validation fails
 */
export function validateChatRequest(messages: any): void {
  if (!messages || !Array.isArray(messages)) {
    throw new Error('Messages array is required');
  }
}

/**
 * Prepares messages by prepending system prompt
 */
export function prepareMessagesWithSystemPrompt(messages: any[]): any[] {
  const systemPrompt = generateBPASystemPrompt();
  return [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];
}

/**
 * Encodes data as Server-Sent Events (SSE) format
 */
export function encodeSSEData(chunk: any): string {
  return `data: ${JSON.stringify(chunk)}\n`;
}

/**
 * Handles tool-call events
 */
export function handleToolCallEvent(chunk: any): string {
  console.log('🔧 Tool called:', chunk.toolName, 'with ID:', chunk.toolCallId);
  return encodeSSEData(chunk);
}

/**
 * Handles tool-result events
 */
export function handleToolResultEvent(chunk: any): string {
  console.log('✅ Tool result event received for ID:', chunk.toolCallId);
  console.log('📦 Result content:', JSON.stringify(chunk.output, null, 2));

  const enhancedChunk = {
    type: 'tool-result',
    toolCallId: chunk.toolCallId,
    toolName: chunk.toolName,
    result: chunk.output || 'Tool executed successfully',
  };

  console.log('📤 Sending enhanced tool-result to client:', JSON.stringify(enhancedChunk, null, 2));
  return encodeSSEData(enhancedChunk);
}

/**
 * Handles generic stream events
 */
export function handleGenericEvent(chunk: any): string {
  return encodeSSEData(chunk);
}

/**
 * Creates the onStepFinish callback for capturing tool results
 */
export function createOnStepFinishCallback(globalToolResults: Map<string, any>) {
  return async (event: any) => {
    console.log('🎯 Step finished:', event.finishReason);
    if (event.toolCalls && event.toolResults) {
      for (let i = 0; i < event.toolCalls.length; i++) {
        const toolCall = event.toolCalls[i];
        const toolResult = event.toolResults[i];
        console.log('💾 Saving tool result:', {
          toolCallId: toolCall.toolCallId,
          toolName: toolCall.toolName,
          resultPreview: JSON.stringify(toolResult).substring(0, 200),
        });
        globalToolResults.set(toolCall.toolCallId, toolResult);
      }
    }
  };
}

/**
 * Injects tool results into the stream
 */
export async function injectToolResults(globalToolResults: Map<string, any>): Promise<string[]> {
  // Wait a bit for onStepFinish to populate globalToolResults
  await new Promise(resolve => setTimeout(resolve, 100));

  const results: string[] = [];
  for (const [toolCallId, result] of globalToolResults) {
    console.log('💉 Injecting tool result for:', toolCallId);
    const syntheticEvent = {
      type: 'tool-result',
      toolCallId: toolCallId,
      result: result,
    };
    results.push(encodeSSEData(syntheticEvent));
  }

  return results;
}

/**
 * Handles finish-step events with tool calls
 */
export async function handleFinishStepEvent(
  chunk: any,
  globalToolResults: Map<string, any>
): Promise<string[]> {
  console.log('🏁 Step finished with tool calls, checking for results...');

  const results: string[] = [];

  // First send the finish-step event
  results.push(encodeSSEData(chunk));

  // Then inject tool results from globalToolResults
  const injectedResults = await injectToolResults(globalToolResults);
  results.push(...injectedResults);

  // Clear after injecting
  globalToolResults.clear();

  return results;
}
