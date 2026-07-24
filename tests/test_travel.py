import pytest
import os
import shutil
from backend.models import PaketReguler, PaketPremium, PaketCustom
from backend.exceptions import KuotaPenuhError, JadwalPerjalananBentrokError
from backend.factory import PaketWisataFactory
from backend.booking_manager import BookingManager, DataManager

@pytest.fixture
def setup_manager():
    # Setup testing directory
    test_dir = "test_data"
    os.makedirs(test_dir, exist_ok=True)
    manager = BookingManager(folder_data=test_dir)
    # Reset file before test
    DataManager.simpan_json(manager.file_paket, [])
    DataManager.simpan_json(manager.file_booking, [])
    if os.path.exists(manager.file_laporan):
        os.remove(manager.file_laporan)
    
    manager.tambah_paket_baru("reguler", "P01", "Bali Reguler", "Bali", 500000, 10)
    manager.tambah_paket_baru("premium", "P02", "Bali Premium", "Bali", 500000, 5)
    manager.tambah_paket_baru("custom", "P03", "Bali Custom", "Bali", 500000, 2)
    
    yield manager
    
    # Teardown
    shutil.rmtree(test_dir)

# 1. Test Factory & Inheritance
def test_factory_pembuatan_paket():
    paket = PaketWisataFactory.buat_paket("reguler", "ID1", "Nama", "Dest", 1000, 10)
    assert isinstance(paket, PaketReguler)

# 2. Test Polymorphism (hitung_harga Reguler dengan diskon > 4 orang)
def test_polymorphism_hitung_harga_reguler():
    paket = PaketReguler("ID1", "Nama", "Dest", 100000, 10)
    # < 5 orang tidak ada diskon
    assert paket.hitung_harga(2) == 200000
    # >= 5 orang dapat diskon 5%
    assert paket.hitung_harga(5) == 475000  # (500000 * 0.95)

# 3. Test Polymorphism (hitung_harga Premium dengan biaya tambahan)
def test_polymorphism_hitung_harga_premium():
    paket = PaketPremium("ID1", "Nama", "Dest", 100000, 10)
    # Harga = (100000 + 1500000) * 2 = 3200000
    assert paket.hitung_harga(2) == 3200000

# 4. Test Encapsulation & Exception (KuotaPenuhError)
def test_encapsulation_dan_kuota_error():
    paket = PaketReguler("ID1", "Nama", "Dest", 100000, 2)
    assert paket.kuota == 2
    paket.kurangi_kuota(2)
    assert paket.kuota == 0
    assert paket.status_pemesanan == "Penuh"
    
    with pytest.raises(KuotaPenuhError):
        paket.kurangi_kuota(1)

# 5. Test File Handling (Menulis dan Membaca JSON)
def test_file_handling_json(setup_manager):
    manager = setup_manager
    manager.buat_pesanan("P01", "Budi", 2, "2023-12-01")
    
    data = DataManager.muat_json(manager.file_booking)
    assert len(data) == 1
    assert data[0]["nama_peserta"] == "Budi"

# 6. Test Exception JadwalPerjalananBentrokError
def test_jadwal_bentrok(setup_manager):
    manager = setup_manager
    manager.buat_pesanan("P01", "Andi", 1, "2023-12-01")
    
    with pytest.raises(JadwalPerjalananBentrokError):
        # Andi pesan di hari yang sama untuk paket apapun
        manager.buat_pesanan("P02", "Andi", 1, "2023-12-01")

# 7. Test Skenario Pembatalan & Refund (File CSV & JSON)
def test_pembatalan_dan_refund(setup_manager):
    manager = setup_manager
    booking = manager.buat_pesanan("P01", "Siti", 1, "2023-12-01")
    
    # Batal
    hasil = manager.batalkan_pesanan(booking["id_booking"])
    assert "pesan" in hasil
    
    data_booking = DataManager.muat_json(manager.file_booking)
    assert data_booking[0]["status"] == "Dibatalkan"
    
    # Kuota harus kembali
    assert manager.daftar_paket["P01"].kuota == 10

# 8. Test Custom Package Layanan Tambahan
def test_custom_paket_layanan_tambahan():
    paket = PaketCustom("ID1", "Nama", "Dest", 100000, 10)
    paket.tambah_layanan("Fotografer", 500000)
    # Harga dasar 100k + fotografer 500k = 600k * 2 = 1.2M
    assert paket.hitung_harga(2) == 1200000
