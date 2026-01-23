import React from "react";
import { motion } from "framer-motion";
import { Coins, TrendingUp } from "lucide-react";

export default function PointsDisplay({ points, recentGain = 0, size = "medium" }) {
  const sizes = {
    small: { container: "p-3", icon: "w-6 h-6", text: "text-xl", label: "text-xs" },
    medium: { container: "p-4", icon: "w-8 h-8", text: "text-3xl", label: "text-sm" },
    large: { container: "p-6", icon: "w-10 h-10", text: "text-4xl", label: "text-base" }
  };

  const currentSize = sizes[size] || sizes.medium;

  return (
    <div className={`funky-card bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 ${currentSize.container} relative overflow-hidden`}>
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}></div>
      </div>

      <div className="relative flex items-center gap-3">
        <motion.div
          animate={{
            rotate: recentGain > 0 ? [0, 10, -10, 0] : 0
          }}
          transition={{ duration: 0.5 }}
        >
          <Coins className={`${currentSize.icon} text-white`} />
        </motion.div>
        
        <div className="flex-1">
          <motion.div
            key={points}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`header-font ${currentSize.text} text-white leading-none`}
          >
            {points.toLocaleString()}
          </motion.div>
          <div className={`body-font-light ${currentSize.label} text-white/90 mt-1`}>
            Total Points
          </div>
        </div>

        {recentGain > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="funky-button bg-white/20 text-white px-2 py-1 flex items-center gap-1"
          >
            <TrendingUp className="w-3 h-3" />
            <span className="body-font text-xs">+{recentGain}</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}