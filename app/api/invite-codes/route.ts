import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSessionUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || (user.role !== 'KAJUR')) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: setting, error } = await supabase
    .from('Settings')
    .select('value')
    .eq('key', 'INVITE_CODES')
    .single()

  if (error && error.code !== 'PGRST116') {
    return Response.json({ error: error.message }, { status: 500 })
  }
  
  const codes = setting?.value ? JSON.parse(setting.value) : []
  return Response.json(codes)
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || (user.role !== 'KAJUR')) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { code, role } = await req.json()
  if (!code || !role) return Response.json({ error: 'Data tidak lengkap' }, { status: 400 })

  // Fetch existing codes
  const { data: setting } = await supabase
    .from('Settings')
    .select('value')
    .eq('key', 'INVITE_CODES')
    .single()

  const codes = setting?.value ? JSON.parse(setting.value) : []
  
  // Add new code with 1 hour expiry
  const newCode = {
    code,
    role,
    used: false,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString()
  }

  const updatedCodes = [newCode, ...codes]

  const { error: upsertError } = await supabase
    .from('Settings')
    .upsert({ 
      key: 'INVITE_CODES', 
      value: JSON.stringify(updatedCodes),
      updatedAt: new Date().toISOString()
    }, { onConflict: 'key' })

  if (upsertError) return Response.json({ error: upsertError.message }, { status: 500 })
  
  return Response.json(newCode)
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || (user.role !== 'KAJUR')) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { code } = await req.json()
  
  const { data: setting } = await supabase
    .from('Settings')
    .select('value')
    .eq('key', 'INVITE_CODES')
    .single()

  if (!setting) return Response.json({ ok: true })

  let codes = JSON.parse(setting.value)
  codes = codes.filter((c: any) => c.code !== code)

  const { error } = await supabase
    .from('Settings')
    .update({ value: JSON.stringify(codes), updatedAt: new Date().toISOString() })
    .eq('key', 'INVITE_CODES')

  if (error) return Response.json({ error: error.message }, { status: 500 })
  
  return Response.json({ ok: true })
}
