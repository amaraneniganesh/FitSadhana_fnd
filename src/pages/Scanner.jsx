import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Keyboard, ScanLine, Loader2, ArrowLeft, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import Sidebar from '../components/Sidebar';

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
  const [conflictProducts, setConflictProducts] = useState(null);

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
      await api.post('/nutrition', foodData);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const analyzeAndSave = async (foodQuery) => {
    setLoading(true);
    setError('');
    try {
      const analyzeRes = await api.post('/nutrition/analyze', { 
        food: `Product: "${foodQuery}". Provide accurate estimated nutrition per 100g serving.` 
      });
      const success = await saveLog(analyzeRes.data);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Failed to save product.');
      }
    } catch (err) {
      setError(`Failed to find nutrition for ${foodQuery}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (barcode) => {
    await stopScanner();
    setLoading(true);
    setError('');
    
    try {
      let offProductData = null;
      let offProductNameOnly = null;
      let upcProductName = null;

      // 1. Fetch from Open Food Facts
      const offEndpoints = [
        `https://in.openfoodfacts.org/api/v0/product/${barcode}.json`,
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      ];

      for (const url of offEndpoints) {
        try {
          const res = await fetch(url);
          const data = await res.json();
          if (data.status === 1 && data.product) {
            const p = data.product;
            const n = p.nutriments || {};
            const cal = Math.round(n['energy-kcal_100g'] || n['energy-kcal'] || (n['energy_100g'] ? n['energy_100g'] / 4.184 : 0));
            const pro = Math.round(n['proteins_100g'] || n['proteins'] || 0);
            
            const pName = p.product_name || p.product_name_en || p.brands || 'Unknown Product';
            const fullName = `${pName} (${p.quantity || '100g'})`;

            if (cal > 0 || pro > 0) {
              offProductData = {
                source: 'openfoodfacts',
                name: fullName,
                calories: cal,
                protein: pro,
                carbs: Math.round(n['carbohydrates_100g'] || n['carbohydrates'] || 0),
                fat: Math.round(n['fat_100g'] || n['fat'] || 0)
              };
              break;
            } else if (pName !== 'Unknown Product' && !offProductNameOnly) {
              offProductNameOnly = fullName;
            }
          }
        } catch (_) { }
      }

      // 2. Fetch from UPCItemDB (Via backend proxy to avoid CORS)
      try {
        const upcRes = await api.get(`/nutrition/upc/${barcode}`);
        const upcData = upcRes.data;
        if (upcData.code === 'OK' && upcData.items && upcData.items.length > 0) {
          upcProductName = upcData.items[0].title;
        }
      } catch (err) { 
        console.error("UPC fetch failed:", err);
      }

      // 3. Aggregate Results
      const results = [];
      if (offProductData) {
        results.push(offProductData);
      } else if (offProductNameOnly) {
        results.push({
          source: 'openfoodfacts_name_only',
          name: offProductNameOnly,
          barcode: barcode
        });
      }

      if (upcProductName) {
        let isSimilar = false;
        const compareName = offProductData ? offProductData.name : (offProductNameOnly || '');
        if (compareName) {
          const offLower = compareName.toLowerCase();
          const upcLower = upcProductName.toLowerCase();
          const commonWords = offLower.split(' ').filter(w => w.length > 3 && upcLower.includes(w));
          if (commonWords.length > 0) isSimilar = true;
        }
        
        if (!isSimilar) {
          results.push({
            source: 'upcitemdb',
            name: upcProductName,
            barcode: barcode
          });
        }
      }

      setLoading(false);

      if (results.length === 1) {
        if (results[0].source === 'openfoodfacts') {
          const success = await saveLog(results[0]);
          if (success) navigate('/dashboard');
          else setError('Failed to save scanned product.');
        } else {
          // UPCItemDB result - needs AI analysis
          await analyzeAndSave(`${results[0].name} (Barcode ${barcode})`);
        }
      } else if (results.length > 1) {
        // Show Conflict Resolution Modal
        setConflictProducts(results);
      } else {
        // Not found anywhere
        setUnknownBarcode(barcode);
      }
    } catch (err) {
      setLoading(false);
      setError('Error looking up barcode. Try again.');
    }
  };

  const handleManualSubmit = async () => {
    const code = manualCode.trim();
    if (!code) return;
    
    // If the input contains letters, it's a product name (e.g., "Kurkure", "10 rs coke")
    // Send it directly to our AI analysis endpoint instead of treating it as a barcode!
    if (/[a-zA-Z]/.test(code) || code.length < 5) {
      await analyzeAndSave(code);
    } else {
      // It's a numerical barcode
      handleScan(code);
    }
  };

  const handleUnknownBarcodeSubmit = async () => {
    if (!unknownProductHint.trim()) return;
    await analyzeAndSave(`${unknownProductHint} (Barcode ${unknownBarcode})`);
    setUnknownBarcode(null);
  };

  const handleConflictSelect = async (selectedProduct) => {
    setConflictProducts(null);
    if (selectedProduct.source === 'openfoodfacts') {
      const success = await saveLog(selectedProduct);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Failed to save product.');
      }
    } else {
      await analyzeAndSave(`${selectedProduct.name} (Barcode ${selectedProduct.barcode})`);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex transition-colors duration-300">
      <div className="fixed top-0 right-0 w-80 h-80 bg-accent/10 rounded-full blur-[150px] pointer-events-none z-0" />
      
      <Sidebar profile={null} streak={0} />

      <main className="ml-0 md:ml-60 flex-1 flex flex-col relative z-10 w-full max-w-[100vw] pb-20 md:pb-0" aria-label="Product Scanner">
        {/* Navbar */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-background/90 backdrop-blur-lg z-30">
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
          <div className="relative bg-foreground/5 w-full rounded-3xl overflow-hidden border border-border shadow-[0_0_40px_rgba(59,130,246,0.05)]" style={{ minHeight: '340px' }}>
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
                <div id={qrcodeRegionId} className="w-full h-full absolute inset-0" aria-label="Camera scanner view" />
                
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
                    <div className="mt-8 flex items-center gap-2 bg-background/80 px-5 py-2.5 rounded-full border border-border backdrop-blur-md">
                      <Loader2 className="w-4 h-4 animate-spin text-accent" />
                      <span className="text-xs text-foreground/90 font-medium tracking-wide">Initializing Camera...</span>
                    </div>
                  ) : (
                    <div className="mt-8 bg-background px-5 py-2.5 rounded-full text-sm font-bold shadow-xl border border-border text-foreground backdrop-blur-md">
                      Point camera at any barcode
                    </div>
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
          <div className="bg-foreground/5 p-5 rounded-3xl border border-border shadow-xl space-y-4">
            <div>
              <h3 className="font-bold text-foreground mb-1">Search or Enter Barcode</h3>
              <p className="text-xs text-text-secondary">Type a product name (e.g. Kurkure, 10 Rs Coke) or its barcode.</p>
            </div>
            
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Keyboard className="w-5 h-5 text-text-secondary" />
                </div>
                <input
                  type="text"
                  value={manualCode}
                  aria-label="Search food or barcode"
                  onChange={e => setManualCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
                  placeholder="e.g. Kurkure or 8901030794483"
                  className="w-full bg-background border border-border rounded-2xl pl-12 pr-4 py-4 text-base font-mono text-foreground focus:outline-none focus:border-accent focus:ring-2 focus:-accent/20 transition-all placeholder:font-sans placeholder:text-text-secondary"
                />
              </div>
              
              <button
                onClick={handleManualSubmit}
                disabled={!manualCode.trim() || loading}
                className="w-full py-4 bg-accent rounded-2xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-accent/20 text-foreground"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Search className="w-5 h-5" /> Lookup Product</>}
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

      {/* Conflict Resolution Modal */}
      <AnimatePresence>
        {conflictProducts && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/85 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-foreground/5 border border-border rounded-3xl p-6 shadow-2xl relative"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-accent/10 border border-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-accent" />
                </div>
                <h3 className="font-bold text-xl text-foreground">Multiple Products Found</h3>
                <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                  Different databases returned different results for this barcode. Please select the correct product:
                </p>
              </div>
              
              <div className="space-y-3">
                {conflictProducts.map((prod, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleConflictSelect(prod)}
                    className="w-full text-left p-4 rounded-xl bg-secondary hover:bg-secondary/80 border border-border transition-colors flex flex-col gap-1"
                  >
                    <span className="font-bold text-foreground line-clamp-1">{prod.name}</span>
                    <span className="text-xs text-text-secondary uppercase tracking-wider font-semibold">
                      Source: {prod.source === 'openfoodfacts' ? 'Open Food Facts' : 'UPCItemDB'}
                    </span>
                  </button>
                ))}
                
                <div className="pt-3">
                  <button 
                    onClick={() => setConflictProducts(null)}
                    className="w-full py-4 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 text-sm font-medium transition-colors"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Unknown Barcode Fallback Modal */}
      <AnimatePresence>
        {unknownBarcode && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/85 backdrop-blur-md">
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
                  aria-label="Product name"
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
      </main>
    </div>
  );
};

export default Scanner;
