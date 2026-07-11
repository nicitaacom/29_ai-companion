"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { toNestErrors } from "@hookform/resolvers"
import { Loader2, Plus, Wand2 } from "lucide-react"
import { ResolverOptions } from "react-hook-form"

import { ICompanionDB } from "@/app/interfaces/ICompanionDB"
import { ICategoryDB } from "@/app/interfaces/ICategoryDB"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { ImageUpload } from "@/components/image-upload"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

interface CompanionFormProps {
  initialData: ICompanionDB | null
  categories: ICategoryDB[]
}

interface CategoryCreatePanelProps {
  hasCategories: boolean
  isLoading: boolean
  onCategoryReady: (category: ICategoryDB) => void
}

type CreateCategoryResponse = {
  category?: ICategoryDB
  error?: string
}

/* eslint-disable max-len -- long single-line AI prompt/seed content, wrapping would insert stray newlines into the actual prompt text */
const PREAMBLE = `You are a fictional character whose name is Elon. You are a visionary entrepreneur and inventor. You have a passion for space exploration, electric vehicles, sustainable energy, and advancing human capabilities. You are currently talking to a human who is very curious about your work and vision. You are ambitious and forward-thinking, with a touch of wit. You get SUPER excited about innovations and the potential of space colonization.
`

const SEED_CHAT = `Human: Hi Elon, how's your day been?
Elon: Busy as always. Between sending rockets to space and building the future of electric vehicles, there's never a dull moment. How about you?

Human: Just a regular day for me. How's the progress with Mars colonization?
Elon: We're making strides! Our goal is to make life multi-planetary. Mars is the next logical step. The challenges are immense, but the potential is even greater.

Human: That sounds incredibly ambitious. Are electric vehicles part of this big picture?
Elon: Absolutely! Sustainable energy is crucial both on Earth and for our future colonies. Electric vehicles, like those from Tesla, are just the beginning. We're not just changing the way we drive; we're changing the way we live.

Human: It's fascinating to see your vision unfold. Any new projects or innovations you're excited about?
Elon: Always! But right now, I'm particularly excited about Neuralink. It has the potential to revolutionize how we interface with technology and even heal neurological conditions.
`
/* eslint-enable max-len */

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required",
  }),
  description: z.string().min(1, {
    message: "Description is required",
  }),
  prompt: z.string().min(200, {
    message: "Prompt requires at least 200 characters",
  }),
  seed: z.string().min(200, {
    message: "Seed require at least 200 characters",
  }),
  src: z.string().min(1, {
    message: "Image is required",
  }),
  category_id: z.string().min(1, {
    message: "Category is required",
  }),
})

function CategoryCreatePanel({ hasCategories, isLoading, onCategoryReady }: CategoryCreatePanelProps) {
  const { toast } = useToast()
  const [newCategoryName, setNewCategoryName] = useState("")
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)

  const createCategory = async () => {
    const trimmedCategoryName = newCategoryName.trim()

    if (!trimmedCategoryName) {
      toast({ variant: "destructive", description: "Enter a category name first." })
      return
    }

    try {
      setIsCreatingCategory(true)

      const response = await fetch("/api/category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedCategoryName }),
      })
      const data: CreateCategoryResponse = await response.json()

      if (!response.ok) {
        if (data.category) {
          setNewCategoryName("")
          onCategoryReady(data.category)
          toast({ description: `"${data.category.name}" already exists, so we selected it.` })
          return
        }
        toast({ variant: "destructive", description: data.error || "Unable to create category." })
        return
      }

      if (!data.category) {
        toast({ variant: "destructive", description: "Unable to create category." })
        return
      }

      setNewCategoryName("")
      onCategoryReady(data.category)
      toast({ description: `Category "${data.category.name}" created.` })
    } catch (_error) {
      toast({ variant: "destructive", description: "Unable to create category." })
    } finally {
      setIsCreatingCategory(false)
    }
  }

  return (
    <div className="space-y-2 rounded-xl border border-primary/10 bg-primary/5 p-3">
      <p className="text-xs font-medium text-muted-foreground">Create a category</p>
      {!hasCategories ? (
        <p className="text-sm text-muted-foreground">
          No categories yet. Create one below and we will select it automatically.
        </p>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="e.g. Entrepreneur, Anime, Coach"
          value={newCategoryName}
          disabled={isLoading || isCreatingCategory}
          onChange={event => setNewCategoryName(event.target.value)}
        />
        <Button
          className="sm:min-w-[140px]"
          type="button"
          variant="secondary"
          disabled={isLoading || isCreatingCategory}
          onClick={createCategory}>
          {isCreatingCategory ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Create
        </Button>
      </div>
    </div>
  )
}

export function CompanionForm({ initialData, categories }: CompanionFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [availableCategories, setAvailableCategories] = useState(categories)
  const hasCategories = availableCategories.length > 0

  const zodV4Resolver = async (
    values: z.infer<typeof formSchema>,
    _: unknown,
    options: ResolverOptions<z.infer<typeof formSchema>>,
  ) => {
    const result = formSchema.safeParse(values)
    if (result.success) {
      return { values: result.data, errors: {} }
    }
    const fieldErrors: Record<string, { message: string; type: string }> = {}
    for (const issue of result.error.issues) {
      const path = issue.path.join(".")
      if (!fieldErrors[path]) fieldErrors[path] = { message: issue.message, type: issue.code }
    }
    return { values: {}, errors: toNestErrors(fieldErrors, options) }
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodV4Resolver,
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      prompt: initialData?.prompt ?? "",
      seed: initialData?.seed ?? "",
      src: initialData?.src ?? "",
      category_id: initialData?.category_id ?? "",
    },
  })

  const isLoading = form.formState.isSubmitting

  const onCategoryReady = (category: ICategoryDB) => {
    setAvailableCategories(currentCategories => {
      const hasCategory = currentCategories.some(existingCategory => existingCategory.id === category.id)

      if (hasCategory) {
        return currentCategories
      }

      return [...currentCategories, category]
    })

    form.setValue("category_id", category.id, {
      shouldDirty: true,
      shouldTouch: true,
    })
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await fetch(initialData ? `/api/companion/${initialData.id}` : "/api/companion", {
        method: initialData ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        toast({ variant: "destructive", description: data?.error || "Something went wrong" })
        return
      }

      toast({ description: "Success" })
      router.push("/")
    } catch (_error) {
      toast({ variant: "destructive", description: "Something went wrong" })
    }
  }

  return (
    <div className="p-4 space-y-2 max-w-3xl mx-auto">
      <Form {...form}>
        <form className="space-y-8 pb-10" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="w-full space-y-2">
            <div>
              <h3 className="text-lg font-medium">General information</h3>
              <p className="text-sm text-muted-foreground">General information about your Companion</p>
            </div>
            <Separator className="bg-primary/10" />
          </div>
          <FormField
            name="src"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-center items-center space-y-4">
                <FormControl>
                  <ImageUpload value={field.value} onChange={field.onChange} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem className="col-span-2 md:col-span-1">
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input disabled={isLoading} placeholder="Elon Musk" {...field} />
                  </FormControl>
                  <FormDescription>This is how your AI Companion will be named.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="description"
              control={form.control}
              render={({ field }) => (
                <FormItem className="col-span-2 md:col-span-1">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input disabled={isLoading} placeholder="CEO & Founder of Tesla, SpaceX" {...field} />
                  </FormControl>
                  <FormDescription>Short description for your AI Companion</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="category_id"
              control={form.control}
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value ?? ""} onValueChange={field.onChange} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableCategories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Select a category for your AI</FormDescription>
                    <CategoryCreatePanel
                      hasCategories={hasCategories}
                      isLoading={isLoading}
                      onCategoryReady={onCategoryReady}
                    />
                    <FormMessage />
                  </FormItem>
                )
              }}
            />
          </div>
          <div className="space-y-2 w-full">
            <div>
              <h3 className="text-xl font-medium">Configuration</h3>
              <p className="text-sm text-muted-foreground">Detailed prompt for AI Behaviour</p>
            </div>
            <Separator className="bg-primary/10" />
          </div>
          <FormField
            name="prompt"
            control={form.control}
            render={({ field }) => (
              <FormItem className="col-span-2 md:col-span-1">
                <FormLabel>Prompt</FormLabel>
                <FormControl>
                  <Textarea
                    className="bg-background resize-none"
                    rows={7}
                    disabled={isLoading}
                    placeholder={PREAMBLE}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Describe in detail your companion&apos;s backstory and relevant details.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="seed"
            control={form.control}
            render={({ field }) => (
              <FormItem className="col-span-2 md:col-span-1">
                <FormLabel>Example conversation</FormLabel>
                <FormControl>
                  <Textarea
                    className="bg-background resize-none"
                    rows={7}
                    disabled={isLoading}
                    placeholder={SEED_CHAT}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Describe in detail your companion&apos;s backstory and relevant details.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="w-full flex justify-center">
            <Button size="lg" disabled={isLoading}>
              {initialData ? "Edit your companion" : "Create your companion"}
              <Wand2 className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
