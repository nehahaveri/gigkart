'use client'

import { useActionState, useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, Shield, LogOut, Trash2, Phone, Mail } from 'lucide-react'
import { updateProfile, signOut, deleteAccount, type SettingsState } from './actions'
import { toast } from 'sonner'
import type { User } from '@/types'

export function SettingsForm({
  profile,
  email,
  phone,
}: {
  profile: User | null
  email: string | null
  phone: string | null
}) {
  const [state, formAction, pending] = useActionState<SettingsState, FormData>(updateProfile, {})
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (state?.success) toast.success('Profile updated')
  }, [state?.success])

  return (
    <div className="space-y-6">
      {/* Account info */}
      <Card>
        <CardContent className="p-5">
          <h2 className="font-semibold text-sand-900 mb-3">Account</h2>
          <div className="space-y-2 text-sm">
            {phone && (
              <div className="flex items-center gap-2 text-sand-700">
                <Phone className="h-4 w-4" />
                {phone}
              </div>
            )}
            {email && (
              <div className="flex items-center gap-2 text-sand-700">
                <Mail className="h-4 w-4" />
                {email}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Shield className={profile?.aadhaar_verified ? 'h-4 w-4 text-success-500' : 'h-4 w-4 text-sand-500'} />
              {profile?.aadhaar_verified ? (
                <Badge variant="success">KYC Verified</Badge>
              ) : (
                <Badge variant="warning">KYC Pending</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile form */}
      <form action={formAction}>
        <Card>
          <CardContent className="p-5 space-y-4">
            <h2 className="font-semibold text-sand-900">Profile</h2>

            <div>
              <label className="block text-sm font-medium text-sand-800 mb-1.5">Full name</label>
              <Input name="full_name" defaultValue={profile?.full_name ?? ''} required />
              {state?.errors?.full_name && <p className="text-xs text-danger-500 mt-1">{state.errors.full_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-sand-800 mb-1.5">City</label>
              <Input name="city" defaultValue={profile?.city ?? ''} required />
              {state?.errors?.city && <p className="text-xs text-danger-500 mt-1">{state.errors.city}</p>}
            </div>

            <h3 className="font-semibold text-sand-900 pt-4 border-t border-sand-100">Payouts</h3>

            <div>
              <label className="block text-sm font-medium text-sand-800 mb-1.5">UPI ID</label>
              <Input name="upi_id" defaultValue={profile?.upi_id ?? ''} placeholder="yourname@upi" />
            </div>

            <div>
              <label className="block text-sm font-medium text-sand-800 mb-1.5">
                Bank account <span className="text-sand-500 font-normal">(optional)</span>
              </label>
              <Input name="bank_account" defaultValue={profile?.bank_account ?? ''} placeholder="Account number" />
            </div>

            {state?.errors?._ && <p className="text-xs text-danger-500">{state.errors._}</p>}

            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save changes'}
            </Button>
          </CardContent>
        </Card>
      </form>

      {/* Danger zone */}
      <Card className="border-danger-50">
        <CardContent className="p-5 space-y-3">
          <h2 className="font-semibold text-danger-600">Danger zone</h2>
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
              className="w-full text-danger-600 hover:bg-red-50 border-red-200"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete account
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
