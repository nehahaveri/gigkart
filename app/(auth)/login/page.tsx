import type { Metadata } from 'next'
import { LoginForm } from './login-form'
import { Briefcase } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Log in',
  description: 'Log in to GigKart with your phone number or Google account.',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-sand-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl text-cyprus-700">
            <Briefcase className="h-6 w-6" />
            GigKart
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-sand-900">Welcome back</h1>
          <p className="mt-1 text-sm text-sand-500">Sign in to your account</p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-xs text-sand-500">
          By continuing, you agree to our{' '}
          <Link href="/" className="underline">Terms</Link> and{' '}
          <Link href="/" className="underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}
