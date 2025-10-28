import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { checkAndResetCredits } from '../services/credits';

const Login = () => {
  const navigate = useNavigate();

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await checkAndResetCredits(result.user.uid);
      navigate('/dashboard');
    } catch (error) {
      console.error("Error during Google sign-in:", error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
      <div className="text-center p-10 max-w-lg mx-auto bg-card text-card-foreground rounded-2xl shadow-2xl">
        <header className="mb-8">
          <h1 className="text-5xl font-bold mb-2">
            Alea
          </h1>
          <p className="text-lg text-muted-foreground">
            Your personalized AI-powered learning experience.
          </p>
        </header>
        <main>
          <Button onClick={signInWithGoogle} className="w-full">
            Sign in with Google
          </Button>
        </main>
        <footer className="mt-12 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Alea. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default Login;