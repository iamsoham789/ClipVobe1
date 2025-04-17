
import React from 'react';
import { cn } from '../../lib/utils';
import { cva, type VariantProps } from "class-variance-authority";

// Define buttonVariants using cva for consistent styling
export const buttonVariants = cva(
  'relative inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-clipvobe-cyan text-clipvobe-dark hover:bg-clipvobe-cyan-dark shadow-[0_0_15px_rgba(0,255,255,0.25)] hover:shadow-[0_0_20px_rgba(0,255,255,0.35)]',
        secondary: 'bg-transparent text-white border border-white/20 hover:bg-white/5',
        outline: 'bg-transparent text-white border border-clipvobe-cyan hover:bg-clipvobe-cyan/5',
        ghost: 'bg-transparent text-white hover:bg-white/5',
        // Add these for shadcn/ui compatibility
        default: 'bg-clipvobe-cyan text-clipvobe-dark hover:bg-clipvobe-cyan-dark shadow-[0_0_15px_rgba(0,255,255,0.25)] hover:shadow-[0_0_20px_rgba(0,255,255,0.35)]',
        destructive: 'bg-red-500 text-white hover:bg-red-600',
        link: 'text-clipvobe-cyan underline-offset-4 hover:underline',
        red: 'bg-red-600 text-white hover:bg-red-700 shadow-[0_0_15px_rgba(220,38,38,0.25)] hover:shadow-[0_0_20px_rgba(220,38,38,0.35)]',
      },
      size: {
        sm: 'text-sm px-4 py-2',
        md: 'text-base px-6 py-3',
        lg: 'text-lg px-8 py-4',
        // Add these for shadcn/ui compatibility
        default: 'text-base px-6 py-3',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

// Extend the type to include our custom variants and shadcn/ui compatibility
export interface ButtonProps 
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

// Named export for Button
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, ...props }, ref) => {
    return (
      <button
        className={cn(
          buttonVariants({ variant, size }),
          className
        )}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <div className="loader"></div>
          </span>
        )}
        <span className={cn({ 'opacity-0': isLoading })}>{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';

// Default export for backward compatibility
export default Button;
