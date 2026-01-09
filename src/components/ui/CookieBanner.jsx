import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { X, Cookie } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already acknowledged the cookie banner
    const hasAcknowledged = localStorage.getItem('cookieAcknowledged');
    if (!hasAcknowledged) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieAcknowledged', 'true');
    setIsVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('cookieAcknowledged', 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4"
        >
          <div className="funky-card bg-white border-4 border-[#5E3B85] p-6 mx-auto max-w-4xl">
            <div className="flex items-start gap-4">
              <div className="funky-button w-12 h-12 bg-[#C3B1E1] flex items-center justify-center flex-shrink-0">
                <Cookie className="w-6 h-6 text-white" />
              </div>
              
              <div className="flex-1">
                <h3 className="header-font text-lg text-[#2B59C3] mb-2">Cookie Notice</h3>
                <p className="body-font-light text-gray-700 text-sm md:text-base">
                  By using this site, you agree to our cookie policy. We use essential cookies to keep you logged in and ensure the app works properly.{' '}
                  <Link 
                    to={createPageUrl("Privacy")} 
                    className="text-[#2B59C3] hover:underline body-font"
                  >
                    Learn more in our Privacy Policy
                  </Link>
                  .
                </p>
              </div>
              
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  onClick={handleAccept}
                  className="funky-button bg-[#2B59C3] hover:bg-[#24479c] text-white body-font text-sm px-4 py-2"
                >
                  Got it
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  size="icon"
                  className="hover:bg-gray-100 p-2"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}