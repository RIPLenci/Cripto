const fs = require('fs');
const file = 'src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'Código: {currentRoom.code}</span>',
  `Código: {currentRoom.code}</span>
                    {currentRoom && currentUser && (currentRoom.createdById === currentUser.id || currentUser.role === 'admin') && (
                      <button
                        onClick={async () => {
                          const res = await fetch('/api/rooms/toggle-closed', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
                            body: JSON.stringify({ roomId: currentRoom.id, isClosed: !currentRoom.isClosed })
                          });
                          if (res.ok) {
                            setCurrentRoom({ ...currentRoom, isClosed: !currentRoom.isClosed });
                          }
                        }}
                        className={\`ml-2 px-2 py-0.5 rounded text-[10px] font-bold border \${currentRoom.isClosed ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}\`}
                      >
                        {currentRoom.isClosed ? 'Sala Cerrada' : 'Sala Abierta'}
                      </button>
                    )}`
);

fs.writeFileSync(file, code);
