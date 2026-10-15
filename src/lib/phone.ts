/** Return Egyptian phone numbers in the canonical 20… digits-only format. */
export function normalizeEgyptianPhone(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `20${digits.slice(1)}`;
  else if (!digits.startsWith("20")) digits = `20${digits}`;
  if (!/^20\d{10}$/.test(digits)) throw new Error("أدخل رقم هاتف مصري صحيحًا.");
  return digits;
}

export function phoneLoginEmail(phone: string): string {
  return `${normalizeEgyptianPhone(phone)}@crest.local`;
}
