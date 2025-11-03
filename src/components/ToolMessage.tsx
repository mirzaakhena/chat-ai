"use client";

import { useState } from "react";
import JsonView from "@uiw/react-json-view";
import { darkTheme } from "@uiw/react-json-view/dark";
import { lightTheme } from "@uiw/react-json-view/light";

interface ToolMessageProps {
  thinkingMessage?: string;
  toolCallName: string;
  request: Record<string, any>;
  response: Record<string, any>;
}

export default function ToolMessage({
  thinkingMessage,
  toolCallName,
  request,
  response,
}: ToolMessageProps) {
  const [isToolExpanded, setIsToolExpanded] = useState(false);
  const [isRequestExpanded, setIsRequestExpanded] = useState(false);
  const [isResponseExpanded, setIsResponseExpanded] = useState(false);

  return (
    <div className="flex justify-start mb-4">
      <div className="flex gap-3 max-w-[85%]">
        <div className="shrink-0 w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
          🔧
        </div>
        <div className="flex-1">
          {/* Tool Call Card */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg overflow-hidden">
            {/* Thinking Message + Tool Call Name */}
            <button
              onClick={() => setIsToolExpanded(!isToolExpanded)}
              className="w-full px-4 py-3 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
            >
              {thinkingMessage && (
                <div className="mb-2 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-purple-600 dark:text-purple-400 text-xs font-semibold">
                      💭 THINKING
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-purple-900 dark:text-purple-100 italic">
                    {thinkingMessage}
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-amber-700 dark:text-amber-400 font-mono text-sm font-semibold">
                    {toolCallName}
                  </span>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`w-5 h-5 text-amber-600 dark:text-amber-400 transition-transform ${
                    isToolExpanded ? "rotate-180" : ""
                  }`}
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </button>

            {/* Expanded Content */}
            {isToolExpanded && (
              <div className="border-t border-amber-200 dark:border-amber-800">
                {/* Request Section */}
                <div className="border-b border-amber-200 dark:border-amber-800">
                  <button
                    onClick={() => setIsRequestExpanded(!isRequestExpanded)}
                    className="w-full px-4 py-2 flex items-center justify-between hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                  >
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                      📤 REQUEST
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className={`w-4 h-4 text-amber-600 dark:text-amber-400 transition-transform ${
                        isRequestExpanded ? "rotate-180" : ""
                      }`}
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  {isRequestExpanded && (
                    <div className="px-4 pb-3">
                      <div className="bg-white dark:bg-gray-950 rounded p-2 overflow-x-auto border border-amber-200 dark:border-amber-900">
                        <JsonView
                          value={request}
                          collapsed={1}
                          displayDataTypes={false}
                          style={{
                            ...darkTheme,
                            fontSize: "12px",
                            fontFamily: "monospace",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Response Section */}
                <div>
                  <button
                    onClick={() => setIsResponseExpanded(!isResponseExpanded)}
                    className="w-full px-4 py-2 flex items-center justify-between hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                  >
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                      📥 RESPONSE
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className={`w-4 h-4 text-amber-600 dark:text-amber-400 transition-transform ${
                        isResponseExpanded ? "rotate-180" : ""
                      }`}
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  {isResponseExpanded && (
                    <div className="px-4 pb-3">
                      <div className="bg-white dark:bg-gray-950 rounded p-2 overflow-x-auto border border-amber-200 dark:border-amber-900">
                        <JsonView
                          value={response}
                          collapsed={1}
                          displayDataTypes={false}
                          style={{
                            ...darkTheme,
                            fontSize: "12px",
                            fontFamily: "monospace",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
