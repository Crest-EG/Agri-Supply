"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/dialog";
import { TripForm } from "@/app/trips/new/trip-form";

type Choice = { id: string; name: string; state?: string };
export function TripCreateDialog({ suppliers, products, factories, supplierLinks, factoryLinks, ownerId, defaultCommissionPct }: { suppliers: Choice[]; products: Choice[]; factories: Choice[]; supplierLinks: { supplier_id: string; product_id: string }[]; factoryLinks: { factory_id: string; product_id: string }[]; ownerId: string; defaultCommissionPct: number }) {
  const [open, setOpen] = useState(false);
  return <Dialog open={open} onOpenChange={setOpen} title="إنشاء رحلة جديدة" trigger={<button type="button" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-green-700 bg-white px-5 font-bold text-green-900 hover:bg-green-50"><Plus aria-hidden size={18} />رحلة جديدة</button>}>
    <TripForm modal onSaved={() => setOpen(false)} suppliers={suppliers} products={products} factories={factories} supplierLinks={supplierLinks} factoryLinks={factoryLinks} ownerId={ownerId} defaultCommissionPct={defaultCommissionPct} />
  </Dialog>;
}
