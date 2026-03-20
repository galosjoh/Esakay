import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { FaHome, FaCalculator, FaShieldAlt, FaUsers, FaBolt, FaSignOutAlt, FaThLarge, FaCheck, FaTimes, FaTrash, FaUndo, FaBars, FaUserCircle } from 'react-icons/fa';
import './App.css';

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// --- AUTH COMPONENTS (LOGIN/REGISTER) ---
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
            <FaBolt size={50} color="#0056b3"/><h1>eSakay Login</h1>
            <form onSubmit={handleLogin}>
                <input className="portal-input-border" type="email" placeholder="Email Address" onChange={e=>setForm({...form, email:e.target.value})} required/>
                <input className="portal-input-border" type="password" placeholder="Password" onChange={e=>setForm({...form, password:e.target.value})} required/>
                <button type="submit" className="login-submit">LOG IN</button>
            </form><p onClick={()=>navigate('/register')} className="toggle-link">Create new account</p>
        </div></div>
    );
};

const Register = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
    const handleReg = async (e) => {
        e.preventDefault();
        try { const res = await axios.post(`${API}/register`, form); alert(res.data.message); navigate('/'); } 
        catch (e) { alert("Email already taken"); }
    };
    return (
        <div className="auth-fullscreen"><div className="auth-card"><h2>Sign Up</h2>
            <form onSubmit={handleReg}>
                <input className="portal-input-border" placeholder="Full Name" onChange={e=>setForm({...form, name:e.target.value})} required/>
                <input className="portal-input-border" type="email" placeholder="Email" onChange={e=>setForm({...form, email:e.target.value})} required/>
                <input className="portal-input-border" type="password" placeholder="Password" onChange={e=>setForm({...form, password:e.target.value})} required/>
                <select className="portal-input-border" onChange={e=>setForm({...form, role:e.target.value})}><option value="user">User</option><option value="admin">Admin</option></select>
                <button type="submit" className="login-submit">REGISTER</button>
            </form><p onClick={()=>navigate('/')} className="toggle-link">Back to Login</p>
        </div></div>
    );
};

// --- MAIN PORTAL COMPONENT (RESPONSIVE) ---
const Portal = ({ role }) => {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false); // Mobile menu state
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
    const deleteTrip = async (id) => { await axios.patch(`${API}/admin/trips/delete/${id}`); refresh(); };
    const restoreTrip = async (id) => { await axios.patch(`${API}/admin/trips/restore/${id}`); refresh(); };

    return (
        <div className="portal-container">
            {/* Sidebar with Mobile Support */}
            <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
                <div className="brand">eSakay PORTAL</div>
                <div className="user-section-side"><FaUserCircle size={40}/> <p>{user?.name}</p></div>
                <nav className="nav-menu">
                    <div onClick={()=>{setActive('dash'); setMenuOpen(false)}} className={active==='dash'?'nav-btn act':'nav-btn'}><FaThLarge/> Dashboard</div>
                    {role === 'admin' ? (
                        <><div onClick={()=>{setActive('u'); setMenuOpen(false)}} className={active==='u'?'nav-btn act':'nav-btn'}><FaUsers/> Commuters</div>
                        <div onClick={()=>{setActive('s'); setMenuOpen(false)}} className={active==='s'?'nav-btn act':'nav-btn'}><FaShieldAlt/> SOS Alerts</div>
                        <div onClick={()=>{setActive('t'); setMenuOpen(false)}} className={active==='t'?'nav-btn act':'nav-btn'}><FaUndo/> Recycle Bin</div></>
                    ) : (
                        <><div onClick={()=>{setActive('f'); setMenuOpen(false)}} className={active==='f'?'nav-btn act':'nav-btn'}><FaCalculator/> Fare Calc</div>
                        <div onClick={()=>{setActive('sa'); setMenuOpen(false)}} className={active==='sa'?'nav-btn act':'nav-btn'}><FaShieldAlt/> Safety</div></>
                    )}
                </nav>
                <div className="logout" onClick={()=>{localStorage.removeItem('esakay_user'); navigate('/')}}><FaSignOutAlt/> Logout</div>
            </aside>

            {/* Main Area */}
            <main className="main-content">
                <header className="mobile-bar">
                    <FaBars className="burger" onClick={()=>setMenuOpen(!menuOpen)}/>
                    <span>eSakay Gensan</span>
                    <div className="u-circle">{user?.name[0]}</div>
                </header>

                <div className="inner-view">
                    {active === 'dash' && (
                        role === 'admin' ? (
                            <div className="stats-container">
                                <div className="stat-card"><h2>{data.users.length}</h2><p>Registered</p></div>
                                <div className="stat-card full-w"><h3>Live Trip Logs</h3>
                                <div className="table-wrapper"><table><thead><tr><th>Name</th><th>Fare</th><th>Action</th></tr></thead>
                                <tbody>{data.trips.map(t=>(<tr key={t.id}><td>{t.userName}</td><td>₱{t.fare}</td><td><FaTrash color="red" onClick={()=>deleteTrip(t.id)}/></td></tr>))}</tbody></table></div></div>
                            </div>
                        ) : (
                            <div className="card">
                                <h1>Welcome, {user?.name}!</h1>
                                {sosNotif?.status === 'resolved' && <div className="notif-bar success">✅ Your SOS was handled by Admin.</div>}
                                {sosNotif?.status === 'active' && <div className="notif-bar alert">⚠️ Emergency SOS is ACTIVE.</div>}
                                <p>This portal is fully synced with eSakay Cloud Database.</p>
                            </div>
                        )
                    )}

                    {active === 'u' && (
                        <div className="card table-wrapper">
                            <h3>User Approval</h3>
                            <table><thead><tr><th>Name</th><th>Status</th><th>Action</th></tr></thead>
                            <tbody>{data.users.filter(u=>u.role==='user').map(u=>(<tr key={u.id}><td>{u.name}</td><td>{u.status}</td>
                            <td><button className="btn-approve" onClick={()=>updateStatus(u.id, 'approved')}><FaCheck/></button></td></tr>))}</tbody></table>
                        </div>
                    )}

                    {active === 'f' && (
                        <div className="card">
                            <h3>Fare Calculator</h3>
                            <input className="portal-input-border" placeholder="From (Origin)" onChange={e=>setFare({...fare, from:e.target.value})}/>
                            <input className="portal-input-border" placeholder="To (Destination)" onChange={e=>setFare({...fare, to:e.target.value})}/>
                            <button className="login-submit" onClick={async()=>{setFare({...fare, res: 12}); await axios.post(`${API}/trips`, {userName:user.name, origin:fare.from, destination:fare.to, fare:12}); alert("Saved!");}}>Compute & Save</button>
                            {fare.res && <h2 style={{marginTop:'20px'}}>Estimated Fare: ₱{fare.res}.00</h2>}
                        </div>
                    )}

                    {active === 'sa' && (
                        <div className="card center">
                            <h2>EMERGENCY SOS</h2>
                            <button className="sos-btn-trigger" onClick={async()=>{await axios.post(`${API}/sos`, {userName:user.name}); alert("SOS ALERT SENT!");}}>SEND SOS</button>
                        </div>
                    )}

                    {active === 's' && (
                        <div className="card"><h3>Emergency Monitor</h3>
                        {data.sos.map(s=>(<div key={s.id} className="sos-row-card"><span><b>{s.userName}</b> needs help!</span>{s.status==='active' && <button onClick={()=>resolveSOS(s.id)}>RESOLVE</button>}</div>))}</div>
                    )}

                    {active === 't' && (
                        <div className="card table-wrapper"><h3>Recycle Bin</h3>
                        <table><thead><tr><th>Name</th><th>Action</th></tr></thead>
                        <tbody>{data.trash.map(t=>(<tr key={t.id}><td>{t.userName}</td><td><button onClick={()=>restoreTrip(t.id)}>Restore</button></td></tr>))}</tbody></table></div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default function App() {
    return (<Router><Routes><Route path="/" element={<Login />} /><Route path="/register" element={<Register />} /><Route path="/admin" element={<Portal role="admin" />} /><Route path="/user" element={<Portal role="user" />} /></Routes></Router>);
}