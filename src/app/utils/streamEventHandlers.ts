import { parseToolResult, parseToolError } from "./toolResultParser";
import type { Message } from "./messageFormatter";

/**
 * Tool call state
 */
export interface ToolCallState {
  id: string;
  toolCallName: string;
  request: Record<string, any>;
  response: Record<string, any>;
  status: "working" | "completed" | "error";
}

/**
 * State interface for stream processing
 */
export interface StreamState {
  currentAssistantMessage: string;
  currentAssistantMessageId: string;
  activeToolCalls: Map<string, ToolCallState>; // Support multiple parallel tools
}

/**
 * Type for message update callback
 */
export type MessageUpdater = (updater: (prev: Message[]) => Message[]) => void;

/**
 * Creates initial stream state
 */
export function createInitialStreamState(): StreamState {
  return {
    currentAssistantMessage: "",
    currentAssistantMessageId: `assistant-${Date.now()}`,
    activeToolCalls: new Map(),
  };
}

/**
 * Handles text-delta events (streaming assistant response)
 */
export function handleTextDeltaEvent(
  event: any,
  state: StreamState,
  setMessages: MessageUpdater
): void {
  state.currentAssistantMessage += event.text;

  setMessages((prev) => {
    const filtered = prev.filter((m) => m.id !== state.currentAssistantMessageId);
    return [
      ...filtered,
      {
        type: "assistant",
        content: state.currentAssistantMessage,
        id: state.currentAssistantMessageId,
      },
    ];
  });
}

/**
 * Handles tool-input-start events (tool call initialization)
 */
export function handleToolInputStartEvent(
  event: any,
  state: StreamState
): void {
  const toolCallId = event.id || event.toolCallId;
  state.activeToolCalls.set(toolCallId, {
    id: `tool-${Date.now()}-${toolCallId}`,
    toolCallName: event.toolName || "",
    request: {},
    response: {},
    status: "working",
  });
}

/**
 * Handles tool-call events (tool execution with parameters)
 */
export function handleToolCallEvent(
  event: any,
  state: StreamState,
  setMessages: MessageUpdater
): void {
  const toolCallId = event.id || event.toolCallId;
  const toolCall = state.activeToolCalls.get(toolCallId);

  if (!toolCall) {
    console.warn("⚠️ tool-call event for unknown tool:", toolCallId);
    return;
  }

  toolCall.toolCallName = event.toolName;
  toolCall.request = event.input || {};

  // Save reference for callback
  const activeToolCall = { ...toolCall };

  // Add or update tool message
  setMessages((prev) => {
    const filtered = prev.filter((m) => m.id !== activeToolCall.id);
    return [
      ...filtered,
      {
        type: "tool",
        id: activeToolCall.id,
        toolCallName: activeToolCall.toolCallName,
        request: activeToolCall.request,
        response: activeToolCall.response,
        status: activeToolCall.status,
      },
    ];
  });
}

/**
 * Handles tool-result events (tool execution completed)
 */
export function handleToolResultEvent(
  event: any,
  state: StreamState,
  setMessages: MessageUpdater
): void {
  const toolCallId = event.toolCallId;
  const toolCall = state.activeToolCalls.get(toolCallId);

  if (!toolCall) {
    console.warn("⚠️ tool-result event for unknown tool:", toolCallId);
    return;
  }

  // Parse the result using utility function
  const resultData = parseToolResult(event.result);

  toolCall.response = resultData;
  toolCall.status = "completed";

  // Save reference before removing from map
  const completedToolCall = { ...toolCall };

  setMessages((prev) => {
    const filtered = prev.filter((m) => m.id !== completedToolCall.id);
    return [
      ...filtered,
      {
        type: "tool",
        id: completedToolCall.id,
        toolCallName: completedToolCall.toolCallName,
        request: completedToolCall.request,
        response: completedToolCall.response,
        status: completedToolCall.status,
      },
    ];
  });

  // Remove from active tools
  state.activeToolCalls.delete(toolCallId);
}

/**
 * Handles tool-error events (tool execution failed)
 */
export function handleToolErrorEvent(
  event: any,
  state: StreamState,
  setMessages: MessageUpdater
): void {
  const toolCallId = event.toolCallId;
  const toolCall = state.activeToolCalls.get(toolCallId);

  if (!toolCall) {
    console.warn("⚠️ tool-error event for unknown tool:", toolCallId);
    return;
  }

  // Parse the error using utility function
  const errorData = parseToolError(event.error, event.toolCallId);

  toolCall.response = errorData;
  toolCall.status = "error";

  // Save reference before removing from map
  const failedToolCall = { ...toolCall };

  setMessages((prev) => {
    const filtered = prev.filter((m) => m.id !== failedToolCall.id);
    return [
      ...filtered,
      {
        type: "tool",
        id: failedToolCall.id,
        toolCallName: failedToolCall.toolCallName,
        request: failedToolCall.request,
        response: failedToolCall.response,
        status: failedToolCall.status,
      },
    ];
  });

  // Remove from active tools
  state.activeToolCalls.delete(toolCallId);
}

/**
 * Handles finish-step events (step completed, reset for next step)
 */
export function handleFinishStepEvent(
  event: any,
  state: StreamState
): void {
  if (state.currentAssistantMessage) {
    state.currentAssistantMessage = "";
    state.currentAssistantMessageId = `assistant-${Date.now()}`;
  }
}

/**
 * Main event router - dispatches events to appropriate handlers
 */
export function handleStreamEvent(
  event: any,
  state: StreamState,
  setMessages: MessageUpdater
): void {
  // Debug logging for tool events
  if (
    event.type === "tool-result" ||
    event.type === "tool-call" ||
    event.type === "tool-error"
  ) {
    console.log("📥 Tool event:", event.type, {
      toolName: event.toolName,
      toolCallId: event.toolCallId,
      hasResult: "result" in event,
      resultPreview: event.result
        ? JSON.stringify(event.result).substring(0, 100)
        : "N/A",
    });
  }

  // Route to appropriate handler
  switch (event.type) {
    case "text-delta":
      handleTextDeltaEvent(event, state, setMessages);
      break;

    case "tool-input-start":
      handleToolInputStartEvent(event, state);
      break;

    case "tool-input-delta":
      // Skip - user doesn't want thinking message populated
      break;

    case "tool-call":
      handleToolCallEvent(event, state, setMessages);
      break;

    case "tool-result":
      handleToolResultEvent(event, state, setMessages);
      break;

    case "tool-error":
      handleToolErrorEvent(event, state, setMessages);
      break;

    case "finish-step":
      handleFinishStepEvent(event, state);
      break;

    case "finish":
      // Conversation finished - no action needed
      break;

    default:
      // Ignore other event types
      break;
  }
}
