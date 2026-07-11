"use client"

import Image from "next/image"
import { CldUploadButton, CloudinaryUploadWidgetResults } from "next-cloudinary"
import { twMerge } from "tailwind-merge"

import { useMounted } from "@/app/hooks/use-mounted"

interface ImageUploadProps {
  value: string
  onChange: (src: string) => void
  disabled?: boolean
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const isMounted = useMounted()

  if (!isMounted) return null

  return (
    <div className="space-y-4 w-full flex flex-col justify-center items-center">
      <CldUploadButton
        options={{ maxFiles: 1 }}
        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
        onSuccess={(result: CloudinaryUploadWidgetResults) => {
          if (typeof result.info === "object" && result.info?.secure_url) onChange(result.info.secure_url)
        }}>
        <div
          className={twMerge(
            `p-4 border-4 border-dashed border-primary/10 rounded-lg hover:opacity-75 transition flex flex-col
             space-y-2 justify-center items-center`,
            disabled ? "opacity-50 pointer-events-none" : undefined,
          )}>
          <div className="relative w-40 h-40">
            <Image className="rounded-lg object-cover" src={value || "/placeholder.svg"} alt="Upload" fill />
          </div>
        </div>
      </CldUploadButton>
    </div>
  )
}
