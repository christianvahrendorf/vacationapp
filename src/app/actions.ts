"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function addDestination(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("destinations").insert({
    title,
    description: description || null,
    created_by: user.id,
  });

  revalidatePath("/");
}

export async function castVote(destinationId: string, score: number) {
  if (score < 1 || score > 5) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("votes")
    .upsert(
      { destination_id: destinationId, user_id: user.id, score },
      { onConflict: "destination_id,user_id" }
    );

  revalidatePath("/");
}
