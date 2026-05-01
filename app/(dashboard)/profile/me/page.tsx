import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// /profile/me → redirects to the current user's public profile page.
export default async function MyProfileRedirect() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  redirect(`/profile/${user.id}`)
}
