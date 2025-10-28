import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const Login = () => {
  const navigate = useNavigate();

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/dashboard');
    } catch (error) {
      console.error("Error during Google sign-in:", error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="text-center p-10 max-w-md mx-auto">
        <header className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">
            Welcome to Agnostic-ALE
          </h1>
          <p className="text-gray-400 text-lg">
            Your personalized AI-powered learning experience.
          </p>
        </header>
        <main>
          <button
            onClick={signInWithGoogle}
            className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105"
          >
            Sign in with Google
          </button>
        </main>
        <footer className="mt-12 text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Agnostic-ALE. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default Login;