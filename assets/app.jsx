const { useState, useMemo, useEffect, useRef } = React;

// --- UI helpers
function Button({ className="", children, onClick, type="button" }) {
  return <button type={type} onClick={onClick} className={`rounded-2xl px-4 py-2 font-medium shadow-sm hover:shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed border ${className}`}>{children}</button>
}
function Card({ className="", children }) {
  return <div className={`rounded-2xl border border-green-200 bg-white dark:bg-gray-900 shadow-sm ${className}`}>{children}</div>;
}
function CardBody({ className="", children }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}
function Input(props) {
  const { className="", ...rest } = props;
  return <input className={`w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-800 dark:border-gray-700 ${className}`} {...rest} />;
}
function Select(props) {
  const { className="", ...rest } = props;
  return <select className={`w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-800 dark:border-gray-700 ${className}`} {...rest} />;
}
const Label = ({children}) => <label className="text-sm text-gray-600 dark:text-gray-300">{children}</label>;

// --- Data
const TABS = [
  { key: "dashboard", label: "Beranda" },
  { key: "nutrisi", label: "Nutrisi" },
  { key: "gula", label: "Pemantauan Gula Darah" },
  { key: "harian", label: "Lacak Gula Harian" },
  { key: "edukasi", label: "Zona Edukasi" },
  { key: "riwayat", label: "Riwayat Pengguna" },
  { key: "pengaturan", label: "Pengaturan" },
];

const CATEGORY_META = [
  { key: "rendah_gula", label: "Rendah Gula" },
  { key: "tinggi_protein", label: "Tinggi Protein" },
  { key: "tinggi_serat", label: "Tinggi Serat" },
  { key: "rendah_karbo", label: "Rendah Karbo" },
];

const MOCK_FOODS = [
  { 
    name: "Greek Yogurt Plain",
    sugar: 4, protein: 17, fiber: 0, carbs: 6, cat: "tinggi_protein",
    img: "https://images.unsplash.com/photo-1580915411954-282cb1c9c450"
  },
  {
    name: "Apel (kecil)",
    sugar: 10, protein: 0, fiber: 2.4, carbs: 14, cat: "rendah_gula",
    img: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce"
  },
  {
    name: "Tahu Kukus",
    sugar: 1, protein: 8, fiber: 0, carbs: 3, cat: "tinggi_protein",
    img: "https://images.unsplash.com/photo-1525755662778-989d0524087e"
  },
  {
    name: "Brokoli Rebus",
    sugar: 2, protein: 3, fiber: 2.6, carbs: 7, cat: "tinggi_serat",
    img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd"
  },
  {
    name: "Oatmeal",
    sugar: 1, protein: 5, fiber: 4, carbs: 27, cat: "tinggi_serat",
    img: "https://images.unsplash.com/photo-1518977956815-dee0061a3a2e"
  },
  {
    name: "Nasi Putih (porsi kecil)",
    sugar: 0, protein: 3, fiber: 0.3, carbs: 36, cat: "rendah_gula",
    img: "https://images.unsplash.com/photo-1603899122634-384f6a03cbf6"
  },
  {
    name: "Dada Ayam Panggang",
    sugar: 0, protein: 31, fiber: 0, carbs: 0, cat: "tinggi_protein",
    img: "https://images.unsplash.com/photo-1604908176997-1251884b08a5"
  },
  {
    name: "Roti Gandum",
    sugar: 3, protein: 4, fiber: 3, carbs: 12, cat: "tinggi_serat",
    img: "https://images.unsplash.com/photo-1542838132-92c53300491e"
  },
  {
    name: "Alpukat",
    sugar: 1, protein: 2, fiber: 7, carbs: 9, cat: "rendah_karbo",
    img: "https://images.unsplash.com/photo-1543353071-873f17a7a088"
  },
];

const toDateKey = (d) => new Date(d).toISOString().slice(0, 10);

// --- Chart component using Chart.js
function LineChartSimple({ dataPoints, labels }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (chartRef.current) {
      chartRef.current.destroy();
    }
    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Gula Darah (mg/dL)',
          data: dataPoints,
          tension: 0.3,
          pointRadius: 3,
          borderWidth: 3,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true }
        },
        scales: {
          y: { min: 70, max: 200 }
        }
      }
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [dataPoints, labels]);

  return <canvas ref={canvasRef} className="w-full h-full"></canvas>;
}

function App() {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("pagari_user");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });
  const [active, setActive] = useState(() => {
    try {
      return localStorage.getItem("pagari_active") || "dashboard";
    } catch (e) {
      return "dashboard";
    }
  });
  const [dark, setDark] = useState(() => {
    try {
      const raw = localStorage.getItem("pagari_dark");
      return raw === "true";
    } catch (e) {
      return false;
    }
  });
  const [showSplash, setShowSplash] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  // Nutrisi
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [userFoods, setUserFoods] = useState(() => {
    try {
      const raw = localStorage.getItem("pagari_userFoods");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  const foods = useMemo(() => {
    const all = [...MOCK_FOODS, ...userFoods];
    return all.filter(
      (f) =>
        (cat === "all" || f.cat === cat) &&
        f.name.toLowerCase().includes(q.toLowerCase())
    );
  }, [cat, q, userFoods]);

  // Gula
  const [gLogs, setGLogs] = useState(() => {
    try {
      const raw = localStorage.getItem("pagari_gLogs");
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [
      { id: 1, time: new Date(Date.now() - 86400000 * 3).toISOString(), value: 98 },
      { id: 2, time: new Date(Date.now() - 86400000 * 2).toISOString(), value: 112 },
      { id: 3, time: new Date(Date.now() - 86400000 * 1).toISOString(), value: 126 },
    ];
  });
  const [gInput, setGInput] = useState({ id: null, value: "", when: toDateKey(new Date()) + "T08:00" });
  const [editingGulaId, setEditingGulaId] = useState(null);

  const saveGula = () => {
    const v = Number(gInput.value);
    if (!v || v <= 0) return;
    const timeIso = new Date(gInput.when).toISOString();
    if (editingGulaId) {
      setGLogs(prev =>
        prev.map(g => (g.id === editingGulaId ? { ...g, value: v, time: timeIso } : g))
      );
      showToast("Perubahan data gula darah disimpan");
    } else {
      setGLogs(prev => [...prev, { id: Date.now(), time: timeIso, value: v }]);
      showToast("Data gula darah ditambahkan");
    }
    setGInput({ id: null, value: "", when: toDateKey(new Date()) + "T08:00" });
    setEditingGulaId(null);
  };

  const startEditGula = (row) => {
    setGInput({ id: row.id, value: String(row.value), when: row.time.slice(0, 16) });
    setEditingGulaId(row.id);
  };

  const deleteGula = (id) => {
    setGLogs(prev => prev.filter(g => g.id !== id));
    if (editingGulaId === id) {
      setGInput({ id: null, value: "", when: toDateKey(new Date()) + "T08:00" });
      setEditingGulaId(null);
    }
    showToast("Data gula darah dihapus");
  };

  const sortedLogs = useMemo(
    () => gLogs.slice().sort((a, b) => new Date(a.time) - new Date(b.time)),
    [gLogs]
  );

  const chartLabels = useMemo(
    () =>
      sortedLogs.map(d =>
        new Date(d.time).toLocaleDateString(undefined, { month: "short", day: "2-digit" })
      ),
    [sortedLogs]
  );
  const chartPoints = useMemo(() => sortedLogs.map(d => d.value), [sortedLogs]);

  const latestVal = gLogs.length ? sortedLogs[sortedLogs.length - 1].value : null;
  const status = latestVal == null ? "" : latestVal < 140 ? "Normal" : latestVal <= 199 ? "Pra-diabetes" : "Diabetes";
  const statusColor =
    latestVal == null
      ? "text-gray-500"
      : latestVal < 140
      ? "text-green-700"
      : latestVal < 200
      ? "text-yellow-600"
      : "text-red-600";

  // Diary
  const DAILY_LIMIT = 25;
  const [diary, setDiary] = useState(() => {
    try {
      const raw = localStorage.getItem("pagari_diary");
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [
      { id: 1, item: "Teh tawar", sugar: 0, date: toDateKey(new Date()) },
      { id: 2, item: "Roti gandum", sugar: 3, date: toDateKey(new Date()) },
    ];
  });
  const [entry, setEntry] = useState({ id: null, item: "", sugar: "", date: toDateKey(new Date()) });
  const [editingDiaryId, setEditingDiaryId] = useState(null);

  const saveDiary = () => {
    const s = Number(entry.sugar);
    if (!entry.item || isNaN(s) || s < 0) return;
    if (editingDiaryId) {
      setDiary(prev =>
        prev.map(d => (d.id === editingDiaryId ? { ...d, item: entry.item, sugar: s, date: entry.date } : d))
      );
      showToast("Perubahan food diary disimpan");
    } else {
      setDiary(prev => [...prev, { id: Date.now(), item: entry.item, sugar: s, date: entry.date }]);
      showToast("Food diary ditambahkan");
    }
    setEntry({ id: null, item: "", sugar: "", date: toDateKey(new Date()) });
    setEditingDiaryId(null);
  };

  const startEditDiary = (row) => {
    if (!row) {
      setEntry({ id: null, item: "", sugar: "", date: toDateKey(new Date()) });
      setEditingDiaryId(null);
      return;
    }
    setEntry({ id: row.id, item: row.item, sugar: String(row.sugar), date: row.date });
    setEditingDiaryId(row.id);
  };

  const deleteDiary = (id) => {
    setDiary(prev => prev.filter(d => d.id !== id));
    if (editingDiaryId === id) {
      setEntry({ id: null, item: "", sugar: "", date: toDateKey(new Date()) });
      setEditingDiaryId(null);
    }
    showToast("Food diary dihapus");
  };

  const quickAddDiaryFromFood = (food) => {
    const today = toDateKey(new Date());
    const sugarVal = Number(food.sugar) || 0;
    setDiary(prev => [
      ...prev,
      {
        id: Date.now(),
        item: food.name,
        sugar: sugarVal,
        date: today,
      },
    ]);
    showToast(`Ditambahkan: ${food.name} (${sugarVal}g gula)`);
  };

  const todayKey = toDateKey(new Date());
  const todaySugar = diary.filter(d => d.date === todayKey).reduce((a,b)=>a+b.sugar, 0);
  const pct = Math.min(100, Math.round((todaySugar / DAILY_LIMIT) * 100));

  // Pengingat
  const [reminders, setReminders] = useState(() => {
    try {
      const raw = localStorage.getItem("pagari_reminders");
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [{ id: 1, text: "Minum obat pagi", when: toDateKey(new Date()) + " 07:00" }];
  });
  const [rem, setRem] = useState({ text: "", when: toDateKey(new Date()) + " 07:00" });
  const addReminder = () => {
    if (!rem.text) return;
    setReminders(r => [...r, { id: Date.now(), text: rem.text, when: rem.when }]);
    setRem({ text: "", when: toDateKey(new Date()) + " 07:00" });
  };

  // Auth (mock)
  const [auth, setAuth] = useState({ mode: "login", name: "", phone: "", email: "", password: "", gender: "" });
  const loggedIn = !!user;

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (dark) html.classList.add("dark"); else html.classList.remove("dark");
  }, [dark]);

  return (
    <div className="min-h-screen">
      {showSplash && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-white dark:bg-gray-950">
          <div className="flex flex-col items-center gap-3">
            <img src="./assets/logo-pagari.png" alt="PAGARI" className="h-16 w-16 rounded-3xl object-contain bg-green-50" />
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">PAGARI</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Pemantauan gula darah & nutrisi harian</div>
          </div>
        </div>
      )}
      <header className="sticky top-0 z-20 backdrop-blur bg-white/70 dark:bg-gray-900/70 border-b border-green-100 dark:border-gray-800">
        <div className="mx-auto max-w-6xl flex items-center justify-between p-3 gap-4">
          <div className="flex items-center gap-3">
            <img src="./assets/logo-pagari.png" alt="PAGARI" className="h-9 w-9 rounded-2xl object-contain bg-green-50" />
            <div className="font-extrabold text-xl tracking-tight">PAGARI</div>
            <span className="ml-2 rounded-full bg-green-100 dark:bg-green-900/40 px-2 py-0.5 text-xs text-green-700 dark:text-green-200">BETA 0.0.1</span>
          </div>
          <div className="flex items-center gap-2">
            <Button className="bg-white dark:bg-gray-800" onClick={() => setDark(d => !d)}>{dark ? "Light" : "Dark"}</Button>
            {loggedIn ? (
              <>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-green-200 bg-white dark:bg-gray-800 lg:hidden"
                  onClick={() => setShowMenu((v) => !v)}
                >
                  <span className="sr-only">Buka menu</span>
                  <div className="space-y-1.5">
                    <span className="block h-0.5 w-5 rounded-full bg-green-600"></span>
                    <span className="block h-0.5 w-5 rounded-full bg-green-600"></span>
                    <span className="block h-0.5 w-5 rounded-full bg-green-600"></span>
                  </div>
                </button>
                <Button className="hidden lg:inline-flex" onClick={() => { setUser(null); setActive("dashboard"); }}>Keluar</Button>
              </>
            ) : (
              <>
                <Button className="bg-green-600 text-white" onClick={() => setAuth(a => ({...a, mode: "login"}))}>Masuk</Button>
                <Button onClick={() => setAuth(a => ({...a, mode: "register"}))}>Daftar</Button>
              </>
            )}
          </div>
        </div>
      </header>

      {loggedIn && showMenu && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setShowMenu(false)}>
          <div className="absolute right-4 top-16 w-64" onClick={(e) => e.stopPropagation()}>
            <Card>
              <CardBody>
                <nav className="grid gap-2">
                  {TABS.map((t) => (
                    <Button
                      key={t.key}
                      className={active === t.key ? "bg-green-600 text-white" : "bg-white dark:bg-gray-800"}
                      onClick={() => {
                        setActive(t.key);
                        setShowMenu(false);
                      }}
                    >
                      {t.label}
                    </Button>
                  ))}
                </nav>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl p-4 md:p-6">
        {!loggedIn ? (
          <Auth auth={auth} setAuth={setAuth} onLogin={(u) => setUser(u)} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <aside className="hidden lg:block lg:col-span-3">
              <Card>
                <CardBody>
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 dark:text-gray-300">Halo,</div>
                    <div className="text-xl font-semibold">{greeting()}, {user?.name?.split(" ")[0] || "Pengguna"}</div>
                  </div>
                  <nav className="grid gap-2">
                    {TABS.map(t => (
                      <Button key={t.key} onClick={() => setActive(t.key)} className={`${active===t.key ? "bg-green-600 text-white" : "bg-white dark:bg-gray-800"}`}>
                        {t.label}
                      </Button>
                    ))}
                  </nav>
                </CardBody>
              </Card>
            </aside>

            <section className="lg:col-span-9">
              {active === "dashboard" && <Dashboard setActive={setActive} todaySugar={todaySugar} limit={25} latestVal={latestVal} status={status} />}
              {active === "nutrisi" && <Nutrisi q={q} setQ={setQ} cat={cat} setCat={setCat} foods={foods} onAddFood={f => setUserFoods(prev => [...prev, f])} onQuickAddDiary={quickAddDiaryFromFood} />}
              {active === "gula" && <PemantauanGula gInput={gInput} setGInput={setGInput} saveGula={saveGula} startEditGula={startEditGula} deleteGula={deleteGula} logs={sortedLogs} labels={chartLabels} points={chartPoints} status={status} statusColor={statusColor} editingGulaId={editingGulaId} />}
              {active === "harian" && <Harian entry={entry} setEntry={setEntry} saveDiary={saveDiary} diary={diary} todaySugar={todaySugar} limit={25} pct={pct} onEditDiary={startEditDiary} onDeleteDiary={deleteDiary} editingDiaryId={editingDiaryId} />}
              {active === "riwayat" && <Riwayat gLogs={gLogs} diary={diary} />}
              {active === "edukasi" && <ZonaEdukasi />}
              {active === "pengaturan" && <Pengaturan user={user} setUser={setUser} />}
            </section>
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-6xl p-6 text-center text-sm text-gray-500 dark:text-gray-400">
        © {new Date().getFullYear()} PAGARI · Prototype demo fitur utama.
      </footer>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 19) return "Selamat sore";
  return "Selamat malam";
}

function Auth({ auth, setAuth, onLogin }) {
  const onSubmit = (e) => {
    e.preventDefault();
    const name = auth.mode === "register" ? auth.name || "Pengguna" : (auth.email?.split("@")[0] || "Pengguna");
    onLogin({ name, email: auth.email });
  };
  return (
    <div className="mx-auto max-w-2xl grid gap-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Selamat datang di PAGARI</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">Kelola nutrisi, lacak gula harian, dan pantau gula darah Anda.</p>
      </div>
      <Card>
        <CardBody>
          <div className="flex gap-3 mb-4">
            <Button className={`${auth.mode==="login" ? "bg-green-600 text-white" : "bg-white dark:bg-gray-800"}`} onClick={() => setAuth(a => ({...a, mode: "login"}))}>Masuk</Button>
            <Button className={`${auth.mode==="register" ? "bg-green-600 text-white" : "bg-white dark:bg-gray-800"}`} onClick={() => setAuth(a => ({...a, mode: "register"}))}>Daftar</Button>
          </div>

          <form onSubmit={onSubmit} className="grid gap-4">
            {auth.mode === "register" && (
              <>
                <div>
                  <Label>Nama</Label>
                  <Input required value={auth.name} onChange={e => setAuth(a => ({...a, name: e.target.value}))} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Jenis Kelamin</Label>
                    <Select value={auth.gender} onChange={e => setAuth(a => ({...a, gender: e.target.value}))}>
                      <option value="">Pilih</option>
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </Select>
                  </div>
                  <div>
                    <Label>No. Telepon</Label>
                    <Input value={auth.phone} onChange={e => setAuth(a => ({...a, phone: e.target.value}))} />
                  </div>
                </div>
              </>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input required type="email" value={auth.email} onChange={e => setAuth(a => ({...a, email: e.target.value}))} />
              </div>
              <div>
                <Label>Kata Sandi</Label>
                <Input required type="password" value={auth.password} onChange={e => setAuth(a => ({...a, password: e.target.value}))} />
              </div>
            </div>
            <Button type="submit" className="bg-green-600 text-white">{auth.mode === "login" ? "Masuk" : "Buat Akun"}</Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

function Dashboard({ setActive, todaySugar, limit, latestVal, status }) {
  const CARDS = [
    { key: "nutrisi", title: "Nutrisi", desc: "Rekomendasi makanan sesuai kategori." },
    { key: "gula", title: "Pemantauan Gula Darah", desc: "Catat dan lihat tren gula darah berdasarkan riwayat cek GDS." },
    { key: "harian", title: "Lacak Gula Harian", desc: "Food diary & progres harian." },
    { key: "edukasi", title: "Zona Edukasi", desc: "Penjelasan rentang nilai GDS dan tips singkat." },
    { key: "riwayat", title: "Riwayat Pengguna", desc: "Tabel & grafik ringkas aktivitas Anda." },
  ];
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Asupan Gula Hari Ini</div>
                <div className="text-3xl font-bold">{todaySugar}g <span className="text-base font-normal text-gray-500 dark:text-gray-300">/ {limit}g</span></div>
              </div>
              <div className={`h-10 w-10 rounded-full grid place-items-center ${todaySugar<=limit ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {todaySugar<=limit ? "✓" : "!"}
              </div>
            </div>
            <div className="mt-3 h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700">
              <div className={`${todaySugar<=limit ? "bg-green-500" : "bg-red-500"} h-3 rounded-full`} style={{width: `${Math.min(100, (todaySugar/limit)*100)}%`}}></div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="text-sm text-gray-600 dark:text-gray-300">Status Gula Darah Terakhir</div>
            <div className="text-3xl font-bold mt-1">{latestVal ?? "—"} <span className="text-base font-normal text-gray-500 dark:text-gray-300">mg/dL</span></div>
            <div className={`mt-1 text-sm ${status==="Normal"?"text-green-700":status==="Pra-diabetes"?"text-yellow-600":"text-red-600"}`}>{status || "Belum ada data"}</div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CARDS.map(c => (
          <Card key={c.key} className="cursor-pointer hover:shadow-md" onClick={() => setActive(c.key)}>
            <CardBody>
              <div className="font-semibold">{c.title}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">{c.desc}</div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Nutrisi({ q, setQ, cat, setCat, foods, onAddFood, onQuickAddDiary }) {
  const [form, setForm] = React.useState({
    name: "",
    sugar: "",
    protein: "",
    fiber: "",
    carbs: "",
    cat: "rendah_gula",
    img: "",
  });

  // penanda makanan terakhir yang ditambahkan ke lacak gula
  const [lastAddedName, setLastAddedName] = React.useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const parsed = {
      name: form.name.trim(),
      sugar: Number(form.sugar) || 0,
      protein: Number(form.protein) || 0,
      fiber: Number(form.fiber) || 0,
      carbs: Number(form.carbs) || 0,
      cat: form.cat,
      img: form.img.trim() || undefined,
    };
    onAddFood && onAddFood(parsed);
    setForm(f => ({ ...f, name: "", sugar: "", protein: "", fiber: "", carbs: "", img: "" }));
  };

  return (
    <div className="grid gap-6">
      {/* Pencarian & filter kategori */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
          <Input
            placeholder="Cari makanan..."
            value={q}
            onChange={e => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Button
            className={`${cat === "all" ? "bg-green-600 text-white" : "bg-white dark:bg-gray-800"}`}
            onClick={() => setCat("all")}
          >
            Semua
          </Button>
          {CATEGORY_META.map(c => (
            <Button
              key={c.key}
              className={`${cat === c.key ? "bg-green-600 text-white" : "bg-white dark:bg-gray-800"}`}
              onClick={() => setCat(c.key)}
            >
              {c.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Form tambah makanan */}
      <Card>
        <CardBody>
          <h3 className="font-semibold mb-3">Tambah Makanan</h3>
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
            Isi data makanan yang sering Anda konsumsi untuk membantu menghitung asupan gula harian.
          </p>
          <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Nama makanan</label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Contoh: Nasi merah, susu rendah lemak"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Gula (gram)</label>
              <Input
                type="number"
                min="0"
                value={form.sugar}
                onChange={e => setForm(f => ({ ...f, sugar: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Protein (gram)</label>
              <Input
                type="number"
                min="0"
                value={form.protein}
                onChange={e => setForm(f => ({ ...f, protein: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Serat (gram)</label>
              <Input
                type="number"
                min="0"
                value={form.fiber}
                onChange={e => setForm(f => ({ ...f, fiber: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Karbohidrat (gram)</label>
              <Input
                type="number"
                min="0"
                value={form.carbs}
                onChange={e => setForm(f => ({ ...f, carbs: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Kategori</label>
              <Select
                value={form.cat}
                onChange={e => setForm(f => ({ ...f, cat: e.target.value }))}
              >
                {CATEGORY_META.map(c => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">URL gambar (opsional)</label>
              <Input
                value={form.img}
                onChange={e => setForm(f => ({ ...f, img: e.target.value }))}
                placeholder="Tempel link gambar makanan (jika ada)"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-xl">
                Simpan makanan
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Daftar makanan */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Daftar Makanan</h3>
            <span className="text-xs text-gray-500 dark:text-gray-300">
              Klik "Tambah ke Lacak Gula" untuk mencatat konsumsi hari ini.
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {foods.map((f, i) => {
              const isAdded = lastAddedName === f.name;
              return (
                <Card key={i}>
                  <CardBody>
                    <div className="flex items-start gap-4">
                      {f.img ? (
                        <img
                          src={f.img}
                          alt={f.name}
                          className="w-16 h-16 rounded-xl object-cover bg-gray-200 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-green-100 text-green-700 grid place-items-center text-sm font-semibold flex-shrink-0">
                          {f.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="font-semibold">{f.name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              {CATEGORY_META.find(x => x.key === f.cat)?.label || ""}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <Badge label="Gula" value={`${f.sugar} g`} />
                            <Badge label="Protein" value={`${f.protein} g`} />
                            <Badge label="Serat" value={`${f.fiber} g`} />
                            <Badge label="Karbo" value={`${f.carbs} g`} />
                          </div>
                        </div>

                        {onQuickAddDiary && (
                          <div className="flex justify-end">
                            <Button
                              className={
                                "text-xs px-3 py-1 border rounded-xl " +
                                (isAdded
                                  ? "bg-green-600 text-white border-green-600"
                                  : "bg-green-50 text-green-700 border-green-200")
                              }
                              onClick={() => {
                                onQuickAddDiary(f);
                                setLastAddedName(f.name);
                                setTimeout(() => setLastAddedName(null), 1500);
                              }}
                            >
                              {isAdded ? "✓ Ditambahkan" : "➕ Tambah ke Lacak Gula Hari Ini"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}


function Badge({ label, value }) {
  return <div className="rounded-xl border px-2 py-1 bg-green-50 border-green-200 text-green-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 text-xs font-medium text-center">{label}: {value}</div>;
}

function PemantauanGula({ gInput, setGInput, saveGula, startEditGula, deleteGula, logs, labels, points, status, statusColor, editingGulaId }) {
  const isEditing = Boolean(editingGulaId);
  return (
    <div className="grid gap-6">
      <Card>
        <CardBody>
          <div className="grid md:grid-cols-3 gap-4 items-end">
            <div>
              <Label>Hasil cek gula (mg/dL)</Label>
              <Input
                type="number"
                placeholder="mis. 110"
                value={gInput.value}
                onChange={e => setGInput(s => ({ ...s, value: e.target.value }))}
              />
            </div>
            <div>
              <Label>Waktu</Label>
              <Input
                type="datetime-local"
                value={gInput.when}
                onChange={e => setGInput(s => ({ ...s, when: e.target.value }))}
              />
            </div>
            <div className="flex flex-col items-end gap-2">
              {isEditing && (
                <span className="text-xs text-gray-500 dark:text-gray-300">
                  Sedang mengedit data gula
                </span>
              )}
              <Button className="bg-green-600 text-white" onClick={saveGula}>
                {isEditing ? "💾 Simpan perubahan" : "➕ Simpan"}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className="font-semibold mb-3">Riwayat cek gula darah</div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 dark:text-gray-300">
                  <th className="py-2 pr-3">Waktu</th>
                  <th className="py-2 pr-3">Nilai (mg/dL)</th>
                  <th className="py-2 pr-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice().reverse().map(row => (
                  <tr key={row.id} className="border-top border-gray-200 dark:border-gray-700">
                    <td className="py-2 pr-3">
                      {new Date(row.time).toLocaleString()}
                    </td>
                    <td className="py-2 pr-3">{row.value}</td>
                    <td className="py-2 pr-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          className="text-xs px-2 py-1"
                          onClick={() => startEditGula(row)}
                        >
                          Edit
                        </Button>
                        <Button
                          className="text-xs px-2 py-1"
                          onClick={() => deleteGula(row.id)}
                        >
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td className="py-3 text-center text-gray-500 text-xs" colSpan={3}>
                      Belum ada data gula darah yang tersimpan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Tren Gula Darah</div>
            <div className={`text-sm ${statusColor}`}>Status: {status || "—"}</div>
          </div>
          <div className="h-72">
            <LineChartSimple dataPoints={points} labels={labels} />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}


function Harian({ entry, setEntry, saveDiary, diary, todaySugar, limit, pct, onEditDiary, onDeleteDiary, editingDiaryId }) {
  const over = todaySugar > limit;
  const isEditing = Boolean(editingDiaryId);
  return (
    <div className="grid gap-6">
      <Card>
        <CardBody>
          <div className="grid md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2">
              <Label>Nama makanan/minuman</Label>
              <Input
                value={entry.item}
                onChange={e => setEntry(s => ({ ...s, item: e.target.value }))}
                placeholder="mis. Teh manis"
              />
            </div>
            <div>
              <Label>Gula (g)</Label>
              <Input
                type="number"
                value={entry.sugar}
                onChange={e => setEntry(s => ({ ...s, sugar: e.target.value }))}
                placeholder="mis. 12"
              />
            </div>
            <div>
              <Label>Tanggal</Label>
              <Input
                type="date"
                value={entry.date}
                onChange={e => setEntry(s => ({ ...s, date: e.target.value }))}
              />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            {isEditing && (
              <span className="text-xs text-gray-500 dark:text-gray-300">
                Sedang mengedit entri tanggal {entry.date}
              </span>
            )}
            <div className="ml-auto flex gap-2">
              {isEditing && (
                <Button
                  className="bg-white dark:bg-gray-800"
                  onClick={() => {
                    onEditDiary && onEditDiary(null);
                  }}
                >
                  Batalkan
                </Button>
              )}
              <Button className="bg-green-600 text-white" onClick={saveDiary}>
                {isEditing ? "💾 Simpan perubahan" : "➕ Tambah"}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Total gula hari ini</div>
              <div className="text-3xl font-bold">
                {todaySugar}g{" "}
                <span className="text-base font-normal text-gray-500 dark:text-gray-300">/ {limit}g</span>
              </div>
            </div>
            <div className={`h-10 w-10 rounded-full grid place-items-center ${over ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
              {over ? "!" : "✓"}
            </div>
          </div>
          <div className="mt-3 h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700">
            <div className={`${over ? "bg-red-500" : "bg-green-500"} h-3 rounded-full`} style={{ width: `${pct}%` }}></div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className="font-semibold mb-3">Food Diary</div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 dark:text-gray-300">
                  <th className="py-2 pr-3">Tanggal</th>
                  <th className="py-2 pr-3">Item</th>
                  <th className="py-2 pr-3">Gula (g)</th>
                  <th className="py-2 pr-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {diary.slice().reverse().map(d => (
                  <tr key={d.id} className="border-top border-gray-200 dark:border-gray-700">
                    <td className="py-2 pr-3">{d.date}</td>
                    <td className="py-2 pr-3">{d.item}</td>
                    <td className="py-2 pr-3">{d.sugar}</td>
                    <td className="py-2 pr-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          className="text-xs px-2 py-1"
                          onClick={() => onEditDiary && onEditDiary(d)}
                        >
                          Edit
                        </Button>
                        <Button
                          className="text-xs px-2 py-1"
                          onClick={() => onDeleteDiary && onDeleteDiary(d.id)}
                        >
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {diary.length === 0 && (
                  <tr>
                    <td className="py-3 text-center text-gray-500 text-xs" colSpan={4}>
                      Belum ada catatan makanan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}



function ZonaEdukasi() {
  return (
    <div className="grid gap-6">
      {/* Kartu penjelasan GDS */}
      <Card>
        <CardBody>
          <div className="mb-4">
            <div className="text-sm font-semibold text-green-700 dark:text-green-300">Zona Edukasi</div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">Nilai Gula Darah Sewaktu (GDS)</div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Rentang berikut dapat membantu Anda membaca hasil pemeriksaan gula darah sewaktu (GDS). Untuk interpretasi dan keputusan medis,
              tetap konsultasikan dengan tenaga kesehatan.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/40 p-4">
              <div className="text-xs font-semibold uppercase text-green-700 dark:text-green-300">Normal</div>
              <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">&lt; 140</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">mg/dL</div>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                Kadar gula darah masih dalam batas aman. Tetap pertahankan pola makan seimbang dan aktivitas fisik teratur.
              </p>
            </div>
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-950/40 p-4">
              <div className="text-xs font-semibold uppercase text-yellow-700 dark:text-yellow-300">Pra-diabetes</div>
              <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">140 – 199</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">mg/dL</div>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                Risiko diabetes meningkat. Perlu pembatasan gula tambahan, perbaikan pola makan, dan peningkatan aktivitas fisik.
              </p>
            </div>
            <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40 p-4">
              <div className="text-xs font-semibold uppercase text-red-700 dark:text-red-300">Diabetes</div>
              <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">&ge; 200</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">mg/dL</div>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                Perlu dievaluasi oleh tenaga kesehatan. Ikuti anjuran dokter terkait obat, pola makan, dan pemeriksaan lanjutan.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Kartu poster edukasi */}
      <Card>
        <CardBody>
          <h3 className="font-semibold mb-3">Poster Edukasi Diabetes &amp; Gula</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Beberapa materi visual berikut dapat membantu memahami diabetes, pilihan makanan yang lebih sehat, dan batas aman konsumsi gula harian.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <img
              src="./assets/edu-materi-dm.png"
              alt="Ayo kenali penyakit diabetes mellitus"
              className="w-full rounded-2xl border border-green-100 dark:border-gray-700 object-cover"
            />
            <img
              src="./assets/edu-menu-sehat.png"
              alt="Menu makanan sehat untuk gula darah"
              className="w-full rounded-2xl border border-green-100 dark:border-gray-700 object-cover"
            />
            <img
              src="./assets/edu-minuman-kemasan.jpg"
              alt="Kandungan gula minuman kemasan"
              className="w-full rounded-2xl border border-green-100 dark:border-gray-700 object-cover"
            />
            <img
              src="./assets/edu-makanan-kemasan.png"
              alt="Kandungan gula makanan kemasan"
              className="w-full rounded-2xl border border-green-100 dark:border-gray-700 object-cover"
            />
            <img
              src="./assets/edu-batas-aman-gula.jpg"
              alt="Batas aman gula harian"
              className="w-full rounded-2xl border border-green-100 dark:border-gray-700 object-cover md:col-span-2"
            />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}


function Riwayat({ gLogs, diary }) {
  const byDateSugar = diary.reduce((acc, d) => {
    acc[d.date] = (acc[d.date] || 0) + d.sugar;
    return acc;
  }, {});
  const toKey = (t) => new Date(t).toISOString().slice(0,10);
  const days = Array.from(new Set([...gLogs.map(g => toKey(g.time)), ...Object.keys(byDateSugar)])).sort();
  const mean = arr => arr.length ? Math.round((arr.reduce((a,b)=>a+b,0)/arr.length)*10)/10 : null;

  return (
    <div className="grid gap-6">
      <Card>
        <CardBody>
          <div className="font-semibold mb-3">Ringkasan Harian</div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 dark:text-gray-300">
                  <th className="py-2 pr-3">Tanggal</th>
                  <th className="py-2 pr-3">Gula Darah (mg/dL)</th>
                  <th className="py-2 pr-3">Asupan Gula (g)</th>
                </tr>
              </thead>
              <tbody>
                {days.map(d => (
                  <tr key={d} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="py-2 pr-3">{d}</td>
                    <td className="py-2 pr-3">{mean(gLogs.filter(g => toKey(g.time)===d).map(g=>g.value)) ?? "—"}</td>
                    <td className="py-2 pr-3">{byDateSugar[d] ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function Pengingat({ rem, setRem, addReminder, reminders }) {
  return (
    <div className="grid gap-6">
      <Card>
        <CardBody>
          <div className="grid md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2">
              <Label>Judul Pengingat</Label>
              <Input value={rem.text} onChange={e=>setRem(s=>({...s, text: e.target.value}))} placeholder="mis. Cek gula malam" />
            </div>
            <div>
              <Label>Waktu</Label>
              <Input value={rem.when} onChange={e=>setRem(s=>({...s, when: e.target.value}))} />
            </div>
          </div>
          <div className="mt-4">
            <Button className="bg-green-600 text-white" onClick={addReminder}>➕ Tambah</Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className="font-semibold mb-3">Daftar Pengingat</div>
          <ul className="grid gap-2">
            {reminders.slice().reverse().map(r => (
              <li key={r.id} className="flex items-center justify-between rounded-xl border dark:border-gray-700 p-3">
                <div>
                  <div className="font-medium">{r.text}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">{r.when}</div>
                </div>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}

function Pengaturan({ user, setUser }) {
  const [form, setForm] = useState({ name: user?.name || "", lang: "id", notif: true });
  // Persist selected states to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("pagari_user", JSON.stringify(user));
    } catch (e) {}
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem("pagari_active", active);
    } catch (e) {}
  }, [active]);

  useEffect(() => {
    try {
      localStorage.setItem("pagari_dark", dark ? "true" : "false");
    } catch (e) {}
  }, [dark]);

  useEffect(() => {
    try {
      localStorage.setItem("pagari_userFoods", JSON.stringify(userFoods));
    } catch (e) {}
  }, [userFoods]);

  useEffect(() => {
    try {
      localStorage.setItem("pagari_gLogs", JSON.stringify(gLogs));
    } catch (e) {}
  }, [gLogs]);

  useEffect(() => {
    try {
      localStorage.setItem("pagari_diary", JSON.stringify(diary));
    } catch (e) {}
  }, [diary]);

  useEffect(() => {
    try {
      localStorage.setItem("pagari_reminders", JSON.stringify(reminders));
    } catch (e) {}
  }, [reminders]);

  return (
    <div className="grid gap-6">
      <Card>
        <CardBody>
          <div className="font-semibold mb-4">Profil</div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label>Nama</Label>
              <Input value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))} />
            </div>
            <div>
              <Label>Bahasa</Label>
              <Select value={form.lang} onChange={e=>setForm(f=>({...f, lang: e.target.value}))}>
                <option value="id">Indonesia</option>
                <option value="en">English</option>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <input id="notif" type="checkbox" checked={form.notif} onChange={e=>setForm(f=>({...f, notif: e.target.checked}))} />
            <label htmlFor="notif" className="text-sm text-gray-600 dark:text-gray-300">Aktifkan notifikasi</label>
          </div>
          <div className="mt-4">
            <Button className="bg-green-600 text-white" onClick={() => setUser(u => ({...u, name: form.name }))}>Simpan</Button>
          </div>
        </CardBody>
      </Card>
    {toast && (
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-green-600 text-white py-2 px-4 rounded-xl shadow-lg text-sm z-50">
        {toast}
      </div>
    )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
