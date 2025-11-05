"use client";

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface MessageContentProps {
  content: string;
  className?: string;
}

interface ChartData {
  type?: "line" | "bar" | "pie";
  data: any[];
  options?: {
    xKey?: string;
    dataKey?: string;
    nameKey?: string;
    lines?: Array<{ dataKey: string; name: string; color?: string }>;
    bars?: Array<{ dataKey: string; name: string; color?: string }>;
  };
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

// Memoized ChartRenderer component to prevent unnecessary re-renders
const ChartRenderer = React.memo(
  ({ chartData }: { chartData: ChartData }) => {
    const { type = "line", data, options } = chartData;

    return (
      <div className="my-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <ResponsiveContainer width="100%" height={300}>
          {type === "line" && (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={options?.xKey || "name"} />
              <YAxis />
              <Tooltip />
              <Legend />
              {options?.lines?.map((line, index) => (
                <Line
                  key={`${line.dataKey}-${line.name}`}
                  type="monotone"
                  dataKey={line.dataKey}
                  stroke={line.color || COLORS[index % COLORS.length]}
                  name={line.name}
                />
              ))}
            </LineChart>
          )}
          {type === "bar" && (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={options?.xKey || "name"} />
              <YAxis />
              <Tooltip />
              <Legend />
              {options?.bars?.map((bar, index) => (
                <Bar
                  key={`${bar.dataKey}-${bar.name}`}
                  dataKey={bar.dataKey}
                  fill={bar.color || COLORS[index % COLORS.length]}
                  name={bar.name}
                />
              ))}
            </BarChart>
          )}
          {type === "pie" && (
            <PieChart>
              <Pie
                data={data}
                dataKey={options?.dataKey || "value"}
                nameKey={options?.nameKey || "name"}
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Deep comparison for chart data to prevent unnecessary re-renders
    return JSON.stringify(prevProps.chartData) === JSON.stringify(nextProps.chartData);
  }
);

ChartRenderer.displayName = "ChartRenderer";

function MessageContent({ content, className = "" }: MessageContentProps) {
  // Memoize components object to prevent recreation on every render
  const components = useMemo(
    () => ({
      code({ node, inline, className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || "");
        const language = match ? match[1] : "";
        const codeString = String(children).replace(/\n$/, "");

        // Handle chart rendering
        if (language === "chart") {
          // Check if JSON is potentially incomplete (still streaming)
          const trimmed = codeString.trim();

          // Skip rendering if empty or clearly incomplete
          if (!trimmed || trimmed === "undefined") {
            return (
              <div className="my-3 p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded text-xs border border-amber-200 dark:border-amber-800 flex items-center gap-2">
                <span className="animate-pulse">📊</span>
                <span>Chart data streaming...</span>
              </div>
            );
          }

          // Check for basic JSON completeness (matching braces)
          const openBraces = (trimmed.match(/\{/g) || []).length;
          const closeBraces = (trimmed.match(/\}/g) || []).length;
          const isLikelyIncomplete = openBraces !== closeBraces;

          if (isLikelyIncomplete) {
            return (
              <div className="my-3 space-y-2">
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded text-xs border border-amber-200 dark:border-amber-800 flex items-center gap-2">
                  <span className="animate-pulse">📊</span>
                  <span>Chart data streaming...</span>
                </div>
                <div className="rounded-lg overflow-hidden">
                  <div className="bg-gray-700 px-3 py-1 text-xs text-gray-300">
                    Preview:
                  </div>
                  <SyntaxHighlighter
                    style={oneDark as any}
                    language="json"
                    PreTag="div"
                    className="text-xs!"
                  >
                    {codeString}
                  </SyntaxHighlighter>
                </div>
              </div>
            );
          }

          try {
            const chartData = JSON.parse(codeString) as ChartData;
            return <ChartRenderer chartData={chartData} />;
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error";
            console.error("Error rendering chart:", error);

            return (
              <div className="my-3 space-y-2">
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded text-xs border border-red-200 dark:border-red-800">
                  <div className="font-semibold mb-1">Error rendering chart</div>
                  <div className="mb-2">{errorMessage}</div>
                  <div className="text-xs opacity-80">
                    Common issues: Unterminated strings, missing quotes,
                    trailing commas, or unescaped characters.
                  </div>
                </div>
                <div className="rounded-lg overflow-hidden">
                  <div className="bg-gray-700 px-3 py-1 text-xs text-gray-300">
                    Invalid JSON:
                  </div>
                  <SyntaxHighlighter
                    style={oneDark as any}
                    language="json"
                    PreTag="div"
                    className="text-xs!"
                  >
                    {codeString}
                  </SyntaxHighlighter>
                </div>
              </div>
            );
          }
        }

        // Handle code blocks with syntax highlighting
        if (!inline && match) {
          return (
            <div className="my-3 rounded-lg overflow-hidden">
              <SyntaxHighlighter
                style={oneDark as any}
                language={language}
                PreTag="div"
                className="text-xs!"
              >
                {codeString}
              </SyntaxHighlighter>
            </div>
          );
        }

        // Inline code
        return (
          <code
            className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs font-mono"
            {...props}
          >
            {children}
          </code>
        );
      },
      p({ children }: any) {
        return (
          <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>
        );
      },
      ul({ children }: any) {
        return <ul className="list-disc list-inside mb-2 ml-2">{children}</ul>;
      },
      ol({ children }: any) {
        return (
          <ol className="list-decimal list-inside mb-2 ml-2">{children}</ol>
        );
      },
      li({ children }: any) {
        return <li className="text-sm mb-1">{children}</li>;
      },
      h1({ children }: any) {
        return <h1 className="text-xl font-bold mb-2 mt-4">{children}</h1>;
      },
      h2({ children }: any) {
        return <h2 className="text-lg font-bold mb-2 mt-3">{children}</h2>;
      },
      h3({ children }: any) {
        return <h3 className="text-base font-bold mb-2 mt-2">{children}</h3>;
      },
      blockquote({ children }: any) {
        return (
          <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-2">
            {children}
          </blockquote>
        );
      },
      a({ href, children }: any) {
        return (
          <a
            href={href}
            className="text-blue-600 dark:text-blue-400 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        );
      },
      table({ children }: any) {
        return (
          <div className="overflow-x-auto my-3">
            <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
              {children}
            </table>
          </div>
        );
      },
      thead({ children }: any) {
        return (
          <thead className="bg-gray-200 dark:bg-gray-700">{children}</thead>
        );
      },
      tbody({ children }: any) {
        return <tbody>{children}</tbody>;
      },
      tr({ children }: any) {
        return (
          <tr className="border-b border-gray-300 dark:border-gray-600">
            {children}
          </tr>
        );
      },
      th({ children }: any) {
        return (
          <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-semibold">
            {children}
          </th>
        );
      },
      td({ children }: any) {
        return (
          <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">
            {children}
          </td>
        );
      },
    }),
    [] // Empty dependency array since components don't depend on props
  );

  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

// Memoize the entire component to prevent re-renders when content hasn't changed
export default React.memo(MessageContent);
