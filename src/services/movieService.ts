import { Movie } from "../types";
import { getTrendingMoviesWithAI, searchMoviesWithAI, getMovieDetailsWithAI, getPopularMoviesWithAI, getTopRatedMoviesWithAI, getMovieOTTReleaseDate } from "./geminiService";

const TMDB_API_KEY = (import.meta as any).env?.VITE_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original";

export async function getTrendingMovies(): Promise<Movie[]> {
  if (!TMDB_API_KEY) return await getTrendingMoviesWithAI();

  try {
    const response = await fetch(`${BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}`);
    if (!response.ok) throw new Error(`TMDB error: ${response.status}`);
    const data = await response.json();
    return data.results.map(transformTMDBMovie);
  } catch (error) {
    console.error("Error fetching trending movies:", error);
    return await getTrendingMoviesWithAI();
  }
}

export async function getPopularMovies(language: string = 'en'): Promise<Movie[]> {
  if (!TMDB_API_KEY) return await getPopularMoviesWithAI();

  try {
    const url = language === 'en' 
      ? `${BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}`
      : `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=${language}&sort_by=popularity.desc`;
      
    const response = await fetch(url);
    if (!response.ok) throw new Error(`TMDB error: ${response.status}`);
    const data = await response.json();
    return data.results.map(transformTMDBMovie);
  } catch (error) {
    console.error("Error fetching popular movies:", error);
    return await getPopularMoviesWithAI();
  }
}

export async function getTopRatedMovies(): Promise<Movie[]> {
  if (!TMDB_API_KEY) return await getTopRatedMoviesWithAI();

  try {
    const response = await fetch(`${BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}`);
    if (!response.ok) throw new Error(`TMDB error: ${response.status}`);
    const data = await response.json();
    return data.results.map(transformTMDBMovie);
  } catch (error) {
    console.error("Error fetching top rated movies:", error);
    return await getTopRatedMoviesWithAI();
  }
}

export async function searchMovies(query: string): Promise<Movie[]> {
  if (!TMDB_API_KEY) return await searchMoviesWithAI(query);

  try {
    const response = await fetch(`${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error(`TMDB error: ${response.status}`);
    const data = await response.json();
    return data.results.map(transformTMDBMovie);
  } catch (error) {
    console.error("Error searching movies:", error);
    return await searchMoviesWithAI(query);
  }
}

export async function getMovieDetails(id: string): Promise<Movie | null> {
  if (!TMDB_API_KEY) return await getMovieDetailsWithAI(id);

  try {
    const response = await fetch(`${BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits,release_dates`);
    if (!response.ok) throw new Error(`TMDB error: ${response.status}`);
    const data = await response.json();
    const movie = transformTMDBMovie(data);

    // Try to extract OTT release date from TMDB release_dates
    // Type 4 is Digital, Type 5 is Physical, Type 6 is TV
    const digitalRelease = data.release_dates?.results?.flatMap((r: any) => r.release_dates)
      .find((rd: any) => rd.type === 4 || rd.type === 5 || rd.type === 6);

    if (digitalRelease) {
      movie.ottReleaseDate = digitalRelease.release_date.split('T')[0];
    } else {
      // If not in TMDB, try AI search
      const aiOttDate = await getMovieOTTReleaseDate(movie.title, movie.releaseDate.split('-')[0]);
      if (aiOttDate) {
        movie.ottReleaseDate = aiOttDate;
      }
    }

    return movie;
  } catch (error) {
    console.error("Error fetching movie details:", error);
    return await getMovieDetailsWithAI(id);
  }
}

export async function getMovieRecommendations(movieId: string): Promise<Movie[]> {
  if (!TMDB_API_KEY) return [];

  try {
    const response = await fetch(`${BASE_URL}/movie/${movieId}/recommendations?api_key=${TMDB_API_KEY}`);
    const data = await response.json();
    return data.results.slice(0, 6).map(transformTMDBMovie);
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return [];
  }
}

export async function getStreamingPlatforms(movieId: string, movieTitle: string, language: string = 'en'): Promise<{ name: string; url: string }[]> {
  if (!TMDB_API_KEY) return [];

  try {
    const response = await fetch(`${BASE_URL}/movie/${movieId}/watch/providers?api_key=${TMDB_API_KEY}`);
    const data = await response.json();
    
    // Map language to region if possible
    const langToRegion: Record<string, string> = {
      hi: 'IN',
      ta: 'IN',
      te: 'IN',
      ml: 'IN',
      kn: 'IN',
      ja: 'JP',
      ko: 'KR',
      es: 'ES',
      fr: 'FR'
    };

    const detectedRegion = (navigator.language.split('-')[1] || 'US').toUpperCase();
    const userRegion = langToRegion[language] || detectedRegion;
    
    const regionData = data.results?.[userRegion] || data.results?.['IN'] || data.results?.['US'];
    
    if (!regionData || !regionData.flatrate) return [];

    const platformSearchUrls: Record<string, string> = {
      'Amazon Prime Video': 'https://www.primevideo.com/search/ref=atv_nb_sr?phrase=',
      'Disney Plus Hotstar': 'https://www.hotstar.com/in/search?q=',
      'Disney Plus': 'https://www.disneyplus.com/search?q=',
      'Apple TV': 'https://tv.apple.com/search?term=',
      'Google Play Movies': 'https://play.google.com/store/search?q=',
      'YouTube': 'https://www.youtube.com/results?search_query=',
      'Zee5': 'https://www.zee5.com/search?q=',
      'Sony Liv': 'https://www.sonyliv.com/search?q=',
      'JioCinema': 'https://www.jiocinema.com/search/',
      'Hulu': 'https://www.hulu.com/search?q=',
      'HBO Max': 'https://www.hbomax.com/search?q=',
      'Paramount Plus': 'https://www.paramountplus.com/search?q=',
      'Peacock': 'https://www.peacocktv.com/search?q='
    };

    const platforms: { name: string; url: string }[] = [];

    regionData.flatrate.forEach((p: any) => {
      const providerName = p.provider_name;
      const searchUrl = platformSearchUrls[providerName];
      
      // For Netflix and any provider not in our direct mapping, use Google Search
      // to avoid login walls and provide a better deep-link experience.
      const finalUrl = searchUrl 
        ? searchUrl + encodeURIComponent(movieTitle)
        : `https://www.google.com/search?q=${encodeURIComponent(movieTitle + " " + providerName)}`;
      
      platforms.push({ 
        name: providerName, 
        url: finalUrl
      });
    });

    return platforms;
  } catch (error) {
    console.error("Error fetching streaming platforms:", error);
    return [];
  }
}

export async function getMovieTrailer(movieId: string): Promise<string | null> {
  if (!TMDB_API_KEY) return null;

  try {
    const response = await fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${TMDB_API_KEY}`);
    if (!response.ok) throw new Error(`TMDB error: ${response.status}`);
    const data = await response.json();
    const trailer = data.results?.find((v: any) => v.type === "Trailer" && v.site === "YouTube");
    return trailer ? trailer.key : null;
  } catch (error) {
    console.error("Error fetching movie trailer:", error);
    return null;
  }
}

export async function discoverMovies(params: { 
  page?: number; 
  genre?: string; 
  year?: string; 
  sortBy?: string;
  query?: string;
}): Promise<{ movies: Movie[]; totalPages: number }> {
  if (!TMDB_API_KEY) {
    // Fallback to trending if no API key
    const movies = await getTrendingMoviesWithAI();
    return { movies, totalPages: 1 };
  }

  try {
    let url = "";
    if (params.query) {
      url = `${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(params.query)}&page=${params.page || 1}`;
    } else {
      url = `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&page=${params.page || 1}`;
      if (params.genre) url += `&with_genres=${params.genre}`;
      if (params.year) url += `&primary_release_year=${params.year}`;
      if (params.sortBy) url += `&sort_by=${params.sortBy}`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error(`TMDB error: ${response.status}`);
    const data = await response.json();
    
    let results = data.results.map(transformTMDBMovie);
    
    // Note: TMDB search doesn't support genre/year filters.
    // We could filter client-side here if needed, but for simplicity we'll let TMDB handle it in discover mode.
    // If query is present, we use search API. If not, we use discover API.
    
    return {
      movies: results,
      totalPages: data.total_pages
    };
  } catch (error) {
    console.error("Error discovering movies:", error);
    return { movies: [], totalPages: 0 };
  }
}

function transformTMDBMovie(tmdbMovie: any): Movie {
  // Map genre IDs to names if genres array is missing (common in search/discover results)
  const genreMap: Record<number, string> = {
    28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
    99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
    27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
    53: "Thriller", 10752: "War", 37: "Western"
  };

  const genres = tmdbMovie.genres?.map((g: any) => g.name) || 
                 tmdbMovie.genre_ids?.map((id: number) => genreMap[id]) || 
                 [];

  return {
    id: tmdbMovie.id.toString(),
    title: tmdbMovie.title,
    description: tmdbMovie.overview,
    releaseDate: tmdbMovie.release_date || "",
    rating: parseFloat(tmdbMovie.vote_average.toFixed(1)),
    genres,
    coverImage: tmdbMovie.poster_path ? `${IMAGE_BASE_URL}${tmdbMovie.poster_path}` : "https://picsum.photos/seed/movie/500/750",
    bannerImage: tmdbMovie.backdrop_path ? `${IMAGE_BASE_URL}${tmdbMovie.backdrop_path}` : "https://picsum.photos/seed/banner/1920/1080",
    cast: tmdbMovie.credits?.cast?.slice(0, 10).map((c: any) => c.name) || [],
    castMembers: tmdbMovie.credits?.cast?.slice(0, 10).map((c: any) => ({
      id: c.id.toString(),
      name: c.name,
      character: c.character,
      profilePath: c.profile_path ? `${IMAGE_BASE_URL}${c.profile_path}` : null
    })) || [],
    director: tmdbMovie.credits?.crew?.find((c: any) => c.job === "Director")?.name || "Unknown",
    directorId: tmdbMovie.credits?.crew?.find((c: any) => c.job === "Director")?.id?.toString(),
    directorProfilePath: tmdbMovie.credits?.crew?.find((c: any) => c.job === "Director")?.profile_path ? `${IMAGE_BASE_URL}${tmdbMovie.credits?.crew?.find((c: any) => c.job === "Director")?.profile_path}` : null
  };
}

export async function getCastDetails(castId: string): Promise<any> {
  if (!TMDB_API_KEY) return null;

  try {
    const response = await fetch(`${BASE_URL}/person/${castId}?api_key=${TMDB_API_KEY}`);
    if (!response.ok) throw new Error(`TMDB error: ${response.status}`);
    const data = await response.json();
    return {
      id: data.id.toString(),
      name: data.name,
      biography: data.biography,
      birthday: data.birthday,
      placeOfBirth: data.place_of_birth,
      profilePath: data.profile_path ? `${IMAGE_BASE_URL}${data.profile_path}` : null
    };
  } catch (error) {
    console.error("Error fetching cast details:", error);
    return null;
  }
}

export async function getCastMovies(castId: string): Promise<Movie[]> {
  if (!TMDB_API_KEY) return [];

  try {
    const response = await fetch(`${BASE_URL}/person/${castId}/movie_credits?api_key=${TMDB_API_KEY}`);
    if (!response.ok) throw new Error(`TMDB error: ${response.status}`);
    const data = await response.json();
    
    // Combine movies where they were cast or crew (director)
    const allMovies = [
      ...(data.cast || []),
      ...(data.crew?.filter((c: any) => c.job === "Director") || [])
    ];

    // Remove duplicates by ID
    const uniqueMovies = Array.from(new Map(allMovies.map(m => [m.id, m])).values());

    // Sort by popularity and take top 20
    return uniqueMovies
      .sort((a: any, b: any) => b.popularity - a.popularity)
      .slice(0, 20)
      .map(transformTMDBMovie);
  } catch (error) {
    console.error("Error fetching cast movies:", error);
    return [];
  }
}
