const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// --- 1. DATABASE CONNECTION ---
// Auto-detect: Gagamit ng SSL settings kung Cloud, standard kung Local (XAMPP)
const isCloud = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('aivencloud.com');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'mysql',
    logging: false,
    dialectOptions: isCloud ? {
        ssl: { require: true, rejectUnauthorized: false }
    } : {}
});

sequelize.authenticate()
    .then(() => console.log(`✅ eSakay connected to ${isCloud ? 'Cloud' : 'Local XAMPP'} MySQL`))
    .catch(err => console.log('❌ MySQL Error:', err));

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
    vehicle: { type: DataTypes.STRING, defaultValue: 'Jeepney' },
    isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false }
});

const SOS = sequelize.define('SOS', {
    userName: DataTypes.STRING,
    location: { type: DataTypes.STRING, defaultValue: "GenSan Area" },
    status: { type: DataTypes.STRING, defaultValue: 'active' }
});

// Auto-sync: Gagawa ng tables sa MySQL kung wala pa
sequelize.sync();

// --- 3. ROUTES ---

// Health Check (Fixes "Cannot GET /")
app.get("/", (req, res) => {
    res.send("🚀 eSakay MySQL API is LIVE and Connected!");
});

// REGISTER
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ 
            name, email, password: hashedPassword, role, 
            status: role === 'admin' ? 'approved' : 'pending' 
        });
        res.json({ message: "Registered! Wait for Admin Approval." });
    } catch (e) { res.status(400).json({ message: "Email already taken" }); }
});

// LOGIN
app.post('/api/login', async (req, res) => {
    const user = await User.findOne({ where: { email: req.body.email } });
    if (!user) return res.status(400).json({ message: "User not found" });
    
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid Password" });
    
    if (user.role === 'user' && user.status !== 'approved') {
        return res.status(403).json({ message: `Account is ${user.status}.` });
    }
    res.json({ user });
});

// UPDATE PROFILE (Fixed for MySQL)
app.patch('/api/users/update/:id', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        let updateData = { name, email };
        if (password) updateData.password = await bcrypt.hash(password, 10);
        
        await User.update(updateData, { where: { id: req.params.id } });
        const updatedUser = await User.findByPk(req.params.id);
        res.json(updatedUser);
    } catch (e) { res.status(400).send("Update Failed"); }
});

// ADMIN: GET ALL DATA
app.get('/api/admin/all', async (req, res) => {
    try {
        const users = await User.findAll();
        const trips = await Trip.findAll({ where: { isDeleted: false }, order: [['createdAt', 'DESC']] });
        const trash = await Trip.findAll({ where: { isDeleted: true } });
        const sos = await SOS.findAll({ order: [['createdAt', 'DESC']] });
        res.json({ users, trips, trash, sos });
    } catch (e) { res.status(500).send("Error fetching data"); }
});

// ADMIN ACTIONS
app.patch('/api/admin/users/status/:id', async (req, res) => {
    await User.update({ status: req.body.status }, { where: { id: req.params.id } });
    res.json({ message: "OK" });
});

app.patch('/api/admin/trips/delete/:id', async (req, res) => {
    await Trip.update({ isDeleted: true }, { where: { id: req.params.id } });
    res.json({ message: "Deleted" });
});

app.patch('/api/admin/trips/restore/:id', async (req, res) => {
    await Trip.update({ isDeleted: false }, { where: { id: req.params.id } });
    res.json({ message: "Restored" });
});

app.patch('/api/admin/sos/resolve/:id', async (req, res) => {
    await SOS.update({ status: 'resolved' }, { where: { id: req.params.id } });
    res.json({ message: "Resolved" });
});

// USER ACTIONS
app.post('/api/trips', async (req, res) => {
    const trip = await Trip.create(req.body);
    res.json(trip);
});

app.post('/api/sos', async (req, res) => {
    const s = await SOS.create(req.body);
    res.json(s);
});

app.get('/api/user/sos/status/:name', async (req, res) => {
    const last = await SOS.findOne({ where: { userName: req.params.name }, order: [['createdAt', 'DESC']] });
    res.json(last);
});

// --- SERVER LISTEN ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));