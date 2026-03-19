const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// 1. KONEKSYON SA MYSQL
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'mysql',
    logging: false
});

sequelize.authenticate()
    .then(() => console.log('✅ eSakay connected to MySQL (XAMPP)!'))
    .catch(err => console.log('❌ MySQL Error:', err));

// 2. MGA TABLES (MODELS)
const User = sequelize.define('User', {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, defaultValue: 'user' },
    status: { type: DataTypes.STRING, defaultValue: 'pending' }
});

const Trip = sequelize.define('Trip', {
    userName: DataTypes.STRING, origin: DataTypes.STRING, destination: DataTypes.STRING,
    fare: DataTypes.FLOAT, vehicle: DataTypes.STRING, isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false }
});

const SOS = sequelize.define('SOS', {
    userName: DataTypes.STRING, location: DataTypes.STRING, status: { type: DataTypes.STRING, defaultValue: 'active' }
});

// Gagawa ng tables sa phpMyAdmin automatic
sequelize.sync();

// 3. MGA ROUTES (Logic ng App)
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ name, email, password: hashedPassword, role, status: role === 'admin' ? 'approved' : 'pending' });
        res.json({ message: "Registered! Wait for Admin Approval." });
    } catch (e) { res.status(400).json({ message: "Email taken" }); }
});

app.post('/api/login', async (req, res) => {
    const user = await User.findOne({ where: { email: req.body.email } });
    if (!user) return res.status(400).json({ message: "User not found" });
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid Password" });
    if (user.role === 'user' && user.status !== 'approved') return res.status(403).json({ message: `Account is ${user.status}.` });
    res.json({ user });
});

app.get('/api/admin/all', async (req, res) => {
    const users = await User.findAll();
    const trips = await Trip.findAll({ order: [['createdAt', 'DESC']] });
    const sos = await SOS.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ users, trips, sos });
});

app.post('/api/trips', async (req, res) => { res.json(await Trip.create(req.body)); });
app.post('/api/sos', async (req, res) => { res.json(await SOS.create(req.body)); });

app.get("/", (req, res) => res.send("eSakay MySQL API is running..."));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server on port ${PORT}`));