// Force bypass SSL certificate errors for Supabase connection
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: (process.env.POSTGRES_URL || process.env.DATABASE_URL) ? { rejectUnauthorized: false } : false
});

// Initialize table if it doesn't exist
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

module.exports = async function(req, res) {
    // CORS headers just in case
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'GET') {
        try {
            if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
                 return res.status(200).json({ message: 'No database connected', data: [] });
            }
            const result = await pool.query('SELECT * FROM participants ORDER BY created_at DESC');
            return res.status(200).json({ message: 'success', data: result.rows });
        } catch (err) {
            console.error("GET Error:", err);
            return res.status(500).json({ error: err.message });
        }
    }

    if (req.method === 'POST') {
        const { name, phone, college } = req.body || {};
        
        if (!name || !phone || !college) {
            return res.status(400).json({ error: 'Please provide name, phone, and college' });
        }

        try {
            if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
                return res.status(500).json({ error: 'Database is not configured yet.' });
            }

            const result = await pool.query(
                'INSERT INTO participants (name, phone, college) VALUES ($1, $2, $3) RETURNING *',
                [name, phone, college]
            );
            return res.status(200).json({ message: 'success', data: result.rows[0] });
        } catch (err) {
            console.error("POST Error:", err);
            return res.status(500).json({ error: err.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
