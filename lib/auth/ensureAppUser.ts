import { User } from "@supabase/supabase-js"

import supabaseAdmin from "@/lib/supabase/supabaseAdmin"

export type AppAuthProvider = "credentials" | "github" | "google"

function getAvatarUrl(user: Pick<User, "identities" | "user_metadata">) {
  const metadataAvatar =
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    user.user_metadata?.photo_url ||
    user.user_metadata?.image

  if (metadataAvatar) return metadataAvatar as string

  for (const identity of user.identities ?? []) {
    const identityAvatar = identity.identity_data?.avatar_url || identity.identity_data?.picture
    if (identityAvatar) return identityAvatar as string
  }

  return null
}

function getUniqueProviders(providers: string[]) {
  return Array.from(new Set(providers.filter(Boolean)))
}

export async function ensureAppUser(user: User, provider: AppAuthProvider): Promise<string | null> {
  if (!user.id || !user.email) return "Authenticated user is missing required fields"

  const { data: userById, error: userByIdError } = await supabaseAdmin
    .from("29_users")
    .select("id, email, avatar_url, providers")
    .eq("id", user.id)
    .maybeSingle()
  if (userByIdError) return userByIdError.message

  const { data: userByEmail, error: userByEmailError } = userById
    ? { data: null, error: null }
    : await supabaseAdmin
        .from("29_users")
        .select("id, email, avatar_url, providers")
        .eq("email", user.email)
        .maybeSingle()
  if (userByEmailError) return userByEmailError.message

  const existingUser = userById || userByEmail
  const avatarUrl = getAvatarUrl(user)

  if (!existingUser) {
    const { error: insertError } = await supabaseAdmin.from("29_users").insert({
      id: user.id,
      email: user.email,
      avatar_url: avatarUrl,
      providers: [provider],
    })

    return insertError?.message ?? null
  }

  const nextProviders = getUniqueProviders([...(existingUser.providers ?? []), provider])
  const nextAvatarUrl = existingUser.avatar_url || avatarUrl
  const shouldUpdateProviders =
    nextProviders.length !== (existingUser.providers ?? []).length ||
    nextProviders.some((providerItem, index) => providerItem !== existingUser.providers?.[index])

  if (!shouldUpdateProviders && nextAvatarUrl === existingUser.avatar_url && existingUser.email === user.email)
    return null

  const { error: updateError } = await supabaseAdmin
    .from("29_users")
    .update({
      email: user.email,
      avatar_url: nextAvatarUrl,
      providers: nextProviders,
    })
    .eq("id", existingUser.id)

  return updateError?.message ?? null
}
