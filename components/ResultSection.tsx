import React, { useState } from 'react';
import { Copy, Check, DollarSign, Tag, FileText, Type } from 'lucide-react';
import { ListingResult } from '../types';
import { Button } from './ui/Button';

interface ResultSectionProps {
  result: ListingResult;
}

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button 
      onClick={handleCopy}
      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
      title="Salin ke clipboard"
    >
      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
    </button>
  );
};

const ResultCard: React.FC<{ 
  title: string; 
  content: string; 
  icon: React.ReactNode; 
  color: string 
}> = ({ title, content, icon, color }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
    <div className={`px-4 py-3 border-b border-slate-100 flex items-center justify-between ${color} bg-opacity-5`}>
      <div className="flex items-center gap-2">
        <span className={`${color}`}>{icon}</span>
        <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">{title}</h3>
      </div>
      <CopyButton text={content} />
    </div>
    <div className="p-4">
      <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{content}</p>
    </div>
  </div>
);

export const ResultSection: React.FC<ResultSectionProps> = ({ result }) => {
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyAll = async () => {
    const allText = `
${result.title}

${result.description}

Harga: ${result.price_estimate}

${result.hashtags}
    `.trim();

    try {
      await navigator.clipboard.writeText(allText);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      console.error('Failed to copy all:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Iklan Siap Pakai</h2>
        <Button 
          variant="secondary" 
          onClick={handleCopyAll}
          className="!py-2 !px-4 text-sm"
        >
          {copiedAll ? (
            <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Tersalin</span>
          ) : (
            <span className="flex items-center gap-2"><Copy className="w-4 h-4" /> Salin Semua</span>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <ResultCard 
          title="Judul Iklan" 
          content={result.title} 
          icon={<Type className="w-5 h-5" />}
          color="text-blue-600"
        />
        
        <ResultCard 
          title="Deskripsi Produk" 
          content={result.description} 
          icon={<FileText className="w-5 h-5" />}
          color="text-indigo-600"
        />
        
        <ResultCard 
          title="Estimasi Harga" 
          content={result.price_estimate} 
          icon={<DollarSign className="w-5 h-5" />}
          color="text-emerald-600"
        />
        
        <ResultCard 
          title="Hashtag" 
          content={result.hashtags} 
          icon={<Tag className="w-5 h-5" />}
          color="text-pink-600"
        />
      </div>
    </div>
  );
};