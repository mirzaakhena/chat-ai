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
import { generateBPASystemPrompt } from '@/lib/systemPrompt';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for long-running queries

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Validate messages
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate system prompt with current time context
    const systemPrompt = generateBPASystemPrompt();

    // Prepend system message to messages
    const messagesWithSystem = [
      { role: 'system' as const, content: systemPrompt },
      ...messages,
    ];

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
      onStepFinish: async (event) => {
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
      },
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

            // Intercept tool-call events to track tool execution
            if (chunk.type === 'tool-call') {
              console.log('🔧 Tool called:', chunk.toolName, 'with ID:', chunk.toolCallId);

              // Send tool-call event to client
              const data = `data: ${JSON.stringify(chunk)}\n`;
              controller.enqueue(encoder.encode(data));
              continue;
            }

            // CRITICAL: Handle tool-result events
            if (chunk.type === 'tool-result') {
              console.log('✅ Tool result event received for ID:', chunk.toolCallId);
              console.log('📦 Result content:', JSON.stringify(chunk.output, null, 2));

              // Ensure we send a proper result to client
              const enhancedChunk = {
                type: 'tool-result',
                toolCallId: chunk.toolCallId,
                toolName: chunk.toolName,
                result: chunk.output || 'Tool executed successfully',
              };

              console.log('📤 Sending enhanced tool-result to client:', JSON.stringify(enhancedChunk, null, 2));

              const data = `data: ${JSON.stringify(enhancedChunk)}\n`;
              controller.enqueue(encoder.encode(data));
              continue;
            }

            // CRITICAL: Inject tool results after finish-step
            if (chunk.type === 'finish-step' && chunk.finishReason === 'tool-calls') {
              console.log('🏁 Step finished with tool calls, checking for results...');

              // First send the finish-step event
              const data = `data: ${JSON.stringify(chunk)}\n`;
              controller.enqueue(encoder.encode(data));

              // Then inject tool results from globalToolResults
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

              // Clear after injecting
              globalToolResults.clear();
              continue;
            }

            // Send event to client as SSE format: "data: {json}\n"
            const data = `data: ${JSON.stringify(chunk)}\n`;
            controller.enqueue(encoder.encode(data));
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
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
