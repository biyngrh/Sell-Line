import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, Camera, Sparkles, X, History, PlusCircle, 
  MessageCircle, Zap, DollarSign, CameraIcon, Lightbulb, 
  Copy, Check, TrendingUp, AlertCircle 
} from 'lucide-react';
import { generateListing, generateNegotiationResponses } from './services/gemini';
import { ImageFile, ListingResult, ListingStyle, HistoryItem, NegotiationResponse } from './types';
import { Button } from './components/ui/Button';
import { HistoryList } from './components/HistoryList';

// --- SUB-COMPONENTS ---

const ScoreIndicator: React.FC<{ score: number }> = ({ score }) => {
  let colorClass = "text-red-500 border-red-200 bg-red-50";
  let label = "Kurang Oke";
  if (score >= 8) {
    colorClass = "text-emerald-600 border-emerald-200 bg-emerald-50";
    label = "Super Kece";
  } else if (score >= 5) {
    colorClass = "text-yellow-600 border-yellow-200 bg-yellow-50";
    label = "Lumayan";
  }

  return (
    <div className={`flex flex-col items-center justify-center w-24 h-24 rounded-full border-4 ${colorClass} transition-all`}>
      <span className="text-3xl font-bold">{score}</span>
      <span className="text-[10px] uppercase font-bold tracking-wider">{label}</span>
    </div>
  );
};

const CopyCard: React.FC<{ title: string; content: string; variant?: 'default' | 'chat' }> = ({ title, content, variant = 'default' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`relative group rounded-xl border ${variant === 'chat' ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-slate-200'} p-4 shadow-sm hover:shadow-md transition-all`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wide">{title}</h4>
        <button onClick={handleCopy} className="text-slate-400 hover:text-indigo-600 transition-colors">
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{content}</p>
    </div>
  );
};

// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'magic' | 'negotiate' | 'history'>('magic');

  // Magic Listing State
  const [imageFile, setImageFile] = useState<ImageFile | null>(null);
  const [modalPrice, setModalPrice] = useState<string>('');
  const [listingResult, setListingResult] = useState<ListingResult | null>(null);
  const [isListingLoading, setIsListingLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Negotiation State
  const [buyerMessage, setBuyerMessage] = useState('');
  const [negotiationResults, setNegotiationResults] = useState<NegotiationResponse[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load History
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sellitfast_history');
      if (saved) setHistory(JSON.parse(saved));
    } catch (e) { console.error(e); }
  }, []);

  // --- HANDLERS: MAGIC LISTING ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageFile({
        file,
        previewUrl: URL.createObjectURL(file),
        base64: reader.result as string
      });
      setListingResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateListing = async () => {
    if (!imageFile) return;
    setIsListingLoading(true);
    try {
      const result = await generateListing(imageFile.base64, 'casual'); // Default casual for simplicity in V2
      setListingResult(result);
      
      // Save to History (simplified thumbnail logic)
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        thumbnailBase64: imageFile.base64, // In production, resize this!
        result: result,
        style: 'casual',
        modalPrice: modalPrice ? parseInt(modalPrice) : 0
      };
      const newHistory = [newItem, ...history];
      setHistory(newHistory);
      localStorage.setItem('sellitfast_history', JSON.stringify(newHistory));
    } catch (error) {
      alert("Gagal menganalisis gambar. Coba lagi.");
    } finally {
      setIsListingLoading(false);
    }
  };

  const resetListing = () => {
    setImageFile(null);
    setListingResult(null);
    setModalPrice('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- HANDLERS: NEGOTIATION ---

  const handleGenerateChat = async () => {
    if (!buyerMessage.trim()) return;
    setIsChatLoading(true);
    try {
      const responses = await generateNegotiationResponses(buyerMessage);
      setNegotiationResults(responses);
    } catch (error) {
      alert("Gagal membuat balasan. Coba lagi.");
    } finally {
      setIsChatLoading(false);
    }
  };

  // --- FORMATTER ---
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3 shadow-sm">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
              <Zap className="w-5 h-5" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">Sell<span className="text-indigo-600"> Line</span></h1>
          </div>
          <button onClick={() => setActiveTab('history')} className="p-2 text-slate-400 hover:text-indigo-600">
            <History className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-md mx-auto w-full p-4 pb-24">
        
        {/* --- TAB 1: MAGIC LISTING --- */}
        {activeTab === 'magic' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Upload Section */}
            {!listingResult ? (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">Jual Barang Bekas?</h2>
                  <p className="text-slate-500">Foto barangnya, kita buatkan iklannya & hitung perkiraan harganya.</p>
                </div>

                {!imageFile ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-3xl h-64 flex flex-col items-center justify-center bg-white cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                  >
                    <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <CameraIcon className="w-8 h-8" />
                    </div>
                    <span className="font-semibold text-slate-700">Ambil / Upload Foto</span>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                  </div>
                ) : (
                  <div className="relative rounded-3xl overflow-hidden shadow-lg">
                    <img src={imageFile.previewUrl} className="w-full h-64 object-cover" alt="Preview" />
                    <button onClick={resetListing} className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full hover:bg-red-500 transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {/* Modal Price Input */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Modal Beli (Opsional)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">Rp</span>
                    <input 
                      type="number" 
                      placeholder="0"
                      value={modalPrice}
                      onChange={(e) => setModalPrice(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleGenerateListing} 
                  disabled={!imageFile}
                  isLoading={isListingLoading}
                  className="w-full text-lg py-4 shadow-xl shadow-indigo-100"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Analisis Magic
                </Button>
              </div>
            ) : (
              // RESULT VIEW
              <div className="space-y-6">
                {/* Score & Advice Card */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-5">
                  <ScoreIndicator score={listingResult.photo_score} />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 text-orange-500 mb-1">
                      <Lightbulb className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">Saran Foto</span>
                    </div>
                    <p className="text-sm text-slate-700 italic">"{listingResult.photo_advice}"</p>
                  </div>
                </div>

                {/* Financial Card */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white shadow-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-indigo-200 text-xs font-medium uppercase">Saran Harga Jual</span>
                      <div className="text-2xl font-bold mt-1">{formatRupiah(listingResult.suggested_price)}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-indigo-200 text-xs font-medium uppercase">Potensi Keuntungan</span>
                      <div className="text-2xl font-bold mt-1 text-emerald-300">
                        {modalPrice ? formatRupiah(listingResult.suggested_price - parseInt(modalPrice)) : '-'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Cards */}
                <div className="space-y-3">
                  <CopyCard title="Judul Iklan" content={listingResult.title} />
                  <CopyCard title="Deskripsi Lengkap" content={listingResult.description} />
                  <CopyCard title="Hashtags" content={listingResult.hashtags} />
                </div>

                <Button variant="outline" onClick={resetListing} className="w-full">
                  Foto Barang Lain
                </Button>
              </div>
            )}
          </div>
        )}

        {/* --- TAB 2: NEGOTIATION WINGMAN --- */}
        {activeTab === 'negotiate' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Bantu Balas Chat</h2>
              <p className="text-slate-500">Membantu anda untuk memberi saran balasan pesan para pembeli.</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Pesan dari Pembeli</label>
              <textarea
                value={buyerMessage}
                onChange={(e) => setBuyerMessage(e.target.value)}
                placeholder='Contoh: "Gan, 50 ribu dikasih gak? COD di mana?"'
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[100px] resize-none"
              />
            </div>

            <Button 
              onClick={handleGenerateChat} 
              isLoading={isChatLoading}
              disabled={!buyerMessage}
              className="w-full"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Buatkan Balasan
            </Button>

            {/* Response Cards */}
            <div className="space-y-3">
              {negotiationResults.map((res, idx) => (
                <div key={idx} className="animate-in slide-in-from-bottom-2" style={{ animationDelay: `${idx * 100}ms` }}>
                  <CopyCard 
                    title={res.type} 
                    content={res.text} 
                    variant="chat"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB 3: HISTORY --- */}
        {activeTab === 'history' && (
          <div className="space-y-4 animate-in fade-in duration-300">
             <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Riwayat Penjualan</h2>
                <button onClick={() => { setHistory([]); localStorage.removeItem('sellitfast_history'); }} className="text-red-500 text-sm">Clear All</button>
             </div>
             {history.length === 0 ? (
               <p className="text-center text-slate-400 mt-10">Belum ada data.</p>
             ) : (
               history.map((item) => (
                 <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex gap-4">
                   <img src={item.thumbnailBase64} className="w-16 h-16 rounded-lg object-cover bg-slate-100" />
                   <div className="flex-1 min-w-0">
                     <h4 className="font-bold text-slate-900 truncate">{item.result.title}</h4>
                     <p className="text-sm text-emerald-600 font-medium">{formatRupiah(item.result.suggested_price)}</p>
                     <div className="mt-1 flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded-full text-slate-500">
                          Score: {item.result.photo_score}
                        </span>
                     </div>
                   </div>
                 </div>
               ))
             )}
          </div>
        )}

      </main>

      {/* BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-2 z-40 pb-safe">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <button 
            onClick={() => setActiveTab('magic')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${activeTab === 'magic' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Camera className="w-6 h-6" />
            <span className="text-[10px] font-medium">Magic List</span>
          </button>

          <div className="w-px h-8 bg-slate-200"></div>

          <button 
            onClick={() => setActiveTab('negotiate')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${activeTab === 'negotiate' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-[10px] font-medium">Wingman</span>
          </button>
        </div>
      </nav>

    </div>
  );
};

export default App;