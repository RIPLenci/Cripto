const fs = require('fs');

const file = 'src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

const replacement = `
                            {m.attachments.map((att, idx) => (
                              <div key={idx} className="rounded-xl overflow-hidden bg-black/30 p-2">
                                {att.type.startsWith('image/') ? (
                                  <img
                                    src={att.data}
                                    alt={att.name}
                                    onClick={() => setLightboxImage(att.data)}
                                    className="max-h-36 sm:max-h-48 rounded-lg cursor-pointer hover:opacity-90 transition-opacity object-cover w-full"
                                  />
                                ) : att.type.startsWith('video/') ? (
                                  <video src={att.data} controls className="max-h-48 w-full rounded-lg" />
                                ) : att.type.startsWith('audio/') ? (
                                  <audio src={att.data} controls className="w-full" />
                                ) : (
                                  <a
                                    href={att.data}
                                    download={att.name}
                                    className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 underline break-all"
                                  >
                                    <Download className="w-4 h-4 shrink-0" /> {att.name}
                                  </a>
                                )}
                              </div>
                            ))}
`;

code = code.replace(
  /\{m\.attachments\.map\(\(att, idx\) => \([\s\S]*?\}\)\}/,
  replacement.trim()
);

fs.writeFileSync(file, code);

