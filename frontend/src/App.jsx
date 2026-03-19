import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { FaHome, FaCalculator, FaShieldAlt, FaUsers, FaBolt, FaSignOutAlt, FaThLarge, FaCheck, FaTimes, FaTrash, FaBars } from 'react-icons/fa';
import './App.css';

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
        <div className="auth-bg"><div className="auth-card">
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
        <div className="auth-bg"><div className="auth-card"><h2>Sign Up</h2>
            <form onSubmit={handleReg}>
                <input className="input-field" placeholder="Full Name" onChange={e=>setForm({...form, name:e.target.value})} required/>
                <input className="input-field" type="email" placeholder="Email" onChange={e=>setForm({...form, email:e.target.value})} required/>
                <input className="input-field" type="password" placeholder="Password" onChange={e=>setForm({...form, password:e.target.value})} required/>
                <select className="input-field" onChange={e=>setForm({...form, role:e.target.value})}><option value="user">User</option><option value="admin">Admin</option></select>
                <button type="submit" className="btn-main">REGISTER</button>
            </form><p onClick={()=>navigate('/')} className="link">Back to Login</p>
        </div></div>
    );
};

const Portal = ({ role }) => {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [active, setActive] = useState('dash');
    const [data, setData] = useState({ users: [], trips: [], sos: [], trash: [] });
    const [user] = useState(JSON.parse(localStorage.getItem('esakay_user')));
    const [fare, setFare] = useState({ origin: '', destination: '', type: 'Jeepney', res: null });
    const [sosNotif, setSosNotif] = useState(null);

    const fetchData = async () => {
        try {
            if(role === 'admin') { const res = await axios.get(`${API}/admin/all`); setData(res.data); } 
            else { const res = await axios.get(`${API}/user/sos/status/${user.name}`); setSosNotif(res.data); }
        } catch(e) {}
    };

    useEffect(() => { if(!user) navigate('/'); fetchData(); const i = setInterval(fetchData, 4000); return ()=>clearInterval(i); }, []);

    const updateStatus = async (id, status) => { await axios.patch(`${API}/admin/users/status/${id}`, { status }); fetchData(); };
    const resolveSOS = async (id) => { await axios.patch(`${API}/admin/sos/resolve/${id}`); fetchData(); };

    return (
        <div className="portal-container">
            <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
                <div className="brand">eSakay</div>
                <div className="nav-group">
                    <div onClick={()=>{setActive('dash'); setMenuOpen(false)}} className={active==='dash'?'nav-item active':'nav-item'}><FaThLarge/> Dashboard</div>
                    {role === 'admin' ? (
                        <><div onClick={()=>{setActive('users'); setMenuOpen(false)}} className={active==='users'?'nav-item active':'nav-item'}><FaUsers/> Commuters</div>
                        <div onClick={()=>{setActive('sos'); setMenuOpen(false)}} className={active==='sos'?'nav-item active':'nav-item'}><FaShieldAlt/> SOS Alerts</div></>
                    ) : (
                        <><div onClick={()=>{setActive('fare'); setMenuOpen(false)}} className={active==='fare'?'nav-item active':'nav-item'}><FaCalculator/> Fare Calc</div>
                        <div onClick={()=>{setActive('safety'); setMenuOpen(false)}} className={active==='safety'?'nav-item active':'nav-item'}><FaShieldAlt/> Safety</div></>
                    )}
                </div>
                <div className="logout" onClick={()=>{localStorage.removeItem('esakay_user'); navigate('/')}}><FaSignOutAlt/> Logout</div>
            </aside>

            <main className="main-content">
                <header className="mobile-header">
                    <FaBars onClick={()=>setMenuOpen(!menuOpen)} className="burger"/>
                    <span>eSakay Portal</span>
                    <div className="user-badge">{user?.name[0]}</div>
                </header>

                <div className="view-padding">
                    {active === 'dash' && (
                        role === 'admin' ? (
                            <div className="stats-grid">
                                <div className="card-stat"><h3>{data.users.length}</h3><p>Total Users</p></div>
                                <div className="card-stat"><h3>{data.trips.length}</h3><p>Live Trips</p></div>
                            </div>
                        ) : (
                            <div className="card"><h1>Hello, {user?.name}!</h1>
                            {sosNotif?.status === 'resolved' && <div className="notif ok">✅ SOS Handled by Admin.</div>}
                            {sosNotif?.status === 'active' && <div className="notif wait">⚠️ SOS Active. Help is coming.</div>}
                            <p>Manage your GenSan commute smartly.</p></div>
                        )
                    )}

                    {active === 'users' && (
                        <div className="card scroll-x">
                            <h3>Commuters List</h3>
                            <table>
                                <thead><tr><th>Name</th><th>Status</th><th>Action</th></tr></thead>
                                <tbody>{data.users.filter(u=>u.role==='user').map(u=>(<tr key={u.id}><td>{u.name}</td><td>{u.status}</td>
                                <td><button className="btn-s" onClick={()=>updateStatus(u.id, 'approved')}><FaCheck/></button></td></tr>))}</tbody>
                            </table>
                        </div>
                    )}

                    {active === 'fare' && (
                        <div className="card">
                            <h3>Fare Calculator</h3>
                            <input className="input-field" placeholder="From" onChange={e=>setFare({...fare, origin:e.target.value})}/>
                            <input className="input-field" placeholder="To" onChange={e=>setFare({...fare, destination:e.target.value})}/>
                            <button className="btn-main" onClick={async()=>{const amt=fare.type==='Jeepney'?12:25; setFare({...fare, res:amt}); await axios.post(`${API}/trips`, {userName:user.name, origin:fare.origin, destination:fare.destination, fare:amt});}}>Compute</button>
                            {fare.res && <h2 className="res-fare">Fare: ₱{fare.res}.00</h2>}
                        </div>
                    )}

                    {active === 'safety' && (
                        <div className="card center">
                            <h2>EMERGENCY</h2>
                            <button className="btn-sos-huge" onClick={async()=>{await axios.post(`${API}/sos`, {userName:user.name}); alert("SOS Sent!");}}>SOS</button>
                        </div>
                    )}

                    {active === 'sos' && (
                        <div className="card">
                            <h3>SOS Monitoring</h3>
                            {data.sos.map(s=>(<div key={s.id} className="sos-box"><span>{s.userName} needs help!</span>{s.status==='active' && <button onClick={()=>resolveSOS(s.id)}>RESOLVE</button>}</div>))}
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