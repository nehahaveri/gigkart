'use client'

import { useState, useActionState } from 'react'
import { Briefcase, Search, Users, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils/cn'
import { JOB_CATEGORIES } from '@/types'
import {
  completePosterOnboarding,
  completeTaskerOnboarding,
  completeBothOnboarding,
} from './actions'

type Role = 'poster' | 'tasker' | 'both'

const SKILLS = JOB_CATEGORIES.filter((c) => c !== 'Other')

function StepIndicator({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-1.5 rounded-full flex-1 transition-colors',
            i < current ? 'bg-cyprus-700' : i === current ? 'bg-teal-300' : 'bg-sand-200'
          )}
        />
      ))}
    </div>
  )
}

export function OnboardingWizard({ userId: _userId }: { userId: string }) {
  const [role, setRole] = useState<Role | null>(null)
  const [step, setStep] = useState(0)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])

  const totalSteps = role === 'poster' ? 2 : role === 'tasker' ? 4 : role === 'both' ? 4 : 1

  const action =
    role === 'poster'
      ? completePosterOnboarding
      : role === 'tasker'
      ? completeTaskerOnboarding
      : completeBothOnboarding

  const [state, formAction, pending] = useActionState(
    action ?? completePosterOnboarding,
    {}
  )

  function toggleSkill(skill: string) {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    )
  }

  // Step 0: Role selection
  if (step === 0) {
    return (
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-sand-900">How will you use GigKart?</h1>
          <p className="mt-2 text-sm text-sand-500">You can always switch later</p>
        </div>
        <div className="space-y-3">
          {(
            [
              {
                id: 'poster' as Role,
                icon: Briefcase,
                label: 'I need help with tasks',
                desc: 'Post jobs, hire local taskers, pay securely',
              },
              {
                id: 'tasker' as Role,
                icon: Search,
                label: 'I want to earn money',
                desc: 'Browse nearby jobs, send offers, get paid to UPI',
              },
              {
                id: 'both' as Role,
                icon: Users,
                label: 'Both — post and earn',
                desc: 'Full access to posting and finding work',
              },
            ] as const
          ).map(({ id, icon: Icon, label, desc }) => (
            <button
              key={id}
              type="button"
              onClick={() => setRole(id)}
              className={cn(
                'w-full text-left flex items-start gap-4 p-4 rounded-2xl border-2 transition-colors',
                role === id
                  ? 'border-cyprus-700 bg-cyprus-50'
                  : 'border-sand-100 bg-white hover:border-sand-200'
              )}
            >
              <div
                className={cn(
                  'mt-0.5 shrink-0 h-10 w-10 rounded-xl flex items-center justify-center',
                  role === id ? 'bg-cyprus-700 text-white' : 'bg-sand-100 text-sand-500'
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-sand-900">{label}</div>
                <div className="text-sm text-sand-500 mt-0.5">{desc}</div>
              </div>
              {role === id && (
                <div className="ml-auto shrink-0 h-5 w-5 rounded-full bg-cyprus-700 flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
        <Button
          className="w-full mt-6"
          disabled={!role}
          onClick={() => role && setStep(1)}
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  // Steps 1+ — profile form
  return (
    <div className="w-full max-w-md">
      <StepIndicator total={totalSteps} current={step} />
      <form action={formAction} className="bg-white rounded-2xl border border-sand-100 shadow-sm p-6 space-y-5">
        {/* Hidden fields */}
        <input type="hidden" name="skills" value={JSON.stringify(selectedSkills)} />

        {/* Step 1: Name + City */}
        {step === 1 && (
          <>
            <h2 className="text-lg font-semibold text-sand-900">Your profile</h2>
            <div>
              <label className="block text-sm font-medium text-sand-800 mb-1.5">Full name</label>
              <Input
                name="full_name"
                placeholder="Priya Sharma"
                required
              />
              {state?.errors?.full_name && (
                <p className="text-xs text-danger-500 mt-1">{state.errors.full_name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-sand-800 mb-1.5">City</label>
              <Input
                name="city"
                placeholder="Mumbai"
                required
              />
              {state?.errors?.city && (
                <p className="text-xs text-sand-500 mt-1">{state.errors.city}</p>
              )}
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" onClick={() => setStep(0)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              {role === 'poster' ? (
                <Button type="submit" className="flex-1" disabled={pending}>
                  {pending ? 'Saving…' : 'Finish'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" className="flex-1" onClick={() => setStep(2)}>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </>
        )}

        {/* Step 2: Skills (tasker / both) */}
        {step === 2 && (role === 'tasker' || role === 'both') && (
          <>
            <div>
              <h2 className="text-lg font-semibold text-sand-900">Your skills</h2>
              <p className="text-sm text-sand-500 mt-1">Select all that apply</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {SKILLS.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                    selectedSkills.includes(skill)
                      ? 'bg-cyprus-700 text-white border-cyprus-700'
                      : 'bg-white text-sand-800 border-sand-200 hover:border-sand-300'
                  )}
                >
                  {skill}
                </button>
              ))}
            </div>
            {state?.errors?.skills && (
              <p className="text-xs text-danger-500">{state.errors.skills}</p>
            )}
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={selectedSkills.length === 0}
                onClick={() => setStep(3)}
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {/* Step 3: KYC placeholder */}
        {step === 3 && (role === 'tasker' || role === 'both') && (
          <>
            <div>
              <h2 className="text-lg font-semibold text-sand-900">Aadhaar KYC</h2>
              <p className="text-sm text-sand-500 mt-1">
                Verify your identity to unlock job applications. We use DigiLocker — no data is stored on our servers.
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              KYC via DigiLocker is coming soon. You can skip for now and complete it from Settings.
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button type="button" className="flex-1" onClick={() => setStep(4)}>
                Skip for now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {/* Step 4: UPI payout */}
        {step === 4 && (role === 'tasker' || role === 'both') && (
          <>
            <div>
              <h2 className="text-lg font-semibold text-sand-900">Payout account</h2>
              <p className="text-sm text-sand-500 mt-1">Where should we send your earnings?</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-sand-800 mb-1.5">UPI ID</label>
              <Input
                name="upi_id"
                placeholder="yourname@upi"
                required
              />
              {state?.errors?.upi_id && (
                <p className="text-xs text-danger-500 mt-1">{state.errors.upi_id}</p>
              )}
              <p className="text-xs text-sand-500 mt-1">e.g. yourname@okicici, 9876543210@ybl</p>
            </div>
            {state?.errors?._ && (
              <p className="text-xs text-danger-500">{state.errors._}</p>
            )}
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button type="submit" className="flex-1" disabled={pending}>
                {pending ? 'Saving…' : 'Finish setup'}
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  )
}
