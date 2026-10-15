"use client";

import { useEffect, useState } from "react";

export function InstallHint() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    setVisible(ios && !standalone && localStorage.getItem("crest-install-hint-dismissed") !== "1");
  }, []);
  if (!visible) return null;
  return <aside className="fixed inset-x-3 bottom-3 z-40 rounded-2xl bg-green-500 p-4 text-sm text-green-900 shadow-green-900/10"><div className="flex items-start justify-between gap-3"><p className="leading-6">لتثبيت التطبيق على iPhone: اضغط مشاركة ثم «إضافة إلى الشاشة الرئيسية».</p><button type="button" aria-label="إخفاء" onClick={() => { localStorage.setItem("crest-install-hint-dismissed", "1"); setVisible(false); }} className="rounded-full bg-green-900/10 ps-3 pe-3 py-1">إخفاء</button></div></aside>;
}
