import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-cyprus-50 text-cyprus-800',
        secondary: 'bg-sand-100 text-sand-800',
        success: 'bg-success-50 text-success-600',
        warning: 'bg-clay-50 text-clay-600',
        destructive: 'bg-danger-50 text-danger-600',
        urgent: 'bg-clay-400 text-white shadow-sm',
        escrow: 'bg-cyprus-700 text-sand-50 shadow-sm',
        outline: 'border border-sand-200 text-sand-800 bg-white',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
