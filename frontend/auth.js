// auth.js - Sistem Otentikasi Frontend TravelNusa

const AUTH_KEY = 'travelnusa_user_session';

// Cek status login
function isLoggedIn() {
    return localStorage.getItem(AUTH_KEY) !== null;
}

// Mendapatkan data user yang login
function getUserData() {
    const data = localStorage.getItem(AUTH_KEY);
    return data ? JSON.parse(data) : null;
}

// Melempar ke halaman sesuai role
function redirectBasedOnRole() {
    const user = getUserData();
    if (!user) return;
    
    if (user.role === 'admin') {
        window.location.href = 'index.html';
    } else {
        window.location.href = 'customer.html';
    }
}

// Melakukan Logout
function logout() {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = 'login.html';
}

// ----- SIMULASI LOGIN (Digunakan sementara) ----- //

function simpanSesiDanRedirect(userData) {
    // Tampilkan spinner
    document.getElementById('btnSimulasiGoogle').style.display = 'none';
    document.querySelector('.btn-admin').style.display = 'none';
    document.getElementById('spinner').style.display = 'block';

    setTimeout(() => {
        localStorage.setItem(AUTH_KEY, JSON.stringify(userData));
        redirectBasedOnRole();
    }, 1500); // Simulasi delay jaringan
}

function simulasiLogin() {
    const mockUser = {
        uid: 'USR-' + Math.floor(Math.random() * 100000),
        name: 'Tamu Spesial',
        email: 'tamu@gmail.com',
        picture: 'https://ui-avatars.com/api/?name=Tamu+Spesial&background=11998e&color=fff',
        role: 'customer',
        saldo: 5000000 // Default saldo simulasi 5 Juta
    };
    simpanSesiDanRedirect(mockUser);
}

function bukaModalAdminPassword() {
    const modal = document.getElementById('modalAdminPassword');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('inputAdminPassword').value = '';
        document.getElementById('msgAdminPasswordError').style.display = 'none';
    } else {
        simulasiLoginAdmin();
    }
}

function tutupModalAdminPassword() {
    const modal = document.getElementById('modalAdminPassword');
    if (modal) modal.style.display = 'none';
}

function prosesVerifikasiAdminPassword() {
    const pwd = document.getElementById('inputAdminPassword').value.trim();
    if (pwd !== "admin123") {
        document.getElementById('msgAdminPasswordError').style.display = 'block';
        return;
    }
    tutupModalAdminPassword();
    const mockAdmin = {
        uid: 'ADM-001',
        name: 'Super Admin',
        email: 'admin@travelnusa.com',
        picture: 'https://ui-avatars.com/api/?name=Admin&background=ef4444&color=fff',
        role: 'admin'
    };
    simpanSesiDanRedirect(mockAdmin);
}

// ----- GOOGLE SIGN IN ASLI (GSI) ----- //
// Fungsi ini dipanggil otomatis oleh skrip Google jika GSI digunakan
function handleCredentialResponse(response) {
    // response.credential berisi token JWT Google
    // Di aplikasi nyata, kita mengirim token ini ke backend FastAPI untuk divalidasi
    // simulasi:
    
    const jwt = response.credential;
    const payload = JSON.parse(atob(jwt.split('.')[1]));
    
    const googleUser = {
        uid: payload.sub,
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        role: 'customer',
        saldo: 5000000
    };
    
    
    localStorage.setItem(AUTH_KEY, JSON.stringify(googleUser));
    redirectBasedOnRole();
}

// ----- PWA SERVICE WORKER REGISTRATION ----- //
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registered', reg))
            .catch(err => console.error('Service Worker registration failed', err));
    });
}
