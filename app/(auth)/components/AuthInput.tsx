import { FieldErrors, UseFormRegister } from "react-hook-form"
import { twMerge } from "tailwind-merge"

interface FormData {
  email: string
  password: string
  contact: string
}

interface AuthInputProps {
  id: keyof FormData
  type?: string
  className?: string
  label: string
  placeholder?: string
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
  register: UseFormRegister<FormData>
  errors: FieldErrors
  disabled?: boolean
  required?: boolean
}

interface ValidationRules {
  [key: string]: {
    required: string
    pattern: {
      value: RegExp
      message: string
    }
  }
}

export function AuthInput({
  id,
  type,
  className,
  label,
  placeholder,
  startIcon,
  endIcon,
  register,
  errors,
  disabled,
  required, // TODO - check is required do something
}: AuthInputProps) {
  const validationRules: ValidationRules = {
    email: {
      required: "This field is required",
      pattern: {
        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
        message: "Enter valid email address",
      },
    },
    password: {
      required: "This field is required",
      pattern: {
        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[a-zA-Z0-9_\-%#$]{8,64}$/,
        message: "Must contain a-z A-Z 0-9 and _-%#$ are optional - between 8-64 symbols",
      },
    },
    contact: {
      required: "This field is required",
      pattern: {
        value:
          /^(?:(?:\+|00)([1-9]\d{0,2}))?[-. ()]*(?:\d{1,4}[-. ()]*){0,2}(?:\d{2,5}[-. ()]*){1,2}\d{2,5}$|^(?:https?:\/\/)?t\.me\/[a-z0-9-]{5,32}$/i,
        message: "Enter your telegram or phone number",
      },
    },
  }

  const {
    required: requiredMessage,
    pattern: { value: patternValue, message: patternMessage },
  } = validationRules[id]

  return (
    <div className="relative">
      <div className="flex flex-col">
        <div className="absolute left-3 translate-y-[50%] text-icon-color">{startIcon}</div>
        <p className="absolute text-placeholder-color top-0 left-2">{label}</p>
        <input
          className={twMerge(
            `p-4 pt-5 pb-2 bg-background text-subTitle border-t placeholder:text-placeholder-color outline-none`,
            startIcon && "pl-9",
            endIcon && "pr-9",
            disabled && "opacity-50 cursor-default pointer-events-none",
            errors[id] && "focus:ring-rose-500 focus-visible:ring-rose-600",
            className,
          )}
          id={id}
          type={type}
          placeholder={placeholder}
          {...register(id, {
            required: requiredMessage,
            pattern: {
              value: patternValue,
              message: patternMessage,
            },
          })}
        />
        <div className="absolute right-3 translate-y-[50%] text-icon-color">{endIcon}</div>
        {errors[id] && errors[id]?.message && (
          <span className="text-danger">{errors[id]?.message as React.ReactNode}</span>
        )}
      </div>
    </div>
  )
}
