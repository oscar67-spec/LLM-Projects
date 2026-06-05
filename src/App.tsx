import React, { useState, useRef } from 'react';
import { Camera, Upload, Sparkles, AlertCircle, CheckCircle2, ChevronRight, Activity, ArrowRight, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { optimizeImage } from './services/skinAnalysis';
import { sendForAnalysis, type SkinAnalysisResult } from './services/api';

export default function App() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<SkinAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadingMessages = [
    "Analyzing Face...",
    "Analyzing Skin...",
    "Preparing Report..."
  ];

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target?.result as string);
        setShowResults(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!imageSrc) return;
    
    setIsAnalyzing(true);
    setLoadingStep(0);
    setResults(null);
    setErrorMsg(null);
    
    // Simulate multi-step analysis UI progression
    const step1 = setTimeout(() => setLoadingStep(1), 2000);
    const step2 = setTimeout(() => setLoadingStep(2), 4000);
    
    try {
      const compressedImage = await optimizeImage(imageSrc);
      const data = await sendForAnalysis(compressedImage);
      
      // Clear timers if API returns really fast
      clearTimeout(step1);
      clearTimeout(step2);
      
      setResults(data);
      setIsAnalyzing(false);
      setShowResults(true);
    } catch (e: any) {
      clearTimeout(step1);
      clearTimeout(step2);
      console.error(e);
      setErrorMsg("Analysis failed. Try another selfie.");
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setImageSrc(null);
    setShowResults(false);
    setResults(null);
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-screen flex flex-col bg-[#09090b] text-zinc-200 shadow-2xl overflow-hidden relative font-sans">
      
      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex justify-between items-center z-10 bg-gradient-to-b from-[#09090b] to-transparent">
        <div>
          <h1 className="font-serif text-3xl text-zinc-100 tracking-wide font-medium italic">SkinScore<span className="text-amber-200/80 not-italic font-sans text-xs uppercase align-top ml-1 tracking-widest">AI</span></h1>
          <p className="text-zinc-500 text-xs tracking-widest uppercase mt-1">Clinical Grade Analysis</p>
        </div>
        {imageSrc && (
          <button onClick={resetAnalysis} className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors">
            <X size={18} />
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-6 pb-12 flex flex-col pt-2 no-scrollbar overflow-y-auto">
        
        <AnimatePresence mode="popLayout">
          {!showResults && !isAnalyzing && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, filter: 'blur(5px)' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col"
            >
              <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[380px] relative overflow-hidden group">
                
                {/* Abstract background blobs */}
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-amber-900/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-zinc-800/30 rounded-full blur-3xl"></div>

                {imageSrc ? (
                  <div className="absolute inset-0 w-full h-full p-2">
                    <img src={imageSrc} alt="Selfie" className="w-full h-full object-cover rounded-2xl opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#09090b]/90 via-transparent to-transparent pointer-events-none rounded-2xl"></div>
                  </div>
                ) : (
                  <div className="text-center z-10 flex flex-col items-center">
                    <div className="w-20 h-20 mb-6 rounded-full border border-zinc-700/50 bg-zinc-800/30 flex items-center justify-center text-zinc-400 shadow-xl relative">
                      <div className="absolute inset-0 rounded-full border border-zinc-600/20 animate-ping opacity-20" style={{ animationDuration: '3s' }}></div>
                      <Camera size={28} strokeWidth={1.5} />
                    </div>
                    <h2 className="text-xl font-medium text-zinc-200 mb-2 font-serif italic">Scan Your Skin</h2>
                    <p className="text-sm text-zinc-500 max-w-[240px] leading-relaxed">
                      Upload a well-lit, makeup-free selfie for a comprehensive clinical analysis.
                    </p>
                  </div>
                )}

                <input 
                  type="file" 
                  id="photoInput"
                  accept="image/*" 
                  capture="user" 
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden" 
                />
                
                {!imageSrc && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-8 z-10 bg-zinc-100 hover:bg-white text-zinc-900 px-8 py-3.5 rounded-full font-medium text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(255,255,255,0.05)] flex items-center gap-2"
                  >
                    <Upload size={16} />
                    Select Photo
                  </button>
                )}
              </div>

              {imageSrc && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6"
                >
                  {errorMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl flex items-start gap-2.5 text-sm"
                    >
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                      <p>{errorMsg}</p>
                    </motion.div>
                  )}
                  <button 
                    onClick={handleAnalyze}
                    className="w-full bg-gradient-to-r from-amber-200/90 to-amber-100 text-zinc-900 py-4 rounded-2xl font-semibold tracking-wide flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(251,191,36,0.15)] hover:shadow-[0_0_40px_rgba(251,191,36,0.25)] transition-all"
                  >
                    <Sparkles size={18} />
                    Analyze Skin
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full text-zinc-500 text-sm mt-4 py-2 hover:text-zinc-300 transition-colors"
                  >
                    Retake photo
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {isAnalyzing && (
            <motion.div 
              key="analyzing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex-1 flex flex-col items-center justify-center min-h-[400px]"
            >
              <div className="relative w-48 h-48 mb-12">
                {/* Scanning animation rings */}
                <div className="absolute inset-0 rounded-full border border-amber-900/20 animate-[spin_4s_linear_infinite]"></div>
                <div className="absolute inset-2 rounded-full border border-amber-900/40 border-t-amber-500/50 animate-[spin_3s_linear_infinite_reverse]"></div>
                <div className="absolute inset-4 rounded-full border border-zinc-800/80"></div>
                
                {imageSrc && (
                  <div className="absolute inset-5 rounded-full overflow-hidden opacity-30">
                    <img src={imageSrc} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-[#09090b]/40 backdrop-blur-sm"></div>
                  </div>
                )}
                
                {/* Laser scan line overlay */}
                <div className="absolute inset-5 overflow-hidden rounded-full rounded-full">
                  <motion.div 
                    animate={{ top: ['-10%', '110%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="absolute w-full h-[2px] bg-amber-400/80 shadow-[0_0_15px_rgba(251,191,36,0.8)]"
                  />
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <Activity className="text-amber-200/80 w-8 h-8" />
                </div>
              </div>

              <div className="text-center space-y-4 w-full px-8">
                <p className="text-sm font-medium tracking-widest text-zinc-400 uppercase">
                  AI Processing
                </p>
                <div className="h-6 relative overflow-hidden">
                  <AnimatePresence mode="popLayout">
                    <motion.h3 
                      key={loadingStep}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      className="text-xl font-serif italic text-zinc-100 absolute w-full text-center"
                    >
                      {loadingMessages[loadingStep]}
                    </motion.h3>
                  </AnimatePresence>
                </div>
                
                {/* Progress bar */}
                <div className="h-1 w-full bg-zinc-800/50 rounded-full overflow-hidden mt-6">
                  <motion.div 
                    className="h-full bg-amber-200/60"
                    initial={{ width: "5%" }}
                    animate={{ width: `${((loadingStep + 1) / loadingMessages.length) * 100}%` }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {showResults && !isAnalyzing && (
            <motion.div 
              key="results"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col space-y-6"
            >
              {/* Overall Score Banner */}
              {(() => {
                const acneScore = results?.acne || 0;
                const wrinkleScore = results?.wrinkles || 0;
                const darkCircleScore = results?.darkCircles || 0;
                const overallScore = Math.max(0, Math.round(100 - (acneScore + wrinkleScore + darkCircleScore) / 3));
                const isGood = overallScore > 75;
                const isFair = overallScore > 50;

                return (
                  <div className="bg-zinc-900 border border-zinc-800/60 rounded-3xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 w-full h-full bg-gradient-to-bl from-amber-900/10 to-transparent pointer-events-none"></div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-zinc-500 text-xs tracking-widest uppercase mb-1">Overall Vitality</p>
                        <h2 className="font-serif text-4xl text-zinc-100 italic">{overallScore}<span className="text-xl text-zinc-600 not-italic">/100</span></h2>
                      </div>
                      <div className="w-16 h-16 rounded-full bg-[#09090b] border border-zinc-800 flex items-center justify-center shadow-inner">
                        {imageSrc && <img src={imageSrc} className="w-14 h-14 rounded-full object-cover opacity-80 filter grayscale" alt="Thumb" />}
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-zinc-800/50 flex gap-2 items-start">
                      {isGood ? (
                        <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                      ) : (
                        <AlertCircle size={16} className={`mt-0.5 shrink-0 ${isFair ? 'text-amber-400' : 'text-rose-500'}`} />
                      )}
                      <p className="text-zinc-400 text-sm leading-relaxed">
                        {isGood 
                          ? "Your skin barrier is exceptional. Hydration levels are optimal, and texture appears very smooth."
                          : isFair
                            ? "Your skin barrier is decent. There are minor localized texture irregularities, but overall vitality is stable."
                            : "Your skin barrier needs attention. Hydration levels are likely low, and there are visible texture irregularities."}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Detailed Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <ScoreCard 
                  title="Acne Score" 
                  score={results?.acne || 0} 
                  status={(results?.acne || 0) < 30 ? "Clear" : (results?.acne || 0) < 60 ? "Moderate" : "Elevated"} 
                  delay={0.1} 
                  warning={(results?.acne || 0) >= 60} 
                />
                <ScoreCard 
                  title="Wrinkle Score" 
                  score={results?.wrinkles || 0} 
                  status={(results?.wrinkles || 0) < 30 ? "Minimal" : (results?.wrinkles || 0) < 60 ? "Suboptimal" : "Visible"} 
                  delay={0.2} 
                  accent 
                  warning={(results?.wrinkles || 0) >= 60} 
                />
                <ScoreCard 
                  title="Dark Circles" 
                  score={results?.darkCircles || 0} 
                  status={(results?.darkCircles || 0) < 30 ? "Faint" : (results?.darkCircles || 0) < 60 ? "Fair" : "Prominent"} 
                  delay={0.3} 
                  warning={(results?.darkCircles || 0) >= 60} 
                />
                <ScoreCard 
                  title="Skin Age" 
                  score={results?.skinAge || 0} 
                  subtitle="YRS" 
                  status={(results?.skinAge || 0) <= 30 ? "Optimal" : (results?.skinAge || 0) <= 45 ? "Maturing" : "Mature"} 
                  delay={0.4} 
                  warning={(results?.skinAge || 0) > 45} 
                />
              </div>

              {/* Next Steps CTA */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-4 mb-8 bg-zinc-900/50 border border-zinc-800/40 rounded-2xl p-4 flex justify-between items-center cursor-pointer hover:bg-zinc-800/50 transition-colors"
                onClick={() => alert("This would open the detailed diagnostic report.")}
              >
                <div>
                  <h4 className="text-zinc-200 font-medium text-sm">View Full Diagnostics</h4>
                  <p className="text-zinc-500 text-xs mt-0.5">Includes personalized routine</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center">
                  <ArrowRight size={14} />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}

function ScoreCard({ 
  title, 
  score, 
  subtitle, 
  status, 
  delay, 
  accent = false, 
  warning = false 
}: { 
  title: string; 
  score: number | string; 
  subtitle?: string; 
  status: string; 
  delay: number;
  accent?: boolean;
  warning?: boolean;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-zinc-900/40 border border-zinc-800/40 rounded-2xl p-4 flex flex-col justify-between aspect-square relative overflow-hidden"
    >
      {accent && <div className="absolute top-0 right-0 w-16 h-16 bg-amber-900/10 blur-xl rounded-full"></div>}
      {warning && <div className="absolute top-0 right-0 w-16 h-16 bg-rose-900/10 blur-xl rounded-full"></div>}
      
      <p className="text-zinc-500 font-medium text-xs tracking-wide">{title}</p>
      
      <div className="mt-auto">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-serif italic text-zinc-200">{score}</span>
          {subtitle && <span className="text-xs text-zinc-600 font-medium tracking-widest">{subtitle}</span>}
        </div>
        
        <div className="mt-2 flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${warning ? 'bg-amber-500' : 'bg-emerald-500/80'}`}></div>
          <span className="text-xs text-zinc-400">{status}</span>
        </div>
      </div>
    </motion.div>
  );
}
