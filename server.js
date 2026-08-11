const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const SCRIPT_URL = process.env.APPS_SCRIPT_URL;

let cacheData = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000;

async function fetchDb() {
    const now = Date.now();
    if (cacheData && (now - lastFetchTime < CACHE_DURATION)) return cacheData;
    try {
        const res = await fetch(`${SCRIPT_URL}?action=getData`);
        const data = await res.json();
        cacheData = data;
        lastFetchTime = now;
        return cacheData;
    } catch (e) { return { users: [], notes: [], kas: [], transactions: [], announcements: [], events: [] }; }
}

const sessions = {};
function checkAuth(req, res, next) {
    const sessionId = req.headers.cookie?.split('; ').find(row => row.startsWith('sessionId='))?.split('=')[1];
    if (sessionId && sessions[sessionId]) { req.user = sessions[sessionId]; next(); } 
    else { res.redirect('/login'); }
}

const layout = (title, content) => `
<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title><link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌍</text></svg>">
<script src="https://cdn.tailwindcss.com"></script></head>
<body class="bg-[#f0f4f1] text-[#1e293b] min-h-screen flex flex-col font-sans">
    <nav class="bg-[#2f6636] text-white shadow-md p-4"><div class="max-w-6xl mx-auto flex justify-between items-center"><a href="/dashboard" class="font-bold">🌿 Portal 2A</a><a href="/logout" class="bg-[#244f2b] px-4 py-1 rounded-lg text-sm">Keluar</a></div></nav>
    <main class="max-w-6xl mx-auto p-4 flex-grow w-full">${content}</main>
</body></html>`;

// --- ROUTE UTAMA ---
app.get('/login', (req, res) => res.send(`<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-[#f0f4f1] flex items-center justify-center min-h-screen"><div class="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm"><h1 class="text-2xl font-bold text-[#2f6636] mb-6">Login Portal 2A</h1><form action="/login" method="POST" class="space-y-4"><input type="text" name="first_name" placeholder="Nama Siswa" required class="w-full p-3 border rounded-xl"><input type="password" name="password" placeholder="Password" required class="w-full p-3 border rounded-xl"><button type="submit" class="w-full bg-[#2f6636] text-white py-3 rounded-xl">Masuk</button></form></div></body></html>`));

app.post('/login', async (req, res) => {
    const { first_name, password } = req.body;
    const db = await fetchDb();
    const user = db.users.find(u => String(u.first_name).toLowerCase() === String(first_name).toLowerCase() && String(u.password) === String(password));
    if (user) {
        const sid = Math.random().toString(36).substring(2);
        sessions[sid] = user;
        res.setHeader('Set-Cookie', `sessionId=${sid}; Path=/`);
        res.redirect('/dashboard');
    } else res.send(`<script>alert('Login Gagal'); window.location.href='/login';</script>`);
});

app.get('/dashboard', checkAuth, (req, res) => res.send(layout('Dashboard', `<div class="grid grid-cols-1 md:grid-cols-3 gap-6"><a href="/kas" class="bg-white p-6 rounded-2xl shadow">💵 Iuran Kas</a><a href="/finances" class="bg-white p-6 rounded-2xl shadow">📊 Keuangan</a><a href="/announcements" class="bg-white p-6 rounded-2xl shadow">📢 Pengumuman</a></div>`)));

// --- KAS (Semester 1 & 2) ---
app.get('/kas', checkAuth, async (req, res) => {
    const db = await fetchDb();
    const userKas = db.kas.filter(k => String(k.user_id) === String(req.user.id));
    const period = req.query.period || 'sem1';
    
    // Logic: Juli 2026 - Juni 2027
    const sem1 = ["Juli 2026", "Agustus", "September", "Oktober", "November", "Desember"];
    const sem2 = ["Januari", "Februari", "Maret", "April", "Mei", "Juni"];
    const target = period === 'sem2' ? sem2 : sem1;
    
    let rows = '';
    // Kaos hanya tampil di Semester 1
    if (period !== 'sem2') {
        const kaos = userKas.find(k => String(k.month).toLowerCase().includes('kaos'));
        rows += `<tr class="border-b"><td class="p-4 font-bold">Iuran Kaos</td><td class="p-4">Rp ${(kaos?.amount || 78000).toLocaleString()}</td><td class="p-4">${String(kaos?.status).toLowerCase()==='lunas'?'✅ Lunas':'❌ Belum'}</td></tr>`;
    }
    
    target.forEach(m => {
        const found = userKas.find(k => String(k.month).toLowerCase().includes(m.toLowerCase()));
        rows += `<tr class="border-b"><td class="p-4">${m}</td><td class="p-4">Rp 25.000</td><td class="p-4">${String(found?.status).toLowerCase()==='lunas'?'✅ Lunas':'❌ Belum'}</td></tr>`;
    });

    res.send(layout('Iuran Kas', `<div class="bg-white p-6 rounded-xl overflow-x-auto"><h2 class="text-xl font-bold mb-4">Iuran Kas (Rp 25.000/bulan)</h2>
    <form class="mb-4"><select name="period" onchange="this.form.submit()" class="p-2 border rounded-lg"><option value="sem1" ${period==='sem1'?'selected':''}>Sem 1 (Juli-Des)</option><option value="sem2" ${period==='sem2'?'selected':''}>Sem 2 (Jan-Jun)</option></select></form>
    <table class="w-full min-w-[300px]"><thead><tr class="bg-gray-100"><th class="p-4">Bulan</th><th class="p-4">Nominal</th><th class="p-4">Status</th></tr></thead><tbody>${rows}</tbody></table></div>`));
});

// --- FINANCE (Pagination & Filter) ---
app.get('/finances', checkAuth, async (req, res) => {
    const db = await fetchDb();
    const filter = req.query.filter || 'all';
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    
    let txs = db.transactions.sort((a,b) => new Date(b.date) - new Date(a.date));
    const now = new Date();
    txs = txs.filter(t => {
        const tDate = new Date(t.date);
        if (filter === 'daily') return tDate.toDateString() === now.toDateString();
        if (filter === 'weekly') { const d = new Date(); d.setDate(d.getDate()-7); return tDate >= d; }
        if (filter === 'monthly') return tDate.getMonth() === now.getMonth();
        return true;
    });

    const paginated = txs.slice((page-1)*limit, page*limit);
    const rows = paginated.map(t => `<tr class="border-b"><td class="p-4">${t.date}</td><td class="p-4">${t.desc}</td><td class="p-4">Rp ${t.amount.toLocaleString()}</td></tr>`).join('');
    
    res.send(layout('Keuangan', `<div class="bg-white p-6 rounded-xl"><h2 class="text-xl font-bold mb-4">Laporan Keuangan</h2>
    <form class="mb-4 flex gap-2"><select name="filter" onchange="this.form.submit()" class="p-2 border rounded-lg"><option value="all" ${filter==='all'?'selected':''}>Semua</option><option value="daily" ${filter==='daily'?'selected':''}>Hari</option><option value="weekly" ${filter==='weekly'?'selected':''}>Minggu</option><option value="monthly" ${filter==='monthly'?'selected':''}>Bulan</option></select></form>
    <div class="overflow-x-auto"><table class="w-full text-left"><thead><tr class="bg-gray-100"><th class="p-4">Tanggal</th><th class="p-4">Keterangan</th><th class="p-4">Jumlah</th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="mt-4 flex gap-2">${page>1?`<a href="?page=${page-1}&filter=${filter}" class="p-2 bg-gray-200 rounded">Prev</a>`:''}<span>Hal ${page}</span><a href="?page=${page+1}&filter=${filter}" class="p-2 bg-gray-200 rounded">Next</a></div></div>`));
});

// --- ANNOUNCEMENTS (Search, Sort, Pagination 5) ---
app.get('/announcements', checkAuth, async (req, res) => {
    const db = await fetchDb();
    const search = (req.query.search || '').toLowerCase();
    const page = parseInt(req.query.page) || 1;
    let data = db.announcements.sort((a,b) => new Date(b.date) - new Date(a.date))
               .filter(a => String(a.title).toLowerCase().includes(search) || String(a.content).toLowerCase().includes(search));
    
    const paginated = data.slice((page-1)*5, page*5);
    const cards = paginated.map(a => `<div class="bg-white p-4 mb-4 rounded-xl border shadow-sm"><h3 class="font-bold text-[#2f6636]">${a.title}</h3><p class="text-sm mt-1">${a.content}</p><small class="text-gray-400">${a.date}</small></div>`).join('');
    
    res.send(layout('Pengumuman', `<div class="mb-4"><form class="flex gap-2"><input name="search" value="${search}" class="p-2 border rounded-lg w-full" placeholder="Cari..."> <button class="bg-[#2f6636] text-white px-4 py-2 rounded-lg">Cari</button></form></div>${cards}<div class="flex gap-2 mt-4">${page>1?`<a href="?page=${page-1}&search=${search}" class="p-2 bg-gray-200 rounded">Prev</a>`:''}<span>Hal ${page}</span><a href="?page=${page+1}&search=${search}" class="p-2 bg-gray-200 rounded">Next</a></div>`));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));