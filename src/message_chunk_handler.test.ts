import { describe, expect, test, jest, beforeEach, afterEach } from "@jest/globals";
import { ToolCall } from "./functions.js";
import { createHandleMessageChunk } from "./message_chunk_handler.js";

describe("createHandleMessageChunk", () => {
  let streamMessage: jest.Mock;
  let streamTool: jest.Mock;
  let handleMessageChunk: ReturnType<typeof createHandleMessageChunk>;

  beforeEach(() => {
    streamMessage = jest.fn();
    streamTool = jest.fn();
    handleMessageChunk = createHandleMessageChunk();
  });

  it("should handle a complete JSON message", () => {
    const chunk = Buffer.from('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n');
    const result = handleMessageChunk(chunk, streamMessage, streamTool);

    expect(result).toBe(false);
    expect(streamMessage).toHaveBeenCalledWith("Hello");
    expect(streamTool).not.toHaveBeenCalled();
  });

  it("should handle a tool call", () => {
    const chunk = Buffer.from('data: {"choices":[{"delta":{"tool_calls":[{"type":"function","function":{"name":"test"}}]}}]}\n\n');
    const result = handleMessageChunk(chunk, streamMessage, streamTool);

    expect(result).toBe(false);
    expect(streamMessage).not.toHaveBeenCalled();
    expect(streamTool).toHaveBeenCalledWith({ type: "function", function: { name: "test" } } as ToolCall);
  });

  it("should handle incomplete JSON", () => {
    const chunk1 = Buffer.from('data: {"choices":[{"delta":{"content":"He');
    const chunk2 = Buffer.from('llo"}}]}\n\n');

    handleMessageChunk(chunk1, streamMessage, streamTool);
    const result = handleMessageChunk(chunk2, streamMessage, streamTool);

    expect(result).toBe(false);
    expect(streamMessage).toHaveBeenCalledWith("Hello");
  });

  it("should return true when receiving [DONE]", () => {
    const chunk = Buffer.from("data: [DONE]\n");
    const result = handleMessageChunk(chunk, streamMessage, streamTool);

    expect(result).toBe(true);
  });

  it("should ignore empty lines", () => {
    const chunk = Buffer.from("\n\n\n");
    const result = handleMessageChunk(chunk, streamMessage, streamTool);

    expect(result).toBe(false);
    expect(streamMessage).not.toHaveBeenCalled();
    expect(streamTool).not.toHaveBeenCalled();
  });
});

// data: {"id":"chatcmpl-9qVjy5n4NjT9qX15VTpzkV2OU2jgM","object":"chat.completion.chunk","created":1722302094,"model":"gpt-4o-mini-2024-07-18","system_fingerprint":"fp_0f03d4f0ee","choices":[{"index":0,"delta":{"role":"assistant","content":""},"logprobs":null,"finish_reason":null}]}

// data: {"id":"chatcmpl-9qVjy5n4NjT9qX15VTpzkV2OU2jgM","object":"chat.completion.chunk","created":1722302094,"model":"gpt-4o-mini-2024-07-18","system_fingerprint":"fp_0f03d4f0ee","choices":[{"index":0,"delta":{"content":"Why"},"logprobs":null,"finish_reason":null}]}

// data: {"id":"chatcmpl-9qVjy5n4NjT9qX15VTpzkV2OU2jgM","object":"chat.completion.chunk","created":1722302094,"model":"gpt-4o-mini-2024-07-18","system_fingerprint":"fp_0f03d4f0ee","choices":[{"index":0,"delta":{"content":" did"},"logprobs":null,"finish_reason":null}]}

// data: {"id":"chatcmpl-9qVjy5n4NjT9qX15VTpzkV2OU2jgM","object":"chat.completion.chunk","created":1722302094,"model":"gpt-4o-mini-2024-07-18","system_fingerprint":"fp_0f03d4f0ee","choices":[{"index":0,"delta":{"content":" the"},"logprobs":null,"finish_reason":null}]}

// data: {"id":"chatcmpl-9qVjy5n4NjT9qX15VTpzkV2OU2jgM","object":"chat.completion.chunk","created":1722302094,"model":"gpt-4o-mini-2024-07-18","system_fingerprint":"fp_0f03d4f0ee","choices":[{"index":0,"delta":{"content":" scare"},"logprobs":null,"finish_reason":null}]}

// data: {"id":
// "chatcmpl-9qVjy5n4NjT9qX15VTpzkV2OU2jgM","object":"chat.completion.chunk","created":1722302094,"model":"gpt-4o-mini-2024-07-18","system_fingerprint":"fp_0f03d4f0ee","choices":[{"index":0,"delta":{"content":"crow"},"logprobs":null,"finish_reason":null}]}

// data: {"id":"chatcmpl-9qVjy5n4NjT9qX15VTpzkV2OU2jgM","object":"chat.completion.chunk","created":1722302094,"model":"gpt-4o-mini-2024-07-18","system_fingerprint":"fp_0f03d4f0ee","choices":[{"index":0,"delta":{"content":" win"},"logprobs":null,"finish_reason":null}]}

// data: {"id":"chatcmpl-9qVjy5n4NjT9qX15VTpzkV2OU2jgM","object":"chat.completion.chunk","created":1722302094,"model":"gpt-4o-mini-2024-07-18","system_fingerprint":"fp_0f03d4f0ee","choices":[{"index":0,"delta":{"content":" an"},"logprobs":null,"finish_reason":null}]}

// data: {"id":"chatcmpl-9qVjy5n4NjT9qX15VTpzkV2OU2jgM","object":"chat.completion.chunk","created":1722302094,"model":"gpt-4o-mini-2024-07-18","system_fingerprint":"fp_0f03d4f0ee","choices":[{"index":0,"delta":{"content":" award"},"logprobs":null,"finish_reason":null}]}

// data: {"id":"chatcmpl-9qVjy5n4NjT9qX15VTpzkV2OU2jgM","object":"chat.completion.chunk","created":1722302094,"model":"gpt-4o-mini-2024-07-18","system_fingerprint":"fp_0f03d4f0ee","choices":[{"index":0,"delta":{"content":"?"},"logprobs":null,"finish_reason":null}]}

// data: {"id":"chatcmpl-9qVjy5n4NjT9qX15VTpzkV2OU2
// jgM","object":"chat.completion.chunk","created":1722302094,"model":"gpt-4o-mini-2024-07-18","system_fingerprint":"fp_0f03d4f0ee","choices":[{"index":0,"delta":{"content":" Because"},"logprobs":null,"finish_reason":null}]}

// data: {"id":"chatcmpl-9qVjy5n4NjT9qX15VTpzkV2OU2jgM","object":"chat.completion.chunk","created":1722302094,"model":"gpt-4o-mini-2024-07-18","system_fingerprint":"fp_0f03d4f0ee","choices":[{"index":0,"delta":{"content":" he"},"logprobs":null,"finish_reason":null}]}

// data: {"id":"chatcmpl-9qVjy5n4NjT9qX15VTpzkV2OU2jgM","object":"chat.completion.chunk","created":1722302094,"model":"gpt-4o-mini-2024-07-18","system_fingerprint":"fp_0f03d4f0ee","choices":[{"index":0,"delta":{"content":" was"},"logprobs":null,"finish_reason":null}]}

// data: {"id":"chatcmpl-9qVjy5n4NjT9qX15VTpzkV2OU2jgM","object":"chat.completion.chunk","created":1722302094,"model":"gpt-4o-mini-2024-07-18","system_fingerprint":"fp_0f03d4f0ee","choices":[{"index":0,"delta":{"content":" outstanding"},"logprobs":null,"finish_reason":null}]}

// data: {"id":"chatcmpl-9qVjy5n4NjT9qX15VTpzkV2OU2jgM","object":"chat.completion.chunk","created":1722302094,"model":"gpt-4o-mini-2024-07-18","system_fingerprint":"fp_0f03d4f0ee","choices":[{"index":0,"delta":{"content":" in"},"logprobs":null,"finish_reason":null}]}

// data: {"id":"chatcmpl-9qVjy5n4NjT9qX15VTpzkV2OU2jgM","object":"chat.comp
// letion.chunk","created":1722302094,"model":"gpt-4o-mini-2024-07-18","system_fingerprint":"fp_0f03d4f0ee","choices":[{"index":0,"delta":{"content":" his"},"logprobs":null,"finish_reason":null}]}

// data: {"id":"chatcmpl-9qVjy5n4NjT9qX15VTpzkV2OU2jgM","object":"chat.completion.chunk","created":1722302094,"model":"gpt-4o-mini-2024-07-18","system_fingerprint":"fp_0f03d4f0ee","choices":[{"index":0,"delta":{"content":" field"},"logprobs":null,"finish_reason":null}]}

// data: {"id":"chatcmpl-9qVjy5n4NjT9qX15VTpzkV2OU2jgM","object":"chat.completion.chunk","created":1722302094,"model":"gpt-4o-mini-2024-07-18","system_fingerprint":"fp_0f03d4f0ee","choices":[{"index":0,"delta":{"content":"!"},"logprobs":null,"finish_reason":null}]}

// data: {"id":"chatcmpl-9qVjy5n4NjT9qX15VTpzkV2OU2jgM","object":"chat.completion.chunk","created":1722302094,"model":"gpt-4o-mini-2024-07-18","system_fingerprint":"fp_0f03d4f0ee","choices":[{"index":0,"delta":{},"logprobs":null,"finish_reason":"stop"}]}

// data: [DONE]
