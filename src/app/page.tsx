"use client";

import { useState, useRef, useEffect } from "react";
import UserMessage from "@/components/UserMessage";
import AssistantMessage from "@/components/AssistantMessage";
import InputForm from "@/components/InputForm";
import ToolMessage from "@/components/ToolMessage";

// Message types
type Message =
  | { type: "user"; content: string; id: string }
  | { type: "assistant"; content: string; id: string }
  | {
      type: "tool";
      id: string;
      thinkingMessage: string;
      toolCallName: string;
      request: Record<string, any>;
      response: Record<string, any>;
      status: "working" | "completed" | "error";
    };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    // Add user message
    const userMessageId = `user-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { type: "user", content: userMessage, id: userMessageId },
    ]);

    // Create abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Build message history for API (convert our message format to API format)
      const apiMessages = messages
        .filter((m) => m.type === "user" || m.type === "assistant")
        .map((m) => ({
          role: m.type === "user" ? "user" : "assistant",
          content: m.content,
        }));

      // Add the new user message
      apiMessages.push({ role: "user", content: userMessage });

      // Send request to API with full conversation history
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let buffer = "";

      // Track current assistant message and tool calls
      let currentAssistantMessage = "";
      let currentAssistantMessageId = `assistant-${Date.now()}`;

      // Track current tool call
      let currentToolCall: {
        id: string;
        thinkingMessage: string;
        toolCallName: string;
        request: Record<string, any>;
        response: Record<string, any>;
        status: "working" | "completed" | "error";
      } | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim() || !line.startsWith("data: ")) continue;

          try {
            const jsonStr = line.slice(6); // Remove "data: " prefix
            const event = JSON.parse(jsonStr);

            // Debug logging
            console.log("📥 Received event:", event.type, event);

            // Handle different event types
            switch (event.type) {
              case "text-delta":
                currentAssistantMessage += event.text;
                setMessages((prev) => {
                  const filtered = prev.filter((m) => m.id !== currentAssistantMessageId);
                  return [
                    ...filtered,
                    {
                      type: "assistant",
                      content: currentAssistantMessage,
                      id: currentAssistantMessageId,
                    },
                  ];
                });
                break;

              case "tool-input-start":
                // Start a new tool call
                currentToolCall = {
                  id: `tool-${Date.now()}-${event.id}`,
                  thinkingMessage: "", // Keep empty as user requested
                  toolCallName: event.toolName,
                  request: {},
                  response: {},
                  status: "working",
                };
                break;

              case "tool-input-delta":
                // Skip - user doesn't want thinking message populated
                break;

              case "tool-call":
                // Tool call with full parameters
                if (currentToolCall) {
                  currentToolCall.toolCallName = event.toolName;
                  currentToolCall.request = event.input || {};

                  // Save reference for callback
                  const activeToolCall = { ...currentToolCall };
                  // Add or update tool message
                  setMessages((prev) => {
                    const filtered = prev.filter((m) => m.id !== activeToolCall.id);
                    return [
                      ...filtered,
                      {
                        type: "tool",
                        id: activeToolCall.id,
                        thinkingMessage: activeToolCall.thinkingMessage,
                        toolCallName: activeToolCall.toolCallName,
                        request: activeToolCall.request,
                        response: activeToolCall.response,
                        status: activeToolCall.status,
                      },
                    ];
                  });
                }
                break;

              case "tool-result":
                // Tool execution completed
                if (currentToolCall) {
                  try {
                    currentToolCall.response = JSON.parse(event.result);
                  } catch {
                    currentToolCall.response = { result: event.result };
                  }
                  currentToolCall.status = "completed";

                  // Save reference before setting to null
                  const completedToolCall = { ...currentToolCall };
                  setMessages((prev) => {
                    const filtered = prev.filter((m) => m.id !== completedToolCall.id);
                    return [
                      ...filtered,
                      {
                        type: "tool",
                        id: completedToolCall.id,
                        thinkingMessage: completedToolCall.thinkingMessage,
                        toolCallName: completedToolCall.toolCallName,
                        request: completedToolCall.request,
                        response: completedToolCall.response,
                        status: completedToolCall.status,
                      },
                    ];
                  });
                  currentToolCall = null;
                }
                break;

              case "tool-error":
                // Tool execution failed
                if (currentToolCall) {
                  currentToolCall.response = event.error || { error: "Unknown error" };
                  currentToolCall.status = "error";

                  // Save reference before setting to null
                  const failedToolCall = { ...currentToolCall };
                  setMessages((prev) => {
                    const filtered = prev.filter((m) => m.id !== failedToolCall.id);
                    return [
                      ...filtered,
                      {
                        type: "tool",
                        id: failedToolCall.id,
                        thinkingMessage: failedToolCall.thinkingMessage,
                        toolCallName: failedToolCall.toolCallName,
                        request: failedToolCall.request,
                        response: failedToolCall.response,
                        status: failedToolCall.status,
                      },
                    ];
                  });
                  currentToolCall = null;
                }
                break;

              case "finish-step":
                // Step completed, reset assistant message for next step
                if (currentAssistantMessage) {
                  currentAssistantMessage = "";
                  currentAssistantMessageId = `assistant-${Date.now()}`;
                }
                break;

              case "finish":
                // Conversation finished
                break;

              default:
                // Ignore other event types
                break;
            }
          } catch (error) {
            console.error("Error parsing event:", error, line);
          }
        }
      }
    } catch (error) {
      // Check if it was aborted
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request aborted by user");
        setMessages((prev) => [
          ...prev,
          {
            type: "assistant",
            content: "⚠️ Request stopped by user.",
            id: `abort-${Date.now()}`,
          },
        ]);
      } else {
        console.error("Error:", error);
        setMessages((prev) => [
          ...prev,
          {
            type: "assistant",
            content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
            id: `error-${Date.now()}`,
          },
        ]);
      }
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            BPA Operational Analysis Chat
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            AI-powered complaint analysis with Notion & Elasticsearch integration
          </p>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {messages.length === 0 && (
            <AssistantMessage message={`# Welcome to BPA Operational Analysis! 👋

I'm your AI assistant for investigating BPA (Blockchain-based Port Automation) operational issues.

## What I can do:
- Query **Notion** complaints database
- Analyze **Elasticsearch** transaction logs
- Correlate complaints with technical errors
- Provide detailed investigation reports

### Example queries:
- "Pilih satu data komplain yang bertipe technical 3 hari yang lalu"
- "Cek komplain CALL-21566"
- "Analisa transaksi untuk kendaraan 부산99사9474"

Ask me anything about BPA operations!`} />
          )}

          {messages.map((message) => {
            if (message.type === "user") {
              return <UserMessage key={message.id} message={message.content} />;
            } else if (message.type === "assistant") {
              return <AssistantMessage key={message.id} message={message.content} />;
            } else if (message.type === "tool") {
              return (
                <ToolMessage
                  key={message.id}
                  thinkingMessage={message.thinkingMessage}
                  toolCallName={message.toolCallName}
                  request={message.request}
                  response={message.response}
                  status={message.status}
                />
              );
            }
            return null;
          })}

          {isLoading && messages[messages.length - 1]?.type !== "assistant" && (
            <div className="flex justify-start mb-4">
              <div className="flex gap-3 max-w-[70%]">
                <div className="shrink-0 w-8 h-8 bg-linear-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  AI
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-md">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <div className="animate-pulse">Thinking...</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Form */}
      <InputForm
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        handleStop={handleStop}
        isLoading={isLoading}
      />
    </div>
  );
}
