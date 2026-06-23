'use client'
import { motion } from 'framer-motion'
import { Users, ArrowLeft, Terminal, Award, Mail } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const developers = [
  {
    name: 'Artika Rosadelima daempal',
    nim: '23024198',
    role: 'Project Leader & Full-stack Developer',
    photo: '/artika.jpg',
    initials: 'AD',
    gradient: 'from-blue-600 to-indigo-600'
  },
  {
    name: 'Sherina Agnesia Kawuwung',
    nim: '23024185',
    photo: '',
    initials: 'SK',
    gradient: 'from-fuchsia-600 to-pink-600'
  },
  {
    name: 'Sisilia Fransisca Patutang',
    nim: '21024048',
    photo: '',
    initials: 'SP',
    gradient: 'from-emerald-600 to-teal-600'
  }
]

export default function PengembangPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Users className="text-blue-400 w-7 h-7" /> Tim Pengembang
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Para pengembang di balik aplikasi ElectroLab-Inventory
          </p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Link href="/dashboard">
            <Button variant="outline" className="border-slate-800 text-slate-300 hover:bg-slate-800/50 hover:text-white flex items-center gap-2">
              <ArrowLeft size={16} /> Kembali ke Beranda
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Info PBL */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
            <Terminal size={40} className="glow-blue-sm" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Project Based Learning (PBL)</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Aplikasi <strong>ElectroLab-Inventory</strong> (Sistem Informasi Inventaris Laboratorium Teknik Elektro) 
              dirancang dan dibangun sebagai bagian dari program Project Based Learning (PBL) Jurusan Teknik Elektro Politeknik Negeri Manado. 
              Sistem ini bertujuan untuk mempermudah inventarisasi, peminjaman peralatan, sertifikasi QR Code, dan pelaporan berkala secara digital dan transparan.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Developers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {developers.map((dev, index) => (
          <motion.div
            key={dev.nim}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="glass-card p-6 flex flex-col items-center text-center space-y-5 relative overflow-hidden group"
          >
            {/* Ambient Background Glow on Hover */}
            <div className={`absolute -inset-px bg-gradient-to-r ${dev.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl blur-xl`} />

            {/* Profile Image / Initials */}
            <div className="relative z-10">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-800 group-hover:border-blue-500/40 shadow-2xl transition-all duration-300 relative flex items-center justify-center bg-slate-900">
                {dev.photo ? (
                  <img 
                    src={dev.photo} 
                    alt={dev.name} 
                    className="w-full h-full object-cover object-[center_15%]" 
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${dev.gradient} flex items-center justify-center text-white text-4xl font-extrabold tracking-wider`}>
                    {dev.initials}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-slate-955 border border-slate-800 text-blue-400 shadow-md">
                <Award size={16} />
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 relative z-10 w-full">
              <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                {dev.name}
              </h3>
              <p className="text-[12px] font-mono text-cyan-400 font-semibold tracking-wider mt-1">
                NIM: {dev.nim}
              </p>
              {dev.role && (
                <div className="mt-2.5 flex justify-center">
                  <Badge variant="secondary" className="bg-slate-800/80 text-slate-355 border border-slate-700/50 text-[10px] px-2.5 py-0.5 font-medium rounded-full">
                    {dev.role}
                  </Badge>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Contact Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-8 max-w-2xl mx-auto text-center space-y-6 mt-12"
      >
        <div>
          <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
            <Mail className="text-blue-400 w-5 h-5" /> Hubungi Kami
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            Punya pertanyaan, kritik, atau saran? Hubungi tim pengembang langsung melalui kontak di bawah ini.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          {/* Gmail */}
          <a 
            href="https://mail.google.com/mail/?view=cm&fs=1&to=artikadaempal@gmail.com&su=Pesan%20-%20Inventaris%20Lab%20Elektro"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-red-550/10 border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white transition-all duration-300 font-semibold text-sm w-full sm:w-auto justify-center"
          >
            {/* Gmail SVG */}
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-1.29 1.454-2.032 2.514-1.202L12 11.33l9.486-7.075c1.06-.83 2.514-.088 2.514 1.202z"/>
            </svg>
            Gmail
          </a>

          {/* WhatsApp */}
          <a 
            href="https://wa.me/6282259965397?text=Halo%20Tim%20Pengembang%20ElectroLab-Inventory"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-emerald-550/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all duration-300 font-semibold text-sm w-full sm:w-auto justify-center"
          >
            {/* WhatsApp SVG */}
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.739-1.451L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.023-5.116-2.887-6.981-1.864-1.865-4.343-2.887-6.984-2.888-5.439 0-9.864 4.42-9.868 9.865-.001 1.748.458 3.456 1.331 4.966L1.9 22.044l4.747-1.89zM16.745 13.7c-.28-.14-1.65-.815-1.905-.907-.255-.093-.44-.139-.625.139-.185.278-.718.907-.88 1.093-.163.186-.325.21-.605.07-1.127-.565-1.92-.98-2.678-2.28-.195-.336.195-.312.558-1.034.062-.124.031-.233-.016-.326-.046-.093-.44-1.06-.602-1.452-.158-.38-.315-.328-.43-.334-.112-.006-.24-.006-.369-.006-.128 0-.339.047-.516.241-.177.194-.675.66-.675 1.612s.694 1.87 1.791 2.013c.11.015 2.132 3.256 5.165 4.562.72.311 1.282.497 1.722.637.723.23 1.382.197 1.902.12.58-.087 1.65-.675 1.88-1.296.23-.62.23-1.157.162-1.268-.07-.113-.255-.186-.534-.326z"/>
            </svg>
            WhatsApp
          </a>

          {/* GitHub */}
          <a 
            href="https://github.com/ArtikaDaempal"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-slate-500/10 border border-slate-700/30 text-slate-300 hover:bg-white hover:text-slate-950 transition-all duration-300 font-semibold text-sm w-full sm:w-auto justify-center"
          >
            {/* GitHub SVG */}
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.11.82-.26.82-.577v-2.234c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.82 1.102.82 2.222v3.293c0 .319.22.694.825.576C20.565 21.795 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            GitHub
          </a>
        </div>
      </motion.div>

      {/* Footer Info */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.6 }}
        className="text-center text-[11px] text-slate-500 pt-4"
      >
        Jurusan Teknik Elektro • Politeknik Negeri Manado • 2026
      </motion.div>
    </div>
  )
}
