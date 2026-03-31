import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import path from 'path';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.AUTH_SALT || 'LITO_ISLAM_SECRET_2026';

// Initialize DB
const db = new Database('lito_academy_final_v1.db');
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (user TEXT PRIMARY KEY, pswd TEXT, role TEXT);
  CREATE TABLE IF NOT EXISTS aulas (id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT, url TEXT, categoria TEXT, material_pdf BLOB);
  CREATE TABLE IF NOT EXISTS biblioteca (id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT, autor TEXT, lingua TEXT, categoria TEXT, arquivo_pdf BLOB);
  CREATE TABLE IF NOT EXISTS progresso (user TEXT, aula_id INTEGER, data TEXT, PRIMARY KEY (user, aula_id));
  CREATE TABLE IF NOT EXISTS quizzes (id INTEGER PRIMARY KEY AUTOINCREMENT, aula_id INTEGER, pergunta TEXT, op_a TEXT, op_b TEXT, op_c TEXT, correta TEXT);
`);

// Create Admin
const adminPw = bcrypt.hashSync('admin123' + JWT_SECRET, 10);
db.prepare('INSERT OR IGNORE INTO usuarios (user, pswd, role) VALUES (?, ?, ?)').run('admin', adminPw, 'admin');

// Setup GenAI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'dummy' });

app.use(express.json());

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// API Routes
app.post('/api/login', (req, res) => {
  const { user, password } = req.body;
  const row = db.prepare('SELECT * FROM usuarios WHERE user = ?').get(user) as any;
  if (row && bcrypt.compareSync(password + JWT_SECRET, row.pswd)) {
    const token = jwt.sign({ user: row.user, role: row.role }, JWT_SECRET);
    res.json({ token, role: row.role, user: row.user });
  } else {
    res.status(401).json({ error: 'Acesso não autorizado.' });
  }
});

app.get('/api/progress', authenticateToken, (req: any, res) => {
  const tot_a = db.prepare('SELECT COUNT(*) as count FROM aulas').get() as any;
  const con_a = db.prepare('SELECT COUNT(*) as count FROM progresso WHERE user = ?').get(req.user.user) as any;
  const pct = tot_a.count > 0 ? Math.floor((con_a.count / tot_a.count) * 100) : 0;
  res.json({ pct });
});

app.get('/api/aulas', authenticateToken, (req, res) => {
  const aulas = db.prepare('SELECT id, titulo, url, categoria FROM aulas').all();
  res.json(aulas);
});

app.post('/api/aulas/:id/complete', authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const date = new Date().toISOString().split('T')[0];
  db.prepare('INSERT OR IGNORE INTO progresso (user, aula_id, data) VALUES (?, ?, ?)').run(req.user.user, id, date);
  res.json({ success: true });
});

app.get('/api/biblioteca', authenticateToken, (req, res) => {
  const { lingua } = req.query;
  let query = 'SELECT id, titulo, autor, lingua, categoria FROM biblioteca';
  let params: any[] = [];
  if (lingua && lingua !== 'Todas') {
    query += ' WHERE lingua = ?';
    params.push(lingua);
  }
  const livros = db.prepare(query).all(...params);
  res.json(livros);
});

app.get('/api/biblioteca/:id/download', authenticateToken, (req, res) => {
  const { id } = req.params;
  const livro = db.prepare('SELECT arquivo_pdf, titulo FROM biblioteca WHERE id = ?').get(id) as any;
  if (livro && livro.arquivo_pdf) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${livro.titulo}.pdf"`);
    res.send(livro.arquivo_pdf);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.get('/api/quizzes', authenticateToken, (req, res) => {
  const quizzes = db.prepare('SELECT id, aula_id, pergunta, op_a, op_b, op_c FROM quizzes').all();
  res.json(quizzes);
});

app.post('/api/quizzes/submit', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Respostas submetidas! O teu tutor irá avaliar.' });
});

app.post('/api/tutor', authenticateToken, async (req, res) => {
  const { pergunta } = req.body;
  const prompt = `
    És o Alim (Professor) Virtual da LITO Academy. Responde com sabedoria e base científica islâmica.
    Pergunta do Aluno: ${pergunta}
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    res.json({ text: response.text });
  } catch (e) {
    console.error(e);
    res.json({ text: 'O Tutor está em oração. Tente daqui a pouco.' });
  }
});

const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/admin/biblioteca', authenticateToken, upload.single('pdf'), (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { titulo, autor, lingua, categoria } = req.body;
  const pdf = req.file?.buffer;
  if (!pdf) return res.status(400).json({ error: 'PDF is required' });
  db.prepare('INSERT INTO biblioteca (titulo, autor, lingua, categoria, arquivo_pdf) VALUES (?, ?, ?, ?, ?)').run(titulo, autor, lingua, categoria, pdf);
  res.json({ success: true });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
