import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'
import { signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) return Response.json({ error: 'Email dan password diperlukan' }, { status: 400 })

    const { data: user, error } = await supabase
      .from('User')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (error || !user) return Response.json({ error: 'Email atau password salah' }, { status: 401 })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return Response.json({ error: 'Email atau password salah' }, { status: 401 })

    // Pengecekan verifikasi email dan pending approval dihapus agar langsung masuk
    if (!user.aktif) return Response.json({ error: 'Akun Anda telah dinonaktifkan.', code: 'INACTIVE' }, { status: 403 })

    const sessionUser = { id: user.id, email: user.email, nama: user.nama, role: user.role, nip: user.nip, nim: user.nim, fotoUrl: user.fotoUrl, aktif: user.aktif, labId: user.labId, createdAt: user.createdAt }
    const token = await signToken(sessionUser)

    const response = Response.json({ user: sessionUser })
    const headers = new Headers(response.headers)
    headers.set('Set-Cookie', `lab_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`)
    return new Response(response.body, { status: 200, headers })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
