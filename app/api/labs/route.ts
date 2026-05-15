import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { data, error } = await supabase
    .from('Laboratorium')
    .select('id, nama, kode, prodi')
    .order('nama', { ascending: true })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  
  return Response.json(data)
}
