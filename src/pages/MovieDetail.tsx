import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Movie } from '../types';
import { Star, Sparkles, User, Plus, Check, ExternalLink, Play, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getMovieDetails, getMovieRecommendations, getStreamingPlatforms, getMovieTrailer } from '../services/movieService';
import MovieCard from '../components/MovieCard';
import ShareButton from '../components/ShareButton';
import { useAuth } from '../lib/AuthContext';
import { db } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

export default function MovieDetail() {
  const { id } = useParams();
  const { user, login, language } = useAuth();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [streamingPlatforms, setStreamingPlatforms] = useState<{ name: string; url: string; tmdbUrl?: string }[]>([]);
  const [loadingPlatforms, setLoadingPlatforms] = useState(false);
  const [listStatus, setListStatus] = useState<string | null>(null);
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [isUpdatingList, setIsUpdatingList] = useState(false);
  const [loadingMovie, setLoadingMovie] = useState(true);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    const fetchMovie = async () => {
      if (!id) return;
      setLoadingMovie(true);
      const found = await getMovieDetails(id);
      if (found) {
        setMovie(found);
        loadRecommendations(found);
        loadStreamingPlatforms(found.id, found.title, language);
        loadTrailer(found.id);
        if (user) {
          checkListStatus(found.id);
        }
      }
      setLoadingMovie(false);
    };
    fetchMovie();
  }, [id, user, language]);

  const loadTrailer = async (movieId: string) => {
    const key = await getMovieTrailer(movieId);
    setTrailerKey(key);
  };

  const checkListStatus = async (movieId: string) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid, 'list', movieId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setListStatus(docSnap.data().status);
        setUserRating(docSnap.data().score || 0);
      }
    } catch (error) {
      console.error("Error checking list status:", error);
    }
  };

  const addToList = async (status: string) => {
    if (!user) {
      login();
      return;
    }
    if (!movie) return;
    
    setIsUpdatingList(true);
    const path = `users/${user.uid}/list/${movie.id}`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'list', movie.id), {
        userId: user.uid,
        movieId: movie.id,
        status: status,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setListStatus(status);
      
      // Also add to global activity
      await setDoc(doc(db, 'activities', `${user.uid}_${movie.id}_${Date.now()}`), {
        userId: user.uid,
        userName: user.displayName,
        userAvatar: user.photoURL,
        action: `added to ${status.toLowerCase()}`,
        movieTitle: movie.title,
        movieId: movie.id,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setIsUpdatingList(false);
    }
  };

  const loadRecommendations = async (movie: Movie) => {
    setLoadingRecs(true);
    const recs = await getMovieRecommendations(movie.id);
    setRecommendations(recs);
    setLoadingRecs(false);
  };

  const loadStreamingPlatforms = async (movieId: string, title: string, lang: string = 'en') => {
    setLoadingPlatforms(true);
    const platforms = await getStreamingPlatforms(movieId, title, lang);
    setStreamingPlatforms(platforms);
    setLoadingPlatforms(false);
  };

  const watchNowUrl = useMemo(() => {
    return streamingPlatforms[0]?.url;
  }, [streamingPlatforms]);

  const handleRate = async (score: number) => {
    if (!user) {
      login();
      return;
    }
    if (!movie) return;

    try {
      const userListRef = doc(db, 'users', user.uid, 'list', movie.id);
      const movieRef = doc(db, 'movies', movie.id);

      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userListRef);
        const movieDoc = await transaction.get(movieRef);

        let prevScore = 0;
        if (userDoc.exists()) {
          prevScore = userDoc.data().score || 0;
        }

        let currentRatingCount = 0;
        let currentTotalRating = 0;

        if (movieDoc.exists()) {
          currentRatingCount = movieDoc.data().ratingCount || 0;
          currentTotalRating = movieDoc.data().totalRating || 0;
        } else {
          // If movie doc doesn't exist, create it with initial data from the movie state
          transaction.set(movieRef, {
            ...movie,
            rating: 0,
            ratingCount: 0,
            totalRating: 0
          });
        }

        let newRatingCount = currentRatingCount;
        let newTotalRating = currentTotalRating;

        if (prevScore === 0) {
          newRatingCount += 1;
          newTotalRating += score;
        } else {
          newTotalRating = currentTotalRating - prevScore + score;
        }

        const newAverage = parseFloat((newTotalRating / newRatingCount).toFixed(1));

        transaction.set(userListRef, {
          userId: user.uid,
          movieId: movie.id,
          status: listStatus || 'PLANNING',
          score: score,
          updatedAt: serverTimestamp()
        }, { merge: true });

        transaction.set(movieRef, {
          rating: newAverage,
          ratingCount: newRatingCount,
          totalRating: newTotalRating
        }, { merge: true });

        setMovie(prev => prev ? { ...prev, rating: newAverage, ratingCount: newRatingCount, totalRating: newTotalRating } : null);
        setUserRating(score);
        if (!listStatus) setListStatus('PLANNING');
      });

      // Add to activity
      await setDoc(doc(db, 'activities', `${user.uid}_${movie.id}_rate_${Date.now()}`), {
        userId: user.uid,
        userName: user.displayName,
        userAvatar: user.photoURL,
        action: `rated ${score}/10`,
        movieTitle: movie.title,
        movieId: movie.id,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Error rating movie:", error);
    }
  };

  const isReleased = movie && movie.releaseDate ? new Date(movie.releaseDate).getTime() <= Date.now() : false;

  if (loadingMovie) return <div className="p-20 text-center text-text-muted">Loading movie details...</div>;
  if (!movie) return <div className="p-20 text-center text-text-muted">Movie not found</div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col"
    >
      {/* Banner */}
      <div className="relative h-[400px] w-full overflow-hidden">
        <img 
          src={movie.bannerImage} 
          alt={movie.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-32 relative z-10 flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex flex-col gap-6 shrink-0">
          <div className="aspect-[2/3] rounded-md overflow-hidden shadow-2xl bg-card">
            <img 
              src={movie.coverImage} 
              alt={movie.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex flex-col gap-2">
            {watchNowUrl && (
              <a 
                href={watchNowUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-accent hover:bg-accent-hover text-white px-4 py-2.5 rounded-md font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent/20 w-full"
              >
                <Play className="w-4 h-4 fill-white" />
                WATCH NOW
              </a>
            )}
            <div className="relative group">
              {listStatus ? (
                <div className="bg-accent text-white px-4 py-2.5 rounded-md font-bold text-sm flex items-center justify-center gap-2 transition-all group-hover:bg-accent-hover shadow-lg shadow-accent/20">
                  <Check className="w-4 h-4" />
                  {listStatus}
                  <ChevronDown className="w-4 h-4 ml-auto opacity-50" />
                </div>
              ) : (
                <button 
                  onClick={() => addToList('PLANNING')}
                  disabled={isUpdatingList}
                  className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-white px-4 py-2.5 rounded-md font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent/20 w-full"
                >
                  <Plus className="w-4 h-4" />
                  ADD TO LIST
                </button>
              )}
              {listStatus && (
                <select 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  value={listStatus}
                  onChange={(e) => addToList(e.target.value)}
                >
                  <option value="PLANNING" className="bg-[#151f2e] text-[#edf1f5]">PLANNING</option>
                  <option value="WATCHING" className="bg-[#151f2e] text-[#edf1f5]">WATCHING</option>
                  <option value="COMPLETED" className="bg-[#151f2e] text-[#edf1f5]">COMPLETED</option>
                  <option value="DROPPED" className="bg-[#151f2e] text-[#edf1f5]">DROPPED</option>
                </select>
              )}
            </div>
            {trailerKey && (
              <button 
                onClick={() => setShowTrailer(true)}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-md font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                PLAY TRAILER
              </button>
            )}
            <ShareButton 
              title={movie.title} 
              url={`${window.location.origin}/movie/${movie.id}`} 
            />
            {!user && (
              <p className="text-[10px] text-center text-text-muted font-bold uppercase mt-1">Login to track movies</p>
            )}
          </div>
          
          <div className="bg-card rounded-md p-4 flex flex-col gap-4 text-sm">
            {isReleased && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted font-bold text-[11px] uppercase">
                    {user ? 'Your Rating' : 'Login to Rate'}
                  </span>
                  {user && userRating > 0 && (
                    <motion.span 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded"
                    >
                      {userRating}/10
                    </motion.span>
                  )}
                </div>
                {user ? (
                  <div 
                    className="flex items-center gap-0.5 group"
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRate(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        className="focus:outline-none relative p-0.5 transition-transform active:scale-90"
                      >
                        <motion.div
                          animate={{
                            scale: (hoverRating >= star || (!hoverRating && userRating >= star)) ? 1.2 : 1,
                            color: (hoverRating >= star || (!hoverRating && userRating >= star)) ? "#facc15" : "rgba(255, 255, 255, 0.1)"
                          }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                          <Star 
                            className={`w-4 h-4 ${(hoverRating >= star || (!hoverRating && userRating >= star)) ? 'fill-current' : ''}`} 
                          />
                        </motion.div>
                        
                        {/* Hover Glow Effect */}
                        {hoverRating === star && (
                          <motion.div 
                            layoutId="star-glow"
                            className="absolute inset-0 bg-yellow-400/20 blur-md rounded-full -z-10"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button 
                    onClick={() => login()}
                    className="text-[10px] font-bold text-accent hover:text-accent-hover uppercase tracking-wider text-left transition-colors"
                  >
                    Sign in to rate this movie
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1">
              <span className="text-text-muted font-bold text-[11px] uppercase">Format</span>
              <span className="font-medium">Movie</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-text-muted font-bold text-[11px] uppercase">Director</span>
              {movie.directorId ? (
                <Link to={`/person/${movie.directorId}`} className="font-medium text-accent hover:underline">
                  {movie.director}
                </Link>
              ) : (
                <span className="font-medium text-accent">{movie.director}</span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-text-muted font-bold text-[11px] uppercase">Release Date</span>
              <span className="font-medium">{movie.releaseDate}</span>
            </div>
            {movie.ottReleaseDate && (
              <div className="flex flex-col gap-1">
                <span className="text-accent font-bold text-[11px] uppercase flex items-center gap-1">
                  <Play className="w-3 h-3 fill-accent" />
                  OTT Release
                </span>
                <span className="font-medium">{movie.ottReleaseDate}</span>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <span className="text-text-muted font-bold text-[11px] uppercase">Genres</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {movie.genres?.map(g => (
                  <span key={g} className="bg-background px-2 py-0.5 rounded text-[10px] font-bold">{g}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 py-8 flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{movie.title}</h1>
              <div className="flex items-center gap-4 text-sm text-text-muted">
                {isReleased && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="font-bold text-foreground">{movie.rating}</span>
                    <span className="text-[10px] opacity-50">({movie.ratingCount || 0} ratings)</span>
                  </div>
                )}
                <span>{movie.releaseDate ? movie.releaseDate.split('-')[0] : 'TBA'}</span>
                {movie.vibe && (
                  <span className="bg-accent/20 text-accent px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {movie.vibe}
                  </span>
                )}
              </div>
            </div>

          {/* Where to Watch */}
          <div className="bg-card rounded-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-accent" />
                <h2 className="text-sm font-bold uppercase text-text-muted">Where to Watch</h2>
              </div>
            </div>
            {loadingPlatforms ? (
              <div className="flex gap-4 animate-pulse">
                <div className="h-10 w-24 bg-background rounded" />
                <div className="h-10 w-24 bg-background rounded" />
              </div>
            ) : streamingPlatforms.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {streamingPlatforms.map(platform => (
                  <a 
                    key={platform.name}
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-background hover:bg-white/5 border border-white/5 px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition-all"
                  >
                    {platform.name}
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted italic">Not available in your region</p>
            )}
          </div>

          <div className="bg-card rounded-md p-6">
            <h2 className="text-sm font-bold uppercase text-text-muted mb-4">Description</h2>
            <p className="text-sm leading-relaxed text-foreground/80">
              {movie.description}
            </p>
          </div>

          <div className="bg-card rounded-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-bold uppercase text-text-muted">Similar Movies</h2>
            </div>
            {loadingRecs ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-pulse">
                {[1, 2, 3].map(i => <div key={i} className="aspect-[2/3] bg-background rounded" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {recommendations.map(rec => (
                  <MovieCard key={rec.id} movie={rec} />
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase text-text-muted mb-4">Director</h2>
            <div className="flex">
              {movie.directorId ? (
                <Link 
                  to={`/person/${movie.directorId}`}
                  className="bg-card hover:bg-white/5 border border-white/5 rounded-xl p-3 flex items-center gap-3 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-background overflow-hidden flex-shrink-0 border-2 border-transparent group-hover:border-accent transition-colors">
                    {movie.directorProfilePath ? (
                      <img src={movie.directorProfilePath} alt={movie.director} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-6 h-6 text-text-muted" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold truncate group-hover:text-accent transition-colors">{movie.director}</span>
                    <span className="text-[10px] text-text-muted truncate italic">Director</span>
                  </div>
                </Link>
              ) : (
                <div className="bg-card border border-white/5 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center">
                    <User className="w-6 h-6 text-text-muted" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold">{movie.director}</span>
                    <span className="text-[10px] text-text-muted italic">Director</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase text-text-muted mb-4">Cast</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {(movie.castMembers && movie.castMembers.length > 0 ? movie.castMembers : (movie.cast || []).map(name => ({ id: null, name, character: '', profilePath: null }))).map((actor, idx) => (
                <Link 
                  key={actor.id || idx} 
                  to={actor.id ? `/person/${actor.id}` : '#'}
                  className={`bg-card hover:bg-white/5 border border-white/5 rounded-xl p-3 flex items-center gap-3 transition-all group ${!actor.id ? 'cursor-default' : ''}`}
                >
                  <div className="w-12 h-12 rounded-full bg-background overflow-hidden flex-shrink-0 border-2 border-transparent group-hover:border-accent transition-colors">
                    {actor.profilePath ? (
                      <img src={actor.profilePath} alt={actor.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-6 h-6 text-text-muted" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold truncate group-hover:text-accent transition-colors">{actor.name}</span>
                    {actor.character && (
                      <span className="text-[10px] text-text-muted truncate italic">{actor.character}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      <AnimatePresence>
        {showTrailer && trailerKey && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
            onClick={() => setShowTrailer(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowTrailer(false)}
                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/80 p-2 rounded-full text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <iframe
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
                title="Movie Trailer"
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
