import { redirect } from "next/navigation";

export default function SettingsPage(): never {
  redirect("/admin/accounting");
}
