import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';

export const LoginView: React.FC = () => {
  const { loginWithGoogle, loginWithEmail, loginAsDemo, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Handle official Google OAuth trigger
  let googleOAuthTrigger: (() => void) | null = null;
  try {
    googleOAuthTrigger = useGoogleLogin({
      onSuccess: async (tokenResponse) => {
        await loginWithGoogle(tokenResponse);
      },
      onError: (error) => {
        console.warn('Google OAuth login error, falling back to demo', error);
        loginAsDemo();
      },
    });
  } catch {
    // If not wrapped in GoogleOAuthProvider or client id missing
    googleOAuthTrigger = null;
  }

  const handleGoogleClick = () => {
    if (googleOAuthTrigger) {
      try {
        googleOAuthTrigger();
      } catch {
        loginAsDemo();
      }
    } else {
      loginAsDemo();
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    await loginWithEmail(email);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col justify-center items-center px-4">
      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white border border-gray-200/80 rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
          Login
        </h1>

        {/* Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleClick}
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-[#E8F8F0] hover:bg-[#DCF4E7] border border-[#BDEBD3] text-[#008A4D] rounded-lg font-medium text-sm flex items-center justify-center gap-3 transition-colors cursor-pointer"
        >
          {/* Official Google G SVG */}
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Login with Google</span>
        </button>

        {/* Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <span className="relative px-3 bg-white text-xs text-gray-400">
            or sign up through email
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email ID"
              className="w-full px-4 py-3 bg-[#F4F6F5] border-0 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#00A35C] transition-all"
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 bg-[#F4F6F5] border-0 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#00A35C] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 py-3 bg-[#00A35C] hover:bg-[#008F50] text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer active:scale-[0.99]"
          >
            {isLoading ? 'Signing in...' : 'Login'}
          </button>
        </form>

      </div>
    </div>
  );
};
