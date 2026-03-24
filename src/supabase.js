import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.https://oqodalrpjusbukkohgvp.supabase.co
const supabaseKey  = import.meta.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xb2RhbHJwanVzYnVra29oZ3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMzU2NDEsImV4cCI6MjA4OTkxMTY0MX0.NNO0YXTW9Uj2lmdAVWZHoDo5vV7w-pFjLQGhhhTj4Yc

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase env vars. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
