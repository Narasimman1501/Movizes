import { Movie } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// Simple in-memory cache
const aiCache = new Map<string, any>();

async function fetchWithRetry<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  retries = 2,
  delay = 1000
): Promise<T | null> {
  if (aiCache.has(cacheKey)) {
    return aiCache.get(cacheKey);
  }

  for (let i = 0; i <= retries; i++) {
    try {
      const result = await fetcher();
      if (result) {
        aiCache.set(cacheKey, result);
      }
      return result;
    } catch (error: any) {
      const isQuotaError = error?.message?.includes("quota") || error?.status === 429;
      if (isQuotaError && i < retries) {
        console.warn(`Gemini quota exceeded, retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        continue;
      }
      console.error("Gemini API Error:", error);
      break;
    }
  }
  return null;
}

export async function searchMoviesWithAI(query: string): Promise<Movie[]> {
  const cacheKey = `search_${query}`;
  const result = await fetchWithRetry(cacheKey, async () => {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search for movies matching the query: "${query}". 
      Return a JSON array of 6 movie objects. 
      Each object must have: "id" (string), "title", "description", "releaseDate" (YYYY-MM-DD), "rating" (number 0-10), "genres" (array of strings), "coverImage" (URL), "bannerImage" (URL), "cast" (array of strings), "castMembers" (array of objects with "id", "name", "character", "profilePath"), "director".
      Use high-quality image URLs.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    const movies = text ? JSON.parse(text) : [];
    return Array.isArray(movies) ? movies.map(normalizeMovie) : [];
  });

  return result || [];
}

function normalizeMovie(movie: any): Movie {
  return {
    id: movie.id?.toString() || Math.random().toString(36).substr(2, 9),
    title: movie.title || "Unknown Title",
    description: movie.description || "",
    releaseDate: movie.releaseDate || "",
    rating: typeof movie.rating === 'number' ? movie.rating : 0,
    ratingCount: typeof movie.ratingCount === 'number' ? movie.ratingCount : 0,
    totalRating: typeof movie.totalRating === 'number' ? movie.totalRating : 0,
    genres: Array.isArray(movie.genres) ? movie.genres : [],
    coverImage: movie.coverImage || "https://picsum.photos/seed/movie/500/750",
    bannerImage: movie.bannerImage || "https://picsum.photos/seed/banner/1920/1080",
    cast: Array.isArray(movie.cast) ? movie.cast : [],
    castMembers: Array.isArray(movie.castMembers) ? movie.castMembers : [],
    director: movie.director || "Unknown",
    directorId: movie.directorId?.toString(),
    directorProfilePath: movie.directorProfilePath,
    vibe: movie.vibe,
    ottReleaseDate: movie.ottReleaseDate
  };
}

export async function getTrendingMoviesWithAI(): Promise<Movie[]> {
  const cacheKey = 'trending_ai';
  const result = await fetchWithRetry(cacheKey, async () => {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a list of 30 currently trending or popular movies. 
      Return a JSON array of movie objects. 
      Each object must have: "id" (string), "title", "description", "releaseDate" (YYYY-MM-DD), "rating" (number 0-10), "genres" (array of strings), "coverImage" (URL), "bannerImage" (URL), "cast" (array of strings), "castMembers" (array of objects with "id", "name", "character", "profilePath"), "director".
      Use high-quality image URLs.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    const movies = text ? JSON.parse(text) : [];
    return Array.isArray(movies) ? movies.map(normalizeMovie) : [];
  });

  return result || [];
}

export async function getPopularMoviesWithAI(): Promise<Movie[]> {
  const cacheKey = 'popular_ai';
  const result = await fetchWithRetry(cacheKey, async () => {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a list of 20 currently popular movies. 
      Return a JSON array of movie objects. 
      Each object must have: "id" (string), "title", "description", "releaseDate" (YYYY-MM-DD), "rating" (number 0-10), "genres" (array of strings), "coverImage" (URL), "bannerImage" (URL), "cast" (array of strings), "castMembers" (array of objects with "id", "name", "character", "profilePath"), "director".
      Use high-quality image URLs.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    const movies = text ? JSON.parse(text) : [];
    return Array.isArray(movies) ? movies.map(normalizeMovie) : [];
  });

  return result || [];
}

export async function getTopRatedMoviesWithAI(): Promise<Movie[]> {
  const cacheKey = 'top_rated_ai';
  const result = await fetchWithRetry(cacheKey, async () => {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a list of 20 top-rated movies of all time. 
      Return a JSON array of movie objects. 
      Each object must have: "id" (string), "title", "description", "releaseDate" (YYYY-MM-DD), "rating" (number 0-10), "genres" (array of strings), "coverImage" (URL), "bannerImage" (URL), "cast" (array of strings), "castMembers" (array of objects with "id", "name", "character", "profilePath"), "director".
      Use high-quality image URLs.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    const movies = text ? JSON.parse(text) : [];
    return Array.isArray(movies) ? movies.map(normalizeMovie) : [];
  });

  return result || [];
}

export async function getMovieDetailsWithAI(id: string): Promise<Movie | null> {
  const cacheKey = `details_ai_${id}`;
  return await fetchWithRetry(cacheKey, async () => {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide detailed information for the movie with ID or Title: "${id}". 
      Return a JSON object with: "id", "title", "description", "releaseDate", "rating", "genres", "coverImage", "bannerImage", "cast", "castMembers" (array of objects with "id", "name", "character", "profilePath"), "director", "ottReleaseDate" (YYYY-MM-DD, only if officially announced, otherwise empty string).`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    const movie = text ? JSON.parse(text) : null;
    return movie ? normalizeMovie(movie) : null;
  });
}

export interface MovieAIInsights {
  description: string;
  vibe: string;
  recommendations: { title: string; reason: string; vibe: string }[];
  streamingLinks: { name: string; url: string }[];
}

export async function getMovieAIInsights(movie: Movie): Promise<MovieAIInsights | null> {
  const cacheKey = `insights_${movie.id}`;
  return await fetchWithRetry(cacheKey, async () => {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide AI insights and direct streaming links for the movie "${movie.title}" (${movie.releaseDate}).
      Context: ${movie.description}
      Genres: ${movie.genres.join(", ")}
      Director: ${movie.director}

      Requirements:
      1. Generate a unique, engaging description (3-4 sentences).
      2. Provide a short vibe tag.
      3. Recommend 3 similar movies.
      4. Find the ACTUAL direct streaming URL (e.g., https://www.netflix.com/title/81319485) for the movie on major platforms.
         You MUST use the googleSearch tool to find the specific title page URL for each platform.
         CRITICAL: DO NOT return links to themoviedb.org, justwatch.com, or any other aggregator.
         CRITICAL: DO NOT return search result URLs (e.g., google.com/search... or netflix.com/search...).
         CRITICAL: If you cannot find the EXACT direct title page URL (the deep link to the movie), DO NOT include that platform in the "streamingLinks" array. It is better to return an empty array than a search link.
         The URL must be the direct link to the movie's title page on the streaming service (Netflix, Prime Video, Disney+, etc.).
         If you cannot find a direct title page URL, do not include that platform in the "streamingLinks" array.

      Return a JSON object with:
      - "description": string
      - "vibe": string
      - "recommendations": array of { "title", "reason", "vibe" }
      - "streamingLinks": array of { "name", "url" }`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are a professional film critic and streaming guide. Provide accurate insights and direct deep-links to streaming platforms in JSON format.",
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    const insights = text ? JSON.parse(text) : null;
    if (insights) {
      if (!Array.isArray(insights.recommendations)) insights.recommendations = [];
      if (!Array.isArray(insights.streamingLinks)) insights.streamingLinks = [];
    }
    return insights;
  });
}

export async function getMovieVibes(movies: Movie[]): Promise<{ id: string; vibe: string }[]> {
  if (movies.length === 0) return [];
  const cacheKey = `vibes_${movies.map(m => m.id).join("_")}`;
  const result = await fetchWithRetry(cacheKey, async () => {
    const movieData = movies.map(m => ({ id: m.id, title: m.title, description: m.description.slice(0, 100) }));
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `For each of the following movies, provide a short "vibe" tag (e.g., "Gritty Noir", "Feel-good Comedy", "Mind-bending Sci-Fi").
      Movies: ${JSON.stringify(movieData)}
      Return a JSON array of objects with "id" and "vibe" properties.`,
      config: {
        systemInstruction: "You are a world-class film critic. Keep vibe tags concise (2-3 words).",
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    return text ? JSON.parse(text) : [];
  });

  return result || [];
}

export interface PersonAISummary {
  awards: string[];
  highlights: string[];
  style: string;
}

export async function getPersonAISummary(name: string, biography: string): Promise<PersonAISummary | null> {
  const cacheKey = `person_${name}`;
  return await fetchWithRetry(cacheKey, async () => {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a detailed summary for the person "${name}" (who could be an actor/actress, director, or both). 
      Based on their biography: "${biography.slice(0, 1000)}", extract:
      - A list of 3-4 notable awards or nominations (acting or directing).
      - A list of 3-4 career highlights or breakthrough moments.
      - A brief 2-sentence summary of their unique style, screen presence, or directorial vision.
      
      Return a JSON object with: "awards" (array of strings), "highlights" (array of strings), "style" (string).`,
      config: {
        systemInstruction: "You are a film historian and industry expert. Provide accurate and engaging information about industry professionals.",
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    return text ? JSON.parse(text) : null;
  });
}

export async function getMovieOTTReleaseDate(title: string, releaseYear: string): Promise<string | null> {
  const cacheKey = `ott_${title}_${releaseYear}`;
  const result = await fetchWithRetry(cacheKey, async () => {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find the official OTT (streaming) release date for the movie "${title}" (${releaseYear}). 
      Only provide the date in YYYY-MM-DD format. 
      If the official OTT release date has not been announced or is not available from an official source, return an empty string. 
      Do not guess or provide estimates.`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are a precise information retrieval assistant. Your goal is to find official movie streaming release dates. Return ONLY the date in YYYY-MM-DD format or an empty string.",
      },
    });

    const text = response.text?.trim();
    // Validate format YYYY-MM-DD
    if (text && /^\d{4}-\d{2}-\d{2}$/.test(text)) {
      return text;
    }
    return "";
  });

  return result || null;
}
