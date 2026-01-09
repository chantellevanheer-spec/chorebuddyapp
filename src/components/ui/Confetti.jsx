import React from 'react';
import { motion } from 'framer-motion';

const ConfettiPiece = ({ x, y, rotation, color }) => {
  return (
    <motion.div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: 10,
        height: 10,
        borderRadius: '50%',
        backgroundColor: color,
        x,
        y,
        rotate: rotation,
      }}
      animate={{
        y: y + 200,
        opacity: 0,
      }}
      transition={{
        duration: 1 + Math.random(),
        ease: 'easeInOut',
      }}
    />
  );
};

export default function Confetti({ count = 100 }) {
  const colors = ['#a855f7', '#84cc16', '#22d3ee', '#f97316', '#ec4899'];
  const pieces = Array.from({ length: count }).map((_, i) => {
    const x = (Math.random() - 0.5) * 400;
    const y = (Math.random() - 0.5) * 400;
    const rotation = Math.random() * 360;
    const color = colors[i % colors.length];
    return <ConfettiPiece key={i} x={x} y={y} rotation={rotation} color={color} />;
  });

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', zIndex: 50, pointerEvents: 'none' }}>
      {pieces}
    </div>
  );
}