import uvicorn

if __name__ == "__main__":
    print("==========================================================")
    print("🚀 TRAVELNUSA PRODUCTION SERVER & PWA ANDROID DEPLOYMENT")
    print("==========================================================")
    print("1. Server API & Web Backend : http://localhost:8000")
    print("2. Halaman Customer PWA     : http://localhost:8000/frontend/customer.html")
    print("3. Halaman Admin Dashboard  : http://localhost:8000/frontend/index.html")
    print("4. Status PWA & Offline Cache: AKTIF (sw.js & manifest.json)")
    print("==========================================================")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
