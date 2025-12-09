import React, { useState, useRef } from 'react';
import { Upload, Camera, Sparkles, X, ShoppingBag } from 'lucide-react';
import { generateListing } from './services/gemini';
import { ImageFile, ListingResult, ListingStyle } from './types';
import { Button } from './components/ui/Button';
import { ResultSection } from './components/ResultSection';

const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<ImageFile | null>(null);
  const [style, setStyle] = useState<ListingStyle>('casual');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ListingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Convert to Base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImageFile({
        file,
        previewUrl: URL.createObjectURL(file),
        base64: base64String
      });
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
       const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImageFile({
          file,
          previewUrl: URL.createObjectURL(file),
          base64: base64String
        });
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!imageFile) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await generateListing(imageFile.base64, style);
      setResult(data);
    } catch (err) {
      setError("Terjadi kesalahan pada AI. Silakan coba lagi.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600">
            <ShoppingBag className="w-6 h-6" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Jual Cepat</h1>
          </div>
          <div className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
            Power by AI
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-8">
        {/* Intro */}
        {!imageFile && !result && (
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Ubah Foto Jadi Uang</h2>
            <p className="text-slate-600">Upload foto barang bekasmu dan biarkan AI membuatkan teks iklan yang menarik secara instan.</p>
          </div>
        )}

        {/* Upload Area */}
        <div className="space-y-4">
          {!imageFile ? (
            <div 
              className="border-2 border-dashed border-slate-300 rounded-2xl p-10 flex flex-col items-center justify-center text-center bg-white hover:bg-slate-50 hover:border-indigo-400 transition-all cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Camera className="w-8 h-8" />
              </div>
              <p className="font-semibold text-slate-900">Ketuk untuk upload foto</p>
              <p className="text-sm text-slate-500 mt-1">atau tarik & lepas di sini</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
              <img 
                src={imageFile.previewUrl} 
                alt="Preview" 
                className="w-full h-64 object-contain bg-slate-100" 
              />
              <button 
                onClick={clearImage}
                className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-sm transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Controls */}
        {imageFile && !result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Pilih Gaya Bahasa</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200 rounded-xl">
                <button
                  onClick={() => setStyle('casual')}
                  className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    style === 'casual' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  😎 Santai (Sosmed)
                </button>
                <button
                  onClick={() => setStyle('formal')}
                  className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    style === 'formal' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  💼 Formal (Market)
                </button>
              </div>
            </div>

            <Button 
              onClick={handleGenerate} 
              isLoading={isLoading} 
              className="w-full text-lg shadow-indigo-200 shadow-lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Buat Iklan Sekarang
            </Button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
            {error}
          </div>
        )}

        {/* Results */}
        {result && <ResultSection result={result} />}

        {result && (
           <Button 
             variant="outline" 
             onClick={clearImage} 
             className="w-full mt-8"
           >
             Buat Iklan Baru
           </Button>
        )}
      </main>
    </div>
  );
};

export default App;