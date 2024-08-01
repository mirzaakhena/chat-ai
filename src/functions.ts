import { promises as fs } from "fs";
import path, { dirname } from "path";

export type Message = {
  role: "system" | "user" | "assistant" | "tool";
  content?: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
};

export type FunctionResponse = {
  errorMessage?: string;
  message?: string;
  data?: any;
};

export const responseFail = (errorMessage: string) => ({ errorMessage });

export const responseSuccess = (message: string, data?: any) => ({ message, data });

export type BasicFunction = (a?: any) => Promise<FunctionResponse>;

const rootDir = "./playground";

export const availableFunctions: Record<string, BasicFunction> = {
  //

  readFile: async ({ filename }: { filename: string }) => {
    try {
      const pathfile = `${rootDir}/${filename}`;
      const result = await fs.readFile(pathfile, "utf8");

      return responseSuccess(`success read file ${pathfile}`, result);
    } catch (err: any) {
      return responseFail(err.message);
    }
  },

  writeFile: async ({ filename, content }: { filename: string; content: string }) => {
    try {
      const pathfile = `${rootDir}/${filename}`;

      // Create directory recursively
      await fs.mkdir(dirname(pathfile), { recursive: true });

      // Write the file
      await fs.writeFile(pathfile, content, "utf8");

      return responseSuccess(`success write file ${pathfile}`);
    } catch (err: any) {
      return responseFail(err.message);
    }
  },

  listFileAndFolder: async ({}: {}) => {
    //

    try {
      const pathfile = `${rootDir}`;

      const fileAndFolders: string[] = [];
      const dirContent = await fs.readdir(pathfile);
      for (const file of dirContent) {
        //

        const filePath = path.join(pathfile, file);

        if ((await fs.lstat(filePath)).isFile()) {
          fileAndFolders.push(file);
          continue;
        }

        if ((await fs.lstat(filePath)).isDirectory()) {
          fileAndFolders.push(`/${file}`);
          continue;
        }
      }

      return responseSuccess(`success get file and folder`, fileAndFolders.join("\n"));
    } catch (err: any) {
      return responseFail(err.message);
    }
  },
};

export type ToolType = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: {
        [field: string]: {
          type: any;
          description: string;
        };
      };
      required?: string[];
    };
  };
};

export type ToolCall = {
  index?: number;
  id?: string;
  type?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
};

export const tools: ToolType[] = [
  {
    type: "function",
    function: {
      name: "readFile",
      description: "Read the contents of a file",
      parameters: {
        type: "object",
        properties: {
          filename: {
            type: "string",
            description: "The name of the file to read",
          },
        },
        required: ["filename"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "writeFile",
      description: "Write content to a file",
      parameters: {
        type: "object",
        properties: {
          filename: {
            type: "string",
            description: "The name of the file to write",
          },
          content: {
            type: "string",
            description: "The content to write to the file",
          },
        },
        required: ["filename", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listFileAndFolder",
      description: "List all files and folders in the root directory",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
];
