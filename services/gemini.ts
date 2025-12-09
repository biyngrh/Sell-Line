import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ListingResult, ListingStyle, NegotiationResponse } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema untuk Magic Listing (Vision)
const listingSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    photo_score: {
      type: Type.INTEGER,
      description: "Skor kualitas foto dari 1-10 berdasarkan pencahayaan, komposisi, dan kejelasan produk.",
    },
    photo_advice: {
      type: Type.STRING,
      description: "Saran singkat untuk fotografer agar foto lebih menjual (maksimal 2 kalimat).",
    },
    title: {
      type: Type.STRING,
      description: "Judul iklan yang menarik perhatian pembeli dalam Bahasa Indonesia.",
    },
    description: {
      type: Type.STRING,
      description: "Deskripsi detail tentang kondisi dan fitur utama dalam Bahasa Indonesia.",
    },
    suggested_price: {
      type: Type.INTEGER,
      description: "Estimasi harga jual pasar barang bekas di Indonesia dalam format angka (tanpa titik/koma).",
    },
    hashtags: {
      type: Type.STRING,
      description: "Hashtag yang relevan dipisahkan spasi.",
    },
  },
  required: ["photo_score", "photo_advice", "title", "description", "suggested_price", "hashtags"],
};

// Schema untuk Negotiation Wingman (Text)
const negotiationSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING, enum: ['Sopan', 'Tegas', 'Lucu'] },
      text: { type: Type.STRING, description: "Isi pesan balasan." }
    },
    required: ["type", "text"]
  }
};

export const generateListing = async (
  imageBase64: string,
  style: ListingStyle
): Promise<ListingResult> => {
  const modelId = "gemini-2.5-flash"; 

  const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  let systemInstruction = "Kamu adalah konsultan bisnis barang bekas profesional. Analisis gambar yang diberikan.";
  
  if (style === 'casual') {
    systemInstruction += " Gunakan gaya bahasa SANTAI, akrab, cocok untuk sosial media.";
  } else {
    systemInstruction += " Gunakan gaya bahasa FORMAL, profesional, cocok untuk marketplace.";
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: "Analisis foto produk ini. Berikan skor foto (1-10), saran perbaikan foto, judul iklan, deskripsi, estimasi harga jual yang wajar (IDR), dan hashtag.",
          },
        ],
      },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: listingSchema,
        temperature: 0.7,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as ListingResult;
    } else {
      throw new Error("Tidak ada respons teks dari Gemini.");
    }
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw error;
  }
};

export const generateNegotiationResponses = async (
  buyerMessage: string
): Promise<NegotiationResponse[]> => {
  const modelId = "gemini-2.5-flash";

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            text: `Seorang pembeli mengirim pesan: "${buyerMessage}". Buatkan 3 opsi balasan: 1. Sopan & Profesional, 2. Tegas (tapi tidak kasar), 3. Santai/Lucu.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: negotiationSchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as NegotiationResponse[];
    } else {
      throw new Error("Gagal generate balasan chat.");
    }
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw error;
  }
};