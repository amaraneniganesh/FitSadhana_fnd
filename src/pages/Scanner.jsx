import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Keyboard, ScanLine, Loader2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';

const Scanner = () => {
  const navigate = useNavigate();
  
  // Camera State
  const [isStarting, setIsStarting] = useState(true);
  const [cameraError, setCameraError] = useState('');
  const scannerRef = useRef(null);
  const qrcodeRegionId = "html5qr-code-full-region";
  
  // Lookup State
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Unknown Barcode Fallback State
  const [unknownBarcode, setUnknownBarcode] = useState(null);
  const [unknownProductHint, setUnknownProductHint] = useState('');

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.error('Scanner stop error:', e);
      }
      scannerRef.current = null;
    }
  }, []);

  useEffect(() => {
    let timer = setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode(qrcodeRegionId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 15,
            disableFlip: false,
          },
          (decodedText) => {
            html5QrCode.stop().then(() => {
              scannerRef.current = null;
              handleScan(decodedText);
            }).catch(console.error);
          },
          () => { /* ignore parse errors */ }
        );
        setIsStarting(false);
      } catch (err) {
        console.error("Scanner Start Error:", err);
        setIsStarting(false);
        setCameraError('Camera access denied or unavailable. Use the manual entry below.');
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [stopScanner]);

  const saveLog = async (foodData) => {
    try {
      await api.post('/nutrition/log', { food: foodData });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleScan = async (barcode) => {
    await stopScanner();
    setLoading(true);
    setError('');
    
    try {
      // 1. Try Indian OFF, then Global OFF
      let product = null;
      const endpoints = [
        `https://in.openfoodfacts.org/api/v0/product/${barcode}.json`,
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      ];

      for (const url of endpoints) {
        try {
          const res = await fetch(url);
          const data = await res.json();
          if (data.status === 1 && data.product) {
            product = data.product;
            break;
          }
        } catch (_) { }
      }
      
      if (product) {
        const n = product.nutriments || {};
        
        const foodData = {
          name: `${product.product_name || product.product_name_en || 'Unknown Product'} (${product.quantity || '100g'})`,
          calories: Math.round(n['energy-kcal_100g'] || n['energy-kcal'] || (n['energy_100g'] ? n['energy_100g'] / 4.184 : 0)),
          protein: Math.round(n['proteins_100g'] || n['proteins'] || 0),
          carbs: Math.round(n['carbohydrates_100g'] || n['carbohydrates'] || 0),
          fat: Math.round(n['fat_100g'] || n['fat'] || 0)
        };

        if (foodData.calories === 0 && foodData.protein === 0) {
          setUnknownBarcode(barcode);
          return;
        }

        const success = await saveLog(foodData);
        if (success) {
          navigate('/dashboard');
        } else {
          setError('Failed to save scanned product.');
        }
      } else {
        // 2. Not found in databases — Ask user for product name
        setUnknownBarcode(barcode);
      }
    } catch (err) {
      setError('Error looking up barcode. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = () => {
    const code = manualCode.trim();
    if (!code) return;
    handleScan(code);
  };

  const handleUnknownBarcodeSubmit = async () => {
    if (!unknownProductHint.trim()) return;
    setLoading(true);
    setError('');
    
    try {
      const analyzeRes = await api.post('/nutrition/analyze', { 
        food: `Packaged Indian product with barcode ${unknownBarcode}. The user states the product is named "${unknownProductHint}". Provide accurate estimated nutrition per 100g serving for this specific product.` 
      });
      const success = await saveLog(analyzeRes.data);
      if (success) {
        setUnknownBarcode(null);
        navigate('/dashboard');
      } else {
        setError('Failed to save product.');
      }
    } catch (err) {
      setError(`Failed to estimate nutrition for ${unknownProductHint}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navbar */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-background/90 backdrop-blur-lg z-30">
        <button onClick={handleBack} className="p-2 -ml-2 rounded-xl bg-secondary text-text-secondary hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
            <ScanLine className="w-4 h-4 text-foreground" />
          </div>
          <h1 className="font-bold tracking-tight">Scan Product</h1>
        </div>
        <div className="w-9" /> {/* spacer for centering */}
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        <div className="max-w-md mx-auto p-5 space-y-6">
          
          {/* Camera View */}
          <div className="relative bg-[#111] w-full rounded-3xl overflow-hidden border border-border shadow-[0_0_40px_rgba(59,130,246,0.05)]" style={{ minHeight: '340px' }}>
            {cameraError ? (
              <div className="text-center p-6 flex flex-col items-center justify-center h-[340px]">
                <div className="w-14 h-14 bg-red-500/15 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-7 h-7" />
                </div>
                <p className="text-base text-red-400 font-bold mb-2">Camera Error</p>
                <p className="text-sm text-red-400/80 px-4">{cameraError}</p>
              </div>
            ) : (
              <>
                <style>{`
                  #${qrcodeRegionId} video {
                    object-fit: cover !important;
                    width: 100% !important;
                    height: 100% !important;
                    border-radius: 1.5rem !important;
                  }
                  #${qrcodeRegionId} {
                    border: none !important;
                  }
                `}</style>
                <div id={qrcodeRegionId} className="w-full h-full absolute inset-0" />
                
                {/* Scan overlay with corner markers */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
                  <div className="w-[260px] h-[160px] relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] border-accent rounded-tl-xl shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] border-accent rounded-tr-xl shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] border-accent rounded-bl-xl shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] border-accent rounded-br-xl shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                    
                    <motion.div 
                      className="absolute left-3 right-3 h-[3px] bg-gradient-to-r from-transparent -accent to-transparent shadow-[0_0_12px_4px_rgba(96,165,250,0.6)] rounded-full"
                      animate={{ top: ['10%', '90%', '10%'] }}
                      transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                    />
                    
                    <div className="absolute inset-0 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)]" />
                  </div>
                  
                  {isStarting ? (
                    <div className="mt-8 flex items-center gap-2 bg-black/80 px-5 py-2.5 rounded-full border border-border backdrop-blur-md">
                      <Loader2 className="w-4 h-4 animate-spin text-accent" />
                      <span className="text-xs text-foreground/90 font-medium tracking-wide">Initializing Camera...</span>
                    </div>
                  ) : (
                    <p className="mt-8 text-xs text-foreground/90 bg-black/80 px-5 py-2.5 rounded-full font-medium tracking-wide border border-border backdrop-blur-md">
                      Point camera at any barcode
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 py-2">
            <div className="h-px bg-secondary flex-1" />
            <span className="text-xs uppercase tracking-widest text-text-secondary font-bold">OR</span>
            <div className="h-px bg-secondary flex-1" />
          </div>

          {/* Manual Entry */}
          <div className="bg-[#111] p-5 rounded-3xl border border-border shadow-xl space-y-4">
            <div>
              <h3 className="font-bold text-foreground mb-1">Enter Barcode Manually</h3>
              <p className="text-xs text-text-secondary">Type or paste the number underneath the barcode.</p>
            </div>
            
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Keyboard className="w-5 h-5 text-text-secondary" />
                </div>
                <input
                  type="text"
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
                  placeholder="e.g. 8901030794483"
                  className="w-full bg-[#1a1a2e] border border-border rounded-2xl pl-12 pr-4 py-4 text-base font-mono text-foreground focus:outline-none focus:border-accent focus:ring-2 focus:-accent/20 transition-all placeholder:font-sans placeholder:text-text-secondary"
                />
              </div>
              
              <button
                onClick={handleManualSubmit}
                disabled={!manualCode.trim() || loading}
                className="w-full py-4 bg-accent rounded-2xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-accent/20 text-foreground"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ScanLine className="w-5 h-5" /> Lookup Product</>}
              </button>
            </div>
            
            {error && !error.includes('Camera') && (
              <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-xl text-center font-medium border border-red-500/20">{error}</p>
            )}
          </div>

        </div>
      </div>

      {/* Full Screen Loading Overlay for Lookup */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/90 backdrop-blur-xl flex flex-col items-center justify-center p-6"
          >
            <div className="w-20 h-20 bg-accent/10 border border-accent rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(59,130,246,0.2)]">
              <Loader2 className="w-10 h-10 text-accent animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Analyzing Product</h2>
            <p className="text-text-secondary text-center max-w-xs text-sm leading-relaxed">
              Querying global databases and AI models to find nutritional information...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unknown Barcode Fallback Modal */}
      <AnimatePresence>
        {unknownBarcode && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-[#111111] border border-border rounded-3xl p-6 shadow-2xl relative"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-accent/10 border border-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ScanLine className="w-8 h-8 text-accent" />
                </div>
                <h3 className="font-bold text-xl text-foreground">Product Not Found</h3>
                <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                  Code <span className="font-mono text-gray-200 bg-secondary px-1.5 py-0.5 rounded">{unknownBarcode}</span> isn't in our global database. 
                  <br/>Enter the product name to estimate its nutrition.
                </p>
              </div>
              
              <div className="space-y-4">
                <input 
                  autoFocus
                  type="text" 
                  placeholder="e.g. Sangam Sweets Dharwad Peda"
                  value={unknownProductHint}
                  onChange={(e) => setUnknownProductHint(e.target.value)}
                  className="bg-[#1a1a2e] border border-border rounded-xl px-4 py-4 text-base focus:outline-none focus:-accent focus:ring-2 focus:-accent/20 w-full text-foreground placeholder:text-text-secondary transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleUnknownBarcodeSubmit()}
                />
                
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => { setUnknownBarcode(null); setUnknownProductHint(''); }}
                    className="flex-1 py-4 rounded-xl bg-secondary hover:bg-secondary text-sm font-medium transition-colors text-text-secondary"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUnknownBarcodeSubmit}
                    disabled={!unknownProductHint.trim() || loading}
                    className="flex-1 py-4 rounded-xl bg-accent hover:-accent hover:to-indigo-500 text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-foreground shadow-lg shadow-accent/20"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Get Nutrition'}
                  </button>
                </div>
                {error && <p className="text-red-400 text-xs mt-3 text-center bg-red-500/10 p-2 rounded-lg">{error}</p>}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Scanner;
