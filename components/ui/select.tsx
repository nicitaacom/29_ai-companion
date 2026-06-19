"use client"

import { createContext, forwardRef, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { twMerge } from "tailwind-merge"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

type SelectContextValue = {
  value: string
  setValue: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
  disabled: boolean
  items: Record<string, string>
  registerItem: (value: string, label: string) => void
}

const SelectContext = createContext<SelectContextValue | null>(null)

const useSelectContext = () => {
  const context = useContext(SelectContext)
  if (!context) throw new Error("Select components must be used inside Select")
  return context
}

const getTextContent = (node: React.ReactNode): string => {
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(getTextContent).join("")
  if (!node || typeof node !== "object" || !("props" in node)) return ""
  return getTextContent((node as React.ReactElement<{ children?: React.ReactNode }>).props.children)
}

type SelectProps = {
  children: React.ReactNode
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
}

const Select = ({ children, value: controlledValue, defaultValue = "", onValueChange, disabled = false }: SelectProps) => {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Record<string, string>>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const value = controlledValue ?? uncontrolledValue

  const setValue = useCallback(
    (nextValue: string) => {
      if (controlledValue === undefined) setUncontrolledValue(nextValue)
      onValueChange?.(nextValue)
    },
    [controlledValue, onValueChange],
  )

  const registerItem = useCallback((itemValue: string, label: string) => {
    setItems(prev => (prev[itemValue] === label ? prev : { ...prev, [itemValue]: label }))
  }, [])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    window.addEventListener("mousedown", handlePointerDown)
    window.addEventListener("keydown", handleEscape)
    return () => {
      window.removeEventListener("mousedown", handlePointerDown)
      window.removeEventListener("keydown", handleEscape)
    }
  }, [open])

  const contextValue = useMemo(
    () => ({ value, setValue, open, setOpen, disabled, items, registerItem }),
    [disabled, items, open, registerItem, setValue, value],
  )

  return (
    <SelectContext.Provider value={contextValue}>
      <div className="relative w-full" ref={containerRef}>
        {children}
      </div>
    </SelectContext.Provider>
  )
}

const SelectGroup = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={twMerge("space-y-1", className)} {...props} />
)
SelectGroup.displayName = "SelectGroup"

type SelectValueProps = {
  placeholder?: string
  className?: string
}

const SelectValue = ({ placeholder, className }: SelectValueProps) => {
  const { value, items } = useSelectContext()
  const selectedLabel = value ? (items[value] ?? value) : ""
  const text = selectedLabel || placeholder || ""

  return (
    <span className={twMerge("line-clamp-1", className)} data-placeholder={!selectedLabel ? true : undefined}>
      {text}
    </span>
  )
}
SelectValue.displayName = "SelectValue"

const SelectTrigger = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, disabled, onClick, onKeyDown, type = "button", ...props }, ref) => {
    const { open, setOpen, disabled: selectDisabled } = useSelectContext()
    const isDisabled = Boolean(disabled || selectDisabled)

    return (
      <button
        className={twMerge(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        type={type}
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={isDisabled}
        onClick={event => {
          onClick?.(event)
          if (!event.defaultPrevented && !isDisabled) setOpen(!open)
        }}
        onKeyDown={event => {
          onKeyDown?.(event)
          if (event.defaultPrevented || isDisabled) return
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

const SelectContent = forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, position: _position = "popper", ...props }, ref) => {
    const { open } = useSelectContext()

    return (
      <div
        className={twMerge(
          "absolute left-0 top-[calc(100%+0.25rem)] z-50 max-h-96 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
          "transition duration-150 ease-out",
          open ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0",
          className,
        )}
        ref={ref}
        role="listbox"
        {...props}>
        {children}
      </div>
    )
  },
)
SelectContent.displayName = "SelectContent"

const SelectLabel = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div className={twMerge("py-1.5 pl-8 pr-2 text-sm font-semibold", className)} ref={ref} {...props} />
  ),
)
SelectLabel.displayName = "SelectLabel"

type SelectItemProps = React.HTMLAttributes<HTMLDivElement> & {
  value: string
  disabled?: boolean
}

const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, value, disabled = false, onClick, ...props }, ref) => {
    const { value: selectedValue, setValue, setOpen, registerItem } = useSelectContext()
    const label = useMemo(() => getTextContent(children).trim(), [children])
    const isSelected = selectedValue === value

    useEffect(() => {
      if (label) registerItem(value, label)
    }, [label, registerItem, value])

    return (
      <div
        className={twMerge(
          "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
          "focus:bg-accent focus:text-accent-foreground",
          disabled ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-accent hover:text-accent-foreground",
          className,
        )}
        ref={ref}
        role="option"
        aria-selected={isSelected}
        data-disabled={disabled ? "" : undefined}
        onClick={event => {
          onClick?.(event)
          if (event.defaultPrevented || disabled) return
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

const SelectSeparator = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div className={twMerge("-mx-1 my-1 h-px bg-muted", className)} ref={ref} {...props} />
  ),
)
SelectSeparator.displayName = "SelectSeparator"

const SelectScrollUpButton = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div className={twMerge("flex items-center justify-center py-1 text-muted-foreground", className)} ref={ref} {...props}>
      <ChevronUp className="h-4 w-4" />
    </div>
  ),
)
SelectScrollUpButton.displayName = "SelectScrollUpButton"

const SelectScrollDownButton = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div className={twMerge("flex items-center justify-center py-1 text-muted-foreground", className)} ref={ref} {...props}>
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
