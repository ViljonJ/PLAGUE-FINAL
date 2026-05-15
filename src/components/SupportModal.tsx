import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Send } from "lucide-react";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export const SupportModal = ({ isOpen, onClose, userEmail }: SupportModalProps) => {
  const [email, setEmail] = useState(userEmail || "");
  const [message, setMessage] = useState("");

  const [isSending, setIsSending] = useState(false);
  const [sentMessage, setSentMessage] = useState("");

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;

    setIsSending(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message, name: "Student" }),
      });
      
      if (response.ok) {
        setSentMessage("Message sent successfully!");
        setMessage("");
        setTimeout(() => {
          setSentMessage("");
          onClose();
        }, 2000);
      } else {
        alert("Failed to send message. Please try again.");
      }
    } catch (err) {
      alert("Network error while sending message.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
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
            className="relative w-full max-w-lg bg-[var(--card-bg)] border-4 border-black shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] p-6 md:p-8"
          >
            <button
              onClick={onClose}
              className="absolute -top-4 -right-4 p-2 bg-red-500 border-2 border-black text-black hover:scale-110 transition-transform"
            >
              <X size={20} className="font-bold" />
            </button>

            <h2 className="text-3xl font-black uppercase italic mb-6 text-center text-[var(--text-main)] border-b-4 border-black pb-4">
              Customer Support
            </h2>

            <form onSubmit={handleSend} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">
                  EMAIL ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={16} className="text-[var(--text-secondary)]" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-[var(--input-bg)] text-[var(--input-text)] border-2 border-[var(--card-border)] pl-10 pr-4 py-3 font-bold focus:border-orange-500 outline-none transition-colors"
                    placeholder="student@plague.edu"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">
                  MESSAGE
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={5}
                  className="w-full bg-[var(--input-bg)] text-[var(--input-text)] border-2 border-[var(--card-border)] p-4 font-bold focus:border-orange-500 outline-none transition-colors resize-none"
                  placeholder="Describe your issue or request..."
                />
              </div>

              {sentMessage && (
                <div className="p-3 bg-green-500/20 border-2 border-green-500 text-green-500 text-sm font-bold text-center">
                  {sentMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSending}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 text-black py-4 border-2 border-black font-black uppercase italic hover:bg-orange-400 transition-colors disabled:opacity-50"
              >
                <Send size={20} />
                {isSending ? "SENDING..." : "SEND"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
