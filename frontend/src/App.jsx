import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { FaHome, FaCalculator, FaShieldAlt, FaUsers, FaBolt, FaSignOutAlt, FaThLarge, FaCheck, FaTimes, FaTrash, FaUndo, FaBars, FaUserCircle, FaUserEdit } from 'react-icons/fa';
import './App.css';

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Auth = ({ type }) => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name:'', email: '', password: '', role: 'user' });
    const handleAuth = async (e) => {
        e.preventDefault();
        try {
            const endpoint = type === 'login' ? 'login' : 'register';
            const res = await axios.post(`${API}/${endpoint}`, form);
            if (type === 'login') {
                localStorage.setItem('esakay_user', JSON.stringify(res.data.user));
                navigate(res.data.user.role === 'admin' ? '/admin' : '/user');
            } else { alert(res.data.message); navigate('/'); }
        } catch (e) { alert(e.response?.data?.message || "Error"); }
    };
    return (
        <div className="auth-fullscreen"><div className="auth-card">
            <FaBolt size={40} color="#0056b3"/><h1>{type === 'login' ? 'eSakay Login' : 'Create Account'}</h1>
            <form onSubmit={handleAuth}>
                {type === 'reg' && <input className="input-f" placeholder="Full Name" onChange={e=>setForm({...form, name:e.target.value})} required/>}
                <input className="input-f" type="email" placeholder="Email" onChange={e=>setForm({...form, email:e.target.value})} required/>
                <input className="input-f" type="password" placeholder="Password" onChange={e=>setForm({...form, password:e.target.value})} required/>
                {type === 'reg' && <select className="input-f" onChange={e=>setForm({...form, role:e.target.value})}><option value="user">User</option><option value="admin">Admin</option></select>}
                <button type="submit" className="btn-p">{type === 'login' ? 'LOG IN' : 'SIGN UP'}</button>
            </form>
            <p onClick={()=>navigate(type === 'login' ? '/register' : '/')} className="link">{type === 'login' ? 'Create new account' : 'Back to login'}</p>
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
    const [sosNotif, setSosNotif] = useState(null);

    const refresh = async () => {
        try {
            if(role === 'admin') { const res = await axios.get(`${API}/admin/all`); setData(res.data); } 
            else { const res = await axios.get(`${API}/user/sos/status/${user.name}`); setSosNotif(res.data); }
        } catch(e){}
    };

    useEffect(() => { if(!user) navigate('/'); refresh(); const i = setInterval(refresh, 5000); return ()=>clearInterval(i); }, []);

    const updateU = async (id, s) => { await axios.patch(`${API}/admin/users/status/${id}`, { status: s }); refresh(); };
    const resolveS = async (id) => { await axios.patch(`${API}/admin/sos/resolve/${id}`); refresh(); };
    const delT = async (id) => { await axios.patch(`${API}/admin/trips/delete/${id}`); refresh(); };
    const resT = async (id) => { await axios.patch(`${API}/admin/trips/restore/${id}`); refresh(); };

    const handleUpdateInfo = async () => {
        const n = prompt("New Name:", user.name); const e = prompt("New Email:", user.email);
        if(n && e) {
            const res = await axios.patch(`${API}/users/update/${user._id}`, { name: n, email: e });
            localStorage.setItem('esakay_user', JSON.stringify(res.data)); setUser(res.data); alert("Updated!");
        }
    };

    return (
        <div className="portal-container">
            <div className={`overlay ${menu ? 'on' : ''}`} onClick={()=>setMenu(false)}></div>
            <aside className={`sidebar ${menu ? 'open' : ''}`}>
                <div className="brand">eSakay PORTAL</div>
                <div className="side-user"><FaUserCircle size={40}/><p>{user?.name}</p></div>
                <nav>
                    <div onClick={()=>{setActive('dash'); setMenu(false)}} className={active==='dash'?'nav-it act':'nav-it'}><FaThLarge/> Dashboard</div>
                    {role === 'admin' ? (
                        <><div onClick={()=>{setActive('u'); setMenu(false)}} className={active==='u'?'nav-it act':'nav-it'}><FaUsers/> Commuters</div>
                        <div onClick={()=>{setActive('s'); setMenu(false)}} className={active==='s'?'nav-it act':'nav-it'}><FaShieldAlt/> SOS Alerts</div>
                        <div onClick={()=>{setActive('t'); setMenu(false)}} className={active==='t'?'nav-it act':'nav-it'}><FaUndo/> Recycle Bin</div></>
                    ) : (
                        <><div onClick={()=>{setActive('f'); setMenu(false)}} className={active==='f'?'nav-it act':'nav-it'}><FaCalculator/> Fare Calc</div>
                        <div onClick={()=>{setActive('sa'); setMenu(false)}} className={active==='sa'?'nav-it act':'nav-it'}><FaShieldAlt/> Safety Center</div></>
                    )}
                    <div onClick={handleUpdateInfo} className="nav-it"><FaUserEdit/> Update Info</div>
                </nav>
                <div className="logout" onClick={()=>{localStorage.removeItem('esakay_user'); navigate('/')}}><FaSignOutAlt/> Logout</div>
            </aside>

            <main className="main-area">
                <header className="mobile-bar"><FaBars onClick={()=>setMenu(true)}/><span>eSakay Gensan</span><div className="u-badge">{user?.name[0]}</div></header>
                <div className="inner-view">
                    {active === 'dash' && (
                        role === 'admin' ? (
                            <div className="stats-row"><div className="stat-card"><h2>{data.users.length}</h2><p>Total Users</p></div>
                            <div className="stat-card"><h2>{data.trips.length}</h2><p>Total Trips</p></div>
                            <div className="card table-responsive" style={{gridColumn:'1/-1'}}><h3>Live Trip Logs</h3>
                            <table><thead><tr><th>Name</th><th>Fare</th><th>Action</th></tr></thead>
                            <tbody>{data.trips.map(t=>(<tr key={t._id}><td>{t.userName}</td><td>₱{t.fare}</td><td><FaTrash color="red" onClick={()=>delT(t._id)}/></td></tr>))}</tbody></table></div></div>
                        ) : (
                            <div className="card"><h1>Welcome back, {user?.name}!</h1>
                            {sosNotif?.status === 'resolved' && <div className="bar ok">✅ Admin handled your SOS.</div>}
                            {sosNotif?.status === 'active' && <div className="bar wait">⚠️ SOS Alert is currently Active.</div>}
                            <p>Everything is synced to eSakay Cloud Database.</p></div>
                        )
                    )}
                    {active === 'f' && (
                        <div className="card"><h3>Fare Calculator</h3>
                        <input className="input-f" placeholder="From" onChange={e=>setFare({...fare, from:e.target.value})}/>
                        <input className="input-f" placeholder="To" onChange={e=>setFare({...fare, to:e.target.value})}/>
                        <button className="btn-p" onClick={async()=>{const amt=12; setFare({...fare, res:amt}); await axios.post(`${API}/trips`, {userName:user.name, origin:fare.from, destination:fare.to, fare:amt});}}>Calculate & Save</button>
                        {fare.res && <h2 style={{marginTop:'20px'}}>Fare: ₱{fare.res}.00</h2>}</div>
                    )}
                    {active === 'sa' && (
                        <div className="card center"><h2>EMERGENCY SOS</h2><button className="sos-btn-huge" onClick={async()=>{await axios.post(`${API}/sos`, {userName:user.name}); alert("SOS SENT!");}}>SOS</button></div>
                    )}
                    {active === 'u' && (
                        <div className="card table-responsive"><h3>Commuter Management</h3>
                        <table><thead><tr><th>Name</th><th>Status</th><th>Action</th></tr></thead>
                        <tbody>{data.users.filter(u=>u.role==='user').map(u=>(<tr key={u._id}><td>{u.name}</td><td>{u.status}</td><td><button className="btn-p" style={{width:'auto'}} onClick={()=>updateU(u._id, 'approved')}><FaCheck/></button></td></tr>))}</tbody></table></div>
                    )}
                    {active === 's' && (
                        <div className="card"><h3>SOS Monitor</h3>{data.sos.map(s=>(<div key={s._id} className="sos-row"><span>{s.userName} at {s.location}</span>{s.status==='active' && <button className="btn-p" style={{width:'auto', background:'orange'}} onClick={()=>resolveS(s._id)}>DONE</button>}</div>))}</div>
                    )}
                    {active === 't' && (
                        <div className="card table-responsive"><h3>Recycle Bin</h3>
                        <table><thead><tr><th>Name</th><th>Fare</th><th>Action</th></tr></thead>
                        <tbody>{data.trash.map(t=>(<tr key={t._id}><td>{t.userName}</td><td>₱{t.fare}</td><td><button className="btn-p" style={{width:'auto', background:'green'}} onClick={()=>resT(t._id)}><FaUndo/> Restore</button></td></tr>))}</tbody></table></div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default function App() {
    return (<Router><Routes><Route path="/" element={<Auth type="login" />} /><Route path="/register" element={<Auth type="reg" />} /><Route path="/admin" element={<Portal role="admin" />} /><Route path="/user" element={<Portal role="user" />} /></Routes></Router>);
}