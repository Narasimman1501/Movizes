/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import MovieDetail from './pages/MovieDetail';
import PersonDetail from './pages/PersonDetail';
import SearchPage from './pages/Search';
import Profile from './pages/Profile';
import Social from './pages/Social';
import { AuthProvider } from './lib/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/movie/:id" element={<MovieDetail />} />
                <Route path="/person/:id" element={<PersonDetail />} />
                <Route path="/cast/:id" element={<PersonDetail />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/social" element={<Social />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
