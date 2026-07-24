// app.js - Logika Frontend untuk Admin Dashboard
const API_BASE = "http://127.0.0.1:8000";

// --- GLOBAL LAPORAN ENGINE ---
window.globalDataLaporan = [];

window.renderChart = function(counts) {
    const barsContainer = document.getElementById('categoryVisualBars');
    const totalCount = counts.paket + counts.hotel + counts.transport + counts.wisata;
    const calcTotal = totalCount || 1;

    if (barsContainer) {
        const categories = [
            { name: 'Paket Wisata', count: counts.paket, color: '#3b82f6' },
            { name: 'Hotel', count: counts.hotel, color: '#8b5cf6' },
            { name: 'Transportasi', count: counts.transport, color: '#10b981' },
            { name: 'Tempat Wisata', count: counts.wisata, color: '#f59e0b' }
        ];

        let html = '<div style="font-size:0.85rem; font-weight:600; color:#94a3b8; margin-bottom:12px;">📊 Persentase Penjualan per Kategori</div>';
        categories.forEach(c => {
            const pct = totalCount > 0 ? Math.round((c.count / calcTotal) * 100) : 0;
            html += `
                <div style="margin-bottom:10px;">
                    <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:#e2e8f0; margin-bottom:4px;">
                        <span><span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${c.color}; margin-right:6px;"></span>${c.name}</span>
                        <span style="font-weight:bold;">${c.count} Transaksi (${pct}%)</span>
                    </div>
                    <div style="width:100%; background:rgba(255,255,255,0.1); height:8px; border-radius:4px; overflow:hidden;">
                        <div style="width:${pct}%; background:${c.color}; height:100%; border-radius:4px; transition:width 0.5s;"></div>
                    </div>
                </div>
            `;
        });
        barsContainer.innerHTML = html;
    }

    const container = document.getElementById('salesChartContainer');
    if (container) {
        const data = [
            { label: 'Paket Wisata', value: counts.paket, color: '#3b82f6' },
            { label: 'Hotel', value: counts.hotel, color: '#8b5cf6' },
            { label: 'Transportasi', value: counts.transport, color: '#10b981' },
            { label: 'Tempat Wisata', value: counts.wisata, color: '#f59e0b' }
        ];

        let cumulativePercent = 0;
        let svgSlices = '';

        data.forEach(item => {
            if (item.value > 0) {
                const percent = item.value / calcTotal;
                const strokeDasharray = `${percent * 251.2} ${251.2 * (1 - percent)}`;
                const strokeDashoffset = -cumulativePercent * 251.2;
                
                svgSlices += `<circle cx="50" cy="50" r="40" fill="none" stroke="${item.color}" 
                    stroke-width="16" stroke-dasharray="${strokeDasharray}" 
                    stroke-dashoffset="${strokeDashoffset}" transform="rotate(-90 50 50)" />`;
                
                cumulativePercent += percent;
            }
        });

        container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:5px 0;">
                <div style="position:relative; width:160px; height:160px;">
                    <svg width="160" height="160" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="16"/>
                        ${svgSlices}
                    </svg>
                    <div style="position:absolute; top:0; left:0; width:100%; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center; color:#fff;">
                        <span style="font-size:1.6rem; font-weight:800; color:#38bdf8;">${totalCount}</span>
                        <span style="font-size:0.65rem; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px;">Transaksi</span>
                    </div>
                </div>
            </div>`;
    }
};

window.getItemCategory = function(b) {
    if (!b) return "paket";
    if (b.tipe_pesanan) {
        const t = b.tipe_pesanan.toLowerCase();
        if (t.includes("hotel") || t === "htl") return "hotel";
        if (t.includes("trans") || t.includes("transport") || t === "trn") return "transport";
        if (t.includes("wst") || t.includes("wisata")) return "wisata";
        if (t.includes("paket") || t === "pkg") return "paket";
    }
    const str = ((b.id_paket || '') + ' ' + (b.id_booking || '') + ' ' + (b.pilihan_transportasi || '')).toUpperCase();
    if (str.includes("HTL") || str.includes("HOTEL")) return "hotel";
    if (str.includes("TRN") || str.includes("TRANS")) return "transport";
    if (str.includes("WST") || str.includes("WISATA")) return "wisata";
    return "paket";
};

window.currentFilterTipe = "all";
window.currentFilterPeriode = "all";

window.filterLaporanKategori = function(val) {
    window.currentFilterTipe = val || "all";
    window.renderLaporanUI();
};

window.filterLaporanPeriode = function(val) {
    window.currentFilterPeriode = val || "all";
    window.renderLaporanUI();
};

window.filterByPeriod = function(list, periode) {
    if (!periode || periode === "all") return list;

    const refDate = new Date();
    const refYear = refDate.getFullYear();
    const refMonth = refDate.getMonth();
    const refDay = refDate.getDate();

    return list.filter(b => {
        const rawStr = b.tanggal_berangkat || b.tanggal_booking || '';
        if (!rawStr) return false;
        
        const bDate = new Date(rawStr);
        if (isNaN(bDate.getTime())) return true;

        const bYear = bDate.getFullYear();
        const bMonth = bDate.getMonth();
        const bDay = bDate.getDate();

        if (periode === "harian") {
            return (bYear === refYear && bMonth === refMonth && bDay === refDay) ||
                   rawStr.startsWith(refDate.toISOString().slice(0, 10));
        }

        if (periode === "mingguan") {
            const diffTime = Math.abs(bDate - refDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 7 || (bYear === refYear && bMonth === refMonth);
        }

        if (periode === "bulanan") {
            return (bYear === refYear && bMonth === refMonth) ||
                   (bYear === refYear && Math.abs(bMonth - refMonth) <= 1);
        }

        if (periode === "tahunan") {
            return bYear === refYear;
        }

        return true;
    });
};

window.downloadCSVLaporan = function() {
    const filterTipe = window.currentFilterTipe || "all";
    const filterPeriode = window.currentFilterPeriode || "all";

    const allLunas = (window.globalDataLaporan || []).filter(b => {
        const s1 = (b.status || '').toString();
        const s2 = (b.status_pembayaran || '').toString();
        return s2 === "Lunas" || (s1 === "Lunas" && !s2.includes("Menunggu"));
    });

    let periodList = window.filterByPeriod(allLunas, filterPeriode);
    let list = periodList;
    if (filterTipe !== "all") {
        list = periodList.filter(b => window.getItemCategory(b) === filterTipe);
    }

    if (list.length === 0) {
        alert("Belum ada data transaksi Lunas untuk periode & kategori ini.");
        return;
    }

    let periodTitle = "KESELURUHAN";
    let periodFileTag = "Keseluruhan";
    if (filterPeriode === "harian") { periodTitle = "HARIAN (HARI INI)"; periodFileTag = "Harian"; }
    if (filterPeriode === "mingguan") { periodTitle = "MINGGUAN (7 HARI TERAKHIR)"; periodFileTag = "Mingguan"; }
    if (filterPeriode === "bulanan") { periodTitle = "BULANAN (BULAN INI)"; periodFileTag = "Bulanan"; }
    if (filterPeriode === "tahunan") { periodTitle = "TAHUNAN (TAHUN INI)"; periodFileTag = "Tahunan"; }

    let grandTotalMoney = 0;
    let categoryStats = {
        hotel: { name: 'Hotel', count: 0, totalMoney: 0 },
        transport: { name: 'Transportasi', count: 0, totalMoney: 0 },
        wisata: { name: 'Tempat Wisata', count: 0, totalMoney: 0 },
        paket: { name: 'Paket Wisata', count: 0, totalMoney: 0 }
    };

    list.forEach(b => {
        const price = Math.round(b.total_harga || 0);
        grandTotalMoney += price;
        const catKey = window.getItemCategory(b);
        if (categoryStats[catKey]) {
            categoryStats[catKey].count++;
            categoryStats[catKey].totalMoney += price;
        }
    });

    const totalTransCount = list.length;
    const todayStr = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

    let excelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <!--[if gte mso 9]>
        <xml>
            <x:ExcelWorkbook>
                <x:ExcelWorksheets>
                    <x:ExcelWorksheet>
                        <x:Name>Laporan ${periodFileTag}</x:Name>
                        <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
                    </x:ExcelWorksheet>
                </x:ExcelWorksheets>
            </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; }
            .hdr-main { font-size: 16pt; font-weight: bold; color: #ffffff; background-color: #0284c7; text-align: center; padding: 12px; }
            .hdr-sub { font-size: 10pt; color: #475569; text-align: center; background-color: #f1f5f9; padding: 6px; font-style: italic; }
            .sec-head { font-size: 12pt; font-weight: bold; color: #ffffff; background-color: #0f172a; padding: 8px 12px; }
            .card-title { font-weight: bold; background-color: #f8fafc; border: 1px solid #cbd5e1; }
            .card-val { font-weight: bold; color: #166534; font-size: 12pt; background-color: #f8fafc; border: 1px solid #cbd5e1; }
            .th-head { background-color: #0369a1; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #0284c7; padding: 8px; }
            .td-cell { border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 10pt; }
            .td-num { text-align: right; font-weight: bold; color: #166534; }
            .td-center { text-align: center; }
            .bar-visual { font-family: monospace; font-size: 10pt; color: #0284c7; font-weight: bold; }
            .total-row { background-color: #e2e8f0; font-weight: bold; font-size: 11pt; }
        </style>
    </head>
    <body>
        <table>
            <tr><td colspan="7" class="hdr-main">📊 LAPORAN PENJUALAN ${periodTitle} - TRAVELNUSA</td></tr>
            <tr><td colspan="7" class="hdr-sub">Tanggal Cetak: ${todayStr} | Periode: ${periodFileTag} | Status Data: 100% LUNAS</td></tr>
            <tr><td colspan="7"></td></tr>

            <tr><td colspan="7" class="sec-head">📈 1. RINGKASAN PENJUALAN (${periodTitle})</td></tr>
            <tr>
                <td colspan="3" class="td-cell card-title">Total Uang Penjualan (Lunas):</td>
                <td colspan="4" class="td-cell card-val">Rp ${grandTotalMoney.toLocaleString('id-ID')}</td>
            </tr>
            <tr>
                <td colspan="3" class="td-cell card-title">Total Jumlah Transaksi Lunas:</td>
                <td colspan="4" class="td-cell card-val" style="color:#0284c7;">${totalTransCount} Transaksi</td>
            </tr>
            <tr><td colspan="7"></td></tr>

            <tr><td colspan="7" class="sec-head">📦 2. TOTAL PENJUALAN PER KATEGORI PRODUK & DIAGRAM VISUAL</td></tr>
            <tr>
                <td class="th-head" style="width:160px;">Kategori Produk</td>
                <td class="th-head" style="width:120px;">Jumlah Transaksi</td>
                <td class="th-head" style="width:180px;">Total Penjualan (Rp)</td>
                <td class="th-head" style="width:100px;">Persentase</td>
                <td colspan="3" class="th-head" style="width:250px;">Diagram Visual Komposisi</td>
            </tr>`;

    Object.keys(categoryStats).forEach(key => {
        const cat = categoryStats[key];
        const pct = totalTransCount > 0 ? Math.round((cat.count / totalTransCount) * 100) : 0;
        const filledBars = Math.round(pct / 10);
        const barVisual = '█'.repeat(filledBars) + '░'.repeat(10 - filledBars);

        excelHtml += `
            <tr>
                <td class="td-cell"><b>${cat.name}</b></td>
                <td class="td-cell td-center">${cat.count} Transaksi</td>
                <td class="td-cell td-num">Rp ${cat.totalMoney.toLocaleString('id-ID')}</td>
                <td class="td-cell td-center"><b>${pct}%</b></td>
                <td colspan="3" class="td-cell bar-visual"><code>${barVisual}</code> ${pct}%</td>
            </tr>`;
    });

    excelHtml += `
            <tr><td colspan="7"></td></tr>
            <tr><td colspan="7" class="sec-head">📋 3. RINCIAN TRANSAKSI PENJUALAN INDIVIDUAL</td></tr>
            <tr>
                <td class="th-head">ID Booking</td>
                <td class="th-head">Kategori Produk</td>
                <td class="th-head">Nama Pemesan</td>
                <td class="th-head">Tanggal Transaksi</td>
                <td class="th-head">Item ID</td>
                <td class="th-head">Total Pembayaran (Rp)</td>
                <td class="th-head">Status Pembayaran</td>
            </tr>`;

    list.forEach(b => {
        const catKey = window.getItemCategory(b);
        const catName = categoryStats[catKey] ? categoryStats[catKey].name : "Paket Wisata";
        const price = Math.round(b.total_harga || 0);

        excelHtml += `
            <tr>
                <td class="td-cell" style="mso-number-format:'\\@';">${b.id_booking || '-'}</td>
                <td class="td-cell td-center"><b>${catName}</b></td>
                <td class="td-cell">${b.nama_peserta || '-'}</td>
                <td class="td-cell td-center">${b.tanggal_berangkat || b.tanggal_booking || '-'}</td>
                <td class="td-cell td-center">${b.id_paket || '-'}</td>
                <td class="td-cell td-num">Rp ${price.toLocaleString('id-ID')}</td>
                <td class="td-cell td-center" style="color:#166534; font-weight:bold;">LUNAS</td>
            </tr>`;
    });

    excelHtml += `
            <tr class="total-row">
                <td colspan="5" class="td-cell" style="text-align:right;"><b>GRAND TOTAL PENJUALAN:</b></td>
                <td class="td-cell td-num" style="color:#166534; font-size:11pt;"><b>Rp ${grandTotalMoney.toLocaleString('id-ID')}</b></td>
                <td class="td-cell td-center" style="color:#166534;"><b>${totalTransCount} LUNAS</b></td>
            </tr>
        </table>
    </body>
    </html>`;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `Laporan_Penjualan_${periodFileTag}_TravelNusa_${new Date().toISOString().slice(0,10)}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
};

window.renderLaporanUI = function() {
    const filterTipe = window.currentFilterTipe || "all";
    const filterPeriode = window.currentFilterPeriode || "all";

    const tbody = document.getElementById('tabelLaporan');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    let allLunas = (window.globalDataLaporan || []).filter(b => {
        const s1 = (b.status || '').toString();
        const s2 = (b.status_pembayaran || '').toString();
        return s2 === "Lunas" || (s1 === "Lunas" && !s2.includes("Menunggu"));
    });

    let periodList = window.filterByPeriod(allLunas, filterPeriode);

    let totalUang = 0;
    let counts = { paket: 0, hotel: 0, transport: 0, wisata: 0 };

    periodList.forEach(b => {
        totalUang += b.total_harga || 0;
        const t = window.getItemCategory(b);
        b.tipe_pesanan = t;
        if (counts[t] !== undefined) counts[t]++;
    });

    let filteredData = periodList;
    if (filterTipe !== "all") {
        filteredData = periodList.filter(b => window.getItemCategory(b) === filterTipe);
    }

    if (filteredData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:#cbd5e1; font-style:italic;">Belum ada transaksi Lunas untuk periode & kategori ini.</td></tr>`;
    } else {
        filteredData.forEach(b => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
            const catName = window.getItemCategory(b);
            let catLabel = "Paket Wisata";
            if (catName === "hotel") catLabel = "Hotel";
            if (catName === "transport") catLabel = "Transportasi";
            if (catName === "wisata") catLabel = "Tempat Wisata";

            tr.innerHTML = `
                <td style="padding:10px; color:#ffffff;">${b.id_booking || '-'}</td>
                <td style="padding:10px;"><span style="background:#e2e8f0; color:#1e293b; padding:2px 8px; border-radius:10px; font-size:0.8rem; font-weight:600;">${catLabel}</span></td>
                <td style="padding:10px; color:#ffffff;">${b.nama_peserta || '-'}</td>
                <td style="padding:10px; color:#ffffff;">${b.tanggal_berangkat || b.tanggal_booking || '-'}</td>
                <td style="padding:10px; color:#ffffff;">${b.id_paket || '-'}</td>
                <td style="padding:10px; font-weight:bold; color:#4ade80;">Rp${(b.total_harga || 0).toLocaleString('id-ID')}</td>
                <td style="padding:10px;"><span style="color:#4ade80; font-weight:600;">Lunas</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

    const sumRp = document.getElementById('summaryTotalPenjualan');
    const sumTr = document.getElementById('summaryTotalTransaksi');
    if (sumRp) sumRp.innerText = `Rp ${totalUang.toLocaleString('id-ID')}`;
    if (sumTr) sumTr.innerText = periodList.length;

    window.renderChart(counts);
};

window.loadLaporan = async function() {
    try {
        const res = await fetch(API_BASE + "/booking");
        if (res.ok) {
            const rawData = await res.json();
            // FILTER HANYA DATA LUNAS (MENUNGGU PEMBAYARAN DIABAIKAN)
            const lunasData = rawData.filter(b => {
                const s1 = (b.status || '').toString();
                const s2 = (b.status_pembayaran || '').toString();
                return s2 === "Lunas" || (s1 === "Lunas" && !s2.includes("Menunggu"));
            });

            window.globalDataLaporan = lunasData.map(b => {
                b.tipe_pesanan = window.getItemCategory(b);
                return b;
            });
            const sel = document.getElementById('laporanTipeFilter');
            const filterVal = sel ? sel.value : "all";
            window.renderLaporanUI(filterVal);
        }
    } catch (e) {
        console.error("Gagal memuat laporan", e);
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const formPaketBaru = document.getElementById("formPaketBaru");
    const formHotel = document.getElementById("formHotel");
    const formTransport = document.getElementById("formTransport");

    // Set Admin Profile UI
    const currentAdmin = getUserData();
    if(currentAdmin) {
        document.getElementById('navAdminName').innerText = currentAdmin.name;
        document.getElementById('navAdminPic').src = currentAdmin.picture;
    }

    // Tab Switching with Automatic Category Filtering for Ticket Tables
    window.switchAdminTab = (tabName) => {
        document.querySelectorAll('.admin-tab').forEach(t => t.style.display = 'none');
        if (tabName === 'paket') {
            document.getElementById('tabPaket').style.display = 'block';
            window.filterTabelBooking('paket');
        }
        if (tabName === 'hotel') {
            document.getElementById('tabHotel').style.display = 'block';
            window.filterTabelBooking('hotel');
        }
        if (tabName === 'transport') {
            document.getElementById('tabTransport').style.display = 'block';
            window.filterTabelBooking('transport');
        }
        if (tabName === 'wisata') {
            document.getElementById('tabWisata').style.display = 'block';
            window.filterTabelBooking('wisata');
        }
        if (tabName === 'booking') {
            window.filterTabelBooking('all');
        }
        if (tabName === 'laporan') {
            document.getElementById('tabLaporan').style.display = 'block';
            window.renderLaporanUI();
            window.loadLaporan();
        }
    };

    formPaketBaru.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const tipePaket = document.getElementById("tipePaket").value;
        const namaPaket = document.getElementById("namaPaket").value;
        const destinasi = document.getElementById("destinasi").value;
        const harga = document.getElementById("harga").value;
        const kuota = document.getElementById("kuota").value;
        const diskon = document.getElementById("paketDiskon").value || 0;
        const idPaket = "PKG-" + Math.floor(Math.random() * 10000);

        const formData = new FormData();
        formData.append("tipe", tipePaket);
        formData.append("id_paket", idPaket);
        formData.append("nama_paket", namaPaket);
        formData.append("destinasi", destinasi);
        formData.append("harga", harga);
        formData.append("kuota", kuota);
        formData.append("diskon", diskon);

        // Multiple file upload
        const gambarFiles = document.getElementById("gambarPaket").files;
        if (gambarFiles && gambarFiles.length > 0) {
            for (let i = 0; i < Math.min(gambarFiles.length, 5); i++) {
                formData.append("gambar", gambarFiles[i]);
            }
        }

        const videoFile = document.getElementById("videoPaket").files[0];
        if (videoFile) {
            formData.append("video", videoFile);
        }

        try {
            const res = await fetch(`${API_BASE}/paket`, {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message || `Paket ${namaPaket} berhasil ditambahkan!`);
                formPaketBaru.reset();
                loadKatalog(); // update tabel
            } else {
                alert("Gagal: " + (data.detail || "Kesalahan server"));
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Gagal terhubung ke Backend API.");
        }
    });
    formHotel.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("id_hotel", "HTL-" + Math.floor(Math.random() * 10000));
        formData.append("nama_hotel", document.getElementById("hotelNama").value);
        formData.append("lokasi", document.getElementById("hotelLokasi").value);
        formData.append("bintang", document.getElementById("hotelBintang").value);
        formData.append("tipe_kamar", document.getElementById("hotelTipeKamar").value);
        formData.append("diskon", document.getElementById("hotelDiskon").value || 0);
        
        const file = document.getElementById("hotelGambar").files[0];
        if (file) formData.append("gambar", file);

        try {
            const res = await fetch(`${API_BASE}/hotel`, { method: "POST", body: formData });
            if (res.ok) {
                alert("Hotel berhasil ditambahkan!");
                formHotel.reset();
                loadHotel();
            } else alert("Gagal");
        } catch(err) { alert("Server error"); }
    });

    formTransport.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("id_transport", "TRN-" + Math.floor(Math.random() * 10000));
        formData.append("jenis", document.getElementById("transJenis").value);
        formData.append("operator", document.getElementById("transOperator").value);
        formData.append("rute", document.getElementById("transRute").value);
        formData.append("harga", document.getElementById("transHarga").value);
        formData.append("diskon", document.getElementById("transDiskon").value || 0);
        
        const file = document.getElementById("transGambar").files[0];
        if (file) formData.append("gambar", file);

        try {
            const res = await fetch(`${API_BASE}/transportasi`, { method: "POST", body: formData });
            if (res.ok) {
                alert("Transportasi berhasil ditambahkan!");
                formTransport.reset();
                loadTransportasi();
            } else alert("Gagal");
        } catch(err) { alert("Server error"); }
    });

    const formWisata = document.getElementById("formWisata");
    if (formWisata) {
        formWisata.addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData();
            formData.append("id_wisata", "WST-" + Math.floor(Math.random() * 10000));
            formData.append("nama_tempat", document.getElementById("wisataNama").value);
            formData.append("lokasi", document.getElementById("wisataLokasi").value);
            formData.append("harga", document.getElementById("wisataHarga").value);
            formData.append("diskon", document.getElementById("wisataDiskon").value || 0);
            
            const file = document.getElementById("wisataGambar").files[0];
            if (file) formData.append("gambar", file);

            try {
                const res = await fetch(`${API_BASE}/wisata`, { method: "POST", body: formData });
                if (res.ok) {
                    alert("Tempat wisata berhasil ditambahkan!");
                    formWisata.reset();
                    loadWisata();
                } else alert("Gagal");
            } catch(err) { alert("Server error"); }
        });
    }

    const formEditWisata = document.getElementById("formEditWisata");
    if (formEditWisata) {
        formEditWisata.addEventListener("submit", async (e) => {
            e.preventDefault();
            const id = document.getElementById("editWisataId").value;
            const formData = new FormData();
            formData.append("nama_tempat", document.getElementById("editWisataNama").value);
            formData.append("lokasi", document.getElementById("editWisataLokasi").value);
            formData.append("harga", document.getElementById("editWisataHarga").value);
            formData.append("diskon", document.getElementById("editWisataDiskon").value || 0);
            
            const file = document.getElementById("editWisataGambar").files[0];
            if (file) {
                formData.append("gambar", file);
            }
            
            try {
                const res = await fetch(`${API_BASE}/wisata/${id}`, {
                    method: "PUT",
                    body: formData
                });
                if (res.ok) {
                    alert("Tempat Wisata berhasil diperbarui!");
                    document.getElementById("modalEditWisata").style.display = "none";
                    loadWisata();
                } else alert("Gagal update data");
            } catch(e) { alert("Server Error"); }
        });

        document.getElementById("btnBatalEditWisata").addEventListener("click", () => {
            document.getElementById("modalEditWisata").style.display = "none";
        });
    }
});

window.currentBookingFilter = "all";

window.filterTabelBooking = function(val) {
    window.currentBookingFilter = val || "all";
    const sel = document.getElementById('bookingFilterTipe');
    if (sel && sel.value !== val) sel.value = val;
    loadBooking();
};

async function loadBooking() {
    try {
        const res = await fetch(`${API_BASE}/booking`);
        if (res.ok) {
            const rawData = await res.json();
            
            // HANYA DATA LUNAS YANG DICATAT & DITAMPILKAN (MENUNGGU PEMBAYARAN DIABAIKAN SAMA SEKALI)
            const dataLunas = rawData.filter(b => {
                const s1 = (b.status || '').toString();
                const s2 = (b.status_pembayaran || '').toString();
                return s2 === "Lunas" || (s1 === "Lunas" && !s2.includes("Menunggu"));
            });

            // Populate globalDataLaporan with category inference
            window.globalDataLaporan = dataLunas.map(b => {
                b.tipe_pesanan = window.getItemCategory(b);
                return b;
            });

            const filterTipe = window.currentBookingFilter || "all";

            // FILTER DATA DISESUAIKAN DENGAN KATEGORI PRODUK EKSKLUSIF
            let displayData = dataLunas;
            if (filterTipe !== "all") {
                displayData = dataLunas.filter(b => window.getItemCategory(b) === filterTipe);
            }

            const tbody = document.getElementById("tabelBooking");
            if (!tbody) return;
            tbody.innerHTML = "";

            if (displayData.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="padding:15px; text-align:center; color:#cbd5e1; font-style:italic;">Belum ada pesanan lunas untuk kategori ini.</td></tr>';
                return;
            }

            displayData.forEach(b => {
                const catName = window.getItemCategory(b);
                let catLabel = "Paket Wisata";
                if (catName === "hotel") catLabel = "Hotel";
                if (catName === "transport") catLabel = "Transportasi";
                if (catName === "wisata") catLabel = "Tempat Wisata";

                tbody.innerHTML += `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
                    <td style="padding:10px; color:#ffffff;">${b.id_booking}</td>
                    <td style="padding:10px;"><span style="background:#e2e8f0; color:#1e293b; padding:2px 8px; border-radius:10px; font-size:0.8rem; font-weight:600;">${catLabel}</span></td>
                    <td style="padding:10px; color:#ffffff;">${b.nama_peserta} (${b.jumlah_orang} org)</td>
                    <td style="padding:10px; color:#ffffff;">${b.tanggal_berangkat || b.tanggal_booking || '-'}</td>
                    <td style="padding:10px; color:#ffffff;">${b.pilihan_transportasi || 'Bus'}</td>
                    <td style="padding:10px; font-weight:bold; color:#4ade80;">Rp${(Math.round(b.total_harga || 0)).toLocaleString('id-ID')}</td>
                    <td style="padding:10px; color:#22c55e; font-weight:bold;">Lunas</td>
                </tr>`;
            });
            
            window.renderLaporanUI();
        }
    } catch (e) {
        console.error("Gagal memuat tiket", e);
    }
}

// Panggil saat load
document.addEventListener("DOMContentLoaded", () => {
    loadBooking();
    loadKatalog();
});

// === LOGIKA KELOLA KATALOG (CRUD) ===
let listKatalog = [];
const modalEdit = document.getElementById('modalEditPaket');

async function loadKatalog() {
    try {
        const res = await fetch(`${API_BASE}/paket`);
        if (res.ok) {
            listKatalog = await res.json();
            const tbody = document.getElementById("tabelKatalog");
            tbody.innerHTML = "";
            if (listKatalog.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="padding:10px;">Belum ada paket.</td></tr>';
                return;
            }
            listKatalog.forEach(p => {
                tbody.innerHTML += `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
                    <td style="padding:10px;">${p.id_paket}</td>
                    <td style="padding:10px;">${p.tipe}</td>
                    <td style="padding:10px;">${p.nama_paket}</td>
                    <td style="padding:10px;">Rp${(p.harga_dasar||0).toLocaleString('id-ID')} ${p.diskon ? `<span style="background:orange; color:white; padding:2px 5px; border-radius:3px; font-size:10px;">-${p.diskon}%</span>` : ''}</td>
                    <td style="padding:10px;">
                        <button onclick="bukaEdit('${p.id_paket}')" style="background:#eab308; padding:5px 10px; font-size:0.8rem; margin-right:5px;">Edit</button>
                        <button onclick="hapusPaket('${p.id_paket}')" style="background:#ef4444; padding:5px 10px; font-size:0.8rem;">Hapus</button>
                    </td>
                </tr>`;
            });
        }
    } catch (e) {
        console.error("Gagal memuat katalog", e);
    }
}

window.bukaEdit = (id_paket) => {
    const p = listKatalog.find(x => x.id_paket === id_paket);
    if(p) {
        document.getElementById('editIdPaket').value = p.id_paket;
        document.getElementById('editNama').value = p.nama_paket;
        document.getElementById('editDestinasi').value = p.destinasi;
        document.getElementById('editHarga').value = p.harga_dasar;
        document.getElementById('editKuota').value = p.kuota;
        document.getElementById('editPaketDiskon').value = p.diskon || 0;
        modalEdit.style.display = 'flex';
    }
};

document.getElementById('btnBatalEdit').addEventListener('click', () => {
    modalEdit.style.display = 'none';
});

document.getElementById('formEditPaket').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id_paket = document.getElementById('editIdPaket').value;
    const formData = new FormData();
    formData.append("nama_paket", document.getElementById('editNama').value);
    formData.append("destinasi", document.getElementById('editDestinasi').value);
    formData.append("harga", document.getElementById('editHarga').value);
    formData.append("kuota", document.getElementById('editKuota').value);
    formData.append("diskon", document.getElementById('editPaketDiskon').value || 0);
    
    // Multiple file upload
    const gambarFiles = document.getElementById('editGambar').files;
    if (gambarFiles && gambarFiles.length > 0) {
        for (let i = 0; i < Math.min(gambarFiles.length, 5); i++) {
            formData.append("gambar", gambarFiles[i]);
        }
    }

    const videoFile = document.getElementById("editVideo").files[0];
    if (videoFile) {
        formData.append("video", videoFile);
    }

    try {
        const res = await fetch(`${API_BASE}/paket/${id_paket}`, {
            method: "PUT",
            body: formData
        });
        const data = await res.json();
        if(res.ok) {
            alert(data.message);
            modalEdit.style.display = 'none';
            loadKatalog(); // refresh tabel
        } else {
            alert(data.detail);
        }
    } catch(e) {
        alert("Gagal mengupdate paket.");
    }
});

window.hapusPaket = async (id_paket) => {
    if(confirm(`Yakin ingin menghapus paket ${id_paket}?`)) {
        try {
            const res = await fetch(`${API_BASE}/paket/${id_paket}`, { method: "DELETE" });
            if(res.ok) {
                alert("Paket berhasil dihapus!");
                loadKatalog();
            } else {
                const data = await res.json();
                alert(data.detail);
            }
        } catch(e) {
            alert("Gagal menghapus paket.");
        }
    }
};

const modalEditTransport = document.getElementById('modalEditTransport');
document.getElementById('btnBatalEditTransport').addEventListener('click', () => {
    modalEditTransport.style.display = 'none';
});

window.bukaEditTransport = async (id) => {
    const res = await fetch(`${API_BASE}/transportasi`);
    if(res.ok) {
        const data = await res.json();
        const t = data.find(x => x.id_transport === id);
        if(t) {
            document.getElementById('editTransId').value = t.id_transport;
            document.getElementById('editTransJenis').value = t.jenis;
            document.getElementById('editTransOperator').value = t.operator;
            document.getElementById('editTransRute').value = t.rute;
            document.getElementById('editTransHarga').value = t.harga;
            document.getElementById('editTransDiskon').value = t.diskon || 0;
            modalEditTransport.style.display = 'flex';
        }
    }
};

document.getElementById('formEditTransport').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editTransId').value;
    const formData = new FormData();
    formData.append("jenis", document.getElementById('editTransJenis').value);
    formData.append("operator", document.getElementById('editTransOperator').value);
    formData.append("rute", document.getElementById('editTransRute').value);
    formData.append("harga", document.getElementById('editTransHarga').value);
    formData.append("diskon", document.getElementById('editTransDiskon').value || 0);
    
    const file = document.getElementById('editTransGambar').files[0];
    if (file) {
        formData.append("gambar", file);
    }
    
    try {
        const res = await fetch(`${API_BASE}/transportasi/${id}`, {
            method: "PUT",
            body: formData
        });
        if(res.ok) {
            alert("Transportasi berhasil diupdate!");
            modalEditTransport.style.display = 'none';
            loadTransportasi();
        } else {
            const data = await res.json();
            alert(data.detail || "Gagal mengupdate");
        }
    } catch(e) {
        alert("Gagal koneksi ke server");
    }
});

async function loadHotel() {
    const res = await fetch(`${API_BASE}/hotel`);
    if(res.ok) {
        const data = await res.json();
        const tbody = document.getElementById("tabelHotel");
        tbody.innerHTML = "";
        data.forEach(h => {
            tbody.innerHTML += `
            <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
                <td style="padding:10px;">${h.nama_hotel}</td>
                <td style="padding:10px;">${h.lokasi}</td>
                <td style="padding:10px;">${h.bintang} Bintang</td>
                <td style="padding:10px;">${h.tipe_kamar || 'Standard:0'} ${h.diskon ? `<span style="background:orange; color:white; padding:2px 5px; border-radius:3px; font-size:10px;">-${h.diskon}%</span>` : ''}</td>
                <td style="padding:10px;">
                    <div style="display:flex; gap:5px;">
                        <button onclick="bukaEditHotel('${h.id_hotel}')" class="btn" style="background:#3b82f6; padding:5px 10px; font-size:0.8rem; width:auto; margin:0;">Edit</button>
                        <button onclick="hapusHotel('${h.id_hotel}')" style="background:#ef4444; padding:5px 10px; font-size:0.8rem; width:auto; margin:0;">Hapus</button>
                    </div>
                </td>
            </tr>`;
        });
    }
}

async function loadTransportasi() {
    const res = await fetch(`${API_BASE}/transportasi`);
    if(res.ok) {
        const data = await res.json();
        const tbody = document.getElementById("tabelTransport");
        tbody.innerHTML = "";
        data.forEach(t => {
            tbody.innerHTML += `
            <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
                <td style="padding:10px;">${t.jenis}</td>
                <td style="padding:10px;">${t.operator}</td>
                <td style="padding:10px;">${t.rute}</td>
                <td style="padding:10px;">Rp${(t.harga||0).toLocaleString('id-ID')} ${t.diskon ? `<span style="background:orange; color:white; padding:2px 5px; border-radius:3px; font-size:10px;">-${t.diskon}%</span>` : ''}</td>
                <td style="padding:10px;">
                    <div style="display:flex; gap:5px;">
                        <button onclick="bukaEditTransport('${t.id_transport}')" class="btn" style="background:#3b82f6; padding:5px 10px; font-size:0.8rem; width:auto; margin:0;">Edit</button>
                        <button onclick="hapusTransport('${t.id_transport}')" style="background:#ef4444; padding:5px 10px; font-size:0.8rem; width:auto; margin:0;">Hapus</button>
                    </div>
                </td>
            </tr>`;
        });
    }
}

window.hapusHotel = async (id) => {
    if(confirm("Hapus hotel ini?")) {
        await fetch(`${API_BASE}/hotel/${id}`, { method: "DELETE" });
        loadHotel();
    }
};

window.hapusTransport = async (id) => {
    if(confirm("Hapus transportasi ini?")) {
        await fetch(`${API_BASE}/transportasi/${id}`, { method: "DELETE" });
        loadTransportasi();
    }
};

async function loadWisata() {
    const res = await fetch(`${API_BASE}/wisata`);
    if(res.ok) {
        const data = await res.json();
        const tbody = document.getElementById("tabelWisata");
        if(tbody) {
            tbody.innerHTML = "";
            data.forEach(w => {
                tbody.innerHTML += `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
                    <td style="padding:10px;">${w.nama_tempat}</td>
                    <td style="padding:10px;">${w.lokasi}</td>
                    <td style="padding:10px;">Rp${(w.harga||0).toLocaleString('id-ID')} ${w.diskon ? `<span style="background:orange; color:white; padding:2px 5px; border-radius:3px; font-size:10px;">-${w.diskon}%</span>` : ''}</td>
                    <td style="padding:10px;">
                        <div style="display:flex; gap:5px;">
                            <button onclick="bukaEditWisata('${w.id_wisata}')" class="btn" style="background:#3b82f6; padding:5px 10px; font-size:0.8rem; width:auto; margin:0;">Edit</button>
                            <button onclick="hapusWisata('${w.id_wisata}')" style="background:#ef4444; padding:5px 10px; font-size:0.8rem; width:auto; margin:0;">Hapus</button>
                        </div>
                    </td>
                </tr>`;
            });
        }
    }
}

window.bukaEditWisata = async (id) => {
    const res = await fetch(`${API_BASE}/wisata`);
    const data = await res.json();
    const w = data.find(x => x.id_wisata === id);
    if(w) {
        document.getElementById("editWisataId").value = w.id_wisata;
        document.getElementById("editWisataNama").value = w.nama_tempat;
        document.getElementById("editWisataLokasi").value = w.lokasi;
        document.getElementById("editWisataHarga").value = w.harga;
        document.getElementById("editWisataDiskon").value = w.diskon || 0;
        document.getElementById("modalEditWisata").style.display = "flex";
    }
};

window.hapusWisata = async (id) => {
    if(confirm("Hapus tempat wisata ini?")) {
        await fetch(`${API_BASE}/wisata/${id}`, { method: "DELETE" });
        loadWisata();
    }
};

// Initial calls for new tabs
document.addEventListener("DOMContentLoaded", () => {
    loadHotel();
    loadTransportasi();
    // Polling Notifikasi Admin
    async function checkNotifications() {
        try {
            const res = await fetch(API_BASE + "/booking/count");
            if(res.ok) {
                const data = await res.json();
                const lastCount = localStorage.getItem('admin_last_booking_count') || 0;
                
                if (data.count > parseInt(lastCount)) {
                    // Ada booking baru!
                    const badge = document.getElementById('notifBadge');
                    badge.innerText = data.count - parseInt(lastCount);
                    badge.style.display = 'block';
                }
            }
        } catch (e) {
            console.log("Gagal cek notifikasi", e);
        }
    }

    document.getElementById('btnNotif').addEventListener('click', () => {
        // Reset badge saat diklik
        fetch(API_BASE + "/booking/count").then(r => r.json()).then(data => {
            localStorage.setItem('admin_last_booking_count', data.count);
            document.getElementById('notifBadge').style.display = 'none';
            alert("Tidak ada notifikasi baru.");
        });
    });

    setInterval(checkNotifications, 5000);
    checkNotifications();

    loadData();
    loadWisata();
    
    const selFilter = document.getElementById('laporanTipeFilter');
    if (selFilter) {
        selFilter.addEventListener('change', (e) => {
            window.renderLaporanUI(e.target.value);
        });
    }

    const btnCsv = document.getElementById('btnDownloadCSV');
    if (btnCsv) {
        btnCsv.addEventListener('click', () => {
            const list = window.globalDataLaporan || [];
            if(list.length === 0) {
                alert("Tidak ada data untuk diunduh.");
                return;
            }
            
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "ID Booking,Tipe,Nama Pemesan,Tanggal,Item ID,Total Pembayaran,Status\n";
            
            list.forEach(b => {
                let row = [
                    b.id_booking,
                    b.tipe_pesanan || 'paket',
                    b.nama_peserta,
                    b.tanggal_booking,
                    b.id_paket,
                    b.total_harga || 0,
                    b.status
                ].join(",");
                csvContent += row + "\n";
            });
            
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "Laporan_Penjualan_TravelNusa.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }
});

document.getElementById("btnBatalEditHotel").addEventListener("click", () => {
    document.getElementById("modalEditHotel").style.display = "none";
});

window.bukaEditHotel = async (id) => {
    const res = await fetch(`${API_BASE}/hotel`);
    if(res.ok) {
        const data = await res.json();
        const h = data.find(x => x.id_hotel === id);
        if(h) {
            document.getElementById("editHotelId").value = h.id_hotel;
            document.getElementById("editHotelNama").value = h.nama_hotel;
            document.getElementById("editHotelLokasi").value = h.lokasi;
            document.getElementById("editHotelBintang").value = h.bintang;
            document.getElementById("editHotelTipeKamar").value = h.tipe_kamar;
            document.getElementById("editHotelDiskon").value = h.diskon || 0;
            document.getElementById("modalEditHotel").style.display = "flex";
        }
    }
};

document.getElementById("formEditHotel").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("editHotelId").value;
    const formData = new FormData();
    formData.append("nama_hotel", document.getElementById("editHotelNama").value);
    formData.append("lokasi", document.getElementById("editHotelLokasi").value);
    formData.append("bintang", document.getElementById("editHotelBintang").value);
    formData.append("tipe_kamar", document.getElementById("editHotelTipeKamar").value);
    formData.append("diskon", document.getElementById("editHotelDiskon").value || 0);
    
    const file = document.getElementById("editHotelGambar").files[0];
    if(file) formData.append("gambar", file);
    
    try {
        const res = await fetch(`${API_BASE}/hotel/${id}`, {
            method: "PUT",
            body: formData
        });
        if(res.ok) {
            alert("Hotel berhasil diupdate!");
            document.getElementById("modalEditHotel").style.display = "none";
            loadHotel();
        } else {
            alert("Gagal mengupdate hotel");
        }
    } catch(e) {
        alert("Server error");
    }
});
