import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, X, Send, Loader2, Book } from 'lucide-react';
import { getAI } from '../services/gemini';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface StudyAssistantAgentProps {
  moduleTitle: string;
  moduleContent: string;
}

export const StudyAssistantAgent: React.FC<StudyAssistantAgentProps> = ({ moduleTitle, moduleContent }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hi! I am your Study Assistant. I can help you understand these notes, solve questions, clear doubts, or suggest mini-projects. What do you need help with?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
     if (isOpen) {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
     }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      const ai = getAI();
      
      const chatHistory = [...messages.slice(1), { role: 'user', text: userMessage }]
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
        .join('\n\n');

      const systemInstruction = `You are an expert Study Assistant Agent embedded inside a learning platform.
Your user is currently studying the module titled: "${moduleTitle}"
The content of this module is:
${moduleContent}

Your goal is to help them understand this material, solve related questions, give feedback, explain concepts, and suggest actionable mini-projects or implementation steps.
Respond in markdown format. Be directly helpful and educational.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: chatHistory,
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });

      const responseText = response.text || "Sorry, I couldn't generate a response.";
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (e: any) {
       console.error(e);
       setMessages(prev => [...prev, { role: 'model', text: "Sorry, I ran into an error." }]);
    } finally {
       setIsTyping(false);
    }
  };

  const portalContent = (
    <motion.div 
      drag 
      dragMomentum={false}
      className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2"
      style={{ touchAction: "none" }}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
             initial={{ opacity: 0, y: 20, scale: 0.95 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, y: 20, scale: 0.95 }}
             className="w-[320px] md:w-[450px] h-[500px] bg-[var(--bg-main)] border-4 border-[var(--text-main)] shadow-[8px_8px_0px_0px_var(--shadow-color)] flex flex-col cursor-default"
          >
             {/* Header */}
             <div className="cursor-grab active:cursor-grabbing bg-[var(--bg-main)] text-[var(--text-main)] border-b-4 border-[var(--text-main)] p-3 flex justify-between items-center">
                <div className="flex items-center gap-2 font-black italic uppercase">
                  <Book size={20} /> Study Assistant
                </div>
                <button onClick={() => setIsOpen(false)} className="hover:text-red-500 transition-colors pointer-events-auto">
                  <X size={24} />
                </button>
             </div>

             {/* Chat History */}
             <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--card-bg)] pointer-events-auto">
               {messages.map((msg, i) => (
                 <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[90%] p-3 border-2 border-[var(--text-main)] ${msg.role === 'user' ? 'bg-orange-500 text-black' : 'bg-[var(--bg-main)] text-[var(--text-main)]'}`}>
                     <div className="prose prose-sm prose-p:my-1 prose-headings:my-2 prose-a:text-blue-500 prose-strong:text-current">
                       <Markdown remarkPlugins={[remarkGfm]}>
                         {msg.text}
                       </Markdown>
                     </div>
                   </div>
                 </div>
               ))}
               {isTyping && (
                 <div className="flex justify-start">
                   <div className="max-w-[80%] p-3 border-2 border-[var(--text-main)] bg-[var(--bg-main)] text-[var(--text-main)] flex items-center gap-2">
                     <Loader2 size={16} className="animate-spin" /> Thinking...
                   </div>
                 </div>
               )}
               <div ref={endOfMessagesRef} />
             </div>

             {/* Input Area */}
             <div className="border-t-4 border-[var(--text-main)] p-3 bg-[var(--bg-main)] flex flex-col gap-2 pointer-events-auto">
                <div className="flex gap-2 w-full">
                   <input
                     ref={inputRef}
                     value={input}
                     onChange={(e) => setInput(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                     placeholder="Ask for help or mini-projects..."
                     className="flex-1 border-2 border-[var(--text-main)] bg-[var(--input-bg)] text-[var(--input-text)] p-2 outline-none focus:ring-2 focus:ring-orange-500"
                   />
                   <button 
                     onClick={handleSend}
                     disabled={!input.trim() || isTyping}
                     className="bg-[var(--bg-main)] text-[var(--text-main)] border-2 border-[var(--text-main)] p-2 hover:bg-orange-500 disabled:opacity-50 transition-colors shrink-0"
                   >
                     <Send size={20} />
                   </button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button 
        onClick={() => setIsOpen(!isOpen)}
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        className="group flex flex-row items-center gap-2 bg-[var(--bg-main)] text-[var(--text-main)] p-3 md:p-4 text-base md:text-lg font-black uppercase italic transition-all border-4 border-[var(--text-main)] rounded-full pointer-events-auto self-end"
      >
        <BookOpen size={24} />
      </motion.button>
    </motion.div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(portalContent, document.body);
  }
  
  return null;
};

export default StudyAssistantAgent;
