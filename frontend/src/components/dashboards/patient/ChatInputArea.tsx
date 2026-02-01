"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { Camera, Images, Paperclip, Plus, Send, X } from "lucide-react";
import { useRef, ChangeEvent } from "react";
import TextareaAutosize from "react-textarea-autosize";

type ChatInputAreaProps = {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  placeholder: string;
  onFileSelect: (files: FileList | null) => void;
  selectedFiles: File[];
  onRemoveFile: (index: number) => void;
  isDisabled?: boolean;
};

export const ChatInputArea = ({
  value,
  onChange,
  onSend,
  placeholder,
  onFileSelect,
  selectedFiles,
  onRemoveFile,
  isDisabled = false,
}: ChatInputAreaProps) => {
  const { openFiles, openGallery, openCamera, HiddenInputs } = useMediaPickers({
    onFileSelect,
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isDisabled) {
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
          disabled={(!value.trim() && selectedFiles.length === 0) || isDisabled}
          className="rounded-xl bg-blue-600 p-2 text-white transition hover:bg-blue-700 disabled:bg-slate-300"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

type UseMediaPickersProps = {
  onFileSelect: (files: FileList | null) => void;
};

export function useMediaPickers({ onFileSelect }: UseMediaPickersProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files);
    e.target.value = "";
  };

  const HiddenInputs = () => (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        multiple
        onChange={handleFileChange}
      />
      <input
        type="file"
        ref={galleryInputRef}
        className="hidden"
        accept="image/*"
        multiple
        onChange={handleFileChange}
      />
      <input
        type="file"
        ref={cameraInputRef}
        className="hidden"
        accept="image/*"
        multiple
        capture="environment"
        onChange={handleFileChange}
      />
    </>
  );

  return {
    openFiles: () => fileInputRef.current?.click(),
    openGallery: () => galleryInputRef.current?.click(),
    openCamera: () => cameraInputRef.current?.click(),
    HiddenInputs,
  };
}

const FilePreviews = ({
  files,
  onRemove,
}: {
  files: File[];
  onRemove: (i: number) => void;
}) => {
  if (files.length === 0) return null;

  return (
    <div className="mb-3 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {files.map((file, index) => (
        <div key={index} className="relative group shrink-0">
          <div className="h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <img
              src={URL.createObjectURL(file)}
              alt="preview"
              className="h-full w-full object-cover"
            />
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

const AttachmentMenu = ({
  onFiles,
  onGallery,
  onCamera,
}: AttachmentMenuProps) => {
  const isMobile = useIsMobile();

  const menuItems = isMobile
    ? [
        { label: "Gallery", icon: Images, action: onGallery },
        { label: "Camera", icon: Camera, action: onCamera },
      ]
    : [{ label: "Files", icon: Paperclip, action: onFiles }];

  return (
    <Menu>
      {({ open }) => (
        <>
          <MenuButton
            className={`p-2 transition outline-none rounded-full ${
              open
                ? "text-blue-600 bg-blue-50"
                : "text-slate-400 hover:text-blue-600"
            }`}
            title="Add attachment"
          >
            <Plus className="h-5 w-5" />
          </MenuButton>

          <MenuItems
            transition
            anchor="top start"
            className="w-48 origin-bottom-left rounded-2xl bg-white shadow-xl ring-1 ring-slate-100 p-1 focus:outline-none transition duration-100 ease-out data-closed:scale-95 data-closed:opacity-0 mb-4"
          >
            {menuItems.map((item) => (
              <MenuItem key={item.label}>
                {({ focus }) => (
                  <button
                    onClick={item.action}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-sm rounded-xl transition ${
                      focus ? "bg-blue-50 text-blue-700" : "text-slate-700"
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

export function useIsMobile() {
  const userAgent = window.navigator.userAgent;
  return /android.+mobile|ip(hone|[oa]d)/i.test(userAgent);
}
