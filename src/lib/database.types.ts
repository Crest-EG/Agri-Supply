export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Relationship<FK extends string, Columns extends string[], One extends string, IsOne extends boolean = false> = {
  foreignKeyName: FK;
  columns: Columns;
  isOneToOne: IsOne;
  referencedRelation: One;
  referencedColumns: string[];
};

type Table<Row, Insert, Update, Relations extends Relationship<string, string[], string, boolean>[] = []> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: Relations;
};

type Profile = { id: string; full_name: string; phone: string; role: Database["public"]["Enums"]["user_role"]; is_active: boolean; created_at: string; updated_at: string };
type Product = { id: string; name: string; state: Database["public"]["Enums"]["product_state"]; is_active: boolean; created_at: string };
type ProductPrice = { id: string; product_id: string; price_date: string; price_per_kg: number; created_by: string | null; created_at: string };
type Supplier = { id: string; name: string; phone: string | null; address: string | null; notes: string | null; is_active: boolean; created_by: string | null; created_at: string; updated_at: string };
type Factory = { id: string; name: string; phone: string | null; address: string | null; notes: string | null; is_active: boolean; created_at: string; updated_at: string };
type Trip = {
  id: string; trip_no: number; trip_date: string; engineer_id: string; supplier_id: string; product_id: string; factory_id: string | null;
  status: Database["public"]["Enums"]["trip_status"]; plate_number: string | null; photo_path: string | null; photo_blur: string | null;
  weight_kg: number | null; price_per_kg: number | null; commission_pct: number; analysis_note: string | null; notes: string | null;
  gross_amount: number | null; commission_amount: number | null; supplier_payable: number | null; created_at: string; updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile, Pick<Profile, "id" | "full_name" | "phone"> & Partial<Pick<Profile, "role" | "is_active">>, Partial<Omit<Profile, "id" | "created_at">>>;
      settings: Table<{ id: boolean; default_commission_pct: number; updated_at: string }, { id?: boolean; default_commission_pct?: number; updated_at?: string }, Partial<{ id: boolean; default_commission_pct: number; updated_at: string }>>;
      products: Table<Product, { id?: string; name: string; state: Product["state"]; is_active?: boolean; created_at?: string }, Partial<Omit<Product, "id" | "created_at">>>;
      product_prices: Table<ProductPrice, { id?: string; product_id: string; price_date?: string; price_per_kg: number; created_by?: string | null; created_at?: string }, Partial<Omit<ProductPrice, "id" | "created_at">>, [Relationship<"product_prices_product_id_fkey", ["product_id"], "products">, Relationship<"product_prices_created_by_fkey", ["created_by"], "profiles">]>;
      suppliers: Table<Supplier, { id?: string; name: string; phone?: string | null; address?: string | null; notes?: string | null; is_active?: boolean; created_by?: string | null; created_at?: string; updated_at?: string }, Partial<Omit<Supplier, "id" | "created_at">>, [Relationship<"suppliers_created_by_fkey", ["created_by"], "profiles">]>;
      factories: Table<Factory, { id?: string; name: string; phone?: string | null; address?: string | null; notes?: string | null; is_active?: boolean; created_at?: string; updated_at?: string }, Partial<Omit<Factory, "id" | "created_at">>>;
      supplier_products: Table<{ supplier_id: string; product_id: string }, { supplier_id: string; product_id: string }, Partial<{ supplier_id: string; product_id: string }>, [Relationship<"supplier_products_supplier_id_fkey", ["supplier_id"], "suppliers">, Relationship<"supplier_products_product_id_fkey", ["product_id"], "products">]>;
      factory_products: Table<{ factory_id: string; product_id: string }, { factory_id: string; product_id: string }, Partial<{ factory_id: string; product_id: string }>, [Relationship<"factory_products_factory_id_fkey", ["factory_id"], "factories">, Relationship<"factory_products_product_id_fkey", ["product_id"], "products">]>;
      trips: Table<Trip,
        { id: string; trip_date?: string; engineer_id: string; supplier_id: string; product_id: string; factory_id?: string | null; status?: Trip["status"]; plate_number?: string | null; photo_path?: string | null; photo_blur?: string | null; weight_kg?: number | null; price_per_kg?: number | null; commission_pct?: number; analysis_note?: string | null; notes?: string | null; created_at?: string; updated_at?: string },
        Partial<Omit<Trip, "id" | "trip_no" | "created_at" | "gross_amount" | "commission_amount" | "supplier_payable">>,
        [Relationship<"trips_engineer_id_fkey", ["engineer_id"], "profiles">, Relationship<"trips_supplier_id_fkey", ["supplier_id"], "suppliers">, Relationship<"trips_product_id_fkey", ["product_id"], "products">, Relationship<"trips_factory_id_fkey", ["factory_id"], "factories">]>;
    };
    Views: {
      product_current_price: { Row: { product_id: string; name: string; state: Product["state"]; price_per_kg: number | null; price_date: string | null; is_today: boolean | null; days_old: number | null }; Relationships: [] };
      trips_accounting: { Row: { id: string; trip_no: number; trip_date: string; status: Trip["status"]; engineer_id: string; engineer_name: string; supplier_id: string; supplier_name: string; factory_id: string | null; factory_name: string | null; product_id: string; product_name: string; product_state: Product["state"]; weight_kg: number | null; price_per_kg: number | null; commission_pct: number; gross_amount: number | null; commission_amount: number | null; supplier_payable: number | null }; Relationships: [] };
    };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_active_user: { Args: Record<string, never>; Returns: boolean };
      set_updated_at: { Args: Record<string, never>; Returns: unknown };
      trips_default_commission: { Args: Record<string, never>; Returns: unknown };
      trips_guard_engineer: { Args: Record<string, never>; Returns: unknown };
    };
    Enums: { user_role: "admin" | "engineer"; trip_status: "loaded" | "in_transit" | "arrived" | "factory_accepted" | "analysis_accepted" | "analysis_rejected" | "rejected"; product_state: "fresh" | "frozen" };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
