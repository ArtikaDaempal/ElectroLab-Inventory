import { NextRequest } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return Response.json({ error: 'File tidak ditemukan' }, { status: 400 })

  const ext = file.name.split('.').pop()
  const path = `uploads/${user.id}/${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabase.storage.from('lab-images').upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  })

  if (error) return Response.json({ error: 'Upload gagal: ' + error.message }, { status: 500 })

  const { data: urlData } = supabase.storage.from('lab-images').getPublicUrl(path)
  return Response.json({ url: urlData.publicUrl })
}
