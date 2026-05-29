'use client'
import { Laptop, Globe } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-800/60 pt-6 pb-12 text-xs text-slate-400 w-full shrink-0 print:hidden">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <p className="font-semibold text-slate-350 flex items-center gap-1.5">
            <Laptop size={14} className="text-blue-500" /> 
            ElectroLab-Inventory
          </p>
          <p className="text-[11px] text-slate-455 leading-relaxed">
            Sistem Informasi Inventaris Laboratorium Teknik Elektro
          </p>
        </div>

        {/* Tautan Resmi & PBL */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-slate-400">
          <a 
            href="https://polimdo.ac.id/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-blue-400 transition-colors underline decoration-slate-800 underline-offset-4"
          >
            <Globe size={12} className="text-blue-500" />
            Politeknik Negeri Manado
          </a>
          <span className="hidden sm:inline text-slate-800">|</span>
          <a 
            href="https://elektro.polimdo.ac.id/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-blue-400 transition-colors underline decoration-slate-800 underline-offset-4"
          >
            <Globe size={12} className="text-blue-500" />
            Teknik Elektro Polimdo
          </a>
          <span className="hidden sm:inline text-slate-800">|</span>
          <span className="text-slate-400 font-medium">PBL Teknologi Web</span>
        </div>
      </div>
    </footer>
  )
}
