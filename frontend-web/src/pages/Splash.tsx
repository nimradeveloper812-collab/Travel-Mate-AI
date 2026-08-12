import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Splash() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Check if token exists to auto-redirect after splash
    const targetPath = localStorage.getItem('token') ? '/dashboard' : '/login';

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 45); // 100 steps * 45ms = ~4.5 seconds + buffer to equal exactly 5 seconds

    const timeout = setTimeout(() => {
      navigate(targetPath);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [navigate]);

  const handleSkip = () => {
    const targetPath = localStorage.getItem('token') ? '/dashboard' : '/login';
    navigate(targetPath);
  };

  return (
    <div className="relative w-screen h-screen flex flex-col items-center justify-center bg-gradient-to-b from-sky-400 via-blue-500 to-white overflow-hidden select-none">
      
      {/* Skip Button */}
      <button 
        onClick={handleSkip}
        className="absolute top-8 right-8 text-sm font-semibold text-sky-800 hover:text-blue-900 bg-white/30 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer interactive z-20"
      >
        Skip
      </button>

      {/* Floating Cloud Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          animate={{ x: [0, 40, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-10 w-48 h-12 bg-white/20 blur-xl rounded-full"
        />
        <motion.div 
          animate={{ x: [0, -60, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-1/4 right-10 w-64 h-16 bg-white/30 blur-xl rounded-full"
        />
      </div>

      {/* Animated Flying Paper Plane */}
      <div className="absolute top-1/3 left-1/4 pointer-events-none">
        <motion.div
          animate={{
            x: [0, 600],
            y: [0, -100, 100, 0],
            rotate: [15, -10, 20, 15],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{
            duration: 5,
            ease: 'easeInOut',
          }}
          className="w-12 h-12 text-white opacity-80"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      </div>

      {/* Logo & Tagline Container */}
      <div className="flex flex-col items-center z-10 space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="flex items-center space-x-4"
        >
          <div className="w-16 h-16 rounded-3xl bg-white shadow-xl shadow-blue-500/20 flex items-center justify-center">
            <span className="text-4xl text-blue-600 font-extrabold">T</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-blue-900 tracking-tight">
            TravelMate <span className="text-white drop-shadow-sm">AI</span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="text-lg md:text-xl font-medium text-blue-900/80 tracking-wide text-center"
        >
          Plan smarter. Travel further.
        </motion.p>
      </div>

      {/* Progress Bar Container */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-64 h-1.5 bg-blue-900/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-white shadow-sm"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
