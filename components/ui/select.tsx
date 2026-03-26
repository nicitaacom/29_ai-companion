"use client"

import * as React from "react"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

type SelectContextValue = {
  value: string
  setValue: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
  disabled: boolean
  items: Record<string, string>
  registerItem: (value: string, label: string) => void
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

function useSelectContext() {
  const context = React.useContext(SelectContext)

  if (!context) {
    throw new Error("Select components must be used inside Select")
  }

  return context
}

function getTextContent(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node)
  }

  if (Array.isArray(node)) {
    return node.map(getTextContent).join("")
  }

  if (!React.isValidElement(node)) {
    return ""
  }

  return getTextContent(node.props.children)
}

type SelectProps = {
  children: React.ReactNode
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
}

const Select = ({ children, value: controlledValue, defaultValue = "", onValueChange, disabled = false }: SelectProps) => {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const [open, setOpen] = React.useState(false)
  const [items, setItems] = React.useState<Record<string, string>>({})
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const value = controlledValue ?? uncontrolledValue

  const setValue = React.useCallback(
    (nextValue: string) => {
      if (controlledValue === undefined) {
        setUncontrolledValue(nextValue)
      }

      onValueChange?.(nextValue)
    },
    [controlledValue, onValueChange],
  )

  const registerItem = React.useCallback((itemValue: string, label: string) => {
    setItems(prev => {
      if (prev[itemValue] === label) {
        return prev
      }

      return {
        ...prev,
        [itemValue]: label,
      }
    })
  }, [])

  React.useEffect(() => {
    if (!open) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target

      if (!(target instanceof Node)) {
        return
      }

      if (!containerRef.current?.contains(target)) {
        setOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    window.addEventListener("mousedown", handlePointerDown)
    window.addEventListener("keydown", handleEscape)

    return () => {
      window.removeEventListener("mousedown", handlePointerDown)
      window.removeEventListener("keydown", handleEscape)
    }
  }, [open])

  const contextValue = React.useMemo(
    () => ({
      value,
      setValue,
      open,
      setOpen,
      disabled,
      items,
      registerItem,
    }),
    [disabled, items, open, registerItem, setValue, value],
  )

  return (
    <SelectContext.Provider value={contextValue}>
      <div ref={containerRef} className="relative w-full">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

const SelectGroup = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("space-y-1", className)} {...props} />
)
SelectGroup.displayName = "SelectGroup"

type SelectValueProps = {
  placeholder?: string
  defaultValue?: string
  className?: string
}

const SelectValue = ({ placeholder, className }: SelectValueProps) => {
  const { value, items } = useSelectContext()
  const selectedLabel = value ? items[value] ?? value : ""
  const text = selectedLabel || placeholder || ""

  return (
    <span className={cn("line-clamp-1", className)} data-placeholder={!selectedLabel ? true : undefined}>
      {text}
    </span>
  )
}
SelectValue.displayName = "SelectValue"

const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, disabled, onClick, onKeyDown, type = "button", ...props }, ref) => {
    const { open, setOpen, disabled: selectDisabled } = useSelectContext()
    const isDisabled = Boolean(disabled || selectDisabled)

    return (
      <button
        ref={ref}
        type={type}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        disabled={isDisabled}
        onClick={event => {
          onClick?.(event)

          if (!event.defaultPrevented && !isDisabled) {
            setOpen(!open)
          }
        }}
        onKeyDown={event => {
          onKeyDown?.(event)

          if (event.defaultPrevented || isDisabled) {
            return
          }

          if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
            event.preventDefault()
            setOpen(true)
          }
        }}
        {...props}>
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>
    )
  },
)
SelectTrigger.displayName = "SelectTrigger"

type SelectContentProps = React.HTMLAttributes<HTMLDivElement> & {
  position?: "popper" | "item-aligned"
}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, position: _position = "popper", ...props }, ref) => {
    const { open } = useSelectContext()

    return (
      <div
        ref={ref}
        role="listbox"
        className={cn(
          "absolute left-0 top-[calc(100%+0.25rem)] z-50 max-h-96 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
          "transition duration-150 ease-out",
          open ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0",
          className,
        )}
        {...props}>
        {children}
      </div>
    )
  },
)
SelectContent.displayName = "SelectContent"

const SelectLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)} {...props} />
  ),
)
SelectLabel.displayName = "SelectLabel"

type SelectItemProps = React.HTMLAttributes<HTMLDivElement> & {
  value: string
  disabled?: boolean
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, value, disabled = false, onClick, ...props }, ref) => {
    const { value: selectedValue, setValue, setOpen, registerItem } = useSelectContext()
    const label = React.useMemo(() => getTextContent(children).trim(), [children])
    const isSelected = selectedValue === value

    React.useEffect(() => {
      if (label) {
        registerItem(value, label)
      }
    }, [label, registerItem, value])

    return (
      <div
        ref={ref}
        role="option"
        aria-selected={isSelected}
        data-disabled={disabled ? "" : undefined}
        className={cn(
          "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
          "focus:bg-accent focus:text-accent-foreground",
          disabled ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-accent hover:text-accent-foreground",
          className,
        )}
        onClick={event => {
          onClick?.(event)

          if (event.defaultPrevented || disabled) {
            return
          }

          setValue(value)
          setOpen(false)
        }}
        {...props}>
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          {isSelected ? <Check className="h-4 w-4" /> : null}
        </span>
        {children}
      </div>
    )
  },
)
SelectItem.displayName = "SelectItem"

const SelectSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />,
)
SelectSeparator.displayName = "SelectSeparator"

const SelectScrollUpButton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center justify-center py-1 text-muted-foreground", className)} {...props}>
      <ChevronUp className="h-4 w-4" />
    </div>
  ),
)
SelectScrollUpButton.displayName = "SelectScrollUpButton"

const SelectScrollDownButton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center justify-center py-1 text-muted-foreground", className)} {...props}>
      <ChevronDown className="h-4 w-4" />
    </div>
  ),
)
SelectScrollDownButton.displayName = "SelectScrollDownButton"

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
