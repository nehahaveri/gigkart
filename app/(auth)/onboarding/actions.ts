'use server'

import { execute } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const posterSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  city: z.string().min(2, 'City is required'),
})

const taskerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  city: z.string().min(2, 'City is required'),
  skills: z.array(z.string()).min(1, 'Select at least one skill'),
  upi_id: z.string().min(5, 'Enter a valid UPI ID').optional().or(z.literal('')),
})

export async function completeOnboarding(
  _prev: unknown,
  formData: FormData
): Promise<{ errors?: Record<string, string> }> {
  const session = await getSession()
  if (!session) return { errors: { _: 'Not authenticated' } }

  const role = formData.get('role') as string

  if (role === 'poster') {
    const raw = {
      full_name: formData.get('full_name') as string,
      city: formData.get('city') as string,
    }
    const parsed = posterSchema.safeParse(raw)
    if (!parsed.success) {
      const errors: Record<string, string> = {}
      for (const [key, msgs] of Object.entries(parsed.error.flatten().fieldErrors)) {
        errors[key] = msgs[0]
      }
      return { errors }
    }
    await execute(
      `UPDATE users SET full_name = $1, city = $2, role = $3, skills = $4 WHERE id = $5`,
      [parsed.data.full_name, parsed.data.city, ['poster'], [], session.userId]
    )
  } else {
    const skillsRaw = formData.get('skills') as string
    const raw = {
      full_name: formData.get('full_name') as string,
      city: formData.get('city') as string,
      skills: skillsRaw ? JSON.parse(skillsRaw) : [],
      upi_id: formData.get('upi_id') as string,
    }
    const parsed = taskerSchema.safeParse(raw)
    if (!parsed.success) {
      const errors: Record<string, string> = {}
      for (const [key, msgs] of Object.entries(parsed.error.flatten().fieldErrors)) {
        errors[key] = msgs[0]
      }
      return { errors }
    }
    const dbRole = role === 'both' ? ['poster', 'tasker'] : ['tasker']
    await execute(
      `UPDATE users
         SET full_name = $1, city = $2, skills = $3, upi_id = $4, role = $5
       WHERE id = $6`,
      [
        parsed.data.full_name,
        parsed.data.city,
        parsed.data.skills,
        parsed.data.upi_id || null,
        dbRole,
        session.userId,
      ]
    )
  }

  redirect('/dashboard')
}
