// Message types
export type Message =
  | { type: "user"; content: string; id: string }
  | { type: "assistant"; content: string; id: string }
  | {
      type: "tool";
      id: string;
      toolCallName: string;
      request: Record<string, any>;
      response: Record<string, any>;
      status: "working" | "completed" | "error";
    };

export type APIMessage = {
  role: "user" | "assistant";
  content: string;
};

/**
 * Formats messages for API request (converts UI messages to API format)
 */
export function formatMessagesForAPI(
  messages: Message[],
  newUserMessage: string
): APIMessage[] {
  const apiMessages = messages
    .filter((m) => m.type === "user" || m.type === "assistant")
    .map((m) => ({
      role: m.type === "user" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    }));

  // Add the new user message
  apiMessages.push({ role: "user", content: newUserMessage });

  return apiMessages;
}

/**
 * Creates a user message object
 */
export function createUserMessage(content: string): Message {
  return {
    type: "user",
    content,
    id: `user-${Date.now()}`,
  };
}

/**
 * Creates an assistant message object
 */
export function createAssistantMessage(content: string, id?: string): Message {
  return {
    type: "assistant",
    content,
    id: id || `assistant-${Date.now()}`,
  };
}

/**
 * Creates a tool message object
 */
export function createToolMessage(
  id: string,
  toolCallName: string,
  request: Record<string, any> = {},
  response: Record<string, any> = {},
  status: "working" | "completed" | "error" = "working"
): Message {
  return {
    type: "tool",
    id,
    toolCallName,
    request,
    response,
    status,
  };
}

/**
 * Creates an error message object
 */
export function createErrorMessage(error: Error | unknown): Message {
  const message = error instanceof Error ? error.message : "Unknown error";
  return createAssistantMessage(`Error: ${message}`, `error-${Date.now()}`);
}

/**
 * Creates an abort message object
 */
export function createAbortMessage(): Message {
  return createAssistantMessage(
    "⚠️ Request stopped by user.",
    `abort-${Date.now()}`
  );
}
