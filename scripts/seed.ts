const { createClient } = require("@supabase/supabase-js")

const supabaseClient = createClient(
  "https://vahemcbozzowgcadavfm.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhaGVtY2Jvenpvd2djYWRhdmZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY5Nzc4MDIsImV4cCI6MjAyMjU1MzgwMn0.NbhCKZEig0m6arLOR7RvljTOmO0pPiPLKmkjzn89AFE",
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

    const { data, error } = await supabaseClient.from("category").insert(categoriesData)

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
