import { openrouter } from '@openrouter/ai-sdk-provider';
import { stepCountIs, streamText, pipeDataStreamToResponse } from 'ai';
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
    });

    // For now, use fullStream to get all events including tool calls
    // This will help us understand the response structure
    const stream = result.fullStream;

    // Create a readable stream that encodes events as JSON
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            // Log all events to server console for observation
            console.log('📦 Stream event:', JSON.stringify(chunk, null, 2));

            // Send event to client as JSON lines
            const data = JSON.stringify(chunk) + '\n';
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
        'Content-Type': 'application/x-ndjson',
        'Transfer-Encoding': 'chunked',
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
