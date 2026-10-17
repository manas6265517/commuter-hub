import toast, { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function App() {
  // Authentication State
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userName, setUserName] = useState(localStorage.getItem('userName') || 'Fellow Commuter');
  const [isLoginView, setIsLoginView] = useState(true);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });

  // App Navigation State
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'analytics', 'community'

  // Trip State
  const [trips, setTrips] = useState([]);
  const [formData, setFormData] = useState({
    startStation: '', endStation: '', trainName: '', travelDate: '', ticketCost: ''
  });
  
  // Edit & Search State
  const [editingTrip, setEditingTrip] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Community State
  const [messages, setMessages] = useState([]);
  const [messageForm, setMessageForm] = useState({ text: '', route: '' });

  // Train Status State
  const [trainStatusLoading, setTrainStatusLoading] = useState(false);
  const [trainStatuses, setTrainStatuses] = useState([
    { train: 'Janshatabdi Express', route: 'Raigarh → Raipur', status: 'On Time', delay: '0 mins', lastChecked: 'Just now' },
    { train: 'Janshatabdi Express', route: 'Raipur → Raigarh', status: 'Delayed', delay: '15 mins', lastChecked: '5 mins ago' },
    { train: 'Janshatabdi Express', route: 'Raigarh → Bilaspur', status: 'On Time', delay: '0 mins', lastChecked: '10 mins ago' }
  ]);

  const handleRefreshStatus = () => {
    setTrainStatusLoading(true);
    setTimeout(() => {
      setTrainStatuses(prev => prev.map(t => ({
        ...t,
        lastChecked: 'Just now',
        status: Math.random() > 0.8 ? 'Delayed' : 'On Time'
      })));
      setTrainStatusLoading(false);
      toast.success('Live train statuses updated!');
    }, 1000);
  };

  // --- AUTHENTICATION FUNCTIONS ---
  const handleAuthChange = (e) => setAuthForm({ ...authForm, [e.target.name]: e.target.value });

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    const endpoint = isLoginView ? '/api/auth/login' : '/api/auth/signup';
    
    fetch(`https://commuter-hub.onrender.com${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(authForm)
    })
    .then(res => res.json())
    .then(data => {
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userName', data.user.name || 'Commuter');
        setToken(data.token);
        setUserName(data.user.name || 'Commuter');
        toast.success('Successfully logged in!');
      } else if (data.message === 'User created successfully') {
        setIsLoginView(true);
        toast.success('Signup successful! Please log in.');
      } else {
        toast.error(data.message || 'Authentication failed.'); 
      }
    })
    .catch(err => {
      console.error("Auth error:", err);
      toast.error('Server error. Please try again.');
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    setToken('');
    setUserName('');
    setTrips([]);
    setMessages([]);
    toast.success('Logged out successfully!');
  };

  // --- TRIP FUNCTIONS ---
  const fetchTrips = () => {
    fetch('https://commuter-hub.onrender.com/api/trips')
      .then(res => res.json())
      .then(data => setTrips(data))
      .catch(err => console.error("Error fetching trips:", err));
  };

  useEffect(() => {
    if (token) fetchTrips();
  }, [token]);

  const handleTripChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleTripSubmit = (e) => {
    e.preventDefault();
    fetch('https://commuter-hub.onrender.com/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    .then(() => {
      fetchTrips(); 
      setFormData({ startStation: '', endStation: '', trainName: '', travelDate: '', ticketCost: '' }); 
      toast.success('Trip logged successfully!');
    })
    .catch(() => toast.error('Failed to log trip.'));
  };

  const handleDelete = (id) => {
    fetch(`https://commuter-hub.onrender.com/api/trips/${id}`, { method: 'DELETE' })
    .then(() => {
      fetchTrips();
      toast.success('Trip deleted!');
    })
    .catch(() => toast.error('Failed to delete trip.'));
  };

  const handleEditChange = (e) => setEditingTrip({ ...editingTrip, [e.target.name]: e.target.value });

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const { _id, __v, user, ...updateData } = editingTrip;

    fetch(`https://commuter-hub.onrender.com/api/trips/${_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    })
    .then(async (res) => {
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Server rejected with status ${res.status}`);
      }
      return res.json();
    })
    .then(() => {
      fetchTrips();
      setEditingTrip(null);
      toast.success('Trip updated successfully!');
    })
    .catch((err) => toast.error(`Update failed: ${err.message}`));
  };

  // --- COMMUNITY FUNCTIONS ---
  const fetchMessages = () => {
    fetch('https://commuter-hub.onrender.com/api/messages')
      .then(res => res.json())
      .then(data => setMessages(data))
      .catch(err => console.error("Error fetching messages:", err));
  };

  useEffect(() => {
    if (token && activeTab === 'community') {
      fetchMessages();
      // Optional: Set up a basic poll to refresh messages every 15 seconds
      const interval = setInterval(fetchMessages, 15000);
      return () => clearInterval(interval);
    }
  }, [token, activeTab]);

  const handleMessageChange = (e) => setMessageForm({ ...messageForm, [e.target.name]: e.target.value });

  const handleMessageSubmit = (e) => {
    e.preventDefault();
    fetch('https://commuter-hub.onrender.com/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: userName,
        text: messageForm.text,
        route: messageForm.route
      })
    })
    .then(() => {
      fetchMessages();
      setMessageForm({ ...messageForm, text: '' }); // Clear text, keep route
      toast.success('Message posted!');
    })
    .catch(() => toast.error('Failed to post message.'));
  };

  const handleDeleteMessage = (id) => {
    fetch(`https://commuter-hub.onrender.com/api/messages/${id}`, { method: 'DELETE' })
    .then(async (res) => {
      if (!res.ok) throw new Error('Failed to delete');
      fetchMessages();
      toast.success('Message deleted!');
    })
    .catch(() => toast.error('Failed to delete message.'));
  };

  // --- HELPER FUNCTIONS ---
  const handleQuickFill = (start, end, train, cost) => {
    setFormData({ ...formData, startStation: start, endStation: end, trainName: train, ticketCost: cost });
    toast.success(`Auto-filled: ${start} → ${end}`);
  };

  const getDynamicRoutes = () => {
    const uniqueRoutes = [];
    const seen = new Set();
    trips.forEach(trip => {
      const routeKey = `${trip.startStation}-${trip.endStation}`;
      if (!seen.has(routeKey) && uniqueRoutes.length < 3) {
        seen.add(routeKey);
        uniqueRoutes.push(trip);
      }
    });
    return uniqueRoutes;
  };

  const dynamicRoutes = getDynamicRoutes();
  const handleSwapStations = () => setFormData({ ...formData, startStation: formData.endStation, endStation: formData.startStation });

  const filteredTrips = trips.filter(trip => 
    trip.startStation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.endStation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.trainName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMonthlyData = () => {
    const monthlyTotals = {};
    trips.forEach(trip => {
      if (!trip.travelDate) return;
      const date = new Date(trip.travelDate);
      const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      monthlyTotals[monthYear] = (monthlyTotals[monthYear] || 0) + Number(trip.ticketCost || 0);
    });
    return Object.keys(monthlyTotals)
      .map(month => ({ name: month, total: monthlyTotals[month], rawDate: new Date(month) }))
      .sort((a, b) => a.rawDate - b.rawDate);
  };

  const chartData = getMonthlyData();

  const handleExportCSV = () => {
    if (filteredTrips.length === 0) {
      toast.error("No trips to export!");
      return;
    }
    const headers = ['Date', 'Start Station', 'End Station', 'Train Name', 'Ticket Cost (INR)'];
    const csvRows = filteredTrips.map(trip => {
      const date = new Date(trip.travelDate).toLocaleDateString();
      return `"${date}","${trip.startStation}","${trip.endStation}","${trip.trainName}","${trip.ticketCost}"`;
    });
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Commuter_Hub_Expense_Report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Expense report downloaded!');
  };

  // --- RENDER LOGIN/SIGNUP SCREEN ---
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans">
        <Toaster position="top-center"/>
        <div className="bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700 w-full max-w-md">
          <h1 className="text-3xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-8">
            Commuter Hub 🚆
          </h1>
          <h2 className="text-xl text-white text-center mb-6">{isLoginView ? 'Welcome Back' : 'Create an Account'}</h2>
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {!isLoginView && (
              <input type="text" name="name" value={authForm.name} onChange={handleAuthChange} placeholder="Full Name" required className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500"/>
            )}
            <input type="email" name="email" value={authForm.email} onChange={handleAuthChange} placeholder="Email" required className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500"/>
            <input type="password" name="password" value={authForm.password} onChange={handleAuthChange} placeholder="Password" required className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500"/>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all">
              {isLoginView ? 'Login' : 'Sign Up'}
            </button>
          </form>
          <p className="text-slate-400 text-center mt-6 text-sm">
            {isLoginView ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLoginView(!isLoginView)} className="text-blue-400 hover:text-blue-300 font-semibold underline">
              {isLoginView ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // --- RENDER MAIN LAYOUT ---
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-12 font-sans relative">
      <Toaster position="top-center" />
      <div className="max-w-4xl mx-auto">
        
        {/* Header & Logout */}
        <div className="relative flex justify-center items-center mb-6 mt-4">
          <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight">
            Commuter Hub 🚆
          </h1>
          <button onClick={handleLogout} className="absolute right-0 bg-slate-800 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400 border border-slate-600 text-white px-4 py-2 rounded-lg transition-all text-sm font-semibold shadow-md">
            Logout
          </button>
        </div> 

        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-10">
          <button onClick={() => setActiveTab('dashboard')} className={`px-4 md:px-6 py-2 rounded-full font-semibold transition-all duration-300 text-sm md:text-base ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500'}`}>
            Dashboard
          </button>
          <button onClick={() => setActiveTab('analytics')} className={`px-4 md:px-6 py-2 rounded-full font-semibold transition-all duration-300 text-sm md:text-base ${activeTab === 'analytics' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500'}`}>
            Analytics
          </button>
          <button onClick={() => setActiveTab('community')} className={`px-4 md:px-6 py-2 rounded-full font-semibold transition-all duration-300 text-sm md:text-base ${activeTab === 'community' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500'}`}>
            Community
          </button>
          <button onClick={() => setActiveTab('status')} className={`px-4 md:px-5 py-2 rounded-full font-semibold transition-all duration-300 text-sm md:text-base ${activeTab === 'status' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500'}`}>
            Live Status
          </button>
        </div>


        {/* --- VIEW: DASHBOARD --- */}
        {activeTab === 'dashboard' && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-10 max-w-xl mx-auto">
              <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 text-center flex flex-col justify-center">
                <h3 className="text-slate-400 text-xs md:text-sm font-semibold uppercase tracking-wider mb-1 md:mb-2">Total Trips</h3>
                <p className="text-3xl md:text-4xl font-bold text-blue-400">{trips.length}</p>
              </div>
              <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 text-center flex flex-col justify-center">
                <h3 className="text-slate-400 text-xs md:text-sm font-semibold uppercase tracking-wider mb-1 md:mb-2">Total Spent</h3>
                <p className="text-3xl md:text-4xl font-bold text-emerald-400">
                  ₹{trips.reduce((sum, trip) => sum + Number(trip.ticketCost || 0), 0)}
                </p>
              </div>
            </div>

            <div className="max-w-xl mx-auto bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700 mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4 text-center">Log a New Trip</h2>
              
              {dynamicRoutes.length > 0 && (
                <div className="mb-6">
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-2 text-center font-semibold">Your Recent Routes</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {dynamicRoutes.map((route, index) => (
                      <button 
                        key={index}
                        onClick={() => handleQuickFill(route.startStation, route.endStation, route.trainName, route.ticketCost)} 
                        type="button" 
                        className="bg-slate-900 hover:bg-blue-600/20 border border-slate-700 hover:border-blue-500 text-slate-300 text-xs px-3 py-2 rounded-lg transition-all"
                      >
                        {route.startStation} → {route.endStation}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleTripSubmit} className="space-y-4">
                <div className="flex items-center gap-2">
                  <input type="text" name="startStation" value={formData.startStation} onChange={handleTripChange} placeholder="Start Station" required className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                  <button type="button" onClick={handleSwapStations} className="p-3 bg-slate-800 hover:bg-blue-600/20 border border-slate-600 hover:border-blue-500 rounded-full text-slate-400 hover:text-blue-400 transition-all flex-shrink-0 group" title="Swap Stations">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>
                  </button>
                  <input type="text" name="endStation" value={formData.endStation} onChange={handleTripChange} placeholder="End Station" required className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <input type="text" name="trainName" value={formData.trainName} onChange={handleTripChange} placeholder="Train Name" required className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                <div className="grid grid-cols-2 gap-4">
                  <input type="date" name="travelDate" value={formData.travelDate} onChange={handleTripChange} required className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                  <input type="number" name="ticketCost" value={formData.ticketCost} onChange={handleTripChange} placeholder="Cost (₹)" required className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <button type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-blue-500/30 transition-all duration-300">
                  Save Trip
                </button>
              </form>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b border-slate-700 pb-4">
              <h2 className="text-3xl font-bold text-slate-200 mb-4 md:mb-0">My Travel History</h2>
              
              <div className="flex gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                  <input type="text" placeholder="Search trips..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"/>
                  <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
                
                <button onClick={handleExportCSV} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-all text-sm font-semibold shadow-md whitespace-nowrap flex items-center gap-2" title="Download as CSV">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  Export
                </button>
              </div>
            </div>
            
            {filteredTrips.length === 0 ? (
              <p className="text-center text-slate-400 text-lg">{trips.length === 0 ? "No trips logged yet." : "No trips match your search."}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTrips.map((trip) => (
                  <div key={trip._id} className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 hover:border-blue-500/50 transition-colors group relative">
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => setEditingTrip(trip)} className="text-slate-500 hover:text-blue-400 bg-slate-900 hover:bg-blue-500/10 p-2 rounded-md transition-all" title="Edit trip">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
                      </button>
                      <button onClick={() => handleDelete(trip._id)} className="text-slate-500 hover:text-red-500 bg-slate-900 hover:bg-red-500/10 p-2 rounded-md transition-all" title="Delete trip">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                      </button>
                    </div>
                    <h3 className="text-xl font-bold text-blue-400 mb-4 pr-20">{trip.startStation} → {trip.endStation}</h3>
                    <div className="space-y-2 text-slate-300">
                      <p className="flex justify-between items-center bg-slate-900/50 px-3 py-2 rounded-md"><span className="text-slate-500 text-sm">Train</span><span className="font-medium">{trip.trainName}</span></p>
                      <p className="flex justify-between items-center bg-slate-900/50 px-3 py-2 rounded-md"><span className="text-slate-500 text-sm">Cost</span><span className="font-medium text-emerald-400">₹{trip.ticketCost}</span></p>
                      <p className="flex justify-between items-center bg-slate-900/50 px-3 py-2 rounded-md"><span className="text-slate-500 text-sm">Date</span><span className="font-medium">{new Date(trip.travelDate).toLocaleDateString()}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* --- VIEW: ANALYTICS --- */}
        {activeTab === 'analytics' && (
          <div className="bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700 mb-12">
            <h2 className="text-2xl font-semibold text-white mb-8 text-center border-b border-slate-700 pb-4">Spending Analytics</h2>
            {chartData.length === 0 ? (
              <p className="text-center text-slate-400 text-lg py-12">Log some trips to see your spending trends!</p>
            ) : (
              <div className="h-96 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={14} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={14} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                    <Tooltip cursor={{ fill: '#334155' }} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }} itemStyle={{ color: '#34d399', fontWeight: 'bold' }} formatter={(value) => [`₹${value}`, 'Total Spent']} />
                    <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* --- VIEW: COMMUNITY BOARD --- */}
        {activeTab === 'community' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700 mb-8">
              <h2 className="text-2xl font-semibold text-emerald-400 mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                Commuter Feed
              </h2>
              <p className="text-slate-400 text-sm mb-6">Coordinate shared rides or share travel updates with others.</p>

              {/* Preset Route Chips */}
              <div className="mb-4">
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-2 font-semibold">Quick Select Route:</p>
                <div className="flex flex-wrap gap-2">
                  {['Raigarh to Raipur', 'Raipur to Raigarh', 'Raigarh to Bilapsur'].map((presetRoute, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setMessageForm({ ...messageForm, route: presetRoute })}
                      className="bg-slate-900 hover:bg-emerald-600/20 border border-slate-700 hover:border-emerald-500 text-slate-300 text-xs px-3 py-1.5 rounded-lg transition-all"
                    >
                      {presetRoute}
                    </button>
                  ))}
                </div>
              </div>
              
              <form onSubmit={handleMessageSubmit} className="space-y-4">
                <input 
                  type="text" 
                  name="route" 
                  value={messageForm.route} 
                  onChange={handleMessageChange} 
                  placeholder="Your Route (e.g., Raigarh to Raipur)" 
                  required 
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <textarea 
                  name="text" 
                  value={messageForm.text} 
                  onChange={handleMessageChange} 
                  placeholder="Anyone want to split an auto from the station tonight?" 
                  required 
                  rows="3"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                ></textarea>
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg hover:shadow-emerald-500/30 transition-all">
                  Post Message
                </button>
              </form>
            </div>

            <div className="space-y-4">
              {messages.length === 0 ? (
                <p className="text-center text-slate-500 py-8 border border-dashed border-slate-700 rounded-xl">No messages yet. Be the first to post!</p>
              ) : (
                messages.map(msg => (
                  <div key={msg._id} className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 shadow-md relative group">
                    
                    {/* NEW: Conditional Trash Icon for the logged-in user */}
                    {msg.user === userName && (
                      <button onClick={() => handleDeleteMessage(msg._id)} className="absolute top-4 right-4 text-slate-500 hover:text-red-400 bg-slate-900 hover:bg-red-500/10 p-1.5 rounded-md transition-all opacity-0 group-hover:opacity-100" title="Delete message">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                      </button>
                    )}

                    <div className="flex justify-between items-start mb-3 pr-8">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-emerald-900 text-emerald-400 rounded-full flex items-center justify-center font-bold text-lg border border-emerald-700">
                          {msg.user ? msg.user.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-200">{msg.user || 'Anonymous'}</p>
                          <p className="text-xs text-slate-500">{new Date(msg.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <span className="bg-slate-900 text-blue-400 text-xs font-medium px-3 py-1 rounded-full border border-slate-700">
                        {msg.route}
                      </span>
                    </div>
                    <p className="text-slate-300 ml-13 leading-relaxed pl-1">{msg.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* --- VIEW: LIVE STATUS --- */}
        {activeTab === 'status' && (
          <div className="max-w-2xl mx-auto bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700 mb-12">
            <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
              <div>
                <h2 className="text-2xl font-semibold text-purple-400 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 18v2"/><path d="M18 18v2"/><path d="M2 10h20"/></svg>
                  Train Running Status
                </h2>
                <p className="text-slate-400 text-sm mt-1">Real-time simulation feed for frequent commuter routes.</p>
              </div>
              <button 
                onClick={handleRefreshStatus} 
                disabled={trainStatusLoading}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-all text-sm font-semibold shadow-md flex items-center gap-2"
              >
                {trainStatusLoading ? 'Checking...' : 'Refresh Status'}
              </button>
            </div>

            <div className="space-y-4">
              {trainStatuses.map((item, idx) => (
                <div key={idx} className="bg-slate-900 p-5 rounded-xl border border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{item.train}</h3>
                    <p className="text-sm text-slate-400 mt-0.5">{item.route}</p>
                    <p className="text-xs text-slate-500 mt-1">Checked: {item.lastChecked}</p>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${item.status === 'On Time' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-amber-950 text-amber-400 border-amber-800'}`}>
                        {item.status}
                      </span>
                      {item.delay !== '0 mins' && <p className="text-xs text-amber-400 mt-1">Late by {item.delay}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* --- FLOATING EDIT MODAL --- */}
      {editingTrip && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-600 w-full max-w-md relative">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Edit Trip</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" name="startStation" value={editingTrip.startStation} onChange={handleEditChange} placeholder="Start Station" required className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                <input type="text" name="endStation" value={editingTrip.endStation} onChange={handleEditChange} placeholder="End Station" required className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
              <input type="text" name="trainName" value={editingTrip.trainName} onChange={handleEditChange} placeholder="Train Name" required className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              <div className="grid grid-cols-2 gap-4">
                <input type="date" name="travelDate" value={editingTrip.travelDate ? editingTrip.travelDate.split('T')[0] : ''} onChange={handleEditChange} required className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                <input type="number" name="ticketCost" value={editingTrip.ticketCost} onChange={handleEditChange} placeholder="Cost (₹)" required className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
              <div className="flex gap-4 mt-6">
                <button type="button" onClick={() => setEditingTrip(null)} className="w-1/2 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-all">Cancel</button>
                <button type="submit" className="w-1/2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-500/30 transition-all">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;