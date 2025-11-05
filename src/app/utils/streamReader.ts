import {
  createInitialStreamState,
  handleStreamEvent,
  type MessageUpdater,
  type StreamState,
} from "./streamEventHandlers";

/**
 * Parses a single SSE (Server-Sent Events) line
 * Returns the parsed event object or null if invalid
 */
export function parseSSELine(line: string): any | null {
  if (!line.trim() || !line.startsWith("data: ")) {
    return null;
  }

  try {
    const jsonStr = line.slice(6); // Remove "data: " prefix
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error parsing event:", error, line);
    return null;
  }
}

/**
 * Processes SSE stream from chat API
 * Reads stream, parses events, and updates messages via callback
 */
export async function processSSEStream(
  response: Response,
  setMessages: MessageUpdater,
  abortController: AbortController
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No reader available");

  const decoder = new TextDecoder();
  let buffer = "";

  // Initialize stream state
  const state: StreamState = createInitialStreamState();

  while (true) {
    // Check if aborted
    if (abortController.signal.aborted) {
      reader.cancel();
      break;
    }

    const { done, value } = await reader.read();
    if (done) break;

    // Decode and buffer
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    // Process each line
    for (const line of lines) {
      const event = parseSSELine(line);
      if (!event) continue;

      // Handle the event
      handleStreamEvent(event, state, setMessages);
    }
  }
}

/**
 * Sends a chat message to the API and processes the streaming response
 */
export async function sendChatMessage(
  messages: any[],
  setMessages: MessageUpdater,
  abortController: AbortController
): Promise<void> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
    signal: abortController.signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  await processSSEStream(response, setMessages, abortController);
}
