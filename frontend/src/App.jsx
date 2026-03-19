import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { FaHome, FaCalculator, FaShieldAlt, FaUsers, FaBolt, FaSignOutAlt, FaThLarge, FaCheck, FaTimes, FaTrash, FaUndo } from 'react-icons/fa';
import './App.css';

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// --- LOGIN ---
const Login = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API}/login`, form);
            localStorage.setItem('esakay_user', JSON.stringify(res.data.user));
            navigate(res.data.user.role === 'admin' ? '/admin' : '/user');
        } catch (e) { alert(e.response?.data?.message || "Login Error"); }
    };
    return (
        <div className="portal-login-bg"><div className="portal-login-card">
            <FaBolt size={50} color="#0056b3"/><h1>eSakay Login</h1>
            <form onSubmit={handleLogin}>
                <input className="portal-input" type="email" placeholder="Email" onChange={e=>setForm({...form, email:e.target.value})} required/>
                <input className="portal-input" type="password" placeholder="Password" onChange={e=>setForm({...form, password:e.target.value})} required/>
                <button type="submit" className="portal-btn">Login</button>
            </form>
            <p onClick={()=>navigate('/register')} style={{cursor:'pointer', color:'#0056b3', marginTop:'10px'}}>Register</p>
        </div></div>
    );
};

// --- REGISTER ---
const Register = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
    const handleReg = async (e) => {
        e.preventDefault();
        try { await axios.post(`${API}/register`, form); alert("Registered! Wait for Admin."); navigate('/'); } 
        catch (e) { alert("Registration Failed"); }
    };
    return (
        <div className="portal-login-bg"><div className="portal-login-card"><h2>Sign Up</h2>
            <form onSubmit={handleReg}>
                <input className="portal-input" placeholder="Full Name" onChange={e=>setForm({...form, name:e.target.value})} required/>
                <input className="portal-input" type="email" placeholder="Email" onChange={e=>setForm({...form, email:e.target.value})} required/>
                <input className="portal-input" type="password" placeholder="Password" onChange={e=>setForm({...form, password:e.target.value})} required/>
                <select className="portal-input" onChange={e=>setForm({...form, role:e.target.value})}><option value="user">User</option><option value="admin">Admin</option></select>
                <button type="submit" className="portal-btn">Create Account</button>
            </form>
        </div></div>
    );
};

// --- ADMIN PORTAL ---
const AdminPortal = () => {
    const [active, setActive] = useState('dash');
    const [data, setData] = useState({ users: [], trips: [], sos: [] });
    const user = JSON.parse(localStorage.getItem('esakay_user'));
    const navigate = useNavigate();

    const fetchAll = async () => { try { const res = await axios.get(`${API}/admin/all`); setData(res.data); } catch(e){} };
    useEffect(() => { fetchAll(); const i = setInterval(fetchAll, 3000); return ()=>clearInterval(i); }, []);

    const updateStatus = async (id, status) => { await axios.patch(`${API}/admin/users/status/${id}`, { status }); fetchAll(); };
    const resolveSOS = async (id) => { await axios.patch(`${API}/admin/sos/resolve/${id}`); fetchAll(); };
    const moveToTrash = async (id) => { await axios.patch(`${API}/admin/trips/delete/${id}`); fetchAll(); };
    const restoreTrip = async (id) => { await axios.patch(`${API}/admin/trips/restore/${id}`); fetchAll(); };

    return (
        <div className="portal-layout">
            <aside className="sidebar">
                <div className="brand">eSakay PORTAL</div>
                <div onClick={()=>setActive('dash')} className={active==='dash'?'nav active':'nav'}><FaThLarge/> Dashboard</div>
                <div onClick={()=>setActive('users')} className={active==='users'?'nav active':'nav'}><FaUsers/> Commuters</div>
                <div onClick={()=>setActive('sos')} className={active==='sos'?'nav active':'nav'}><FaShieldAlt/> SOS Alerts</div>
                <div onClick={()=>setActive('trash')} className={active==='trash'?'nav active':'nav'}><FaUndo/> Recycle Bin</div>
                <div className="logout" onClick={()=>{localStorage.removeItem('esakay_user'); navigate('/')}}><FaSignOutAlt/> Logout</div>
            </aside>
            <main className="main">
                <header className="top"><h2>Admin Panel</h2> <span>Welcome, {user?.name} (admin)</span></header>
                <div className="content">
                    {active === 'dash' && (
                        <div className="grid-stats">
                            <div className="card"><h4>{data.users.length}</h4><p>Total Users</p></div>
                            <div className="card full"><h3>Live Trip Logs</h3>
                            <table><thead><tr><th>User</th><th>Route</th><th>Fare</th><th>Action</th></tr></thead>
                            <tbody>{data.trips.filter(t=>!t.isDeleted).map(t=>(<tr key={t._id}><td>{t.userName}</td><td>{t.origin}-{t.destination}</td><td>₱{t.fare}</td><td><FaTrash onClick={()=>moveToTrash(t._id)} style={{color:'red', cursor:'pointer'}}/></td></tr>))}</tbody></table></div>
                        </div>
                    )}
                    {active === 'users' && (
                        <div className="card"><h3>Manage Users</h3>
                        <table><thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>{data.users.filter(u=>u.role==='user').map(u=>(<tr key={u._id}><td>{u.name}</td><td>{u.email}</td><td>{u.status}</td>
                        <td><button className="btn-app" onClick={()=>updateStatus(u._id, 'approved')}><FaCheck/></button> <button className="btn-rej" onClick={()=>updateStatus(u._id, 'rejected')}><FaTimes/></button></td></tr>))}</tbody></table></div>
                    )}
                    {active === 'sos' && (
                        <div className="card"><h3>SOS Center</h3>
                        {data.sos.map(s=>(<div key={s._id} className={`sos-row ${s.status}`}><span><b>{s.userName}</b> needs help!</span>{s.status==='active' ? <button className="btn-sos" onClick={()=>resolveSOS(s._id)}>RESPOND</button> : <span>Handled</span>}</div>))}</div>
                    )}
                    {active === 'trash' && (
                        <div className="card"><h3>Recycle Bin</h3>
                        <table><thead><tr><th>User</th><th>Route</th><th>Fare</th><th>Action</th></tr></thead>
                        <tbody>{data.trips.filter(t=>t.isDeleted).map(t=>(<tr key={t._id}><td>{t.userName}</td><td>{t.origin}-{t.destination}</td><td>₱{t.fare}</td><td><button className="btn-app" onClick={()=>restoreTrip(t._id)}>Restore</button></td></tr>))}</tbody></table></div>
                    )}
                </div>
            </main>
        </div>
    );
};

// --- USER PORTAL ---
const UserPortal = () => {
    const [active, setActive] = useState('dash');
    const [user] = useState(JSON.parse(localStorage.getItem('esakay_user')));
    const [fare, setFare] = useState({ origin: '', destination: '', type: 'Jeepney', res: null });
    const [sosStatus, setSosStatus] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const check = async () => { const res = await axios.get(`${API}/user/sos/status/${user.name}`); setSosStatus(res.data); };
        check(); const i = setInterval(check, 5000); return ()=>clearInterval(i);
    }, [user.name]);

    const handleCalc = async () => {
        const amt = fare.type === 'Jeepney' ? 12 : 25; setFare({...fare, res: amt});
        await axios.post(`${API}/trips`, { userName: user.name, origin: fare.origin, destination: fare.destination, fare: amt, vehicle: fare.type });
    };

    return (
        <div className="portal-layout">
            <aside className="sidebar"><div className="brand">eSakay</div>
                <div onClick={()=>setActive('dash')} className={active==='dash'?'nav active':'nav'}><FaHome/> Dashboard</div>
                <div onClick={()=>setActive('fare')} className={active==='fare'?'nav active':'nav'}><FaCalculator/> Fare Calc</div>
                <div onClick={()=>setActive('sos')} className={active==='sos'?'nav active':'nav'}><FaShieldAlt/> Safety</div>
                <div className="logout" onClick={()=>{localStorage.removeItem('esakay_user'); navigate('/')}}><FaSignOutAlt/> Logout</div>
            </aside>
            <main className="main">
                <header className="top"><h2>User Portal</h2> <span>Welcome, {user?.name}</span></header>
                <div className="content">
                    {active === 'dash' && (
                        <div className="card"><h1>Home Feed</h1>
                        {sosStatus?.status === 'resolved' && <div className="notif resolved">✅ SOS Handled by Admin.</div>}
                        {sosStatus?.status === 'active' && <div className="notif active">⚠️ SOS is Active. Help is coming.</div>}
                        <p>Welcome to eSakay Gensan Smart Platform.</p></div>
                    )}
                    {active === 'fare' && (
                        <div className="card"><h3>Fare Calculator</h3>
                        <input className="portal-input" placeholder="From" onChange={e=>setFare({...fare, origin:e.target.value})}/>
                        <input className="portal-input" placeholder="To" onChange={e=>setFare({...fare, destination:e.target.value})}/>
                        <select className="portal-input" onChange={e=>setFare({...fare, type:e.target.value})}><option value="Jeepney">Jeepney</option><option value="Tricycle">Tricycle</option></select>
                        <button className="portal-btn" onClick={handleCalc}>Calculate & Save</button>
                        {fare.res && <h2>Fare: ₱{fare.res}.00</h2>}</div>
                    )}
                    {active === 'sos' && (
                        <div className="card text-center"><h2>Emergency SOS</h2><button className="btn-sos-trigger" onClick={async()=>{await axios.post(`${API}/sos`, {userName:user.name, location:"GenSan Area"}); alert("SOS Sent!");}}>SEND SOS</button></div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default function App() {
    return (<Router><Routes><Route path="/" element={<Login />} /><Route path="/register" element={<Register />} /><Route path="/admin" element={<AdminPortal />} /><Route path="/user" element={<UserPortal />} /></Routes></Router>);
}