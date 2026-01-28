"use client"

import { AiRaport } from "@/components/shared/ReportDetailsCard";
import { patientInterview } from "@/data/dashboard-data";
import { ArrowLeft, Bot, CalendarCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useChatLogic } from "@/hooks/useChatLogic";
import { ChatMessage } from "@/types/chat";
import { ChatInputArea } from "@/components/dashboards/ChatInputArea";

export default function InterviewPage() {
  const { chatMessages,
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
  } = useChatLogic();

  const router = useRouter();
  const onBack = () => {
    clearHistory();
    router.back();
  }

  const handleBooking = () => {
    if (aiReport) {
      localStorage.setItem("medicalReport", JSON.stringify(aiReport));
    }

    router.push("/patient/interview/book_appointment");
  };

  const [viewedImage, setViewedImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isResponding])

  return (
    <div className="flex-1 w-full">
      <section className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 h-[650px] relative">
        <ChatHeader onBack={onBack} onBook={handleBooking} title={patientInterview.title} />

        <div className="flex-1 flex flex-col gap-4 overflow-y-auto px-6 py-6 scroll-smooth">
          {chatMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onImageClick={(url) => setViewedImage(url)}
            />
          ))}

          {isResponding && (
            <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-2 text-xs text-slate-500 self-start animate-pulse">
              AI is analyzing the response...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <ChatInputArea
          value={chatInput}
          onChange={setChatInput}
          onSend={sendMessage}
          placeholder={patientInterview.inputPlaceholder}
          onFileSelect={addFiles}
          selectedFiles={selectedFiles}
          onRemoveFile={removeFile}
          isDisabled={isInterviewComplete}
        />
      </section>

      <FullScreenImageViewer viewedImage={viewedImage} onClose={() => setViewedImage(null)} />
    </div>
  );
}


type ChatHeaderProps = {
  onBack: () => void;
  onBook: () => void;
  title: string;
};


const ChatHeader = ({ onBack, onBook, title }: ChatHeaderProps) => (
  <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
    <div className="flex items-center gap-4">
      <button
        onClick={onBack}
        className="rounded-full p-2 text-slate-500 hover:bg-slate-100 transition"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
        <Bot className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-slate-500">Medical History</p>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      </div>
    </div>

    <button
      onClick={onBook}
      className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition shadow-sm active:scale-95"
    >
      <CalendarCheck className="h-4 w-4" />
      <span className="hidden sm:inline">Schedule an appointment</span>
    </button>
  </header>
);





const MessageBubble = ({ message, onImageClick }: { message: ChatMessage, onImageClick: (url: string) => void }) => {
  const isUser = message.author === "user";
  const hasAttachments = message.attachmentUrls && message.attachmentUrls.length > 0;

  if (message.reportData) {
    return (
      <div className="flex justify-start w-full pr-4 md:pr-12">
        <AiRaport data={message.reportData} />
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] md:max-w-lg rounded-3xl px-5 py-3 text-sm ${isUser ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-800"
          }`}
      >
        {hasAttachments && (
          <div className={`mb-2 grid gap-2 ${message.attachmentUrls!.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {message.attachmentUrls!.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`attachment-${index}`}
                onClick={() => onImageClick(url)}
                className="w-full h-auto max-h-[200px] rounded-lg object-cover bg-black/10 cursor-pointer hover:opacity-90 transition"
              />
            ))}
          </div>
        )}

        <p className="whitespace-pre-wrap wrap-break-word">
          {message.text}
        </p>
        <span
          className={`mt-2 block text-xs ${isUser ? "text-white/70" : "text-slate-500"
            }`}
        >
          {message.time}
        </span>
      </div>
    </div>
  );
};

const FullScreenImageViewer = ({ viewedImage: viewedImage, onClose }: {
  viewedImage: string | null;
  onClose: () => void;
}) => {
  if (!viewedImage) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition"
      >
        <X className="h-6 w-6" />
      </button>
      <img
        src={viewedImage}
        alt="Full screen preview"
        className="max-h-full max-w-full p-16 object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};



