const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const db = require('../database');

ffmpeg.setFfmpegPath(ffmpegPath);

const router = express.Router();
const uploadsDir = path.join(__dirname, '..', 'uploads', 'videos');
const thumbsDir = path.join(__dirname, '..', 'uploads', 'thumbnails');

[uploadsDir, thumbsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const allowedExtensions = new Set(['.mp4', '.webm', '.mov']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .slice(0, 40);
    cb(null, `${Date.now()}_${safeName}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.has(ext)) {
      return cb(new Error('Formato inválido. Use MP4, WEBM ou MOV.'));
    }
    cb(null, true);
  }
});

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function generateThumbnail(videoPath, outputName) {
  return new Promise((resolve) => {
    const outputPath = path.join(thumbsDir, `${outputName}.jpg`);
    ffmpeg(videoPath)
      .on('end', () => resolve(`/uploads/thumbnails/${outputName}.jpg`))
      .on('error', () => resolve(null))
      .screenshots({
        timestamps: ['00:00:01.000'],
        filename: `${outputName}.jpg`,
        folder: thumbsDir,
        size: '360x640'
      });

    setTimeout(() => {
      if (!fs.existsSync(outputPath)) resolve(null);
    }, 3500);
  });
}

router.get('/', async (req, res) => {
  const search = (req.query.search || '').trim();

  try {
    const rows = search
      ? await allQuery(
          `SELECT * FROM videos
           WHERE title LIKE ? OR description LIKE ? OR tags LIKE ?
           ORDER BY id DESC`,
          [`%${search}%`, `%${search}%`, `%${search}%`]
        )
      : await allQuery('SELECT * FROM videos ORDER BY id DESC');

    const parsed = rows.map((video) => ({
      ...video,
      tags: video.tags ? video.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : []
    }));

    res.json(parsed);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar vídeos.', error: error.message });
  }
});

router.post('/upload', upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Nenhum vídeo enviado.' });
  }

  try {
    const title = (req.body.title || path.parse(req.file.originalname).name).slice(0, 120);
    const description = (req.body.description || '').slice(0, 500);
    const tags = (req.body.tags || '')
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)
      .join(',');

    const thumbKey = path.parse(req.file.filename).name;
    const thumbnailPath = await generateThumbnail(req.file.path, thumbKey);

    const uploadDate = new Date().toISOString();
    const videoPath = `/uploads/videos/${req.file.filename}`;

    const result = await runQuery(
      `INSERT INTO videos
      (title, description, tags, uploadDate, likes, favorites, views, videoPath, thumbnailPath, mimeType)
      VALUES (?, ?, ?, ?, 0, 0, 0, ?, ?, ?)`,
      [title, description, tags, uploadDate, videoPath, thumbnailPath, req.file.mimetype]
    );

    const created = await getQuery('SELECT * FROM videos WHERE id = ?', [result.lastID]);
    created.tags = created.tags ? created.tags.split(',').filter(Boolean) : [];

    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao processar upload.', error: error.message });
  }
});

router.patch('/:id/like', async (req, res) => {
  try {
    await runQuery('UPDATE videos SET likes = likes + 1 WHERE id = ?', [req.params.id]);
    const video = await getQuery('SELECT likes FROM videos WHERE id = ?', [req.params.id]);
    res.json(video);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao curtir vídeo.' });
  }
});

router.patch('/:id/favorite', async (req, res) => {
  try {
    await runQuery('UPDATE videos SET favorites = favorites + 1 WHERE id = ?', [req.params.id]);
    const video = await getQuery('SELECT favorites FROM videos WHERE id = ?', [req.params.id]);
    res.json(video);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao favoritar vídeo.' });
  }
});

router.patch('/:id/view', async (req, res) => {
  try {
    await runQuery('UPDATE videos SET views = views + 1 WHERE id = ?', [req.params.id]);
    const video = await getQuery('SELECT views FROM videos WHERE id = ?', [req.params.id]);
    res.json(video);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao contar visualização.' });
  }
});

module.exports = router;
