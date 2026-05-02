'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils/cn'
import { signInWithPassword, signUpWithPassword } from './actions'
import { Loader2, Mail, Lock, ArrowRight, CheckCircle } from 'lucide-react'

type Mode = 'login' | 'signup'

export function LoginForm() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [signupSuccess, setSignupSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setPending(true)

    if (mode === 'signup') {
      const result = await signUpWithPassword(email, password)
      setPending(false)
      if (result.error) {
        toast.error(result.error)
        return
      }
      if (result.needsConfirmation) {
        setSignupSuccess(true)
        toast.info('Check your inbox to confirm your email — or disable email confirmation in Supabase dashboard for instant access.')
        return
      }
      toast.success('Account created!')
      router.push(result.redirect ?? '/onboarding')
    } else {
      const result = await signInWithPassword(email, password)
      setPending(false)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Logged in!')
      router.push(result.redirect ?? '/dashboard')
    }
  }

  if (signupSuccess) {
    return (
      <div className="bg-white rounded-2xl border border-sand-100 shadow-lg p-8 text-center space-y-3">
        <div className="h-14 w-14 rounded-full bg-success-50 flex items-center justify-center mx-auto">
          <CheckCircle className="h-7 w-7 text-success-600" />
        </div>
        <h2 className="font-semibold text-lg text-sand-900">Account created!</h2>
        <p className="text-sm text-sand-500">
          Check <span className="font-medium text-sand-800">{email}</span> for a confirmation link.
        </p>
        <p className="text-xs text-sand-500">
          Or disable email confirmation in Supabase Dashboard →{' '}
          <span className="font-mono">Auth → Providers</span> for instant access.
        </p>
        <Button
          variant="outline"
          className="w-full mt-3"
          onClick={() => { setSignupSuccess(false); setMode('login') }}
        >
          Back to login
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-sand-100 shadow-lg p-7 space-y-5">
      {/* Mode tabs */}
      <div className="flex gap-1 p-1 bg-sand-100/80 rounded-xl">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={cn(
            'flex-1 py-2 rounded-lg text-sm font-semibold transition-all',
            mode === 'login' ? 'bg-white shadow-sm text-sand-900' : 'text-sand-500 hover:text-sand-800'
          )}
        >
          Log in
        </button>
        <button
          type="button"
          onClick={() => setMode('signup')}
          className={cn(
            'flex-1 py-2 rounded-lg text-sm font-semibold transition-all',
            mode === 'signup' ? 'bg-white shadow-sm text-sand-900' : 'text-sand-500 hover:text-sand-800'
          )}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-sand-800 mb-1.5">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-sand-500" />
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-10 h-11"
              autoComplete="email"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-sand-800 mb-1.5">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-sand-500" />
            <Input
              type="password"
              placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="pl-10 h-11"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {mode === 'login' ? 'Log in' : 'Create account'}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <p className="text-xs text-sand-500 text-center pt-1">
        {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
        <button
          type="button"
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="text-cyprus-700 hover:text-cyprus-800 hover:underline font-semibold"
        >
          {mode === 'login' ? 'Sign up free' : 'Log in'}
        </button>
      </p>
    </div>
  )
}
