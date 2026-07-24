const API_BASE = (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1'))
    ? 'http://127.0.0.1:8000'
    : window.location.origin;
let paketWisataList = [];
let currentPaketId = null;
let currentHargaDasar = 0;
let currentBookingId = null;
let currentTagihan = 0;
let currentDiskon = 0;

const pageHome = document.getElementById('pageHome');
const pagePayment = document.getElementById('pagePayment');
const pageRefund = document.getElementById('pageRefund');
const pageReceipt = document.getElementById('pageReceipt');
const modalCheckout = document.getElementById('modalCheckout');

// Pindah Halaman
function showPage(page) {
    pageHome.classList.add('hidden');
    pagePayment.classList.add('hidden');
    pageRefund.classList.add('hidden');
    pageReceipt.classList.add('hidden');
    page.classList.remove('hidden');
}

// Navigasi Dasar
document.getElementById('btnRefundNav').addEventListener('click', () => showPage(pageRefund));
document.getElementById('btnHomeFromPay').addEventListener('click', () => showPage(pageHome));
document.getElementById('btnHomeFromRefund').addEventListener('click', () => showPage(pageHome));
document.getElementById('btnHomeFromReceipt').addEventListener('click', () => showPage(pageHome));
document.getElementById('btnBatalCheckout').addEventListener('click', () => modalCheckout.classList.remove('active'));

// Set User Profile UI
const currentUser = getUserData();
if(currentUser) {
    document.getElementById('navUserName').innerText = currentUser.name;
    document.getElementById('navUserPic').src = currentUser.picture;
}

// Memuat Daftar Paket
async function loadPaket() {
    try {
        const response = await fetch(API_BASE + "/paket");
        paketWisataList = await response.json();
        const container = document.getElementById('paketContainer');
        container.innerHTML = '';
        
        paketWisataList.forEach(paket => {
            const daftarGbr = paket.daftar_gambar || [];
            let mainImgUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(paket.nama_paket)}&background=random&size=400`;
            if (daftarGbr.length > 0) {
                mainImgUrl = `${API_BASE}/uploads/${daftarGbr[0]}`;
            }

            let galleryHtml = `<div class="media-gallery" style="display:flex; gap:5px; margin-top:5px; overflow-x:auto;">`;
            
            // Loop untuk thumbnail (sampai 5)
            daftarGbr.forEach((gbr, idx) => {
                const imgUrl = `${API_BASE}/uploads/${gbr}`;
                galleryHtml += `<img src="${imgUrl}" alt="Thumb" style="width:50px; height:50px; object-fit:cover; border-radius:5px; cursor:pointer;" onclick="bukaLightbox('image', '${imgUrl}', '${paket.nama_paket} - Foto ${idx+1}')">`;
            });

            if (paket.video) {
                const vidUrl = `${API_BASE}/uploads/${paket.video}`;
                galleryHtml += `<div style="width:50px; height:50px; background:#333; display:flex; align-items:center; justify-content:center; border-radius:5px; cursor:pointer; color:white; font-size:1.5rem;" onclick="bukaLightbox('video', '${vidUrl}', '${paket.nama_paket} - Video Promosi')">▶️</div>`;
            }
            galleryHtml += `</div>`;
            
            const card = document.createElement('div');
            card.className = 'package-card';
            card.innerHTML = `
                <img src="${mainImgUrl}" alt="${paket.nama_paket}" class="package-img" style="cursor:pointer;" onclick="bukaLightbox('image', '${mainImgUrl}', '${paket.nama_paket}')">
                ${galleryHtml}
                <div class="package-info">
                    <div class="package-type">Tipe: ${paket.tipe}</div>
                    <div class="package-name">${paket.nama_paket}</div>
                    <div class="package-dest">📍 ${paket.destinasi} (Sisa Kuota: ${paket.kuota})</div>
                    <div class="package-price-row">
                        <div class="price" style="display:flex; flex-direction:column; gap:2px;">
                            ${paket.diskon && paket.diskon > 0 ? `<div style="display:flex; align-items:center; gap:5px;">
                                <span style="text-decoration:line-through; font-size:0.8rem; color:#999;">Rp${paket.harga_dasar.toLocaleString('id-ID')}</span>
                                <span style="background:#ef4444; color:white; padding:2px 5px; border-radius:3px; font-size:0.7rem; font-weight:bold;">Hemat ${paket.diskon}%</span>
                            </div>` : ''}
                            <div>Rp${(paket.diskon && paket.diskon > 0 ? (paket.harga_dasar * (1 - paket.diskon/100)) : paket.harga_dasar).toLocaleString('id-ID')} <span style="font-size:0.7rem;font-weight:normal;color:#666;">/orang</span></div>
                        </div>
                        <button class="btn btn-primary" style="width:auto; padding:0.5rem 1rem; align-self:flex-end;" onclick="bukaCheckout('${paket.id_paket}', '${paket.nama_paket}', ${paket.harga_dasar}, 'paket', '', ${paket.diskon || 0})">Pesan</button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (e) {
        console.warn("Menggunakan fallback data paket:", e);
        paketWisataList = [
            { id_paket: "PKT-001", nama_paket: "Wisata Eksotis Bali & Nusa Penida", destinasi: "Bali", harga_dasar: 3500000, kuota: 15, tipe: "Reguler", diskon: 15, daftar_gambar: [] },
            { id_paket: "PKT-002", nama_paket: "Tour Spesial Tokyo & Mount Fuji", destinasi: "Jepang", harga_dasar: 12500000, kuota: 10, tipe: "Premium", diskon: 20, daftar_gambar: [] },
            { id_paket: "PKT-003", nama_paket: "Petualangan Raja Ampat Papua", destinasi: "Papua", harga_dasar: 8500000, kuota: 8, tipe: "Reguler", diskon: 10, daftar_gambar: [] }
        ];
        const container = document.getElementById('paketContainer');
        container.innerHTML = '';
        paketWisataList.forEach(paket => {
            let mainImgUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(paket.nama_paket)}&background=11998e&color=fff&size=400`;
            const card = document.createElement('div');
            card.className = 'package-card';
            card.innerHTML = `
                <img src="${mainImgUrl}" alt="${paket.nama_paket}" class="package-img">
                <div class="package-info">
                    <div class="package-type">Tipe: ${paket.tipe}</div>
                    <div class="package-name">${paket.nama_paket}</div>
                    <div class="package-dest">📍 ${paket.destinasi} (Sisa Kuota: ${paket.kuota})</div>
                    <div class="package-price-row">
                        <div class="price" style="display:flex; flex-direction:column; gap:2px;">
                            ${paket.diskon && paket.diskon > 0 ? `<div style="display:flex; align-items:center; gap:5px;">
                                <span style="text-decoration:line-through; font-size:0.8rem; color:#999;">Rp${paket.harga_dasar.toLocaleString('id-ID')}</span>
                                <span style="background:#ef4444; color:white; padding:2px 5px; border-radius:3px; font-size:0.7rem; font-weight:bold;">Hemat ${paket.diskon}%</span>
                            </div>` : ''}
                            <div>Rp${(paket.diskon && paket.diskon > 0 ? (paket.harga_dasar * (1 - paket.diskon/100)) : paket.harga_dasar).toLocaleString('id-ID')} <span style="font-size:0.7rem;font-weight:normal;color:#666;">/orang</span></div>
                        </div>
                        <button class="btn btn-primary" style="width:auto; padding:0.5rem 1rem; align-self:flex-end;" onclick="bukaCheckout('${paket.id_paket}', '${paket.nama_paket}', ${paket.harga_dasar}, 'paket', '', ${paket.diskon || 0})">Pesan</button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }
}

// Memuat Daftar Hotel
async function loadHotelCustomer() {
    try {
        const response = await fetch(API_BASE + "/hotel");
        const list = await response.json();
        const container = document.getElementById('hotelContainer');
        container.innerHTML = '';
        
        list.forEach(hotel => {
            let imgUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(hotel.nama_hotel)}&background=random&size=400`;
            if (hotel.gambar) {
                imgUrl = `${API_BASE}/uploads/${hotel.gambar}`;
            }
            
            let basePrice = 0;
            let extData = hotel.tipe_kamar || "";
            if(extData) {
                const types = extData.split(',');
                if(types.length > 0) {
                    const parts = types[0].split(':');
                    if(parts.length === 2) basePrice = parseFloat(parts[1].trim());
                }
            }
            
            const card = document.createElement('div');
            card.className = 'package-card';
            card.innerHTML = `
                <img src="${imgUrl}" alt="${hotel.nama_hotel}" class="package-img" style="cursor:pointer;" onclick="bukaLightbox('image', '${imgUrl}', '${hotel.nama_hotel}')">
                <div class="package-info">
                    <div class="package-type">Bintang ${hotel.bintang} ⭐</div>
                    <div class="package-name">${hotel.nama_hotel}</div>
                    <div class="package-dest">📍 ${hotel.lokasi}</div>
                    <div class="package-price-row">
                        <div class="price" style="display:flex; flex-direction:column; gap:2px;">
                            ${hotel.diskon && hotel.diskon > 0 ? `<div style="display:flex; align-items:center; gap:5px;">
                                <span style="text-decoration:line-through; font-size:0.8rem; color:#999;">Rp${basePrice.toLocaleString('id-ID')}</span>
                                <span style="background:#ef4444; color:white; padding:2px 5px; border-radius:3px; font-size:0.7rem; font-weight:bold;">Hemat ${hotel.diskon}%</span>
                            </div>` : ''}
                            <div>Mulai Rp${(hotel.diskon && hotel.diskon > 0 ? (basePrice * (1 - hotel.diskon/100)) : basePrice).toLocaleString('id-ID')} <span style="font-size:0.7rem;font-weight:normal;color:#666;">/hari</span></div>
                        </div>
                        <button class="btn btn-primary" style="width:auto; padding:0.5rem 1rem; align-self:flex-end;" onclick="bukaCheckout('${hotel.id_hotel}', '${hotel.nama_hotel}', ${basePrice}, 'hotel', '${extData}', ${hotel.diskon || 0})">Pesan</button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (e) {
        console.warn("Menggunakan fallback data hotel:", e);
        const list = [
            { id_hotel: "HTL-001", nama_hotel: "Hotel Resort Grand Bali", lokasi: "Kuta, Bali", bintang: 5, tipe_kamar: "Deluxe:750000, Suite:1500000", diskon: 15, gambar: "" },
            { id_hotel: "HTL-002", nama_hotel: "Villa Jogja Heritage", lokasi: "Yogyakarta", bintang: 4, tipe_kamar: "Standard:400000, Deluxe:650000", diskon: 10, gambar: "" }
        ];
        const container = document.getElementById('hotelContainer');
        container.innerHTML = '';
        list.forEach(hotel => {
            let imgUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(hotel.nama_hotel)}&background=11998e&color=fff&size=400`;
            let basePrice = 750000;
            const card = document.createElement('div');
            card.className = 'package-card';
            card.innerHTML = `
                <img src="${imgUrl}" alt="${hotel.nama_hotel}" class="package-img">
                <div class="package-info">
                    <div class="package-type">Bintang ${hotel.bintang} ⭐</div>
                    <div class="package-name">${hotel.nama_hotel}</div>
                    <div class="package-dest">📍 ${hotel.lokasi}</div>
                    <div class="package-price-row">
                        <div class="price" style="display:flex; flex-direction:column; gap:2px;">
                            ${hotel.diskon && hotel.diskon > 0 ? `<div style="display:flex; align-items:center; gap:5px;">
                                <span style="text-decoration:line-through; font-size:0.8rem; color:#999;">Rp${basePrice.toLocaleString('id-ID')}</span>
                                <span style="background:#ef4444; color:white; padding:2px 5px; border-radius:3px; font-size:0.7rem; font-weight:bold;">Hemat ${hotel.diskon}%</span>
                            </div>` : ''}
                            <div>Mulai Rp${(hotel.diskon && hotel.diskon > 0 ? (basePrice * (1 - hotel.diskon/100)) : basePrice).toLocaleString('id-ID')} <span style="font-size:0.7rem;font-weight:normal;color:#666;">/hari</span></div>
                        </div>
                        <button class="btn btn-primary" style="width:auto; padding:0.5rem 1rem; align-self:flex-end;" onclick="bukaCheckout('${hotel.id_hotel}', '${hotel.nama_hotel}', ${basePrice}, 'hotel', '${hotel.tipe_kamar}', ${hotel.diskon || 0})">Pesan</button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }
}

// Memuat Daftar Transportasi
async function loadTransportCustomer() {
    try {
        const response = await fetch(API_BASE + "/transportasi");
        const list = await response.json();
        const container = document.getElementById('transportContainer');
        container.innerHTML = '';
        
        list.forEach(trans => {
            let imgUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(trans.operator)}&background=random&size=400`;
            if (trans.gambar) {
                imgUrl = `${API_BASE}/uploads/${trans.gambar}`;
            }
            
            const card = document.createElement('div');
            card.className = 'package-card';
            card.innerHTML = `
                <img src="${imgUrl}" alt="${trans.operator}" class="package-img" style="cursor:pointer;" onclick="bukaLightbox('image', '${imgUrl}', '${trans.operator}')">
                <div class="package-info">
                    <div class="package-type">${trans.jenis} ✈️/opsi</div>
                    <div class="package-name">${trans.operator}</div>
                    <div class="package-dest">📍 ${trans.rute}</div>
                    <div class="package-price-row">
                        <div class="price" style="display:flex; flex-direction:column; gap:2px;">
                            ${trans.diskon && trans.diskon > 0 ? `<div style="display:flex; align-items:center; gap:5px;">
                                <span style="text-decoration:line-through; font-size:0.8rem; color:#999;">Rp${trans.harga.toLocaleString('id-ID')}</span>
                                <span style="background:#ef4444; color:white; padding:2px 5px; border-radius:3px; font-size:0.7rem; font-weight:bold;">Hemat ${trans.diskon}%</span>
                            </div>` : ''}
                            <div>Rp${(trans.diskon && trans.diskon > 0 ? (trans.harga * (1 - trans.diskon/100)) : trans.harga).toLocaleString('id-ID')} <span style="font-size:0.7rem;font-weight:normal;color:#666;">/tiket</span></div>
                        </div>
                        <button class="btn btn-primary" style="width:auto; padding:0.5rem 1rem; align-self:flex-end;" onclick="bukaCheckout('${trans.id_transport}', '${trans.operator}', ${trans.harga}, 'transportasi', '', ${trans.diskon || 0})">Pesan</button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (e) {
        console.warn("Menggunakan fallback data transportasi:", e);
        const list = [
            { id_transport: "TRP-001", jenis: "Pesawat", operator: "Garuda Indonesia", rute: "Jakarta - Bali", harga: 1200000, diskon: 10, gambar: "" },
            { id_transport: "TRP-002", jenis: "Kereta", operator: "Kereta Taksaka", rute: "Jakarta - Jogja", harga: 450000, diskon: 5, gambar: "" }
        ];
        const container = document.getElementById('transportContainer');
        container.innerHTML = '';
        list.forEach(trans => {
            let imgUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(trans.operator)}&background=38ef7d&color=fff&size=400`;
            const card = document.createElement('div');
            card.className = 'package-card';
            card.innerHTML = `
                <img src="${imgUrl}" alt="${trans.operator}" class="package-img">
                <div class="package-info">
                    <div class="package-type">${trans.jenis} ✈️/🚆</div>
                    <div class="package-name">${trans.operator}</div>
                    <div class="package-dest">📍 ${trans.rute}</div>
                    <div class="package-price-row">
                        <div class="price" style="display:flex; flex-direction:column; gap:2px;">
                            ${trans.diskon && trans.diskon > 0 ? `<div style="display:flex; align-items:center; gap:5px;">
                                <span style="text-decoration:line-through; font-size:0.8rem; color:#999;">Rp${trans.harga.toLocaleString('id-ID')}</span>
                                <span style="background:#ef4444; color:white; padding:2px 5px; border-radius:3px; font-size:0.7rem; font-weight:bold;">Hemat ${trans.diskon}%</span>
                            </div>` : ''}
                            <div>Rp${(trans.diskon && trans.diskon > 0 ? (trans.harga * (1 - trans.diskon/100)) : trans.harga).toLocaleString('id-ID')} <span style="font-size:0.7rem;font-weight:normal;color:#666;">/tiket</span></div>
                        </div>
                        <button class="btn btn-primary" style="width:auto; padding:0.5rem 1rem; align-self:flex-end;" onclick="bukaCheckout('${trans.id_transport}', '${trans.operator}', ${trans.harga}, 'transportasi', '', ${trans.diskon || 0})">Pesan</button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }
}

// Buka Modal Checkout
window.bukaCheckout = (id_paket, nama, harga_dasar, tipe, extData = "", diskon = 0) => {
    currentPaketId = id_paket;
    currentHargaDasar = harga_dasar;
    currentDiskon = diskon;
    document.getElementById('checkoutIdPaket').value = id_paket;
    document.getElementById('checkoutTipePesanan').value = tipe;
    document.getElementById('checkoutNamaPaket').innerText = nama;
    
    if (tipe === 'paket') {
        document.getElementById('grupTransport').style.display = 'block';
        document.getElementById('grupPromo').style.display = 'block';
        document.getElementById('grupTipeKamar').style.display = 'none';
        document.getElementById('labelOrang').innerText = 'Peserta';
        document.getElementById('labelTanggal').innerText = 'Tanggal Berangkat';
    } else {
        document.getElementById('grupTransport').style.display = 'none';
        document.getElementById('grupPromo').style.display = 'none';
        document.getElementById('custTransport').value = 'Bus';
        document.getElementById('custPromo').value = '';
        
        if (tipe === 'hotel') {
            document.getElementById('labelOrang').innerText = 'Jumlah Hari';
            document.getElementById('labelTanggal').innerText = 'Tanggal Check-in';
            
            // Populate Tipe Kamar Dropdown
            const selectTipeKamar = document.getElementById('custTipeKamar');
            selectTipeKamar.innerHTML = '';
            if (extData) {
                const types = extData.split(',').map(s => s.trim());
                types.forEach(t => {
                    if(t && t.includes(':')) {
                        const parts = t.split(':');
                        const nama = parts[0].trim();
                        const harga = parseFloat(parts[1].trim());
                        selectTipeKamar.innerHTML += `<option value="${nama}" data-harga="${harga}">${nama} (Rp${harga.toLocaleString('id-ID')})</option>`;
                    }
                });
            } else {
                selectTipeKamar.innerHTML = `<option value="Standard" data-harga="0">Standard</option>`;
            }
            document.getElementById('grupTipeKamar').style.display = 'block';
            
        } else if (tipe === 'transportasi') {
            document.getElementById('labelOrang').innerText = 'Jumlah Tiket';
            document.getElementById('labelTanggal').innerText = 'Tanggal Berangkat';
            document.getElementById('grupTipeKamar').style.display = 'none';
        }
    }

    hitungLivePrice();
    
    // Set Saldo UI
    const u = getUserData();
    if (u) {
        document.getElementById('paySaldoLabel').innerText = `Rp${u.saldo.toLocaleString('id-ID')}`;
    }
    
    // Load Ulasan
    loadReviews(id_paket);
    
    modalCheckout.classList.add('active');
};

async function loadReviews(targetId) {
    const list = document.getElementById('reviewsList');
    list.innerHTML = '<p style="font-size:0.85rem; color:#666;">Memuat ulasan...</p>';
    
    try {
        const res = await fetch(API_BASE + "/reviews/" + targetId);
        if (res.ok) {
            const reviews = await res.json();
            if (reviews.length === 0) {
                list.innerHTML = '<p style="font-size:0.85rem; color:#666; font-style:italic;">Belum ada ulasan untuk item ini.</p>';
            } else {
                list.innerHTML = '';
                reviews.forEach(r => {
                    const stars = '⭐'.repeat(r.rating);
                    list.innerHTML += `
                        <div style="background: white; border: 1px solid #eee; padding: 10px; border-radius: 8px;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                                <span style="font-weight:600; font-size:0.85rem;">${r.user_name}</span>
                                <span style="font-size:0.8rem;">${stars}</span>
                            </div>
                            <p style="font-size:0.85rem; color:#444; margin:0;">"${r.comment}"</p>
                            <div style="font-size:0.7rem; color:#999; margin-top:5px; text-align:right;">${r.tanggal}</div>
                        </div>
                    `;
                });
            }
        }
    } catch (e) {
        list.innerHTML = '<p style="font-size:0.85rem; color:red;">Gagal memuat ulasan.</p>';
    }
}

document.getElementById('btnKirimReview').addEventListener('click', async () => {
    const targetId = document.getElementById('checkoutIdPaket').value;
    const rating = document.getElementById('reviewRating').value;
    const comment = document.getElementById('reviewComment').value;
    const user = getUserData();
    
    if (!comment) {
        alert("Mohon isi komentar ulasan Anda.");
        return;
    }
    
    const userName = user ? user.name : "Anonim";
    
    try {
        const res = await fetch(API_BASE + "/reviews", {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                target_id: targetId,
                user_name: userName,
                rating: parseInt(rating),
                comment: comment
            })
        });
        
        if (res.ok) {
            alert("Terima kasih! Ulasan Anda telah tersimpan.");
            document.getElementById('reviewComment').value = '';
            loadReviews(targetId); // refresh ulasan
        } else {
            alert("Gagal menyimpan ulasan.");
        }
    } catch (e) {
        alert("Error koneksi jaringan.");
    }
});

// Kalkulasi Harga Langsung di Frontend (Simulasi)
function hitungLivePrice() {
    const jumlah = parseInt(document.getElementById('custOrang').value) || 1;
    const transport = document.getElementById('custTransport').value;
    const promo = document.getElementById('custPromo').value.toUpperCase();

    let hargaTransport = 0;
    const tipePesanan = document.getElementById('checkoutTipePesanan').value;
    if (tipePesanan === 'paket') {
        if (transport === 'Pesawat') hargaTransport = 1000000;
        if (transport === 'Kereta') hargaTransport = 400000;
        if (transport === 'Bus') hargaTransport = 100000;
    }

    let hargaDasarFinal = currentHargaDasar;
    if (tipePesanan === 'hotel') {
        const selectKamar = document.getElementById('custTipeKamar');
        if(selectKamar.options.length > 0) {
            hargaDasarFinal = parseFloat(selectKamar.options[selectKamar.selectedIndex].getAttribute('data-harga')) || 0;
        }
    }
    
    // Potong Diskon jika ada
    if (currentDiskon > 0) {
        hargaDasarFinal = hargaDasarFinal * (1 - (currentDiskon / 100));
    }

    let total = (hargaDasarFinal + hargaTransport) * jumlah;
    
    // Asumsi Reguler/Premium modifier ada di backend, tapi kita pakai estimasi dasar
    // Diskon kode promo
    if (promo === 'PROMO20') total = total * 0.8;
    if (promo === 'HEMAT10') total = total * 0.9;

    document.getElementById('livePriceLabel').innerText = `Rp${total.toLocaleString('id-ID')}`;
}

// Event Listeners Kalkulasi Harga
['custOrang', 'custTransport', 'custPromo', 'custTipeKamar'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.addEventListener('input', hitungLivePrice);
});

// Proses Pesan (Submit ke Backend)
document.getElementById('formCheckout').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnPesan');
    btn.innerText = "Memproses...";
    btn.disabled = true;

    const payload = {
        id_paket: document.getElementById('checkoutIdPaket').value,
        nama_peserta: document.getElementById('custName').value,
        jumlah_orang: parseInt(document.getElementById('custOrang').value),
        tanggal_berangkat: document.getElementById('custDate').value,
        transportasi: document.getElementById('custTransport').value,
        kode_promo: document.getElementById('custPromo').value.toUpperCase(),
        tipe_pesanan: document.getElementById('checkoutTipePesanan').value,
        tipe_kamar_pilihan: document.getElementById('custTipeKamar').value
    };

    try {
        const res = await fetch(API_BASE + "/pesan", {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            alert("Gagal: " + (data.detail || "Kesalahan sistem"));
        } else {
            // Berhasil pesan, arahkan ke halaman pembayaran
            modalCheckout.classList.remove('active');
            currentBookingId = data.id_booking;
            currentTagihan = data.total_harga;
            
            document.getElementById('payIdBooking').innerText = currentBookingId;
            document.getElementById('payTotalLabel').innerText = `Rp${currentTagihan.toLocaleString('id-ID')}`;
            showPage(pagePayment);
        }
    } catch (e) {
        alert("Gagal menghubungi server");
    } finally {
        btn.innerText = "Pesan & Lanjut Bayar";
        btn.disabled = false;
    }
});

// Proses Pembayaran
document.getElementById('btnBayarSekarang').addEventListener('click', async () => {
    const user = getUserData();
    const saldoUser = user ? user.saldo : 0;
    
    if (saldoUser < currentTagihan) {
        alert("Maaf, Saldo TravelNusa Anda tidak mencukupi untuk melakukan pembayaran ini. Silakan Top Up terlebih dahulu.");
        return;
    }
    
    // Karena ini simulasi saldo internal, kita langsung kirim pembayaran sebesar tagihan
    const jumlahBayar = currentTagihan;

    try {
        const res = await fetch(API_BASE + "/bayar", {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({id_booking: currentBookingId, jumlah_bayar: jumlahBayar})
        });
        
        const data = await res.json();
        if (res.ok) {
            // Tampilkan Struk Nota
            const b = data.booking;
            document.getElementById('receiptId').innerText = b.id_booking;
            document.getElementById('receiptDate').innerText = b.tanggal_berangkat || '-';
            document.getElementById('receiptName').innerText = b.nama_peserta;
            
            // Tentukan tipe
            let tipeText = "Paket Wisata";
            if(b.id_booking.includes("HTL")) tipeText = "Hotel";
            else if(b.id_booking.includes("TRN")) tipeText = "Transportasi";
            else if(b.id_booking.includes("WST")) tipeText = "Tempat Wisata";
            document.getElementById('receiptType').innerText = tipeText;
            
            document.getElementById('receiptItem').innerText = `${b.jumlah_orang}x Pesanan`;
            document.getElementById('receiptTotal').innerText = `Rp${b.total_harga.toLocaleString('id-ID')}`;
            
            loadPaket(); // refresh kuota
            showPage(pageReceipt);
        } else {
            alert(data.detail);
        }
    } catch (e) {
        alert("Error pembayaran");
    }
});

// Cek Detail Refund Live Preview
document.getElementById('btnCekDetailRefund').addEventListener('click', async () => {
    const id = document.getElementById('refIdBooking').value.trim();
    if (!id) {
        alert("Mohon masukkan Kode ID Booking Anda.");
        return;
    }
    try {
        const res = await fetch(API_BASE + "/booking");
        if (res.ok) {
            const list = await res.json();
            const b = list.find(x => x.id_booking === id);
            if (!b) {
                alert("ID Booking tidak ditemukan.");
                return;
            }
            if (b.status === "Dibatalkan" || b.status_pembayaran === "Dibatalkan (Refund)") {
                alert("Pesanan ini sudah dibatalkan sebelumnya.");
                return;
            }
            if (b.status_pembayaran !== "Lunas") {
                alert("Pengajuan refund hanya bisa dilakukan untuk tiket yang sudah LUNAS.");
                return;
            }

            const totalAwal = Math.round(b.total_harga || 0);
            const potongan = Math.round(totalAwal * 0.15);
            const netRefund = totalAwal - potongan;

            document.getElementById('refPreviewNama').innerText = b.nama_peserta || '-';
            document.getElementById('refPreviewTotal').innerText = `Rp ${totalAwal.toLocaleString('id-ID')}`;
            document.getElementById('refPreviewPotongan').innerText = `- Rp ${potongan.toLocaleString('id-ID')}`;
            document.getElementById('refPreviewNetRefund').innerText = `Rp ${netRefund.toLocaleString('id-ID')}`;
            document.getElementById('boxPreviewRefund').style.display = 'block';
        }
    } catch (e) {
        alert("Gagal memuat detail tiket.");
    }
});

// Proses Refund
document.getElementById('btnProsesRefund').addEventListener('click', async () => {
    const id = document.getElementById('refIdBooking').value.trim();
    if (!id) {
        alert("Mohon masukkan Kode ID Booking Anda.");
        return;
    }
    
    if (confirm(`Apakah Anda yakin ingin membatalkan pesanan ${id}? Potongan 15% akan diberlakukan.`)) {
        try {
            const res = await fetch(API_BASE + "/refund/" + id, { method: 'DELETE' });
            const data = await res.json();
            
            if (res.ok) {
                alert(`${data.pesan}`);
                document.getElementById('refIdBooking').value = "";
                document.getElementById('boxPreviewRefund').style.display = 'none';
                loadPaket();
                showPage(pageHome);
            } else {
                alert("Gagal: " + (data.detail || "Terjadi kesalahan."));
            }
        } catch (e) {
            alert("Server Error");
        }
    }
});

// Memuat Daftar Wisata Customer
async function loadWisataCustomer() {
    try {
        const response = await fetch(API_BASE + "/wisata");
        const list = await response.json();
        const container = document.getElementById('wisataContainer');
        container.innerHTML = '';
        
        list.forEach(w => {
            let imgUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(w.nama_tempat)}&background=random&size=400`;
            if (w.gambar) {
                imgUrl = `${API_BASE}/uploads/${w.gambar}`;
            }
            
            const card = document.createElement('div');
            card.className = 'package-card';
            card.innerHTML = `
                <img src="${imgUrl}" alt="${w.nama_tempat}" class="package-img" style="cursor:pointer;" onclick="bukaLightbox('image', '${imgUrl}', '${w.nama_tempat}')">
                <div class="package-info">
                    <div class="package-type">Tempat Wisata 🎟️</div>
                    <div class="package-name">${w.nama_tempat}</div>
                    <div class="package-dest">📍 ${w.lokasi}</div>
                    <div class="package-price-row">
                        <div class="price" style="display:flex; flex-direction:column; gap:2px;">
                            ${w.diskon && w.diskon > 0 ? `<div style="display:flex; align-items:center; gap:5px;">
                                <span style="text-decoration:line-through; font-size:0.8rem; color:#999;">Rp${w.harga.toLocaleString('id-ID')}</span>
                                <span style="background:#ef4444; color:white; padding:2px 5px; border-radius:3px; font-size:0.7rem; font-weight:bold;">Hemat ${w.diskon}%</span>
                            </div>` : ''}
                            <div>Rp${(w.diskon && w.diskon > 0 ? (w.harga * (1 - w.diskon/100)) : w.harga).toLocaleString('id-ID')} <span style="font-size:0.7rem;font-weight:normal;color:#666;">/tiket</span></div>
                        </div>
                        <button class="btn btn-primary" style="width:auto; padding:0.5rem 1rem; align-self:flex-end;" onclick="bukaCheckout('${w.id_wisata}', '${w.nama_tempat}', ${w.harga}, 'wisata', '', ${w.diskon || 0})">Pesan</button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (e) {
        console.warn("Menggunakan fallback data wisata:", e);
        const list = [
            { id_wisata: "WST-001", nama_tempat: "Candi Borobudur Masterpiece", lokasi: "Magelang", harga: 75000, diskon: 15, gambar: "" },
            { id_wisata: "WST-002", nama_tempat: "Pantai Kuta Sunset Point", lokasi: "Bali", harga: 25000, diskon: 0, gambar: "" }
        ];
        const container = document.getElementById('wisataContainer');
        container.innerHTML = '';
        list.forEach(w => {
            let imgUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(w.nama_tempat)}&background=f59e0b&color=fff&size=400`;
            const card = document.createElement('div');
            card.className = 'package-card';
            card.innerHTML = `
                <img src="${imgUrl}" alt="${w.nama_tempat}" class="package-img">
                <div class="package-info">
                    <div class="package-type">Tempat Wisata 🎟️</div>
                    <div class="package-name">${w.nama_tempat}</div>
                    <div class="package-dest">📍 ${w.lokasi}</div>
                    <div class="package-price-row">
                        <div class="price" style="display:flex; flex-direction:column; gap:2px;">
                            ${w.diskon && w.diskon > 0 ? `<div style="display:flex; align-items:center; gap:5px;">
                                <span style="text-decoration:line-through; font-size:0.8rem; color:#999;">Rp${w.harga.toLocaleString('id-ID')}</span>
                                <span style="background:#ef4444; color:white; padding:2px 5px; border-radius:3px; font-size:0.7rem; font-weight:bold;">Hemat ${w.diskon}%</span>
                            </div>` : ''}
                            <div>Rp${(w.diskon && w.diskon > 0 ? (w.harga * (1 - w.diskon/100)) : w.harga).toLocaleString('id-ID')} <span style="font-size:0.7rem;font-weight:normal;color:#666;">/tiket</span></div>
                        </div>
                        <button class="btn btn-primary" style="width:auto; padding:0.5rem 1rem; align-self:flex-end;" onclick="bukaCheckout('${w.id_wisata}', '${w.nama_tempat}', ${w.harga}, 'wisata', '', ${w.diskon || 0})">Pesan</button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }
}

// Initial Fetch
document.addEventListener('DOMContentLoaded', () => {
    loadPaket();
    loadHotelCustomer();
    loadTransportCustomer();
    loadWisataCustomer();
    const searchInput = document.getElementById('searchKatalog');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const activeTab = document.querySelector('.tab-content[style*="display: block"]');
            if (activeTab) {
                const cards = activeTab.querySelectorAll('.package-card, .hotel-card');
                cards.forEach(card => {
                    const title = card.querySelector('h3') ? card.querySelector('h3').innerText.toLowerCase() : '';
                    const loc = card.querySelector('p') ? card.querySelector('p').innerText.toLowerCase() : '';
                    if (title.includes(query) || loc.includes(query)) {
                        card.style.display = '';
                    } else {
                        card.style.display = 'none';
                    }
                });
            }
        });
    }

    // Panggil saat load untuk promos
    loadPromos();
});

// Navigasi Halaman Utama -> Katalog
window.bukaKatalog = (tipe) => {
    document.getElementById('pageMainMenu').style.display = 'none';
    document.getElementById('promoSection').style.display = 'none';
    document.getElementById('pageKatalog').style.display = 'block';

    document.getElementById('contentPaket').style.display = 'none';
    document.getElementById('contentHotel').style.display = 'none';
    document.getElementById('contentTransport').style.display = 'none';
    document.getElementById('contentWisata').style.display = 'none';

    if (tipe === 'paket') {
        document.getElementById('katalogTitle').innerText = '🏖️ Rekomendasi Paket Liburan';
        document.getElementById('contentPaket').style.display = 'block';
    } else if (tipe === 'hotel') {
        document.getElementById('katalogTitle').innerText = '🏨 Penginapan Mewah & Nyaman';
        document.getElementById('contentHotel').style.display = 'block';
    } else if (tipe === 'transport') {
        document.getElementById('katalogTitle').innerText = '✈️ Tiket Transportasi Perjalanan';
        document.getElementById('contentTransport').style.display = 'block';
    } else if (tipe === 'wisata') {
        document.getElementById('katalogTitle').innerText = '🎟️ Destinasi Tempat Wisata';
        document.getElementById('contentWisata').style.display = 'block';
    }
};

window.kembaliKeMenu = () => {
    document.getElementById('pageMainMenu').style.display = 'block';
    document.getElementById('promoSection').style.display = 'block';
    document.getElementById('pageKatalog').style.display = 'none';
};

// Lightbox Logic
window.bukaLightbox = (tipe, url, caption) => {
    const modal = document.getElementById('lightboxModal');
    const content = document.getElementById('lightboxContent');
    const capText = document.getElementById('lightboxCaption');
    
    if (tipe === 'image') {
        content.innerHTML = `<img src="${url}" style="max-width:100%; max-height:80vh; border-radius:10px; box-shadow:0 0 20px rgba(0,0,0,0.5);">`;
    } else if (tipe === 'video') {
        content.innerHTML = `<video controls autoplay style="max-width:100%; max-height:80vh; border-radius:10px; box-shadow:0 0 20px rgba(0,0,0,0.5);"><source src="${url}" type="video/mp4">Your browser does not support video.</video>`;
    }
    
    capText.innerText = caption;
    modal.style.display = 'flex';
};

window.tutupLightbox = () => {
    document.getElementById('lightboxModal').style.display = 'none';
    document.getElementById('lightboxContent').innerHTML = ''; // Hentikan video jika ada
};

// Logika Memuat Promo Untukmu
async function loadPromos() {
    try {
        const [resPaket, resHotel, resTransport, resWisata] = await Promise.all([
            fetch(API_BASE + "/paket"),
            fetch(API_BASE + "/hotel"),
            fetch(API_BASE + "/transportasi"),
            fetch(API_BASE + "/wisata")
        ]);
        
        const pakets = resPaket.ok ? await resPaket.json() : [];
        const hotels = resHotel.ok ? await resHotel.json() : [];
        const transports = resTransport.ok ? await resTransport.json() : [];
        const wisatas = resWisata.ok ? await resWisata.json() : [];
        
        let promos = [];
        
        // Filter paket
        pakets.forEach(p => {
            if (p.diskon && p.diskon > 0) {
                let imgUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama_paket)}&background=random&size=400`;
                if (p.daftar_gambar && p.daftar_gambar.length > 0) {
                    imgUrl = `${API_BASE}/uploads/${p.daftar_gambar[0]}`;
                }
                promos.push({
                    tipe: 'paket',
                    id: p.id_paket,
                    nama: p.nama_paket,
                    rating: '',
                    hargaAsli: p.harga_dasar,
                    diskon: p.diskon,
                    imgUrl: imgUrl
                });
            }
        });
        
        // Filter hotel
        hotels.forEach(h => {
            if (h.diskon && h.diskon > 0) {
                let imgUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(h.nama_hotel)}&background=random&size=400`;
                if (h.gambar) {
                    imgUrl = `${API_BASE}/uploads/${h.gambar}`;
                }
                
                let basePrice = 0;
                let extData = h.tipe_kamar || "";
                if(extData) {
                    const types = extData.split(',');
                    if(types.length > 0) {
                        const parts = types[0].split(':');
                        if(parts.length === 2) basePrice = parseFloat(parts[1].trim());
                    }
                }
                
                promos.push({
                    tipe: 'hotel',
                    id: h.id_hotel,
                    nama: h.nama_hotel,
                    rating: `${h.bintang} Bintang`,
                    hargaAsli: basePrice,
                    diskon: h.diskon,
                    imgUrl: imgUrl,
                    rawTipeKamar: h.tipe_kamar
                });
            }
        });
        
        // Filter transport
        transports.forEach(t => {
            if (t.diskon && t.diskon > 0) {
                let imgUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(t.operator)}&background=random&size=400`;
                if (t.gambar) {
                    imgUrl = `${API_BASE}/uploads/${t.gambar}`;
                }
                promos.push({
                    tipe: 'transportasi',
                    id: t.id_transport,
                    nama: t.operator,
                    rating: `${t.jenis}`,
                    hargaAsli: t.harga || 0,
                    diskon: t.diskon,
                    imgUrl: imgUrl
                });
            }
        });
        
        // Filter wisata
        wisatas.forEach(w => {
            if (w.diskon && w.diskon > 0) {
                let imgUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(w.nama_tempat)}&background=random&size=400`;
                if (w.gambar) {
                    imgUrl = `${API_BASE}/uploads/${w.gambar}`;
                }
                promos.push({
                    tipe: 'wisata',
                    id: w.id_wisata,
                    nama: w.nama_tempat,
                    rating: '',
                    hargaAsli: w.harga || 0,
                    diskon: w.diskon,
                    imgUrl: imgUrl
                });
            }
        });
        
        const container = document.getElementById('promoContainer');
        
        if (promos.length === 0) {
            container.innerHTML = '<p style="color: #666; font-size: 0.9rem;">Belum ada promo spesial saat ini.</p>';
            return;
        }
        
        container.innerHTML = '';
        promos.forEach(p => {
            const hargaBaru = p.hargaAsli - (p.hargaAsli * p.diskon / 100);
            const card = document.createElement('div');
            card.className = 'promo-card';
            card.onclick = () => {
                if(p.tipe === 'paket') {
                    bukaKatalog('paket');
                    setTimeout(() => bukaCheckout(p.id, p.nama, p.hargaAsli, 'paket', '', p.diskon), 300);
                } else if(p.tipe === 'hotel') {
                    bukaKatalog('hotel');
                    setTimeout(() => bukaCheckout(p.id, p.nama, p.hargaAsli, 'hotel', p.rawTipeKamar, p.diskon), 300);
                } else if(p.tipe === 'transportasi') {
                    bukaKatalog('transport');
                    setTimeout(() => bukaCheckout(p.id, p.nama, p.hargaAsli, 'transportasi', '', p.diskon), 300);
                } else if(p.tipe === 'wisata') {
                    bukaKatalog('wisata');
                    setTimeout(() => bukaCheckout(p.id, p.nama, p.hargaAsli, 'wisata', '', p.diskon), 300);
                }
            };
            
            card.innerHTML = `
                <div style="position:relative;">
                    <img src="${p.imgUrl}" alt="${p.nama}" class="promo-img">
                    <div class="promo-tag">Hemat ${p.diskon}%</div>
                </div>
                <div class="promo-body">
                    <p class="promo-title">${p.nama}</p>
                    ${p.rating ? `<div class="promo-rating">⭐ ${p.rating}</div>` : ''}
                    <p class="promo-old-price">Rp${p.hargaAsli.toLocaleString('id-ID')}</p>
                    <p class="promo-new-price">Rp${hargaBaru.toLocaleString('id-ID')}</p>
                </div>
            `;
            container.appendChild(card);
        });
        
    } catch (e) {
        document.getElementById('promoContainer').innerHTML = '<p style="color: red; font-size: 0.9rem;">Gagal memuat promo.</p>';
    }
}
