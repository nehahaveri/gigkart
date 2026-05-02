export type UserRole = 'poster' | 'tasker' | 'admin'

export type JobStatus = 'open' | 'active' | 'completed' | 'disputed' | 'cancelled'

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn'

export type DisputeStatus = 'open' | 'reviewing' | 'resolved'

export type DurationType =
  | 'few_hours'
  | '1_day'
  | '2_3_days'
  | '1_week'
  | 'single_task'
  | 'recurring'

export type BudgetType = 'fixed' | 'hourly' | 'negotiable'

export type PaymentMode = 'escrow' | 'upfront' | '50_50_split'

export type KycIdType = 'aadhaar' | 'passport' | 'driving_license'
export type KycStatus = 'pending' | 'approved' | 'rejected'

export interface User {
  id: string
  phone: string | null
  email: string | null
  full_name: string | null
  avatar_url: string | null
  role: UserRole[]
  city: string | null
  aadhaar_verified: boolean
  aadhaar_last4: string | null
  upi_id: string | null
  bank_account: string | null
  skills: string[]
  rating_avg: number
  rating_count: number
  completion_rate: number
  created_at: string
}

export interface KycRequest {
  id: string
  user_id: string
  legal_name: string
  id_type: KycIdType
  id_number_last4: string
  front_url: string
  back_url: string | null
  selfie_url: string
  status: KycStatus
  rejection_reason: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  submitted_at: string
  user?: User
}

export interface Job {
  id: string
  poster_id: string
  title: string
  description: string
  category: string
  sub_category: string | null
  photos: string[]
  duration_type: DurationType
  date_needed: string | null
  deadline: string | null
  address: string | null
  is_remote: boolean
  num_taskers: number
  budget: number
  budget_type: BudgetType
  payment_mode: PaymentMode
  search_radius_km: number
  gender_pref: 'any' | 'male' | 'female' | null
  min_rating: number
  is_urgent: boolean
  status: JobStatus
  escrow_payment_id: string | null
  created_at: string
  poster?: User
  distance_km?: number
}

export interface Offer {
  id: string
  job_id: string
  tasker_id: string
  price: number
  availability_note: string | null
  message: string | null
  status: OfferStatus
  created_at: string
  tasker?: User
}

export interface JobAssignment {
  id: string
  job_id: string
  tasker_id: string
  offer_id: string
  started_at: string | null
  submitted_at: string | null
  approved_at: string | null
  proof_photos: string[]
  checklist_done: string[]
  payout_id: string | null
}

export interface Dispute {
  id: string
  job_id: string
  raised_by: string
  reason: string
  description: string
  evidence_urls: string[]
  status: DisputeStatus
  resolution: string | null
  resolved_at: string | null
  admin_id: string | null
}

export interface Review {
  id: string
  job_id: string
  reviewer_id: string
  reviewee_id: string
  overall_rating: number
  quality_rating: number
  punctuality_rating: number
  communication_rating: number
  rehire_flag: boolean
  text: string | null
  revealed_at: string | null
  created_at: string
  reviewer?: User
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  data: Record<string, unknown>
  read: boolean
  created_at: string
}

export const JOB_CATEGORIES = [
  'Cleaning',
  'Moving & Packing',
  'Repairs & Maintenance',
  'Delivery',
  'Cooking',
  'Tutoring',
  'Tech Help',
  'Gardening',
  'Pet Care',
  'Errands',
  'Event Help',
  'Other',
] as const

export type JobCategory = (typeof JOB_CATEGORIES)[number]
