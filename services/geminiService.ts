
import { GoogleGenAI, Type } from "@google/genai";
import { Movie } from "../types";

// Use process.env.API_KEY directly for initialization
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Uses Gemini to intelligently re-rank and filter movies based on a query or trend
 */
export const smartRerank = async (movies: Movie[], query: string): Promise<Movie[]> => {
  if (movies.length === 0) return [];
  
  const movieMeta = movies.map(m => ({ 
    title: m.title, 
    genre: m.genre, 
    desc: m.description.substring(0, 100) 
  }));

  const prompt = `Given the search context "${query}", analyze the following movies and select the 8 most relevant or high-quality ones. 
  Return only their titles in a JSON array. 
  Movies: ${JSON.stringify(movieMeta)}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const recommendedTitles: string[] = JSON.parse(response.text || "[]");
    
    // Create a set for fast lookup
    const titleSet = new Set(recommendedTitles);
    
    // Sort original list so recommended ones come first
    return [...movies].sort((a, b) => {
      const aRec = titleSet.has(a.title) ? 1 : 0;
      const bRec = titleSet.has(b.title) ? 1 : 0;
      return bRec - aRec;
    });
  } catch (error) {
    console.warn("Gemini reranking failed, returning original order.", error);
    return movies;
  }
};

/**
 * Provides a subset of "Top Picks" from a list of movies, tailored to user's favorites if available.
 */
export const getDiscoveryRecommendations = async (pool: Movie[], favorites: Movie[]): Promise<Movie[]> => {
  if (pool.length === 0) return [];

  const poolMeta = pool.map(m => ({ id: m.id, title: m.title, genre: m.genre }));
  const favMeta = favorites.map(m => ({ title: m.title, genre: m.genre }));

  const prompt = `You are a movie curator. Based on the user's favorite movies: ${JSON.stringify(favMeta)}, 
  select the 4 best matching movies from this current list: ${JSON.stringify(poolMeta)}. 
  If no favorites exist, just pick the 4 most globally popular/interesting sounding ones.
  Return only a JSON array of the "id" values string.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const recommendedIds: string[] = JSON.parse(response.text || "[]");
    return pool.filter(m => recommendedIds.includes(m.id)).slice(0, 4);
  } catch (error) {
    console.warn("Gemini recommendations failed.", error);
    return pool.slice(0, 4);
  }
};

export const getAIInsight = async (movie: Movie): Promise<string> => {
  const prompt = `Provide a very brief (20 words max) "AI Insight" for why someone should watch the movie "${movie.title}". 
  Context: ${movie.description.substring(0, 200)}. Response in Chinese.`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "推荐理由：剧情扣人心弦，值得一睹。";
  } catch {
    return "为您精选。";
  }
};
