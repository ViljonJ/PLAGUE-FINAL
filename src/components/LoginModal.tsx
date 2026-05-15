import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, LogIn, UserPlus } from "lucide-react";
import { auth, googleProvider } from "../firebase";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { cn } from "../lib/utils";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getErrorMessage = (error: any, isLoginMode: boolean) => {
    switch (error.code) {
      case "auth/email-already-in-use":
        return "Email already exists! If you originally signed up with Google, please continue with Google. Otherwise, switch to login.";
      case "auth/invalid-email":
        return "That email doesn't look right. Please check for typos and try again.";
      case "auth/user-not-found":
        return "We couldn't find an account with that email. Please check the spelling or register a new one.";
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Looks like the email or password is incorrect. If you used Google to sign up, please use the Google button below.";
      case "auth/weak-password":
        return "That password is too weak. Please use at least 6 characters to keep your account secure.";
      case "auth/operation-not-allowed":
        return "This sign-in method is currently disabled. Please use Google sign-in instead.";
      case "auth/popup-closed-by-user":
        return "The login window was closed before finishing. Please try again.";
      case "auth/network-request-failed":
        return "Network error. Please check your internet connection and try again.";
      case "auth/too-many-requests":
        return "Too many failed attempts. Please take a break and try again later.";
      default:
        return (
          error.message ||
          `Failed to ${isLoginMode ? "login" : "register"}. Please try again.`
        );
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (e: any) {
      setError(getErrorMessage(e, isLogin));
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
      setError(
        "Please fill in all required fields to perfectly configure your node!",
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        await updateProfile(userCredential.user, { displayName: name });
      }
      onClose();
    } catch (e: any) {
      if (
        e.code === "auth/email-already-in-use" ||
        e.code === "auth/wrong-password" ||
        e.code === "auth/invalid-credential"
      ) {
        try {
          const methods = await fetchSignInMethodsForEmail(auth, email);
          console.log("SignIn methods:", methods);
          if (methods.includes("google.com")) {
            setError(
              "This account was created using Google Sign-In. Please continue with Google.",
            );
            setIsLoading(false);
            return;
          }
        } catch (fetchError: any) {
          console.error("fetchSignInMethodsForEmail error:", fetchError);
          // If email enumeration protection is on, we might not get the methods.
          // Let's provide a helpful hint if it's a Gmail address.
          if (email.endsWith("@gmail.com")) {
            setError(
              "This account was created using Google Sign-In. Please continue with Google.",
            );
            setIsLoading(false);
            return;
          }
          // Otherwise fall back to default error message
        }
      }
      setError(getErrorMessage(e, isLogin));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-[var(--card-bg)] border-4 border-black shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] p-6 md:p-8"
          >
            <button
              onClick={onClose}
              className="absolute -top-4 -right-4 p-2 bg-red-500 border-2 border-black text-black hover:scale-110 transition-transform"
            >
              <X size={20} className="font-bold" />
            </button>

            <h2 className="text-3xl font-black uppercase italic mb-6 text-center text-[var(--text-main)]">
              {isLogin ? "LOGIN" : "REGISTER"}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border-2 border-red-500 text-red-500 text-sm font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">
                    NAME
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserPlus
                        size={16}
                        className="text-[var(--text-secondary)]"
                      />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[var(--input-bg)] text-[var(--input-text)] border-2 border-[var(--card-border)] pl-10 pr-4 py-3 font-bold focus:border-orange-500 outline-none transition-colors"
                      placeholder="User name"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">
                  EMAIL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={16} className="text-[var(--text-secondary)]" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[var(--input-bg)] text-[var(--input-text)] border-2 border-[var(--card-border)] pl-10 pr-4 py-3 font-bold focus:border-orange-500 outline-none transition-colors"
                    placeholder="student@plague.edu"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">
                  PASSWORD
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={16} className="text-[var(--text-secondary)]" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[var(--input-bg)] text-[var(--input-text)] border-2 border-[var(--card-border)] pl-10 pr-4 py-3 font-bold focus:border-orange-500 outline-none transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 text-black py-4 border-2 border-black font-black uppercase italic hover:bg-orange-400 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  "Processing..."
                ) : (
                  <>
                    {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                    {isLogin ? "LOGIN" : "REGISTER"}
                  </>
                )}
              </button>
            </form>

            <div className="my-6 flex items-center">
              <div className="flex-1 h-px bg-[var(--card-border)]"></div>
              <span className="px-4 text-xs font-black uppercase text-[var(--text-secondary)]">
                OR
              </span>
              <div className="flex-1 h-px bg-[var(--card-border)]"></div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              type="button"
              className="w-full flex items-center justify-center gap-3 bg-[var(--bg-main)] text-[var(--text-main)] py-3 border-2 border-[var(--card-border)] hover:border-orange-500 font-bold transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in using Google
            </button>

            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="w-full mt-4 text-sm font-bold text-[var(--text-secondary)] hover:text-orange-500 underline decoration-dashed underline-offset-4"
            >
              {isLogin
                ? "Not registered? Register here."
                : "Already registered? Login."}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
