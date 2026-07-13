const token = localStorage.getItem('token');
if (!token) window.location.href = '/login.html';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};

document.addEventListener('DOMContentLoaded', async () => {
  await loadProfile();

  document.getElementById('showEditBtn').addEventListener('click', () => {
    const form = document.getElementById('editProfileFormContainer');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('editProfileForm').addEventListener('submit', updateProfile);
});

async function loadProfile() {
  try {
    const res = await fetch('/api/v1/auth/me', { headers });
    const json = await res.json();
    
    if (json.success) {
      const user = json.data;
      document.getElementById('profileName').innerText = user.full_name;
      document.getElementById('profileNim').innerText = `NIM: ${user.nim}`;
      document.getElementById('profilePoints').innerText = user.points || 0;
      document.getElementById('profileStreak').innerText = `${user.streak_days || 0} Hari`;
      
      document.getElementById('bioInput').value = user.bio || '';
      document.getElementById('phoneInput').value = user.phone || '';
      document.getElementById('prodiInput').value = user.program_studi || '';
    } else {
      alert('Gagal memuat profil');
    }
  } catch (err) {
    console.error(err);
  }
}

async function updateProfile(e) {
  e.preventDefault();
  const bio = document.getElementById('bioInput').value;
  const phone = document.getElementById('phoneInput').value;
  const program_studi = document.getElementById('prodiInput').value;

  try {
    const res = await fetch('/api/v1/auth/me', {
      method: 'PUT',
      headers,
      body: JSON.stringify({ bio, phone, program_studi })
    });
    const json = await res.json();
    
    if (json.success) {
      alert('Profil berhasil diperbarui!');
      document.getElementById('editProfileFormContainer').style.display = 'none';
      await loadProfile();
    } else {
      alert(`Gagal: ${json.error.message}`);
    }
  } catch (err) {
    alert('Terjadi kesalahan.');
  }
}
