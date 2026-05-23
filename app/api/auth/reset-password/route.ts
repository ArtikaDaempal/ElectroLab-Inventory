import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()
    if (!token || !password) return Response.json({ error: 'Token dan password diperlukan' }, { status: 400 })

    if (password.length < 8) {
      return Response.json({ error: 'Password baru minimal 8 karakter' }, { status: 400 })
    }

    // Cari user berdasarkan token reset
    const { data: user, error } = await supabase
      .from('User')
      .select('id')
      .eq('verificationToken', token)
      .single()

    if (error || !user) {
      return Response.json({ error: 'Token reset tidak valid atau telah kedaluwarsa' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const { error: updateError } = await supabase
      .from('User')
      .update({
        password: hashedPassword,
        verificationToken: null // hapus token agar sekali pakai
      })
      .eq('id', user.id)

    if (updateError) {
      return Response.json({ error: 'Gagal memperbarui password: ' + updateError.message }, { status: 500 })
    }

    return Response.json({ success: true, message: 'Password berhasil diubah!' })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
