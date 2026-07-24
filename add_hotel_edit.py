import os

# 1. Update backend/booking_manager.py
with open("backend/booking_manager.py", "r", encoding="utf-8") as f:
    content_bm = f.read()

if "def edit_hotel" not in content_bm:
    new_method = """
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
"""
    # Insert before class ends or just append to end of class methods
    # We can just append it before `def daftar_transportasi(self):` property if we want, or at the end
    # Better: just append it at the end of the file since it's all in the class, right?
    # No, python indentation matters. Let's find "def hapus_hotel("
    idx = content_bm.find("def hapus_hotel")
    if idx != -1:
        end_idx = content_bm.find("def ", idx + 10)
        content_bm = content_bm[:end_idx] + new_method + content_bm[end_idx:]
    with open("backend/booking_manager.py", "w", encoding="utf-8") as f:
        f.write(content_bm)


# 2. Update main.py
with open("main.py", "r", encoding="utf-8") as f:
    content_main = f.read()

if "@app.put(\"/hotel/{id_hotel}\")" not in content_main:
    new_route = """
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
"""
    idx = content_main.find("def hapus_hotel")
    if idx != -1:
        end_idx = content_main.find("@app", idx + 10)
        content_main = content_main[:end_idx] + new_route + content_main[end_idx:]
    with open("main.py", "w", encoding="utf-8") as f:
        f.write(content_main)


# 3. Update frontend/app.js
with open("frontend/app.js", "r", encoding="utf-8") as f:
    content_js = f.read()

if "window.bukaEditHotel = async" not in content_js:
    # Add JS logic
    js_logic = """
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
"""
    content_js += js_logic

# Also modify loadHotel table rendering to include Edit button
if 'onclick="bukaEditHotel' not in content_js:
    old_btn = """<button onclick="hapusHotel('${h.id_hotel}')" style="background:#ef4444; padding:5px 10px; font-size:0.8rem;">Hapus</button>"""
    new_btn = """<div style="display:flex; gap:5px;">
                        <button onclick="bukaEditHotel('${h.id_hotel}')" class="btn" style="background:#3b82f6; padding:5px 10px; font-size:0.8rem; width:auto; margin:0;">Edit</button>
                        <button onclick="hapusHotel('${h.id_hotel}')" style="background:#ef4444; padding:5px 10px; font-size:0.8rem; width:auto; margin:0;">Hapus</button>
                    </div>"""
    content_js = content_js.replace(old_btn, new_btn)

with open("frontend/app.js", "w", encoding="utf-8") as f:
    f.write(content_js)
