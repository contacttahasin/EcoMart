"use client";

import { CheckCircle2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";

type DocumentDropzoneProps = {
  label: string;
  hint: string;
  fileName: string | null;
  onFileSelected: (fileName: string) => void;
};

export function DocumentDropzone({ label, hint, fileName, onFileSelected }: DocumentDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        const file = event.dataTransfer.files[0];
        if (file) onFileSelected(file.name);
      }}
      className={`flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
        isDragging ? "border-primary bg-secondary-container/20" : "border-outline hover:bg-surface-container-low"
      } ${fileName ? "bg-primary/5" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFileSelected(file.name);
        }}
      />
      {fileName ? (
        <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
          <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
          {fileName}
        </p>
      ) : (
        <>
          <UploadCloud aria-hidden="true" className="mb-2 h-6 w-6 text-outline" />
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="mt-1 text-xs text-on-surface-variant">{hint}</p>
        </>
      )}
    </div>
  );
}
