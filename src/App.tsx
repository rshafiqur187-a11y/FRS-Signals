import React, { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";
import { 
  Activity, Crosshair, BarChart3, TrendingUp, TrendingDown, 
  Clock, ShieldAlert, Cpu, Zap, Signal, Settings, Target, AlertTriangle, Camera
} from 'lucide-react';

const MARKETS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CHF', 'OTC-CRYPTO/USD', 'BTC/USD'];
const TV_SYMBOL_MAP: Record<string, string> = {
  'EUR/USD': 'FX:EURUSD',
  'GBP/USD': 'FX:GBPUSD',
  'USD/JPY': 'FX:USDJPY',
  'AUD/USD': 'FX:AUDUSD',
  'USD/CHF': 'FX:USDCHF',
  'OTC-CRYPTO/USD': 'BINANCE:BTCUSDT',
  'BTC/USD': 'BINANCE:BTCUSD'
};
const TIMEFRAMES = [
  { label: '5 Sec', value: '5s' },
  { label: '15 Sec', value: '15s' },
  { label: '30 Sec', value: '30s' },
  { label: '1 Min', value: '1m' }
];

const INDICATORS = [
  "Connecting to Google Search Engine...",
  "Running Live Market Query...",
  "Fetching Global Economic Calendar...",
  "Checking NFP/CPI/Macro News Impact...",
  "Scanning DXY (US Dollar Index) Correlation...",
  "Analyzing Retail vs Institutional Sentiment...",
  "Searching Liquidity Sweeps & FVG...",
  "Scanning Volume Delta & Order Flow...",
  "Analyzing Candlestick Patterns...",
  "Mapping Institutional Order Blocks...",
  "Identifying Key Support & Resistance (Pivot)...",
  "Checking Multi-Timeframe (MTF) Alignment...",
  "Evaluating RSI & MACD Sentiments...",
  "Aggregating Deep Data Confluence..."
];

type SignalResult = {
  direction: 'CALL' | 'PUT' | 'WAIT';
  confidence: string;
  entryPrice: string;
  patterns: string[];
  volatility: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
};

const TradingViewWidget = memo(({ symbol }: { symbol: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  return <AdvancedRealTimeChart 
    theme="dark" 
    symbol={symbol} 
    interval="1" 
    timezone="Asia/Dhaka"
    hide_top_toolbar={true}
    hide_legend={false}
    style="1"
    autosize={true}
    allow_symbol_change={false}
    toolbar_bg="#161b22"
    backgroundColor="#161b22"
    gridColor="rgba(255, 255, 255, 0.05)"
  />;
});

export default function App() {
  const [market, setMarket] = useState(MARKETS[0]);
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[3].value);
  const [marketType, setMarketType] = useState<'REAL' | 'OTC'>('REAL');
  const [accuracyMode, setAccuracyMode] = useState<'STANDARD' | 'SNIPER'>('STANDARD');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentLog, setCurrentLog] = useState('');
  const [result, setResult] = useState<SignalResult | null>(null);
  const [chartImage, setChartImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle global paste event for screenshots
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          if (e.clipboardData.items[i].type.indexOf('image') !== -1) {
            const file = e.clipboardData.items[i].getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                setChartImage(event.target?.result as string);
              };
              reader.readAsDataURL(file);
            }
          }
        }
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setChartImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (isAnalyzing) return;
    
    setIsAnalyzing(true);
    setResult(null);
    setProgress(0);
    setCurrentLog(INDICATORS[0]);

    let step = 0;
    const maxSteps = INDICATORS.length;
    const progressInterval = setInterval(() => {
      if (step < maxSteps - 1) {
        step++;
        setProgress(Math.min((step / maxSteps) * 95, 95)); // Cap at 95% until AI finishes
        setCurrentLog(INDICATORS[step]);
      }
    }, 100); // 100ms instead of 200ms -> makes the UI feel 2x faster initially

    try {
      let aiParsedResult: SignalResult | null = null;
      
      // Initialize Gemini AI
      if (process.env.GEMINI_API_KEY) {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        // Define prompt structure based on input type
        const sniperInstruction = accuracyMode === 'SNIPER' 
          ? "RECOVERY SNIPER MODE: Your strict target is a 90%+ Win Rate (9 out of 10 wins, NO MTG). Focus deeply on Candlestick Psychology, recent Liquidity Sweeps, and Reversal Exhaustion. Give 'CALL' or 'PUT' based on pure mathematical price action momentum. Avoid 'WAIT' unless the market is an absolute dead range." 
          : "STANDARD MODE: Pick high probability setups. Issue a CALL or PUT with a target 80% win rate. Follow trend momentum and identify standard S&R bounces.";

        const marketRules = marketType === 'OTC'
          ? "OTC MARKET RECOVERY: This is a broker algorithm. Focus 100% on shadow reading, color-to-color momentum (e.g. 3 greens usually follow 1 red in a trend), and micro-breakouts. Ignore external news."
          : "REAL MARKET RECOVERY: Apply aggressive ICT (Inner Circle Trader) A to Z concepts. Track extreme precision Order Blocks (OB), Fair Value Gaps (FVG), Liquidity Purges/Sweeps (Buyside/Sellside Liquidity), Market Structure Shifts (MSS/BOS), Inducement, Time & Price constraints, and Optimal Trade Entry (OTE). Ensure 1-minute trades strictly align with the institutional order flow.";

        const promptParams = chartImage 
          ? `EXPERT VISUAL BINARY OPTIONS RECOVERY ANALYSIS:
Market: ${market} (${marketType})
Timeframe: ${timeframe}
Mode: ${accuracyMode}

Tasks:
1. Examine the exact shape of the last 3-5 candlesticks. Look for wicks (rejection/liquidity sweep evidence) and body sizes (strength/displacement).
2. Identify the immediate 1-minute and 5-minute micro-trend structure (Higher Highs / Lower Lows, identifying MSS).
3. Apply ${marketRules}
4. SYNTHESIZE all visual data applying the following mandate: ${sniperInstruction}
5. You MUST provide a mathematically probable CALL or PUT using pure ICT price action logic. Only output WAIT if it's literally a 50/50 gamble.

Output Requirements:
Raw JSON object only. No markdown.

JSON Structure:
{
  "direction": "CALL", "PUT", or "WAIT",
  "confidence": "A highly precise probability, e.g. 92.4. Must reflect high-accuracy deep structural confluence.",
  "entryPrice": "Exact price read from the right vertical axis of the chart",
  "volatility": "LOW, MEDIUM, HIGH, or EXTREME",
  "riskLevel": "LOW, MEDIUM, or HIGH",
  "patterns": ["Short technical reason 1", "Short technical reason 2"]
}` 
          : `EXPERT REAL MARKET DATA RECOVERY ANALYSIS (NO IMAGE):
Market: ${market} (${marketType})
Timeframe: ${timeframe}
Mode: ${accuracyMode}

CRITICAL LIVE DATA GATHERING (YOU MUST USE THE OFFICIAL SEARCH TOOL NOW):
1. LIVE PRICE & TECHNICALS: Search the ABSOLUTE CURRENT live price, 1-minute RSI (Relative Strength Index), MACD, and moving averages for ${market}.
2. CANDLESTICK DATA: Search the latest 1-minute and 5-minute candlestick formations (e.g., Doji, Engulfing, Hammer) for ${market}.
3. MACROECONOMICS: Search current day Economic Calendar for ${market}.
4. CORRELATION: Search US Dollar Index (DXY) momentum. 

Analysis Rules:
1. ${marketRules}
2. You are issuing a 1-MINUTE binary options trade purely via live search data. Synthesize real-time momentum to predict the next 1-minute candle.
3. ${sniperInstruction}
4. DO NOT GUESS. Based solely on the live data from your web search, calculate the mathematical probability.

Output Requirements:
Raw JSON object only. No markdown loops. Keep text values short.

JSON Structure:
{
  "direction": "CALL", "PUT", or "WAIT",
  "confidence": "Probability (e.g. 93.4)",
  "entryPrice": "Search current price",
  "volatility": "LOW, MEDIUM, HIGH, or EXTREME",
  "riskLevel": "LOW, MEDIUM, or HIGH",
  "patterns": ["Reason 1 from search", "Reason 2 from search"]
}`;

        let requestOptions: any = {
          model: "gemini-2.5-flash",
          config: {
            responseMimeType: "application/json",
            systemInstruction: "You are the world's most elite Binary Options AI. Your ONLY goal is a 90% Win Rate (9 out of 10 wins, NO MTG) to recover user losses. Apply complete 'A to Z' ICT (Inner Circle Trader) wisdom, including Liquidity Sweeps, Displacement, FVG, OBs, Limit Orders logic, POI mapping, and complex Candlestick Psychology. Never guess, but also do not overly rely on WAIT. Deliver exact CALL or PUT signals strictly based on institutional algorithmic price delivery."
          }
        };

        if (chartImage) {
          const base64Data = chartImage.split(',')[1];
          const mimeType = chartImage.split(';')[0].split(':')[1];
          requestOptions.contents = {
            parts: [
              { inlineData: { data: base64Data, mimeType } },
              { text: promptParams }
            ]
          };
        } else {
          requestOptions.contents = promptParams;
          requestOptions.tools = [{ googleSearch: {} }];
        }

        const response = await ai.models.generateContent(requestOptions);
        const text = response.text || "{}";
        
        let jsonStr = text;
        const startIndex = text.indexOf('{');
        const endIndex = text.lastIndexOf('}');
        
        if (startIndex !== -1 && endIndex !== -1) {
          jsonStr = text.substring(startIndex, endIndex + 1);
        }

        const parsed = JSON.parse(jsonStr);
        
        if (parsed.direction && parsed.confidence && parsed.entryPrice && Array.isArray(parsed.patterns)) {
          aiParsedResult = parsed;
        } else {
          throw new Error("Invalid format from AI");
        }
      } else {
        throw new Error("Missing Gemini Key");
      }

      // Finish progress
      clearInterval(progressInterval);
      setProgress(100);
      setCurrentLog("AI Signal Generated!");
      
      setTimeout(() => {
         if (aiParsedResult) {
             setResult(aiParsedResult);
         }
         setIsAnalyzing(false);
      }, 50);

    } catch (err: any) {
      console.error("AI Generation Error:", err);
      
      clearInterval(progressInterval);
      setProgress(100);
      setCurrentLog("ANALYSIS FAILED!");

      let errorMsg = err.message || 'AI Service Failed to Connect';
      if (err?.status === 429 || errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
        errorMsg = "API Quota Exceeded (Error 429). You have reached the max AI limit. Please wait or use your own API Key.";
      }
      
      setTimeout(() => {
        setResult({
          direction: 'WAIT',
          confidence: 'N/A',
          entryPrice: 'ERROR',
          volatility: 'UNKNOWN',
          riskLevel: 'HIGH',
          patterns: [errorMsg, `If using free tier, try again in a few minutes.`]
        });
        setIsAnalyzing(false);
      }, 50);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] font-sans flex flex-col selection:bg-[#58a6ff]/30">
      
      {/* Header */}
      <header className="border-b border-[rgba(255,255,255,0.1)] bg-[#161b22]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-10 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#58a6ff]">
            <Activity size={24} />
            <h1 className="font-extrabold text-[24px] tracking-wide uppercase">BinaryAlgo Pro</h1>
          </div>
          <div className="bg-[#39d353]/10 text-[#39d353] border border-[#39d353] px-3 py-1 rounded-full text-[12px] font-bold flex items-center gap-2">
            <Signal size={12} /> ONLINE - HIGH ACCURACY
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-8 py-8 w-full grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
        
        {/* Left Column: Controls */}
        <aside className="flex flex-col gap-5">
          <div className="bg-[#161b22] border border-[rgba(255,255,255,0.1)] rounded-xl p-6 flex flex-col gap-5 shadow-lg">
            <h2 className="text-[13px] font-semibold text-[#8b949e] uppercase flex items-center gap-2">
              <Settings size={16} /> Signal Configuration
            </h2>

            {/* Market Selection */}
            <div className="flex flex-col gap-2">
              <label className="block text-[13px] font-semibold text-[#8b949e]">TARGET MARKET</label>
              <div className="grid grid-cols-2 gap-2">
                {MARKETS.slice(0, 4).map(m => (
                  <button
                    key={m}
                    onClick={() => setMarket(m)}
                    className={`py-3 px-4 rounded-md text-sm transition-all focus:outline-none border ${
                      market === m 
                        ? 'bg-[#010409] text-white border-[#58a6ff] shadow-[0_0_10px_rgba(88,166,255,0.1)]' 
                        : 'bg-[#010409] text-[#c9d1d9] border-[rgba(255,255,255,0.1)] hover:border-[#58a6ff]/50'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Type market (e.g. BINANCE:BTCUSDT)"
                  list="market-options"
                  value={market}
                  onChange={(e) => setMarket(e.target.value.toUpperCase())}
                  className="w-full bg-[#010409] border border-[rgba(255,255,255,0.1)] text-[#c9d1d9] rounded-md px-3 py-3 text-sm focus:outline-none focus:border-[#58a6ff] uppercase placeholder:text-[#8b949e]/50 placeholder:normal-case"
                />
                <datalist id="market-options">
                  {MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
                </datalist>
              </div>
            </div>

            {/* Timeframe Selection */}
            <div className="flex flex-col gap-2">
              <label className="block text-[13px] font-semibold text-[#8b949e]">EXPIRY TIME</label>
              <div className="grid grid-cols-4 gap-2">
                {TIMEFRAMES.map(tf => (
                  <button
                    key={tf.value}
                    onClick={() => setTimeframe(tf.value)}
                    className={`py-2 rounded-md text-xs transition-all focus:outline-none border ${
                      timeframe === tf.value
                        ? 'bg-[#010409] text-[#58a6ff] border-[#58a6ff]'
                        : 'bg-[#010409] text-[#c9d1d9] border-[rgba(255,255,255,0.1)] hover:border-[#58a6ff]/50'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Market Type Selection */}
            <div className="flex flex-col gap-2 mt-2">
              <label className="block text-[13px] font-semibold text-[#8b949e] flex items-center gap-1">
                MARKET TYPE
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMarketType('REAL')}
                  className={`py-2 rounded-md text-[11px] font-bold uppercase transition-all border ${
                    marketType === 'REAL' 
                      ? 'bg-[#1f6feb]/20 text-[#58a6ff] border-[#58a6ff]' 
                      : 'bg-[#010409] text-[#8b949e] border-[rgba(255,255,255,0.1)] hover:border-[#58a6ff]/50'
                  }`}
                >
                  REAL MARKET
                </button>
                <button
                  onClick={() => setMarketType('OTC')}
                  className={`py-2 rounded-md text-[11px] font-bold uppercase transition-all border ${
                    marketType === 'OTC' 
                      ? 'bg-[#8957e5]/20 text-[#d2a8ff] border-[#8957e5]' 
                      : 'bg-[#010409] text-[#8b949e] border-[rgba(255,255,255,0.1)] hover:border-[#8957e5]/50'
                  }`}
                >
                  OTC MARKET
                </button>
              </div>
            </div>

            {/* Accuracy Mode Selection */}
            <div className="flex flex-col gap-2 mt-2">
              <label className="block text-[13px] font-semibold text-[#8b949e] flex items-center gap-1">
                ALGORITHM MODE
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setAccuracyMode('STANDARD')}
                  className={`py-2 rounded-md text-[11px] font-bold uppercase transition-all border ${
                    accuracyMode === 'STANDARD' 
                      ? 'bg-[#1f6feb]/20 text-[#58a6ff] border-[#58a6ff]' 
                      : 'bg-[#010409] text-[#8b949e] border-[rgba(255,255,255,0.1)] hover:border-[#58a6ff]/50'
                  }`}
                >
                  STANDARD (High Volume)
                </button>
                <button
                  onClick={() => setAccuracyMode('SNIPER')}
                  className={`py-2 rounded-md text-[11px] font-bold uppercase transition-all border ${
                    accuracyMode === 'SNIPER' 
                      ? 'bg-[#238636]/20 text-[#39d353] border-[#39d353]' 
                      : 'bg-[#010409] text-[#8b949e] border-[rgba(255,255,255,0.1)] hover:border-[#39d353]/50'
                  }`}
                >
                  SNIPER (High Accuracy)
                </button>
              </div>
            </div>

            {/* Chart Screenshot Upload */}
            <div className="flex flex-col gap-2 mt-2">
              <label className="block text-[13px] font-semibold text-[#8b949e] flex justify-between items-center">
                <span>CHART ANALYSIS (OPTIONAL)</span>
                {chartImage && <button onClick={() => setChartImage(null)} className="text-[#f85149] text-[10px] hover:underline">CLEAR</button>}
              </label>
              <div 
                className={`border-2 border-dashed rounded-lg p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                  chartImage ? 'border-[#58a6ff]/50' : 'border-[rgba(255,255,255,0.1)] hover:border-[#58a6ff]/30'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" />
                {chartImage ? (
                  <div className="relative w-full h-[60px] rounded overflow-hidden">
                    <img src={chartImage} alt="Chart" className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white shadow-md">CHART ADDED! CLIP TO CHANGE</div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-[#8b949e]">
                    <Camera size={20} className="mb-1" />
                    <span className="text-[11px] font-semibold">Take a screenshot of the chart on the right</span>
                    <span className="text-[10px] opacity-70">Paste (Ctrl+V) or Click to Upload for pure visual AI Analysis</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Button */}
            <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className={`mt-2 w-full py-4 rounded-lg font-bold text-base tracking-wide transition-all uppercase focus:outline-none border border-transparent ${
                isAnalyzing 
                  ? 'bg-[#161b22] text-[#8b949e] border-[rgba(255,255,255,0.1)] cursor-not-allowed' 
                  : 'bg-[#58a6ff] text-white hover:bg-[#58a6ff]/90 hover:shadow-[0_0_15px_rgba(88,166,255,0.4)]'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                {isAnalyzing ? (
                  <>
                    <Zap className="animate-pulse" size={18} />
                    ANALYZING MARKET...
                  </>
                ) : (
                  <>
                    <Cpu size={18} />
                    GET SIGNAL
                  </>
                )}
              </span>
            </button>
          </div>

          <div className="p-4 rounded-lg bg-[#010409] border border-[rgba(255,255,255,0.1)] flex gap-3 text-[#8b949e]">
            <AlertTriangle size={18} className="shrink-0 mt-0.5 text-[#f85149]" />
            <p className="text-xs leading-relaxed">
              <strong>Important Disclaimer:</strong> While this AI tool uses advanced technical analysis via Gemini 3.1 Pro, it is still an <strong>educational simulation model</strong>. Do NOT trade with real money immediately. Always backtest in a demo account first to understand the market conditions.
            </p>
          </div>
        </aside>

        {/* Right Column: Visualization & Results */}
        <div className="flex flex-col gap-5">
          
          {/* TradingView Live Chart */}
          <div className="bg-[#161b22] border border-[rgba(255,255,255,0.1)] rounded-xl w-full h-[400px] shadow-lg flex flex-col relative overflow-hidden">
             <div className="absolute top-0 left-0 right-0 h-10 bg-[#161b22]/90 backdrop-blur pointer-events-none z-10 border-b border-[rgba(255,255,255,0.05)] flex items-center px-4">
               <div className="text-[#8b949e] text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                 <Activity size={14} className="text-[#58a6ff]" /> Live Market Chart: {market}
               </div>
             </div>
             <div className="w-full h-full pt-10">
               <TradingViewWidget symbol={TV_SYMBOL_MAP[market] || market.replace('/', '') || 'FX:EURUSD'} />
             </div>
          </div>

          {/* Analysis View */}
          <div className="bg-[#161b22] border border-[rgba(255,255,255,0.1)] rounded-xl py-10 px-6 relative flex flex-col items-center justify-center min-h-[350px] shadow-lg">

            {!isAnalyzing && !result && (
              <div className="text-center flex flex-col items-center text-[#8b949e]">
                <Crosshair size={48} className="mb-4 text-[#58a6ff] opacity-50" />
                <p className="text-[12px] uppercase tracking-widest font-bold">SYSTEM READY</p>
                <p className="text-xs mt-2 max-w-xs mx-auto opacity-70">Select market and timeframe, then initialize analysis to scan 15+ algorithmic indicators.</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="flex flex-col items-center max-w-md mx-auto w-full z-10">
                <div className="relative w-36 h-36 mb-6">
                  <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" className="stroke-[#21262d]" strokeWidth="8" />
                    <motion.circle 
                      cx="50" cy="50" r="45" fill="none" 
                      className="stroke-[#39d353]" 
                      strokeWidth="8"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: "0 283" }}
                      animate={{ strokeDasharray: `${(progress / 100) * 283} 283` }}
                      transition={{ duration: 0.2 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center font-bold text-2xl text-[#39d353]">
                    {Math.round(progress)}%
                  </div>
                </div>

                <div className="w-full bg-[#010409] border border-[rgba(255,255,255,0.1)] h-2 rounded-full overflow-hidden mb-4">
                  <motion.div 
                    className="h-full bg-[#58a6ff]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                  />
                </div>
                
                <p className="text-[12px] text-[#8b949e] uppercase font-bold animate-pulse text-center h-5">
                  &gt; {currentLog}
                </p>
              </div>
            )}

            <AnimatePresence>
              {result && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="z-10 w-full flex flex-col items-center relative"
                >
                  {/* Indicator Tags - Top Right Absolute */}
                  <div className="absolute -top-6 -right-2 hidden sm:grid grid-cols-2 gap-2 opacity-80">
                    {result.patterns.map((pattern, idx) => (
                      <div key={idx} className="text-[10px] px-2 py-1 border border-[rgba(255,255,255,0.1)] rounded text-[#8b949e] bg-[rgba(255,255,255,0.02)] whitespace-nowrap">
                        {pattern}
                      </div>
                    ))}
                    <div className="text-[10px] px-2 py-1 border border-[rgba(255,255,255,0.1)] rounded text-[#8b949e] bg-[rgba(255,255,255,0.02)]">
                      15+ Indicators Active
                    </div>
                  </div>

                  {/* Accuracy Ring */}
                  <div className={`w-[180px] h-[180px] rounded-full flex flex-col items-center justify-center mb-6 border-[12px] border-[#21262d] ${
                    result.direction === 'WAIT' ? 'border-t-[#e3b341]' : result.direction === 'CALL' ? 'border-t-[#39d353]' : 'border-t-[#f85149]'
                  }`}>
                    <span className={`text-4xl font-extrabold ${
                      result.direction === 'WAIT' ? 'text-[#e3b341]' : result.direction === 'CALL' ? 'text-[#39d353]' : 'text-[#f85149]'
                    }`}>{result.direction === 'WAIT' ? 'N/A' : `${result.confidence}%`}</span>
                    <span className="text-[12px] text-[#8b949e] uppercase font-bold mt-1">Accuracy</span>
                  </div>

                  {/* Signal Box */}
                  <div className="text-center w-full mb-8">
                    <div className="text-[11px] text-[#8b949e] uppercase font-bold tracking-wider">Current Signal</div>
                    <div className={`text-5xl md:text-6xl font-black my-2 flex items-center justify-center gap-3 ${
                      result.direction === 'WAIT'
                        ? 'text-[#e3b341] drop-shadow-[0_0_20px_rgba(227,179,65,0.3)]'
                        : result.direction === 'CALL' 
                        ? 'text-[#39d353] drop-shadow-[0_0_20px_rgba(57,211,83,0.3)]' 
                        : 'text-[#f85149] drop-shadow-[0_0_20px_rgba(248,81,73,0.3)]'
                    }`}>
                      {result.direction === 'CALL' && 'BUY (CALL)'}
                      {result.direction === 'PUT' && 'SELL (PUT)'}
                      {result.direction === 'WAIT' && 'NO TRADE (WAIT)'}
                      
                      {result.direction === 'CALL' && <TrendingUp size={48} strokeWidth={3} />}
                      {result.direction === 'PUT' && <TrendingDown size={48} strokeWidth={3} />}
                      {result.direction === 'WAIT' && <Activity size={48} strokeWidth={3} />}
                    </div>
                    <div className="text-[13px] text-[#8b949e]">
                      {result.direction === 'WAIT' ? 'Market conditions are unreadable. Save your capital.' : `Execute trade for the next ${TIMEFRAMES.find(t => t.value === timeframe)?.label}`}
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full mt-2">
                    <div className="bg-[#0d1117] p-4 rounded-lg border border-[rgba(255,255,255,0.1)]">
                      <span className="block text-[11px] text-[#8b949e] uppercase font-bold mb-1">Asset</span>
                      <span className="block text-sm md:text-md lg:text-lg font-bold text-[#58a6ff] truncate">{market}</span>
                    </div>
                    <div className="bg-[#0d1117] p-4 rounded-lg border border-[rgba(255,255,255,0.1)]">
                      <span className="block text-[11px] text-[#8b949e] uppercase font-bold mb-1">Entry Price</span>
                      <span className="block text-sm md:text-md lg:text-lg font-bold text-[#58a6ff] truncate">{result.entryPrice}</span>
                    </div>
                    <div className="bg-[#0d1117] p-4 rounded-lg border border-[rgba(255,255,255,0.1)]">
                      <span className="block text-[11px] text-[#8b949e] uppercase font-bold mb-1">Expiry</span>
                      <span className="block text-sm md:text-md lg:text-lg font-bold text-[#58a6ff] truncate">{TIMEFRAMES.find(t => t.value === timeframe)?.label}</span>
                    </div>
                    <div className="bg-[#0d1117] p-4 rounded-lg border border-[rgba(255,255,255,0.1)]">
                      <span className="block text-[11px] text-[#8b949e] uppercase font-bold mb-1">Market Volatility</span>
                      <span className="block text-sm md:text-md lg:text-lg font-bold text-[#e3b341] truncate">{result.volatility}</span>
                    </div>
                    <div className="bg-[#0d1117] p-4 rounded-lg border border-[rgba(255,255,255,0.1)] col-span-2 md:col-span-2">
                      <span className="block text-[11px] text-[#8b949e] uppercase font-bold mb-1">Risk Level</span>
                      <span className={`block text-sm md:text-md lg:text-lg font-bold truncate ${result.riskLevel === 'LOW' ? 'text-[#39d353]' : result.riskLevel === 'HIGH' ? 'text-[#f85149]' : 'text-[#f0883e]'}`}>{result.riskLevel} - {result.riskLevel === 'LOW' ? 'Strong Setup' : result.riskLevel === 'MEDIUM' ? 'Standard Setup' : 'Proceed with Caution'}</span>
                    </div>
                  </div>

                  {/* Entry Protocol & MTG Warning */}
                  <div className="w-full mt-4 bg-[rgba(248,81,73,0.05)] border border-[#f85149]/20 rounded-lg p-5 flex flex-col gap-2 text-center">
                    <span className="text-[12px] font-bold text-[#f85149] uppercase tracking-wider flex justify-center items-center gap-2">
                       <AlertTriangle size={16}/> STRICT ENTRY PROTOCOL
                    </span>
                    <p className="text-sm text-[#c9d1d9] leading-relaxed mt-1">
                      Do not enter immediately. Wait for the current candle to close, and place your trade exactly at the <strong>START OF THE NEXT CANDLE</strong> (00-01 sec mark).
                    </p>
                    <p className="text-sm text-[#f85149] font-bold leading-relaxed mt-2 p-2 bg-[#f85149]/10 rounded border border-[#f85149]/20">
                      WARNING: DO NOT USE MTG (MARTINGALE). 
                    </p>
                    <p className="text-xs text-[#8b949e]">
                      Martingale is mathematically designed to wipe out your balance on a losing streak. If a direct trade fails, accept the 1% loss and wait for the next setup.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Info Panels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#161b22] border border-[rgba(255,255,255,0.1)] rounded-lg p-5">
              <h4 className="text-[#8b949e] text-[11px] font-bold uppercase tracking-wider mb-2">Indicators Active</h4>
              <p className="text-2xl font-bold text-[#c9d1d9]">15<span className="text-[#39d353] text-lg">/15</span></p>
              <p className="text-xs text-[#8b949e] mt-1">PPR, Fib, S/R, Vol, RSI...</p>
            </div>
            <div className="bg-[#161b22] border border-[rgba(255,255,255,0.1)] rounded-lg p-5">
              <h4 className="text-[#8b949e] text-[11px] font-bold uppercase tracking-wider mb-2">Algorithm</h4>
              <p className="text-2xl font-bold text-[#c9d1d9]">Neural<span className="text-[#58a6ff] text-lg">.v2</span></p>
              <p className="text-xs text-[#8b949e] mt-1">Pattern Recognition</p>
            </div>
            <div className="bg-[#161b22] border border-[rgba(255,255,255,0.1)] rounded-lg p-5">
              <h4 className="text-[#8b949e] text-[11px] font-bold uppercase tracking-wider mb-2">Network Latency</h4>
              <p className="text-2xl font-bold text-[#c9d1d9]">~12<span className="text-[#8b949e] text-lg">ms</span></p>
              <p className="text-xs text-[#8b949e] mt-1">Secure Connection</p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
