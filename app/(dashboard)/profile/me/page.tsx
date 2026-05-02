import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'

// /profile/me → redirects to the current user's public profile page.
export default async function MyProfileRedirect() {
  const session = await getSession()
  if (!session) redirect('/login')
  redirect(`/profile/${session.userId}`)
}
