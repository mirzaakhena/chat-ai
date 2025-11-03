"use client";

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

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function MessageContent({
  content,
  className = "",
}: MessageContentProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";
            const codeString = String(children).replace(/\n$/, "");

            // Handle chart rendering
            if (language === "chart") {
              try {
                const chartData = JSON.parse(codeString);
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
                          {options?.lines?.map((line: any, index: number) => (
                            <Line
                              key={index}
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
                          {options?.bars?.map((bar: any, index: number) => (
                            <Bar
                              key={index}
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
                            {data.map((entry: any, index: number) => (
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
              } catch (error) {
                console.error("Error rendering chart:", error);
                return (
                  <div className="my-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded text-xs">
                    Error rendering chart. Please check the data format.
                  </div>
                );
              }
            }

            // Handle code blocks with syntax highlighting
            if (!inline && match) {
              return (
                <div className="my-3 rounded-lg overflow-hidden">
                  <SyntaxHighlighter
                    style={oneDark}
                    language={language}
                    PreTag="div"
                    className="!text-xs"
                    {...props}
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
          p({ children }) {
            return (
              <p className="text-sm leading-relaxed mb-2 last:mb-0">
                {children}
              </p>
            );
          },
          ul({ children }) {
            return <ul className="list-disc list-inside mb-2 ml-2">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal list-inside mb-2 ml-2">{children}</ol>;
          },
          li({ children }) {
            return <li className="text-sm mb-1">{children}</li>;
          },
          h1({ children }) {
            return <h1 className="text-xl font-bold mb-2 mt-4">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-lg font-bold mb-2 mt-3">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-base font-bold mb-2 mt-2">{children}</h3>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-2">
                {children}
              </blockquote>
            );
          },
          a({ href, children }) {
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
          table({ children }) {
            return (
              <div className="overflow-x-auto my-3">
                <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return (
              <thead className="bg-gray-200 dark:bg-gray-700">
                {children}
              </thead>
            );
          },
          tbody({ children }) {
            return <tbody>{children}</tbody>;
          },
          tr({ children }) {
            return (
              <tr className="border-b border-gray-300 dark:border-gray-600">
                {children}
              </tr>
            );
          },
          th({ children }) {
            return (
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-semibold">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">
                {children}
              </td>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
