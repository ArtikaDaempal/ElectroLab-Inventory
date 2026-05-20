'use client'

import React, { useEffect, useId, useRef } from 'react'
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { X, Camera } from 'lucide-react'
import { Button } from './button'

interface QRScannerProps {
  onScan: (decodedText: string) => void
  onClose: () => void
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const onScanRef = useRef(onScan)
  const isHandlingScanRef = useRef(false)
  const reactId = useId()
  const readerId = `qr-reader-${reactId.replace(/:/g, '')}`

  const clearScanner = (scanner: Html5QrcodeScanner) => {
    return scanner.clear().catch((err) => {
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('removeChild') || message.includes('not a child')) return
      console.error('Failed to clear scanner', err)
    })
  }

  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  useEffect(() => {
    const reader = document.getElementById(readerId)
    if (!reader) return

    const scanner = new Html5QrcodeScanner(
      readerId,
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
      },
      /* verbose= */ false
    )

    scanner.render(
      (decodedText) => {
        if (isHandlingScanRef.current) return

        isHandlingScanRef.current = true
        scannerRef.current = null
        clearScanner(scanner).finally(() => onScanRef.current(decodedText))
      },
      () => {}
    )

    scannerRef.current = scanner

    return () => {
      if (!scannerRef.current) return

      const activeScanner = scannerRef.current
      scannerRef.current = null
      clearScanner(activeScanner)
    }
  }, [readerId])

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
          <div id={readerId} className="qr-reader rounded-xl overflow-hidden border border-slate-800 bg-black"></div>
          
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
        .qr-reader { border: none !important; }
        .qr-reader img { display: none !important; }
        .qr-reader [id$="__status_span"] { display: none !important; }
        .qr-reader [id$="__scan_region"] { background: #000 !important; }
        .qr-reader button {
          background-color: #3b82f6 !important;
          color: white !important;
          border: none !important;
          padding: 8px 16px !important;
          border-radius: 6px !important;
          font-size: 12px !important;
          cursor: pointer !important;
          margin-top: 10px !important;
        }
        .qr-reader select {
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
