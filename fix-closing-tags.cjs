const fs = require('fs');
const file = 'src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  '                            ))}\n\n                {peerTyping && (',
  '                            ))}\n                          </div>\n                        )}\n                      </div>\n                    </div>\n                  </div>\n                ))}\n\n                {peerTyping && ('
);

fs.writeFileSync(file, code);
