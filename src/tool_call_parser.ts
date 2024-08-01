import { ToolCall } from "./functions.js";

export function parseToolCalls(input: ToolCall[]): ToolCall[] {
  const output: ToolCall[] = [];
  let currentItem: ToolCall = {};

  for (const item of input) {
    if (item.index !== undefined && item.id) {
      // Start of a new item
      if (Object.keys(currentItem).length > 0) {
        output.push(currentItem);
      }
      currentItem = {
        index: item.index,
        id: item.id,
        type: item.type,
        function: {
          name: item.function?.name || "",
          arguments: item.function?.arguments || "",
        },
      };
    } else if (item.function?.arguments !== undefined) {
      // Continuation of arguments
      currentItem.function!.arguments += item.function.arguments;
    }
  }

  // Add the last item
  if (Object.keys(currentItem).length > 0) {
    output.push(currentItem);
  }

  return output;
}
