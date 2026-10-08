const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files when running locally
// Vercel automatically serves the public/ folder in production
if (process.env.NODE_ENV !== 'production') {
    app.use(express.static(path.join(__dirname, '../public')));
}

// Database setup using PostgreSQL (Vercel Postgres, Supabase, Neon, etc.)
// Connects using the connection string provided in environment variables
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  // Add SSL requirement for remote databases, except when running on localhost
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : (process.env.POSTGRES_URL ? { rejectUnauthorized: false } : false)
});

// Initialize table if it doesn't exist
// NOTE: It's better to run this once manually, but this ensures the table exists for quick setup.
if (process.env.POSTGRES_URL || process.env.DATABASE_URL) {
    pool.query(`
        CREATE TABLE IF NOT EXISTS participants (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(50) NOT NULL,
            college VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `).catch(err => console.error("Error creating table:", err));
}

// API Endpoints
app.get('/api/participants', async (req, res) => {
    try {
        if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
             return res.json({ message: 'No database connected', data: [] });
        }
        const result = await pool.query('SELECT * FROM participants ORDER BY created_at DESC');
        res.json({ message: 'success', data: result.rows });
    } catch (err) {
        console.error("GET Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/participants', async (req, res) => {
    const { name, phone, college } = req.body;
    
    if (!name || !phone || !college) {
        return res.status(400).json({ error: 'Please provide name, phone, and college' });
    }

    try {
        if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
            return res.status(500).json({ error: 'Database is not configured yet. Please set POSTGRES_URL.' });
        }

        const result = await pool.query(
            'INSERT INTO participants (name, phone, college) VALUES ($1, $2, $3) RETURNING *',
            [name, phone, college]
        );
        res.json({ message: 'success', data: result.rows[0] });
    } catch (err) {
        console.error("POST Error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = app;
