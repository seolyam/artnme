"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/utils";

interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void;
}

export function FileDropZone({ onFilesSelected }: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = (fileList: Iterable<File | undefined>) => {
    const incoming = Array.from(fileList).filter(
      (file): file is File => file !== undefined,
    );
    if (incoming.length === 0) return;
    const images = incoming.filter((file) => file.type.startsWith("image/"));
    if (images.length < incoming.length) {
      setError("Some files were skipped — only images (PNG, JPG, SVG) are supported.");
    } else {
      setError(null);
    }
    if (images.length > 0) {
      onFilesSelected(images);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files ? Array.from(e.target.files) : []);
    e.target.value = "";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Upload design images"
        className={cn(
          "border-2 border-dashed bg-surface-container-high p-8 text-center transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isDragging
            ? "border-primary-container bg-primary-container/5"
            : "border-outline-variant/40 dark:border-white/10 hover:border-primary-container",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleChange}
        />
        <span className="material-symbols-outlined text-4xl text-on-surface/30 dark:text-white/20 group-hover:text-primary-container transition-colors mb-3 block">
          add_photo_alternate
        </span>
        <p className="text-on-surface dark:text-white font-headline font-bold tracking-tight">
          ADD IMAGE LAYERS
        </p>
        <p className="text-on-surface-variant text-[10px] mt-2 uppercase tracking-widest">
          PNG, JPG, or SVG — drop or click — select multiple
        </p>
      </div>
      {error && (
        <p className="text-xs text-error font-medium">{error}</p>
      )}
    </div>
  );
}
