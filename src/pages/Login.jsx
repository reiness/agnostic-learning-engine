import React from 'react';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const Login = () => {
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // The signed-in user info.
      const user = result.user;
      console.log("User signed in successfully");    } catch (error) {
      // Handle Errors here.
      console.error("Error during Google sign-in:", error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-screen bg-gray-900">
      <button
        onClick={signInWithGoogle}
        className="px-6 py-3 bg-white text-gray-900 font-bold rounded-lg shadow-md hover:bg-gray-200 transition duration-300"
      >
        Sign in with Google
      </button>
    </div>
  );
};

export default Login;