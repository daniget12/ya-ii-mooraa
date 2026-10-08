// Force bypass SSL certificate errors for Supabase connection
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: (process.env.POSTGRES_URL || process.env.DATABASE_URL) ? { rejectUnauthorized: false } : false
});

module.exports = async function(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    if (req.headers['x-admin-password'] !== adminPassword) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.query;

    if (req.method === 'DELETE') {
        try {
            await pool.query('DELETE FROM participants WHERE id = $1', [id]);
            return res.status(200).json({ message: 'Deleted successfully' });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    if (req.method === 'PUT') {
        try {
            const { name, phone, college, gender, department, year } = req.body || {};
            await pool.query(
                'UPDATE participants SET name = $1, phone = $2, college = $3, gender = $4, department = $5, year = $6 WHERE id = $7',
                [name, phone, college, gender, department, year, id]
            );
            return res.status(200).json({ message: 'Updated successfully' });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
