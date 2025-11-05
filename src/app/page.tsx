"use client";

import { useState, useRef, useEffect } from "react";
import UserMessage from "@/components/UserMessage";
import AssistantMessage from "@/components/AssistantMessage";
import InputForm from "@/components/InputForm";
import ToolMessage from "@/components/ToolMessage";
import { useChatStream } from "./hooks/useChatStream";

export default function Home() {
  const { messages, isLoading, sendMessage, stopStreaming } = useChatStream();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStop = () => {
    stopStreaming();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    await sendMessage(userMessage);
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
