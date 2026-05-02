'use server'

import { createClient } from '@/lib/supabase/server'
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
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { errors: { _: 'Not authenticated' } }

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
    const { error } = await supabase
      .from('users')
      .update({ full_name: parsed.data.full_name, city: parsed.data.city, role: ['poster'], skills: [] })
      .eq('id', user.id)
    if (error) return { errors: { _: error.message } }
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
    const { error } = await supabase
      .from('users')
      .update({
        full_name: parsed.data.full_name,
        city: parsed.data.city,
        skills: parsed.data.skills,
        ...(parsed.data.upi_id ? { upi_id: parsed.data.upi_id } : {}),
        role: dbRole,
      })
      .eq('id', user.id)
    if (error) return { errors: { _: error.message } }
  }

  redirect('/dashboard')
}

