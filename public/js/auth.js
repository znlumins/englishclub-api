// Menangani formulir Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('errorMessage');
    
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Simpan token
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('user', JSON.stringify(result.data.user));
        
        // Redirect berdasarkan status atau role
        if (result.data.user.status === 'pending') {
            alert('Login berhasil, namun akun Anda masih menunggu persetujuan admin.');
        }
        window.location.href = '/'; // Arahkan ke dashboard nanti
      } else {
        errorMsg.style.display = 'block';
        errorMsg.innerText = result.error.message;
      }
    } catch (err) {
      errorMsg.style.display = 'block';
      errorMsg.innerText = 'Terjadi kesalahan pada server.';
    }
  });
}

// Menangani formulir Register
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const full_name = document.getElementById('full_name').value;
    const nim = document.getElementById('nim').value;
    const email = document.getElementById('email').value;
    const program_studi = document.getElementById('program_studi').value;
    const angkatan = document.getElementById('angkatan').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;
    
    const errorMsg = document.getElementById('errorMessage');
    const successMsg = document.getElementById('successMessage');
    
    errorMsg.style.display = 'none';
    successMsg.style.display = 'none';
    
    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name, nim, email, program_studi, angkatan, phone, password
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        successMsg.style.display = 'block';
        successMsg.innerText = result.message;
        registerForm.reset();
      } else {
        errorMsg.style.display = 'block';
        errorMsg.innerText = result.error.message;
      }
    } catch (err) {
      errorMsg.style.display = 'block';
      errorMsg.innerText = 'Terjadi kesalahan pada server.';
    }
  });
}
