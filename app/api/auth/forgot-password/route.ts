import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { v4 as uuid } from 'uuid'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return Response.json({ error: 'Email diperlukan' }, { status: 400 })

    const cleanEmail = email.toLowerCase().trim()
    const { data: user, error } = await supabase
      .from('User')
      .select('id, nama')
      .eq('email', cleanEmail)
      .single()

    if (error || !user) {
      return Response.json({ error: 'Email tidak terdaftar di sistem' }, { status: 404 })
    }

    const token = uuid()
    const { error: updateError } = await supabase
      .from('User')
      .update({ verificationToken: token })
      .eq('id', user.id)

    if (updateError) {
      return Response.json({ error: 'Gagal membuat token reset: ' + updateError.message }, { status: 500 })
    }

    // SMTP Config dari .env.local
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS

    if (!smtpUser || !smtpPass) {
      return Response.json({ 
        error: 'Konfigurasi SMTP Gmail belum diatur di berkas .env.local.',
        code: 'SMTP_NOT_CONFIGURED',
        token
      }, { status: 400 })
    }

    // Buat transporter Nodemailer dengan Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    })

    const resetLink = `${req.nextUrl.origin}/reset-password?token=${token}`

    // Kirim email asli ke Gmail user
    await transporter.sendMail({
      from: `"Inventaris Lab Elektro" <${smtpUser}>`,
      to: cleanEmail,
      subject: 'Reset Password Akun - Inventaris Lab',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #f1f5f9; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 32px;">🔋</span>
            <h2 style="color: #0f172a; margin-top: 12px; font-weight: 800; letter-spacing: -0.025em;">Reset Password Akun Anda</h2>
            <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Sistem Inventaris Laboratorium Teknik Elektro</p>
          </div>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 24px;" />
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">Halo <strong>${user.nama}</strong>,</p>
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">Kami menerima permintaan untuk mereset password akun Anda. Silakan klik tombol biru di bawah ini untuk membuat password baru Anda:</p>
          <div style="text-align: center; margin: 36px 0;">
            <a href="${resetLink}" style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 10px rgba(37,99,235,0.25);">Reset Password Sekarang</a>
          </div>
          <p style="color: #64748b; font-size: 13px; line-height: 1.6;">Tautan konfirmasi di atas hanya berlaku sekali pakai. Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini secara aman.</p>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">Email ini dikirim secara otomatis oleh sistem, mohon tidak membalas email ini.</p>
        </div>
      `
    })

    return Response.json({
      success: true,
      message: 'Email reset password asli berhasil dikirim ke alamat Gmail Anda!'
    })
  } catch (err: any) {
    console.error(err)
    return Response.json({ error: 'Gagal mengirim email: ' + err.message }, { status: 500 })
  }
}
