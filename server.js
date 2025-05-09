const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const PORT = 3000;
const USERS_FILE = path.join(__dirname, 'users.json');

app.use(bodyParser.json());
app.use(express.static(__dirname));
app.use(session({
    secret: 'sql-dersi-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 gün
}));

// Helper: Read users from file
function readUsers() {
    if (!fs.existsSync(USERS_FILE)) return [];
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    return data ? JSON.parse(data) : [];
}

// Helper: Write users to file
function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Register endpoint
app.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Bütün sahələr doldurulmalıdır.' });
    }
    let users = readUsers();
    if (users.find(u => u.email === email)) {
        return res.status(409).json({ message: 'Bu email artıq qeydiyyatdan keçib.' });
    }
    users.push({ username, email, password });
    writeUsers(users);
    // Qeydiyyatdan sonra avtomatik login
    req.session.user = { username, email };
    res.json({ message: 'Qeydiyyat uğurla tamamlandı!', user: { username, email } });
});

// Login endpoint
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Bütün sahələr doldurulmalıdır.' });
    }
    let users = readUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        return res.status(401).json({ message: 'Email və ya şifrə yanlışdır.' });
    }
    req.session.user = { username: user.username, email: user.email };
    res.json({ message: 'Daxil oldunuz!', user: { username: user.username, email: user.email } });
});

// Logout endpoint
app.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ message: 'Çıxış etdiniz.' });
    });
});

// Get current user
app.get('/me', (req, res) => {
    if (req.session.user) {
        res.json({ user: req.session.user });
    } else {
        res.status(401).json({ user: null });
    }
});

app.listen(PORT, () => {
    console.log(`Server http://localhost:${PORT} ünvanında işləyir`);
}); 