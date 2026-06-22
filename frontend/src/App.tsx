import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, ExternalLink, ShoppingBag, Sparkles, Scissors, TrendingDown, Bell, User, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const ShinyText = ({ text }: { text: string }) => {
  return (
    <span className="relative inline-block overflow-hidden bg-gradient-to-r from-transparent via-white/80 to-transparent bg-[length:200%_100%] bg-clip-text text-transparent animate-shine font-bold">
      {text}
    </span>
  );
};

export default function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);

  // Auth State
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Background Task Polling
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (jobId && loading) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`http://localhost:8000/api/results/${jobId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'completed') {
              setResults(data.results);
              setLoading(false);
              setJobId(null);
              fetchHistory();
            } else if (data.status === 'failed') {
              setError(data.error);
              setLoading(false);
              setJobId(null);
            }
          }
        } catch (err) {
          console.error(err);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [jobId, loading]);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/history/${encodeURIComponent(query)}`);
      const data = await res.json();
      setHistory(data.history || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    setError('');
    setResults([]);
    setHistory([]);

    try {
      const res = await fetch('http://localhost:8000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setJobId(data.job_id);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  const copyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    alert(`Coupon ${code} copied to clipboard!`);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = authMode === 'login' ? '/api/login' : '/api/register';
      const res = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.detail || 'Auth failed');
      
      if (authMode === 'login') {
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
        setShowAuthModal(false);
      } else {
        alert('Registered successfully! Please log in.');
        setAuthMode('login');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  const handleTrack = async (targetPrice: number) => {
    if (!token) {
      setShowAuthModal(true);
      return;
    }
    try {
      const res = await fetch('http://localhost:8000/api/track', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query, target_price: targetPrice }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      alert(data.message);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 overflow-hidden relative selection:bg-cyan-500/30 font-sans">
      
      {/* Navbar */}
      <nav className="absolute top-0 w-full p-6 flex justify-between items-center z-50">
        <div className="font-black text-xl tracking-tighter text-white">Price<span className="text-cyan-500">Hunter</span>.</div>
        <div>
          {token ? (
            <button onClick={handleLogout} className="px-6 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-full font-medium transition-colors text-sm border border-slate-700/50 flex items-center gap-2">
              <User className="w-4 h-4" /> Logout
            </button>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-full font-medium transition-colors text-sm border border-slate-700/50">
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-md relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-500" />
              <button onClick={() => setShowAuthModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-2xl font-bold mb-2">{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
              <p className="text-slate-400 text-sm mb-8">
                {authMode === 'login' ? 'Sign in to manage your price alerts.' : 'Join to track prices automatically.'}
              </p>

              <form onSubmit={handleAuth} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors" placeholder="you@example.com" />
                </div>
                <div className="mb-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors" placeholder="••••••••" />
                </div>
                <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-3 rounded-xl transition-colors">
                  {authMode === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-slate-400">
                {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
                <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-cyan-400 font-bold hover:underline">
                  {authMode === 'login' ? 'Register' : 'Log In'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Abstract Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/10 blur-[150px] rounded-full pointer-events-none" />

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-24 flex flex-col items-center">
        
        {/* Header */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-md mb-6">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium tracking-wide">Enterprise Level 11 Engine</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-500">
            Find the <ShinyText text="Absolute Lowest" /> Price.
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Powered by Asynchronous Task Queues and Real-Time Scraping.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.form 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          onSubmit={handleSearch} 
          className="w-full max-w-3xl relative group"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
          <div className="relative flex items-center bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl transition-all focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/50">
            <Search className="w-6 h-6 text-slate-400 ml-6" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for any product (e.g., iPhone 15 Pro Max)"
              className="w-full bg-transparent border-none text-xl text-white px-6 py-6 focus:outline-none placeholder:text-slate-600"
            />
            <button 
              type="submit" 
              disabled={loading}
              className="absolute right-3 px-8 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-cyan-50 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
            </button>
          </div>
        </motion.form>

        {/* Error State */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 text-red-400 bg-red-400/10 px-6 py-4 rounded-xl border border-red-400/20">
            {error}
          </motion.div>
        )}

        {/* Loading State */}
        {loading && jobId && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
            className="mt-20 flex flex-col items-center gap-4 text-cyan-400"
          >
            <Loader2 className="w-12 h-12 animate-spin" />
            <p className="animate-pulse font-medium tracking-widest uppercase text-sm">Task queued. Background workers scraping...</p>
          </motion.div>
        )}

        {/* Level 10: Price History Chart */}
        <AnimatePresence>
          {!loading && history.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="w-full mt-16 bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <TrendingDown className="text-cyan-500 w-5 h-5" />
                <h3 className="text-lg font-bold">30-Day Price History</h3>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis domain={['auto', 'auto']} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      itemStyle={{ color: '#22d3ee', fontWeight: 'bold' }}
                    />
                    <Line type="monotone" dataKey="price" stroke="#22d3ee" strokeWidth={3} dot={{ r: 4, fill: '#0f172a', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Grid */}
        <AnimatePresence>
          {!loading && results.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full mt-12"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Found {results.length} deals</h2>
                  <div className="text-sm text-slate-400">Sorted by lowest price</div>
                </div>
                <button 
                  onClick={() => handleTrack(results[0].price_float - 1000)}
                  className="px-6 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl font-bold tracking-wide text-sm flex items-center gap-2 transition-all hover:scale-105"
                >
                  <Bell className="w-4 h-4" /> Track Price Drops
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((res, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={i}
                    className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800 transition-all hover:border-cyan-500/30 overflow-hidden flex flex-col justify-between h-full"
                  >
                    {i === 0 && (
                      <div className="absolute top-0 right-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-bl-xl z-10">
                        BEST DEAL
                      </div>
                    )}

                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <ShoppingBag className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">{res.vendor}</span>
                      </div>
                      <h3 className="font-medium text-lg leading-snug line-clamp-2 group-hover:text-cyan-400 transition-colors">
                        {res.title}
                      </h3>
                    </div>

                    {res.discount && (
                      <div 
                        onClick={() => copyCoupon(res.discount.code)}
                        className="mb-6 relative border-2 border-dashed border-cyan-500/30 rounded-xl p-3 bg-cyan-500/5 cursor-pointer hover:bg-cyan-500/10 hover:border-cyan-500/60 transition-all group/coupon"
                      >
                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-[#020617] rounded-full border-r-2 border-dashed border-cyan-500/30"></div>
                        <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-[#020617] rounded-full border-l-2 border-dashed border-cyan-500/30"></div>
                        
                        <div className="flex items-center justify-between px-2">
                          <div>
                            <div className="text-xs text-cyan-400 font-bold mb-1 flex items-center gap-1">
                              <Scissors className="w-3 h-3" /> USE CODE: {res.discount.code}
                            </div>
                            <div className="text-[10px] text-slate-400 leading-tight">{res.discount.description}</div>
                            <div className="text-[9px] text-slate-500 mt-1 italic">{res.discount.conditions}</div>
                          </div>
                          <div className="text-[10px] font-bold text-cyan-500 opacity-0 group-hover/coupon:opacity-100 transition-opacity bg-cyan-500/20 px-2 py-1 rounded">
                            COPY
                          </div>
                        </div>
                      </div>
                    )}
                    {!res.discount && <div className="mb-6 opacity-0">Spacer</div>}

                    <div className="flex items-end justify-between mt-auto pt-4 border-t border-slate-700/50">
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Current Price</div>
                        <div className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                          {res.price_raw}
                        </div>
                      </div>
                      <a 
                        href={res.link} 
                        target="_blank" 
                        rel="noreferrer"
                        className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-slate-900 transition-all hover:scale-110"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
      
      <style>{`
        @keyframes shine {
          to { background-position: 200% center; }
        }
        .animate-shine {
          animation: shine 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
