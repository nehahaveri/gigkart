'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-cyprus-700 text-sand-50 hover:bg-cyprus-800 focus-visible:ring-cyprus-700 shadow-sm hover:shadow-md',
        destructive:
          'bg-danger-500 text-white hover:bg-danger-600 focus-visible:ring-danger-500 shadow-sm hover:shadow-md',
        outline:
          'border border-sand-200 bg-white hover:bg-sand-50 hover:border-sand-300 text-sand-900',
        secondary:
          'bg-sand-100 text-sand-900 hover:bg-sand-200',
        ghost:
          'hover:bg-sand-100 text-sand-800',
        link:
          'text-cyprus-700 underline-offset-4 hover:underline p-0 h-auto',
        accent:
          'bg-clay-400 text-white hover:bg-clay-500 focus-visible:ring-clay-400 shadow-sm hover:shadow-md',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
