"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findDestinationImage } from "@/lib/destination-image";
import { findDestinationClimate } from "@/lib/destination-climate";

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

  const [imageUrl, climate] = await Promise.all([
    findDestinationImage(title),
    findDestinationClimate(title),
  ]);

  await supabase.from("destinations").insert({
    title,
    description: description || null,
    created_by: user.id,
    image_url: imageUrl,
    climate,
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
    .select("title, image_url, climate")
    .eq("id", destinationId)
    .single();

  const titleChanged = existing && existing.title !== title;
  const [imageUrl, climate] = titleChanged
    ? await Promise.all([findDestinationImage(title), findDestinationClimate(title)])
    : [existing?.image_url ?? null, existing?.climate ?? null];

  await supabase
    .from("destinations")
    .update({ title, description: description || null, image_url: imageUrl, climate })
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

export async function toggleParticipant(destinationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("participants")
    .select("id")
    .eq("destination_id", destinationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("participants").delete().eq("id", existing.id);
  } else {
    await supabase
      .from("participants")
      .insert({ destination_id: destinationId, user_id: user.id });
  }

  revalidatePath("/");
}

export async function addComment(destinationId: string, formData: FormData) {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("comments")
    .insert({ destination_id: destinationId, user_id: user.id, body });

  revalidatePath("/");
}

export async function deleteComment(commentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("comments").delete().eq("id", commentId);

  revalidatePath("/");
}
