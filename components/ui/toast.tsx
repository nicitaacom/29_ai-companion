"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { HTMLMotionProps, motion } from "framer-motion"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const TOAST_DURATION = 6000

const ToastProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>

const ToastViewport = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div
    className={cn(
      "pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex max-h-screen w-full flex-col justify-end p-4 sm:left-auto sm:right-0 sm:max-w-[420px]",
      className,
    )}
    ref={ref}
    {...props}
  />
))
ToastViewport.displayName = "ToastViewport"

const toastVariants = cva(
  "group relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive: "destructive border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

type ToastContextValue = {
  onOpenChange?: (open: boolean) => void
}

const ToastContext = React.createContext<ToastContextValue>({})

type ToastMotionDivProps = Omit<HTMLMotionProps<"div">, "children" | "ref"> & {
  children?: React.ReactNode
}

export interface ToastProps extends ToastMotionDivProps, VariantProps<typeof toastVariants> {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(({ className, variant, open = true, onOpenChange, ...props }, ref) => {
  React.useEffect(() => {
    if (!open || !onOpenChange) {
      return
    }

    const timeout = window.setTimeout(() => {
      onOpenChange(false)
    }, TOAST_DURATION)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [open, onOpenChange])

  return (
    <ToastContext.Provider value={{ onOpenChange }}>
      <motion.div
        animate={open ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 18, scale: 0.98 }}
        className={cn(toastVariants({ variant }), !open && "pointer-events-none", className)}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        ref={ref}
        role="status"
        transition={{ duration: 0.22, ease: "easeOut" }}
        {...props}
      />
    </ToastContext.Provider>
  )
})
Toast.displayName = "Toast"

const ToastAction = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
)
ToastAction.displayName = "ToastAction"

const ToastClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, onClick, ...props }, ref) => {
    const { onOpenChange } = React.useContext(ToastContext)

    function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
      onClick?.(event)
      if (!event.defaultPrevented) onOpenChange?.(false)
    }

    return (
      <button
        className={cn(
          "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50",
          className,
        )}
        onClick={handleClick}
        ref={ref}
        {...props}>
        <X className="h-4 w-4" />
      </button>
    )
  },
)
ToastClose.displayName = "ToastClose"

const ToastTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h5 className={cn("text-sm font-semibold", className)} ref={ref} {...props} />
))
ToastTitle.displayName = "ToastTitle"

const ToastDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => <p className={cn("text-sm opacity-90", className)} ref={ref} {...props} />,
)
ToastDescription.displayName = "ToastDescription"

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
