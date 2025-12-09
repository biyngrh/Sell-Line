import React, { useState } from 'react';
import { Trash2, Clock, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';
import { HistoryItem } from '../types';
import { Button } from './ui/Button';

interface HistoryListProps {
  items: HistoryItem[];
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ items, onDelete, onClearAll }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p>Belum ada riwayat penjualan.</p>
        <p className="text-sm">Mulai buat iklan pertamamu!</p>
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(timestamp));
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-end">
        <button 
          onClick={() => {
            if (confirm('Apakah Anda yakin ingin menghapus semua riwayat?')) {
              onClearAll();
            }
          }}
          className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3 h-3" /> Hapus Semua
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div 
            key={item.id} 
            className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Header Card */}
            <div 
              className="p-3 flex items-center gap-3 cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors"
              onClick={() => toggleExpand(item.id)}
            >
              <img 
                src={item.thumbnailBase64} 
                alt="Thumbnail" 
                className="w-12 h-12 rounded-lg object-cover border border-slate-200"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 truncate pr-2">
                  {item.result.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                   <span className="font-medium text-emerald-600 bg-emerald-50 px-1.5 rounded">
                     {formatRupiah(item.result.suggested_price)}
                   </span>
                   <span>• Skor: {item.result.photo_score}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="text-slate-400">
                  {expandedId === item.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>
            </div>

            {/* Content Preview */}
            {expandedId === item.id && (
              <div className="p-4 border-t border-slate-100 bg-white text-sm space-y-3">
                 <div>
                    <span className="font-bold text-xs text-slate-400 uppercase">Deskripsi</span>
                    <p className="text-slate-700 mt-1">{item.result.description}</p>
                 </div>
                 <div>
                    <span className="font-bold text-xs text-slate-400 uppercase">Saran Foto</span>
                    <p className="text-slate-700 mt-1 italic">"{item.result.photo_advice}"</p>
                 </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};