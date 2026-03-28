import React from 'react';
import { Link } from 'react-router-dom';
import MovieCard from './MovieCard';
import { Movie } from '../types';

interface MovieGridProps {
  title: string;
  movies: Movie[];
}

export default function MovieGrid({ title, movies }: MovieGridProps) {
  const getSearchLink = () => {
    if (title.toLowerCase().includes('trending')) return '/search?sort=popularity.desc';
    if (title.toLowerCase().includes('top rated')) return '/search?sort=vote_average.desc';
    return '/search';
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight uppercase text-text-muted">{title}</h2>
        <Link 
          to={getSearchLink()}
          className="text-xs font-bold text-text-muted hover:text-accent transition-colors"
        >
          VIEW ALL
        </Link>
      </div>
      <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {movies.map((movie) => (
          <div key={movie.id} className="w-[160px] sm:w-[200px] flex-shrink-0">
            <MovieCard movie={movie} />
          </div>
        ))}
      </div>
    </section>
  );
}
