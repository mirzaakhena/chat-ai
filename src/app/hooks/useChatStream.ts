import { useState, useRef } from "react";
import type { Message } from "../utils/messageFormatter";
import {
  formatMessagesForAPI,
  createUserMessage,
  createErrorMessage,
  createAbortMessage,
} from "../utils/messageFormatter";
import { sendChatMessage } from "../utils/streamReader";

/**
 * Custom hook for managing chat streaming functionality
 * Encapsulates all chat logic including message management, API calls, and error handling
 */
export function useChatStream() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Stops the current streaming request
   */
  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  /**
   * Sends a message and processes the streaming response
   */
  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;

    setIsLoading(true);

    // Add user message to chat
    const newUserMessage = createUserMessage(userMessage);
    setMessages((prev) => [...prev, newUserMessage]);

    // Create abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Format messages for API
      const apiMessages = formatMessagesForAPI(messages, userMessage);

      // Send message and process stream
      await sendChatMessage(apiMessages, setMessages, abortController);
    } catch (error) {
      // Handle abort vs error
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request aborted by user");
        setMessages((prev) => [...prev, createAbortMessage()]);
      } else {
        console.error("Error:", error);
        setMessages((prev) => [...prev, createErrorMessage(error)]);
      }
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    sendMessage,
    stopStreaming,
  };
}
