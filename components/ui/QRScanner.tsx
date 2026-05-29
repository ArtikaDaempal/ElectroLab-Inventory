'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { X, Camera, RefreshCw, AlertTriangle, UploadCloud, ShieldAlert } from 'lucide-react'
import { Button } from './button'
import { motion, AnimatePresence } from 'framer-motion'

interface QRScannerProps {
  onScan: (decodedText: string) => void
  onClose: () => void
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const [mode, setMode] = useState<'camera' | 'file'>('camera')
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [fileError, setFileError] = useState<string | null>(null)
  const [scanningFile, setScanningFile] = useState<boolean>(false)

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null)
  const onScanRef = useRef(onScan)
  const reactId = useId()
  const readerId = `qr-reader-${reactId.replace(/:/g, '')}`

  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  const handleCameraError = (err: any) => {
    const errorStr = String(err);
    if (errorStr.includes('NotReadableError') || errorStr.includes('Could not start video source') || errorStr.includes('Could not start audio source')) {
      setError('Kamera tidak dapat diakses. Kemungkinan kamera sedang digunakan oleh aplikasi lain (seperti Zoom, OBS, Teams, atau tab browser lain).');
    } else if (errorStr.includes('NotAllowedError') || errorStr.includes('Permission denied')) {
      setError('Akses kamera ditolak. Silakan berikan izin akses kamera pada pengaturan browser Anda lalu coba lagi.');
    } else if (errorStr.includes('NotFoundError') || errorStr.includes('Requested device not found')) {
      setError('Kamera tidak terdeteksi pada perangkat Anda.');
    } else {
      setError(`Gagal mengakses kamera: ${errorStr}`);
    }
  }

  const startScanning = (instance: Html5Qrcode, cameraId: string) => {
    setLoading(true)
    setError(null)

    instance.start(
      cameraId,
      {
        fps: 15,
        qrbox: (width, height) => {
          const size = Math.min(width, height) * 0.7
          return { width: size, height: size }
        },
        aspectRatio: 1.0
      },
      (decodedText) => {
        // Success: stop scanning then trigger scan callback
        if (html5QrcodeRef.current) {
          const activeInstance = html5QrcodeRef.current
          html5QrcodeRef.current = null
          activeInstance.stop().then(() => {
            onScanRef.current(decodedText)
          }).catch((err) => {
            console.error('Error stopping scanner on success:', err)
            onScanRef.current(decodedText)
          })
        }
      },
      () => {
        // Verbose scan failure (called on every frame, so ignore)
      }
    )
    .then(() => {
      setLoading(false)
    })
    .catch((err) => {
      console.error('Error starting scanner:', err)
      handleCameraError(err)
      setLoading(false)
    })
  }

  // Active camera lifecycles
  useEffect(() => {
    if (mode !== 'camera') {
      if (html5QrcodeRef.current) {
        const instance = html5QrcodeRef.current
        html5QrcodeRef.current = null
        if (instance.isScanning) {
          instance.stop().catch((err) => console.error('Error stopping on mode change:', err))
        }
      }
      return
    }

    let isMounted = true
    setLoading(true)
    setError(null)

    // Delay initialization slightly to ensure container is fully mounted in the DOM
    const timer = setTimeout(() => {
      if (!isMounted) return

      const element = document.getElementById(readerId)
      if (!element) {
        setLoading(false)
        return
      }

      const instance = new Html5Qrcode(readerId)
      html5QrcodeRef.current = instance

      Html5Qrcode.getCameras()
        .then((devices) => {
          if (!isMounted) return
          if (devices && devices.length > 0) {
            setCameras(devices)
            
            // Prefer back camera if available
            const backCamera = devices.find(d => 
              d.label.toLowerCase().includes('back') || 
              d.label.toLowerCase().includes('rear') ||
              d.label.toLowerCase().includes('environment')
            )
            const defaultCameraId = backCamera ? backCamera.id : devices[0].id
            setSelectedCameraId(defaultCameraId)
            
            startScanning(instance, defaultCameraId)
          } else {
            setError('Kamera tidak terdeteksi pada perangkat Anda.')
            setLoading(false)
          }
        })
        .catch((err) => {
          if (!isMounted) return
          console.error('Error listing cameras:', err)
          handleCameraError(err)
          setLoading(false)
        })
    }, 150)

    return () => {
      isMounted = false
      clearTimeout(timer)
      if (html5QrcodeRef.current) {
        const instance = html5QrcodeRef.current
        html5QrcodeRef.current = null
        if (instance.isScanning) {
          instance.stop().catch((err) => console.error('Cleanup stop error:', err))
        }
      }
    }
  }, [mode, readerId])

  const handleCameraChange = async (cameraId: string) => {
    if (!cameraId || cameraId === selectedCameraId) return
    setSelectedCameraId(cameraId)
    
    if (html5QrcodeRef.current) {
      const instance = html5QrcodeRef.current
      setLoading(true)
      try {
        if (instance.isScanning) {
          await instance.stop()
        }
        startScanning(instance, cameraId)
      } catch (err) {
        console.error('Failed to change camera:', err)
        setError('Gagal beralih ke kamera pilihan.')
        setLoading(false)
      }
    }
  }

  const handleRetry = () => {
    setError(null)
    setLoading(true)
    
    if (html5QrcodeRef.current) {
      const instance = html5QrcodeRef.current
      if (instance.isScanning) {
        instance.stop().then(() => {
          if (selectedCameraId) startScanning(instance, selectedCameraId)
        }).catch(() => {
          if (selectedCameraId) startScanning(instance, selectedCameraId)
        })
      } else {
        if (selectedCameraId) startScanning(instance, selectedCameraId)
      }
    } else {
      // Hard refresh camera mode
      setMode('file')
      setTimeout(() => setMode('camera'), 50)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileError(null)
    setScanningFile(true)

    // Instantiate temp Html5Qrcode targeting container for file scan
    const tempScanner = new Html5Qrcode(readerId)
    tempScanner.scanFile(file, true)
      .then((decodedText) => {
        setScanningFile(false)
        onScanRef.current(decodedText)
      })
      .catch((err) => {
        console.error('Error scanning file:', err)
        setFileError('Format QR Code tidak terdeteksi pada gambar. Pastikan gambar jelas dan QR Code terlihat utuh.')
        setScanningFile(false)
      })
  }

  const handleClose = () => {
    if (html5QrcodeRef.current) {
      const instance = html5QrcodeRef.current
      html5QrcodeRef.current = null
      if (instance.isScanning) {
        instance.stop().then(onClose).catch(() => onClose())
        return
      }
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Camera className="text-blue-400" size={18} />
            <h3 className="text-white font-bold text-sm">Scan QR Alat</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} className="text-slate-400 hover:text-white rounded-lg">
            <X size={20} />
          </Button>
        </div>

        <div className="p-5">
          {/* Mode Switcher Tabs */}
          <div className="flex p-1 bg-slate-950/60 rounded-xl border border-slate-800/80 mb-4">
            <button
              onClick={() => setMode('camera')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all border ${
                mode === 'camera'
                  ? 'bg-blue-600/10 border-blue-500/20 text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300 border-transparent bg-transparent'
              }`}
            >
              <Camera size={14} />
              Kamera Aktif
            </button>
            <button
              onClick={() => setMode('file')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all border ${
                mode === 'file'
                  ? 'bg-blue-600/10 border-blue-500/20 text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300 border-transparent bg-transparent'
              }`}
            >
              <UploadCloud size={14} />
              Upload Gambar
            </button>
          </div>

          {/* Tab Contents */}
          <div className="relative">
            {mode === 'camera' ? (
              <div className="space-y-4">
                {/* Camera View Box */}
                <div className="relative rounded-xl overflow-hidden aspect-square border border-slate-800 bg-slate-950/80 flex items-center justify-center">
                  {/* Native Html5Qrcode target container */}
                  <div id={readerId} className="w-full h-full object-cover"></div>

                  {/* Laser Scan Animation Overlay */}
                  {!error && !loading && (
                    <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                      {/* Bounding box outline */}
                      <div className="w-[70%] h-[70%] border border-blue-500/30 rounded-lg relative overflow-hidden bg-transparent">
                        {/* Laser line sweeping up and down */}
                        <div 
                          className="absolute left-0 right-0 h-0.5 bg-blue-400 shadow-[0_0_8px_2px_rgba(59,130,246,0.6)]" 
                          style={{ 
                            animation: 'laser-scan 2.5s infinite linear',
                            top: '0%'
                          }} 
                        />
                      </div>
                    </div>
                  )}

                  {/* Loading Placeholder */}
                  {loading && !error && (
                    <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center space-y-3 z-20">
                      <RefreshCw className="text-blue-500 animate-spin" size={26} />
                      <span className="text-xs text-slate-400 font-medium">Menyiapkan kamera...</span>
                    </div>
                  )}

                  {/* Camera Error Screen */}
                  {error && (
                    <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center space-y-4 z-20">
                      <div className="p-3 rounded-full bg-red-500/10 text-red-400 shadow-sm border border-red-500/20">
                        <AlertTriangle size={26} />
                      </div>
                      <div>
                        <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-2">Akses Kamera Gagal</h4>
                        <p className="text-[11px] text-red-400 leading-relaxed max-w-[280px] mx-auto">
                          {error}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleRetry}
                          className="h-8 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold border border-slate-700 flex items-center gap-1.5"
                        >
                          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
                          Coba Lagi
                        </Button>
                        <Button
                          onClick={() => setMode('file')}
                          className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1.5"
                        >
                          <UploadCloud size={11} />
                          Upload File
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Camera Selector Dropdown */}
                {cameras.length > 1 && !error && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Pilih Kamera</label>
                    <select
                      value={selectedCameraId}
                      onChange={(e) => handleCameraChange(e.target.value)}
                      className="w-full bg-slate-800/60 hover:bg-slate-800/80 border border-slate-700/80 text-white rounded-xl h-10 px-3 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                    >
                      {cameras.map((cam, idx) => (
                        <option key={cam.id} value={cam.id} className="bg-slate-900 text-white text-xs">
                          {cam.label || `Kamera ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Custom File Uploader Zone */}
                <div className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-slate-800 hover:border-blue-500/40 rounded-xl cursor-pointer bg-slate-950/30 hover:bg-slate-950/60 transition-all group relative p-4 overflow-hidden">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    disabled={scanningFile}
                  />
                  
                  {scanningFile ? (
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <RefreshCw className="text-blue-500 animate-spin" size={28} />
                      <p className="text-xs text-slate-400 font-medium">Membaca QR Code...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center space-y-3">
                      <div className="p-4 rounded-full bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-blue-400 transition-colors shadow-sm group-hover:scale-105 duration-300">
                        <UploadCloud size={24} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-slate-200 font-semibold group-hover:text-white">Klik atau seret gambar QR Code</p>
                        <p className="text-[10px] text-slate-500">Mendukung format PNG, JPG, JPEG, atau WebP</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* File Error Alert */}
                {fileError && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 text-left"
                  >
                    <ShieldAlert size={14} className="text-red-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] text-red-400 font-medium leading-normal">{fileError}</span>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Instruction Tag */}
          <div className="mt-4 p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
            <p className="text-[10px] text-blue-400 text-center leading-relaxed font-medium">
              {mode === 'camera' 
                ? 'Arahkan kamera Anda ke label QR Code yang tertera pada alat laboratorium.' 
                : 'Pilih gambar dari galeri/file yang menampilkan kode QR secara jelas.'}
              <br />Sistem akan otomatis mendeteksi identitas alat tersebut.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/30 border-t border-slate-800/40 flex justify-center">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            className="border-slate-800 text-slate-400 hover:text-white text-xs px-8 h-9 rounded-xl transition-all"
          >
            Batal
          </Button>
        </div>
      </motion.div>

      {/* Embedded hidden container required for file scanning mechanics */}
      <div id={readerId} className="hidden" style={{ width: 0, height: 0 }} />

      <style jsx global>{`
        @keyframes laser-scan {
          0% { top: 0%; opacity: 0.1; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { top: 100%; opacity: 0.1; }
        }
        #${readerId} {
          width: 100% !important;
          height: 100% !important;
          border: none !important;
          background: transparent !important;
        }
        #${readerId} video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 12px !important;
        }
      `}</style>
    </div>
  )
}
