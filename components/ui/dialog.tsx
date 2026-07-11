"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, HTMLMotionProps, motion } from "framer-motion"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { useMounted } from "@/app/hooks/use-mounted"
import { SlotSafe } from "@/components/ui/slot-safe"

type DialogContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
}

type DialogMotionDivProps = Omit<HTMLMotionProps<"div">, "children" | "ref"> & {
  children?: React.ReactNode
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

function useDialogContext() {
  const context = React.useContext(DialogContext)

  if (!context) {
    throw new Error("Dialog components must be used inside a Dialog")
  }

  return context
}

function assignRef<TValue>(ref: React.ForwardedRef<TValue> | undefined, value: TValue | null) {
  if (!ref || typeof ref === "string") {
    return
  }

  if (typeof ref === "function") {
    ref(value)
    return
  }

  ref.current = value
}

function composeRefs<TValue>(...refs: Array<React.ForwardedRef<TValue> | undefined>) {
  return (value: TValue | null) => {
    refs.forEach(ref => {
      assignRef(ref, value)
    })
  }
}

type DialogProps = {
  children: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

function Dialog({ children, open: controlledOpen, defaultOpen = false, onOpenChange }: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const open = controlledOpen ?? uncontrolledOpen

  const setOpen = React.useCallback(
    (value: boolean) => {
      if (controlledOpen === undefined) {
        setUncontrolledOpen(value)
      }

      onOpenChange?.(value)
    },
    [controlledOpen, onOpenChange],
  )

  return <DialogContext.Provider value={{ open, setOpen }}>{children}</DialogContext.Provider>
}

type DialogTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean
}

const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ asChild = false, onClick, type = "button", ...props }, ref) => {
    const { setOpen } = useDialogContext()

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event)

      if (!event.defaultPrevented) {
        setOpen(true)
      }
    }

    if (asChild) {
      return <SlotSafe ref={ref} onClick={handleClick} {...props} />
    }

    return <button ref={ref} type={type} onClick={handleClick} {...props} />
  },
)
DialogTrigger.displayName = "DialogTrigger"

function DialogPortal({ children }: { children: React.ReactNode }) {
  const mounted = useMounted()

  if (!mounted) {
    return null
  }

  return createPortal(children, document.body)
}
DialogPortal.displayName = "DialogPortal"

type DialogCloseProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean
}

const DialogClose = React.forwardRef<HTMLButtonElement, DialogCloseProps>(
  ({ asChild = false, onClick, type = "button", ...props }, ref) => {
    const { setOpen } = useDialogContext()

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event)

      if (!event.defaultPrevented) {
        setOpen(false)
      }
    }

    if (asChild) {
      return <SlotSafe ref={ref} onClick={handleClick} {...props} />
    }

    return <button ref={ref} type={type} onClick={handleClick} {...props} />
  },
)
DialogClose.displayName = "DialogClose"

function DialogOverlay({ className, onClick, ...props }: DialogMotionDivProps) {
  const { open, setOpen } = useDialogContext()

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="dialog-overlay"
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={cn("fixed inset-0 z-50 bg-black/80", className)}
          onClick={event => {
            onClick?.(event)

            if (!event.defaultPrevented) {
              setOpen(false)
            }
          }}
          {...props}
        />
      ) : null}
    </AnimatePresence>
  )
}
DialogOverlay.displayName = "DialogOverlay"

const DialogContent = React.forwardRef<HTMLDivElement, DialogMotionDivProps>(
  ({ className, children, onClick, onKeyDown, ...props }, ref) => {
    const { open, setOpen } = useDialogContext()
    const contentRef = React.useRef<HTMLDivElement | null>(null)

    const setContentRef = React.useMemo(() => composeRefs<HTMLDivElement>(ref, contentRef), [ref])

    React.useEffect(() => {
      return () => {
        document.body.style.overflow = ""
      }
    }, [])

    React.useEffect(() => {
      if (!open) {
        return
      }

      const previousActiveElement = document.activeElement as HTMLElement | null

      document.body.style.overflow = "hidden"
      contentRef.current?.focus()

      return () => {
        document.body.style.overflow = ""
        previousActiveElement?.focus?.()
      }
    }, [open])

    React.useEffect(() => {
      if (!open) {
        return
      }

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setOpen(false)
        }
      }

      window.addEventListener("keydown", handleEscape)

      return () => {
        window.removeEventListener("keydown", handleEscape)
      }
    }, [open, setOpen])

    return (
      <DialogPortal>
        <AnimatePresence>
          {open
            ? [
                <motion.div
                  key="dialog-overlay"
                  aria-hidden="true"
                  className="fixed inset-0 z-50 bg-black/80"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  onClick={event => {
                    if (!event.defaultPrevented) {
                      setOpen(false)
                    }
                  }}
                />,
                <motion.div
                  key="dialog-content"
                  ref={setContentRef}
                  aria-modal="true"
                  role="dialog"
                  tabIndex={-1}
                  initial={{ opacity: 0, scale: 0.96, x: "-50%", y: "-48%" }}
                  animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                  exit={{ opacity: 0, scale: 0.98, x: "-50%", y: "-48%" }}
                  transition={{ type: "spring", stiffness: 300, damping: 28, mass: 0.9 }}
                  className={cn(
                    "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg sm:rounded-lg",
                    className,
                  )}
                  onClick={event => {
                    event.stopPropagation()
                    onClick?.(event)
                  }}
                  onKeyDown={event => {
                    onKeyDown?.(event)
                  }}
                  {...props}>
                  {children}
                  <DialogClose
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity
                               hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring
                               focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent
                               data-[state=open]:text-muted-foreground">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </DialogClose>
                </motion.div>,
              ]
            : null}
        </AnimatePresence>
      </DialogPortal>
    )
  },
)
DialogContent.displayName = "DialogContent"

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
}
DialogHeader.displayName = "DialogHeader"

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
}
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
  ),
)
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
)
DialogDescription.displayName = "DialogDescription"

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
