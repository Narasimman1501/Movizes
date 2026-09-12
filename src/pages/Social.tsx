import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Heart } from 'lucide-react';
import ShareButton from '../components/ShareButton';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

export default function Social() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const activitiesRef = collection(db, 'activities');
    const q = query(activitiesRef, orderBy('timestamp', 'desc'), limit(20));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
      setActivities(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching activities:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight uppercase text-text-muted">Activity Feed</h1>
        <div className="flex items-center gap-4 text-xs font-bold text-text-muted">
          <button className="text-accent">GLOBAL</button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-text-muted">Loading activities...</div>
      ) : activities.length > 0 ? (
        <div className="flex flex-col gap-4">
          {activities.map((activity) => (
            <motion.div 
              key={activity.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-md p-4 flex gap-4"
            >
              <div className="w-12 h-12 rounded-md overflow-hidden shrink-0 bg-background">
                {activity.userAvatar ? (
                  <img src={activity.userAvatar} alt={activity.userName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-muted font-bold">
                    {activity.userName?.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-bold text-accent hover:underline cursor-pointer">{activity.userName}</span>
                    <span className="text-text-muted mx-1">{activity.action}</span>
                    <span className="font-bold hover:text-accent cursor-pointer transition-colors">{activity.movieTitle}</span>
                  </div>
                  <span className="text-[10px] text-text-muted font-bold uppercase">
                    {activity.timestamp ? new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                
                <div className="flex items-center gap-6 mt-2">
                  <button className="flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-red-400 transition-colors">
                    <Heart className="w-4 h-4" />
                    {activity.likes || 0}
                  </button>
                  <button className="flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-accent transition-colors">
                    <MessageSquare className="w-4 h-4" />
                    0
                  </button>
                  <div className="ml-auto">
                    <ShareButton 
                      title={activity.movieTitle} 
                      url={`${window.location.origin}/movie/${activity.movieId}`} 
                      iconOnly 
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-text-muted italic">No activities yet. Start adding movies to your list!</div>
      )}
    </div>
  );
}
