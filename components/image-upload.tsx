"use client"

import { useEffect, useState } from "react"
import { CldUploadButton } from "next-cloudinary"
import Image from "next/image"

interface ImageUploadProps {
  value: string
  onChange: (src: string) => void
  disabled?: boolean
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  return (
    <div className="space-y-4 w-full flex flex-col justify-center items-center">
      <CldUploadButton
        options={{ maxFiles: 1 }}
        uploadPreset="n5wuk6bj"
        onUpload={(result: any) => onChange(result.info.secure_url)}>
        <div
          className="p-4 border-4 border-dashed border-primary/10 rounded-lg hover:opacity-75 transition
         flex flex-col space-y-2 justify-center items-center">
          <div className="relative w-40 h-40">
            <Image className="rounded-lg object-cover" src={value || "/placeholder.svg"} alt="Upload" fill />
          </div>
        </div>
      </CldUploadButton>
    </div>
  )
}
