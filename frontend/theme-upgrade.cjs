const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'styles.css');
let css = fs.readFileSync(cssPath, 'utf8');

// 1. Replace variables
const newRoot = `:root {
  color-scheme: dark;
  font-family: "Inter", var(--font-ui);
  --font-display: "Outfit", "Noto Serif SC", serif;
  --font-ui: "Inter", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  
  --paper-base: #09090b;
  --paper-panel: rgba(24, 24, 27, 0.55);
  --paper-inkwash: rgba(39, 39, 42, 0.6);
  --line-main: rgba(255, 255, 255, 0.12);
  --line-soft: rgba(255, 255, 255, 0.06);
  --ink-strong: #ffffff;
  --ink-copy: #a1a1aa;
  --ink-soft: #71717a;
  
  --seal: #60a5fa; /* Cyber Blue */
  --seal-soft: rgba(96, 165, 250, 0.15);
  --jade: #34d399; /* Emerald Neon */
  --jade-soft: rgba(52, 211, 153, 0.15);
  --gold: #c084fc; /* Neon Purple */
  
  --shadow-lg: 0 24px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
  --shadow-sm: 0 10px 24px rgba(0, 0, 0, 0.4);
  --glass-blur: blur(24px);

  --space-2xs: 0.25rem;
  --space-xs: 0.5rem;
  --space-sm: 0.75rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;
  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
  --ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);
}`;

css = css.replace(/:root\s*\{[\s\S]*?--ease-out-quint:[^\}]+\}/, newRoot);

// 2. Body background
const newBody = `body {
  margin: 0;
  min-width: 320px;
  background: 
    radial-gradient(circle at 15% 50%, rgba(96, 165, 250, 0.15), transparent 25%),
    radial-gradient(circle at 85% 30%, rgba(192, 132, 252, 0.15), transparent 25%),
    #09090b;
  color: var(--ink-strong);
  overflow-x: hidden;
}

body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  background: 
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 40px 40px;
  opacity: 0.5;
}`;

css = css.replace(/body\s*\{[\s\S]*?body::before\s*\{[\s\S]*?\}/, newBody);

// 3. Glassmorphism injection
css = css.replace(/background:\s*color-mix\(in oklab, var\(--paper-panel\)[^\)]*\);/g, 'background: var(--paper-panel); backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur);');
css = css.replace(/background:\s*color-mix\(in oklab, var\(--paper-base\)[^\)]*\);/g, 'background: var(--paper-base);');

// Enhance input-panel and result-shell
css = css.replace(/\.input-panel,\s*\.result-shell\s*\{[\s\S]*?\}/, `.input-panel,\n.result-shell {\n  position: relative;\n  min-width: 0;\n  overflow: hidden;\n  border: 1px solid var(--line-main);\n  background: var(--paper-panel);\n  backdrop-filter: var(--glass-blur);\n  -webkit-backdrop-filter: var(--glass-blur);\n  box-shadow: var(--shadow-lg);\n  border-radius: 16px;\n}`);

// Add border-radius to smaller cards
const roundedClasses = ['.example-button', '.draft-alert', '.result-banner', '.error-banner', '.tone-card', '.submit-button', '.secondary-button', '.meta-chip', '.section-frame', '.charge-card', '.ledger-note', '.jury-card', '.paper-card', '.live-analysis', '.trial-flow-item', '.live-docket-card', 'textarea', 'input', 'select', '.segmented-control', '.score-summary article'];

roundedClasses.forEach(cls => {
  const regex = new RegExp(`(${cls.replace(/\\./g, '\\.')}[\\s,{][\\s\\S]*?\\})`);
  css = css.replace(regex, (match) => {
    if (match.includes('border-radius')) return match;
    return match.replace('}', '  border-radius: 12px;\n}');
  });
});

// Update fonts for headers
css = css.replace(/font-size:\s*4\.8rem;/, 'font-size: 5.2rem; font-weight: 900; letter-spacing: -0.02em; background: linear-gradient(135deg, #fff, #a1a1aa); -webkit-background-clip: text; -webkit-text-fill-color: transparent;');

// Make textarea, input, select look glass
css = css.replace(/textarea,\s*input,\s*select\s*\{[\s\S]*?\}/, `textarea,\ninput,\nselect {\n  width: 100%;\n  max-width: 100%;\n  border: 1px solid var(--line-main);\n  background: rgba(0,0,0,0.2);\n  color: var(--ink-strong);\n  outline: none;\n  border-radius: 12px;\n  transition: border-color 180ms var(--ease-out-quart), box-shadow 180ms var(--ease-out-quart), background 180ms var(--ease-out-quart);\n}`);

// Segmented control fix
css = css.replace(/\.segmented-control\s*\{/, '.segmented-control {\n  border-radius: 12px;\n  overflow: hidden;');

// Submit button glow
css = css.replace(/\.submit-button\s*\{[\s\S]*?\}/, `.submit-button {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  gap: 0.7rem;\n  min-height: 52px;\n  border: 0;\n  background: linear-gradient(135deg, var(--seal), #8b5cf6);\n  color: #fff;\n  font-family: var(--font-ui);\n  font-size: 1.05rem;\n  font-weight: 800;\n  letter-spacing: 0.04em;\n  border-radius: 12px;\n  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);\n  transition: transform 180ms var(--ease-out-quart), box-shadow 180ms var(--ease-out-quart), filter 180ms;\n}`);
css = css.replace(/\.submit-button:hover:not\(:disabled\)\s*\{[\s\S]*?\}/, `.submit-button:hover:not(:disabled) {\n  filter: brightness(1.1);\n  box-shadow: 0 6px 24px rgba(59, 130, 246, 0.6);\n}`);

fs.writeFileSync(cssPath, css, 'utf8');
console.log('CSS upgraded successfully');
