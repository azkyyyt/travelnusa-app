import json
import csv
import os
from typing import List, Dict
from datetime import datetime
from backend.factory import PaketWisataFactory
from backend.exceptions import KuotaPenuhError, JadwalPerjalananBentrokError

class DataManager:
    """Class untuk mengurus File Handling (JSON dan CSV)"""
    
    @staticmethod
    def simpan_json(filepath: str, data: List[Dict]):
        try:
            folder = os.path.dirname(filepath)
            if folder:
                os.makedirs(folder, exist_ok=True)
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=4)
        except Exception:
            try:
                tmp_path = os.path.join("/tmp", os.path.basename(filepath))
                with open(tmp_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=4)
            except Exception:
                pass

    @staticmethod
    def muat_json(filepath: str) -> List[Dict]:
        target_path = filepath
        if not os.path.exists(target_path):
            tmp_path = os.path.join("/tmp", os.path.basename(filepath))
            if os.path.exists(tmp_path):
                target_path = tmp_path
            else:
                return []
        try:
            with open(target_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return []

    @staticmethod
    def tulis_laporan_csv(filepath: str, data: Dict):
        try:
            folder = os.path.dirname(filepath)
            if folder:
                os.makedirs(folder, exist_ok=True)
            file_exists = os.path.isfile(filepath)
            with open(filepath, 'a', newline='', encoding='utf-8') as f:
                headers = ["id_booking", "tanggal", "id_paket", "nama_peserta", "jumlah_orang", "total_harga", "status"]
                writer = csv.DictWriter(f, fieldnames=headers)
                if not file_exists:
                    writer.writeheader()
                writer.writerow(data)
        except Exception:
            pass


class BookingManager:
    def __init__(self, folder_data="data"):
        self.folder_data = folder_data
        os.makedirs(self.folder_data, exist_ok=True)
        
        self.file_paket = os.path.join(self.folder_data, "paket_wisata.json")
        self.file_booking = os.path.join(self.folder_data, "booking.json")
        self.file_hotel = os.path.join(self.folder_data, "hotel.json")
        self.file_transportasi = os.path.join(self.folder_data, "transportasi.json")
        self.file_wisata = os.path.join(self.folder_data, "wisata.json")
        self.file_reviews = os.path.join(self.folder_data, "reviews.json")
        self.file_laporan = os.path.join(self.folder_data, "laporan_penjualan.csv")
        
        self.daftar_paket = {}
        self.daftar_booking = []
        self.daftar_hotel = []
        self.daftar_transportasi = []
        self.daftar_wisata = []
        self.daftar_reviews = []
        
        self._muat_data_awal()

    def _muat_data_awal(self):
        try:
            self.daftar_paket = {}
            data_paket = DataManager.muat_json(self.file_paket)
            for p in data_paket:
                # Migrasi format lama ke baru jika ada
                daftar_gbr = p.get("daftar_gambar", [])
                if "gambar" in p and isinstance(p["gambar"], str) and p["gambar"] != "":
                    if p["gambar"] not in daftar_gbr:
                        daftar_gbr.append(p["gambar"])
                        
                paket = PaketWisataFactory.buat_paket(
                    p["tipe"], p["id_paket"], p["nama_paket"], p["destinasi"], p["harga_dasar"], p["kuota"], daftar_gbr, p.get("video", "")
                )
                paket._PaketWisata__status_pemesanan = p.get("status_pemesanan", "Tersedia")
                self.daftar_paket[p["id_paket"]] = paket
                
            self.daftar_booking = DataManager.muat_json(self.file_booking)
            if not isinstance(self.daftar_booking, list):
                self.daftar_booking = []
                
            self.daftar_hotel = DataManager.muat_json(self.file_hotel)
            if not isinstance(self.daftar_hotel, list):
                self.daftar_hotel = []
                
            self.daftar_transportasi = DataManager.muat_json(self.file_transportasi)
            if not isinstance(self.daftar_transportasi, list):
                self.daftar_transportasi = []
                
            self.daftar_wisata = DataManager.muat_json(self.file_wisata)
            if not isinstance(self.daftar_wisata, list):
                self.daftar_wisata = []
                
            self.daftar_reviews = DataManager.muat_json(self.file_reviews)
            if not isinstance(self.daftar_reviews, list):
                self.daftar_reviews = []
                
            if not self.daftar_paket:
                p1 = PaketWisataFactory.buat_paket("Reguler", "PKT-001", "Wisata Eksotis Bali & Nusa Penida", "Bali", 3500000, 15, [], "")
                p1.diskon = 15
                p2 = PaketWisataFactory.buat_paket("Premium", "PKT-002", "Tour Spesial Tokyo & Mount Fuji", "Jepang", 12500000, 10, [], "")
                p2.diskon = 20
                p3 = PaketWisataFactory.buat_paket("Reguler", "PKT-003", "Petualangan Raja Ampat Papua", "Papua", 8500000, 8, [], "")
                p3.diskon = 10
                self.daftar_paket = {"PKT-001": p1, "PKT-002": p2, "PKT-003": p3}

            if not self.daftar_hotel:
                self.daftar_hotel = [
                    {"id_hotel": "HTL-001", "nama_hotel": "Hotel Resort Grand Bali", "lokasi": "Kuta, Bali", "bintang": 5, "tipe_kamar": "Deluxe:750000, Suite:1500000", "gambar": "", "diskon": 15},
                    {"id_hotel": "HTL-002", "nama_hotel": "Villa Jogja Heritage", "lokasi": "Yogyakarta", "bintang": 4, "tipe_kamar": "Standard:400000, Deluxe:650000", "gambar": "", "diskon": 10}
                ]

            if not self.daftar_transportasi:
                self.daftar_transportasi = [
                    {"id_transport": "TRP-001", "jenis": "Pesawat", "operator": "Garuda Indonesia", "rute": "Jakarta - Bali", "harga": 1200000, "gambar": "", "diskon": 10},
                    {"id_transport": "TRP-002", "jenis": "Kereta", "operator": "Kereta Taksaka", "rute": "Jakarta - Jogja", "harga": 450000, "gambar": "", "diskon": 5}
                ]

            if not self.daftar_wisata:
                self.daftar_wisata = [
                    {"id_wisata": "WST-001", "nama_tempat": "Candi Borobudur Masterpiece", "lokasi": "Magelang", "harga": 75000, "gambar": "", "diskon": 15},
                    {"id_wisata": "WST-002", "nama_tempat": "Pantai Kuta Sunset Point", "lokasi": "Bali", "harga": 25000, "gambar": "", "diskon": 0}
                ]
        except Exception as e:
            print(f"Error memuat data awal: {e}")
            
    def simpan_state(self):
        data = []
        for p in self.daftar_paket.values():
            p_dict = p.to_dict()
            data.append(p_dict)
        DataManager.simpan_json(self.file_paket, data)
        DataManager.simpan_json(self.file_hotel, self.daftar_hotel)
        DataManager.simpan_json(self.file_transportasi, self.daftar_transportasi)
        DataManager.simpan_json(self.file_wisata, self.daftar_wisata)

    def tambah_hotel(self, data: dict):
        self.daftar_hotel.append(data)
        self.simpan_state()

    def hapus_hotel(self, id_hotel: str):
        self.daftar_hotel = [h for h in self.daftar_hotel if h.get("id_hotel") != id_hotel]
        self.simpan_state()

    
    def edit_hotel(self, id_hotel: str, data_baru: dict):
        for i, h in enumerate(self.daftar_hotel):
            if h.get("id_hotel") == id_hotel:
                # Merge data
                if not data_baru.get("gambar") and h.get("gambar"):
                    data_baru["gambar"] = h["gambar"]
                self.daftar_hotel[i] = data_baru
                self._simpan_data("data/hotel.json", self.daftar_hotel)
                return
        raise Exception("Hotel tidak ditemukan")
    def tambah_transportasi(self, data: dict):
        self.daftar_transportasi.append(data)
        self.simpan_state()

    def hapus_transportasi(self, id_transport: str):
        self.daftar_transportasi = [t for t in self.daftar_transportasi if t.get("id_transport") != id_transport]
        self.simpan_state()

    def edit_transportasi(self, id_transport: str, data_baru: dict):
        ditemukan = False
        for i, t in enumerate(self.daftar_transportasi):
            if t.get("id_transport") == id_transport:
                # Pertahankan gambar lama jika tidak ada gambar baru
                if not data_baru.get("gambar"):
                    data_baru["gambar"] = t.get("gambar", "")
                self.daftar_transportasi[i] = data_baru
                ditemukan = True
                break
                
        if not ditemukan:
            raise ValueError("Transportasi tidak ditemukan")
            
        self.simpan_state()

    def tambah_wisata(self, data: dict):
        self.daftar_wisata.append(data)
        self.simpan_state()

    def hapus_wisata(self, id_wisata: str):
        self.daftar_wisata = [w for w in self.daftar_wisata if w.get("id_wisata") != id_wisata]
        self.simpan_state()

    def edit_wisata(self, id_wisata: str, data_baru: dict):
        ditemukan = False
        for i, w in enumerate(self.daftar_wisata):
            if w.get("id_wisata") == id_wisata:
                if not data_baru.get("gambar"):
                    data_baru["gambar"] = w.get("gambar", "")
                self.daftar_wisata[i] = data_baru
                ditemukan = True
                break
                
        if not ditemukan:
            raise ValueError("Tempat Wisata tidak ditemukan")
            
        self.simpan_state()

    def tambah_paket_baru(self, tipe: str, id_paket: str, nama_paket: str, destinasi: str, harga: float, kuota: int, daftar_gambar: List[str] = None, video: str = "", diskon: int = 0):
        paket = PaketWisataFactory.buat_paket(tipe, id_paket, nama_paket, destinasi, harga, kuota, daftar_gambar, video, diskon)
        self.daftar_paket[id_paket] = paket
        self.simpan_state()
        return paket

    def edit_paket(self, id_paket: str, nama_paket: str, destinasi: str, harga: float, kuota: int, daftar_gambar: List[str] = None, video: str = "", diskon: int = 0):
        if id_paket not in self.daftar_paket:
            raise ValueError(f"Paket dengan ID {id_paket} tidak ditemukan.")
        
        # Ambil tipe paket lama
        paket_lama = self.daftar_paket[id_paket]
        tipe = paket_lama.__class__.__name__
        
        # Jika tidak ada gambar/video yang diupload, gunakan yang lama
        gambar_final = daftar_gambar if daftar_gambar and len(daftar_gambar) > 0 else getattr(paket_lama, "daftar_gambar", [])
        video_final = video if video else getattr(paket_lama, "video", "")
        
        # Buat instansi ulang dengan data baru
        paket_baru = PaketWisataFactory.buat_paket(tipe, id_paket, nama_paket, destinasi, harga, kuota, gambar_final, video_final, diskon)
        
        # Pertahankan data peserta lama
        paket_baru.peserta = paket_lama.peserta
        # Sesuaikan sisa kuota jika ada peserta (ini simpelnya, asumsikan kuota adalah total maksimal baru)
        sisa = kuota - len(paket_baru.peserta)
        if sisa < 0:
            raise ValueError("Kuota baru tidak boleh lebih kecil dari jumlah peserta yang sudah mendaftar!")
        paket_baru._PaketWisata__kuota = sisa  # Force update private attribute
        
        self.daftar_paket[id_paket] = paket_baru
        self.simpan_state()
        return paket_baru

    def hapus_paket(self, id_paket: str):
        if id_paket not in self.daftar_paket:
            raise ValueError(f"Paket dengan ID {id_paket} tidak ditemukan.")
        del self.daftar_paket[id_paket]
        self.simpan_state()
        return {"pesan": f"Paket {id_paket} berhasil dihapus"}

    def buat_pesanan(self, id_paket: str, nama_peserta: str, jumlah_orang: int, tanggal_berangkat: str, transportasi: str = "Bus", kode_promo: str = None, tipe_pesanan: str = "paket", tipe_kamar_pilihan: str = None) -> Dict:
        semua_booking = DataManager.muat_json(self.file_booking)
        
        # Pengecekan Jadwal Bentrok
        for b in semua_booking:
            if b["nama_peserta"] == nama_peserta and b["tanggal_berangkat"] == tanggal_berangkat and b["status"] != "Dibatalkan":
                raise JadwalPerjalananBentrokError(f"Peserta {nama_peserta} sudah memiliki jadwal di tanggal {tanggal_berangkat}.")

        total_harga = 0
        id_booking = ""

        if tipe_pesanan == "paket":
            if id_paket not in self.daftar_paket:
                raise ValueError("Paket wisata tidak ditemukan.")
                
            paket = self.daftar_paket[id_paket]
            
            # Cek dan kurangi kuota
            try:
                paket.kurangi_kuota(jumlah_orang)
            except KuotaPenuhError as e:
                raise e

            # Hitung harga (Polymorphism + Promo + Transport)
            total_harga = paket.hitung_harga_final(jumlah_orang, transportasi, kode_promo)
            
            # Tambah ke daftar peserta di objek
            for _ in range(jumlah_orang):
                paket.tambah_peserta(nama_peserta, {"tanggal_berangkat": tanggal_berangkat, "transportasi": transportasi})
                
            id_booking = f"BKG-{datetime.now().strftime('%Y%m%d%H%M%S')}-{id_paket}"

        elif tipe_pesanan == "hotel":
            hotel = next((h for h in self.daftar_hotel if h.get("id_hotel") == id_paket), None)
            if not hotel:
                raise ValueError("Hotel tidak ditemukan.")
            
            harga_kamar = 0
            if hotel.get("tipe_kamar"):
                types = [x.strip() for x in hotel.get("tipe_kamar").split(',')]
                for t in types:
                    if ':' in t:
                        nama, harga = t.split(':', 1)
                        if nama.strip() == tipe_kamar_pilihan:
                            harga_kamar = float(harga.strip())
                            break
                            
            if hotel.get("diskon") and hotel.get("diskon") > 0:
                harga_kamar = harga_kamar * (1 - (hotel.get("diskon") / 100.0))
            
            # Jika tidak ketemu fallback ke 0
            total_harga = harga_kamar * jumlah_orang
            id_booking = f"BKG-HTL-{datetime.now().strftime('%Y%m%d%H%M%S')}-{id_paket}"

        elif tipe_pesanan == "transportasi":
            trans = next((t for t in self.daftar_transportasi if t.get("id_transport") == id_paket), None)
            if not trans:
                raise ValueError("Transportasi tidak ditemukan.")
            
            harga_trans = float(trans.get("harga", 0))
            if trans.get("diskon") and trans.get("diskon") > 0:
                harga_trans = harga_trans * (1 - (trans.get("diskon") / 100.0))
                
            total_harga = harga_trans * jumlah_orang
            id_booking = f"BKG-TRN-{datetime.now().strftime('%Y%m%d%H%M%S')}-{id_paket}"
            
        elif tipe_pesanan == "wisata":
            wisata = next((w for w in self.daftar_wisata if w.get("id_wisata") == id_paket), None)
            if not wisata:
                raise ValueError("Tempat Wisata tidak ditemukan.")
            
            harga_w = float(wisata.get("harga", 0))
            if wisata.get("diskon") and wisata.get("diskon") > 0:
                harga_w = harga_w * (1 - (wisata.get("diskon") / 100.0))
                
            total_harga = harga_w * jumlah_orang
            id_booking = f"BKG-WST-{datetime.now().strftime('%Y%m%d%H%M%S')}-{id_paket}"
        
        else:
            raise ValueError(f"Tipe pesanan '{tipe_pesanan}' tidak dikenal.")
        
        # Simpan booking ke JSON
        data_booking = {
            "id_booking": id_booking,
            "id_paket": id_paket,
            "nama_peserta": nama_peserta,
            "jumlah_orang": jumlah_orang,
            "tanggal_berangkat": tanggal_berangkat,
            "pilihan_transportasi": transportasi if tipe_pesanan == "paket" else (tipe_kamar_pilihan if tipe_pesanan == "hotel" else ""),
            "kode_promo": kode_promo,
            "total_harga": total_harga,
            "status_pembayaran": "Menunggu Pembayaran",
            "status": "Dikonfirmasi"
        }
        semua_booking.append(data_booking)
        DataManager.simpan_json(self.file_booking, semua_booking)
        
        # Catat di CSV Laporan
        laporan = {
            "id_booking": id_booking,
            "tanggal": datetime.now().strftime('%Y-%m-%d'),
            "id_paket": id_paket,
            "nama_peserta": nama_peserta,
            "jumlah_orang": jumlah_orang,
            "total_harga": total_harga,
            "status": "Dikonfirmasi (Menunggu Bayar)"
        }
        DataManager.tulis_laporan_csv(self.file_laporan, laporan)
        self.simpan_state()
        
        return data_booking

    def proses_pembayaran(self, id_booking: str, jumlah_bayar: float):
        semua_booking = DataManager.muat_json(self.file_booking)
        booking_ditemukan = None
        for b in semua_booking:
            if b["id_booking"] == id_booking:
                if b["status"] == "Dibatalkan":
                    raise ValueError("Pesanan sudah dibatalkan, tidak bisa dibayar.")
                if jumlah_bayar < b["total_harga"]:
                    raise ValueError("Jumlah pembayaran kurang dari total tagihan!")
                b["status_pembayaran"] = "Lunas"
                booking_ditemukan = b
                break
        
        if not booking_ditemukan:
            raise ValueError("Booking tidak ditemukan")
            
        DataManager.simpan_json(self.file_booking, semua_booking)
        
        # Update Laporan
        laporan = {
            "id_booking": id_booking,
            "tanggal": datetime.now().strftime('%Y-%m-%d'),
            "id_paket": booking_ditemukan["id_paket"],
            "nama_peserta": booking_ditemukan["nama_peserta"],
            "jumlah_orang": booking_ditemukan["jumlah_orang"],
            "total_harga": booking_ditemukan["total_harga"],
            "status": "Lunas"
        }
        DataManager.tulis_laporan_csv(self.file_laporan, laporan)
        
        return {
            "pesan": "Pembayaran berhasil, tiket aktif (Status LUNAS).",
            "booking": booking_ditemukan
        }

    def batalkan_pesanan(self, id_booking: str) -> Dict:
        semua_booking = DataManager.muat_json(self.file_booking)
        booking_ditemukan = None
        
        for b in semua_booking:
            if b["id_booking"] == id_booking and b["status"] == "Dikonfirmasi":
                b["status"] = "Dibatalkan"
                booking_ditemukan = b
                break
                
        if not booking_ditemukan:
            raise ValueError("Booking tidak ditemukan atau sudah dibatalkan.")
            
        # Kembalikan kuota
        paket = self.daftar_paket.get(booking_ditemukan["id_paket"])
        if paket:
            paket.tambah_kuota(booking_ditemukan["jumlah_orang"])
            self.simpan_state()
            
        DataManager.simpan_json(self.file_booking, semua_booking)
        
        # Hitung refund (potongan 15%)
        total_refund = booking_ditemukan["total_harga"] * 0.85
        
        # Catat pembatalan ke CSV
        laporan = {
            "id_booking": id_booking,
            "tanggal": datetime.now().strftime('%Y-%m-%d'),
            "id_paket": booking_ditemukan["id_paket"],
            "nama_peserta": booking_ditemukan["nama_peserta"],
            "jumlah_orang": booking_ditemukan["jumlah_orang"],
            "total_harga": -total_refund,
            "status": "Dibatalkan (Refund)"
        }
        DataManager.tulis_laporan_csv(self.file_laporan, laporan)
        
        return {"pesan": f"Pesanan {id_booking} dibatalkan. Dana dikembalikan Rp{total_refund:,.0f} (Potongan 15%)."}

    def tambah_review(self, target_id: str, user_name: str, rating: int, comment: str) -> Dict:
        review_baru = {
            "id_review": f"REV-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "target_id": target_id,
            "user_name": user_name,
            "rating": rating,
            "comment": comment,
            "tanggal": datetime.now().strftime('%Y-%m-%d')
        }
        self.daftar_reviews.append(review_baru)
        DataManager.simpan_json(self.file_reviews, self.daftar_reviews)
        return {"pesan": "Review berhasil ditambahkan", "review": review_baru}

    def get_reviews(self, target_id: str) -> List[Dict]:
        return [r for r in self.daftar_reviews if r.get("target_id") == target_id]
