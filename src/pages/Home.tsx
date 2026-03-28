import React, { useEffect, useState } from 'react';
import MovieGrid from '../components/MovieGrid';
import Hero from '../components/Hero';
import { getTrendingMovies, getPopularMovies, getTopRatedMovies } from '../services/movieService';
import { Movie } from '../types';
import { motion } from 'motion/react';
import { useAuth } from '../lib/AuthContext';

const languageNames: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  ml: 'Malayalam',
  kn: 'Kannada',
  es: 'Spanish',
  fr: 'French',
  ja: 'Japanese',
  ko: 'Korean'
};

export default function Home() {
  const { language } = useAuth();
  const [trending, setTrending] = useState<Movie[]>([]);
  const [popular, setPopular] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        const [trendingData, popularData, topRatedData] = await Promise.all([
          getTrendingMovies(),
          getPopularMovies(language),
          getTopRatedMovies()
        ]);
        setTrending(trendingData.slice(0, 10));
        setPopular(popularData.slice(0, 10));
        setTopRated(topRatedData.slice(0, 10));
      } catch (error) {
        console.error("Error fetching home page movies:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, [language]);

  if (loading) return <div className="p-20 text-center text-text-muted">Loading movies...</div>;

  const heroMovie = trending[0];
  const popularTitle = language === 'en' ? 'Popular This Season' : `Popular in ${languageNames[language] || language}`;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-12"
    >
      {heroMovie && <Hero movie={heroMovie} />}
      <MovieGrid title="Trending Now" movies={trending} />
      <MovieGrid title={popularTitle} movies={popular} />
      <MovieGrid title="Top Rated" movies={topRated} />
    </motion.div>
  );
}
