export async function POST() {
  const response = Response.json({ ok: true })
  const headers = new Headers(response.headers)
  headers.set('Set-Cookie', 'lab_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0')
  return new Response(response.body, { status: 200, headers })
}
