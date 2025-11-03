"use client";

import UserMessage from "@/components/UserMessage";
import AssistantMessage from "@/components/AssistantMessage";
import InputForm from "@/components/InputForm";
import ToolMessage from "@/components/ToolMessage";

const chartMessage = `Great question! Here are the main benefits of Next.js:

1. **Server-Side Rendering (SSR)** for better SEO and performance
2. **Static Site Generation (SSG)** for blazing-fast page loads
3. Built-in routing system with file-based routing
4. API routes for building backend endpoints
5. Automatic code splitting for optimal loading

Here's a comparison chart of performance metrics:

\`\`\`chart
{
  "type": "bar",
  "data": [
    { "name": "Next.js", "performance": 95, "seo": 98 },
    { "name": "Create React App", "performance": 70, "seo": 65 },
    { "name": "Gatsby", "performance": 90, "seo": 95 }
  ],
  "options": {
    "xKey": "name",
    "bars": [
      { "dataKey": "performance", "name": "Performance", "color": "#8884d8" },
      { "dataKey": "seo", "name": "SEO Score", "color": "#82ca9d" }
    ]
  }
}
\`\`\`

Would you like me to elaborate on any of these features?`;

const tableAndCodeMessage = `Here's a comparison table of different React frameworks:

| Framework | SSR | SSG | API Routes | Learning Curve |
|-----------|-----|-----|------------|----------------|
| Next.js | ✅ | ✅ | ✅ | Medium |
| Gatsby | ❌ | ✅ | ❌ | Medium |
| Create React App | ❌ | ❌ | ❌ | Easy |
| Remix | ✅ | ✅ | ✅ | High |

And here's how to create a simple API route in Next.js:

\`\`\`typescript
// app/api/hello/route.ts
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  return NextResponse.json({
    message: 'Hello World',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: Request) {
  const body = await request.json()
  return NextResponse.json({
    received: body,
    status: 'success'
  })
}
\`\`\`

You can also create dynamic routes:

\`\`\`javascript
// app/api/users/[id]/route.js
export async function GET(request, { params }) {
  const userId = params.id

  // Fetch user from database
  const user = await db.users.findById(userId)

  return Response.json(user)
}
\`\`\`

Pretty straightforward, right?`;

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Chat AI
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            AI-powered chat assistant
          </p>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <AssistantMessage message="Hello! I'm your AI assistant. How can I help you today?" />

          <UserMessage message="Can you help me learn about Next.js?" />

          <AssistantMessage message="Of course! **Next.js** is a powerful React framework that enables you to build full-stack web applications. It provides features like:\n\n- Server-side rendering\n- Static site generation\n- API routes\n- And more!\n\nHere's a simple example:\n\n```javascript\nexport default function Home() {\n  return <div>Hello World</div>\n}\n```\n\nWhat specific aspect of Next.js would you like to learn about?" />

          <UserMessage message="What are the main benefits of using Next.js?" />

          <ToolMessage
            thinkingMessage="I need to search the documentation for Next.js benefits to provide accurate information."
            toolCallName="searchDocumentation"
            request={{
              query: "Next.js benefits",
              source: "official-docs",
              limit: 10
            }}
            response={{
              status: "success",
              results: [
                { title: "Server-Side Rendering", relevance: 0.95 },
                { title: "Static Site Generation", relevance: 0.92 },
                { title: "Built-in Routing", relevance: 0.88 }
              ],
              totalFound: 15
            }}
          />

          <AssistantMessage message={chartMessage} />

          <UserMessage message="Can you show me more examples with tables and code?" />

          <AssistantMessage message={tableAndCodeMessage} />
        </div>
      </main>

      {/* Input Form */}
      <InputForm />
    </div>
  );
}
