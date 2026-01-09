import React, { useState, useEffect } from 'react';
import { User } from '@/entities/all';
import { Button } from '@/components/ui/button';
import { Loader2, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { joinFamily } from '@/functions/joinFamily';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function JoinFamily() {
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [user, setUser] = useState(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [familyName, setFamilyName] = useState('');

  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const inviteCode = urlParams.get('code');
  const email = urlParams.get('email');
  const name = urlParams.get('name');
  const role = urlParams.get('role');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
        
        // Check if email matches
        if (userData.email !== email) {
          setError('Please log in with the invited email address: ' + email);
        }
      } catch (error) {
        // User not logged in, redirect to login
        const loginUrl = `${createPageUrl('Home')}?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        window.location.href = loginUrl;
        return;
      } finally {
        setLoading(false);
      }
    };

    if (!inviteCode || !email || !name) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    checkAuth();
  }, [inviteCode, email, name]);

  const handleJoinFamily = async () => {
    setJoining(true);
    setError('');

    try {
      const { data, error: joinError } = await joinFamily({
        inviteCode,
        email,
        name,
        role
      });

      if (joinError) {
        setError(joinError);
      } else {
        setSuccess(true);
        setFamilyName(data.familyName);
      }
    } catch (error) {
      setError('Failed to join family. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF5] flex items-center justify-center">
        <div className="funky-card p-8 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#C3B1E1] mx-auto mb-4" />
          <p className="body-font text-lg text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#FDFBF5] flex items-center justify-center p-4">
        <div className="funky-card max-w-md w-full p-8 text-center border-4 border-green-400 bg-green-50">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="header-font text-3xl text-[#2B59C3] mb-4">Welcome to the Family!</h1>
          <p className="body-font-light text-gray-600 mb-6">
            You've successfully joined {familyName}. You can now view your chores, earn points, and redeem rewards!
          </p>
          <Link to={createPageUrl('Dashboard')}>
            <Button className="funky-button bg-[#FF6B35] text-white px-6 py-3 header-font text-lg w-full">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FDFBF5] flex items-center justify-center p-4">
        <div className="funky-card max-w-md w-full p-8 text-center border-4 border-red-400 bg-red-50">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="header-font text-3xl text-[#2B59C3] mb-4">Invitation Error</h1>
          <p className="body-font-light text-gray-600 mb-6">{error}</p>
          <Link to={createPageUrl('Home')}>
            <Button className="funky-button bg-gray-400 text-white px-6 py-3 header-font text-lg w-full">
              Go to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF5] flex items-center justify-center p-4">
      <div className="funky-card max-w-md w-full p-8 text-center border-4 border-[#C3B1E1] bg-purple-50">
        <Users className="w-16 h-16 text-[#C3B1E1] mx-auto mb-4" />
        <h1 className="header-font text-3xl text-[#2B59C3] mb-4">Join Your Family</h1>
        <p className="body-font-light text-gray-600 mb-2">You've been invited to join as:</p>
        <p className="body-font text-xl text-[#FF6B35] mb-6">{name}</p>
        <p className="body-font-light text-sm text-gray-500 mb-8">
          Logged in as: {user?.email}
        </p>
        <Button
          onClick={handleJoinFamily}
          disabled={joining || user?.email !== email}
          className="funky-button bg-[#FF6B35] text-white px-6 py-3 header-font text-lg w-full"
        >
          {joining ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Joining...
            </>
          ) : (
            'Join Family'
          )}
        </Button>
      </div>
    </div>
  );
}