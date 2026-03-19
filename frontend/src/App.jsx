import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { FaHome, FaCalculator, FaShieldAlt, FaUsers, FaBolt, FaSignOutAlt, FaThLarge, FaCheck, FaTimes, FaTrash, FaUndo, FaBars, FaUserEdit } from 'react-icons/fa';
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
        } catch (e) { alert("Login Error"); }
    };
    return (
        <div className="auth-fullscreen"><div className="auth-card">
            <FaBolt size={50} color="#0056b3"/><h1>eSakay Portal</h1>
            <form onSubmit={handleLogin}>
                <input className="input-box" type="email" placeholder="Email" onChange={e=>setForm({...form, email:e.target.value})} required/>
                <input className="input-box" type="password" placeholder="Password" onChange={e=>setForm({...form, password:e.target.value})} required/>
                <button type="submit" className="btn-login">LOG IN</button>
            </form><p onClick={()=>navigate('/register')} className="link-text">Create Account</p>
        </div></div>
    );
};

const Register = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
    const handleReg = async (e) => {
        e.preventDefault();
        try { const res = await axios.post(`${API}/register`, form); alert(res.data.message); navigate('/'); } catch (e) { alert("Error"); }
    };
    return (
        <div className="auth-fullscreen"><div className="auth-card"><h2>Sign Up</h2>
            <form onSubmit={handleReg}>
                <input className="input-box" placeholder="Full Name" onChange={e=>setForm({...form, name:e.target.value})} required/>
                <input className="input-box" type="email" placeholder="Email" onChange={e=>setForm({...form, email:e.target.value})} required/>
                <input className="input-box" type="password" placeholder="Password" onChange={e=>setForm({...form, password:e.target.value})} required/>
                <select className="input-box" onChange={e=>setForm({...form, role:e.target.value})}><option value="user">User</option><option value="admin">Admin</option></select>
                <button type="submit" className="btn-login">SIGN UP</button>
            </form>
        </div></div>
    );
};

const Portal = ({ role }) => {
    const navigate = useNavigate();
    const [menu, setMenu] = useState(false);
    const [active, setActive] = useState('dash');
    const [data, setData] = useState({ users: [], trips: [], sos: [], trash: [] });
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('esakay_user')));
    const [fare, setFare] = useState({ from: '', to: '', res: null });
    const [sosMsg, setSosMsg] = useState(null);

    const refresh = async () => {
        try {
            if(role === 'admin') { const res = await axios.get(`${API}/admin/all`); setData(res.data); }
            else { const res = await axios.get(`${API}/user/sos/status/${user.name}`); setSosMsg(res.data); }
        } catch(e){}
    };

    useEffect(() => { if(!user) navigate('/'); refresh(); const i = setInterval(refresh, 5000); return ()=>clearInterval(i); }, []);

    const updateStatus = async (id, s) => { await axios.patch(`${API}/admin/users/status/${id}`, { status: s }); refresh(); };
    const resolveSOS = async (id) => { await axios.patch(`${API}/admin/sos/resolve/${id}`); refresh(); };
    const delTrip = async (id) => { await axios.patch(`${API}/admin/trips/delete/${id}`); refresh(); };
    const resTrip = async (id) => { await axios.patch(`${API}/admin/trips/restore/${id}`); refresh(); };

    const handleCalc = async () => {
        setFare({...fare, res: 12});
        await axios.post(`${API}/trips`, { userName: user.name, origin: fare.from, destination: fare.to, fare: 12 });
    };

    const handleUpdate = async () => {
        const n = prompt("New Name:", user.name); const e = prompt("New Email:", user.email);
        if(n && e) {
            const res = await axios.patch(`${API}/users/update/${user.id}`, { name: n, email: e });
            localStorage.setItem('esakay_user', JSON.stringify(res.data)); setUser(res.data);
        }
    };

    return (
        <div className="portal-frame">
            <aside className={`sidebar ${menu ? 'show' : ''}`}>
                <div className="brand">eSakay</div>
                <div className="nav-list">
                    <div onClick={()=>{setActive('dash'); setMenu(false)}} className={active==='dash'?'item act':'item'}><FaThLarge/> Dashboard</div>
                    {role === 'admin' ? (
                        <><div onClick={()=>{setActive('u'); setMenu(false)}} className={active==='u'?'item act':'item'}><FaUsers/> Commuters</div>
                        <div onClick={()=>{setActive('s'); setMenu(false)}} className={active==='s'?'item act':'item'}><FaShieldAlt/> SOS Alerts</div>
                        <div onClick={()=>{setActive('t'); setMenu(false)}} className={active==='t'?'item act':'item'}><FaUndo/> Trash Bin</div></>
                    ) : (
                        <><div onClick={()=>{setActive('f'); setMenu(false)}} className={active==='f'?'item act':'item'}><FaCalculator/> Fare Calc</div>
                        <div onClick={()=>{setActive('sa'); setMenu(false)}} className={active==='sa'?'item act':'item'}><FaShieldAlt/> Safety</div></>
                    )}
                    <div onClick={handleUpdate} className="item"><FaUserEdit/> Update Info</div>
                </div>
                <div className="logout" onClick={()=>{localStorage.removeItem('esakay_user'); navigate('/')}}><FaSignOutAlt/> Logout</div>
            </aside>

            <main className="main-area">
                <header className="header">
                    <FaBars className="burger" onClick={()=>setMenu(!menu)}/>
                    <h3>{active === 'dash' ? 'Dashboard' : active.toUpperCase()}</h3>
                    <div className="user-icon">{user?.name[0]}</div>
                </header>

                <div className="content">
                    {active === 'dash' && (
                        role === 'admin' ? (
                            <div className="grid">
                                <div className="card-stat"><h2>{data.users.length}</h2><p>Users</p></div>
                                <div className="card full"><h3>Live Trip Logs</h3>
                                <div className="scroll-x"><table><thead><tr><th>Name</th><th>Fare</th><th>Action</th></tr></thead>
                                <tbody>{data.trips.map(t=>(<tr key={t.id}><td>{t.userName}</td><td>₱{t.fare}</td><td><FaTrash color="red" onClick={()=>delTrip(t.id)}/></td></tr>))}</tbody></table></div></div>
                            </div>
                        ) : (
                            <div className="card"><h1>Hi, {user?.name}!</h1>
                            {sosMsg?.status === 'resolved' && <div className="bar ok">✅ Admin handled your emergency.</div>}
                            {sosMsg?.status === 'active' && <div className="bar wait">⚠️ SOS Alert is Active!</div>}
                            <p>Everything is synced to GenSan Smart Transpo.</p></div>
                        )
                    )}

                    {active === 'u' && (
                        <div className="card"><h3>Manage Users</h3>
                        <div className="scroll-x"><table><thead><tr><th>Name</th><th>Status</th><th>Action</th></tr></thead>
                        <tbody>{data.users.filter(u=>u.role==='user').map(u=>(<tr key={u.id}><td>{u.name}</td><td>{u.status}</td>
                        <td><button className="btn-ok" onClick={()=>updateStatus(u.id, 'approved')}><FaCheck/></button></td></tr>))}</tbody></table></div></div>
                    )}

                    {active === 's' && (
                        <div className="card"><h3>SOS Monitor</h3>
                        {data.sos.map(s=>(<div key={s.id} className="sos-row"><span><b>{s.userName}</b> needs help!</span>{s.status==='active' && <button onClick={()=>resolveSOS(s.id)}>RESOLVE</button>}</div>))}</div>
                    )}

                    {active === 'f' && (
                        <div className="card"><h3>Fare Calculator</h3>
                        <input className="input-box" placeholder="From" onChange={e=>setFare({...fare, from:e.target.value})}/>
                        <input className="input-box" placeholder="To" onChange={e=>setFare({...fare, to:e.target.value})}/>
                        <button className="btn-login" onClick={handleCalc}>Calculate</button>
                        {fare.res && <h2 style={{marginTop:'20px'}}>Fare: ₱{fare.res}.00</h2>}</div>
                    )}

                    {active === 'sa' && (
                        <div className="card text-center"><h2>EMERGENCY SOS</h2>
                        <button className="btn-sos-trigger" onClick={async()=>{await axios.post(`${API}/sos`, {userName:user.name}); alert("SOS SENT!");}}>SEND SOS</button></div>
                    )}

                    {active === 't' && (
                        <div className="card"><h3>Recycle Bin</h3>
                        <div className="scroll-x"><table><thead><tr><th>User</th><th>Fare</th><th>Action</th></tr></thead>
                        <tbody>{data.trash.map(t=>(<tr key={t.id}><td>{t.userName}</td><td>₱{t.fare}</td><td><button onClick={()=>resTrip(t.id)}>Restore</button></td></tr>))}</tbody></table></div></div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default function App() {
    return (<Router><Routes><Route path="/" element={<Login />} /><Route path="/register" element={<Register />} /><Route path="/admin" element={<Portal role="admin" />} /><Route path="/user" element={<Portal role="user" />} /></Routes></Router>);
}