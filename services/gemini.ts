import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ListingResult, ListingStyle } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const listingSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A catchy, attention-grabbing title for the product listing.",
    },
    description: {
      type: Type.STRING,
      description: "A detailed description including condition, color, brand, and key features.",
    },
    price_estimate: {
      type: Type.STRING,
      description: "An estimated price range based on the item appearance (e.g., 'IDR 500.000 - IDR 700.000').",
    },
    hashtags: {
      type: Type.STRING,
      description: "Relevant hashtags for social media visibility, space separated.",
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

  let systemInstruction = "You are an expert e-commerce copywriter and professional reseller.";
  
  if (style === 'casual') {
    systemInstruction += " Use a CASUAL, fun, and energetic tone suitable for Instagram/TikTok. Use emojis, slang, and exclamation marks. Make it feel like a friend recommending a product.";
  } else {
    systemInstruction += " Use a FORMAL, professional, and trustworthy tone suitable for marketplaces like Tokopedia or LinkedIn. Be concise, factual, and polite. Do not use emojis.";
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
            text: "Analyze this image and generate a sales listing. Provide a catchy title, a detailed description covering visual condition/brand/color, a price estimate in IDR, and relevant hashtags.",
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
      throw new Error("No text response from Gemini.");
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};