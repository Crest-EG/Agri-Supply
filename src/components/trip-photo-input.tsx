"use client";

import imageCompression from "browser-image-compression";
import { useRef, useState } from "react";

async function makeBlurPlaceholder(file: File): Promise<string> {
  const image = await createImageBitmap(file);
  const width = 20;
  const height = Math.max(1, Math.round((image.height / image.width) * width));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("تعذر تجهيز معاينة الصورة.");
  context.filter = "blur(1px)";
  context.drawImage(image, 0, 0, width, height);
  image.close();
  return canvas.toDataURL("image/webp", 0.45);
}

export function TripPhotoInput({ initialBlur = "", label = "صورة الحمولة (اختياري)" }: { initialBlur?: string; label?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [blur, setBlur] = useState(initialBlur);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function processPhoto(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const compressed = await imageCompression(file, { maxWidthOrHeight: 1600, initialQuality: 0.7, fileType: "image/webp", useWebWorker: true });
      const webp = new File([compressed], "trip.webp", { type: "image/webp" });
      const transfer = new DataTransfer();
      transfer.items.add(webp);
      if (inputRef.current) inputRef.current.files = transfer.files;
      setBlur(await makeBlurPlaceholder(webp));
      setPreview(URL.createObjectURL(webp));
    } catch {
      setError("تعذر ضغط الصورة. جرّب صورة أخرى.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="rounded-xl border border-green-100 p-3">
    <label className="block text-sm font-semibold">{label}<input ref={inputRef} name="photo" type="file" accept="image/*" capture="environment" onChange={(event) => void processPhoto(event.target.files?.[0])} className="mt-2 block w-full text-sm" /></label>
    <input type="hidden" name="photo_blur" value={blur} />
    {busy && <p className="mt-2 text-sm text-green-900/70">جارٍ ضغط الصورة...</p>}{error && <p role="alert" className="mt-2 text-sm text-orange-700">{error}</p>}
    {/* eslint-disable-next-line @next/next/no-img-element -- Local blob/data preview generated on the device. */}
    {(preview || blur) && <img src={preview || blur} alt="معاينة ضبابية للصورة" className="mt-3 max-h-40 max-w-full rounded-xl object-cover" />}
  </div>;
}
