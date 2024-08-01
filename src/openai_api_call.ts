import axios from "axios";
import { Message, tools } from "./functions.js";

export const handleAPICall = async (messages: Message[]) => {
  //
  return axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      temperature: 0,
      seed: 1,
      messages,
      stream: true,
      tools,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.OPENAI_KEY, // OPENAI
      },
      responseType: "stream",
    }
  );
};
