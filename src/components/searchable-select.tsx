"use client";

import { useEffect, useId, useState } from "react";

export type SearchOption = { id: string; label: string };

export function SearchableSelect({ label, name, options, initialId = "", onChange }: { label: string; name: string; options: SearchOption[]; initialId?: string; onChange?: (id: string) => void }) {
  const listId = useId();
  const [selectedId, setSelectedId] = useState(initialId);
  const [text, setText] = useState(options.find((option) => option.id === initialId)?.label ?? "");

  useEffect(() => {
    const selected = options.find((option) => option.id === selectedId);
    if (selectedId && !selected) {
      setSelectedId("");
      setText("");
      onChange?.("");
    } else if (selected) setText(selected.label);
  }, [options, selectedId, onChange]);

  function update(value: string) {
    setText(value);
    const option = options.find((item) => item.label === value);
    const id = option?.id ?? "";
    setSelectedId(id);
    onChange?.(id);
  }

  return <label className="block text-sm font-semibold">{label}
    <input list={listId} value={text} onChange={(event) => update(event.target.value)} autoComplete="off" className="mt-2 w-full rounded-xl border border-green-100 bg-white ps-4 pe-4 py-3" placeholder="ابحث واختر من القائمة" />
    <datalist id={listId}>{options.map((option) => <option key={option.id} value={option.label} />)}</datalist>
    <input type="hidden" name={name} value={selectedId} />
  </label>;
}
