import dotenv from "dotenv";
import { promises as fs } from "fs";
import { chatLoop } from "./chat_loop.js";

dotenv.config();

const content = await fs.readFile(`./prompts/system_prompt_tool_call.txt`, "utf8");
chatLoop([{ role: "system", content }]);

// const chatLoop = new ChatLoop([{ role: "system", content }]);
// chatLoop.start();
