import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import { Search as SearchIcon, X, ChevronDown, Filter, SlidersHorizontal, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { discoverMovies } from '../services/movieService';
import { getMovieVibes } from '../services/geminiService';
import { Movie } from '../types';
import { Sparkles } from 'lucide-react';

const GENRES = [
  { id: "28", name: "Action" },
  { id: "12", name: "Adventure" },
  { id: "16", name: "Animation" },
  { id: "35", name: "Comedy" },
  { id: "80", name: "Crime" },
  { id: "99", name: "Documentary" },
  { id: "18", name: "Drama" },
  { id: "10751", name: "Family" },
  { id: "14", name: "Fantasy" },
  { id: "36", name: "History" },
  { id: "27", name: "Horror" },
  { id: "10402", name: "Music" },
  { id: "9648", name: "Mystery" },
  { id: "10749", name: "Romance" },
  { id: "878", name: "Sci-Fi" },
  { id: "53", name: "Thriller" },
  { id: "10752", name: "War" },
  { id: "37", name: "Western" }
];

const SORTS = [
  { id: "popularity.desc", name: "Popularity" },
  { id: "vote_average.desc", name: "Score" },
  { id: "primary_release_date.desc", name: "Release Date" },
  { id: "title.asc", name: "Title" }
];

const YEARS = Array.from({ length: 50 }, (_, i) => (new Date().getFullYear() - i).toString());

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || "");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    searchParams.get('genre') ? searchParams.get('genre')!.split(',') : []
  );
  const [selectedYear, setSelectedYear] = useState<string>(searchParams.get('year') || "");
  const [selectedSort, setSelectedSort] = useState<string>(searchParams.get('sort') || "popularity.desc");
  
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastMovieRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const fetchMovies = async (isNewSearch: boolean = false) => {
    setLoading(true);
    const currentPage = isNewSearch ? 1 : page;
    const { movies: newMovies, totalPages } = await discoverMovies({
      page: currentPage,
      genre: selectedGenres.join('|'), // Use OR logic with pipe
      year: selectedYear,
      sortBy: selectedSort,
      query: debouncedSearchQuery
    });

    if (isNewSearch) {
      setMovies(newMovies);
    } else {
      setMovies(prev => [...prev, ...newMovies]);
    }

    setHasMore(currentPage < totalPages);
    setLoading(false);
    setInitialLoading(false);
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset and search when filters change
  useEffect(() => {
    setPage(1);
    fetchMovies(true);
    
    // Update URL params
    const params = new URLSearchParams();
    if (debouncedSearchQuery) params.set('q', debouncedSearchQuery);
    if (selectedGenres.length > 0) params.set('genre', selectedGenres.join(','));
    if (selectedYear) params.set('year', selectedYear);
    if (selectedSort) params.set('sort', selectedSort);
    setSearchParams(params, { replace: true });
  }, [debouncedSearchQuery, selectedGenres, selectedYear, selectedSort]);

  // Load more when page changes
  useEffect(() => {
    if (page > 1) {
      fetchMovies();
    }
  }, [page]);

  // Focus input on mount if requested
  useEffect(() => {
    if (searchParams.get('focus') === 'true') {
      searchInputRef.current?.focus();
    }
  }, []);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedGenres([]);
    setSelectedYear("");
    setSelectedSort("popularity.desc");
  };

  const toggleGenre = (genreId: string) => {
    setSelectedGenres(prev => 
      prev.includes(genreId) 
        ? prev.filter(id => id !== genreId) 
        : [...prev, genreId]
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8">
      {/* AniList Style Filter Bar */}
      <div className="bg-card/50 backdrop-blur-md p-6 rounded-xl border border-white/5 shadow-xl flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {/* Search */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-1">Search</label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Search movies..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-white/5 rounded-md py-2 pl-9 pr-4 text-xs focus:ring-1 focus:ring-accent focus:border-accent outline-none transition-all"
              />
            </div>
          </div>

          {/* Genre */}
          <div className="flex flex-col gap-2 lg:col-span-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-1">Genres</label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-background border border-white/5 rounded-md min-h-[38px]">
              {selectedGenres.length === 0 && (
                <span className="text-xs text-text-muted/50 px-1 py-0.5">Any Genre</span>
              )}
              {selectedGenres.map(id => {
                const genre = GENRES.find(g => g.id === id);
                return (
                  <button 
                    key={id}
                    onClick={() => toggleGenre(id)}
                    className="flex items-center gap-1.5 bg-accent text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-accent-hover transition-colors"
                  >
                    {genre?.name}
                    <X className="w-2.5 h-2.5" />
                  </button>
                );
              })}
              <div className="relative group ml-auto">
                <select 
                  value=""
                  onChange={(e) => e.target.value && toggleGenre(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-8"
                >
                  <option value="">Add...</option>
                  {GENRES.filter(g => !selectedGenres.includes(g.id)).map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <div className="w-8 h-full flex items-center justify-center text-text-muted hover:text-accent transition-colors">
                  <Plus className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Year */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-1">Year</label>
            <div className="relative group">
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-background border border-white/5 rounded-md py-2 pl-3 pr-8 text-xs appearance-none focus:ring-1 focus:ring-accent focus:border-accent outline-none cursor-pointer"
              >
                <option value="">Any</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted pointer-events-none group-hover:text-accent transition-colors" />
            </div>
          </div>

          {/* Sort */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-1">Sort</label>
            <div className="relative group">
              <select 
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="w-full bg-background border border-white/5 rounded-md py-2 pl-3 pr-8 text-xs appearance-none focus:ring-1 focus:ring-accent focus:border-accent outline-none cursor-pointer"
              >
                {SORTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted pointer-events-none group-hover:text-accent transition-colors" />
            </div>
          </div>

          {/* Reset Button */}
          <div className="flex flex-col gap-2 justify-end">
            <button 
              onClick={resetFilters}
              className="w-full bg-background hover:bg-accent hover:text-white border border-white/5 rounded-md py-2 text-[10px] font-bold uppercase tracking-widest transition-all text-text-muted"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4 text-accent" />
            </div>
            <h2 className="text-sm font-bold tracking-widest uppercase text-foreground/90">
              {searchQuery ? `Results for "${searchQuery}"` : 'Browse Movies'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest bg-card px-3 py-1 rounded-full border border-white/5">
              {movies.length} Loaded
            </span>
          </div>
        </div>

        {initialLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-card rounded-md animate-pulse" />
            ))}
          </div>
        ) : movies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            <AnimatePresence mode="popLayout">
              {movies.map((movie, index) => (
                <motion.div
                  key={`${movie.id}-${index}`}
                  ref={index === movies.length - 1 ? lastMovieRef : null}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: (index % 12) * 0.05 }}
                >
                  <MovieCard movie={movie} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="py-32 text-center flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center border border-white/5 shadow-inner">
              <X className="w-10 h-10 text-text-muted/50" />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-foreground font-bold text-lg">No movies found</p>
              <p className="text-text-muted text-sm">Try adjusting your filters or search query.</p>
            </div>
          </div>
        )}

        {loading && !initialLoading && (
          <div className="flex justify-center py-12">
            <div className="flex gap-1.5">
              <motion.div 
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ repeat: Infinity, duration: 0.6 }}
                className="w-2 h-2 bg-accent rounded-full" 
              />
              <motion.div 
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                className="w-2 h-2 bg-accent rounded-full" 
              />
              <motion.div 
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                className="w-2 h-2 bg-accent rounded-full" 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
