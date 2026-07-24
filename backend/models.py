from abc import ABC, abstractmethod
from typing import List, Dict
from backend.exceptions import KuotaPenuhError

class PaketWisata(ABC):
    def __init__(self, id_paket: str, nama_paket: str, destinasi: str, harga_dasar: float, kuota_maksimal: int, daftar_gambar: List[str] = None, video: str = "", diskon: int = 0):
        self.id_paket = id_paket
        self.nama_paket = nama_paket
        self.destinasi = destinasi
        self.harga_dasar = harga_dasar
        self.daftar_gambar = daftar_gambar if daftar_gambar is not None else []
        self.video = video
        self.diskon = diskon
        # Encapsulation: atribut privat
        self.__kuota = kuota_maksimal
        self.__status_pemesanan = "Tersedia"
        self.peserta: List[Dict] = []
        
    @property
    def kuota(self) -> int:
        return self.__kuota

    @property
    def status_pemesanan(self) -> str:
        return self.__status_pemesanan
        
    def kurangi_kuota(self, jumlah: int = 1):
        if self.__kuota < jumlah:
            raise KuotaPenuhError(f"Gagal memesan {jumlah} kursi. Sisa kuota: {self.__kuota}.")
        self.__kuota -= jumlah
        if self.__kuota == 0:
            self.__status_pemesanan = "Penuh"

    def tambah_kuota(self, jumlah: int = 1):
        self.__kuota += jumlah
        if self.__kuota > 0:
            self.__status_pemesanan = "Tersedia"

    def tambah_peserta(self, nama_peserta: str, data_tambahan: Dict = None):
        data = {"nama": nama_peserta}
        if data_tambahan:
            data.update(data_tambahan)
        self.peserta.append(data)

    @abstractmethod
    def hitung_harga(self, jumlah_orang: int) -> float:
        """Polymorphism: method yang harus di-override oleh subclass (menghitung harga dasar)"""
        pass

    def hitung_harga_final(self, jumlah_orang: int, jenis_transportasi: str = "Bus", kode_promo: str = None) -> float:
        """Menghitung harga akhir termasuk ongkos transportasi tambahan dan potongan promo."""
        harga_sementara = self.hitung_harga(jumlah_orang)
        
        # Potongan diskon produk (jika ada)
        if self.diskon > 0:
            harga_sementara = harga_sementara * (1 - (self.diskon / 100.0))
            
        # Biaya tambahan per orang berdasarkan jenis transportasi
        biaya_transportasi = 0
        if jenis_transportasi.lower() == "pesawat":
            biaya_transportasi = 1000000
        elif jenis_transportasi.lower() == "kereta":
            biaya_transportasi = 400000
        elif jenis_transportasi.lower() == "bus":
            biaya_transportasi = 100000
            
        total_sebelum_promo = harga_sementara + (biaya_transportasi * jumlah_orang)
        
        # Logika Promo Code (Misal: PROMO20 -> Diskon 20%)
        diskon = 0
        if kode_promo == "PROMO20":
            diskon = 0.20
        elif kode_promo == "HEMAT10":
            diskon = 0.10
            
        return total_sebelum_promo * (1 - diskon)

    def to_dict(self):
        return {
            "id_paket": self.id_paket,
            "nama_paket": self.nama_paket,
            "destinasi": self.destinasi,
            "harga_dasar": self.harga_dasar,
            "kuota": self.__kuota,
            "daftar_gambar": self.daftar_gambar,
            "video": self.video,
            "diskon": self.diskon,
            "status_pemesanan": self.__status_pemesanan,
            "tipe": self.__class__.__name__
        }

class PaketReguler(PaketWisata):
    def __init__(self, id_paket: str, nama_paket: str, destinasi: str, harga_dasar: float, kuota_maksimal: int, daftar_gambar: List[str] = None, video: str = "", diskon: int = 0):
        super().__init__(id_paket, nama_paket, destinasi, harga_dasar, kuota_maksimal, daftar_gambar, video, diskon)
        self.fasilitas = ["Transportasi Bus", "Penginapan Bintang 3", "Makan 3x Sehari"]

    def hitung_harga(self, jumlah_orang: int) -> float:
        total = self.harga_dasar * jumlah_orang
        if jumlah_orang >= 5:
            total = total * 0.95
        return total
        
    def to_dict(self):
        data = super().to_dict()
        data["fasilitas"] = self.fasilitas
        return data

class PaketPremium(PaketWisata):
    def __init__(self, id_paket: str, nama_paket: str, destinasi: str, harga_dasar: float, kuota_maksimal: int, daftar_gambar: List[str] = None, video: str = "", diskon: int = 0):
        super().__init__(id_paket, nama_paket, destinasi, harga_dasar, kuota_maksimal, daftar_gambar, video, diskon)
        self.fasilitas = ["Transportasi Pesawat/Executive", "Penginapan Bintang 5", "Makan Fine Dining", "Private Guide"]
        self.biaya_premium = 1500000  # Biaya tambahan per orang

    def hitung_harga(self, jumlah_orang: int) -> float:
        total = (self.harga_dasar + self.biaya_premium) * jumlah_orang
        if jumlah_orang >= 4:
            total = total * 0.90
        return total

    def to_dict(self):
        data = super().to_dict()
        data["fasilitas"] = self.fasilitas
        data["biaya_premium"] = self.biaya_premium
        return data

class PaketCustom(PaketWisata):
    def __init__(self, id_paket: str, nama_paket: str, destinasi: str, harga_dasar: float, kuota_maksimal: int, daftar_gambar: List[str] = None, video: str = "", diskon: int = 0):
        super().__init__(id_paket, nama_paket, destinasi, harga_dasar, kuota_maksimal, daftar_gambar, video, diskon)
        self.layanan_tambahan = {}  # {nama_layanan: harga}

    def tambah_layanan(self, nama_layanan: str, harga: float):
        self.layanan_tambahan[nama_layanan] = harga

    def hitung_harga(self, jumlah_orang: int) -> float:
        total_layanan = sum(self.layanan_tambahan.values())
        total = (self.harga_dasar + total_layanan) * jumlah_orang
        return total

    def to_dict(self):
        data = super().to_dict()
        data["layanan_tambahan"] = self.layanan_tambahan
        return data
