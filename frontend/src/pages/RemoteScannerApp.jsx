import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { BrowserMultiFormatReader } from '@zxing/library';

export default function RemoteScannerApp() {
  const { sessionId } = useParams();
  const videoRef = useRef(null);
  const [error, setError] = useState('');
  const [lastScanned, setLastScanned] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);

  useEffect(() => {
    if (isCancelled) return;
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
          if (!isActive || isPaused) return;
          if (result) {
            handleScan(result.getText());
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
  }, [isPaused, isCancelled, sessionId]);

  const handleScan = async (scannedCode) => {
    setIsPaused(true);
    setLastScanned(scannedCode);
    
    // Vibrate device if supported
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }

    try {
      await api.post(`/remote-scan/session/${sessionId}`, { barcode: scannedCode });
      toast.success('Barcode synced!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to sync barcode to POS.');
    }

    // Resume scanning after 1.5 seconds
    setTimeout(() => {
      setLastScanned(null);
      setIsPaused(false);
    }, 1500);
  };

  if (isCancelled) {
    return (
      <div className="flex flex-col h-screen w-full bg-gray-900 text-white items-center justify-center p-6 text-center animate-fade-in">
        <CheckCircle className="w-20 h-20 text-red-500 mb-6 animate-bounce" />
        <h1 className="text-3xl font-bold mb-3">Scanner Closed</h1>
        <p className="text-gray-400 mb-10 text-lg">You can safely close this browser tab.</p>
        <button 
          onClick={() => setIsCancelled(false)} 
          className="w-full max-w-xs py-4 bg-orange-600 text-gray-900 rounded-2xl font-bold shadow-lg hover:bg-orange-400 active:scale-95 transition-all text-lg"
        >
          Scan Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-black text-white relative">
      <div className="p-4 bg-gray-900 shadow-md z-10 flex flex-col items-center justify-center">
        <h1 className="text-xl font-bold text-orange-600">Supermarket POS</h1>
        <p className="text-sm text-gray-400">Remote Scanner Connected</p>
      </div>

      <div className="flex-1 relative overflow-hidden bg-gray-800 flex items-center justify-center">
        {error ? (
          <div className="p-6 text-center max-w-sm">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-400 font-medium">{error}</p>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              className="w-full h-full object-cover" 
              muted 
              playsInline 
            />
            
            {/* Overlay Grid/Scanner line */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
              <div className={`w-full max-w-sm h-48 border-4 rounded-xl relative transition-colors duration-300 ${isPaused ? 'border-green-500 bg-green-500/20' : 'border-orange-600'}`}>
                {!isPaused && (
                  <div className="absolute left-0 w-full h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)] animate-scan"></div>
                )}
                {isPaused && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <CheckCircle className="w-16 h-16 text-green-500 animate-bounce" />
                  </div>
                )}
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
          </>
        )}
      </div>

      <div className="p-4 bg-gray-900 z-10 min-h-32 flex flex-col items-center justify-center">
        {lastScanned ? (
          <div className="text-center animate-fade-in mb-4">
            <p className="text-sm text-green-400 mb-1">Scanned Successfully!</p>
            <p className="text-xl font-mono tracking-widest">{lastScanned}</p>
          </div>
        ) : (
          <p className="text-center text-gray-400 animate-pulse mb-4">
            Point camera at a barcode to scan...
          </p>
        )}
        <button 
          type="button" 
          onClick={() => setIsCancelled(true)} 
          className="w-full max-w-sm mt-2 bg-red-600/10 text-red-500 font-bold py-4 rounded-xl border border-red-500/30 hover:bg-red-600 hover:text-white transition-all duration-150 shadow-sm active:scale-95 text-lg"
        >
          Close Scanner
        </button>
      </div>
    </div>
  );
}
