import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Remove all standalone 'dark ' and ' dark' from className strings, but NOT dark: prefixed ones.
content = content.replace(/ className="([^"]*)"/g, (match, classes) => {
    let cleanClasses = classes.split(/\s+/).filter(c => c !== 'dark').join(' ');
    return ` className="${cleanClasses}"`;
});

// also replace in cn()
let cnRegex = /cn\(([\s\S]*?)\)/g;
content = content.replace(cnRegex, (match, args) => {
    let newArgs = args.replace(/"([^"]*)"/g, (m, classNames) => {
        let classes = classNames.split(/\s+/).filter(c => c !== 'dark');
        return `"${classes.join(' ')}"`;
    });
    return `cn(${newArgs})`;
});

// 2. Fix the hardcoded backgrounds that prevent light mode from showing up
// The root container
content = content.replace(
    'className="font-sans bg-[#050505] text-white min-h-screen relative overflow-x-hidden"',
    'className="font-sans bg-[var(--bg-main)] text-[var(--text-main)] min-h-screen relative overflow-x-hidden"'
);

// Fallback if it had text-[var(--text-main)]
content = content.replace(
    'className="font-sans bg-[#050505] text-[var(--text-main)] min-h-screen relative overflow-x-hidden"',
    'className="font-sans bg-[var(--bg-main)] text-[var(--text-main)] min-h-screen relative overflow-x-hidden"'
);

// Any other bg-[#050505] to bg-[var(--bg-main)]
content = content.replace(/bg-\[\#050505\]/g, 'bg-[var(--bg-main)]');

// Dashboard text/tab bg merge fix
// Navigation tabs:
content = content.replace(
    /"hover:bg-black\/10 dark:hover:bg-white\/10 text-\[var\(--text-secondary\)\]"/g,
    '"hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-main)]"'
);

fs.writeFileSync('src/App.tsx', content);
console.log("Fixed theme classes.");
