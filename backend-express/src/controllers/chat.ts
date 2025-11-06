import { Request, Response } from 'express';
import { openrouter } from '@openrouter/ai-sdk-provider';
import { stepCountIs, streamText } from 'ai';
import { config } from '../config';
import {
  elasticsearchTransactionTool,
  notionQueryComplaintsTool,
  notionGetSchemaTool,
  prometheusNodeTool,
} from '../tools';
import {
  validateChatRequest,
  prepareMessagesWithSystemPrompt,
  handleToolCallEvent,
  handleToolResultEvent,
  handleGenericEvent,
  handleFinishStepEvent,
  createOnStepFinishCallback,
} from '../utils/helpers';

/**
 * POST /api/chat
 * Handles streaming chat requests with AI tool execution
 */
export async function handleChatStream(req: Request, res: Response) {
  try {
    const { messages } = req.body;

    // Validate messages
    try {
      validateChatRequest(messages);
    } catch (error: any) {
      res.status(400).json({
        error: error.message,
      });
      return;
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
        // Prometheus tools
        prometheus_node_query: prometheusNodeTool,
      },
      // Capture tool results using callback
      onStepFinish: createOnStepFinishCallback(globalToolResults),
    });

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Get the full stream
    const stream = result.fullStream;

    // Process stream and send events
    try {
      for await (const chunk of stream) {
        // Log all events to server console for observation
        console.log('📦 Stream event:', JSON.stringify(chunk, null, 2));

        // Handle different event types
        if (chunk.type === 'tool-call') {
          const data = handleToolCallEvent(chunk);
          res.write(data);
          continue;
        }

        if (chunk.type === 'tool-result') {
          const data = handleToolResultEvent(chunk);
          res.write(data);
          continue;
        }

        if (chunk.type === 'finish-step' && chunk.finishReason === 'tool-calls') {
          const dataArray = await handleFinishStepEvent(chunk, globalToolResults);
          dataArray.forEach(data => res.write(data));
          continue;
        }

        // Handle generic events
        const data = handleGenericEvent(chunk);
        res.write(data);
      }

      // End the response
      res.end();
    } catch (error) {
      console.error('❌ Stream error:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Stream processing error' })}\n`);
      res.end();
    }
  } catch (error: any) {
    console.error('Error in chat API:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}
