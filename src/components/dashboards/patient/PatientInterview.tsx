import { patientInterview } from "@/data/dashboard-data";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ArrowLeft, Bot, Camera, Images, Paperclip, Plus, Send, X } from "lucide-react";
import { useEffect, useState, useRef, ChangeEvent } from "react";
import TextareaAutosize from 'react-textarea-autosize';

type ChatMessage = {
  id: string;
  author: "ai" | "user";
  text: string;
  time: string;
  attachmentUrls?: string[];
};

type Props = {
  onBack: () => void;
};



export default function PatientInterview({ onBack }: Props) {
  const { chatMessages,
    chatInput,
    setChatInput,
    isResponding,
    sendMessage,
    selectedFiles,
    addFiles,
    removeFile
  } = useChatLogic(patientInterview.initialMessages);

  const [viewedImage, setViewedImage] = useState<string | null>(null);

  return (
    <>
      <section className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 h-[600px] relative">
        <ChatHeader onBack={onBack} title={patientInterview.title} />

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
        </div>

        <ChatInputArea
          value={chatInput}
          onChange={setChatInput}
          onSend={sendMessage}
          placeholder={patientInterview.inputPlaceholder}
          onFileSelect={addFiles}
          selectedFiles={selectedFiles}
          onRemoveFile={removeFile}
        />
      </section>

      <ImageModal viewedImage={viewedImage} onClose={() => setViewedImage(null)} />
    </>
  );
}




function useChatLogic(initialMessages: ChatMessage[]) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialMessages);
  const [chatInput, setChatInput] = useState("");
  const [isResponding, setIsResponding] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);


  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };


  const removeFile = (indexToRemove: number) => {
    setSelectedFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const sendMessage = () => {

    if (!chatInput.trim() && selectedFiles.length === 0) return;

    const attachmentUrls = selectedFiles.map((file) => URL.createObjectURL(file));

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      author: "user",
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString("pl-PL", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      attachmentUrls: attachmentUrls,
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setSelectedFiles([]);
    setIsResponding(true);

    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        author: "ai",
        text: "Thank you. I have received your input. Are there any additional symptoms?",
        time: new Date().toLocaleTimeString("pl-PL", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setChatMessages((prev) => [...prev, aiMsg]);
      setIsResponding(false);
    }, 1200);
  };

  return {
    chatMessages,
    chatInput,
    setChatInput,
    isResponding,
    sendMessage,
    selectedFiles,
    addFiles,
    removeFile
  };
}




const ChatHeader = ({ onBack, title }: { onBack: () => void; title: string }) => (
  <header className="flex items-center gap-4 border-b border-slate-100 px-6 py-4">
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
  </header>
);




const MessageBubble = ({ message, onImageClick }: { message: ChatMessage, onImageClick: (url: string) => void }) => {
  const isUser = message.author === "user";
  const hasAttachments = message.attachmentUrls && message.attachmentUrls.length > 0;

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

const ImageModal = ({ viewedImage: viewedImage, onClose }: {
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




type ChatInputAreaProps = {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  placeholder: string;
  onFileSelect: (files: FileList | null) => void;
  selectedFiles: File[];
  onRemoveFile: (index: number) => void;
};

export const ChatInputArea = ({
  value,
  onChange,
  onSend,
  placeholder,
  onFileSelect,
  selectedFiles,
  onRemoveFile,
}: ChatInputAreaProps) => {
  const { openFiles, openGallery, openCamera, HiddenInputs } = useFileAttachments({ onFileSelect });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4">
      <HiddenInputs />

      <FilePreviews files={selectedFiles} onRemove={onRemoveFile} />

      <div className="flex items-center gap-3 rounded-2xl bg-white px-4 shadow-sm ring-1 ring-slate-100 relative">

        <AttachmentMenu
          onFiles={openFiles}
          onGallery={openGallery}
          onCamera={openCamera}
        />

        <TextareaAutosize
          minRows={1}
          maxRows={5}
          className="flex-1 w-full resize-none border-none bg-transparent py-3 text-base outline-none text-slate-900 placeholder:text-slate-400"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <button
          onClick={onSend}
          disabled={!value.trim() && selectedFiles.length === 0}
          className="rounded-xl bg-blue-600 p-2 text-white transition hover:bg-blue-700 disabled:bg-slate-300"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};



type UseFileAttachmentsProps = {
  onFileSelect: (files: FileList | null) => void;
};

function useFileAttachments({ onFileSelect }: UseFileAttachmentsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files);
    e.target.value = "";
  };

  const HiddenInputs = () => (
    <>
      <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
      <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />
      <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" multiple capture="environment" onChange={handleFileChange} />
    </>
  );

  return {
    openFiles: () => fileInputRef.current?.click(),
    openGallery: () => galleryInputRef.current?.click(),
    openCamera: () => cameraInputRef.current?.click(),
    HiddenInputs,
  };
}




const FilePreviews = ({ files, onRemove }: { files: File[], onRemove: (i: number) => void }) => {
  if (files.length === 0) return null;

  return (
    <div className="mb-3 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {files.map((file, index) => (
        <div key={index} className="relative group shrink-0">
          <div className="h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <img
              src={URL.createObjectURL(file)}
              alt="preview"
              className="h-full w-full object-cover" />
          </div>
          <button
            onClick={() => onRemove(index)}
            className="absolute -right-2 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-slate-500 text-white shadow-sm hover:bg-red-500 transition"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
};




type AttachmentMenuProps = {
  onFiles: () => void;
  onGallery: () => void;
  onCamera: () => void;
};

const AttachmentMenu = ({ onFiles, onGallery, onCamera }: AttachmentMenuProps) => {
  const isMobile = useIsMobile();

  const menuItems = isMobile
    ? [
      { label: "Gallery", icon: Images, action: onGallery },
      { label: "Camera", icon: Camera, action: onCamera },
    ]
    : [
      { label: "Files", icon: Paperclip, action: onFiles },
    ];

  return (
    <Menu>
      {({ open }) => (
        <>
          <MenuButton
            className={`p-2 transition outline-none rounded-full ${open ? "text-blue-600 bg-blue-50" : "text-slate-400 hover:text-blue-600"
              }`}
            title="Add attachment"
          >
            <Plus className="h-5 w-5" />
          </MenuButton>

          <MenuItems
            transition
            anchor="top start"
            className="w-48 origin-bottom-left rounded-2xl bg-white shadow-xl ring-1 ring-slate-100 p-1 focus:outline-none transition duration-100 ease-out data-closed:scale-95 data-closed:opacity-0 mb-4"          >
            {menuItems.map((item) => (
              <MenuItem key={item.label}>
                {({ focus }) => (
                  <button
                    onClick={item.action}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-sm rounded-xl transition ${focus ? "bg-blue-50 text-blue-700" : "text-slate-700"
                      }`}
                  >
                    <item.icon className="h-5 w-5 text-slate-400" />
                    {item.label}
                  </button>
                )}
              </MenuItem>
            ))}
          </MenuItems>
        </>
      )}
    </Menu>
  );
};



function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = window.navigator.userAgent;
      return /android.+mobile|ip(hone|[oa]d)/i.test(userAgent);
    };

    setIsMobile(checkMobile());
  }, []);

  return isMobile;
}


