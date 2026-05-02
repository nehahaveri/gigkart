'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { Star, Loader2, Send } from 'lucide-react'
import { submitReview, type ReviewState } from './actions'

function StarRating({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (v: number) => void
  label: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-sand-800">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="p-0.5"
          >
            <Star
              className={cn(
                'h-5 w-5 transition-colors',
                n <= value
                  ? 'text-gold-400 fill-gold-400'
                  : 'text-sand-200'
              )}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export function RatingForm({
  jobId,
  reviewerId,
  revieweeId,
  revieweeName,
}: {
  jobId: string
  reviewerId: string
  revieweeId: string
  revieweeName: string
}) {
  const [state, formAction, pending] = useActionState<ReviewState, FormData>(submitReview, {})
  const [overall, setOverall] = useState(0)
  const [quality, setQuality] = useState(0)
  const [punctuality, setPunctuality] = useState(0)
  const [communication, setCommunication] = useState(0)
  const [rehire, setRehire] = useState(false)

  if (state?.success) {
    return (
      <div className="rounded-xl bg-cyprus-50 border border-cyprus-100 p-6 text-center">
        <Star className="h-8 w-8 text-gold-400 fill-gold-400 mx-auto mb-3" />
        <h2 className="font-semibold text-sand-900 mb-1">Review submitted!</h2>
        <p className="text-sm text-sand-700">
          It will be revealed once {revieweeName} also submits their review.
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5 bg-white rounded-2xl border border-sand-100 shadow-sm p-6">
      <input type="hidden" name="job_id" value={jobId} />
      <input type="hidden" name="reviewer_id" value={reviewerId} />
      <input type="hidden" name="reviewee_id" value={revieweeId} />
      <input type="hidden" name="overall_rating" value={overall} />
      <input type="hidden" name="quality_rating" value={quality} />
      <input type="hidden" name="punctuality_rating" value={punctuality} />
      <input type="hidden" name="communication_rating" value={communication} />
      <input type="hidden" name="rehire_flag" value={rehire ? '1' : '0'} />

      <p className="text-sm text-sand-700">
        Rate <span className="font-semibold">{revieweeName}</span>
      </p>

      <div className="space-y-3">
        <StarRating value={overall} onChange={setOverall} label="Overall" />
        <StarRating value={quality} onChange={setQuality} label="Quality" />
        <StarRating value={punctuality} onChange={setPunctuality} label="Punctuality" />
        <StarRating value={communication} onChange={setCommunication} label="Communication" />
      </div>

      {state?.errors?.overall_rating && (
        <p className="text-xs text-danger-500">{state.errors.overall_rating}</p>
      )}

      {/* Rehire toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setRehire(!rehire)}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            rehire ? 'bg-success-500' : 'bg-sand-200'
          )}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 rounded-full bg-white transition-transform',
              rehire ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>
        <span className="text-sm text-sand-800">Would hire/work with again</span>
      </div>

      {/* Text review */}
      <div>
        <label className="block text-sm font-medium text-sand-800 mb-1.5">
          Written review <span className="text-sand-500 font-normal">(optional)</span>
        </label>
        <textarea
          name="text"
          rows={3}
          placeholder="Share your experience…"
          className="flex w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm placeholder:text-sand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyprus-500 resize-y"
        />
      </div>

      {state?.errors?._ && <p className="text-xs text-danger-500">{state.errors._}</p>}

      <Button type="submit" className="w-full" disabled={pending || overall === 0}>
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Send className="h-4 w-4" />
            Submit Review
          </>
        )}
      </Button>

      <p className="text-xs text-sand-500 text-center">
        Reviews are revealed simultaneously — neither party sees the other&apos;s review until both submit.
      </p>
    </form>
  )
}
