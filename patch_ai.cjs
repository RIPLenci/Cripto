const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const enhancer = `
function enhancePromptWithIdentityAndLang(prompt, systemPrompt) {
  let lang = "el idioma original del usuario";
  const t = prompt.toLowerCase();
  const es = (t.match(/\\b(el|la|de|que|y|en|un|ser|se|no|es|por)\\b/g) || []).length;
  const en = (t.match(/\\b(the|be|to|of|and|a|in|that|have|i|is|for)\\b/g) || []).length;
  const pt = (t.match(/\\b(o|a|de|que|e|do|da|em|um|para|na|no)\\b/g) || []).length;
  if(es > en && es > pt) lang = "Español";
  else if(en > es && en > pt) lang = "English";
  else if(pt > es && pt > en) lang = "Português";

  const identity = "IMPORTANTE: Nunca menciones a Gemini, Google, OpenAI, Llama, Meta o NVIDIA. Eres ÚNICAMENTE 'Aether AI', la inteligencia artificial de Aether Security. Debes responder obligatoriamente en " + lang + ".";
  
  return systemPrompt ? \`\${identity}\\n\\n\${systemPrompt}\` : identity;
}
`;

if(!code.includes('enhancePromptWithIdentityAndLang')) {
  code = code.replace('let geminiRateLimitedUntil = 0;', enhancer + '\nlet geminiRateLimitedUntil = 0;');
}

code = code.replace('async function queryMultiModelText(prompt: string, systemPrompt?: string, jsonMode: boolean = false) {', 'async function queryMultiModelText(prompt: string, systemPrompt?: string, jsonMode: boolean = false) {\n  systemPrompt = enhancePromptWithIdentityAndLang(prompt, systemPrompt);');

code = code.replace('async function queryMultiModelMultimodal(\n  prompt: string,\n  mediaItems: Array<{ data: string; mimeType: string }> = [],\n  systemPrompt?: string\n) {', 'async function queryMultiModelMultimodal(\n  prompt: string,\n  mediaItems: Array<{ data: string; mimeType: string }> = [],\n  systemPrompt?: string\n) {\n  systemPrompt = enhancePromptWithIdentityAndLang(prompt, systemPrompt);');

fs.writeFileSync('server.ts', code);
