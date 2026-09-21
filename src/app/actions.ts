"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findDestinationImage } from "@/lib/destination-image";

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

  const imageUrl = await findDestinationImage(title);

  await supabase.from("destinations").insert({
    title,
    description: description || null,
    created_by: user.id,
    image_url: imageUrl,
  });

  revalidatePath("/");
}

export async function updateDestination(destinationId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("destinations")
    .select("title, image_url")
    .eq("id", destinationId)
    .single();

  const imageUrl =
    existing && existing.title !== title
      ? await findDestinationImage(title)
      : (existing?.image_url ?? null);

  await supabase
    .from("destinations")
    .update({ title, description: description || null, image_url: imageUrl })
    .eq("id", destinationId);

  revalidatePath("/");
}

export async function deleteDestination(destinationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("destinations").delete().eq("id", destinationId);

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
