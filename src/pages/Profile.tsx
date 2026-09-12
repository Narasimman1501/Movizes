import React, { useState, useEffect } from 'react';
import { getMovieDetails } from '../services/movieService';
import MovieCard from '../components/MovieCard';
import { List, Clock, CheckCircle, XCircle, BarChart2, Camera, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { Movie } from '../types';
import AuthModal from '../components/AuthModal';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

const TABS = [
  { id: 'WATCHING', label: 'Watching', icon: Clock },
  { id: 'PLANNING', label: 'Planning', icon: List },
  { id: 'COMPLETED', label: 'Completed', icon: CheckCircle },
  { id: 'DROPPED', label: 'Dropped', icon: XCircle },
];

export default function Profile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('WATCHING');
  const [userList, setUserList] = useState<any[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchProfileData = async () => {
      try {
        const listRef = collection(db, 'users', user.uid, 'list');
        const q = query(listRef, orderBy('updatedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const list = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUserList(list);
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  useEffect(() => {
    const fetchMovies = async () => {
      const filteredIds = userList
        .filter(item => item.status === activeTab)
        .map(item => item.movieId);
      
      if (filteredIds.length === 0) {
        setMovies([]);
        return;
      }

      setLoadingMovies(true);
      try {
        const movieDetails = await Promise.all(
          filteredIds.map(id => getMovieDetails(id))
        );
        setMovies(movieDetails.filter((m): m is Movie => !!m));
      } catch (error) {
        console.error("Error fetching movies for profile:", error);
      } finally {
        setLoadingMovies(false);
      }
    };

    if (!loading) {
      fetchMovies();
    }
  }, [userList, activeTab, loading]);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Banner upload logic removed for now or can be implemented via backend
    console.log("Banner upload not implemented yet");
  };

  if (!user) return <div className="p-20 text-center">Please login to view your profile</div>;

  const stats = {
    total: userList.length,
    completed: userList.filter(i => i.status === 'COMPLETED').length,
    planning: userList.filter(i => i.status === 'PLANNING').length,
    watching: userList.filter(i => i.status === 'WATCHING').length,
  };

  return (
    <div className="flex flex-col">
      {/* Profile Header */}
      <div className="relative h-64 w-full overflow-hidden group">
        <img 
          src={bannerUrl || `https://picsum.photos/seed/${user.uid}/1920/400`} 
          alt="Banner"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
        
        <label className="absolute bottom-4 right-4 cursor-pointer bg-black/50 hover:bg-accent text-white px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 backdrop-blur-md transition-all opacity-0 group-hover:opacity-100">
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
          {isUploading ? 'UPLOADING...' : 'CHANGE BANNER'}
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleBannerUpload}
            disabled={isUploading}
          />
        </label>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-10 w-full">
        <div className="flex flex-col md:flex-row gap-6 items-end">
          <div className="w-32 h-32 rounded-md overflow-hidden border-4 border-background bg-card shadow-xl">
            <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 pb-2">
            <h1 className="text-2xl font-bold">{user.displayName}</h1>
            <div className="flex items-center gap-4 text-sm text-text-muted mt-1">
              <span>Joined March 2026</span>
              <span className="text-accent font-bold">Profile</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 mt-12">
          {/* Stats Sidebar */}
          <div className="w-full md:w-64 flex flex-col gap-6 shrink-0">
            <div className="bg-card rounded-md p-6 flex flex-col gap-6">
              <h2 className="text-xs font-bold uppercase text-text-muted tracking-widest flex items-center gap-2">
                <BarChart2 className="w-3 h-3" />
                User Stats
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-xl font-bold">{stats.total}</span>
                  <span className="text-[10px] text-text-muted uppercase font-bold">Total Movies</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold">{stats.completed}</span>
                  <span className="text-[10px] text-text-muted uppercase font-bold">Completed</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold">{stats.watching}</span>
                  <span className="text-[10px] text-text-muted uppercase font-bold">Watching</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold">{stats.planning}</span>
                  <span className="text-[10px] text-text-muted uppercase font-bold">Planning</span>
                </div>
              </div>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 flex flex-col gap-6">
            <div className="flex items-center gap-2 overflow-x-auto border-b border-white/5 pb-px">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-foreground'}`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {loading || loadingMovies ? (
              <div className="py-20 text-center text-text-muted">Loading your list...</div>
            ) : movies.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {movies.map(movie => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center text-text-muted italic">No movies in this category yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
