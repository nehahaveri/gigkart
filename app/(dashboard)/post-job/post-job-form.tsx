'use client'

import { useActionState, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils/cn'
import { JOB_CATEGORIES } from '@/types'
import { createJob, type PostJobState } from './actions'
import {
  Loader2, MapPin, Upload, X, Zap, Shield, Clock, IndianRupee,
  FileText, Tag, Calendar, Wallet, Settings2,
} from 'lucide-react'

const DURATION_OPTIONS = [
  { value: 'few_hours', label: 'Few hours' },
  { value: '1_day', label: '1 day' },
  { value: '2_3_days', label: '2-3 days' },
  { value: '1_week', label: '1 week' },
  { value: 'single_task', label: 'Single task' },
  { value: 'recurring', label: 'Recurring' },
]

const BUDGET_TYPES = [
  { value: 'fixed', label: 'Fixed price' },
  { value: 'hourly', label: 'Hourly rate' },
  { value: 'negotiable', label: 'Negotiable' },
]

const PAYMENT_MODES = [
  { value: 'escrow', label: 'Escrow', desc: 'Held until you approve', icon: Shield },
  { value: 'upfront', label: 'Upfront', desc: 'Paid before work starts', icon: IndianRupee },
  { value: '50_50_split', label: '50-50', desc: 'Half now, half after', icon: Clock },
]

const CATEGORY_ICONS: Record<string, string> = {
  Cleaning: '🧹', Delivery: '📦', Tutoring: '📚',
  Repairs: '🔧', Cooking: '🍳', 'Personal Care': '💆',
  Moving: '🚚', Other: '✨',
}

function FieldError({ error }: { error?: string }) {
  if (!error) return null
  return <p className="text-xs text-danger-500 mt-1">{error}</p>
}

const STEPS: { step: number; label: string; icon: React.ElementType }[] = [
  { step: 1, label: 'Job details', icon: FileText },
  { step: 2, label: 'Timing', icon: Calendar },
  { step: 3, label: 'Location', icon: MapPin },
  { step: 4, label: 'Budget & Payment', icon: Wallet },
  { step: 5, label: 'Preferences', icon: Settings2 },
]

function SectionHeading({ step, label, icon: Icon }: { step: number; label: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-3 pt-6 pb-2 border-t border-sand-100">
      <div className="h-7 w-7 rounded-full bg-cyprus-700 text-white flex items-center justify-center text-xs font-bold shrink-0">{step}</div>
      <div className="flex items-center gap-1.5">
        <Icon className="h-4 w-4 text-sand-500" />
        <h2 className="font-semibold text-sand-900 text-sm">{label}</h2>
      </div>
    </div>
  )
}

export function PostJobForm() {
  const [state, formAction, pending] = useActionState<PostJobState, FormData>(createJob, {})
  const errors = state?.errors ?? {}

  const [category, setCategory] = useState('')
  const [durationType, setDurationType] = useState('few_hours')
  const [budgetType, setBudgetType] = useState('fixed')
  const [paymentMode, setPaymentMode] = useState('escrow')
  const [isRemote, setIsRemote] = useState(false)
  const [isUrgent, setIsUrgent] = useState(false)
  const [genderPref, setGenderPref] = useState('any')
  const [previews, setPreviews] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    const newPreviews: string[] = []
    Array.from(files).slice(0, 3 - previews.length).forEach((f) => {
      newPreviews.push(URL.createObjectURL(f))
    })
    setPreviews((prev) => [...prev, ...newPreviews].slice(0, 3))
  }

  function removePhoto(index: number) {
    setPreviews((prev) => prev.filter((_, i) => i !== index))
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <form action={formAction} className="space-y-5">
      {/* Test mode banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-clay-100 bg-clay-50 p-4">
        <Zap className="h-4 w-4 text-clay-500 flex-shrink-0 mt-0.5" />
        <div className="text-xs">
          <div className="font-semibold text-clay-700">Test mode — payments simulated</div>
          <div className="text-clay-600 mt-0.5">No real money moves until Razorpay keys are configured.</div>
        </div>
      </div>

      <div className="flex items-center gap-3 pb-2">
        <div className="h-7 w-7 rounded-full bg-cyprus-700 text-white flex items-center justify-center text-xs font-bold shrink-0">1</div>
        <div className="flex items-center gap-1.5">
          <FileText className="h-4 w-4 text-sand-500" />
          <h2 className="font-semibold text-sand-900 text-sm">Job details</h2>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-sand-800 mb-1.5">
          Job title
        </label>
        <Input name="title" placeholder="e.g. Deep clean 2BHK apartment" required />
        <FieldError error={errors.title} />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-sand-800 mb-1.5">
          Category
        </label>
        <input type="hidden" name="category" value={category} />
        <div className="flex flex-wrap gap-2">
          {JOB_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                category === cat
                  ? 'bg-cyprus-700 text-white border-cyprus-700'
                  : 'bg-white text-sand-700 border-sand-200 hover:border-sand-300'
              )}
            >
              <span>{CATEGORY_ICONS[cat] ?? '✨'}</span>{cat}
            </button>
          ))}
        </div>
        <FieldError error={errors.category} />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-sand-800 mb-1.5">
          Description
        </label>
        <textarea
          name="description"
          rows={4}
          placeholder="Describe the task in detail — what needs to be done, any tools/materials needed, special instructions…"
          required
          className="flex w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm placeholder:text-sand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyprus-500 resize-y"
        />
        <FieldError error={errors.description} />
      </div>

      {/* Photos */}
      <div>
        <label className="block text-sm font-medium text-sand-800 mb-1.5">
          Photos <span className="text-sand-500 font-normal">(max 3)</span>
        </label>
        <div className="flex gap-3 flex-wrap">
          {previews.map((src, i) => (
            <div key={i} className="relative h-20 w-20 rounded-xl overflow-hidden border border-sand-200">
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
          {previews.length < 3 && (
            <label className="h-20 w-20 rounded-xl border-2 border-dashed border-sand-200 flex flex-col items-center justify-center cursor-pointer hover:border-sand-300 transition-colors">
              <Upload className="h-4 w-4 text-sand-500" />
              <span className="text-xs text-sand-500 mt-1">Add</span>
              <input
                ref={fileRef}
                type="file"
                name="photos"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handlePhotos}
              />
            </label>
          )}
        </div>
      </div>

      <SectionHeading step={2} label="Timing" icon={Calendar} />

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium text-sand-800 mb-1.5">
          Duration
        </label>
        <input type="hidden" name="duration_type" value={durationType} />
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDurationType(opt.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                durationType === opt.value
                  ? 'bg-cyprus-700 text-white border-cyprus-700'
                  : 'bg-white text-sand-700 border-sand-200 hover:border-sand-300'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date & Deadline */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-sand-800 mb-1.5">Date needed</label>
          <Input type="date" name="date_needed" />
        </div>
        <div>
          <label className="block text-sm font-medium text-sand-800 mb-1.5">Deadline</label>
          <Input type="datetime-local" name="deadline" />
        </div>
      </div>

      <SectionHeading step={3} label="Location" icon={MapPin} />

      {/* Remote toggle */}
      <div className="flex items-center gap-3">
        <input type="hidden" name="is_remote" value={isRemote ? '1' : '0'} />
        <button
          type="button"
          onClick={() => setIsRemote(!isRemote)}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            isRemote ? 'bg-cyprus-700' : 'bg-sand-200'
          )}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 rounded-full bg-white transition-transform',
              isRemote ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>
        <span className="text-sm text-sand-800">This job can be done remotely</span>
      </div>

      {!isRemote && (
        <>
          <div>
            <label className="block text-sm font-medium text-sand-800 mb-1.5">
              Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-sand-500" />
              <Input name="address" placeholder="Area or full address" className="pl-9" />
            </div>
          </div>
          <input type="hidden" name="lat" value="" />
          <input type="hidden" name="lng" value="" />
          <div>
            <label className="block text-sm font-medium text-sand-800 mb-1.5">
              Search radius
            </label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                name="search_radius_km"
                defaultValue={10}
                min={1}
                max={100}
                className="w-24"
              />
              <span className="text-sm text-sand-500">km</span>
            </div>
          </div>
        </>
      )}

      <SectionHeading step={4} label="Budget & Payment" icon={Wallet} />

      {/* Budget */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-sand-800 mb-1.5">Budget (INR)</label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-sm text-sand-500">₹</span>
            <Input
              type="number"
              name="budget"
              placeholder="500"
              required
              min={1}
              className="pl-7"
            />
          </div>
          <FieldError error={errors.budget} />
        </div>
        <div>
          <label className="block text-sm font-medium text-sand-800 mb-1.5">Type</label>
          <input type="hidden" name="budget_type" value={budgetType} />
          <div className="flex gap-2">
            {BUDGET_TYPES.map((bt) => (
              <button
                key={bt.value}
                type="button"
                onClick={() => setBudgetType(bt.value)}
                className={cn(
                  'flex-1 py-2 rounded-xl text-xs font-medium border transition-colors',
                  budgetType === bt.value
                    ? 'bg-cyprus-700 text-white border-cyprus-700'
                    : 'bg-white text-sand-700 border-sand-200 hover:border-sand-300'
                )}
              >
                {bt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payment mode */}
      <div>
        <label className="block text-sm font-medium text-sand-800 mb-1.5">Payment mode</label>
        <input type="hidden" name="payment_mode" value={paymentMode} />
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_MODES.map(({ value, label, desc, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setPaymentMode(value)}
              className={cn(
                'flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-colors text-center',
                paymentMode === value
                  ? 'border-cyprus-700 bg-cyprus-50'
                  : 'border-sand-100 bg-white hover:border-sand-200'
              )}
            >
              <Icon className={cn('h-5 w-5', paymentMode === value ? 'text-cyprus-700' : 'text-sand-500')} />
              <span className="text-xs font-semibold">{label}</span>
              <span className="text-[10px] text-sand-500 leading-tight">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      <SectionHeading step={5} label="Preferences" icon={Settings2} />

      <div className="grid grid-cols-2 gap-4">
        {/* Num taskers */}
        <div>
          <label className="block text-sm font-medium text-sand-800 mb-1.5">Taskers needed</label>
          <Input type="number" name="num_taskers" defaultValue={1} min={1} max={20} />
        </div>

        {/* Min rating */}
        <div>
          <label className="block text-sm font-medium text-sand-800 mb-1.5">Min rating</label>
          <Input type="number" name="min_rating" defaultValue={0} min={0} max={5} step={0.5} />
        </div>
      </div>

      {/* Gender pref */}
      <div>
        <label className="block text-sm font-medium text-sand-800 mb-1.5">Gender preference</label>
        <input type="hidden" name="gender_pref" value={genderPref} />
        <div className="flex gap-2">
          {(['any', 'male', 'female'] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGenderPref(g)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium border transition-colors capitalize',
                genderPref === g
                  ? 'bg-cyprus-700 text-white border-cyprus-700'
                  : 'bg-white text-sand-700 border-sand-200 hover:border-sand-300'
              )}
            >
              {g === 'any' ? 'No preference' : g}
            </button>
          ))}
        </div>
      </div>

      {/* Urgent */}
      <div className="flex items-center gap-3">
        <input type="hidden" name="is_urgent" value={isUrgent ? '1' : '0'} />
        <button
          type="button"
          onClick={() => setIsUrgent(!isUrgent)}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            isUrgent ? 'bg-danger-500' : 'bg-sand-200'
          )}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 rounded-full bg-white transition-transform',
              isUrgent ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>
        <span className="text-sm text-sand-800 flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-clay-400" />
          Mark as urgent
        </span>
      </div>

      {/* Global error */}
      {errors._ && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-danger-600">
          {errors._}
        </div>
      )}

      {/* Submit */}
      <div className="pt-4 border-t border-sand-100">
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>Post Job</>
          )}
        </Button>
        <p className="text-xs text-sand-500 text-center mt-2">
          {paymentMode === 'escrow' && (
            <>You&apos;ll be asked to pay the escrow amount after posting.</>
          )}
        </p>
      </div>
    </form>
  )
}
