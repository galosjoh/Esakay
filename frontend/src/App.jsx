import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { FaHome, FaCalculator, FaShieldAlt, FaUsers, FaBolt, FaSignOutAlt, FaThLarge, FaCheck, FaTimes, FaTrash, FaUndo } from 'react-icons/fa';
import './App.css';

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// --- LOGIN (CENTERED) ---
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
        <div className="auth-full-screen">
            <div className="auth-card">
                <FaBolt size={50} color="#0056b3"/>
                <h1>eSakay Login</h1>
                <form onSubmit={handleLogin}>
                    <input className="serp-input" type="email" placeholder="Email" onChange={e=>setForm({...form, email:e.target.value})} required/>
                    <input className="serp-input" type="password" placeholder="Password" onChange={e=>setForm({...form, password:e.target.value})} required/>
                    <button type="submit" className="login-submit">LOG IN</button>
                </form>
                <p className="toggle-text">New? <span onClick={()=>navigate('/register')}>Create Account</span></p>
            </div>
        </div>
    );
};

// --- REGISTER (CENTERED) ---
const Register = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
    const handleReg = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API}/register`, form);
            alert(res.data.message); navigate('/');
        } catch (e) { alert("Email already taken"); }
    };
    return (
        <div className="auth-full-screen">
            <div className="auth-card">
                <h2>Sign Up</h2>
                <form onSubmit={handleReg}>
                    <input className="serp-input" placeholder="Full Name" onChange={e=>setForm({...form, name:e.target.value})} required/>
                    <input className="serp-input" type="email" placeholder="Email" onChange={e=>setForm({...form, email:e.target.value})} required/>
                    <input className="serp-input" type="password" placeholder="Password" onChange={e=>setForm({...form, password:e.target.value})} required/>
                    <select className="serp-input" onChange={e=>setForm({...form, role:e.target.value})}><option value="user">User</option><option value="admin">Admin</option></select>
                    <button type="submit" className="login-submit">REGISTER</button>
                </form>
                <p className="toggle-text">Have account? <span onClick={()=>navigate('/')}>Login</span></p>
            </div>
        </div>
    );
};

// --- MAIN PORTAL ---
const Portal = ({ role }) => {
    const navigate = useNavigate();
    const [active, setActive] = useState('dash');
    const [data, setData] = useState({ users: [], trips: [], sos: [], trash: [] });
    const [user] = useState(JSON.parse(localStorage.getItem('esakay_user')));
    const [fare, setFare] = useState({ origin: '', destination: '', type: 'Jeepney', res: null });
    const [sosNotif, setSosNotif] = useState(null);

    const fetchData = async () => {
        try {
            if(role === 'admin') {
                const res = await axios.get(`${API}/admin/all`);
                setData(res.data);
            } else {
                const res = await axios.get(`${API}/user/sos/status/${user.name}`);
                setSosNotif(res.data);
            }
        } catch(e) {}
    };

    useEffect(() => { if(!user) navigate('/'); fetchData(); const i = setInterval(fetchData, 4000); return ()=>clearInterval(i); }, []);

    const handleUpdateStatus = async (id, status) => { await axios.patch(`${API}/admin/users/status/${id}`, { status }); fetchData(); };
    const handleResolveSOS = async (id) => { await axios.patch(`${API}/admin/sos/resolve/${id}`); fetchData(); };
    const handleDeleteTrip = async (id) => { await axios.patch(`${API}/admin/trips/delete/${id}`); fetchData(); };
    const handleRestoreTrip = async (id) => { await axios.patch(`${API}/admin/trips/restore/${id}`); fetchData(); };

    const handleCalc = async () => {
        const amt = fare.type === 'Jeepney' ? 12 : 25; setFare({...fare, res: amt});
        await axios.post(`${API}/trips`, { userName: user.name, origin: fare.origin, destination: fare.destination, fare: amt, vehicle: fare.type });
    };

    return (
        <div className="portal-layout">
            <aside className="sidebar">
                <div className="brand">eSakay</div>
                <div onClick={()=>setActive('dash')} className={active==='dash'?'nav active':'nav'}><FaThLarge/> Dashboard</div>
                {role === 'admin' ? (
                    <>
                        <div onClick={()=>setActive('users')} className={active==='users'?'nav active':'nav'}><FaUsers/> Users</div>
                        <div onClick={()=>setActive('sos')} className={active==='sos'?'nav active':'nav'}><FaShieldAlt/> SOS</div>
                        <div onClick={()=>setActive('trash')} className={active==='trash'?'nav active':'nav'}><FaUndo/> Trash</div>
                    </>
                ) : (
                    <>
                        <div onClick={()=>setActive('fare')} className={active==='fare'?'nav active':'nav'}><FaCalculator/> Fare</div>
                        <div onClick={()=>setActive('sos-user')} className={active==='sos-user'?'nav active':'nav'}><FaShieldAlt/> Safety</div>
                    </>
                )}
                <div className="logout" onClick={()=>{localStorage.removeItem('esakay_user'); navigate('/')}}><FaSignOutAlt/> Logout</div>
            </aside>

            <main className="main">
                <header className="top"><h2>{active.toUpperCase()}</h2> <span>Welcome, {user?.name}</span></header>
                <div className="content">
                    {active === 'dash' && (
                        role === 'admin' ? (
                            <div className="grid-stats">
                                <div className="card"><h4>{data.users.length}</h4><p>Users</p></div>
                                <div className="card full"><h3>Recent Trip Logs</h3>
                                <table><thead><tr><th>Name</th><th>Route</th><th>Fare</th><th>Del</th></tr></thead>
                                <tbody>{data.trips.map(t=>(<tr key={t.id}><td>{t.userName}</td><td>{t.origin}-{t.destination}</td><td>₱{t.fare}</td><td><FaTrash onClick={()=>handleDeleteTrip(t.id)} color="red" style={{cursor:'pointer'}}/></td></tr>))}</tbody></table></div>
                            </div>
                        ) : (
                            <div className="card">
                                <h1>eSakay News Feed</h1>
                                {sosNotif?.status === 'resolved' && <div className="notif done">✅ Admin handled your SOS!</div>}
                                {sosNotif?.status === 'active' && <div className="notif busy">⚠️ Help is on the way...</div>}
                                <p>Welcome to eSakay Smart Platform.</p>
                            </div>
                        )
                    )}

                    {active === 'users' && (
                        <div className="card"><h3>User Management</h3>
                        <table><thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>{data.users.filter(u=>u.role==='user').map(u=>(<tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{u.status}</td>
                        <td><button onClick={()=>handleUpdateStatus(u.id, 'approved')}><FaCheck/></button> <button onClick={()=>handleUpdateStatus(u.id, 'rejected')}><FaTimes/></button></td></tr>))}</tbody></table></div>
                    )}

                    {active === 'sos' && (
                        <div className="card"><h3>Emergency Monitoring</h3>
                        {data.sos.map(s=>(<div key={s.id} className={`sos-row ${s.status}`}><span>{s.userName} at {s.location}</span>{s.status==='active' ? <button className="btn-sos" onClick={()=>handleResolveSOS(s.id)}>RESPOND</button> : <span>Done</span>}</div>))}</div>
                    )}

                    {active === 'fare' && (
                        <div className="card"><h3>Fare Calculator</h3>
                        <input className="portal-input-border" placeholder="From" onChange={e=>setFare({...fare, origin:e.target.value})}/>
                        <input className="portal-input-border" placeholder="To" onChange={e=>setFare({...fare, destination:e.target.value})}/>
                        <button className="login-submit" onClick={handleCalc}>Compute</button>{fare.res && <h2>Estimated: ₱{fare.res}.00</h2>}</div>
                    )}

                    {active === 'sos-user' && (
                        <div className="card text-center" style={{padding:'50px'}}>
                            <h2>EMERGENCY SOS</h2>
                            <button className="btn-sos-trigger" onClick={async()=>{await axios.post(`${API}/sos`, {userName:user.name, location:"GenSan Area"}); alert("SOS Sent!");}}>SEND SOS</button>
                        </div>
                    )}

                    {active === 'trash' && (
                        <div className="card"><h3>Deleted Trips</h3>
                        <table><thead><tr><th>User</th><th>Fare</th><th>Action</th></tr></thead>
                        <tbody>{data.trash.map(t=>(<tr key={t.id}><td>{t.userName}</td><td>₱{t.fare}</td><td><button onClick={()=>handleRestoreTrip(t.id)}>Restore</button></td></tr>))}</tbody></table></div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default function App() {
    return (<Router><Routes><Route path="/" element={<Login />} /><Route path="/register" element={<Register />} /><Route path="/admin" element={<Portal role="admin" />} /><Route path="/user" element={<Portal role="user" />} /></Routes></Router>);
}