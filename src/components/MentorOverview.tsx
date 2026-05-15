import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Bot, Target, RefreshCw } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import BlueprintAgent from './BlueprintAgent';

interface MentorOverviewProps {
  overview: string;
  onContinue: () => void;
  onRegenerate?: () => void;
  onUpdateBlueprint?: (newOverview: string) => void;
  isRegenerating?: boolean;
}

export const MentorOverview: React.FC<MentorOverviewProps> = ({ overview, onContinue, onRegenerate, onUpdateBlueprint, isRegenerating }) => {
  return (
    <div className="min-h-[100dvh] bg-[var(--bg-main)] text-[var(--text-main)] font-sans relative overflow-hidden">
      
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-orange-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-yellow-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-24 space-y-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b-4 border-[var(--text-main)] pb-8">
          <div className="flex items-start gap-6">
            <div className="shrink-0 pt-2">
              <Bot size={48} className="text-orange-500" />
            </div>
            <div>
              <span className="font-mono text-sm font-black uppercase tracking-[0.4em] text-orange-500 block mb-2">Mentor Analysis Complete</span>
              <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">Your Pathway Blueprint</h1>
            </div>
          </div>
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="flex items-center gap-2 border-4 border-black px-4 py-2 font-black uppercase italic text-sm hover:bg-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
            >
              <RefreshCw size={16} className={isRegenerating ? "animate-spin" : ""} />
              {isRegenerating ? "Updating..." : "Update"}
            </button>
          )}
        </div>

        {/* Markdown Content */}
        <div className="bg-[var(--card-bg)] border-4 border-[var(--card-border)] shadow-[12px_12px_0px_0px_rgba(249,115,22,1)] p-8 md:p-12">
          <div className="markdown-body prose prose-lg md:prose-xl max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:italic prose-a:text-orange-500 prose-a:font-bold hover:prose-a:text-[var(--text-main)] prose-strong:text-[var(--text-main)] prose-headings:text-[var(--text-main)] text-[var(--text-main)]">
            <Markdown remarkPlugins={[remarkGfm]}>
              {overview}
            </Markdown>
          </div>
        </div>

        {/* Action Bar */}
        <div className="fixed top-6 right-6 z-50 flex flex-row items-center gap-4">
          <BlueprintAgent currentBlueprint={overview} onUpdateBlueprint={onUpdateBlueprint} />
          <button 
            onClick={onContinue}
            className="group flex items-center justify-between bg-black text-white px-4 py-3 md:px-6 md:py-4 text-base md:text-lg font-black uppercase italic shadow-[6px_6px_0px_0px_rgba(249,115,22,1)] hover:bg-orange-500 hover:text-black transition-colors border-4 border-black"
          >
            <span>Dashboard</span>
            <ArrowRight size={24} className="ml-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MentorOverview;
