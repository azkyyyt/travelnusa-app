from backend.models import PaketReguler, PaketPremium, PaketCustom, PaketWisata
from typing import List

class PaketWisataFactory:
    """Factory Method pattern untuk membuat instance paket wisata berdasarkan tipenya."""
    
    @staticmethod
    def buat_paket(tipe_paket: str, id_paket: str, nama_paket: str, destinasi: str, harga_dasar: float, kuota_maksimal: int, daftar_gambar: List[str] = None, video: str = "", diskon: int = 0) -> PaketWisata:
        tipe = tipe_paket.lower().replace("paket", "")
        if tipe == "reguler":
            return PaketReguler(id_paket, nama_paket, destinasi, harga_dasar, kuota_maksimal, daftar_gambar, video, diskon)
        elif tipe == "premium":
            return PaketPremium(id_paket, nama_paket, destinasi, harga_dasar, kuota_maksimal, daftar_gambar, video, diskon)
        elif tipe == "custom":
            return PaketCustom(id_paket, nama_paket, destinasi, harga_dasar, kuota_maksimal, daftar_gambar, video, diskon)
        else:
            raise ValueError(f"Tipe paket {tipe_paket} tidak dikenali.")
