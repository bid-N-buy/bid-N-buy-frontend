import React, { useEffect } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
  duration?: number;
}

const Toast = ({ message, type, onClose, duration = 3000 }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="animate-fade-in fixed top-8 left-1/2 z-50 -translate-x-1/2">
      <div
        className={`flex items-center gap-3 rounded px-6 py-4 shadow-lg ${
          type === "success" ? "bg-green text-white" : "bg-red text-white"
        }`}
      >
        {type === "success" ? (
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
        ) : (
          <XCircle className="h-5 w-5 flex-shrink-0" />
        )}
        <span className="text-[15px] font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 transition-opacity hover:opacity-80"
          aria-label="닫기"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
