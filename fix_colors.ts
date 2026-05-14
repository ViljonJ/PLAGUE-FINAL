import fs from 'fs';

let appTsx = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace standard Plague container classes with theme variables
appTsx = appTsx.replace(/bg-black\/40\s+backdrop-blur-md\s+border-4\s+border-white\/10(?:(?!\s+text-white)\s)/g, 'bg-[var(--card-bg)] backdrop-blur-md border-4 border-[var(--card-border)] ');
appTsx = appTsx.replace(/bg-black\/60\s+backdrop-blur-md\s+border-4\s+border-white\/20(?:(?!\s+text-white)\s)/g, 'bg-[var(--card-bg)] backdrop-blur-md border-4 border-[var(--card-border)] ');
appTsx = appTsx.replace(/bg-black\/60\s+backdrop-blur-md\s+border-8\s+border-white\/20(?:(?!\s+text-white)\s)/g, 'bg-[var(--card-bg)] backdrop-blur-md border-8 border-[var(--card-border)] ');

// Footers
appTsx = appTsx.replace(/bg-black\/60\s+backdrop-blur-md\s+border-t-8\s+border-white\/10/g, 'bg-[var(--card-bg)] backdrop-blur-md border-t-8 border-[var(--card-border)]');

// General remaining bg-black/40 that don't have text-white
appTsx = appTsx.replace(/bg-black\/40(?!.*text-white)/g, 'bg-[var(--card-bg)]');
appTsx = appTsx.replace(/bg-black\/60(?!.*text-white)/g, 'bg-[var(--card-bg)]');

// Force pure bg-black to text-white if not already
// Not doing this to avoid messing up borders

appTsx = appTsx.replace(/border-white\/10/g, 'border-[var(--card-border)]');
appTsx = appTsx.replace(/border-white\/20/g, 'border-[var(--card-border)]');

// Also shadows to match variables
appTsx = appTsx.replace(/shadow-\[20px_20px_0px_0px_rgba\(255,255,255,1\)\]/g, 'shadow-[20px_20px_0px_0px_var(--shadow-color)]');
appTsx = appTsx.replace(/shadow-\[12px_12px_0px_0px_rgba\(255,255,255,1\)\]/g, 'shadow-[12px_12px_0px_0px_var(--shadow-color)]');
appTsx = appTsx.replace(/shadow-\[8px_8px_0px_0px_rgba\(255,255,255,1\)\]/g, 'shadow-[8px_8px_0px_0px_var(--shadow-color)]');
appTsx = appTsx.replace(/shadow-\[12px_12px_0px_0px_rgba\(255,255,255,0.1\)\]/g, 'shadow-[12px_12px_0px_0px_var(--shadow-secondary)]');
appTsx = appTsx.replace(/shadow-\[8px_8px_0px_0px_rgba\(255,255,255,0.1\)\]/g, 'shadow-[8px_8px_0px_0px_var(--shadow-secondary)]');

fs.writeFileSync('src/App.tsx', appTsx);
console.log("Replaced colors.");
