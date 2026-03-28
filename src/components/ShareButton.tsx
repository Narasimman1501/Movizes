import React, { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ShareButtonProps {
  title: string;
  url: string;
  className?: string;
  iconOnly?: boolean;
}

export default function ShareButton({ title, url, className = "", iconOnly = false }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      setShowMenu(!showMenu);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowMenu(false);
  };

  const shareToSocial = (platform: 'twitter' | 'facebook' | 'whatsapp') => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    
    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;
        break;
    }
    
    window.open(shareUrl, '_blank');
    setShowMenu(false);
  };

  if (iconOnly) {
    return (
      <div className="relative">
        <button 
          onClick={handleShare}
          className={`flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-accent transition-colors ${className}`}
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
        </button>
        
        <AnimatePresence>
          {showMenu && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute bottom-full right-0 mb-2 w-48 bg-card border border-white/10 rounded-md shadow-xl z-50 overflow-hidden"
            >
              <button 
                onClick={copyToClipboard}
                className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-white/5 flex items-center gap-2"
              >
                <Copy className="w-3 h-3" />
                {copied ? 'COPIED!' : 'COPY LINK'}
              </button>
              <div className="h-px bg-white/5" />
              <button 
                onClick={() => shareToSocial('twitter')}
                className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-white/5"
              >
                TWITTER
              </button>
              <button 
                onClick={() => shareToSocial('facebook')}
                className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-white/5"
              >
                FACEBOOK
              </button>
              <button 
                onClick={() => shareToSocial('whatsapp')}
                className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-white/5"
              >
                WHATSAPP
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <button 
        onClick={handleShare}
        className={`w-full bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-md font-bold text-sm flex items-center justify-center gap-2 transition-all ${className}`}
      >
        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
        {copied ? 'COPIED!' : 'SHARE MOVIE'}
      </button>

      <AnimatePresence>
        {showMenu && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute bottom-full left-0 mb-2 w-full bg-card border border-white/10 rounded-md shadow-xl z-50 overflow-hidden"
          >
            <button 
              onClick={copyToClipboard}
              className="w-full px-4 py-3 text-left text-xs font-bold hover:bg-white/5 flex items-center gap-2"
            >
              <Copy className="w-3 h-3" />
              {copied ? 'COPIED!' : 'COPY LINK'}
            </button>
            <div className="h-px bg-white/5" />
            <button 
              onClick={() => shareToSocial('twitter')}
              className="w-full px-4 py-3 text-left text-xs font-bold hover:bg-white/5"
            >
              TWITTER
            </button>
            <button 
              onClick={() => shareToSocial('facebook')}
              className="w-full px-4 py-3 text-left text-xs font-bold hover:bg-white/5"
            >
              FACEBOOK
            </button>
            <button 
              onClick={() => shareToSocial('whatsapp')}
              className="w-full px-4 py-3 text-left text-xs font-bold hover:bg-white/5"
            >
              WHATSAPP
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
