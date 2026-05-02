'use client'

import { useActionState, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { Loader2, Upload, X, AlertTriangle } from 'lucide-react'
import { submitDispute, type DisputeState } from './actions'

const REASONS = [
  'Work not completed',
  'Poor quality work',
  'Tasker didn\'t show up',
  'Damaged property',
  'Poster refuses to pay',
  'Other',
]

export function DisputeForm({ jobId, userId }: { jobId: string; userId: string }) {
  const [state, formAction, pending] = useActionState<DisputeState, FormData>(submitDispute, {})
  const [reason, setReason] = useState('')
  const [previews, setPreviews] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    const newPreviews: string[] = []
    Array.from(files).slice(0, 5 - previews.length).forEach((f) => {
      newPreviews.push(URL.createObjectURL(f))
    })
    setPreviews((prev) => [...prev, ...newPreviews].slice(0, 5))
  }

  if (state?.success) {
    return (
      <div className="rounded-xl bg-clay-50 border border-clay-100 p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-clay-400 mx-auto mb-3" />
        <h2 className="font-semibold text-sand-900 mb-1">Dispute submitted</h2>
        <p className="text-sm text-sand-700">
          Our team will review the evidence and get back to both parties within 24-48 hours.
          The escrow payment has been frozen.
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="job_id" value={jobId} />
      <input type="hidden" name="raised_by" value={userId} />
      <input type="hidden" name="reason" value={reason} />

      {/* Reason */}
      <div>
        <label className="block text-sm font-medium text-sand-800 mb-2">What went wrong?</label>
        <div className="space-y-2">
          {REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className={cn(
                'w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors',
                reason === r
                  ? 'border-danger-500 bg-red-50 text-danger-600'
                  : 'border-sand-100 text-sand-800 hover:border-sand-200'
              )}
            >
              {r}
            </button>
          ))}
        </div>
        {state?.errors?.reason && (
          <p className="text-xs text-danger-500 mt-1">{state.errors.reason}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-sand-800 mb-1.5">
          Describe the issue in detail
        </label>
        <textarea
          name="description"
          rows={4}
          required
          placeholder="Explain what happened, when, and what you expected…"
          className="flex w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm placeholder:text-sand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-500 resize-y"
        />
        {state?.errors?.description && (
          <p className="text-xs text-danger-500 mt-1">{state.errors.description}</p>
        )}
      </div>

      {/* Evidence */}
      <div>
        <label className="block text-sm font-medium text-sand-800 mb-1.5">
          Evidence <span className="text-sand-500 font-normal">(photos/screenshots, max 5)</span>
        </label>
        <div className="flex gap-3 flex-wrap">
          {previews.map((src, i) => (
            <div key={i} className="relative h-16 w-16 rounded-xl overflow-hidden border border-sand-200">
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setPreviews((p) => p.filter((_, j) => j !== i))}
                className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5"
              >
                <X className="h-2.5 w-2.5 text-white" />
              </button>
            </div>
          ))}
          {previews.length < 5 && (
            <label className="h-16 w-16 rounded-xl border-2 border-dashed border-sand-200 flex items-center justify-center cursor-pointer hover:border-sand-300">
              <Upload className="h-4 w-4 text-sand-500" />
              <input
                ref={fileRef}
                type="file"
                name="evidence"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFiles}
              />
            </label>
          )}
        </div>
      </div>

      {state?.errors?._ && (
        <p className="text-sm text-danger-500">{state.errors._}</p>
      )}

      <Button type="submit" variant="destructive" className="w-full" disabled={pending || !reason}>
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <AlertTriangle className="h-4 w-4" />
            Submit Dispute
          </>
        )}
      </Button>
    </form>
  )
}
