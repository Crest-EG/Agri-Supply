export async function timeSupabase<T>(name: string, request: PromiseLike<T>): Promise<T> {
  if (process.env.SUPABASE_TIMING !== "1") return request;
  const startedAt = performance.now();
  try {
    return await request;
  } finally {
    console.info(`[supabase-timing] ${name} ${(performance.now() - startedAt).toFixed(1)}ms`);
  }
}
