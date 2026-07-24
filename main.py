import os
import sys
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import RedirectResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.booking_manager import BookingManager
from backend.exceptions import KuotaPenuhError, JadwalPerjalananBentrokError

app = FastAPI(title="Travel Agency API v3 (JSON/CSV File Handling)")

# Middleware pelindung Vercel Serverless Path Rewrites
@app.middleware("http")
async def fix_vercel_path_routing(request: Request, call_next):
    path = request.url.path
    if path.startswith("/api/index"):
        new_path = path.replace("/api/index", "", 1)
        if not new_path:
            new_path = "/"
        request.scope["path"] = new_path
    response = await call_next(request)
    return response

# Setup CORS penuh agar bisa diakses Frontend HTML dari mana saja
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Safe absolute directory resolution for Vercel / Cloud / Local
uploads_dir = os.path.join(BASE_DIR, "uploads")
data_dir = os.path.join(BASE_DIR, "data")
frontend_dir = os.path.join(BASE_DIR, "frontend")

try:
    os.makedirs(uploads_dir, exist_ok=True)
except Exception:
    uploads_dir = os.path.join("/tmp", "uploads")
    os.makedirs(uploads_dir, exist_ok=True)

try:
    os.makedirs(data_dir, exist_ok=True)
except Exception:
    data_dir = os.path.join("/tmp", "data")
    os.makedirs(data_dir, exist_ok=True)

if os.path.exists(uploads_dir):
    app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

if os.path.exists(frontend_dir):
    app.mount("/frontend", StaticFiles(directory=frontend_dir, html=True), name="frontend")

manager = BookingManager(folder_data=data_dir)

def save_uploaded_file(file_obj) -> str:
    if not file_obj or not getattr(file_obj, "filename", None):
        return ""
    try:
        file_location = os.path.join(uploads_dir, file_obj.filename)
        with open(file_location, "wb+") as file_object:
            file_object.write(file_obj.file.read())
    except Exception:
        try:
            tmp_location = os.path.join("/tmp", "uploads", file_obj.filename)
            os.makedirs(os.path.dirname(tmp_location), exist_ok=True)
            with open(tmp_location, "wb+") as file_object:
                file_object.write(file_obj.file.read())
        except Exception:
            pass
    return file_obj.filename

class PesanRequest(BaseModel):
    id_paket: str
    nama_peserta: str
    jumlah_orang: int
    tanggal_berangkat: str
    transportasi: str = "Bus"
    kode_promo: Optional[str] = None
    tipe_pesanan: str = "paket"
    tipe_kamar_pilihan: Optional[str] = None

class BayarRequest(BaseModel):
    id_booking: str
    jumlah_bayar: float

@app.get("/")
def root():
    customer_file = os.path.join(frontend_dir, "customer.html")
    if os.path.exists(customer_file):
        return FileResponse(customer_file)
    return RedirectResponse(url="/frontend/customer.html")

@app.get("/paket")
def get_semua_paket():
    return [paket.to_dict() for paket in manager.daftar_paket.values()]

@app.put("/paket/{id_paket}")
async def edit_paket(
    id_paket: str,
    nama_paket: str = Form(...),
    destinasi: str = Form(...),
    harga: float = Form(...),
    kuota: int = Form(...),
    gambar: Optional[List[UploadFile]] = File(None),
    video: Optional[UploadFile] = File(None),
    diskon: int = Form(0)
):
    try:
        nama_gambar_list = []
        if gambar:
            for g in gambar:
                fname = save_uploaded_file(g)
                if fname:
                    nama_gambar_list.append(fname)
                    
        nama_video = save_uploaded_file(video)
            
        manager.edit_paket(id_paket, nama_paket, destinasi, harga, kuota, nama_gambar_list, nama_video, diskon)
        return {"message": "Paket berhasil diupdate."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/paket/{id_paket}")
def hapus_paket(id_paket: str):
    try:
        return manager.hapus_paket(id_paket)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/booking")
def get_semua_booking():
    from backend.booking_manager import DataManager
    return DataManager.muat_json(manager.file_booking)

@app.get("/hotel")
def get_hotel():
    return manager.daftar_hotel

@app.post("/hotel")
async def tambah_hotel(
    id_hotel: str = Form(...),
    nama_hotel: str = Form(...),
    lokasi: str = Form(...),
    bintang: int = Form(...),
    tipe_kamar: str = Form("Standard:500000"),
    gambar: UploadFile = File(None),
    diskon: int = Form(0)
):
    try:
        nama_gambar = save_uploaded_file(gambar)
        data = {
            "id_hotel": id_hotel,
            "nama_hotel": nama_hotel,
            "lokasi": lokasi,
            "bintang": bintang,
            "tipe_kamar": tipe_kamar,
            "gambar": nama_gambar,
            "diskon": diskon
        }
        manager.tambah_hotel(data)
        return {"message": "Hotel berhasil ditambahkan."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/hotel/{id_hotel}")
def hapus_hotel(id_hotel: str):
    manager.hapus_hotel(id_hotel)
    return {"message": "Hotel berhasil dihapus"}

@app.put("/hotel/{id_hotel}")
async def edit_hotel(
    id_hotel: str,
    nama_hotel: str = Form(...),
    lokasi: str = Form(...),
    bintang: int = Form(...),
    tipe_kamar: str = Form(...),
    gambar: UploadFile = File(None),
    diskon: int = Form(0)
):
    try:
        nama_gambar = save_uploaded_file(gambar)
        data_baru = {
            "id_hotel": id_hotel,
            "nama_hotel": nama_hotel,
            "lokasi": lokasi,
            "bintang": bintang,
            "tipe_kamar": tipe_kamar,
            "gambar": nama_gambar,
            "diskon": diskon
        }
        manager.edit_hotel(id_hotel, data_baru)
        return {"message": "Hotel berhasil diupdate."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/transportasi")
def get_transportasi():
    return manager.daftar_transportasi

@app.post("/transportasi")
async def tambah_transportasi(
    id_transport: str = Form(...),
    jenis: str = Form(...),
    operator: str = Form(...),
    rute: str = Form(...),
    harga: float = Form(...),
    gambar: UploadFile = File(None),
    diskon: int = Form(0)
):
    try:
        nama_gambar = save_uploaded_file(gambar)
        data = {
            "id_transport": id_transport,
            "jenis": jenis,
            "operator": operator,
            "rute": rute,
            "harga": harga,
            "gambar": nama_gambar,
            "diskon": diskon
        }
        manager.tambah_transportasi(data)
        return {"message": "Transportasi berhasil ditambahkan."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/transportasi/{id_transport}")
def hapus_transportasi(id_transport: str):
    manager.hapus_transportasi(id_transport)
    return {"message": "Transportasi berhasil dihapus"}

@app.put("/transportasi/{id_transport}")
async def edit_transportasi(
    id_transport: str,
    jenis: str = Form(...),
    operator: str = Form(...),
    rute: str = Form(...),
    harga: float = Form(...),
    gambar: UploadFile = File(None),
    diskon: int = Form(0)
):
    try:
        nama_gambar = save_uploaded_file(gambar)
        data_baru = {
            "id_transport": id_transport,
            "jenis": jenis,
            "operator": operator,
            "rute": rute,
            "harga": harga,
            "gambar": nama_gambar,
            "diskon": diskon
        }
        manager.edit_transportasi(id_transport, data_baru)
        return {"message": "Transportasi berhasil diupdate."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/wisata")
def get_wisata():
    return manager.daftar_wisata

@app.post("/wisata")
async def tambah_wisata(
    id_wisata: str = Form(...),
    nama_tempat: str = Form(...),
    lokasi: str = Form(...),
    harga: float = Form(...),
    gambar: UploadFile = File(None),
    diskon: int = Form(0)
):
    try:
        nama_gambar = save_uploaded_file(gambar)
        data = {
            "id_wisata": id_wisata,
            "nama_tempat": nama_tempat,
            "lokasi": lokasi,
            "harga": harga,
            "gambar": nama_gambar,
            "diskon": diskon
        }
        manager.tambah_wisata(data)
        return {"message": "Tempat wisata berhasil ditambahkan."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/wisata/{id_wisata}")
def hapus_wisata(id_wisata: str):
    manager.hapus_wisata(id_wisata)
    return {"message": "Tempat wisata berhasil dihapus"}

@app.put("/wisata/{id_wisata}")
async def edit_wisata(
    id_wisata: str,
    nama_tempat: str = Form(...),
    lokasi: str = Form(...),
    harga: float = Form(...),
    gambar: UploadFile = File(None),
    diskon: int = Form(0)
):
    try:
        nama_gambar = save_uploaded_file(gambar)
        data_baru = {
            "id_wisata": id_wisata,
            "nama_tempat": nama_tempat,
            "lokasi": lokasi,
            "harga": harga,
            "gambar": nama_gambar,
            "diskon": diskon
        }
        manager.edit_wisata(id_wisata, data_baru)
        return {"message": "Tempat wisata berhasil diupdate."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/paket")
async def tambah_paket(
    tipe: str = Form(...),
    id_paket: str = Form(...),
    nama_paket: str = Form(...),
    destinasi: str = Form(...),
    harga: float = Form(...),
    kuota: int = Form(...),
    gambar: Optional[List[UploadFile]] = File(None),
    video: Optional[UploadFile] = File(None),
    diskon: int = Form(0)
):
    try:
        nama_gambar_list = []
        if gambar:
            for g in gambar:
                fname = save_uploaded_file(g)
                if fname:
                    nama_gambar_list.append(fname)
                    
        nama_video = save_uploaded_file(video)
            
        manager.tambah_paket(tipe, id_paket, nama_paket, destinasi, harga, kuota, nama_gambar_list, nama_video, diskon)
        return {"message": "Paket berhasil ditambahkan."}
    except (KuotaPenuhError, JadwalPerjalananBentrokError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan internal: {str(e)}")

@app.post("/pesan")
def buat_pesanan(req: PesanRequest):
    try:
        booking = manager.buat_pesanan(
            id_paket=req.id_paket,
            nama_peserta=req.nama_peserta,
            jumlah_orang=req.jumlah_orang,
            tanggal_berangkat=req.tanggal_berangkat,
            transportasi=req.transportasi,
            kode_promo=req.kode_promo,
            tipe_pesanan=req.tipe_pesanan,
            tipe_kamar_pilihan=req.tipe_kamar_pilihan
        )
        return {
            "message": "Pemesanan berhasil dibuat.",
            "id_booking": booking["id_booking"],
            "total_biaya": booking["total_biaya"],
            "detail": booking
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except (KuotaPenuhError, JadwalPerjalananBentrokError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan internal: {str(e)}")

@app.post("/bayar")
def proses_pembayaran(req: BayarRequest):
    try:
        struk = manager.proses_pembayaran(req.id_booking, req.jumlah_bayar)
        return {
            "message": "Pembayaran berhasil.",
            "struk": struk
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan internal: {str(e)}")

@app.get("/struk/{id_booking}")
def lihat_struk(id_booking: str):
    for b in manager.daftar_booking:
        if b["id_booking"] == id_booking:
            if b["status_pembayaran"] == "Lunas":
                return b.get("struk", {"message": "Struk tidak ditemukan."})
            else:
                raise HTTPException(status_code=400, detail="Pemesanan belum lunas.")
    raise HTTPException(status_code=404, detail="ID Booking tidak ditemukan.")

@app.get("/laporan/csv")
def unduh_laporan_csv():
    filepath = manager.file_laporan_csv
    if os.path.exists(filepath):
        return FileResponse(filepath, media_type="text/csv", filename="laporan_penjualan.csv")
    raise HTTPException(status_code=404, detail="Berkas laporan CSV belum tersedia.")

@app.get("/detail_refund/{id_booking}")
def detail_refund(id_booking: str):
    try:
        hasil = manager.hitung_detail_refund(id_booking)
        return hasil
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/refund/{id_booking}")
def refund_pesanan(id_booking: str):
    try:
        hasil = manager.batalkan_pesanan(id_booking)
        return hasil
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ReviewRequest(BaseModel):
    target_id: str
    user_name: str
    rating: int
    comment: str

@app.post("/reviews")
def tambah_review(req: ReviewRequest):
    return manager.tambah_review(req.target_id, req.user_name, req.rating, req.comment)

@app.get("/reviews/{target_id}")
def get_reviews(target_id: str):
    return manager.get_reviews(target_id)

@app.get("/{file_name}")
def get_static_file(file_name: str):
    file_path = os.path.join(frontend_dir, file_name)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="File not found")
