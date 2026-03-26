"use client"

import * as React from "react"

function composeRefs<TValue>(...refs: Array<React.Ref<TValue> | undefined>) {
  return (value: TValue) => {
    refs.forEach(ref => {
      if (!ref) return
      if (typeof ref === "function") ref(value)
      else (ref as React.MutableRefObject<TValue | null>).current = value
    })
  }
}

function mergeProps(slotProps: Record<string, unknown>, childProps: Record<string, unknown>) {
  const overrideProps = { ...childProps }

  for (const propName in childProps) {
    const slotPropValue = slotProps[propName]
    const childPropValue = childProps[propName]
    const isHandler = /^on[A-Z]/.test(propName)

    if (isHandler) {
      if (slotPropValue && childPropValue) {
        overrideProps[propName] = (...args: unknown[]) => {
          ;(childPropValue as (...args: unknown[]) => void)(...args)
          ;(slotPropValue as (...args: unknown[]) => void)(...args)
        }
      } else if (slotPropValue) overrideProps[propName] = slotPropValue
    } else if (propName === "style") overrideProps[propName] = { ...(slotPropValue as object), ...(childPropValue as object) }
    else if (propName === "className") overrideProps[propName] = [slotPropValue, childPropValue].filter(Boolean).join(" ")
  }

  return { ...slotProps, ...overrideProps }
}

export const SlotSafe = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ children, ...slotProps }, forwardedRef) => {
    if (!React.isValidElement(children)) return null

    const childProps = children.props as Record<string, unknown> & { ref?: React.Ref<HTMLElement> }

    return React.cloneElement(children, {
      ...mergeProps(slotProps, childProps),
      ref: composeRefs(forwardedRef, childProps.ref),
    })
  },
)
SlotSafe.displayName = "SlotSafe"
