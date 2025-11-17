// tests-frontend/src/utils.js
const fs = require('fs');

/**
 * Read a .cshtml and extract inline <script> inner contents (synchronous).
 * Returns array of script bodies.
 */
function extractInlineScriptsFromCshtml(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');   // <-- correct function
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  const scripts = [];
  let match;
  while ((match = scriptRegex.exec(raw)) !== null) {
    scripts.push(match[1]);
  }
  return scripts;
}

/**
 * Sanitize common Razor tokens so eval(...) won't fail in tests.
 */
function sanitizeRazorMarkers(scriptText) {
  let s = scriptText.replace(/@Url\.Action\([^)]*\)/g, '"/__UrlActionPlaceholder__"');
  s = s.replace(/(?<!@)@([A-Za-z0-9_\.]+)/g, '"__RAZOR__"');
  s = s.replace(/@@/g, '@');
  return s;
}

module.exports = {
  extractInlineScriptsFromCshtml,
  sanitizeRazorMarkers
};
