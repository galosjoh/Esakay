import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { FaHome, FaCalculator, FaShieldAlt, FaUsers, FaBolt, FaSignOutAlt, FaThLarge, FaCheck, FaTimes, FaTrash, FaBars } from 'react-icons/fa';
import './App.css';

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
        } catch (e) { alert("Invalid Credentials"); }
    };
    return (
        <div className="auth-bg"><div className="auth-card">
            <FaBolt size={40} color="#0056b3"/><h1>eSakay Login</h1>
            <form onSubmit={handleLogin}>
                <input className="input-field" type="email" placeholder="Email" onChange={e=>setForm({...form, email:e.target.value})} required/>
                <input className="input-field" type="password" placeholder="Password" onChange={e=>setForm({...form, password:e.target.value})} required/>
                <button type="submit" className="btn-main">LOG IN</button>
            </form><p onClick={()=>navigate('/register')} style={{marginTop:'15px', cursor:'pointer', color:'#0056b3'}}>New here? Register</p>
        </div></div>
    );
};

// --- REGISTER ---
const Register = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
    const handleReg = async (e) => {
        e.preventDefault();
        try { const res = await axios.post(`${API}/register`, form); alert(res.data.message); navigate('/'); } 
        catch (e) { alert("Email already taken"); }
    };
    return (
        <div className="auth-bg"><div className="auth-card"><h2>Sign Up</h2>
            <form onSubmit={handleReg}>
                <input className="input-field" placeholder="Full Name" onChange={e=>setForm({...form, name:e.target.value})} required/>
                <input className="input-field" type="email" placeholder="Email Address" onChange={e=>setForm({...form, email:e.target.value})} required/>
                <input className="input-field" type="password" placeholder="Password" onChange={e=>setForm({...form, password:e.target.value})} required/>
                <select className="input-field" onChange={e=>setForm({...form, role:e.target.value})}><option value="user">User</option><option value="admin">Admin</option></select>
                <button type="submit" className="btn-main">CREATE ACCOUNT</button>
            </form>
        </div></div>
    );
};

// --- MAIN PORTAL (RESPONSIVE) ---
const Portal = ({ role }) => {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [active, setActive] = useState('dash');
    const [data, setData] = useState({ users: [], trips: [], sos: [] });
    const [user] = useState(JSON.parse(localStorage.getItem('esakay_user')));
    const [fare, setFare] = useState({ origin: '', destination: '', res: null });

    const fetchData = async () => {
        try { if(role === 'admin') { const res = await axios.get(`${API}/admin/all`); setData(res.data); } } catch(e) {}
    };

    useEffect(() => { if(!user) navigate('/'); fetchData(); }, []);

    return (
        <div className="portal-container">
            {/* Sidebar */}
            <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
                <div className="brand" style={{color: '#00c853'}}>eSakay PORTAL</div>
                <div className="nav-group">
                    <div onClick={()=>{setActive('dash'); setMenuOpen(false)}} className={active==='dash'?'nav-item active':'nav-item'}><FaThLarge/> Dashboard</div>
                    {role === 'admin' ? (
                        <div onClick={()=>{setActive('users'); setMenuOpen(false)}} className={active==='users'?'nav-item active':'nav-item'}><FaUsers/> Commuters</div>
                    ) : (
                        <><div onClick={()=>{setActive('fare'); setMenuOpen(false)}} className={active==='fare'?'nav-item active':'nav-item'}><FaCalculator/> Fare Calc</div>
                        <div onClick={()=>{setActive('sos'); setMenuOpen(false)}} className={active==='sos'?'nav-item active':'nav-item'}><FaShieldAlt/> SOS</div></>
                    )}
                </div>
                <div className="logout" onClick={()=>{localStorage.removeItem('esakay_user'); navigate('/')}}><FaSignOutAlt/> Logout</div>
            </aside>

            {/* Main Area */}
            <main className="main-content">
                <header className="mobile-header">
                    <FaBars size={24} onClick={()=>setMenuOpen(!menuOpen)}/>
                    <b style={{color: '#2a5298'}}>eSakay</b>
                    <div className="user-badge">{user?.name[0]}</div>
                </header>

                <div className="view-padding">
                    {active === 'dash' && (
                        <div className="card">
                            <h1>Welcome, {user?.name}!</h1>
                            <p>Current Role: <b style={{color:'green'}}>{user?.role}</b></p>
                            <p style={{marginTop: '10px'}}>The system is optimized for your {window.innerWidth < 768 ? 'Mobile' : 'Desktop'} device.</p>
                        </div>
                    )}

                    {active === 'fare' && (
                        <div className="card">
                            <h3>Fare Calculator</h3>
                            <input className="input-field" placeholder="From" onChange={e=>setFare({...fare, origin:e.target.value})}/>
                            <input className="input-field" placeholder="To" onChange={e=>setFare({...fare, destination:e.target.value})}/>
                            <button className="btn-main" onClick={()=>setFare({...fare, res: 12})}>Calculate</button>
                            {fare.res && <h2 style={{marginTop: '20px', color: '#0056b3'}}>Fare: ₱{fare.res}.00</h2>}
                        </div>
                    )}

                    {active === 'sos' && (
                        <div className="card" style={{textAlign:'center', padding:'40px 10px'}}>
                            <h2>EMERGENCY</h2>
                            <p style={{marginBottom: '20px'}}>Press for 3 seconds to alert Admin</p>
                            <button className="sos-btn-huge" onClick={()=>alert("SOS ALERT SENT!")}>SOS</button>
                        </div>
                    )}
                    
                    {active === 'users' && role === 'admin' && (
                        <div className="card table-responsive">
                            <h3>Registered Users</h3>
                            <table>
                                <thead><tr><th>Name</th><th>Email</th><th>Status</th></tr></thead>
                                <tbody>{data.users.map(u=>(<tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{u.status}</td></tr>))}</tbody>
                            </table>
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