import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// The inputs should just not use bg-black or text-white
content = content.replace(/bg-black border-2 border-\[var\(--card-border\)\] p-4 font-bold text-white/g, 'bg-[var(--input-bg)] text-[var(--input-text)] border-2 border-[var(--input-border)] p-4 font-bold');

// Feature icons box
content = content.replace(/"p-4 border-2 border-black inline-block bg-black/g, '"p-4 border-2 border-black inline-block bg-[var(--bg-main)]');

// Violation screen
content = content.replace(/min-h-screen bg-black/g, 'min-h-screen bg-[var(--bg-main)]');

// Loading screen
content = content.replace(/className="bg-black border-8 border-\[var/g, 'className="bg-[var(--card-bg)] text-[var(--text-main)] border-8 border-[var');

// Reshape screen
content = content.replace(/className="bg-\[\#0A0A0A\] border-8 border-\[var\(--card-border\)\]/g, 'className="bg-[var(--bg-main)] border-8 border-[var(--card-border)]');

// The footer we just made force-white, let's make it adapt!
content = content.replace(/bg-black text-white force-white border-t-4 border-black relative z-10/g, 'bg-[var(--card-bg)] text-[var(--text-main)] border-t-4 border-[var(--card-border)] relative z-10');

// "p-2 bg-orange-500 border-2 border-black rotate-12 text-black" usually, let it be!

// Let's replace "bg-black text-white force-white" with "bg-[var(--text-main)] text-[var(--bg-main)]"
// wait, force-white means they were explicitly designed to be black. Maybe changing them to text-main is better?
content = content.replace(/bg-black text-white force-white/g, 'bg-[var(--text-main)] text-[var(--bg-main)]');

// Also remove "force-white" from the codebase since we've replaced it with adaptive colors
content = content.replace(/ force-white\b/g, '');

fs.writeFileSync('src/App.tsx', content);
console.log('Fixed more hardcoded black colors');
