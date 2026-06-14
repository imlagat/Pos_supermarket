import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/library';

export default function BarcodeScannerModal({ onScan, onClose }) {
  const videoRef = useRef(null);
  const [error, setError] = useState('');

  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let isActive = true;
    let codeReaderInstance = null;
    let activeStream = null;
    const currentVideoElement = videoRef.current;

    const startScanner = async () => {
      try {
        codeReaderInstance = new BrowserMultiFormatReader();
        
        // Request the camera stream manually
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        
        // If component unmounted while waiting for permissions, kill it instantly
        if (!isActive) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        activeStream = stream;

        // Pass our manually managed stream to ZXing
        codeReaderInstance.decodeFromStream(stream, currentVideoElement, (result, err) => {
          if (!isActive) return;
          if (result) {
            onScanRef.current(result.getText());
          }
        });

      } catch (err) {
        console.error("Camera access error:", err);
        if (isActive) setError('Camera access denied or unavailable. Please ensure you have granted camera permissions.');
      }
    };

    startScanner();

    return () => {
      isActive = false;
      // Force kill our manually managed stream
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
      if (currentVideoElement && currentVideoElement.srcObject) {
        const tracks = currentVideoElement.srcObject.getTracks ? currentVideoElement.srcObject.getTracks() : [];
        tracks.forEach(track => track.stop());
        currentVideoElement.srcObject = null;
      }
      if (codeReaderInstance) {
        try { codeReaderInstance.reset(); } catch(e){}
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Scan Barcode</h2>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }} 
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="p-2 hover:bg-red-500 hover:text-white rounded-full text-gray-500 transition-all duration-150 active:scale-90"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-4 flex flex-col items-center">
          {error ? (
            <p className="text-red-500 text-center font-medium my-8 p-4 bg-red-50 rounded-xl border border-red-200">
              {error}
            </p>
          ) : (
            <>
              <div className="w-full h-64 bg-black rounded-xl overflow-hidden relative shadow-inner">
                <video 
                  ref={videoRef} 
                  className="w-full h-full object-cover" 
                  muted 
                  playsInline 
                />
                {/* Scanner targeting box overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="w-3/4 h-32 border-2 border-orange-500 rounded-lg relative overflow-hidden">
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-orange-500"></div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-orange-500"></div>
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-orange-500"></div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-orange-500"></div>
                      <div className="absolute left-0 w-full h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)] animate-scan"></div>
                   </div>
                </div>
              </div>
              <style>{`
                @keyframes scan {
                  0%, 100% { top: 0%; opacity: 0; }
                  10% { opacity: 1; }
                  90% { opacity: 1; }
                  50% { top: 100%; opacity: 1; }
                }
                .animate-scan {
                  animation: scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }
              `}</style>
              <p className="text-sm text-center text-gray-500 mt-4">
                Position the barcode inside the camera frame. It will scan automatically.
              </p>
              <button 
                type="button"
                onClick={onClose}
                className="mt-6 w-full py-3 bg-red-50 text-red-600 font-bold rounded-xl border border-red-200 hover:bg-red-500 hover:text-white transition-all duration-150 shadow-sm active:scale-95"
              >
                Cancel Scanning
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
