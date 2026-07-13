const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};

function checkAdminAccess() {
  if (!token || (user.role !== 'admin' && user.role !== 'instructor')) {
    alert('Akses Ditolak. Halaman ini hanya untuk Pengajar/Admin.');
    window.location.href = '/dashboard.html';
  }
}

async function loadManagedClasses() {
  const container = document.getElementById('managedClassesGrid');
  if (!container) return;

  try {
    const res = await fetch('/api/v1/classes/managed', { headers });
    const json = await res.json();

    if (!json.success) throw new Error(json.error?.message);

    if (json.data.length === 0) {
      container.innerHTML = `<p>Kamu belum memiliki/mengelola kelas apapun.</p>`;
      return;
    }

    let html = '';
    json.data.forEach(cls => {
      html += `
        <div class="card">
          <span class="badge badge-yellow" style="margin-bottom: 8px;">Milikmu</span>
          <h3>${cls.name}</h3>
          <p style="margin-bottom: 8px;">${cls.description || 'Tidak ada deskripsi'}</p>
          <div style="display: flex; gap: 12px; margin-bottom: 16px; font-size: 14px;">
            <span>👥 ${cls._count.enrollments} Siswa</span>
            <span>📚 ${cls._count.materials} Materi</span>
          </div>
          <a href="/admin-class.html?id=${cls.id}" class="btn btn-primary" style="width: 100%; text-align: center;">Kelola Kelas</a>
        </div>
      `;
    });
    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = `<p style="color: red;">Gagal memuat kelas.</p>`;
  }
}

async function createClass(e) {
  e.preventDefault();
  const name = document.getElementById('classNameInput').value;
  const description = document.getElementById('classDescInput').value;

  try {
    const res = await fetch('/api/v1/classes', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name, description })
    });
    const json = await res.json();

    if (json.success) {
      alert('Kelas berhasil dibuat!');
      window.location.reload();
    } else {
      alert(`Gagal: ${json.error.message}`);
    }
  } catch (error) {
    alert('Terjadi kesalahan server.');
  }
}

async function loadClassDetailsAndMaterials(classId) {
  try {
    const res = await fetch(`/api/v1/classes/${classId}`, { headers });
    const json = await res.json();

    if (!json.success) throw new Error(json.error?.message);

    const cls = json.data;
    document.getElementById('className').innerText = cls.name;
    document.getElementById('classDesc').innerText = cls.description || 'Tidak ada deskripsi';

    const materialContainer = document.getElementById('materialList');
    if (cls.materials.length === 0) {
      materialContainer.innerHTML = `<p>Belum ada materi untuk kelas ini.</p>`;
      return;
    }

    let materialHtml = '';
    cls.materials.forEach((mat, index) => {
      let icon = '📄';
      if (mat.type === 'video') icon = '🎬';
      else if (mat.type === 'link') icon = '🔗';

      materialHtml += `
        <div class="material-item">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 24px;">${icon}</span>
            <div>
              <h3 style="font-size: 16px; margin-bottom: 4px;">${index + 1}. ${mat.title}</h3>
              <span class="badge badge-pink" style="font-size: 12px;">${mat.type}</span>
            </div>
          </div>
          <a href="${mat.url}" target="_blank" class="btn btn-secondary" style="padding: 6px 12px; font-size: 14px;">Buka</a>
        </div>
      `;
    });
    materialContainer.innerHTML = materialHtml;

  } catch (error) {
    document.getElementById('className').innerText = "Gagal memuat detail kelas";
  }
}

async function loadClassMembers(classId) {
  const container = document.getElementById('memberList');
  try {
    const res = await fetch(`/api/v1/classes/${classId}/members`, { headers });
    const json = await res.json();

    if (!json.success) throw new Error(json.error?.message);

    if (json.data.length === 0) {
      container.innerHTML = `<p>Belum ada siswa yang mendaftar.</p>`;
      return;
    }

    let html = '';
    json.data.forEach((member, index) => {
      const date = new Date(member.enrolled_at).toLocaleDateString('id-ID');
      html += `
        <li style="padding: 12px; border: 2px solid var(--jet-black); display: flex; justify-content: space-between;">
          <div>
            <strong>${index + 1}. ${member.full_name}</strong><br>
            <span style="font-size: 14px; color: #555;">NIM: ${member.nim} | ${member.email}</span>
          </div>
          <div style="font-size: 12px; text-align: right;">
            Bergabung:<br>${date}
          </div>
        </li>
      `;
    });
    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = `<p style="color: red;">Gagal memuat daftar siswa.</p>`;
  }
}

async function addMaterial(e, classId) {
  e.preventDefault();
  const title = document.getElementById('matTitle').value;
  const url = document.getElementById('matUrl').value;
  const type = document.getElementById('matType').value;

  try {
    const res = await fetch(`/api/v1/classes/${classId}/materials`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title, url, type })
    });
    const json = await res.json();

    if (json.success) {
      alert('Materi berhasil ditambahkan!');
      window.location.reload();
    } else {
      alert(`Gagal: ${json.error.message}`);
    }
  } catch (error) {
    alert('Terjadi kesalahan server.');
  }
}
