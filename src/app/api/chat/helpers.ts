import { generateBPASystemPrompt } from '@/lib/systemPrompt';
import type { ModelMessage } from 'ai';

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
export function prepareMessagesWithSystemPrompt(
  messages: ModelMessage[]
): ModelMessage[] {
  const systemPrompt = generateBPASystemPrompt();
  return [
    { role: 'system' as const, content: systemPrompt },
    ...messages,
  ];
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  message: string,
  status: number,
  details?: string
): Response {
  return new Response(
    JSON.stringify({
      error: message,
      ...(details && { details }),
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Encodes data as Server-Sent Events (SSE) format
 */
export function encodeSSEData(chunk: any): Uint8Array {
  const encoder = new TextEncoder();
  const data = `data: ${JSON.stringify(chunk)}\n`;
  return encoder.encode(data);
}

/**
 * Handles tool-call events
 */
export function handleToolCallEvent(
  chunk: any,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
): void {
  console.log('🔧 Tool called:', chunk.toolName, 'with ID:', chunk.toolCallId);
  const data = `data: ${JSON.stringify(chunk)}\n`;
  controller.enqueue(encoder.encode(data));
}

/**
 * Handles tool-result events
 */
export function handleToolResultEvent(
  chunk: any,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
): void {
  console.log('✅ Tool result event received for ID:', chunk.toolCallId);
  console.log('📦 Result content:', JSON.stringify(chunk.output, null, 2));

  const enhancedChunk = {
    type: 'tool-result',
    toolCallId: chunk.toolCallId,
    toolName: chunk.toolName,
    result: chunk.output || 'Tool executed successfully',
  };

  console.log('📤 Sending enhanced tool-result to client:', JSON.stringify(enhancedChunk, null, 2));

  const data = `data: ${JSON.stringify(enhancedChunk)}\n`;
  controller.enqueue(encoder.encode(data));
}

/**
 * Injects tool results into the stream
 */
export async function injectToolResults(
  controller: ReadableStreamDefaultController,
  globalToolResults: Map<string, any>,
  encoder: TextEncoder
): Promise<void> {
  // Wait a bit for onStepFinish to populate globalToolResults
  await new Promise(resolve => setTimeout(resolve, 100));

  for (const [toolCallId, result] of globalToolResults) {
    console.log('💉 Injecting tool result for:', toolCallId);
    const syntheticEvent = {
      type: 'tool-result',
      toolCallId: toolCallId,
      result: result,
    };
    const resultData = `data: ${JSON.stringify(syntheticEvent)}\n`;
    controller.enqueue(encoder.encode(resultData));
  }
}

/**
 * Handles finish-step events with tool calls
 */
export async function handleFinishStepEvent(
  chunk: any,
  controller: ReadableStreamDefaultController,
  globalToolResults: Map<string, any>,
  encoder: TextEncoder
): Promise<void> {
  console.log('🏁 Step finished with tool calls, checking for results...');

  // First send the finish-step event
  const data = `data: ${JSON.stringify(chunk)}\n`;
  controller.enqueue(encoder.encode(data));

  // Then inject tool results from globalToolResults
  await injectToolResults(controller, globalToolResults, encoder);

  // Clear after injecting
  globalToolResults.clear();
}

/**
 * Handles generic stream events
 */
export function handleGenericEvent(
  chunk: any,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
): void {
  const data = `data: ${JSON.stringify(chunk)}\n`;
  controller.enqueue(encoder.encode(data));
}

/**
 * Creates the onStepFinish callback for capturing tool results
 */
export function createOnStepFinishCallback(
  globalToolResults: Map<string, any>
) {
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
