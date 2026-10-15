export type QueuedTrip = {
  id: string;
  operation: "create" | "update";
  owner_id: string;
  engineer_id?: string;
  trip_date?: string;
  supplier_id: string;
  product_id: string;
  factory_id: string | null;
  status: string;
  plate_number: string | null;
  weight_kg: number | null;
  price_per_kg: number | null;
  commission_pct?: number;
  analysis_note?: string | null;
  notes?: string | null;
  photo?: Blob | null;
  photo_blur?: string | null;
};

export type OutboxEntry = {
  id: string;
  trip_id: string;
  owner_id: string;
  payload: QueuedTrip;
  status: "pending" | "failed";
  attempts: number;
  next_attempt_at: number;
  error: string | null;
  created_at: string;
};

export type CacheEntry = { key: string; owner_id: string; kind: string; value: unknown; updated_at: string };
