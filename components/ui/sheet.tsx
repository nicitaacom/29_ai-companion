"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { SlotSafe } from "@/components/ui/slot-safe"
import { cn } from "@/lib/utils"

type SheetContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
}

const SheetContext = React.createContext<SheetContextValue | null>(null)

function useSheetContext() {
  const context = React.useContext(SheetContext)

  if (!context) {
    throw new Error("Sheet components must be used inside Sheet")
  }

  return context
}

type SheetProps = {
  children: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

const Sheet = ({ children, open: controlledOpen, defaultOpen = false, onOpenChange }: SheetProps) => {
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

  return <SheetContext.Provider value={{ open, setOpen }}>{children}</SheetContext.Provider>
}

type SheetTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean
}

const SheetTrigger = React.forwardRef<HTMLButtonElement, SheetTriggerProps>(
  ({ asChild = false, onClick, type = "button", ...props }, ref) => {
    const { setOpen } = useSheetContext()

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
SheetTrigger.displayName = "SheetTrigger"

type SheetCloseProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean
}

const SheetClose = React.forwardRef<HTMLButtonElement, SheetCloseProps>(
  ({ asChild = false, onClick, type = "button", ...props }, ref) => {
    const { setOpen } = useSheetContext()

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
SheetClose.displayName = "SheetClose"

const SheetPortal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return createPortal(children, document.body)
}
SheetPortal.displayName = "SheetPortal"

const SheetOverlay = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, onClick, ...props }, ref) => {
    const { open, setOpen } = useSheetContext()

    return (
      <AnimatePresence>
        {open ? (
          <motion.div
            key="sheet-overlay"
            ref={ref}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
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
  },
)
SheetOverlay.displayName = "SheetOverlay"

const sheetVariants = cva("fixed z-50 gap-4 bg-background p-6 shadow-lg", {
  variants: {
    side: {
      top: "inset-x-0 top-0 border-b",
      bottom: "inset-x-0 bottom-0 border-t",
      left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
      right: "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
    },
  },
  defaultVariants: {
    side: "right",
  },
})

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof sheetVariants> {}

function getSheetMotion(side: NonNullable<SheetContentProps["side"]>) {
  if (side === "left") {
    return { initial: { x: "-100%" }, animate: { x: 0 }, exit: { x: "-100%" } }
  }

  if (side === "top") {
    return { initial: { y: "-100%" }, animate: { y: 0 }, exit: { y: "-100%" } }
  }

  if (side === "bottom") {
    return { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" } }
  }

  return { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" } }
}

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ side = "right", className, children, onKeyDown, ...props }, ref) => {
    const { open, setOpen } = useSheetContext()
    const contentRef = React.useRef<HTMLDivElement | null>(null)
    const motionState = getSheetMotion(side)

    const setContentRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        contentRef.current = node

        if (typeof ref === "function") {
          ref(node)
          return
        }

        if (ref) {
          ref.current = node
        }
      },
      [ref],
    )

    React.useEffect(() => {
      if (!open) {
        return
      }

      const previousOverflow = document.body.style.overflow
      document.body.style.overflow = "hidden"

      return () => {
        document.body.style.overflow = previousOverflow
      }
    }, [open])

    React.useEffect(() => {
      if (!open) {
        return
      }

      const onEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setOpen(false)
        }
      }

      window.addEventListener("keydown", onEscape)
      return () => window.removeEventListener("keydown", onEscape)
    }, [open, setOpen])

    return (
      <SheetPortal>
        <SheetOverlay />
        <AnimatePresence>
          {open ? (
            <motion.div
              key="sheet-content"
              ref={setContentRef}
              initial={motionState.initial}
              animate={motionState.animate}
              exit={motionState.exit}
              transition={{ type: "spring", stiffness: 320, damping: 30, mass: 0.9 }}
              className={cn(sheetVariants({ side }), className)}
              onClick={event => {
                event.stopPropagation()
              }}
              onKeyDown={event => {
                onKeyDown?.(event)
              }}
              {...props}>
              {children}
              <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </SheetClose>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </SheetPortal>
    )
  },
)
SheetContent.displayName = "SheetContent"

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => <h2 ref={ref} className={cn("text-lg font-semibold text-foreground", className)} {...props} />,
)
SheetTitle.displayName = "SheetTitle"

const SheetDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />,
)
SheetDescription.displayName = "SheetDescription"

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
