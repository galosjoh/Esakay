const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ eSakay Database Connected'))
    .catch(err => console.log('❌ DB Error:', err));

// --- MODELS ---
const User = mongoose.model('User', new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user' }, 
    status: { type: String, default: 'pending' }, 
    dateCreated: { type: Date, default: Date.now }
}));

const Trip = mongoose.model('Trip', new mongoose.Schema({
    userName: String, origin: String, destination: String, fare: Number, vehicle: String, 
    isDeleted: { type: Boolean, default: false },
    date: { type: Date, default: Date.now }
}));

const SOS = mongoose.model('SOS', new mongoose.Schema({
    userName: String, location: String, status: { type: String, default: 'active' }, 
    date: { type: Date, default: Date.now }
}));

// --- ROUTES ---

// 1. AUTH & ACCOUNT
app.post('/api/login', async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).json({ message: "User not found" });
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid Password" });
    if (user.role === 'user' && user.status !== 'approved') return res.status(403).json({ message: `Account is ${user.status}.` });
    res.json({ user });
});

app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword, role, status: role === 'admin' ? 'approved' : 'pending' });
        await newUser.save();
        res.json({ message: "Registered! Wait for Admin Approval." });
    } catch (e) { res.status(400).json({ message: "Email already taken" }); }
});

// 2. ADMIN MANAGEMENT
app.get('/api/admin/all', async (req, res) => {
    const users = await User.find();
    const trips = await Trip.find().sort({ date: -1 });
    const sos = await SOS.find().sort({ date: -1 });
    res.json({ users, trips, sos });
});

app.patch('/api/admin/users/status/:id', async (req, res) => {
    await User.findByIdAndUpdate(req.params.id, { status: req.body.status });
    res.json({ message: "Status Updated" });
});

app.patch('/api/admin/trips/delete/:id', async (req, res) => {
    await Trip.findByIdAndUpdate(req.params.id, { isDeleted: true });
    res.json({ message: "Moved to Trash" });
});

app.patch('/api/admin/trips/restore/:id', async (req, res) => {
    await Trip.findByIdAndUpdate(req.params.id, { isDeleted: false });
    res.json({ message: "Restored" });
});

app.patch('/api/admin/sos/resolve/:id', async (req, res) => {
    await SOS.findByIdAndUpdate(req.params.id, { status: 'resolved' });
    res.json({ message: "SOS Handled" });
});

// 3. USER ACTIONS
app.post('/api/trips', async (req, res) => {
    const trip = new Trip(req.body); await trip.save(); res.json(trip);
});

app.post('/api/sos', async (req, res) => {
    const s = new SOS(req.body); await s.save(); res.json(s);
});

app.get('/api/user/sos/status/:name', async (req, res) => {
    const lastSOS = await SOS.findOne({ userName: req.params.name }).sort({ date: -1 });
    res.json(lastSOS);
});

// Health Check
app.get("/", (req, res) => res.send("🚀 eSakay API is live!"));

// --- SERVER LISTEN ---
const PORT = process.env.PORT || 3000; 
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server on port ${PORT}`));