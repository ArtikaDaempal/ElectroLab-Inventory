'use client'
import { Heart, Laptop, ShieldCheck, Globe } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-800/60 pt-6 pb-4 text-xs text-slate-500 w-full shrink-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <p className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Laptop size={14} className="text-blue-400" /> 
            ElectroLab-Inventory
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Sistem Informasi Inventaris Laboratorium Teknik Elektro
          </p>
        </div>

        {/* Tautan Resmi Institusi & Status */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px]">
          <a 
            href="https://polimdo.ac.id/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-blue-400 text-slate-400 transition-colors underline decoration-slate-800 underline-offset-4"
          >
            <Globe size={12} className="text-blue-500" />
            Politeknik Negeri Manado
          </a>
          <span className="hidden sm:inline text-slate-800">|</span>
          <a 
            href="https://elektro.polimdo.ac.id/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-blue-400 text-slate-400 transition-colors underline decoration-slate-800 underline-offset-4"
          >
            <Globe size={12} className="text-blue-500" />
            Teknik Elektro Polimdo
          </a>
          <span className="hidden sm:inline text-slate-800">|</span>
          <span className="flex items-center gap-1 text-slate-400">
            <ShieldCheck size={12} className="text-emerald-500 animate-pulse shrink-0" />
            Supabase Connected
          </span>
          <span className="text-slate-500">v1.2.0</span>
        </div>
      </div>

      {/* Baris Bawah Hak Cipta */}
      <div className="mt-6 border-t border-slate-900/40 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-500">
        <p className="font-medium text-center sm:text-left leading-relaxed">
          © 2026 Sistem Inventaris Lab Elektro. Politeknik Negeri Manado. All Rights Reserved
        </p>
        <p className="flex items-center gap-1 text-slate-600">
          Crafted with <Heart size={10} className="text-red-500 fill-red-500" /> for Web Technology class
        </p>
      </div>
    </footer>
  )
}
