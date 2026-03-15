import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { FaThLarge, FaBell, FaUser, FaSignOutAlt, FaEdit, FaSave, FaTimes, FaUpload, FaLock } from 'react-icons/fa';
import './App.css';

const API = import.meta.env.VITE_API_URL || "https://esakay-backend.onrender.com/api";

// --- LOGIN (CENTERED FULL SCREEN) ---
const Login = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', password: '' });
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API}/login`, form);
            localStorage.setItem('serp_user', JSON.stringify(res.data.user));
            navigate(res.data.user.role === 'admin' ? '/admin' : '/user');
        } catch (e) { alert("Invalid Credentials"); }
    };
    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                <h1 className="logo-red">SERP</h1>
                <p className="logo-sub">SMART EMERGENCY RESPONSE PLATFORM</p>
                <form onSubmit={handleLogin}>
                    <div className="input-box"><FaUser className="i"/><input placeholder="USERNAME" onChange={e=>setForm({...form, username:e.target.value})} required/></div>
                    <div className="input-box"><FaLock className="i"/><input type="password" placeholder="PASSWORD" onChange={e=>setForm({...form, password:e.target.value})} required/></div>
                    <button type="submit" className="portal-btn">LOG IN</button>
                </form>
                <p className="auth-footer">New student? <span onClick={()=>navigate('/register')}>Register here</span></p>
            </div>
        </div>
    );
};

// --- REGISTER (CENTERED FULL SCREEN) ---
const Register = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name:'', email:'', username:'', password:'', role:'user', address:'' });
    const handleReg = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API}/register`, form);
            alert("Account Created!"); navigate('/');
        } catch (e) { alert("Registration Failed"); }
    };
    return (
        <div className="auth-wrapper">
            <div className="auth-card reg-card">
                <h1 className="logo-red small">SERP</h1>
                <h2 style={{marginBottom:'20px'}}>Create Account</h2>
                <form onSubmit={handleReg}>
                    <input className="serp-input" placeholder="FULL NAME" onChange={e=>setForm({...form, name:e.target.value})} required/>
                    <input className="serp-input" placeholder="EMAIL" onChange={e=>setForm({...form, email:e.target.value})} required/>
                    <input className="serp-input" placeholder="ADDRESS" onChange={e=>setForm({...form, address:e.target.value})} required/>
                    <input className="serp-input" placeholder="CREATE USERNAME" onChange={e=>setForm({...form, username:e.target.value})} required/>
                    <input className="serp-input" type="password" placeholder="PASSWORD" onChange={e=>setForm({...form, password:e.target.value})} required/>
                    <button type="button" className="upload-btn"><FaUpload/> UPLOAD ID</button>
                    <select className="serp-input" onChange={e=>setForm({...form, role:e.target.value})}><option value="user">USER / RESIDENT</option><option value="admin">ADMIN / RESPONDER</option></select>
                    <button type="submit" className="portal-btn">SIGN UP</button>
                </form>
                <p className="auth-footer">Have account? <span onClick={()=>navigate('/')}>Login</span></p>
            </div>
        </div>
    );
};

// --- MAIN PORTAL ---
const Portal = ({ role }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('serp_user')));
    const [data, setData] = useState({ emergencies: [], activeCount: 0, respondersCount: 0 });
    const [notif, setNotif] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [profileForm, setProfileForm] = useState({ ...user });

    const fetchData = async () => {
        if(role === 'admin') {
            const res = await axios.get(`${API}/admin/data`);
            setData(res.data);
        } else {
            const res = await axios.get(`${API}/user/sos-status/${user.name}`);
            setNotif(res.data);
        }
    };

    useEffect(() => { 
        if(!user) navigate('/');
        fetchData(); 
        const i = setInterval(fetchData, 4000);
        return () => clearInterval(i);
    }, []);

    const handleUpdateStatus = async (id, status) => {
        await axios.patch(`${API}/admin/emergency/status/${id}`, { status });
        fetchData();
    };

    const handleSaveProfile = async () => {
        const res = await axios.patch(`${API}/user/update/${user._id}`, profileForm);
        localStorage.setItem('serp_user', JSON.stringify(res.data));
        setUser(res.data); setEditMode(false); alert("Updated!");
    };

    return (
        <div className="portal-layout">
            <aside className="sidebar">
                <div className="sidebar-brand">SERP PORTAL</div>
                <div className="sidebar-user"><div className="user-icon-circle"><FaUser/></div><p>{user?.name}</p><small>{role.toUpperCase()}</small></div>
                <div className={`nav-item ${activeTab==='dashboard'?'active':''}`} onClick={()=>setActiveTab('dashboard')}><FaThLarge/> Dashboard</div>
                <div className={`nav-item ${activeTab==='alerts'?'active':''}`} onClick={()=>setActiveTab('alerts')}><FaBell/> Alerts</div>
                <div className={`nav-item ${activeTab==='profile'?'active':''}`} onClick={()=>setActiveTab('profile')}><FaUser/> My Profile</div>
                <div className="logout-btn" onClick={()=>{localStorage.removeItem('serp_user'); navigate('/')}}><FaSignOutAlt/> Logout</div>
            </aside>

            <main className="content-area">
                <header className="top-nav"><h2>{activeTab.toUpperCase()}</h2><div>Welcome, <b>{user?.name}</b></div></header>
                <div className="inner-padding">
                    
                    {activeTab === 'dashboard' && (
                        role === 'admin' ? (
                            <div className="stats-row">
                                <div className="stat-card"><h3>{data.activeCount}</h3><p>Active Emergencies</p></div>
                                <div className="stat-card"><h3>{data.respondersCount}</h3><p>Total Responders</p></div>
                            </div>
                        ) : (
                            <div className="sos-full-view">
                                {notif?.status === 'responded' && <div style={{padding:'15px', background:'#fee2e2', color:'red', borderRadius:'10px', marginBottom:'20px'}}>⚠️ Admin is RESPONDING!</div>}
                                {notif?.status === 'done' && <div style={{padding:'15px', background:'#dcfce7', color:'green', borderRadius:'10px', marginBottom:'20px'}}>✅ Status: COMPLETED</div>}
                                <button className="sos-btn-huge" onClick={async()=>{await axios.post(`${API}/emergency/sos`, {userName:user.name, location:user.address}); alert("SOS SENT!")}}>SOS</button>
                            </div>
                        )
                    )}

                    {activeTab === 'alerts' && (
                        <div className="profile-wrapper">
                            <h3>Live Logs</h3>
                            <div style={{marginTop:'20px'}}>
                                {data.emergencies.map(em=>(
                                    <div key={em._id} className="emergency-item">
                                        <div><p><b>USER:</b> {em.userName}</p><p><b>LOC:</b> {em.location}</p></div>
                                        <div>
                                            {em.status === 'active' && <button className="respond-btn" onClick={()=>handleUpdateStatus(em._id, 'responded')}>RESPOND NOW</button>}
                                            {em.status === 'responded' && <button className="done-btn-green" onClick={()=>handleUpdateStatus(em._id, 'done')}>MARK AS DONE</button>}
                                            {em.status === 'done' && <span style={{color:'green', fontWeight:'bold'}}>CLOSED</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="profile-wrapper">
                            <div className="profile-header-flex">
                                <h2>{role==='admin'?'ADMIN':'USER'} INFORMATION</h2>
                                {!editMode ? <button className="edit-btn-blue" onClick={()=>setEditMode(true)}><FaEdit/> Edit</button> :
                                <div style={{display:'flex', gap:'10px'}}><button className="save-btn-green" onClick={handleSaveProfile}><FaSave/> Save</button><button onClick={()=>setEditMode(false)}><FaTimes/></button></div>}
                            </div>
                            <div className="profile-avatar-large" style={{width:'100px', height:'100px', background:'#eee', borderRadius:'50%', margin:'20px auto'}}></div>
                            <div className="profile-form-grid">
                                <div className="f-box"><label>NAME</label>{editMode ? <input value={profileForm.name} onChange={e=>setProfileForm({...profileForm, name:e.target.value})}/> : <span>{user.name}</span>}</div>
                                <div className="f-box"><label>AGE</label>{editMode ? <input value={profileForm.age} onChange={e=>setProfileForm({...profileForm, age:e.target.value})}/> : <span>{user.age || "28"}</span>}</div>
                                <div className="f-box"><label>GENDER</label>{editMode ? <input value={profileForm.gender} onChange={e=>setProfileForm({...profileForm, gender:e.target.value})}/> : <span>{user.gender || "FEMALE"}</span>}</div>
                                <div className="f-box"><label>ZIP CODE</label>{editMode ? <input value={profileForm.zipCode} onChange={e=>setProfileForm({...profileForm, zipCode:e.target.value})}/> : <span>{user.zipCode || "9500"}</span>}</div>
                                <div className="f-box"><label>BLOOD</label>{editMode ? <input value={profileForm.bloodType} onChange={e=>setProfileForm({...profileForm, bloodType:e.target.value})}/> : <span>{user.bloodType}</span>}</div>
                                <div className="f-box full-w"><label>ADDRESS</label>{editMode ? <input value={profileForm.address} onChange={e=>setProfileForm({...profileForm, address:e.target.value})}/> : <span>{user.address}</span>}</div>
                            </div>
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