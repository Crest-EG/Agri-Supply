"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { createContext, useContext, useState } from "react";
import { X } from "lucide-react";

const DialogCloseContext = createContext<() => void>(() => {});
export function useDialogClose() { return useContext(DialogCloseContext); }

export function Dialog({ trigger, title, children, open: controlledOpen, onOpenChange, closeOnSubmit = false }: { trigger: React.ReactNode; title: string; children: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void; closeOnSubmit?: boolean }) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  return <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
    <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-green-900/45 backdrop-blur-sm" />
      <DialogPrimitive.Content dir="rtl" onSubmitCapture={() => { if (closeOnSubmit) window.setTimeout(() => setOpen(false), 100); }} className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-1.5rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain rounded-2xl border border-green-100 bg-white p-5 text-green-900 shadow-2xl shadow-green-900/20 max-h-[calc(100dvh-2rem)] sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3"><DialogPrimitive.Title className="text-lg font-bold">{title}</DialogPrimitive.Title><DialogPrimitive.Close aria-label="إغلاق" className="flex h-11 w-11 items-center justify-center rounded-lg text-green-700"><X aria-hidden size={18} /></DialogPrimitive.Close></div>
        <DialogCloseContext.Provider value={() => setOpen(false)}>{children}</DialogCloseContext.Provider>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>;
}

export function DialogClose({ children }: { children: React.ReactNode }) {
  return <DialogPrimitive.Close asChild>{children}</DialogPrimitive.Close>;
}
