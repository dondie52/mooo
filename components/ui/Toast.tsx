"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Types ─────────────────────────────────────────────────── */

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  exiting?: boolean;
}

interface ToastInput {
  message: string;
  variant?: ToastVariant;
}

type Action =
  | { type: "ADD"; toast: Toast }
  | { type: "EXIT"; id: string }
  | { type: "REMOVE"; id: string };

/* ── Context ───────────────────────────────��───────────────── */

const ToastContext = createContext<((input: ToastInput) => void) | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

/* ── Reducer ─────────────────────────────────��─────────────── */

function reducer(state: Toast[], action: Action): Toast[] {
  switch (action.type) {
    case "ADD":
      return [...state, action.toast];
    case "EXIT":
      return state.map((t) =>
        t.id === action.id ? { ...t, exiting: true } : t
      );
    case "REMOVE":
      return state.filter((t) => t.id !== action.id);
    default:
      return state;
  }
}

/* ── Provider ──────────────────────────────────────────────── */

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, dispatch] = useReducer(reducer, []);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const toast = useCallback((input: ToastInput) => {
    const id = `toast-${++toastId}`;
    dispatch({
      type: "ADD",
      toast: { id, message: input.message, variant: input.variant ?? "success" },
    });

    // Auto-dismiss after 4s
    const exitTimer = setTimeout(() => {
      dispatch({ type: "EXIT", id });
      const removeTimer = setTimeout(() => {
        dispatch({ type: "REMOVE", id });
        timersRef.current.delete(id);
      }, 250);
      timersRef.current.set(`${id}-remove`, removeTimer);
    }, 4000);
    timersRef.current.set(id, exitTimer);
  }, []);

  const dismiss = useCallback((id: string) => {
    // Clear auto-dismiss timer
    const timer = timersRef.current.get(id);
    if (timer) clearTimeout(timer);
    timersRef.current.delete(id);

    dispatch({ type: "EXIT", id });
    setTimeout(() => dispatch({ type: "REMOVE", id }), 250);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

/* ── Toast Item ────────────────────────────────────────────── */

const variantConfig: Record<
  ToastVariant,
  { icon: typeof CheckCircle2; borderClass: string; iconClass: string }
> = {
  success: {
    icon: CheckCircle2,
    borderClass: "border-l-alert-green",
    iconClass: "text-alert-green",
  },
  error: {
    icon: AlertCircle,
    borderClass: "border-l-alert-red",
    iconClass: "text-alert-red",
  },
  info: {
    icon: Info,
    borderClass: "border-l-gold",
    iconClass: "text-gold",
  },
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const { icon: Icon, borderClass, iconClass } = variantConfig[toast.variant];

  return (
    <div
      className={cn(
        "bg-white rounded-lg border border-border shadow-card-hover p-3.5 pl-4 flex items-start gap-3 border-l-4",
        borderClass,
        toast.exiting ? "animate-toast-out" : "animate-toast-in"
      )}
      role="status"
      aria-live="polite"
    >
      <Icon className={cn("w-4.5 h-4.5 mt-0.5 shrink-0", iconClass)} />
      <p className="text-sm text-forest-deep flex-1">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-muted hover:text-forest-deep transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
