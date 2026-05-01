'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const profileSchema = z.object({
  full_name: z.string().min(2),
  city: z.string().min(2),
  upi_id: z.string().optional(),
  bank_account: z.string().optional(),
})

export type SettingsState = {
  errors?: Record<string, string>
  success?: boolean
}

export async function updateProfile(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { errors: { _: 'Not authenticated' } }

  const raw = {
    full_name: formData.get('full_name'),
    city: formData.get('city'),
    upi_id: formData.get('upi_id') || undefined,
    bank_account: formData.get('bank_account') || undefined,
  }

  const parsed = profileSchema.safeParse(raw)
  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const [k, msgs] of Object.entries(parsed.error.flatten().fieldErrors)) {
      errors[k] = msgs[0]
    }
    return { errors }
  }

  const { error } = await supabase
    .from('users')
    .update({
      full_name: parsed.data.full_name,
      city: parsed.data.city,
      upi_id: parsed.data.upi_id ?? null,
      bank_account: parsed.data.bank_account ?? null,
    })
    .eq('id', user.id)

  if (error) return { errors: { _: error.message } }

  revalidatePath('/settings')
  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function deleteAccount() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Soft-delete by anonymizing — actual auth.users delete requires service role
  await supabase
    .from('users')
    .update({
      full_name: '[deleted]',
      avatar_url: null,
      upi_id: null,
      bank_account: null,
    })
    .eq('id', user.id)

  await supabase.auth.signOut()
  redirect('/')
}
