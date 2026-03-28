import React from 'react';
import { Movie } from '../types';
import { Star, Plus, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

interface MovieCardProps {
  movie: Movie;
}

export default function MovieCard({ movie }: MovieCardProps) {
  const isReleased = movie.releaseDate ? new Date(movie.releaseDate).getTime() <= Date.now() : false;

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="group relative flex flex-col gap-2"
    >
      <Link to={`/movie/${movie.id}`} className="relative aspect-[2/3] overflow-hidden rounded-md bg-card">
        <img 
          src={movie.coverImage} 
          alt={movie.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="absolute bottom-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-8 h-8 bg-accent rounded-md flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
            <Plus className="w-5 h-5 text-white" />
          </div>
        </div>

        {isReleased && (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            {movie.rating}
            {movie.ratingCount && movie.ratingCount > 0 && (
              <span className="opacity-60 font-normal ml-0.5">({movie.ratingCount})</span>
            )}
          </div>
        )}
      </Link>
      <div className="flex flex-col gap-0.5">
        <Link 
          to={`/movie/${movie.id}`}
          className="text-sm font-semibold line-clamp-2 group-hover:text-accent transition-colors leading-tight"
        >
          {movie.title}
        </Link>
        <div className="text-[11px] text-text-muted font-medium">
          {movie.releaseDate ? movie.releaseDate.split('-')[0] : 'TBA'} • {movie.genres?.[0] || 'Movie'}
        </div>
      </div>
    </motion.div>
  );
}
