export interface IMessage {
  companion_id: string
  content: string
  created_at: string
  id: string
  role: "user" | "system"
  updated_at: string
  user_id: string
}
