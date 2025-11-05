import { openrouter } from '@openrouter/ai-sdk-provider';
import { stepCountIs, streamText } from 'ai';
import { config } from '@/lib/config';
import {
  elasticsearchTransactionTool,
} from '@/lib/tools/elasticsearch';
import {
  notionQueryComplaintsTool,
  notionGetSchemaTool,
} from '@/lib/tools/notion';
import {
  validateChatRequest,
  prepareMessagesWithSystemPrompt,
  createErrorResponse,
  handleToolCallEvent,
  handleToolResultEvent,
  handleFinishStepEvent,
  handleGenericEvent,
  createOnStepFinishCallback,
} from './helpers';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for long-running queries

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Validate messages
    try {
      validateChatRequest(messages);
    } catch (error: any) {
      return createErrorResponse(error.message, 400);
    }

    // Prepend system message to messages
    const messagesWithSystem = prepareMessagesWithSystemPrompt(messages);

    // Track tool results globally to inject into stream
    const globalToolResults = new Map<string, any>();

    // Create streaming response with tools and multi-step support
    const result = streamText({
      model: openrouter(config.openrouter.model),
      messages: messagesWithSystem,
      temperature: 0.7,
      stopWhen: stepCountIs(20), // Multi-step: up to 20 steps
      tools: {
        // Notion tools
        notion_query_complaints: notionQueryComplaintsTool,
        notion_get_schema: notionGetSchemaTool,
        // Elasticsearch tools
        elasticsearch_transaction_query: elasticsearchTransactionTool,
      },
      // Capture tool results using callback
      onStepFinish: createOnStepFinishCallback(globalToolResults),
    });

    // For now, use fullStream to get all events including tool calls
    // This will help us understand the response structure
    const stream = result.fullStream;

    // Create a readable stream that encodes events as SSE (Server-Sent Events)
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            // Log all events to server console for observation
            console.log('📦 Stream event:', JSON.stringify(chunk, null, 2));

            // Handle different event types
            if (chunk.type === 'tool-call') {
              handleToolCallEvent(chunk, controller, encoder);
              continue;
            }

            if (chunk.type === 'tool-result') {
              handleToolResultEvent(chunk, controller, encoder);
              continue;
            }

            if (chunk.type === 'finish-step' && chunk.finishReason === 'tool-calls') {
              await handleFinishStepEvent(chunk, controller, globalToolResults, encoder);
              continue;
            }

            // Handle generic events
            handleGenericEvent(chunk, controller, encoder);
          }
          controller.close();
        } catch (error) {
          console.error('❌ Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Error in chat API:', error);
    return createErrorResponse('Internal server error', 500, error.message);
  }
}
