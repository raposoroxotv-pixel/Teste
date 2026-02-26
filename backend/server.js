const path = require('path');
const express = require('express');
const cors = require('cors');

require('./database');

const videosRouter = require('./routes/videos');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/videos', videosRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'LocalTok backend' });
});

app.listen(PORT, () => {
  console.log(`LocalTok backend rodando em http://localhost:${PORT}`);
});
