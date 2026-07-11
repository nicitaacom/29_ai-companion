"use client"

import * as React from "react"

function composeRefs<TValue>(...refs: Array<React.Ref<TValue> | undefined>) {
  return (value: TValue | null) => {
    refs.forEach(ref => {
      if (!ref) return
      if (typeof ref === "function") ref(value)
      else if (typeof ref !== "string") (ref as React.MutableRefObject<TValue | null>).current = value
    })
  }
}

type AnyProps = Record<string, unknown>

function mergeProps(slotProps: AnyProps, childProps: AnyProps) {
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

    const child = children as React.ReactElement<AnyProps>
    const childProps = (child.props ?? {}) as AnyProps
    const childRef = (childProps.ref ?? undefined) as React.Ref<HTMLElement> | undefined

    return React.cloneElement(child, {
      ...mergeProps(slotProps as AnyProps, childProps),
      ref: composeRefs(forwardedRef, childRef),
    })
  },
)
SlotSafe.displayName = "SlotSafe"
