import UserMessage from "@/components/UserMessage";
import AssistantMessage from "@/components/AssistantMessage";
import InputForm from "@/components/InputForm";

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

          <AssistantMessage message="Of course! Next.js is a powerful React framework that enables you to build full-stack web applications. It provides features like server-side rendering, static site generation, API routes, and more. What specific aspect of Next.js would you like to learn about?" />

          <UserMessage message="What are the main benefits of using Next.js?" />

          <AssistantMessage message="Great question! Here are the main benefits of Next.js:\n\n1. Server-Side Rendering (SSR) for better SEO and performance\n2. Static Site Generation (SSG) for blazing-fast page loads\n3. Built-in routing system with file-based routing\n4. API routes for building backend endpoints\n5. Automatic code splitting for optimal loading\n6. Image optimization out of the box\n7. Fast refresh for instant development feedback\n\nWould you like me to elaborate on any of these features?" />
        </div>
      </main>

      {/* Input Form */}
      <InputForm />
    </div>
  );
}
