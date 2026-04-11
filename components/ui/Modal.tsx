"use client";

import { useEffect, useState, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      // Trigger enter animation on next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimating(true));
      });
      document.body.style.overflow = "hidden";
    } else if (visible) {
      // Trigger exit animation, then unmount
      setAnimating(false);
      const timer = setTimeout(() => {
        setVisible(false);
        document.body.style.overflow = "";
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Clean up overflow on unmount
  useEffect(() => {
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-forest-deep/40 backdrop-blur-sm transition-opacity duration-200",
          animating ? "opacity-100" : "opacity-0"
        )}
        onClick={handleClose}
      />
      {/* Panel */}
      <div
        className={cn(
          "relative bg-white rounded-xl border border-border shadow-card-hover w-full max-w-lg max-h-[90vh] overflow-y-auto",
          animating ? "animate-scale-in" : "animate-scale-out"
        )}
      >
        <div className="flex items-center justify-between p-5 pb-4 border-b border-border">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-forest-deep hover:bg-earth-sand transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
