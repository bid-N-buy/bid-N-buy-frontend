import React, { useEffect, useRef, useCallback } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
  duration?: number;
}

const Toast = ({ message, type, onClose, duration = 3000 }: ToastProps) => {
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    if (duration > 0) {
      timerRef.current = window.setTimeout(onClose, duration);
    }
  }, [duration, onClose, clearTimer]);

  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [startTimer, clearTimer]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="animate-fade-in fixed inset-x-4 top-4 z-[2000] sm:inset-x-auto sm:left-1/2 sm:top-8 sm:-translate-x-1/2"
      onMouseEnter={clearTimer}
      onMouseLeave={startTimer}
    >
      <div
        className={`w-full max-w-[min(92vw,560px)] sm:max-w-md flex items-start gap-3 rounded-md px-4 py-3 shadow-lg sm:px-6 sm:py-4 ${
          type === "success" ? "bg-purple text-white" : "bg-red text-white"
        }`}
      >
        {type === "success" ? (
          <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 sm:mt-0" />
        ) : (
          <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 sm:mt-0" />
        )}
        <span className="flex-1 text-sm font-medium leading-relaxed break-keep whitespace-pre-wrap sm:text-base">
          {message}
        </span>
        <button
          onClick={onClose}
          className="ml-2 mt-0.5 flex-shrink-0 transition-opacity hover:opacity-80 sm:mt-0"
          aria-label="닫기"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
