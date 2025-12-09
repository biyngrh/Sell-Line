import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ListingResult, ListingStyle } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const listingSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "Judul iklan yang menarik perhatian pembeli dalam Bahasa Indonesia.",
    },
    description: {
      type: Type.STRING,
      description: "Deskripsi detail tentang kondisi, warna, merek, dan fitur utama dalam Bahasa Indonesia.",
    },
    price_estimate: {
      type: Type.STRING,
      description: "Estimasi rentang harga pasar di Indonesia (contoh: 'Rp 500.000 - Rp 700.000').",
    },
    hashtags: {
      type: Type.STRING,
      description: "Hashtag yang relevan untuk visibilitas media sosial, dipisahkan dengan spasi.",
    },
  },
  required: ["title", "description", "price_estimate", "hashtags"],
};

export const generateListing = async (
  imageBase64: string,
  style: ListingStyle
): Promise<ListingResult> => {
  const modelId = "gemini-2.5-flash"; // Best for multimodal tasks

  // Clean base64 string if it contains metadata header
  const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  let systemInstruction = "Kamu adalah ahli copywriting e-commerce dan reseller profesional di Indonesia. Tugasmu adalah membuat teks penjualan barang bekas berdasarkan gambar.";
  
  if (style === 'casual') {
    systemInstruction += " Gunakan nada SANTAI, asik, dan penuh energi cocok untuk Instagram/TikTok/Facebook. Gunakan bahasa gaul yang wajar, emoji, dan tanda seru. Buat seolah-olah teman yang merekomendasikan produk.";
  } else {
    systemInstruction += " Gunakan nada FORMAL, profesional, dan terpercaya cocok untuk Marketplace (Tokopedia/Shopee) atau LinkedIn. Gunakan Bahasa Indonesia yang baku, jelas, deskriptif, dan sopan. Jangan gunakan emoji berlebihan.";
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg", // Assuming JPEG for simplicity, API handles most standard types
              data: cleanBase64,
            },
          },
          {
            text: "Analisis gambar ini dan buatkan teks iklan penjualan. Berikan judul yang menarik (catchy), deskripsi detail (kondisi/merk/warna), estimasi harga dalam Rupiah (IDR), dan hashtag yang relevan. Gunakan Bahasa Indonesia.",
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
    console.error("Gemini API Error:", error);
    throw error;
  }
};