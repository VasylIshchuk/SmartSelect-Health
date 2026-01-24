import { AiReportData } from "./report";

export type ChatMessage = {
  id: string;
  author: "assistant" | "user";
  text: string;
  time: string;
  attachmentUrls?: string[];
  reportData?: AiReportData;
};

export type ApiResponse = {
  status: "chat" | "complete";
  message?: string;
  report?: AiReportData;
};