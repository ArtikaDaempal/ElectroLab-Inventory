'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { X, Camera } from 'lucide-react'
import { Button } from './button'

interface QRScannerProps {
  onScan: (decodedText: string) => void
  onClose: () => void
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  useEffect(() => {
    // Inisialisasi scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
      },
      /* verbose= */ false
    )

    scanner.render(
      (decodedText) => {
        // Berhasil scan
        onScan(decodedText)
        scanner.clear().catch(err => console.error("Failed to clear scanner", err))
      },
      (errorMessage) => {
        // Error saat scanning (biasanya karena tidak ada QR di depan kamera)
        // Kita diamkan saja agar tidak spamming console
      }
    )

    scannerRef.current = scanner

    // Cleanup saat unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err))
      }
    }
  }, [onScan])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Camera className="text-blue-400" size={18} />
            <h3 className="text-white font-bold text-sm">Scan QR Alat</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </Button>
        </div>

        <div className="p-4">
          <div id="reader" className="rounded-xl overflow-hidden border border-slate-800 bg-black"></div>
          
          <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <p className="text-[10px] text-blue-400 text-center leading-relaxed">
              Arahkan kamera ke label QR Code yang tertera pada alat laboratorium. 
              Sistem akan otomatis mendeteksi identitas alat tersebut.
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-950/50 flex justify-center">
          <Button variant="outline" onClick={onClose} className="border-slate-800 text-slate-400 hover:text-white text-xs px-8">
            Batal
          </Button>
        </div>
      </div>

      <style jsx global>{`
        #reader { border: none !important; }
        #reader img { display: none !important; }
        #reader__status_span { display: none !important; }
        #reader__scan_region { background: #000 !important; }
        #reader button {
          background-color: #3b82f6 !important;
          color: white !important;
          border: none !important;
          padding: 8px 16px !important;
          border-radius: 6px !important;
          font-size: 12px !important;
          cursor: pointer !important;
          margin-top: 10px !important;
        }
        #reader select {
          background-color: #1e293b !important;
          color: white !important;
          border: 1px solid #334155 !important;
          padding: 4px !important;
          border-radius: 4px !important;
          font-size: 12px !important;
          margin-bottom: 10px !important;
        }
      `}</style>
    </div>
  )
}
