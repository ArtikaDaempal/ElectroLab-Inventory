import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data: users, error } = await supabase
    .from('User')
    .select('email, nama, role, labId')

  return Response.json({ 
    users,
    error
  })
}
