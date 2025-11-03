import MessageContent from "./MessageContent";

interface AssistantMessageProps {
  message: string;
}

export default function AssistantMessage({ message }: AssistantMessageProps) {
  return (
    <div className="flex justify-start mb-4">
      <div className="flex gap-3 max-w-[70%]">
        <div className="shrink-0 w-8 h-8 bg-linear-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
          AI
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-md">
          <MessageContent content={message} className="text-gray-800 dark:text-gray-200" />
        </div>
      </div>
    </div>
  );
}
