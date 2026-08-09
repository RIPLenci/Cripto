const fs = require('fs');

const file = 'src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'type="file"\n                    ref={fileInputRef}\n                    onChange={handleFileUpload}\n                    className="hidden"\n                    multiple',
  'type="file"\n                    ref={fileInputRef}\n                    onChange={handleFileUpload}\n                    className="hidden"\n                    multiple\n                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"'
);

code = code.replace(
  'const files = e.target.files;\n    if (!files || files.length === 0) return;',
  'const files = e.target.files;\n    if (!files || files.length === 0) return;\n    if (attachments.length + files.length > 20) { alert("Máximo 20 archivos por mensaje (hasta 5 de cada tipo recomendado)"); return; }'
);

fs.writeFileSync(file, code);
