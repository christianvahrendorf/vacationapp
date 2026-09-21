import { createClient } from "@/lib/supabase/server";

// Pinged daily by a Vercel Cron Job (see vercel.json) so the project
// registers regular API activity and Supabase's free-tier auto-pause
// (projects idle for 7 days get paused) never kicks in. The query
// itself doesn't need to return data — just reach the database.
export async function GET() {
  const supabase = await createClient();
  await supabase.from("profiles").select("id").limit(1);

  return Response.json({ ok: true, checkedAt: new Date().toISOString() });
}
