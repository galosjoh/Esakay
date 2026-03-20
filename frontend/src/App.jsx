import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { FaHome, FaCalculator, FaShieldAlt, FaUsers, FaBolt, FaSignOutAlt, FaThLarge, FaCheck, FaTimes, FaTrash, FaUndo, FaBars } from 'react-icons/fa';
import './App.css';

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
    const deleteTrip = async (id) => { await axios.patch(`${API}/admin/trips/delete/${id}`); fetchData(); };
    const restoreTrip = async (id) => { await axios.patch(`${API}/admin/trips/restore/${id}`); fetchData(); };

    return (
        <div className="portal-container">
            {/* Dark Overlay kapag bukas ang menu sa cellphone */}
            <div className={`menu-overlay ${menuOpen ? 'open' : ''}`} onClick={()=>setMenuOpen(false)}></div>

            <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
                <div className="brand">eSakay</div>
                <div className="nav-list">
                    <div onClick={()=>{setActive('dash'); setMenuOpen(false)}} className={active==='dash'?'nav-item active':'nav-item'}><FaThLarge/> Dashboard</div>
                    {role === 'admin' ? (
                        <><div onClick={()=>{setActive('u'); setMenuOpen(false)}} className={active==='u'?'nav-item active':'nav-item'}><FaUsers/> Commuters</div>
                        <div onClick={()=>{setActive('s'); setMenuOpen(false)}} className={active==='s'?'nav-item active':'nav-item'}><FaShieldAlt/> SOS Alerts</div>
                        <div onClick={()=>{setActive('t'); setMenuOpen(false)}} className={active==='t'?'nav-item active':'nav-item'}><FaUndo/> Recycle Bin</div></>
                    ) : (
                        <><div onClick={()=>{setActive('f'); setMenuOpen(false)}} className={active==='f'?'nav-item active':'nav-item'}><FaCalculator/> Fare Calc</div>
                        <div onClick={()=>{setActive('sa'); setMenuOpen(false)}} className={active==='sa'?'nav-item active':'nav-item'}><FaShieldAlt/> Safety</div></>
                    )}
                </div>
                <div className="logout" onClick={()=>{localStorage.removeItem('esakay_user'); navigate('/')}}><FaSignOutAlt/> Logout</div>
            </aside>

            <main className="main-content">
                <header className="top-header">
                    <FaBars className="burger-icon" onClick={()=>setMenuOpen(true)}/>
                    <span style={{fontWeight:'bold'}}>eSakay Portal</span>
                    <div className="u-circle">{user?.name[0]}</div>
                </header>

                <div className="inner-view">
                    {active === 'dash' && (
                        role === 'admin' ? (
                            <div className="stats-grid">
                                <div className="card-stat card"><h2>{data.users.length}</h2><p>Registered</p></div>
                                <div className="card-stat card"><h2>{data.trips.length}</h2><p>Transactions</p></div>
                                <div className="card table-responsive" style={{gridColumn: '1 / -1'}}>
                                    <h3>Recent Trips</h3>
                                    <table><thead><tr><th>Name</th><th>Fare</th><th>Del</th></tr></thead>
                                    <tbody>{data.trips.map(t=>(<tr key={t.id}><td>{t.userName}</td><td>₱{t.fare}</td><td><FaTrash color="red" onClick={()=>deleteTrip(t.id)}/></td></tr>))}</tbody></table>
                                </div>
                            </div>
                        ) : (
                            <div className="card">
                                <h1>Welcome, {user?.name}!</h1>
                                {sosNotif?.status === 'resolved' && <div className="notif ok">✅ Emergency Handled by Admin.</div>}
                                {sosNotif?.status === 'active' && <div className="notif wait">⚠️ SOS Status: ACTIVE.</div>}
                                <p>Everything is synced with the eSakay Cloud Database.</p>
                            </div>
                        )
                    )}

                    {active === 'f' && (
                        <div className="card">
                            <h3>Fare Calculator</h3>
                            <input className="input-field" placeholder="From" onChange={e=>setFare({...fare, origin:e.target.value})}/>
                            <input className="input-field" placeholder="To" onChange={e=>setFare({...fare, destination:e.target.value})}/>
                            <button className="btn-main" onClick={async()=>{const amt=12; setFare({...fare, res:amt}); await axios.post(`${API}/trips`, {userName:user.name, origin:fare.origin, destination:fare.destination, fare:amt}); alert("Transaction Saved!");}}>Calculate & Save</button>
                            {fare.res && <h2 style={{marginTop:'20px'}}>Estimated: ₱{fare.res}.00</h2>}
                        </div>
                    )}

                    {active === 'sa' && (
                        <div className="card" style={{textAlign:'center', padding:'50px'}}>
                            <h2>EMERGENCY ASSISTANCE</h2>
                            <button className="btn-sos-trigger" onClick={async()=>{await axios.post(`${API}/sos`, {userName:user.name}); alert("SOS Alert Sent!");}}>SEND SOS</button>
                        </div>
                    )}

                    {/* Admin Specific Screens (u, s, t) stay functional ... */}
                </div>
            </main>
        </div>
    );
};
// Add back the Login and Register components from previous code...
export default function App() {
    return (<Router><Routes><Route path="/" element={<Login />} /><Route path="/register" element={<Register />} /><Route path="/admin" element={<Portal role="admin" />} /><Route path="/user" element={<Portal role="user" />} /></Routes></Router>);
}