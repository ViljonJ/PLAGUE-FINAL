import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClipboardEdit, X, Send, Wand2, Loader2 } from 'lucide-react';
import { getAI } from '../services/gemini';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface BlueprintAgentProps {
  currentBlueprint: string;
  onUpdateBlueprint?: (newBlueprint: string) => void;
}

export const BlueprintAgent: React.FC<BlueprintAgentProps> = ({ currentBlueprint, onUpdateBlueprint }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hi! I am your Blueprint Mentor. How can I help you understand or optimize this blueprint?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

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
        .map(m => `${m.role === 'user' ? 'User' : 'Mentor'}: ${m.text}`)
        .join('\n\n');

      const systemInstruction = `You are an expert Mentor Agent advising on a learning Blueprint.
Your current user's Blueprint is:

${currentBlueprint}

You have the ability to explain, analyze, and optimize. 
Important: If the user asks you to modify or optimize the blueprint, you MUST output a JSON response containing the "newBlueprint" instead of conversational text.
If the request is conversational, respond with text.
Output JSON schema if modifying: { "type": "modified", "newBlueprint": "the changed blueprint in markdown" }
Output JSON schema if conversational: { "type": "chat", "text": "your response" }.
ALWAYS return valid JSON matching this schema.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: chatHistory,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.7
        }
      });

      const responseText = response.text;
      const parsed = JSON.parse(responseText);

      if (parsed.type === "modified") {
         if (onUpdateBlueprint) {
            onUpdateBlueprint(parsed.newBlueprint);
            setMessages(prev => [...prev, { role: 'model', text: "I have updated the blueprint for you!" }]);
         } else {
            setMessages(prev => [...prev, { role: 'model', text: "I cannot apply modifications right now." }]);
         }
      } else {
         setMessages(prev => [...prev, { role: 'model', text: parsed.text }]);
      }
    } catch (e: any) {
       console.error(e);
       setMessages(prev => [...prev, { role: 'model', text: "Sorry, I ran into an error." }]);
    } finally {
       setIsTyping(false);
    }
  };

  const handleOptimize = async () => {
     setMessages(prev => [...prev, { role: 'model', text: "What would you like to change or add to this blueprint? Let me know your goals so I can optimize it tailored to your needs!" }]);
     setTimeout(() => {
        inputRef.current?.focus();
     }, 100);
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="group flex flex-row items-center gap-2 bg-[var(--bg-main)] text-[var(--text-main)] px-4 py-3 md:py-4 text-base md:text-lg font-black uppercase italic shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all border-4 border-[var(--text-main)]"
      >
        <ClipboardEdit size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
             initial={{ opacity: 0, y: 20, scale: 0.95 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, y: 20, scale: 0.95 }}
             className="absolute top-20 right-0 w-[350px] md:w-[450px] h-[550px] bg-[var(--bg-main)] border-4 border-[var(--text-main)] shadow-[8px_8px_0px_0px_var(--shadow-color)] flex flex-col z-[100]"
          >
             {/* Header */}
             <div className="bg-[var(--bg-main)] text-[var(--text-main)] border-b-4 border-[var(--text-main)] p-3 flex justify-between items-center">
                <div className="flex items-center gap-2 font-black italic uppercase">
                  <ClipboardEdit size={20} /> Mentor Agent
                </div>
                <button onClick={() => setIsOpen(false)} className="hover:text-red-500 transition-colors">
                  <X size={24} />
                </button>
             </div>

             {/* Chat History */}
             <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--card-bg)]">
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
             <div className="border-t-4 border-[var(--text-main)] p-3 bg-[var(--bg-main)] flex flex-col gap-2">
                <div className="flex gap-2 w-full">
                  <button 
                    onClick={handleOptimize}
                    disabled={isOptimizing || isTyping}
                    className="flex-1 flex justify-center items-center gap-2 bg-[var(--text-main)] text-[var(--bg-main)] p-2 font-bold uppercase disabled:opacity-50 hover:bg-gray-500 transition-colors"
                  >
                    <Wand2 size={16} />
                    {isOptimizing ? "Optimizing..." : "Optimize"}
                  </button>
                </div>
                <div className="flex gap-2 w-full">
                   <input
                     ref={inputRef}
                     value={input}
                     onChange={(e) => setInput(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                     placeholder="Ask for changes or explanations..."
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
    </div>
  );
};

export default BlueprintAgent;
