const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Serve static files unconditionally so Vercel can display the frontend
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : (process.env.POSTGRES_URL ? { rejectUnauthorized: false } : false)
});

if (process.env.POSTGRES_URL || process.env.DATABASE_URL) {
    pool.query(`
        CREATE TABLE IF NOT EXISTS participants (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(50) NOT NULL,
            college VARCHAR(100) NOT NULL,
            gender VARCHAR(50),
            department VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `).catch(err => console.error("Error creating table:", err));

    pool.query(`
        ALTER TABLE participants ADD COLUMN IF NOT EXISTS gender VARCHAR(50);
        ALTER TABLE participants ADD COLUMN IF NOT EXISTS department VARCHAR(255);
    `).catch(err => console.error("Error altering table:", err));
}

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
    const { name, phone, college, gender, department } = req.body;
    
    if (!name || !phone || !college) {
        return res.status(400).json({ error: 'Please provide name, phone, and college' });
    }

    try {
        if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
            return res.status(500).json({ error: 'Database is not configured yet. Please set POSTGRES_URL.' });
        }

        const result = await pool.query(
            'INSERT INTO participants (name, phone, college, gender, department) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, phone, college, gender, department]
        );
        res.json({ message: 'success', data: result.rows[0] });
    } catch (err) {
        console.error("POST Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Admin endpoints
app.delete('/api/participants/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM participants WHERE id = $1', [id]);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/participants/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, college, gender, department } = req.body;
        await pool.query(
            'UPDATE participants SET name = $1, phone = $2, college = $3, gender = $4, department = $5 WHERE id = $6',
            [name, phone, college, gender, department, id]
        );
        res.json({ message: 'Updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
}

// Export the app for Vercel's serverless builder
module.exports = app;

