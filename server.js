const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
    res.redirect('/login');
});

const SCRIPT_URL = process.env.APPS_SCRIPT_URL || "YOUR_APPS_SCRIPT_URL_HERE";

let cacheData = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000;

async function fetchDb() {
    const now = Date.now();
    if (cacheData && (now - lastFetchTime < CACHE_DURATION)) {
        return cacheData;
    }
    try {
        const res = await fetch(`${SCRIPT_URL}?action=getData`);
        const data = await res.json();
        cacheData = data;
        lastFetchTime = now;
        return cacheData;
    } catch (e) {
        console.error("Gagal mengambil data:", e);
        return cacheData || { users: [], notes: [], kas: [], transactions: [], announcements: [], events: [] };
    }
}

const sessions = {};

function checkAuth(req, res, next) {
    const sessionId = req.headers.cookie?.split('; ').find(row => row.startsWith('sessionId='))?.split('=')[1];
    if (sessionId && sessions[sessionId]) {
        req.user = sessions[sessionId];
        next();
    } else {
        res.redirect('/login');
    }
}

// Layout dengan Favicon Globe (🌍)
const layout = (title, content) => `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌍</text></svg>">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        #loading-overlay { transition: opacity 0.3s ease; }
    </style>
</head>
<body class="bg-[#f0f4f1] text-[#1e293b] min-h-screen flex flex-col font-sans">
    <div id="loading-overlay" class="fixed inset-0 bg-[#f0f4f1] flex flex-col items-center justify-center z-[9999]">
        <div class="animate-spin rounded-full h-12 w-12 border-b-4 border-[#2f6636]"></div>
        <p class="mt-4 text-[#2f6636] font-bold text-lg animate-pulse">Mohon tunggu sebentar...</p>
    </div>

    <nav class="bg-[#2f6636] text-white shadow-md">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
            <a href="/dashboard" class="font-bold text-base sm:text-xl flex items-center space-x-2"><span>🌿</span><span>Portal Walimurid Kelas 2A</span></a>
            <a href="/logout" class="bg-[#244f2b] hover:bg-[#1b3d21] px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition shadow-sm">Keluar</a>
        </div>
    </nav>
    <main class="max-w-6xl mx-auto p-4 sm:p-6 flex-grow w-full">
        ${content}
    </main>
    <footer class="text-center py-6 text-xs text-[#4b5563] border-t border-[#e2e8f0] bg-[#e6ede8]">Portal Walimurid Kelas 2A &copy; 2026 Dhiya</footer>
    
    <script>
        window.addEventListener('load', function() {
            const overlay = document.getElementById('loading-overlay');
            overlay.style.opacity = '0';
            setTimeout(() => { overlay.style.display = 'none'; }, 300);
        });
    </script>
</body>
</html>
`;

app.get('/login', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login - Portal Walimurid Kelas 2A</title>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌍</text></svg>">
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-[#f0f4f1] flex items-center justify-center min-h-screen px-4">
        <div id="login-loading" class="fixed inset-0 bg-[#f0f4f1] flex flex-col items-center justify-center z-[9999]" style="display: none;">
            <div class="animate-spin rounded-full h-12 w-12 border-b-4 border-[#2f6636]"></div>
            <p class="mt-4 text-[#2f6636] font-bold text-lg animate-pulse">Mohon tunggu sebentar...</p>
        </div>

        <div class="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md border border-[#cbd5e1]">
            <div class="text-center mb-6">
                <h1 class="text-xl sm:text-2xl font-bold text-[#2f6636] mt-2">Portal Walimurid Kelas 2A</h1>
                <p class="text-xs sm:text-sm text-[#4b5563] mt-1">Assalamualaikum, selamat datang Ayah Bunda. Mohon untuk mengisikan Username dan Password</p>
            </div>
            <form action="/login" method="POST" class="space-y-4" onsubmit="document.getElementById('login-loading').style.display='flex';">
                <div>
                    <label class="block text-sm font-semibold text-[#1e293b] mb-1">Username</label>
                    <input type="text" name="first_name" required class="w-full px-4 py-3 border border-[#cbd5e1] rounded-xl focus:ring-2 focus:ring-[#2f6636] outline-none text-base transition" placeholder="Input nama depan siswa">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-[#1e293b] mb-1">Password</label>
                    <input type="password" name="password" required class="w-full px-4 py-3 border border-[#cbd5e1] rounded-xl focus:ring-2 focus:ring-[#2f6636] outline-none text-base transition" placeholder="Input password">
                </div>
                <button type="submit" class="w-full bg-[#2f6636] text-white py-3 rounded-xl font-bold hover:bg-[#244f2b] shadow-md transition text-base">Masuk</button>
            </form>
        </div>
    </body></html>`);
});

app.post('/login', async (req, res) => {
    const { first_name, password } = req.body;
    try {
        const db = await fetchDb();
        const user = db.users.find(u => 
            String(u.first_name).toLowerCase() === String(first_name).trim().toLowerCase() &&
            String(u.password).trim() === String(password).trim()
        );
        if (user) {
            const sessionId = Math.random().toString(36).substring(2);
            sessions[sessionId] = user;
            res.setHeader('Set-Cookie', `sessionId=${sessionId}; Path=/`);
            res.redirect('/dashboard');
        } else {
            res.send(`<script>alert('Username atau Password salah!'); window.location.href='/login';</script>`);
        }
    } catch (err) { res.status(500).send("Error connecting to database"); }
});

app.get('/logout', (req, res) => {
    res.setHeader('Set-Cookie', 'sessionId=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
    res.redirect('/login');
});

app.get('/dashboard', checkAuth, (req, res) => {
    const content = `
    <div class="mb-8 bg-gradient-to-r from-[#2f6636] to-[#40824b] text-white p-6 rounded-2xl shadow-md flex justify-between items-center">
        <div>
            <h2 class="text-2xl sm:text-3xl font-bold">Assalamualaikum, Ayah/Bunda ${String(req.user.first_name)}</h2>
        </div>
        <div class="text-4xl hidden sm:block">🌿</div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a href="/calendar" class="bg-white p-5 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition border border-[#cbd5e1] flex items-center space-x-4 sm:space-x-5 group">
            <div class="bg-[#e8f5e9] text-[#2f6636] p-3 sm:p-4 rounded-xl text-2xl sm:text-3xl group-hover:bg-[#2f6636] group-hover:text-white transition">📅</div>
            <div>
                <h3 class="font-bold text-base sm:text-lg text-[#1e293b] group-hover:text-[#2f6636] transition">Kalendar Akademik</h3>
                <p class="text-xs sm:text-sm text-[#4b5563]">Agenda kelas dan catatan jadwal pribadi siswa.</p>
            </div>
        </a>
        <a href="/kas" class="bg-white p-5 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition border border-[#cbd5e1] flex items-center space-x-4 sm:space-x-5 group">
            <div class="bg-[#e8f5e9] text-[#2f6636] p-3 sm:p-4 rounded-xl text-2xl sm:text-3xl group-hover:bg-[#2f6636] group-hover:text-white transition">💵</div>
            <div>
                <h3 class="font-bold text-base sm:text-lg text-[#1e293b] group-hover:text-[#2f6636] transition">Iuran Kas Siswa</h3>
                <p class="text-xs sm:text-sm text-[#4b5563]">Pembayaran kas pribadi setiap siswa.</p>
            </div>
        </a>
        <a href="/finances" class="bg-white p-5 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition border border-[#cbd5e1] flex items-center space-x-4 sm:space-x-5 group">
            <div class="bg-[#fef3c7] text-[#d97706] p-3 sm:p-4 rounded-xl text-2xl sm:text-3xl group-hover:bg-[#d97706] group-hover:text-white transition">📊</div>
            <div>
                <h3 class="font-bold text-base sm:text-lg text-[#1e293b] group-hover:text-[#d97706] transition">Laporan Keuangan</h3>
                <p class="text-xs sm:text-sm text-[#4b5563]">Laporan income & expense kelas 2A 2026/2027.</p>
            </div>
        </a>
        <a href="/announcements" class="bg-white p-5 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition border border-[#cbd5e1] flex items-center space-x-4 sm:space-x-5 group">
            <div class="bg-[#e0f2fe] text-[#0284c7] p-3 sm:p-4 rounded-xl text-2xl sm:text-3xl group-hover:bg-[#0284c7] group-hover:text-white transition">📢</div>
            <div>
                <h3 class="font-bold text-base sm:text-lg text-[#1e293b] group-hover:text-[#0284c7] transition">Pengumuman</h3>
                <p class="text-xs sm:text-sm text-[#4b5563]">Pengumuman dari pihak sekolah.</p>
            </div>
        </a>
        <a href="/change-password" class="bg-white p-5 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition border border-[#cbd5e1] flex items-center space-x-4 sm:space-x-5 group">
            <div class="bg-[#e8f5e9] text-[#2f6636] p-3 sm:p-4 rounded-xl text-2xl sm:text-3xl group-hover:bg-[#2f6636] group-hover:text-white transition">🔑</div>
            <div>
                <h3 class="font-bold text-base sm:text-lg text-[#1e293b] group-hover:text-[#2f6636] transition">Ganti Password</h3>
                <p class="text-xs sm:text-sm text-[#4b5563]">Ubah kata sandi akun Anda.</p>
            </div>
        </a>
    </div>`;
    res.send(layout('Dashboard', content));
});

app.get('/calendar', checkAuth, async (req, res) => {
    try {
        const db = await fetchDb();
        const currentDate = new Date();
        const year = req.query.year || currentDate.getFullYear();
        const month = req.query.month || String(currentDate.getMonth() + 1).padStart(2, '0');
        
        const firstDayIndex = new Date(year, month - 1, 1).getDay();
        const totalDays = new Date(year, month, 0).getDate();

        const userNotes = db.notes ? db.notes.filter(n => String(n.user_id) === String(req.user.id) && String(n.note_date).startsWith(`${year}-${month}`)) : [];
        const notesMap = {};
        userNotes.forEach(n => { notesMap[n.note_date] = n.content; });

        const globalEvents = db.events ? db.events.filter(e => String(e.date).startsWith(`${year}-${month}`)) : [];
        const eventsMap = {};
        globalEvents.forEach(e => { eventsMap[e.date] = e; });

        let calendarCells = '';
        for (let i = 0; i < firstDayIndex; i++) {
            calendarCells += `<div class="bg-[#f8fafc] min-h-[140px] rounded-xl border border-dashed border-[#cbd5e1]"></div>`;
        }

        for (let d = 1; d <= totalDays; d++) {
            const dayStr = String(d).padStart(2, '0');
            const dateKey = `${year}-${month}-${dayStr}`;
            const existingNote = notesMap[dateKey] || '';
            const globalEvent = eventsMap[dateKey];
            const isToday = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}` === dateKey;

            let eventHtml = '';
            if (globalEvent) {
                eventHtml = `
                <div class="mb-2 p-2 bg-[#fef3c7] border border-[#fde047] rounded-xl shadow-sm">
                    <span class="text-[10px] font-bold text-[#b45309] uppercase block tracking-wider">📌 ${globalEvent.title}</span>
                    <p class="text-[11px] text-[#78350f] mt-0.5 leading-tight">${globalEvent.description}</p>
                </div>`;
            }

            calendarCells += `
            <div class="bg-white p-3 rounded-2xl border ${isToday ? 'border-[#2f6636] ring-2 ring-[#a3e635]/30 shadow-md' : 'border-[#cbd5e1]'} shadow-sm flex flex-col justify-between min-h-[160px]">
                <div>
                    <div class="flex justify-between items-center mb-1">
                        <span class="font-bold text-sm ${isToday ? 'bg-[#2f6636] text-white w-7 h-7 rounded-full flex items-center justify-center' : 'text-[#1e293b]'}">${d}</span>
                        <span class="text-[10px] font-bold text-[#2f6636]">${dateKey}</span>
                    </div>
                    ${eventHtml}
                </div>
                <div class="mt-2">
                    <textarea name="notes[${dateKey}]" rows="2" class="w-full text-xs p-2 border border-[#cbd5c8] rounded-xl resize-none focus:ring-2 focus:ring-[#2f6636] outline-none bg-[#f8fafc] focus:bg-white transition" placeholder="Catatan pribadi...">${existingNote}</textarea>
                </div>
            </div>`;
        }

        const monthsList = [
            {v: '01', n: 'January'}, {v: '02', n: 'February'}, {v: '03', n: 'March'}, 
            {v: '04', n: 'April'}, {v: '05', n: 'May'}, {v: '06', n: 'June'}, 
            {v: '07', n: 'July'}, {v: '08', n: 'August'}, {v: '09', n: 'September'}, 
            {v: '10', n: 'October'}, {v: '11', n: 'November'}, {v: '12', n: 'December'}
        ];

        let monthOptions = monthsList.map(mObj => `<option value="${mObj.v}" ${mObj.v === month ? 'selected' : ''}>${mObj.n}</option>`).join('');

        const content = `
        <div class="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-[#cbd5e1]">
            <div>
                <h2 class="text-xl sm:text-2xl font-bold text-[#1e293b]">Kalendar Akademik Tahun Ajaran 2026/2027</h2>
                <p class="text-xs sm:text-sm text-[#4b5563]">Agenda kelas dan catatan jadwal pribadi siswa.</p>
            </div>
            <form method="GET" class="flex flex-wrap items-center gap-2 sm:space-x-3 w-full md:w-auto">
                <select name="month" onchange="this.form.submit()" class="border border-[#cbd5c8] px-4 py-2 rounded-xl text-sm font-medium bg-[#f8fafc] outline-none focus:ring-2 focus:ring-[#2f6636] cursor-pointer">${monthOptions}</select>
                <input type="number" name="year" value="${year}" onchange="this.form.submit()" class="border border-[#cbd5c8] px-3 py-2 rounded-xl text-sm font-medium w-28 bg-[#f8fafc] outline-none focus:ring-2 focus:ring-[#2f6636]">
            </form>
        </div>

        <form action="/calendar/save" method="POST">
            <input type="hidden" name="year" value="${year}">
            <input type="hidden" name="month" value="${month}">
            
            <div class="bg-white rounded-2xl shadow-sm border border-[#cbd5e1] p-4 sm:p-6 overflow-x-auto">
                <div class="min-w-[700px]">
                    <div class="grid grid-cols-7 gap-3 mb-3 text-center font-black text-xs text-[#2f6636] uppercase tracking-wider">
                        <div class="text-red-600 font-bold">Sun</div>
                        <div class="font-bold">Mon</div>
                        <div class="font-bold">Tue</div>
                        <div class="font-bold">Wed</div>
                        <div class="font-bold">Thu</div>
                        <div class="font-bold">Fri</div>
                        <div class="text-red-600 font-bold">Sat</div>
                    </div>
                    <div class="grid grid-cols-7 gap-3">
                        ${calendarCells}
                    </div>
                </div>
            </div>

            <div class="mt-6 flex justify-end">
                <button type="submit" class="w-full sm:w-auto bg-[#2f6636] hover:bg-[#244f2b] text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md transition">💾 Simpan jadwal pribadi siswa</button>
            </div>
        </form>

        <div class="mt-6">
            <a href="/dashboard" class="inline-flex items-center text-[#2f6636] hover:text-[#1e293b] text-sm font-semibold transition">&larr; Kembali ke Beranda</a>
        </div>`;

        res.send(layout('Kalendar Akademik', content));
    } catch (e) { res.status(500).send("Error loading calendar"); }
});

app.post('/calendar/save', checkAuth, async (req, res) => {
    const { year, month, notes } = req.body;
    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'saveAllNotes', 
                user_id: req.user.id, 
                year: year, 
                month: month, 
                notes: notes || {} 
            }),
            headers: { 'Content-Type': 'application/json' }
        });
        cacheData = null;
        res.redirect(`/calendar?year=${year}&month=${month}`);
    } catch (e) { res.status(500).send("Error saving notes"); }
});

app.get('/kas', checkAuth, async (req, res) => {
    try {
        const db = await fetchDb();
        const userKas = db.kas.filter(k => String(k.user_id) === String(req.user.id));
        
        const period = req.query.period || 'sem1';

        const sem1Months = ["Juli 2026", "Agustus", "September", "Oktober", "November", "Desember"];
        const sem2Months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli 2027"];

        let targetMonths = [];
        if (period === 'sem2') {
            targetMonths = sem2Months;
        } else if (period === 'all') {
            targetMonths = [...sem1Months, ...sem2Months];
        } else {
            targetMonths = sem1Months;
        }

        let rows = '';

        const isPaid = (status) => {
            const s = String(status || '').trim().toLowerCase();
            return s === 'lunas' || s === 'paid';
        };

        const getRowAmount = (k, isKaos = false) => {
            let amt = Number(k?.amount);
            if (!amt || isNaN(amt)) {
                amt = isKaos ? 0 : 25000;
            }
            return amt;
        };

        // 1. Iuran Kaos HANYA muncul jika bukan di Semester 2
        if (period !== 'sem2') {
            const kaosFound = userKas.find(k => {
                const mName = String(k.month || '').trim().toLowerCase();
                return mName === 'iuran kaos' || mName === 'kaos';
            });
            const isKaosPaid = isPaid(kaosFound?.status);
            const kaosAmount = getRowAmount(kaosFound, true);
            const kaosBadge = isKaosPaid ? 'bg-[#dcfce7] text-[#166534] border border-[#bbf7d0]' : 'bg-[#fee2e2] text-[#991b1b] border border-[#fecaca]';
            
            rows += `
            <tr class="border-b border-[#cbd5e1] hover:bg-[#f8fafc] transition">
                <td class="py-4 px-6 font-semibold text-[#1e293b]">Iuran Kaos</td>
                <td class="py-4 px-6 text-sm text-[#4b5563]">Rp ${kaosAmount.toLocaleString()}</td>
                <td class="py-4 px-6"><span class="px-3 py-1 rounded-full text-xs font-bold ${kaosBadge}">${isKaosPaid ? 'Lunas' : 'Belum Bayar'}</span></td>
            </tr>`;
        }

        // 2. Render Kas Bulanan
        targetMonths.forEach((m, index) => {
            const found = userKas.find(k => String(k.month || '').trim().toLowerCase() === m.toLowerCase());
            const paid = isPaid(found?.status);
            const badge = paid ? 'bg-[#dcfce7] text-[#166534] border border-[#bbf7d0]' : 'bg-[#fee2e2] text-[#991b1b] border border-[#fecaca]';
            const rowAmount = getRowAmount(found, false);
            
            let displayLabel = m;
            if (!m.includes("2026") && !m.includes("2027")) {
                let year = (period === 'sem2' || (period === 'all' && index >= 6)) ? "2027" : "2026";
                displayLabel = `${m} ${year}`;
            }

            rows += `
            <tr class="border-b border-[#cbd5e1] hover:bg-[#f8fafc] transition">
                <td class="py-4 px-6 font-semibold text-[#1e293b]">${displayLabel}</td>
                <td class="py-4 px-6 text-sm text-[#4b5563]">Rp ${rowAmount.toLocaleString()}</td>
                <td class="py-4 px-6"><span class="px-3 py-1 rounded-full text-xs font-bold ${badge}">${paid ? 'Lunas' : 'Belum Bayar'}</span></td>
            </tr>`;
        });

        const content = `
        <div class="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-[#cbd5e1]">
            <div>
                <h2 class="text-xl sm:text-2xl font-bold text-[#1e293b]">Iuran Kas Siswa</h2>
                <p class="text-xs sm:text-sm text-[#4b5563] mt-1">💡 Iuran kas kelas adalah <strong>Rp 25.000 / bulan</strong>. Untuk iuran kaos nominal bervariasi sesuai catatan.</p>
            </div>
            <form method="GET" class="w-full md:w-auto">
                <select name="period" onchange="this.form.submit()" class="border border-[#cbd5e1] px-4 py-2 rounded-xl text-sm font-medium bg-[#f8fafc] outline-none focus:ring-2 focus:ring-[#2f6636] cursor-pointer w-full md:w-auto">
                    <option value="sem1" ${period === 'sem1' ? 'selected' : ''}>Semester 1 (Juli - Desember 2026)</option>
                    <option value="sem2" ${period === 'sem2' ? 'selected' : ''}>Semester 2 (Januari - Juli 2027)</option>
                    <option value="all" ${period === 'all' ? 'selected' : ''}>Semua Periode</option>
                </select>
            </form>
        </div>
        <div class="bg-white rounded-2xl shadow-sm border border-[#cbd5e1] overflow-hidden max-w-2xl">
            <table class="w-full text-left text-sm">
                <thead>
                    <tr class="bg-[#f1f5f9] text-[#4b5563] text-xs uppercase tracking-wider border-b border-[#cbd5e1]">
                        <th class="py-3 px-6">Bulan / Keterangan</th>
                        <th class="py-3 px-6">Nominal</th>
                        <th class="py-3 px-6">Status</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
        <div class="mt-6"><a href="/dashboard" class="inline-flex items-center text-[#2f6636] hover:text-[#1e293b] text-sm font-semibold">&larr; Kembali ke Beranda</a></div>`;
        res.send(layout('Iuran Kas Siswa', content));
    } catch (e) { res.status(500).send("Error"); }
});

app.get('/finances', checkAuth, async (req, res) => {
    try {
        const db = await fetchDb();
        let totalIncome = 0, totalExpense = 0, rows = '';
        
        db.transactions.forEach(tx => {
            const amt = Number(tx.amount);
            if (tx.type === 'income') totalIncome += amt; else totalExpense += amt;
            const badge = tx.type === 'income' ? '<span class="text-[#166534] bg-[#dcfce7] border border-[#bbf7d0] px-2.5 py-1 rounded-full text-xs font-bold">Pemasukan</span>' : '<span class="text-[#991b1b] bg-[#fee2e2] border border-[#fecaca] px-2.5 py-1 rounded-full text-xs font-bold">Pengeluaran</span>';
            
            // Menggunakan deskripsi langsung yang sudah diset di Google Apps Script (misal: Pembayaran Uang Kas - Aksa / Pembayaran Uang Kaos - Aksa)
            let descText = tx.desc;

            rows += `<tr class="border-b border-[#cbd5e1] hover:bg-[#f8fafc] transition"><td class="py-4 px-6 text-xs sm:text-sm text-[#4b5563]">${tx.date}</td><td class="py-4 px-6 font-medium text-[#1e293b] text-xs sm:text-sm">${descText}</td><td class="py-4 px-6">${badge}</td><td class="py-4 px-6 font-bold text-[#1e293b] text-xs sm:text-sm">Rp ${amt.toLocaleString()}</td></tr>`;
        });
        
        const balance = totalIncome - totalExpense;
        const content = `
        <div class="mb-6"><h2 class="text-xl sm:text-2xl font-bold text-[#1e293b]">Laporan Keuangan</h2><p class="text-xs sm:text-sm text-[#4b5563]">Laporan income & expense kelas 2A 2026/2027.</p></div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
            <div class="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-[#cbd5e1]"><span class="text-xs font-bold uppercase tracking-wider text-[#4b5563]">Total Pemasukan</span><h3 class="text-xl sm:text-2xl font-black text-[#166534] mt-1">Rp ${totalIncome.toLocaleString()}</h3></div>
            <div class="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-[#cbd5e1]"><span class="text-xs font-bold uppercase tracking-wider text-[#4b5563]">Total Pengeluaran</span><h3 class="text-xl sm:text-2xl font-black text-[#991b1b] mt-1">Rp ${totalExpense.toLocaleString()}</h3></div>
            <div class="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-[#cbd5e1]"><span class="text-xs font-bold uppercase tracking-wider text-[#4b5563]">Total Saldo</span><h3 class="text-xl sm:text-2xl font-black text-[#2f6636] mt-1">Rp ${balance.toLocaleString()}</h3></div>
        </div>
        <div class="bg-white rounded-2xl shadow-sm border border-[#cbd5e1] overflow-x-auto">
            <table class="w-full text-left min-w-[600px]">
                <thead><tr class="bg-[#f1f5f9] text-[#4b5563] text-xs uppercase tracking-wider border-b border-[#cbd5e1]"><th class="py-3 px-6">Tanggal</th><th class="py-3 px-6">Keterangan</th><th class="py-3 px-6">Tipe</th><th class="py-3 px-6">Jumlah</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
        <div class="mt-6"><a href="/dashboard" class="inline-flex items-center text-[#2f6636] hover:text-[#1e293b] text-sm font-semibold">&larr; Kembali ke Beranda</a></div>`;
        res.send(layout('Laporan Keuangan', content));
    } catch (e) { res.status(500).send("Error"); }
});

app.get('/announcements', checkAuth, async (req, res) => {
    try {
        const db = await fetchDb();
        let cards = '';
        
        db.announcements.forEach(a => {
            let imageHtml = '';
            let actionButtonsHtml = '';
            
            const rawUrl = (a.lampiran || a.image || a.file || '').trim();
            
            if (rawUrl !== '') {
                let fileId = '';
                if (rawUrl.includes('/file/d/')) {
                    const parts = rawUrl.split('/file/d/');
                    if (parts[1]) fileId = parts[1].split('/')[0];
                } else if (rawUrl.includes('id=')) {
                    const urlParams = new URLSearchParams(rawUrl.split('?')[1]);
                    fileId = urlParams.get('id');
                }

                if (fileId) {
                    const embedUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
                    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
                    
                    imageHtml = `<div class="mt-4"><img src="${embedUrl}" alt="Lampiran Pengumuman" class="rounded-xl max-h-80 w-auto object-cover border border-[#cbd5e1]" onerror="this.parentElement.style.display='none'"></div>`;
                    
                    actionButtonsHtml = `
                    <div class="mt-3 flex flex-wrap gap-2">
                        <a href="${rawUrl}" target="_blank" class="inline-flex items-center space-x-2 bg-[#f0fdf4] hover:bg-[#dcfce7] text-[#166534] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border border-[#bbf7d0] transition">
                            <span>📁</span><span>Buka di Google Drive</span>
                        </a>
                        <a href="${downloadUrl}" target="_blank" class="inline-flex items-center space-x-2 bg-[#2f6636] hover:bg-[#244f2b] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition">
                            <span>📥</span><span>Download Lampiran</span>
                        </a>
                    </div>`;
                } else {
                    imageHtml = `<div class="mt-4"><img src="${rawUrl}" alt="Lampiran Pengumuman" class="rounded-xl max-h-80 w-auto object-cover border border-[#cbd5e1]" onerror="this.parentElement.style.display='none'"></div>`;
                    
                    actionButtonsHtml = `
                    <div class="mt-3 flex flex-wrap gap-2">
                        <a href="${rawUrl}" target="_blank" class="inline-flex items-center space-x-2 bg-[#f0fdf4] hover:bg-[#dcfce7] text-[#166534] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border border-[#bbf7d0] transition">
                            <span>🔗</span><span>Buka Link</span>
                        </a>
                        <a href="${rawUrl}" download target="_blank" class="inline-flex items-center space-x-2 bg-[#2f6636] hover:bg-[#244f2b] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition">
                            <span>📥</span><span>Download Lampiran</span>
                        </a>
                    </div>`;
                }
            }

            const contentText = String(a.content || '').replace(/\\n/g, '\n');

            cards += `
            <div class="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-[#2f6636] border border-[#cbd5e1] mb-5">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                    <h3 class="font-bold text-lg text-[#1e293b] flex items-center space-x-2"><span>📢</span><span>${a.title}</span></h3>
                    <span class="text-xs font-semibold bg-[#f1f5f9] text-[#4b5563] px-3 py-1 rounded-full border border-[#cbd5e1]">${a.date}</span>
                </div>
                <p class="text-[#1e293b] text-sm leading-relaxed whitespace-pre-wrap break-words">${contentText}</p>
                ${imageHtml}
                ${actionButtonsHtml}
            </div>`;
        });

        const content = `
        <div class="mb-6">
            <h2 class="text-xl sm:text-2xl font-bold text-[#1e293b]">Pengumuman Sekolah</h2>
            <p class="text-xs sm:text-sm text-[#4b5563]">Informasi dan pengumuman resmi dari pihak sekolah untuk walimurid kelas 2A.</p>
        </div>
        <div class="space-y-4">${cards}</div>
        <div class="mt-6"><a href="/dashboard" class="inline-flex items-center text-[#2f6636] hover:text-[#1e293b] text-sm font-semibold">&larr; Kembali ke Beranda</a></div>`;
        res.send(layout('Pengumuman', content));
    } catch (e) { res.status(500).send("Error"); }
});

app.get('/change-password', checkAuth, (req, res) => {
    const context = `
    <div class="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-[#cbd5e1]">
        <h2 class="text-xl font-bold text-[#1e293b] mb-6">Ganti Password</h2>
        <form action="/change-password" method="POST" class="space-y-4">
            <div>
                <label class="block text-sm font-semibold text-[#1e293b]">Password Lama</label>
                <input type="password" name="oldPassword" required class="w-full px-4 py-2 border border-[#cbd5e1] rounded-xl outline-none focus:ring-2 focus:ring-[#2f6636]">
            </div>
            <div>
                <label class="block text-sm font-semibold text-[#1e293b]">Password Baru</label>
                <input type="password" name="newPassword" required class="w-full px-4 py-2 border border-[#cbd5e1] rounded-xl outline-none focus:ring-2 focus:ring-[#2f6636]">
            </div>
            <button type="submit" class="w-full bg-[#2f6636] text-white py-3 rounded-xl font-bold hover:bg-[#244f2b]">Simpan Password Baru</button>
        </form>
        <div class="mt-6"><a href="/dashboard" class="text-[#2f6636] font-semibold">&larr; Kembali ke Beranda</a></div>
    </div>`;
    res.send(layout('Ganti Password', context));
});

app.post('/change-password', checkAuth, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (String(req.user.password).trim() !== String(oldPassword).trim()) {
        return res.send(`<script>alert('Password lama salah!'); window.location.href='/change-password';</script>`);
    }
    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'updatePassword', user_id: req.user.id, newPassword: newPassword }),
            headers: { 'Content-Type': 'application/json' }
        });
        cacheData = null; 
        res.send(`<script>alert('Password berhasil diubah, silakan login kembali.'); window.location.href='/logout';</script>`);
    } catch (e) { res.status(500).send("Error updating password"); }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));