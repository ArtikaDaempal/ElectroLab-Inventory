import { NextRequest } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['KEPALA_LAB', 'KAJUR'].includes(user.role)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const sp = req.nextUrl.searchParams
  const tabel = sp.get('tabel')
  const limit = Number(sp.get('limit') || 50)

  let query = supabase.from('AuditLog').select('*').order('createdAt', { ascending: false }).limit(limit)
  
  if (user.role === 'KEPALA_LAB') {
    query = query.eq('labId', user.labId)
  }

  if (tabel) query = query.eq('tabel', tabel)

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}
