app.get('/kas', checkAuth, async (req, res) => {
    try {
        const db = await fetchDb();
        const userKas = db.kas.filter(k => String(k.user_id) === String(req.user.id));
        
        const period = req.query.period || 'sem1';

        // Daftar bulan murni bahasa Indonesia sesuai spreadsheet Anda
        const sem1Months = ["Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        const sem2Months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli"];

        let targetMonths = [];
        if (period === 'sem2') {
            targetMonths = sem2Months;
        } else if (period === 'all') {
            targetMonths = [...sem1Months, ...sem2Months];
        } else {
            targetMonths = sem1Months;
        }

        let rows = '';

        // Fungsi pengecekan status (bisa mendeteksi 'Lunas' ataupun 'Paid')
        const checkStatus = (status) => {
            const s = String(status).trim().toLowerCase();
            return s === 'lunas' || s === 'paid';
        };

        // 1. Iuran Kaos (Paling Atas)
        const kaosFound = userKas.find(k => {
            const mName = String(k.month).trim().toLowerCase();
            return mName === 'iuran kaos' || mName === 'kaos';
        });
        const isKaosPaid = checkStatus(kaosFound?.status);
        const kaosBadge = isKaosPaid ? 'bg-[#e8f2ec] text-[#2e6930] border border-[#cbe3d1]' : 'bg-[#fceeee] text-[#b33a3a] border border-[#fad2d2]';
        
        rows += `<tr class="border-b border-[#d8ded5] hover:bg-[#f0f2ef] transition"><td class="py-4 px-6 font-semibold text-[#363d34]">Iuran Kaos</td><td class="py-4 px-6"><span class="px-3 py-1 rounded-full text-xs font-bold ${kaosBadge}">${isKaosPaid ? 'Lunas' : 'Belum Bayar'}</span></td></tr>`;

        // 2. Render Kas Bulanan
        targetMonths.forEach(m => {
            const found = userKas.find(k => String(k.month).trim().toLowerCase() === m.toLowerCase());
            const isPaid = checkStatus(found?.status);
            const badge = isPaid ? 'bg-[#e8f2ec] text-[#2e6930] border border-[#cbe3d1]' : 'bg-[#fceeee] text-[#b33a3a] border border-[#fad2d2]';
            rows += `<tr class="border-b border-[#d8ded5] hover:bg-[] transition"><td class="py-4 px-6 font-semibold text-[#363d34]">${m}</td><td class="py-4 px-6"><span class="px-3 py-1 rounded-full text-xs font-bold ${badge}">${isPaid ? 'Lunas' : 'Belum Bayar'}</span></td></tr>`;
        });

        const content = `
        <div class="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-[#d8ded5]">
            <div>
                <h2 class="text-xl sm:text-2xl font-bold text-[#363d34]">Iuran Kas Siswa</h2>
                <p class="text-xs sm:text-sm text-[#717d6e]">Track pembayaran iuran kas kelas dan iuran kaos ananda.</p>
            </div>
            <form method="GET" class="w-full md:w-auto">
                <select name="period" onchange="this.form.submit()" class="border border-[#cbd5c8] px-4 py-2 rounded-xl text-sm font-medium bg-[#f5f7f4] outline-none focus:ring-2 focus:ring-[#586b55] cursor-pointer w-full md:w-auto">
                    <option value="sem1" ${period === 'sem1' ? 'selected' : ''}>Semester 1 (Juli - Des)</option>
                    <option value="sem2" ${period === 'sem2' ? 'selected' : ''}>Semester 2 (Jan - Juli)</option>
                    <option value="all" ${period === 'all' ? 'selected' : ''}>Semua Periode</option>
                </select>
            </form>
        </div>
        <div class="bg-white rounded-2xl shadow-sm border border-[#d8ded5] overflow-hidden max-w-xl">
            <table class="w-full text-left text-sm">
                <thead><tr class="bg-[#f0f2ef] text-[#717d6e] text-xs uppercase tracking-wider border-b border-[#d8ded5]"><th class="py-3 px-6">Bulan</th><th class="py-3 px-6">Status</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
        <div class="mt-6"><a href="/dashboard" class="inline-flex items-center text-[#586b55] hover:text-[#363d34] text-sm font-semibold">&larr; Kembali ke Beranda</a></div>`;
        res.send(layout('Iuran Kas Siswa', content));
    } catch (e) { res.status(500).send("Error"); }
});