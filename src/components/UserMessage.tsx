import MessageContent from "./MessageContent";

interface UserMessageProps {
  message: string;
}

export default function UserMessage({ message }: UserMessageProps) {
  return (
    <div className="flex justify-end mb-4">
      <div className="max-w-[70%] bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-md">
        <MessageContent content={message} className="text-white [&_code]:bg-blue-700 [&_code]:text-white" />
      </div>
    </div>
  );
}
