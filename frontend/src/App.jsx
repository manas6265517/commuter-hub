import toast, { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function App() {
  // Authentication State
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [isLoginView, setIsLoginView] = useState(true);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });

  // App Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');

  // Trip State
  const [trips, setTrips] = useState([]);
  const [formData, setFormData] = useState({
    startStation: '', endStation: '', trainName: '', travelDate: '', ticketCost: ''
  });
  
  // Edit State
  const [editingTrip, setEditingTrip] = useState(null);

  // Search State
  const [searchTerm, setSearchTerm] = useState('');

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
        setToken(data.token);
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
    setToken('');
    setTrips([]);
    toast.success('Logged out successfully!');
  };

  // --- TRIP FUNCTIONS ---
  const fetchTrips = () => {
    fetch('https://commuter-hub.onrender.com/api/trips')
      .then(res => res.json())
      .then(data => setTrips(data))
      .catch(err => console.error("Error fetching data:", err));
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

  // --- EDIT FUNCTIONS ---
  const handleEditChange = (e) => {
    setEditingTrip({ ...editingTrip, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    fetch(`https://commuter-hub.onrender.com/api/trips/${editingTrip._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingTrip)
    })
    .then(() => {
      fetchTrips();
      setEditingTrip(null);
      toast.success('Trip updated successfully!');
    })
    .catch(() => toast.error('Failed to update trip.'));
  };

  const handleExportCSV = () => {
    if (filteredTrips.length === 0) {
      toast.error("No trips to export!");
      return;
    }

    // 1. Create CSV Headers
    const headers = ['Date', 'Start Station', 'End Station', 'Train Name', 'Ticket Cost (INR)'];

    // 2. Map the data into CSV rows
    const csvRows = filteredTrips.map(trip => {
      const date = new Date(trip.travelDate).toLocaleDateString();
      // Wrap strings in quotes to handle any accidental commas in names
      return `"${date}","${trip.startStation}","${trip.endStation}","${trip.trainName}","${trip.ticketCost}"`;
    });

    // 3. Combine headers and rows
    const csvContent = [headers.join(','), ...csvRows].join('\n');

    // 4. Create a Blob and trigger the download
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

  // --- HELPER FUNCTIONS ---
  const handleQuickFill = (start, end, train, cost) => {
    setFormData({
      ...formData,
      startStation: start,
      endStation: end,
      trainName: train,
      ticketCost: cost
    });
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

  const handleSwapStations = () => {
    setFormData({
      ...formData,
      startStation: formData.endStation,
      endStation: formData.startStation
    });
  };

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
      .map(month => ({
        name: month,
        total: monthlyTotals[month],
        rawDate: new Date(month)
      }))
      .sort((a, b) => a.rawDate - b.rawDate);
  };

  const chartData = getMonthlyData();

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
        <div className="flex justify-center gap-4 mb-10">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('analytics')} 
            className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${activeTab === 'analytics' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500'}`}
          >
            Analytics
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
                {/* Search Bar */}
                <div className="relative w-full md:w-64">
                  <input 
                    type="text" 
                    placeholder="Search trips..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
                
                {/* Export Button */}
                <button 
                  onClick={handleExportCSV} 
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-all text-sm font-semibold shadow-md whitespace-nowrap flex items-center gap-2"
                  title="Download as CSV"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  Export
                </button>
              </div>
            </div>
            
            {filteredTrips.length === 0 ? (
              <p className="text-center text-slate-400 text-lg">
                {trips.length === 0 ? "No trips logged yet." : "No trips match your search."}
              </p>
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
                    <Tooltip 
                      cursor={{ fill: '#334155' }}
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                      itemStyle={{ color: '#34d399', fontWeight: 'bold' }}
                      formatter={(value) => [`₹${value}`, 'Total Spent']}
                    />
                    <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>

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
                <input type="date" name="travelDate" value={editingTrip.travelDate.split('T')[0]} onChange={handleEditChange} required className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                <input type="number" name="ticketCost" value={editingTrip.ticketCost} onChange={handleEditChange} placeholder="Cost (₹)" required className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
              <div className="flex gap-4 mt-6">
                <button type="button" onClick={() => setEditingTrip(null)} className="w-1/2 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-all">
                  Cancel
                </button>
                <button type="submit" className="w-1/2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-500/30 transition-all">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;