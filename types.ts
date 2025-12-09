export interface ListingResult {
  title: string;
  description: string;
  price_estimate: string;
  hashtags: string;
}

export type ListingStyle = 'casual' | 'formal';

export interface ImageFile {
  file: File;
  previewUrl: string;
  base64: string;
}
