const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// --- 1. MYSQL DATABASE CONNECTION ---
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});

sequelize.authenticate()
    .then(() => console.log('✅ eSakay connected to Cloud MySQL (Aiven)!'))
    .catch(err => console.log('❌ MySQL Connection Error:', err));

// --- 2. MODELS (TABLES) ---
const User = sequelize.define('User', {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, defaultValue: 'user' },
    status: { type: DataTypes.STRING, defaultValue: 'pending' }
});

const Trip = sequelize.define('Trip', {
    userName: DataTypes.STRING,
    origin: DataTypes.STRING,
    destination: DataTypes.STRING,
    fare: DataTypes.FLOAT,
    vehicle: DataTypes.STRING,
    isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false }
});

const SOS = sequelize.define('SOS', {
    userName: DataTypes.STRING,
    location: DataTypes.STRING,
    status: { type: DataTypes.STRING, defaultValue: 'active' }
});

// Automatic table creation
sequelize.sync();

// --- 3. ROUTES ---

app.get("/", (req, res) => res.send("🚀 eSakay MySQL API is Live!"));

// AUTH
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ 
            name, email, password: hashedPassword, role, 
            status: role === 'admin' ? 'approved' : 'pending' 
        });
        res.json({ message: "Registered! Wait for Admin Approval." });
    } catch (e) { res.status(400).json({ message: "Email already taken" }); }
});

app.post('/api/login', async (req, res) => {
    const user = await User.findOne({ where: { email: req.body.email } });
    if (!user) return res.status(400).json({ message: "User not found" });
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid Password" });
    if (user.role === 'user' && user.status !== 'approved') return res.status(403).json({ message: `Account is ${user.status}.` });
    res.json({ user });
});

// ADMIN MANAGEMENT
app.get('/api/admin/all', async (req, res) => {
    const users = await User.findAll();
    const trips = await Trip.findAll({ where: { isDeleted: false }, order: [['createdAt', 'DESC']] });
    const sos = await SOS.findAll({ order: [['createdAt', 'DESC']] });
    const trash = await Trip.findAll({ where: { isDeleted: true } });
    res.json({ users, trips, sos, trash });
});

app.patch('/api/admin/users/status/:id', async (req, res) => {
    await User.update({ status: req.body.status }, { where: { id: req.params.id } });
    res.json({ message: "Updated" });
});

app.patch('/api/admin/sos/resolve/:id', async (req, res) => {
    await SOS.update({ status: 'resolved' }, { where: { id: req.params.id } });
    res.json({ message: "Handled" });
});

app.patch('/api/admin/trips/delete/:id', async (req, res) => {
    await Trip.update({ isDeleted: true }, { where: { id: req.params.id } });
    res.json({ message: "Moved to Trash" });
});

app.patch('/api/admin/trips/restore/:id', async (req, res) => {
    await Trip.update({ isDeleted: false }, { where: { id: req.params.id } });
    res.json({ message: "Restored" });
});

// USER ACTIONS
app.post('/api/trips', async (req, res) => { res.json(await Trip.create(req.body)); });
app.post('/api/sos', async (req, res) => { res.json(await SOS.create(req.body)); });
app.get('/api/user/sos/status/:name', async (req, res) => {
    const last = await SOS.findOne({ where: { userName: req.params.name }, order: [['createdAt', 'DESC']] });
    res.json(last);
});

// SERVER LISTEN
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));