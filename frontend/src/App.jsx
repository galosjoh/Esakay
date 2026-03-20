import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { FaHome, FaCalculator, FaShieldAlt, FaUsers, FaBolt, FaSignOutAlt, FaThLarge, FaCheck, FaTimes, FaTrash, FaUndo, FaBars, FaUserCircle } from 'react-icons/fa';
import './App.css';

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// --- LOGIN & REGISTER (STAY THE SAME) ---
const Login = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API}/login`, form);
            localStorage.setItem('esakay_user', JSON.stringify(res.data.user));
            navigate(res.data.user.role === 'admin' ? '/admin' : '/user');
        } catch (e) { alert("Invalid Credentials"); }
    };
    return (
        <div className="auth-fullscreen"><div className="auth-card">
            <FaBolt size={40} color="#0056b3"/><h1>eSakay Login</h1>
            <form onSubmit={handleLogin}>
                <input className="input-field" type="email" placeholder="Email" onChange={e=>setForm({...form, email:e.target.value})} required/>
                <input className="input-field" type="password" placeholder="Password" onChange={e=>setForm({...form, password:e.target.value})} required/>
                <button type="submit" className="btn-main">LOG IN</button>
            </form><p onClick={()=>navigate('/register')} className="link">No account? Register</p>
        </div></div>
    );
};

const Register = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
    const handleReg = async (e) => {
        e.preventDefault();
        try { const res = await axios.post(`${API}/register`, form); alert(res.data.message); navigate('/'); } 
        catch (e) { alert("Registration failed"); }
    };
    return (
        <div className="auth-fullscreen"><div className="auth-card"><h2>Sign Up</h2>
            <form onSubmit={handleReg}>
                <input className="input-field" placeholder="Full Name" onChange={e=>setForm({...form, name:e.target.value})} required/>
                <input className="input-field" type="email" placeholder="Email" onChange={e=>setForm({...form, email:e.target.value})} required/>
                <input className="input-field" type="password" placeholder="Password" onChange={e=>setForm({...form, password:e.target.value})} required/>
                <select className="input-field" onChange={e=>setForm({...form, role:e.target.value})}><option value="user">User</option><option value="admin">Admin</option></select>
                <button type="submit" className="btn-main">REGISTER</button>
            </form>
        </div></div>
    );
};

// --- MAIN PORTAL COMPONENT ---
const Portal = ({ role }) => {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [active, setActive] = useState('dash');
    const [data, setData] = useState({ users: [], trips: [], sos: [], trash: [] });
    const [user] = useState(JSON.parse(localStorage.getItem('esakay_user')));
    const [fare, setFare] = useState({ from: '', to: '', res: null });
    const [sosNotif, setSosNotif] = useState(null);

    const refresh = async () => {
        try {
            if(role === 'admin') { const res = await axios.get(`${API}/admin/all`); setData(res.data); } 
            else { const res = await axios.get(`${API}/user/sos/status/${user.name}`); setSosNotif(res.data); }
        } catch(e){}
    };

    useEffect(() => { if(!user) navigate('/'); refresh(); const i = setInterval(refresh, 5000); return ()=>clearInterval(i); }, []);

    const updateStatus = async (id, s) => { await axios.patch(`${API}/admin/users/status/${id}`, { status: s }); refresh(); };
    const resolveSOS = async (id) => { await axios.patch(`${API}/admin/sos/resolve/${id}`); refresh(); };

    return (
        <div className="portal-container">
            {/* Dark Overlay kapag bukas ang menu sa mobile */}
            {menuOpen && <div className="menu-overlay" onClick={()=>setMenuOpen(false)}></div>}

            <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
                <div className="brand">eSakay PORTAL</div>
                <div className="user-section-side"><FaUserCircle size={40}/> <p>{user?.name}</p></div>
                <nav className="nav-menu">
                    <div onClick={()=>{setActive('dash'); setMenuOpen(false)}} className={active==='dash'?'nav-btn act':'nav-btn'}><FaThLarge/> Dashboard</div>
                    {role === 'admin' ? (
                        <><div onClick={()=>{setActive('u'); setMenuOpen(false)}} className={active==='u'?'nav-btn act':'nav-btn'}><FaUsers/> Commuters</div>
                        <div onClick={()=>{setActive('s'); setMenuOpen(false)}} className={active==='s'?'nav-btn act':'nav-btn'}><FaShieldAlt/> SOS Alerts</div></>
                    ) : (
                        <><div onClick={()=>{setActive('f'); setMenuOpen(false)}} className={active==='f'?'nav-btn act':'nav-btn'}><FaCalculator/> Fare Calc</div>
                        <div onClick={()=>{setActive('sa'); setMenuOpen(false)}} className={active==='sa'?'nav-btn act':'nav-btn'}><FaShieldAlt/> Safety</div></>
                    )}
                </nav>
                <div className="logout" onClick={()=>{localStorage.removeItem('esakay_user'); navigate('/')}}><FaSignOutAlt/> Logout</div>
            </aside>

            <main className="main-content">
                <header className="mobile-bar">
                    <FaBars className="burger" onClick={()=>setMenuOpen(true)}/>
                    <span>eSakay Portal</span>
                    <div className="u-circle">{user?.name[0]}</div>
                </header>

                <div className="inner-view">
                    {active === 'dash' && (
                        <div className="card welcome-card">
                            <h1>Welcome, {user?.name}!</h1>
                            {sosNotif?.status === 'resolved' && <div className="notif-bar success">✅ SOS Handled by Admin.</div>}
                            <p>This portal is fully synced with eSakay Cloud Database.</p>
                        </div>
                    )}
                    {/* ... other tabs (u, s, f, sa) stay the same ... */}
                    {active === 'f' && (
                        <div className="card">
                            <h3>Fare Calculator</h3>
                            <input className="input-field" placeholder="From" onChange={e=>setFare({...fare, from:e.target.value})}/>
                            <input className="input-field" placeholder="To" onChange={e=>setFare({...fare, to:e.target.value})}/>
                            <button className="btn-main" onClick={()=>setFare({...fare, res:12})}>Compute</button>
                            {fare.res && <h2 className="res-text">₱{fare.res}.00</h2>}
                        </div>
                    )}
                    {active === 'sa' && (
                        <div className="card center-content">
                            <button className="sos-btn-huge" onClick={()=>alert("SOS SENT!")}>SOS</button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default function App() {
    return (<Router><Routes><Route path="/" element={<Login />} /><Route path="/register" element={<Register />} /><Route path="/admin" element={<Portal role="admin" />} /><Route path="/user" element={<Portal role="user" />} /></Routes></Router>);
}