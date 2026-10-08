module.exports = async function(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'POST') {
        const { password } = req.body || {};
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        if (password === adminPassword) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
