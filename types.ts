export interface ListingResult {
  photo_score: number;
  photo_advice: string;
  title: string;
  description: string;
  suggested_price: number;
  hashtags: string;
}

export interface NegotiationResponse {
  type: 'Sopan' | 'Tegas' | 'Lucu';
  text: string;
}

export type ListingStyle = 'casual' | 'formal';

export interface ImageFile {
  file: File;
  previewUrl: string;
  base64: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  thumbnailBase64: string;
  result: ListingResult;
  style: ListingStyle;
  modalPrice?: number; // Opsional: menyimpan modal saat itu
}