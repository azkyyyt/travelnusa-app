import os
import sys
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
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

# Setup CORS agar bisa diakses Frontend HTML
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
                if g and g.filename:
                    file_location = f"uploads/{g.filename}"
                    with open(file_location, "wb+") as file_object:
                        file_object.write(g.file.read())
                    nama_gambar_list.append(g.filename)
                    
        nama_video = ""
        if video and video.filename:
            file_location = f"uploads/{video.filename}"
            with open(file_location, "wb+") as file_object:
                file_object.write(video.file.read())
            nama_video = video.filename
            
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
        nama_gambar = ""
        if gambar and gambar.filename:
            file_location = f"uploads/{gambar.filename}"
            with open(file_location, "wb+") as file_object:
                file_object.write(gambar.file.read())
            nama_gambar = gambar.filename
            
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
        nama_gambar = ""
        if gambar and gambar.filename:
            file_location = f"uploads/{gambar.filename}"
            with open(file_location, "wb+") as file_object:
                file_object.write(gambar.file.read())
            nama_gambar = gambar.filename
            
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
        nama_gambar = ""
        if gambar and gambar.filename:
            file_location = f"uploads/{gambar.filename}"
            with open(file_location, "wb+") as file_object:
                file_object.write(gambar.file.read())
            nama_gambar = gambar.filename
            
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
        nama_gambar = ""
        if gambar and gambar.filename:
            file_location = f"uploads/{gambar.filename}"
            with open(file_location, "wb+") as file_object:
                file_object.write(gambar.file.read())
            nama_gambar = gambar.filename
            
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
        nama_gambar = ""
        if gambar and gambar.filename:
            file_location = f"uploads/{gambar.filename}"
            with open(file_location, "wb+") as file_object:
                file_object.write(gambar.file.read())
            nama_gambar = gambar.filename
            
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
        nama_gambar = ""
        if gambar and gambar.filename:
            file_location = f"uploads/{gambar.filename}"
            with open(file_location, "wb+") as file_object:
                file_object.write(gambar.file.read())
            nama_gambar = gambar.filename
            
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
                if g and g.filename:
                    file_location = f"uploads/{g.filename}"
                    with open(file_location, "wb+") as file_object:
                        file_object.write(g.file.read())
                    nama_gambar_list.append(g.filename)
                    
        nama_video = ""
        if video and video.filename:
            file_location = f"uploads/{video.filename}"
            with open(file_location, "wb+") as file_object:
                file_object.write(video.file.read())
            nama_video = video.filename
            
        manager.tambah_paket_baru(tipe, id_paket, nama_paket, destinasi, harga, kuota, nama_gambar_list, nama_video, diskon)
        return {"message": "Paket berhasil ditambahkan."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/pesan")
def pesan_paket(req: PesanRequest):
    try:
        booking = manager.buat_pesanan(
            req.id_paket, req.nama_peserta, req.jumlah_orang, 
            req.tanggal_berangkat, req.transportasi, req.kode_promo, req.tipe_pesanan, req.tipe_kamar_pilihan
        )
        return booking
    except (KuotaPenuhError, JadwalPerjalananBentrokError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/booking/count")
def get_booking_count():
    # Menghitung jumlah booking untuk notifikasi (hanya yang sudah dibayar/dipesan)
    return {"count": len(manager.daftar_booking)}

@app.post("/bayar")
def bayar_paket(req: BayarRequest):
    try:
        hasil = manager.proses_pembayaran(req.id_booking, req.jumlah_bayar)
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
