'use server'

import { execute, queryOne } from '@/lib/db'
import { getSession, destroySession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const profileSchema = z.object({
  full_name:    z.string().min(2),
  city:         z.string().min(2),
  upi_id:       z.string().optional(),
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
  const session = await getSession()
  if (!session) return { errors: { _: 'Not authenticated' } }

  const raw = {
    full_name:    formData.get('full_name'),
    city:         formData.get('city'),
    upi_id:       formData.get('upi_id') || undefined,
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

  await execute(
    `UPDATE users
       SET full_name = $1, city = $2, upi_id = $3, bank_account = $4
     WHERE id = $5`,
    [
      parsed.data.full_name,
      parsed.data.city,
      parsed.data.upi_id ?? null,
      parsed.data.bank_account ?? null,
      session.userId,
    ]
  )

  revalidatePath('/settings')
  return { success: true }
}

export async function signOut() {
  await destroySession()
  redirect('/login')
}

export async function deleteAccount() {
  const session = await getSession()
  if (!session) redirect('/login')

  // Anonymise the record — preserves referential integrity
  await execute(
    `UPDATE users
       SET full_name = '[deleted]', email = $1,
           avatar_url = NULL, upi_id = NULL, bank_account = NULL,
           password_hash = ''
     WHERE id = $2`,
    [`deleted_${session.userId}@gigkart.local`, session.userId]
  )

  await destroySession()
  redirect('/')
}
