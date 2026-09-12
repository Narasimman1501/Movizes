import React from 'react';
import { Search, User, Menu, Bell, LogOut, LogIn, Globe } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

const languages = [
  { code: 'en', name: 'EN' },
  { code: 'hi', name: 'HI' },
  { code: 'ta', name: 'TA' },
  { code: 'te', name: 'TE' },
  { code: 'ml', name: 'ML' },
  { code: 'kn', name: 'KN' },
  { code: 'es', name: 'ES' },
  { code: 'fr', name: 'FR' },
  { code: 'ja', name: 'JA' },
  { code: 'ko', name: 'KO' }
];

export default function Header() {
  const { user, login, logout, language, updateLanguage } = useAuth();
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <header className="bg-card sticky top-0 z-50 h-16 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-2xl font-black tracking-tighter text-accent">
            CINELIST
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-text-muted">
            <Link to="/search" className="hover:text-accent transition-colors">Browse</Link>
            {user && <Link to="/profile" className="hover:text-accent transition-colors">My List</Link>}
            <Link to="/social" className="hover:text-accent transition-colors">Social</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-background/50 px-2 py-1 rounded-md border border-white/5">
            <Globe className="w-3.5 h-3.5 text-text-muted" />
            <select 
              value={language}
              onChange={(e) => updateLanguage(e.target.value)}
              className="bg-transparent text-[10px] font-bold uppercase outline-none cursor-pointer text-text-muted hover:text-accent transition-colors"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code} className="bg-card text-text">
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {isHome && (
            <div className="relative group flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-accent transition-colors" />
              <Link to="/search?focus=true" className="block">
                <input 
                  type="text" 
                  placeholder="Search movies..." 
                  readOnly
                  className="bg-background border-none rounded-md py-1.5 pl-10 pr-4 text-sm w-full sm:w-48 focus:sm:w-64 focus:ring-1 focus:ring-accent transition-all outline-none cursor-pointer"
                />
              </Link>
            </div>
          )}
          
          {user ? (
            <div className="flex items-center gap-4">
              <button className="p-2 text-text-muted hover:text-accent transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <Link to="/profile" className="w-8 h-8 rounded-full overflow-hidden border-2 border-accent/20 hover:border-accent transition-colors">
                <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-full h-full object-cover" />
              </Link>
              <button 
                onClick={logout}
                className="p-2 text-text-muted hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => login()}
              className="bg-accent hover:bg-accent-hover text-white px-4 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 transition-all"
            >
              <LogIn className="w-4 h-4" />
              LOGIN
            </button>
          )}
          
          <button className="md:hidden p-2 text-text-muted hover:text-accent transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
