import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, Camera, Sparkles, X, History, PlusCircle, 
  MessageCircle, Zap, DollarSign, CameraIcon, Lightbulb, 
  Copy, Check, TrendingUp, AlertCircle, Image as ImageIcon,
  ArrowRight
} from 'lucide-react';
import { generateListing, generateNegotiationResponses } from './services/gemini';
import { ImageFile, ListingResult, ListingStyle, HistoryItem, NegotiationResponse } from './types';
import { Button } from './components/ui/Button';
import { HistoryList } from './components/HistoryList';

// --- BENTO UI COMPONENTS ---

const BentoCard: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  onClick?: () => void;
}> = ({ children, className = '', onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${className}`}
  >
    {children}
  </div>
);

const SectionTitle: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="mb-6">
    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
    {subtitle && <p className="text-slate-500 mt-1 font-medium">{subtitle}</p>}
  </div>
);

const CopyButton: React.FC<{ text: string; label?: string; className?: string }> = ({ text, label, className }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
        copied 
          ? 'bg-emerald-100 text-emerald-700' 
          : 'bg-slate-900 text-white hover:bg-slate-800'
      } ${className}`}
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      {label && <span>{copied ? 'Tersalin' : label}</span>}
    </button>
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

  // --- HANDLERS ---

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
      const result = await generateListing(imageFile.base64, 'casual');
      setListingResult(result);
      
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        thumbnailBase64: imageFile.base64,
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

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  // --- RENDERERS ---

  const renderMagicListing = () => {
    if (!listingResult) {
      // Upload State
      return (
        <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <SectionTitle 
            title="Magic Listing" 
            subtitle="Upload foto barang, AI akan membuatkan deskripsi & hitungan cuan untukmu." 
          />
          
          <div className="space-y-6">
            {/* Image Dropzone */}
            {!imageFile ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group relative h-80 rounded-3xl border-2 border-dashed border-slate-200 bg-white hover:border-indigo-500 hover:bg-indigo-50/30 transition-all cursor-pointer flex flex-col items-center justify-center text-center p-8"
              >
                <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                  <CameraIcon className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Ambil atau Upload Foto</h3>
                <p className="text-slate-500 mt-2 text-sm max-w-xs">Pastikan foto jelas dan terang agar AI bisa menganalisis dengan akurat.</p>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>
            ) : (
              <div className="relative group rounded-3xl overflow-hidden shadow-lg border border-slate-100">
                <img src={imageFile.previewUrl} className="w-full h-80 object-cover" alt="Preview" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={resetListing} className="bg-white text-red-500 px-4 py-2 rounded-full font-bold shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all">
                        Ganti Foto
                    </button>
                </div>
              </div>
            )}

            {/* Price Input */}
            <BentoCard className="p-1 flex items-center bg-slate-50 border-slate-200">
              <div className="bg-white px-4 py-3 rounded-2xl shadow-sm text-slate-500 font-bold text-xs uppercase tracking-wide border border-slate-100">
                Modal Beli (Opsional)
              </div>
              <div className="flex-1 relative ml-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">Rp</span>
                <input 
                  type="number" 
                  placeholder="0"
                  value={modalPrice}
                  onChange={(e) => setModalPrice(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-transparent focus:outline-none font-bold text-slate-800 placeholder-slate-300"
                />
              </div>
            </BentoCard>

            <Button 
              onClick={handleGenerateListing} 
              disabled={!imageFile}
              isLoading={isListingLoading}
              className="w-full h-14 text-lg rounded-2xl shadow-xl shadow-indigo-100 bg-slate-900 hover:bg-slate-800 text-white"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Mulai Analisis Magic
            </Button>
          </div>
        </div>
      );
    }

    // Result State (Bento Grid)
    const profit = modalPrice ? listingResult.suggested_price - parseInt(modalPrice) : 0;
    const fullText = `${listingResult.title}\n\n${listingResult.description}\n\nHarga: ${formatRupiah(listingResult.suggested_price)}\n\n${listingResult.hashtags}`;

    return (
      <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Hasil Analisis</h2>
          <Button variant="ghost" onClick={resetListing} className="text-sm">
            <ArrowRight className="w-4 h-4 mr-1 rotate-180" /> Kembali
          </Button>
        </div>

        {/* BENTO GRID LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          
          {/* 1. Main Image (Left Top) */}
          <div className="col-span-12 md:col-span-5 aspect-square md:aspect-auto md:h-full relative rounded-3xl overflow-hidden shadow-sm border border-slate-200 group">
             {imageFile && <img src={imageFile.previewUrl} className="w-full h-full object-cover" />}
             <div className="absolute bottom-4 left-4 right-4">
               <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-full">
                      <Lightbulb className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400 mb-1">Feedback AI</p>
                      <p className="text-sm font-medium text-slate-800 leading-snug">"{listingResult.photo_advice}"</p>
                    </div>
                  </div>
               </div>
             </div>
          </div>

          {/* 2. Stats & Numbers (Right Top) */}
          <div className="col-span-12 md:col-span-7 flex flex-col gap-4">
             {/* Row 1: Score & Price */}
             <div className="grid grid-cols-2 gap-4">
                {/* Photo Score */}
                <BentoCard className="p-5 bg-blue-50 border-blue-100 flex flex-col justify-between h-40 relative group">
                  <div className="flex justify-between items-start">
                     <span className="p-2 bg-white rounded-full text-blue-600 shadow-sm"><Camera className="w-5 h-5"/></span>
                     <div className="text-right">
                        <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Kualitas Foto</p>
                     </div>
                  </div>
                  <div>
                    <span className="text-5xl font-bold text-blue-900 tracking-tighter">{listingResult.photo_score}</span>
                    <span className="text-xl text-blue-400 font-medium">/10</span>
                  </div>
                  <div className="absolute right-0 bottom-0 opacity-10 transform translate-y-1/4 translate-x-1/4">
                    <Sparkles className="w-32 h-32" />
                  </div>
                </BentoCard>

                {/* Price & Profit */}
                <BentoCard className="p-5 bg-emerald-50 border-emerald-100 flex flex-col justify-between h-40 relative overflow-hidden">
                   <div className="flex justify-between items-start relative z-10">
                     <span className="p-2 bg-white rounded-full text-emerald-600 shadow-sm"><DollarSign className="w-5 h-5"/></span>
                     <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Estimasi Cuan</p>
                   </div>
                   <div className="relative z-10">
                      <p className="text-slate-500 text-xs font-medium mb-1">Harga Jual: {formatRupiah(listingResult.suggested_price)}</p>
                      {modalPrice ? (
                        <p className="text-2xl font-bold text-emerald-800 tracking-tight">+{formatRupiah(profit)}</p>
                      ) : (
                        <p className="text-xl font-bold text-slate-400">Set modal dulu</p>
                      )}
                   </div>
                   {/* Decorative Pattern */}
                   <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-200 rounded-full opacity-20 blur-2xl"></div>
                </BentoCard>
             </div>

             {/* Row 2: Copywriting Content */}
             <BentoCard className="flex-1 p-6 relative bg-white border-slate-200">
                <div className="absolute top-6 right-6 z-10">
                  <CopyButton text={fullText} label="Salin Semua" />
                </div>
                
                <div className="space-y-6 max-w-[90%]">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Judul Iklan</h3>
                    <p className="text-lg font-bold text-slate-800 leading-snug">{listingResult.title}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Deskripsi</h3>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{listingResult.description}</p>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hashtags</h3>
                    <div className="flex flex-wrap gap-2">
                      {listingResult.hashtags.split(' ').map((tag, i) => (
                         <span key={i} className="px-2 py-1 bg-purple-50 text-purple-600 rounded-md text-sm font-medium">
                           {tag}
                         </span>
                      ))}
                    </div>
                  </div>
                </div>
             </BentoCard>
          </div>

        </div>
      </div>
    );
  };

  const renderNegotiation = () => (
    <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionTitle 
        title="Negotiation Wingman" 
        subtitle="Bingung bales chat pembeli yang nawar sadis? AI bantuin jawab."
      />
      
      <BentoCard className="p-1 bg-slate-50 border-slate-200 mb-6">
        <textarea
          value={buyerMessage}
          onChange={(e) => setBuyerMessage(e.target.value)}
          placeholder='Ketik pesan pembeli disini... (misal: "Harganya kemahalan gan, 50rb angkut sekarang")'
          className="w-full p-4 bg-white rounded-2xl focus:outline-none min-h-[120px] resize-none text-slate-700 placeholder-slate-400"
        />
        <div className="px-2 pb-2">
          <Button 
            onClick={handleGenerateChat} 
            isLoading={isChatLoading}
            disabled={!buyerMessage}
            className="w-full bg-slate-900 text-white rounded-xl h-12"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Buatkan Balasan
          </Button>
        </div>
      </BentoCard>

      <div className="grid grid-cols-1 gap-4">
        {negotiationResults.map((res, idx) => (
          <BentoCard key={idx} className="p-5 border-l-4 border-l-indigo-500 hover:border-l-indigo-600">
             <div className="flex justify-between items-start mb-2">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wide">
                  {res.type}
                </span>
                <button 
                  onClick={() => navigator.clipboard.writeText(res.text)}
                  className="text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
             </div>
             <p className="text-slate-700 leading-relaxed font-medium">"{res.text}"</p>
          </BentoCard>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-28 md:pb-12">
      
      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 text-white p-1.5 rounded-lg">
              <Zap className="w-5 h-5" />
            </div>
            <h1 className="font-bold text-lg tracking-tight text-slate-900">Sell<span className="text-slate-500">Fast.ai</span></h1>
          </div>
          
          {/* Desktop Nav (Optional, showing simple version) */}
          <div className="hidden md:flex gap-1 bg-slate-100 p-1 rounded-full">
            {[
              { id: 'magic', label: 'Magic List', icon: Camera },
              { id: 'negotiate', label: 'Wingman', icon: MessageCircle },
              { id: 'history', label: 'History', icon: History }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all ${
                  activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        {activeTab === 'magic' && renderMagicListing()}
        {activeTab === 'negotiate' && renderNegotiation()}
        {activeTab === 'history' && (
          <div className="max-w-xl mx-auto animate-in fade-in">
             <SectionTitle title="Riwayat Penjualan" />
             <HistoryList items={history} onDelete={(id) => setHistory(history.filter(h => h.id !== id))} onClearAll={() => { setHistory([]); localStorage.removeItem('sellitfast_history'); }} />
          </div>
        )}
      </main>

      {/* MOBILE BOTTOM NAV (Floating Dock Style) */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm">
        <div className="bg-slate-900/90 backdrop-blur-md text-white rounded-full p-2 shadow-2xl flex justify-between items-center px-6 border border-white/10">
          {[
            { id: 'magic', icon: Sparkles },
            { id: 'negotiate', icon: MessageCircle },
            { id: 'history', icon: History }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`p-3 rounded-full transition-all ${
                activeTab === tab.id ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-6 h-6" />
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};

export default App;
