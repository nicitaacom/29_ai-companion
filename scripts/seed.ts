const { createClient } = require("@supabase/supabase-js")

const supabaseAdmin = createClient(
  "https://vahemcbozzowgcadavfm.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhaGVtY2Jvenpvd2djYWRhdmZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwNjk3NzgwMiwiZXhwIjoyMDIyNTUzODAyfQ.Dxt3F6o61Q-0_U5IrYG3nQEbO0HkY21vQK444RXhVoM",
)

async function main() {
  try {
    const categoriesData = [
      { name: "Famous People" },
      { name: "Movies & TV" },
      { name: "Musicians" },
      { name: "Games" },
      { name: "Animals" },
      { name: "Philosophy" },
      { name: "Scientists" },
    ]

    const { data, error } = await supabaseAdmin.from("category").insert(categoriesData)

    if (error) {
      console.error("Error seeding default categories:", error)
    } else {
      console.log("Categories seeded successfully:", data)
    }
  } catch (error) {
    console.error("Error seeding default categories:", error)
  }
}

main()
