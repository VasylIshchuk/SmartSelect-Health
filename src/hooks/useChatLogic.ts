import { ApiResponse, ChatMessage } from "@/types/chat";
import { AiReportData } from "@/types/report";
import { useCallback, useEffect, useState } from "react";

const API_URL = "http://localhost:8000/ask";

const getCurrentTime = () =>
  new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });

const createMessage = (
  role: "user" | "assistant",
  text: string,
  attachments: string[] = []
): ChatMessage => ({
  id: Date.now().toString(),
  author: role,
  text: text,
  time: getCurrentTime(),
  attachmentUrls: attachments,
});


export function useChatLogic() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [aiReport, setAiReport] = useState<AiReportData | null>(null);


  const loadSession = useCallback(() => {
    const savedData = sessionStorage.getItem("chatSession");
    if (!savedData) return;
    try {
      const parsed = JSON.parse(savedData);
      setChatMessages(parsed.messages || []);
      setAiReport(parsed.report || null);
      setIsInterviewComplete(parsed.isComplete || false);
    } catch (e) {
      console.error("Błąd odczytu historii", e);
    }
  }, []);

  const saveSession = useCallback(() => {
    if (chatMessages.length === 0) return;
    const sessionData = {
      messages: chatMessages,
      report: aiReport,
      isComplete: isInterviewComplete
    };
    sessionStorage.setItem("chatSession", JSON.stringify(sessionData));
  }, [chatMessages, aiReport, isInterviewComplete]);

  useEffect(() => { loadSession(); }, [loadSession]);
  useEffect(() => { saveSession(); }, [saveSession]);



  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const clearHistory = () => {
    sessionStorage.removeItem("chatSession");
    setChatMessages([]);
    setAiReport(null);
    setIsInterviewComplete(false);
  };



  const handleUserMessage = () => {
    const attachmentUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    const userMessage = createMessage("user", chatInput.trim(), attachmentUrls);

    setChatMessages((prev) => [...prev, userMessage]);

    const payloadToSend = { text: chatInput, files: [...selectedFiles] };

    setChatInput("");
    setSelectedFiles([]);

    return payloadToSend;
  };

  const handleAiSuccess = (data: ApiResponse) => {
    let aiText = data.message || "No response";

    if (data.status === "complete" && data.report) {
      setAiReport(data.report);
      setIsInterviewComplete(true);
    }

    const aiMessage = createMessage("assistant", aiText);
    if (data.report) aiMessage.reportData = data.report;

    setChatMessages((prev) => [...prev, aiMessage]);
  };

  const handleAiError = (error: unknown) => {
    console.error("Failed to send message:", error);
    const errorMsg = createMessage("assistant", "I apologize, but the message failed to send. Please try again.");
    setChatMessages((prev) => [...prev, errorMsg]);
  };



  const sendMessage = async () => {
    if (isInterviewComplete) return;
    if (!chatInput.trim() && selectedFiles.length === 0) return;

    const { text, files } = handleUserMessage();
    setIsResponding(true);

    try {
      const data = await fetchChatResponse(text, chatMessages, files);
      handleAiSuccess(data);
    } catch (error) {
      handleAiError(error)
    } finally {
      setIsResponding(false);
    }
  };



  return {
    chatMessages,
    chatInput,
    setChatInput,
    isResponding,
    sendMessage,
    selectedFiles,
    addFiles,
    removeFile,
    isInterviewComplete,
    aiReport,
    clearHistory
  };
}

async function fetchChatResponse(message: string, history: ChatMessage[], files: File[]): Promise<ApiResponse> {
  const formData = new FormData();
  formData.append("message", message);
  formData.append("history", JSON.stringify(
    history.map((msg) => ({
      role: msg.author === "user" ? "user" : "assistant",
      content: msg.text,
    }))
  ));
  formData.append("k", "5");
  formData.append("mode", "api");
  formData.append("use_functions", "true");
  files.forEach((file) => formData.append("images", file));

  const response = await fetch(API_URL, { method: "POST", body: formData });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return await response.json();
}
