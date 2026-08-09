const fs = require('fs');
const file = 'src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  '                        )}\n                      </div>\n                    </div>\n                  </div>\n                ))}\n\n                {peerTyping && (',
  '                        )}\n                      </div>\n                    </div>\n                  );\n                })}\n\n                {peerTyping && ('
);

fs.writeFileSync(file, code);
