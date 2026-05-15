export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 rounded-full opacity-15 blur-3xl"
        style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5 blur-3xl"
        style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 glow-blue-sm overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: '1px solid rgba(59,130,246,0.3)' }}>
            <img src="/logo.png" alt="Logo Poli" className="w-full h-full object-contain p-1" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">Lab Elektro Inventaris</h1>
          <p className="text-slate-400 text-sm mt-1">Sistem Manajemen Inventaris Laboratorium</p>
        </div>
        {children}
      </div>
    </div>
  )
}
