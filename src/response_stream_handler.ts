import { Message, ToolCall } from "./functions.js";
import { createHandleMessageChunk } from "./message_chunk_handler.js";
import { handleAPICall } from "./openai_api_call.js";
import { parseToolCalls } from "./tool_call_parser.js";

export const handleStreamResponse = async (messages: Message[], printMessage: (message: string) => void): Promise<[string, ToolCall[]]> => {
  try {
    const response = await handleAPICall(messages);
    const { collectedMessages, toolCalls } = await processStream(response.data, printMessage);
    return [collectedMessages.join(""), parseToolCalls(toolCalls)];
  } catch (error) {
    console.error("Error in handleStreamResponse:", error);
    throw new Error("Failed to handle stream response");
  }
};

const processStream = (stream: NodeJS.ReadableStream, printMessage: (message: string) => void): Promise<{ collectedMessages: string[]; toolCalls: ToolCall[] }> => {
  return new Promise((resolve, reject) => {
    const collectedMessages: string[] = [];
    const toolCalls: ToolCall[] = [];
    const handleMessageChunk = createHandleMessageChunk();

    stream.on("data", (chunk: Buffer) => {
      const done = handleMessageChunk(
        chunk,
        (message) => {
          collectedMessages.push(message);
          printMessage(message);
        },
        (tool) => toolCalls.push(tool)
      );

      if (done) {
        resolve({ collectedMessages, toolCalls });
      }
    });

    stream.on("error", (error) => {
      reject(new Error(`Stream processing error: ${error.message}`));
    });
  });
};
