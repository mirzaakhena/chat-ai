import readline from "readline";
import { availableFunctions, FunctionResponse, Message, ToolCall } from "./functions.js";
import { handleStreamResponse } from "./response_stream_handler.js";

// 1. Extract the readline interface creation into a separate function
function createUserInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

// 2. Create a separate function for handling user input
async function handleUserInput(input: string, messages: Message[]) {
  //

  function printMessage() {
    //

    let isGreenColor = false;

    // 6. Create a helper function for token marker color
    function getTokenMarkerColor() {
      isGreenColor = !isGreenColor;
      return isGreenColor ? "\x1B[32m" : "\x1B[34m";
    }

    // 5. Extract the message printing logic
    return (message: string) => {
      const tokenMarkerColor = getTokenMarkerColor();
      process.stdout.write(`${tokenMarkerColor}${message}`);
    };
  }

  const userPrompt = input.trim();

  if (userPrompt.length === 0) {
    return null;
  }

  messages.push({ role: "user", content: userPrompt });

  const [accumulatedResponse, tools] = await handleStreamResponse(messages, printMessage());

  return { accumulatedResponse, tools };
}

// 3. Extract the tool handling logic into a separate function
async function handleTools(tools: ToolCall[], messages: Message[]) {
  //

  function handleFunctionResponse(funcName: string, funcResponse: FunctionResponse) {
    if (funcResponse.errorMessage) {
      return `function '${funcName}' has been executed but returns an error message:\n\n${funcResponse.errorMessage}\n`;
    }
    if (funcResponse.data) {
      return `function '${funcName}' has been executed successfully and it has a response data :\n\n${funcResponse.data}\n`;
    }
    return `function '${funcName}' has been executed successfully.\n`;
  }

  // 4. Create a separate function for executing a tool call
  async function executeToolCall(tool: ToolCall) {
    const funcName = tool.function?.name as string;
    const funcArgs = JSON.parse(tool.function?.arguments!);
    const funcResponse = await availableFunctions[funcName](funcArgs);
    return { funcName, funcResponse };
  }

  const toolMessages: Message[] = [];
  const assistantMessages: Message[] = [];

  for (const tool of tools) {
    try {
      const { funcName, funcResponse } = await executeToolCall(tool);
      const responseMessage = handleFunctionResponse(funcName, funcResponse);

      toolMessages.push({ role: "tool", tool_call_id: tool.id, content: funcResponse.data || "" });
      assistantMessages.push({ role: "assistant", content: responseMessage });

      process.stdout.write(responseMessage);
    } catch (err) {
      console.error("Error handling tool:", err);
    }
  }

  messages.push({ role: "assistant", tool_calls: tools });
  messages.push(...toolMessages);
  messages.push(...assistantMessages);
}

// 7. Refactor the main chatLoop function
export async function chatLoop(messages: Message[]) {
  //

  const userInterface = createUserInterface();

  userInterface.prompt();

  userInterface.on("line", async (input) => {
    try {
      const result = await handleUserInput(input, messages);

      if (result === null) {
        return;
      }

      const { accumulatedResponse, tools } = result;

      if (tools.length === 0) {
        messages.push({ role: "assistant", content: accumulatedResponse });
      } else {
        await handleTools(tools, messages);
      }

      process.stdout.write("\x1B[0m\n\n");
    } catch (err) {
      console.error("Error in chat loop:", err);
    } finally {
      userInterface.prompt();
    }
  });
}
