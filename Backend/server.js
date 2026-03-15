const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();

// --- MIDDLEWARES ---
app.use(express.json());
app.use(cors()); // Pinakasimpleng CORS para hindi mag-error

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ SERP Connected to MongoDB'))
    .catch(err => console.log('❌ DB Error:', err));

// --- MODELS ---
const User = mongoose.model('User', new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    age: { type: String, default: "" },
    gender: { type: String, default: "" },
    zipCode: { type: String, default: "" },
    bloodType: { type: String, default: "N/A" },
    medicalCondition: { type: String, default: "NONE" },
    role: { type: String, default: 'user' }
}));

const Emergency = mongoose.model('Emergency', new mongoose.Schema({
    userName: String,
    location: String,
    status: { type: String, default: 'active' }, // active, responded, done
    date: { type: Date, default: Date.now }
}));

// --- ROUTES ---

// 1. REGISTER
app.post('/api/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const newUser = new User({ ...req.body, password: hashedPassword });
        await newUser.save();
        res.json({ message: "Registration Success!" });
    } catch (e) { res.status(400).json({ message: "Error: Email or Username taken" }); }
});

// 2. LOGIN
app.post('/api/login', async (req, res) => {
    const user = await User.findOne({ username: req.body.username });
    if (!user) return res.status(400).json({ message: "User not found" });
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid Password" });
    res.json({ user });
});

// 3. UPDATE PROFILE
app.patch('/api/user/update/:id', async (req, res) => {
    try {
        const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (e) { res.status(400).json({ message: "Update Failed" }); }
});

// 4. ADMIN DATA & STATS
app.get('/api/admin/data', async (req, res) => {
    const emergencies = await Emergency.find().sort({ date: -1 });
    const activeCount = await Emergency.countDocuments({ status: 'active' });
    const respondersCount = await User.countDocuments({ role: 'admin' });
    res.json({ emergencies, activeCount, respondersCount });
});

// 5. USER EMERGENCY STATUS (NOTIFICATION)
app.get('/api/user/sos-status/:name', async (req, res) => {
    const status = await Emergency.findOne({ userName: req.params.name }).sort({ date: -1 });
    res.json(status);
});

// 6. SEND SOS
app.post('/api/emergency/sos', async (req, res) => {
    const em = new Emergency(req.body);
    await em.save();
    res.json(em);
});

// 7. ADMIN UPDATE STATUS
app.patch('/api/admin/emergency/status/:id', async (req, res) => {
    await Emergency.findByIdAndUpdate(req.params.id, { status: req.body.status });
    res.json({ message: "Updated" });
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 SERP Server running on port ${PORT}`));