"use client"

import { toast as sonnerToast } from "sonner";

type ToastOptions = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  duration?: number;
  onOpenChange?: (open: boolean) => void;
};

function toast({ title, description, action, duration = 4000, onOpenChange }: ToastOptions) {
  return sonnerToast(title, {
    description,
    action,
    duration,
    onAutoClose: onOpenChange ? () => onOpenChange(false) : undefined,
  });
}

function useToast() {
  return { toast };
}

export { useToast, toast };
