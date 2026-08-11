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
        
        // KUNCI UTAMA: Hapus cache agar data password baru langsung terbaca
        cacheData = null; 

        res.send(`<script>alert('Password berhasil diubah, silakan login kembali.'); window.location.href='/logout';</script>`);
    } catch (e) { res.status(500).send("Error updating password"); }
});