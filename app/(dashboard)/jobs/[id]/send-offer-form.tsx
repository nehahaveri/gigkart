'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Send } from 'lucide-react'
import { submitOffer, type OfferState } from './actions'

export function SendOfferForm({
  jobId,
  suggestedBudget,
}: {
  jobId: string
  suggestedBudget: number
}) {
  const [state, formAction, pending] = useActionState<OfferState, FormData>(submitOffer, {})

  if (state?.success) {
    return (
      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700">
        Offer sent! The poster will review your offer and get back to you.
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-sand-100 bg-white p-5">
      <input type="hidden" name="job_id" value={jobId} />

      <div>
        <label className="block text-sm font-medium text-sand-800 mb-1.5">Your price (INR)</label>
        <div className="relative">
          <span className="absolute left-3 top-2.5 text-sm text-sand-500">₹</span>
          <Input
            type="number"
            name="price"
            defaultValue={suggestedBudget}
            min={1}
            required
            className="pl-7"
          />
        </div>
        {state?.errors?.price && (
          <p className="text-xs text-danger-500 mt-1">{state.errors.price}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-sand-800 mb-1.5">
          Availability <span className="text-sand-500 font-normal">(optional)</span>
        </label>
        <Input name="availability_note" placeholder="e.g. Available tomorrow morning" />
      </div>

      <div>
        <label className="block text-sm font-medium text-sand-800 mb-1.5">
          Message to poster <span className="text-sand-500 font-normal">(optional)</span>
        </label>
        <textarea
          name="message"
          rows={3}
          placeholder="Introduce yourself and explain why you're a good fit…"
          className="flex w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm placeholder:text-sand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyprus-500 resize-y"
        />
      </div>

      {state?.errors?._ && (
        <p className="text-xs text-danger-500">{state.errors._}</p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Send className="h-4 w-4" />
            Send Offer
          </>
        )}
      </Button>
    </form>
  )
}
