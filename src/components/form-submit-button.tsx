"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

export function FormSubmitButton({ children, className, disabled = false }: { children: React.ReactNode; className: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending || disabled} aria-disabled={pending || disabled} className={`${className} min-h-11 disabled:opacity-50`}>
    {pending ? <span className="inline-flex items-center gap-2"><LoaderCircle aria-hidden size={16} className="animate-spin" />جارٍ الحفظ</span> : children}
  </button>;
}
