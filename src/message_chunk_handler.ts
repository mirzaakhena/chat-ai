import { ToolCall } from "./functions.js";

export const createHandleMessageChunk = () => {
  //

  const cuttedJSONString: string[] = [];

  return (chunk: Buffer, streamMessage: (message: string) => void, streamTool: (toolCall: ToolCall) => void): boolean => {
    //

    const streamData = chunk.toString();

    const splitPerLine = streamData.split("\n");

    const parseStreamJSON = (completeJSONStr: string, chunkOfStr: string) => {
      //

      try {
        const obj = JSON.parse(completeJSONStr);

        const toolCall = obj.choices[0].delta.tool_calls;
        if (toolCall?.length > 0) {
          streamTool(toolCall[0]);
        }

        const content = obj.choices[0].delta.content;
        if (content) {
          streamMessage(content);
        }

        cuttedJSONString.length = 0;
      } catch (err: any) {
        cuttedJSONString.push(chunkOfStr);
      }
    };

    for (const line of splitPerLine) {
      //

      if (line.trim().length === 0) continue;

      if (line.startsWith("data: [DONE]")) return true;

      if (line.startsWith("data:")) {
        //
        const subStr = line.substring(5).trim();
        parseStreamJSON(subStr, subStr);
        continue;
        //
      }
      //

      cuttedJSONString.push(line);

      parseStreamJSON(cuttedJSONString.join(""), line);
    }

    return false;
  };
};
