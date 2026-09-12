import React from 'react';
import { Movie } from '../types';
import { Plus, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeroProps {
  movie: Movie;
}

export default function Hero({ movie }: HeroProps) {
  return (
    <div className="relative h-[500px] w-full overflow-hidden rounded-xl bg-card">
      <img 
        src={movie.bannerImage} 
        alt={movie.title}
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
      
      <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 max-w-2xl gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-accent font-bold text-xs tracking-widest uppercase">TRENDING NOW</span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">{movie.title}</h1>
          <p className="text-sm md:text-base text-text-muted line-clamp-3 leading-relaxed">
            {movie.description}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Link 
            to={`/movie/${movie.id}`}
            className="bg-accent hover:bg-accent-hover text-white px-8 py-3 rounded-md font-bold text-sm flex items-center gap-2 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            ADD TO LIST
          </Link>
          <Link 
            to={`/movie/${movie.id}`}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-8 py-3 rounded-md font-bold text-sm flex items-center gap-2 transition-all"
          >
            <Info className="w-4 h-4" />
            DETAILS
          </Link>
        </div>
      </div>
    </div>
  );
}
