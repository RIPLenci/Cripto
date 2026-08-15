const express = require('express');
const app = express();
app.get('/test', (req, res) => {
  res.status(403).json({ error: "Test" });
});
app.listen(3001, () => console.log('Listening on 3001'));
