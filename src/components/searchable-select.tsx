"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export type SearchOption = { id: string; label: string };

export function SearchableSelect({ label, name, options, initialId = "", onChange, required = false }: {
  label: string;
  name: string;
  options: SearchOption[];
  initialId?: string;
  onChange?: (id: string) => void;
  required?: boolean;
}) {
  const inputId = useId();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedId, setSelectedId] = useState(initialId);
  const [text, setText] = useState(options.find((option) => option.id === initialId)?.label ?? "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const selectedLabel = options.find((option) => option.id === selectedId)?.label;
  const query = open && selectedLabel === text ? "" : text.trim();
  const filtered = options.filter((option) => option.label.toLocaleLowerCase("ar").includes(query.toLocaleLowerCase("ar")));

  useEffect(() => {
    const selected = options.find((option) => option.id === selectedId);
    if (selectedId && !selected) {
      setSelectedId("");
      setText("");
      onChange?.("");
    } else if (selected) {
      setText(selected.label);
    }
  }, [options, selectedId, onChange]);

  function choose(option: SearchOption) {
    setSelectedId(option.id);
    setText(option.label);
    inputRef.current?.setCustomValidity("");
    setOpen(false);
    setActiveIndex(0);
    onChange?.(option.id);
  }

  function update(value: string, input: HTMLInputElement) {
    setText(value);
    setOpen(true);
    setActiveIndex(0);
    const option = options.find((item) => item.label === value);
    const id = option?.id ?? "";
    setSelectedId(id);
    input.setCustomValidity(required && value.trim() && !id ? "اختر عنصرًا من القائمة." : "");
    onChange?.(id);
  }

  return <div className="relative block text-sm font-semibold">
    <label htmlFor={inputId}>
      {label}{required && <><span aria-hidden="true" className="ms-1 text-orange-700">*</span><span className="sr-only"> مطلوب</span></>}
    </label>
    <div className="relative mt-2">
      <Search aria-hidden size={17} className="pointer-events-none absolute inset-y-0 start-3 my-auto text-green-700" />
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && filtered[activeIndex] ? `${listId}-option-${activeIndex}` : undefined}
        aria-required={required}
        autoComplete="off"
        required={required}
        value={text}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 100)}
        onChange={(event) => update(event.target.value, event.target)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
            setActiveIndex((index) => Math.max(index - 1, 0));
          } else if (event.key === "Enter" && open && filtered[activeIndex]) {
            event.preventDefault();
            choose(filtered[activeIndex]);
          } else if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        className="w-full rounded-xl border border-green-100 bg-white ps-10 pe-10 py-3"
        placeholder="ابحث واختر من القائمة"
      />
      <ChevronDown aria-hidden size={17} className={`pointer-events-none absolute inset-y-0 end-3 my-auto text-green-700 transition-transform ${open ? "rotate-180" : ""}`} />
    </div>
    <input type="hidden" name={name} value={selectedId} />
    {open && <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-green-100 bg-white p-1.5 shadow-xl shadow-green-900/10">
      {filtered.length ? filtered.map((option, index) => <li key={option.id} role="presentation">
        <button
          id={`${listId}-option-${index}`}
          type="button"
          role="option"
          aria-selected={selectedId === option.id}
          onMouseDown={(event) => event.preventDefault()}
          onMouseEnter={() => setActiveIndex(index)}
          onClick={() => choose(option)}
          className={`flex min-h-11 w-full items-center justify-between rounded-lg px-3 py-2 text-start font-medium ${index === activeIndex ? "bg-green-50 text-green-900" : "text-green-900 hover:bg-green-50"}`}
        >{option.label}{selectedId === option.id && <Check aria-hidden size={17} className="text-green-700" />}</button>
      </li>) : <li className="px-3 py-3 text-sm font-normal text-green-900/70">لا توجد نتائج مطابقة.</li>}
    </ul>}
  </div>;
}
