import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://jukwvqtpsdvvisaxgiuu.supabase.co"
const supabaseKey = "sb_publishable_NZiDbW4JZikO06cunpVAUw_ceH22_HP"

export const supabase = createClient(supabaseUrl, supabaseKey)