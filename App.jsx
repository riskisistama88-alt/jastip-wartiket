import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  setDoc, 
  getDoc,
  query,
  timestamp
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken 
} from 'firebase/auth';
import { 
  User, 
  Phone, 
  IdCard, 
  Calendar, 
  Map, 
  ChevronRight, 
  Settings, 
  LogOut, 
  Trash2, 
  CheckCircle,
  AlertCircle,
  CreditCard,
  Image as ImageIcon,
  Users
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'tamagoxh-jastip';

const App = () => {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('customer'); // 'customer' | 'admin-login' | 'admin-dashboard'
  const [loading, setLoading] = useState(true);
  const [adminPassword, setAdminPassword] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [config, setConfig] = useState({
    concertTitle: "THE WORLD TOUR 2024",
    layoutUrl: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&q=80&w=1000",
    categories: ["CAT 1 (VIP)", "CAT 2", "CAT 3", "CAT 4", "CAT 5"],
    paymentMethods: ["Bank BCA", "Mandiri", "E-Wallet (Dana/OVO)", "QRIS"]
  });

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    nik: '',
    gender: '',
    birthDate: '',
    choice1: '',
    choice2: '',
    paymentMethod: ''
  });

  const [status, setStatus] = useState({ type: '', message: '' });

  // --- Auth & Data Fetching ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth Error:", err);
      }
    };
    initAuth();

    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Fetch Config
  useEffect(() => {
    if (!user) return;
    const configDoc = doc(db, 'artifacts', appId, 'public', 'data', 'config');
    const unsub = onSnapshot(configDoc, (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data());
      }
    }, (err) => console.error("Config fetch error:", err));
    return () => unsub();
  }, [user]);

  // Fetch Submissions (Only for Admin)
  useEffect(() => {
    if (!user || view !== 'admin-dashboard') return;
    const subCol = collection(db, 'artifacts', appId, 'public', 'data', 'submissions');
    const unsub = onSnapshot(subCol, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubmissions(data);
    }, (err) => console.error("Submissions fetch error:", err));
    return () => unsub();
  }, [user, view]);

  // --- Handlers ---
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    // Simple Validation
    if (formData.nik.length !== 16) {
      setStatus({ type: 'error', message: 'NIK harus berjumlah 16 digit!' });
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'submissions'), {
        ...formData,
        submittedAt: new Date().toISOString(),
        status: 'pending'
      });
      setStatus({ type: 'success', message: 'Data berhasil terkirim! Tamagoxh akan segera menghubungi Anda.' });
      setFormData({
        fullName: '', email: '', phone: '', nik: '', gender: '', birthDate: '', choice1: '', choice2: '', paymentMethod: ''
      });
    } catch (err) {
      setStatus({ type: 'error', message: 'Gagal mengirim data. Silakan coba lagi.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    // In a real app, this would be a proper auth check.
    if (adminPassword === 'admin123') {
      setView('admin-dashboard');
      setStatus({ type: '', message: '' });
    } else {
      setStatus({ type: 'error', message: 'Password salah!' });
    }
  };

  const updateConfig = async (newConfig) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config'), newConfig);
      setStatus({ type: 'success', message: 'Konfigurasi berhasil diperbarui!' });
    } catch (err) {
      setStatus({ type: 'error', message: 'Gagal memperbarui konfigurasi.' });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">T</div>
            <h1 className="font-bold text-lg tracking-tight text-indigo-900">tamagoxh <span className="text-slate-400 font-normal">| Jastip War</span></h1>
          </div>
          <button 
            onClick={() => setView(view === 'customer' ? 'admin-login' : 'customer')}
            className="text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-indigo-600 transition-colors"
          >
            {view === 'customer' ? 'Admin Access' : 'Back to Form'}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-8">
        
        {/* Alerts */}
        {status.message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
            status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
          }`}>
            {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <p className="text-sm font-medium">{status.message}</p>
            <button className="ml-auto" onClick={() => setStatus({type:'', message:''})}>×</button>
          </div>
        )}

        {/* CUSTOMER VIEW */}
        {view === 'customer' && (
          <div className="space-y-8 animate-in fade-in duration-700">
            {/* Hero Section */}
            <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 overflow-hidden relative">
              <div className="relative z-10">
                <h2 className="text-3xl font-extrabold mb-2 leading-tight">Secure Your Spot!</h2>
                <p className="text-indigo-100 max-w-md">Isi form pendaftaran jastip war tiket konser <span className="font-bold underline decoration-indigo-300">{config.concertTitle}</span> dengan data yang benar.</p>
              </div>
              <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            {/* Layout Display */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2"><Map size={18} className="text-indigo-600"/> Seat Plan / Layout</h3>
              </div>
              <div className="p-4">
                <img 
                  src={config.layoutUrl} 
                  alt="Concert Layout" 
                  className="w-full h-auto rounded-lg shadow-inner object-cover max-h-[400px]"
                  onError={(e) => e.target.src = "https://placehold.co/600x400?text=Layout+Not+Available"}
                />
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Data Diri Section */}
                <div className="md:col-span-2">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Informasi Pribadi</h4>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Nama Lengkap</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input required name="fullName" value={formData.fullName} onChange={handleInputChange} type="text" placeholder="Sesuai KTP" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Nomor HP / WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input required name="phone" value={formData.phone} onChange={handleInputChange} type="tel" placeholder="08xxxx" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">NIK (16 Digit)</label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input required name="nik" value={formData.nik} onChange={handleInputChange} type="number" placeholder="32xxxxxxxxxxxx" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Jenis Kelamin</label>
                  <select required name="gender" value={formData.gender} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none">
                    <option value="">Pilih...</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Tanggal Lahir <span className="text-slate-400 font-normal italic">(Opsional)</span></label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input name="birthDate" value={formData.birthDate} onChange={handleInputChange} type="date" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Email Aktif</label>
                  <input required name="email" value={formData.email} onChange={handleInputChange} type="email" placeholder="example@mail.com" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                {/* Tiket Section */}
                <div className="md:col-span-2 pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Pilihan Tiket</h4>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Kategori Pilihan 1</label>
                  <select required name="choice1" value={formData.choice1} onChange={handleInputChange} className="w-full px-4 py-3 bg-indigo-50/30 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">Pilih Kategori...</option>
                    {config.categories.map((cat, idx) => <option key={idx} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Kategori Pilihan 2</label>
                  <select required name="choice2" value={formData.choice2} onChange={handleInputChange} className="w-full px-4 py-3 bg-indigo-50/30 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">Pilih Kategori...</option>
                    {config.categories.map((cat, idx) => <option key={idx} value={cat}>{cat}</option>)}
                  </select>
                  <p className="text-[10px] text-slate-400 leading-tight">Note: Pilihan 2 digunakan jika pilihan 1 sudah full booked/sold out.</p>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2"><CreditCard size={16}/> Metode Pembayaran</label>
                  <select required name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">Pilih Metode...</option>
                    {config.paymentMethods.map((pm, idx) => <option key={idx} value={pm}>{pm}</option>)}
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] disabled:opacity-70"
              >
                {loading ? 'Processing...' : 'Kirim Data Jastip Sekarang'}
                <ChevronRight size={20} />
              </button>
            </form>

            {/* Footer Form */}
            <div className="text-center text-slate-400 text-sm space-y-2">
              <p>© 2024 Jastip War Tiket by tamagoxh</p>
              <p className="text-xs">Data Anda dijamin aman dan hanya digunakan untuk keperluan booking tiket.</p>
            </div>
          </div>
        )}

        {/* ADMIN LOGIN */}
        {view === 'admin-login' && (
          <div className="max-w-md mx-auto mt-20 animate-in zoom-in duration-300">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold mb-6 text-center">Admin Access</h2>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Admin Password</label>
                  <input 
                    type="password" 
                    value={adminPassword} 
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" 
                    placeholder="Enter password..."
                  />
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors">
                  Login to Dashboard
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ADMIN DASHBOARD */}
        {view === 'admin-dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Admin Dashboard</h2>
                <p className="text-slate-500">Manage submissions and configuration</p>
              </div>
              <button onClick={() => setView('customer')} className="p-2 text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors">
                <LogOut size={20} />
              </button>
            </div>

            {/* Tabs (Simple Toggle for simplicity) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Config Section */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-fit">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2 font-bold">
                  <Settings size={18} /> Edit Website Config
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Judul Konser</label>
                    <input 
                      type="text" 
                      value={config.concertTitle} 
                      onChange={(e) => setConfig({...config, concertTitle: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Layout URL (Foto)</label>
                    <input 
                      type="text" 
                      value={config.layoutUrl} 
                      onChange={(e) => setConfig({...config, layoutUrl: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <button 
                    onClick={() => updateConfig(config)}
                    className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>

              {/* Stats Section */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-center space-y-2">
                <Users size={48} className="text-indigo-600 mb-2" />
                <h3 className="text-4xl font-black text-indigo-900">{submissions.length}</h3>
                <p className="text-slate-500 font-medium">Total Pendaftar</p>
              </div>
            </div>

            {/* Submissions Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2"><Users size={18} className="text-indigo-600"/> Data Pendaftar Jastip</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase text-[10px] tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Nama / WhatsApp</th>
                      <th className="px-6 py-4">NIK</th>
                      <th className="px-6 py-4">Pilihan Tiket (1 & 2)</th>
                      <th className="px-6 py-4">Payment</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {submissions.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">Belum ada data pendaftar.</td>
                      </tr>
                    ) : (
                      submissions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{sub.fullName}</div>
                            <div className="text-indigo-600 text-xs">{sub.phone}</div>
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-500">{sub.nik}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] w-fit font-bold">1: {sub.choice1}</span>
                              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] w-fit font-bold">2: {sub.choice2}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{sub.paymentMethod}</td>
                          <td className="px-6 py-4">
                            <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-[10px] font-bold uppercase">{sub.status}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;