'use client'

import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, Shield, LogOut, Trash2, Phone, Mail, User as UserIcon, MapPin, Wallet, AlertTriangle, ChevronRight, CheckCircle2, Clock } from 'lucide-react'
import { updateProfile, signOut, deleteAccount, type SettingsState } from './actions'
import { toast } from 'sonner'
import type { User, KycRequest } from '@/types'

export function SettingsForm({
  profile,
  email,
  phone,
  kycRequest,
}: {
  profile: User | null
  email: string | null
  phone: string | null
  kycRequest: KycRequest | null
}) {
  const [state, formAction, pending] = useActionState<SettingsState, FormData>(updateProfile, {})
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (state?.success) toast.success('Profile updated')
  }, [state?.success])

  return (
    <div className="space-y-6">

      {/* ── Account info ── */}
      <div className="bg-white rounded-2xl border border-sand-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-xl bg-sand-100 flex items-center justify-center">
            <UserIcon className="h-4 w-4 text-sand-600" />
          </div>
          <h2 className="font-semibold text-sand-900">Account</h2>
        </div>
        <div className="space-y-3">
          {phone && (
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-sand-400 shrink-0" />
              <span className="text-sand-700 font-medium">{phone}</span>
            </div>
          )}
          {email && (
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-sand-400 shrink-0" />
              <span className="text-sand-700">{email}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Identity verification ── */}
      <div className="bg-white rounded-2xl border border-sand-200 overflow-hidden">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${profile?.aadhaar_verified ? 'bg-success-50' : 'bg-sand-100'}`}>
              <Shield className={`h-4 w-4 ${profile?.aadhaar_verified ? 'text-success-600' : 'text-sand-500'}`} />
            </div>
            <h2 className="font-semibold text-sand-900">Identity verification</h2>
            {profile?.aadhaar_verified && (
              <Badge variant="success" className="ml-auto">Verified</Badge>
            )}
          </div>
          <p className="text-xs text-sand-500 mt-1 mb-4">
            Verified users get a badge on their profile and are trusted more by posters and taskers.
          </p>

          {profile?.aadhaar_verified ? (
            <div className="flex items-center gap-3 rounded-xl bg-success-50 border border-success-100 p-3">
              <CheckCircle2 className="h-5 w-5 text-success-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-success-700">Your identity is verified</p>
                {profile.aadhaar_last4 && (
                  <p className="text-xs text-success-600 mt-0.5">ID ending ····{profile.aadhaar_last4}</p>
                )}
              </div>
            </div>
          ) : kycRequest?.status === 'pending' ? (
            <div className="flex items-center gap-3 rounded-xl bg-sand-50 border border-sand-200 p-3">
              <Clock className="h-5 w-5 text-sand-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-sand-700">Under review</p>
                <p className="text-xs text-sand-500 mt-0.5">Your documents are being reviewed. Usually 24–48 hours.</p>
              </div>
            </div>
          ) : (
            <Link
              href="/settings/verify"
              className="flex items-center gap-3 rounded-xl border-2 border-dashed border-sand-200 p-4 hover:border-cyprus-200 hover:bg-sand-50 transition-colors group"
            >
              <div className="h-10 w-10 rounded-xl bg-cyprus-50 flex items-center justify-center shrink-0">
                <Shield className="h-5 w-5 text-cyprus-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-sand-900">Verify your identity</p>
                <p className="text-xs text-sand-500 mt-0.5">
                  {kycRequest?.status === 'rejected'
                    ? 'Your last submission was rejected — tap to resubmit'
                    : 'Upload your Aadhaar, passport, or driving licence'}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-sand-400 group-hover:text-cyprus-700 transition-colors" />
            </Link>
          )}

          {kycRequest?.status === 'rejected' && kycRequest.rejection_reason && (
            <div className="mt-3 rounded-xl bg-clay-50 border border-clay-100 p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-clay-500 shrink-0 mt-0.5" />
              <p className="text-xs text-clay-700">{kycRequest.rejection_reason}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Profile form ── */}
      <form action={formAction}>
        <div className="bg-white rounded-2xl border border-sand-200 overflow-hidden">
          {/* Profile section */}
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-8 w-8 rounded-xl bg-sand-100 flex items-center justify-center">
                <UserIcon className="h-4 w-4 text-sand-600" />
              </div>
              <h2 className="font-semibold text-sand-900">Profile</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-sand-800 mb-1.5">Full name</label>
              <Input name="full_name" defaultValue={profile?.full_name ?? ''} required />
              {state?.errors?.full_name && <p className="text-xs text-danger-500 mt-1">{state.errors.full_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-sand-800 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-sand-400" />City
                </span>
              </label>
              <Input name="city" defaultValue={profile?.city ?? ''} required />
              {state?.errors?.city && <p className="text-xs text-danger-500 mt-1">{state.errors.city}</p>}
            </div>
          </div>

          {/* Payouts section */}
          <div className="border-t border-sand-100 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-success-50 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-success-600" />
              </div>
              <div>
                <h2 className="font-semibold text-sand-900 text-sm">Payouts</h2>
                <p className="text-xs text-sand-500">Required to receive payment for completed gigs</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-sand-800 mb-1.5">
                UPI ID
              </label>
              <Input name="upi_id" defaultValue={profile?.upi_id ?? ''} placeholder="yourname@upi" />
              <p className="text-xs text-sand-400 mt-1">e.g. mobile@paytm, name@upi</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-sand-800 mb-1.5">
                Bank account <span className="text-sand-400 font-normal">(optional)</span>
              </label>
              <Input name="bank_account" defaultValue={profile?.bank_account ?? ''} placeholder="Account number" />
            </div>
          </div>

          <div className="border-t border-sand-100 p-5">
            {state?.errors?._ && (
              <div className="flex items-start gap-2 rounded-xl bg-danger-50 border border-danger-500/20 p-3 mb-4 text-sm text-danger-600">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                {state.errors._}
              </div>
            )}
            <Button type="submit" disabled={pending} className="w-full sm:w-auto">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save changes'}
            </Button>
          </div>
        </div>
      </form>

      {/* ── Danger zone ── */}
      <div className="bg-white rounded-2xl border border-danger-100 p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-8 w-8 rounded-xl bg-danger-50 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-danger-500" />
          </div>
          <h2 className="font-semibold text-danger-600">Danger zone</h2>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="outline" className="w-full">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </form>
        {confirmDelete ? (
          <form action={deleteAccount} className="flex gap-2">
            <Button type="submit" variant="destructive" className="flex-1">
              <Trash2 className="h-4 w-4" />
              Confirm delete
            </Button>
            <Button type="button" variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
          </form>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="w-full text-danger-600 hover:bg-danger-50 border-danger-100"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete account
          </Button>
        )}
      </div>
    </div>
  )
}


