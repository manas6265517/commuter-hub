import { useState, useEffect } from 'react';

function App() {
  // Authentication State
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [isLoginView, setIsLoginView] = useState(true);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });

  // Trip State
  const [trips, setTrips] = useState([]);
  const [formData, setFormData] = useState({
    startStation: 'Raigarh', endStation: 'Raipur', trainName: 'Janshatabdi Express', travelDate: '', ticketCost: 150
  });

  // --- AUTHENTICATION FUNCTIONS ---
  const handleAuthChange = (e) => setAuthForm({ ...authForm, [e.target.name]: e.target.value });

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    const endpoint = isLoginView ? '/api/auth/login' : '/api/auth/signup';
    
    fetch(`http://localhost:5000${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(authForm)
    })
    .then(res => res.json())
    .then(data => {
      if (data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
      } else if (data.message === 'User created successfully') {
        setIsLoginView(true); // Switch to login after signup
        alert('Signup successful! Please log in.');
      } else {
        alert(data.message); // Show errors like "Invalid credentials"
      }
    })
    .catch(err => console.error("Auth error:", err));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setTrips([]);
  };

  // --- TRIP FUNCTIONS ---
  const fetchTrips = () => {
    fetch('http://localhost:5000/api/trips')
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
    fetch('http://localhost:5000/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    .then(() => {
      fetchTrips(); 
      setFormData({ ...formData, travelDate: '' }); 
    });
  };

  const handleDelete = (id) => {
    fetch(`http://localhost:5000/api/trips/${id}`, { method: 'DELETE' })
    .then(() => fetchTrips());
  };

  // --- RENDER LOGIN/SIGNUP SCREEN ---
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans">
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

  // --- RENDER MAIN DASHBOARD ---
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="relative flex justify-center items-center mb-10 mt-4">
          <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight">
            Commuter Hub 🚆
          </h1>
          <button onClick={handleLogout} className="absolute right-0 bg-slate-800 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400 border border-slate-600 text-white px-4 py-2 rounded-lg transition-all text-sm font-semibold shadow-md">
            Logout
          </button>
        </div> 
        {/* Analytics Dashboard */}
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
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">Log a New Trip</h2>
          <form onSubmit={handleTripSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input type="text" name="startStation" value={formData.startStation} onChange={handleTripChange} placeholder="Start Station" required className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"/>
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

        <h2 className="text-3xl font-bold text-center text-slate-200 mb-8 border-b border-slate-700 pb-4">My Travel History</h2>
        
        {trips.length === 0 ? (
          <p className="text-center text-slate-400 text-lg">No trips logged yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trips.map((trip) => (
              <div key={trip._id} className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 hover:border-blue-500/50 transition-colors group relative">
                <button onClick={() => handleDelete(trip._id)} className="absolute top-4 right-4 text-slate-500 hover:text-red-500 bg-slate-900 hover:bg-red-500/10 p-2 rounded-md transition-all opacity-0 group-hover:opacity-100" title="Delete trip">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                </button>
                <h3 className="text-xl font-bold text-blue-400 mb-4 pr-8">{trip.startStation} → {trip.endStation}</h3>
                <div className="space-y-2 text-slate-300">
                  <p className="flex justify-between items-center bg-slate-900/50 px-3 py-2 rounded-md"><span className="text-slate-500 text-sm">Train</span><span className="font-medium">{trip.trainName}</span></p>
                  <p className="flex justify-between items-center bg-slate-900/50 px-3 py-2 rounded-md"><span className="text-slate-500 text-sm">Cost</span><span className="font-medium text-emerald-400">₹{trip.ticketCost}</span></p>
                  <p className="flex justify-between items-center bg-slate-900/50 px-3 py-2 rounded-md"><span className="text-slate-500 text-sm">Date</span><span className="font-medium">{new Date(trip.travelDate).toLocaleDateString()}</span></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;