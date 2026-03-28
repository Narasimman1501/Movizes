import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { getCastDetails, getCastMovies } from '../services/movieService';
import { getPersonAISummary, PersonAISummary } from '../services/geminiService';
import { Movie } from '../types';
import MovieCard from '../components/MovieCard';
import { ChevronLeft, Calendar, MapPin, Award, Star, Zap, Sparkles, User } from 'lucide-react';

export default function PersonDetail() {
  const { id } = useParams<{ id: string }>();
  const [person, setPerson] = useState<any>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<PersonAISummary | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      setLoading(true);
      const [personData, moviesData] = await Promise.all([
        getCastDetails(id),
        getCastMovies(id)
      ]);
      setPerson(personData);
      setMovies(moviesData);
      setLoading(false);

      if (personData) {
        setLoadingAI(true);
        const summary = await getPersonAISummary(personData.name, personData.biography);
        setAiSummary(summary);
        setLoadingAI(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-muted animate-pulse">Loading details...</div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Person not found</h1>
        <Link to="/" className="text-primary hover:underline flex items-center gap-2">
          <ChevronLeft size={20} /> Back to Home
        </Link>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pb-20"
    >
      {/* Hero Section */}
      <div className="relative h-[45vh] md:h-[50vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background z-10" />
        <img 
          src={person.profilePath || "https://picsum.photos/seed/person/1920/1080"} 
          alt={person.name}
          className="w-full h-full object-cover opacity-40 blur-md scale-110"
          referrerPolicy="no-referrer"
        />
        
        <div className="absolute inset-0 flex items-end z-20">
          <div className="max-w-7xl mx-auto w-full px-6 md:px-12 pb-12">
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-end text-center md:text-left">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-48 h-72 md:w-56 md:h-84 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-background flex-shrink-0 bg-surface"
              >
                {person.profilePath ? (
                  <img 
                    src={person.profilePath} 
                    alt={person.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User size={80} className="text-text-muted opacity-20" />
                  </div>
                )}
              </motion.div>
              
              <div className="flex-1 pb-2">
                <Link 
                  to={-1 as any} 
                  className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors mb-6 group"
                >
                  <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                  Go Back
                </Link>
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-5xl md:text-7xl font-bold mb-6 tracking-tight"
                >
                  {person.name}
                </motion.h1>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm md:text-base text-text-muted font-medium">
                  {person.birthday && (
                    <div className="flex items-center gap-2 bg-surface/50 px-4 py-2 rounded-full border border-border/30">
                      <Calendar size={18} className="text-primary" />
                      <span>Born: {person.birthday}</span>
                    </div>
                  )}
                  {person.placeOfBirth && (
                    <div className="flex items-center gap-2 bg-surface/50 px-4 py-2 rounded-full border border-border/30">
                      <MapPin size={18} className="text-primary" />
                      <span>{person.placeOfBirth}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Biography */}
          <div className="lg:col-span-4">
            <div className="sticky top-24">
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <span className="w-1.5 h-8 bg-primary rounded-full" />
                Biography
              </h2>
              <div className="bg-surface/30 p-8 rounded-3xl border border-border/50 backdrop-blur-sm">
                <p className="text-text-muted leading-relaxed text-base whitespace-pre-line">
                  {person.biography || "No biography available for this person."}
                </p>
              </div>
            </div>
          </div>

          {/* Filmography */}
          <div className="lg:col-span-8 flex flex-col gap-16">
            {/* AI Summary Section */}
            {(loadingAI || aiSummary) && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface/30 rounded-3xl border border-primary/20 p-8 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Sparkles size={120} className="text-primary" />
                </div>
                
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 relative z-10">
                  <Sparkles size={24} className="text-primary animate-pulse" />
                  AI Industry Insight
                </h2>

                {loadingAI ? (
                  <div className="space-y-6 animate-pulse relative z-10">
                    <div className="h-4 bg-surface/50 rounded w-full" />
                    <div className="h-4 bg-surface/50 rounded w-5/6" />
                    <div className="h-24 bg-surface/50 rounded w-full" />
                  </div>
                ) : aiSummary && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                          <Award size={16} />
                          Notable Awards
                        </h3>
                        <ul className="space-y-3">
                          {aiSummary.awards.map((award, i) => (
                            <li key={i} className="text-sm text-text-muted flex items-start gap-3">
                              <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 shrink-0" />
                              {award}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                          <Zap size={16} />
                          Career Highlights
                        </h3>
                        <ul className="space-y-3">
                          {aiSummary.highlights.map((highlight, i) => (
                            <li key={i} className="text-sm text-text-muted flex items-start gap-3">
                              <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 shrink-0" />
                              {highlight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="bg-background/40 p-6 rounded-2xl border border-border/30 h-fit">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                        <Star size={16} />
                        Style & Presence
                      </h3>
                      <p className="text-sm text-text-muted leading-relaxed italic">
                        "{aiSummary.style}"
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            <div>
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <span className="w-1.5 h-8 bg-primary rounded-full" />
                Filmography
                <span className="text-sm font-normal text-text-muted ml-2">({movies.length} titles)</span>
              </h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-10">
                {movies.map((movie, index) => (
                  <motion.div
                    key={movie.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    transition={{ 
                      delay: index * 0.03,
                      type: "spring",
                      stiffness: 300,
                      damping: 20
                    }}
                  >
                    <MovieCard movie={movie} />
                  </motion.div>
                ))}
              </div>
              
              {movies.length === 0 && (
                <div className="text-center py-20 text-text-muted bg-surface/20 rounded-3xl border border-dashed border-border/50">
                  <p className="text-lg">No movies found for this person.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
