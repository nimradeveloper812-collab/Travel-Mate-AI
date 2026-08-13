import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CustomCursor() {
  const [cursorType, setCursorType] = useState<'default' | 'pointer' | 'click'>('default');
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 250 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    // Check if device is touch-enabled
    const checkDevice = () => {
      const mobile = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
      setIsMobile(mobile);
    };

    checkDevice();
    if (isMobile) return;

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 16);
      cursorY.set(e.clientY - 16);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.closest('a') ||
        target.closest('button') ||
        target.classList.contains('interactive') ||
        target.closest('.interactive')
      ) {
        setCursorType('pointer');
      } else {
        setCursorType('default');
      }
    };

    const handleMouseDown = () => {
      setCursorType('click');
    };

    const handleMouseUp = () => {
      setCursorType('pointer');
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [cursorX, cursorY, isVisible, isMobile]);

  if (isMobile || !isVisible) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 rounded-full border-2 border-blue-500 pointer-events-none z-50 flex items-center justify-center"
      style={{
        x: cursorXSpring,
        y: cursorYSpring,
      }}
      animate={{
        scale: cursorType === 'pointer' ? 1.5 : cursorType === 'click' ? 0.8 : 1,
        backgroundColor: cursorType === 'pointer' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0)',
        borderColor: cursorType === 'click' ? '#1d4ed8' : '#3b82f6',
      }}
      transition={{ type: 'spring', damping: 15, stiffness: 200 }}
    />
  );
}
