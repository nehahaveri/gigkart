'use client'

import { useState, useRef, useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { submitKyc } from './actions'
import {
  Shield, CheckCircle2, ArrowRight, ArrowLeft,
  Upload, Camera, FileText, Loader2, AlertTriangle,
  CreditCard, BookOpen, Car, X, Eye,
} from 'lucide-react'
import { toast } from 'sonner'
import type { KycRequest } from '@/types'

// ─── types ───────────────────────────────────────────────────────────────────

type Step = 0 | 1 | 2 | 3 | 4

interface PhotoField {
  key: 'front_photo' | 'back_photo' | 'selfie_photo'
  label: string
  hint: string
  icon: React.ReactNode
  preview: string | null
}

const ID_TYPES = [
  {
    value: 'aadhaar' as const,
    label: 'Aadhaar Card',
    icon: <CreditCard className="h-5 w-5" />,
    desc: 'Issued by UIDAI — most accepted',
    requiresBack: true,
  },
  {
    value: 'passport' as const,
    label: 'Passport',
    icon: <BookOpen className="h-5 w-5" />,
    desc: 'Indian passport',
    requiresBack: false,
  },
  {
    value: 'driving_license' as const,
    label: "Driving Licence",
    icon: <Car className="h-5 w-5" />,
    desc: 'Valid Indian driving licence',
    requiresBack: true,
  },
] as const

// ─── helpers ─────────────────────────────────────────────────────────────────

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-1.5 rounded-full flex-1 transition-all duration-300',
            i < current
              ? 'bg-cyprus-700'
              : i === current
              ? 'bg-cyprus-300'
              : 'bg-sand-200'
          )}
        />
      ))}
    </div>
  )
}

function PhotoUploadZone({
  label,
  hint,
  icon,
  preview,
  name,
  onChange,
  error,
}: {
  label: string
  hint: string
  icon: React.ReactNode
  preview: string | null
  name: string
  onChange: (url: string | null) => void
  error?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, HEIC)')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10 MB.')
      return
    }
    const url = URL.createObjectURL(file)
    onChange(url)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div>
      <label className="block text-sm font-medium text-sand-800 mb-2">{label}</label>
      <div
        className={cn(
          'relative rounded-2xl border-2 border-dashed transition-colors cursor-pointer group',
          preview
            ? 'border-cyprus-300 bg-cyprus-50'
            : 'border-sand-200 hover:border-cyprus-200 hover:bg-sand-50',
          error && 'border-danger-300 bg-danger-50'
        )}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        aria-label={`Upload ${label}`}
      >
        {preview ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt={label}
              className="w-full h-48 object-cover rounded-2xl"
            />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null) }}
              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              aria-label="Remove photo"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-cyprus-700/90 text-white text-xs font-medium px-2.5 py-1 rounded-full">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Uploaded
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-10 px-4">
            <div className="h-14 w-14 rounded-2xl bg-sand-100 flex items-center justify-center text-sand-400 group-hover:bg-cyprus-50 group-hover:text-cyprus-600 transition-colors">
              {icon}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-sand-700">
                Tap to upload or drag &amp; drop
              </p>
              <p className="text-xs text-sand-400 mt-0.5">{hint}</p>
            </div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          name={name}
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
      </div>
      {error && (
        <p className="text-xs text-danger-600 mt-1.5 flex items-center gap-1">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />{error}
        </p>
      )}
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export function KycWizard({
  fullName,
  existingRequest,
}: {
  fullName: string | null
  existingRequest: KycRequest | null
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  const [step, setStep] = useState<Step>(0)
  const [legalName, setLegalName] = useState(fullName ?? '')
  const [idType, setIdType] = useState<(typeof ID_TYPES)[number]['value'] | null>(null)
  const [idLast4, setIdLast4] = useState('')
  const [frontPreview, setFrontPreview]   = useState<string | null>(null)
  const [backPreview, setBackPreview]     = useState<string | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)

  const selectedIdType = ID_TYPES.find((t) => t.value === idType)
  const TOTAL_STEPS = 5  // 0 = intro, 1 = name, 2 = id-type, 3 = photos, 4 = success

  const [state, formAction, pending] = useActionState(submitKyc, {})

  useEffect(() => {
    if (state?.success) setStep(4)
    if (state?.errors?._ ) toast.error(state.errors._)
  }, [state])

  // ── step 0: intro ──────────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <div className="max-w-lg mx-auto">
        {/* Trust banner */}
        <div className="rounded-3xl bg-cyprus-700 text-white p-8 mb-6 relative overflow-hidden">
          <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/5" />
          <div className="relative">
            <div className="h-14 w-14 rounded-2xl bg-white/15 flex items-center justify-center mb-5">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Verify your identity</h1>
            <p className="text-cyprus-100 text-sm leading-relaxed">
              A quick, secure check that keeps GigKart safe for everyone — both the people posting jobs and the taskers completing them.
            </p>
          </div>
        </div>

        {/* Existing request status */}
        {existingRequest && existingRequest.status !== 'rejected' && (
          <div className={cn(
            'rounded-2xl border p-4 mb-5 flex items-start gap-3',
            existingRequest.status === 'pending'
              ? 'bg-sand-50 border-sand-200'
              : 'bg-success-50 border-success-200'
          )}>
            {existingRequest.status === 'pending'
              ? <Loader2 className="h-5 w-5 text-sand-500 shrink-0 mt-0.5 animate-spin" />
              : <CheckCircle2 className="h-5 w-5 text-success-600 shrink-0 mt-0.5" />
            }
            <div>
              <p className="text-sm font-semibold text-sand-900">
                {existingRequest.status === 'pending' ? 'Verification in progress' : 'Verification complete'}
              </p>
              <p className="text-xs text-sand-500 mt-0.5">
                {existingRequest.status === 'pending'
                  ? 'Your documents are being reviewed. This usually takes 24–48 hours.'
                  : 'Your identity has been verified.'}
              </p>
            </div>
          </div>
        )}

        {/* What you need */}
        <div className="bg-white rounded-2xl border border-sand-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-sand-900 mb-4">What you&apos;ll need</h2>
          <div className="space-y-3.5">
            {[
              { icon: <CreditCard className="h-4 w-4" />, text: 'A government-issued ID (Aadhaar, passport, or driving licence)' },
              { icon: <Camera className="h-4 w-4" />,     text: 'A clear photo of the front (and back, if applicable)' },
              { icon: <Eye className="h-4 w-4" />,        text: 'A selfie holding your ID next to your face' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-xl bg-sand-100 flex items-center justify-center text-sand-500 shrink-0 mt-0.5">
                  {icon}
                </div>
                <p className="text-sm text-sand-600 leading-snug pt-1.5">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy note */}
        <p className="text-xs text-sand-400 text-center mb-6 leading-relaxed px-4">
          Your documents are encrypted in transit and at rest. They are only visible to GigKart&apos;s trust &amp; safety team and are never shared with third parties or other users.
        </p>

        <Button
          className="w-full"
          onClick={() => setStep(1)}
          disabled={existingRequest?.status === 'pending' || existingRequest?.status === 'approved'}
        >
          {existingRequest?.status === 'rejected' ? 'Resubmit verification' : 'Start verification'}
          <ArrowRight className="h-4 w-4" />
        </Button>

        {existingRequest?.status === 'rejected' && (
          <div className="mt-4 rounded-2xl bg-clay-50 border border-clay-100 p-4">
            <p className="text-sm font-semibold text-clay-700 mb-1 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" />Previous submission rejected
            </p>
            <p className="text-xs text-clay-600">
              {existingRequest.rejection_reason ?? 'Please resubmit with clearer photos and ensure all details are legible.'}
            </p>
          </div>
        )}
      </div>
    )
  }

  // ── step 4: success ────────────────────────────────────────────────────────
  if (step === 4) {
    return (
      <div className="max-w-lg mx-auto text-center">
        <div className="h-20 w-20 rounded-full bg-success-50 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="h-10 w-10 text-success-600" />
        </div>
        <h1 className="text-2xl font-bold text-sand-900 mb-2">Submitted!</h1>
        <p className="text-sand-500 text-sm leading-relaxed mb-8">
          Your documents are now under review. We&apos;ll notify you within 24–48 hours. You can continue using GigKart while you wait.
        </p>
        <div className="bg-white rounded-2xl border border-sand-200 p-5 text-left mb-6 space-y-3">
          {[
            'Review usually takes 24–48 hours',
            'You\'ll receive a notification when approved',
            'A verified badge will appear on your profile',
          ].map((t) => (
            <div key={t} className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-success-500 shrink-0" />
              <p className="text-sm text-sand-600">{t}</p>
            </div>
          ))}
        </div>
        <Button className="w-full" onClick={() => router.push('/settings')}>
          Back to settings
        </Button>
      </div>
    )
  }

  // ── steps 1–3: form ────────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto">
      <StepDots total={TOTAL_STEPS - 1} current={step} />

      <form ref={formRef} action={formAction} className="space-y-6">
        {/* Hidden fields always present */}
        <input type="hidden" name="legal_name"      value={legalName} />
        <input type="hidden" name="id_type"         value={idType ?? ''} />
        <input type="hidden" name="id_number_last4" value={idLast4} />

        {/* ── Step 1: Legal name ──────────────────────────────────── */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-sand-900 mb-1">What&apos;s your legal name?</h2>
            <p className="text-sm text-sand-500 mb-6">
              This must exactly match the name on your government ID.
            </p>
            <div>
              <label className="block text-sm font-medium text-sand-800 mb-1.5">
                Full legal name
              </label>
              <Input
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="As it appears on your ID"
                autoFocus
              />
              {state?.errors?.legal_name && (
                <p className="text-xs text-danger-600 mt-1.5">{state.errors.legal_name}</p>
              )}
            </div>
            <p className="text-xs text-sand-400 mt-3">
              Your legal name is only used for identity verification and is not shown on your public profile.
            </p>
          </div>
        )}

        {/* ── Step 2: ID type + last-4 ────────────────────────────── */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-sand-900 mb-1">Choose your ID</h2>
            <p className="text-sm text-sand-500 mb-6">
              Select the government-issued document you&apos;ll be uploading.
            </p>
            <div className="space-y-3 mb-6">
              {ID_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setIdType(t.value)}
                  className={cn(
                    'w-full text-left flex items-center gap-4 p-4 rounded-2xl border-2 transition-all',
                    idType === t.value
                      ? 'border-cyprus-700 bg-cyprus-50'
                      : 'border-sand-200 bg-white hover:border-sand-300'
                  )}
                >
                  <div className={cn(
                    'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
                    idType === t.value ? 'bg-cyprus-700 text-white' : 'bg-sand-100 text-sand-500'
                  )}>
                    {t.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sand-900 text-sm">{t.label}</p>
                    <p className="text-xs text-sand-500 mt-0.5">{t.desc}</p>
                  </div>
                  {idType === t.value && (
                    <CheckCircle2 className="h-5 w-5 text-cyprus-700 shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {idType && (
              <div>
                <label className="block text-sm font-medium text-sand-800 mb-1.5">
                  Last 4 digits of your {selectedIdType?.label} number
                </label>
                <Input
                  value={idLast4}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 4)
                    setIdLast4(v)
                  }}
                  placeholder="e.g. 5678"
                  inputMode="numeric"
                  maxLength={4}
                />
                <p className="text-xs text-sand-400 mt-1.5">
                  We only store the last 4 digits — never your full ID number.
                </p>
                {state?.errors?.id_number_last4 && (
                  <p className="text-xs text-danger-600 mt-1">{state.errors.id_number_last4}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Photo uploads ────────────────────────────────── */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-sand-900 mb-1">Upload your documents</h2>
            <p className="text-sm text-sand-500 mb-6">
              Make sure all text is clearly legible. Photos must be taken in good lighting.
            </p>

            <div className="space-y-5">
              <PhotoUploadZone
                label={`Front of ${selectedIdType?.label ?? 'ID'}`}
                hint="Make sure the photo is clear, in-focus, and not cropped"
                icon={<Upload className="h-6 w-6" />}
                preview={frontPreview}
                name="front_photo"
                onChange={setFrontPreview}
                error={state?.errors?.front_photo}
              />

              {selectedIdType?.requiresBack && (
                <PhotoUploadZone
                  label={`Back of ${selectedIdType?.label ?? 'ID'} (optional but recommended)`}
                  hint="Skip if your ID only has one side"
                  icon={<Upload className="h-6 w-6" />}
                  preview={backPreview}
                  name="back_photo"
                  onChange={setBackPreview}
                />
              )}

              <PhotoUploadZone
                label="Selfie holding your ID"
                hint="Hold your ID next to your face so both are clearly visible"
                icon={<Camera className="h-6 w-6" />}
                preview={selfiePreview}
                name="selfie_photo"
                onChange={setSelfiePreview}
                error={state?.errors?.selfie_photo}
              />
            </div>

            <div className="mt-5 rounded-2xl bg-sand-50 border border-sand-200 p-4">
              <p className="text-xs text-sand-500 leading-relaxed">
                <span className="font-semibold text-sand-700">Tips for a clear photo:</span>{' '}
                Use natural light, avoid glare, hold the camera steady, and make sure all four corners of the document are visible.
              </p>
            </div>
          </div>
        )}

        {/* ── Navigation ──────────────────────────────────────────── */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((s) => (s - 1) as Step)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          {step < 3 ? (
            <Button
              type="button"
              className="flex-1"
              onClick={() => {
                if (step === 1 && !legalName.trim()) {
                  toast.error('Please enter your legal name')
                  return
                }
                if (step === 2 && !idType) {
                  toast.error('Please select an ID type')
                  return
                }
                if (step === 2 && idLast4.length !== 4) {
                  toast.error('Enter the last 4 digits of your ID')
                  return
                }
                setStep((s) => (s + 1) as Step)
              }}
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              className="flex-1"
              disabled={pending || !frontPreview || !selfiePreview}
            >
              {pending ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Submitting…</>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Submit for review
                </>
              )}
            </Button>
          )}
        </div>

        {state?.errors?._ && (
          <div className="flex items-start gap-2 rounded-xl bg-danger-50 border border-danger-100 p-3 text-sm text-danger-600">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            {state.errors._}
          </div>
        )}
      </form>
    </div>
  )
}
