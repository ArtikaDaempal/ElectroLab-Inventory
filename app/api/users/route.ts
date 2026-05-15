import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const roleFilter = searchParams.get('role')
  const labIdFilter = searchParams.get('labId')

  // KAJUR can see all. Others can only see KEPALA_LAB for printing or their own lab.
  if (user.role !== 'KAJUR' && roleFilter !== 'KEPALA_LAB') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  let query = supabase.from('User').select('id,email,nama,nip,nim,role,aktif,pendingApproval,createdAt,labId')
    .neq('role', 'KAJUR')

  if (roleFilter) query = query.eq('role', roleFilter)
  if (labIdFilter) query = query.eq('labId', labIdFilter)

  const { data, error } = await query.order('createdAt', { ascending: false })
  
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}
