import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbPath = path.join(process.cwd(), "expense.db");
const db = new Database(dbPath);

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date TEXT NOT NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    payment TEXT NOT NULL,
    date TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'Expense',
    session_id INTEGER,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
  );
`);

try {
  db.exec("ALTER TABLE expenses ADD COLUMN type TEXT NOT NULL DEFAULT 'Expense'");
} catch (e) {
  // Column might already exist
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes

  // --- Expenses ---
  app.get("/api/expenses", (req, res) => {
    try {
      const expenses = db.prepare("SELECT * FROM expenses ORDER BY date DESC, id DESC").all();
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", (req, res) => {
    const { title, amount, category, payment, date, type, session_id } = req.body;
    const txType = type || 'Expense';
    if (!title || !amount || !category || !payment || !date) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    try {
      const stmt = db.prepare(`
        INSERT INTO expenses (title, amount, category, payment, date, type, session_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(title, amount, category, payment, date, txType, session_id || null);
      res.status(201).json({ id: info.lastInsertRowid, title, amount, category, payment, date, type: txType, session_id });
    } catch (error) {
      res.status(500).json({ error: "Failed to add expense" });
    }
  });

  app.put("/api/expenses/:id", (req, res) => {
    const { title, amount, category, payment, date, type } = req.body;
    const txType = type || 'Expense';
    if (!title || !amount || !category || !payment || !date) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    try {
      const stmt = db.prepare(`
        UPDATE expenses
        SET title = ?, amount = ?, category = ?, payment = ?, date = ?, type = ?
        WHERE id = ?
      `);
      stmt.run(title, amount, category, payment, date, txType, req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", (req, res) => {
    try {
      const stmt = db.prepare("DELETE FROM expenses WHERE id = ?");
      stmt.run(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete expense" });
    }
  });

  app.get("/api/analysis/monthly", (req, res) => {
    const { month } = req.query;
    if (!month || typeof month !== 'string') {
      return res.status(400).json({ error: "Month parameter (YYYY-MM) is required" });
    }

    try {
      const incomeRow = db.prepare(`
        SELECT SUM(amount) as total 
        FROM expenses 
        WHERE strftime('%Y-%m', date) = ? AND type = 'Income'
      `).get(month) as { total: number | null };

      const expenseRow = db.prepare(`
        SELECT SUM(amount) as total 
        FROM expenses 
        WHERE strftime('%Y-%m', date) = ? AND type = 'Expense'
      `).get(month) as { total: number | null };

      const categoryRows = db.prepare(`
        SELECT category, SUM(amount) as total 
        FROM expenses 
        WHERE strftime('%Y-%m', date) = ? AND type = 'Expense'
        GROUP BY category
        ORDER BY total DESC
      `).all(month) as { category: string, total: number }[];

      const paymentRows = db.prepare(`
        SELECT payment, SUM(amount) as total 
        FROM expenses 
        WHERE strftime('%Y-%m', date) = ? AND type = 'Expense'
        GROUP BY payment
        ORDER BY total DESC
      `).all(month) as { payment: string, total: number }[];

      res.json({
        month,
        totalIncome: incomeRow.total || 0,
        totalExpense: expenseRow.total || 0,
        categories: categoryRows,
        payments: paymentRows
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch monthly analysis" });
    }
  });

  // --- Sessions ---
  app.get("/api/sessions", (req, res) => {
    try {
      const sessions = db.prepare("SELECT * FROM sessions ORDER BY date DESC, id DESC").all();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.get("/api/sessions/:id", (req, res) => {
    try {
      const session = db.prepare("SELECT * FROM sessions WHERE id = ?").get(req.params.id);
      if (!session) return res.status(404).json({ error: "Session not found" });
      
      const sessionExpenses = db.prepare("SELECT * FROM expenses WHERE session_id = ? ORDER BY date DESC, id DESC").all(req.params.id);
      res.json({ ...(session as any), expenses: sessionExpenses });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  app.post("/api/sessions", (req, res) => {
    const { name, date } = req.body;
    if (!name || !date) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    try {
      const stmt = db.prepare("INSERT INTO sessions (name, date) VALUES (?, ?)");
      const info = stmt.run(name, date);
      res.status(201).json({ id: info.lastInsertRowid, name, date });
    } catch (error) {
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  app.delete("/api/sessions/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM sessions WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete session" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
