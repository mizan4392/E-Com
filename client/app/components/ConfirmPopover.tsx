"use client";

import { useState, useRef, useEffect } from "react";
import LoadingSpinner from "./LoadingSpinner";

type ConfirmPopoverProps = {
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  message?: string;
  children: React.ReactNode;
  variant?: "default" | "danger";
  loading: boolean;
};

export default function ConfirmPopover({
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  message = "Are you sure?",
  children,
  variant = "danger",
  loading = false,
}: ConfirmPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleConfirm = () => {
    onConfirm();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={popoverRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{children}</div>

      {isOpen && (
        <div className="absolute bottom-full right-0 z-[9999] mb-2 w-48 rounded-xl border border-zinc-200 bg-white p-4 shadow-xl">
          <p className="mb-3 text-sm text-zinc-700">{message}</p>
          <div className="flex gap-2">
            <button
              disabled={loading}
              onClick={() => setIsOpen(false)}
              className=" cursor-pointer flex-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              {cancelText}
            </button>
            <button
              disabled={loading}
              onClick={handleConfirm}
              className={`cursor-pointer flex-1 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition ${
                variant === "danger"
                  ? "bg-red-400 hover:bg-red-500"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {loading ? (
                <LoadingSpinner size="sm" color="white" />
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
