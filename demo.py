from backend.booking_manager import BookingManager
from backend.exceptions import KuotaPenuhError, JadwalPerjalananBentrokError
import os
import shutil

def jalankan_demo():
    print("="*50)
    print("DEMONSTRASI APLIKASI TRAVEL AGENCY")
    print("="*50)
    
    # Setup data
    demo_dir = "data_demo"
    if os.path.exists(demo_dir):
        shutil.rmtree(demo_dir)
    manager = BookingManager(folder_data=demo_dir)
    
    manager.tambah_paket_baru("reguler", "PKG-REG", "Tour Bali Reguler", "Bali", 2000000, 2)
    manager.tambah_paket_baru("premium", "PKG-PRM", "Tour Eropa Premium", "Eropa", 15000000, 10)
    
    print("\n[SKENARIO NORMAL] - Pemesanan Sukses")
    try:
        booking1 = manager.buat_pesanan("PKG-REG", "Bapak Budi", 1, "2024-01-15")
        print(f"[BERHASIL] ID Booking: {booking1['id_booking']}")
        print(f"   Total Harga (setelah polymorphism): Rp{booking1['total_harga']:,.2f}")
    except Exception as e:
        print(f"Gagal: {e}")

    print("\n[SKENARIO ERROR 1] - Jadwal Bentrok (Custom Exception)")
    try:
        # Budi mencoba pesan paket lain di tanggal yang sama (2024-01-15)
        manager.buat_pesanan("PKG-PRM", "Bapak Budi", 1, "2024-01-15")
    except JadwalPerjalananBentrokError as e:
        print(f"[ERROR YANG DIHARAPKAN]: {e}")
        
    print("\n[SKENARIO ERROR 2] - Kuota Penuh (Custom Exception)")
    try:
        # Sisa kuota PKG-REG adalah 1 (karena awal 2, dipesan Budi 1)
        # Seseorang mencoba memesan 2 kursi
        manager.buat_pesanan("PKG-REG", "Ibu Ani", 2, "2024-01-20")
    except KuotaPenuhError as e:
        print(f"[ERROR YANG DIHARAPKAN]: {e}")

    print("\n[SKENARIO PEMBATALAN] - File Handling Terupdate")
    try:
        print(f"Status Kuota PKG-REG sebelum batal: {manager.daftar_paket['PKG-REG'].kuota}")
        hasil_batal = manager.batalkan_pesanan(booking1['id_booking'])
        print(f"[BERHASIL] {hasil_batal['pesan']}. Refund: Rp{hasil_batal['total_refund']:,.2f}")
        print(f"Status Kuota PKG-REG setelah batal: {manager.daftar_paket['PKG-REG'].kuota} (Kembali)")
    except Exception as e:
        print(f"Gagal membatalkan: {e}")
        
    print("\nDemonstrasi Selesai. Silakan cek folder 'data_demo' untuk melihat file JSON dan CSV yang dihasilkan.")
    print("="*50)

if __name__ == "__main__":
    jalankan_demo()
