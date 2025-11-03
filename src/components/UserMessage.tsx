interface UserMessageProps {
  message: string;
}

export default function UserMessage({ message }: UserMessageProps) {
  return (
    <div className="flex justify-end mb-4">
      <div className="max-w-[70%] bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-md">
        <p className="text-sm leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
