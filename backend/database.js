const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'localtok.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      tags TEXT DEFAULT '',
      uploadDate TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      favorites INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      videoPath TEXT NOT NULL,
      thumbnailPath TEXT,
      mimeType TEXT NOT NULL
    )
  `);
});

module.exports = db;
