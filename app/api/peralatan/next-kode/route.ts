import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase.from('Peralatan').select('kodeAlat').order('kodeAlat', { ascending: false })
  const codes = (data || []).map((r) => r.kodeAlat).filter((c: string) => /^ALT-\d+$/.test(c))
  const maxNum = codes.reduce((max: number, c: string) => {
    const n = parseInt(c.replace('ALT-', ''))
    return n > max ? n : max
  }, 0)
  const next = `ALT-${String(maxNum + 1).padStart(3, '0')}`
  return Response.json({ kode: next })
}
