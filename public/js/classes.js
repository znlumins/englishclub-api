const token = localStorage.getItem('token');
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};

// Fungsi Load My Classes (Dashboard)
async function loadMyClasses() {
  const container = document.getElementById('myClassesGrid');
  if (!container) return;

  try {
    const res = await fetch('/api/v1/classes/my', { headers });
    const json = await res.json();

    if (!json.success) throw new Error(json.error?.message);

    if (json.data.length === 0) {
      container.innerHTML = `<p>Kamu belum mengikuti kelas apapun.</p>`;
      return;
    }

    let html = '';
    json.data.forEach(cls => {
      html += `
        <div class="card">
          <span class="badge badge-pink" style="margin-bottom: 8px;">KELAS</span>
          <h3>${cls.name}</h3>
          <p style="margin-bottom: 16px;">Pengajar: ${cls.instructor.full_name}</p>
          <a href="/class-detail.html?id=${cls.id}" class="btn btn-primary" style="width: 100%; text-align: center;">Masuk Kelas</a>
        </div>
      `;
    });
    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = `<p style="color: red;">Gagal memuat kelas.</p>`;
  }
}

// Fungsi Load Semua Kelas (Katalog)
async function loadAllClasses() {
  const container = document.getElementById('allClassesGrid');
  if (!container) return;

  try {
    const res = await fetch('/api/v1/classes', { headers });
    const json = await res.json();

    if (!json.success) throw new Error(json.error?.message);

    if (json.data.length === 0) {
      container.innerHTML = `<p>Belum ada kelas yang tersedia.</p>`;
      return;
    }

    let html = '';
    json.data.forEach(cls => {
      html += `
        <div class="card">
          <span class="badge badge-blue" style="margin-bottom: 8px;">TERSEDIA</span>
          <h3>${cls.name}</h3>
          <p style="margin-bottom: 8px;">${cls.description || 'Tidak ada deskripsi'}</p>
          <p style="margin-bottom: 16px; font-size: 14px;">Pengajar: ${cls.instructor.full_name}</p>
          <p style="margin-bottom: 16px; font-size: 14px;"><strong>${cls._count.enrollments}</strong> member telah bergabung</p>
          <button onclick="enrollClass('${cls.id}')" class="btn btn-success" style="width: 100%;">Daftar Kelas</button>
        </div>
      `;
    });
    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = `<p style="color: red;">Gagal memuat katalog kelas.</p>`;
  }
}

// Fungsi Enroll
async function enrollClass(classId) {
  if (!confirm('Apakah kamu yakin ingin mendaftar ke kelas ini?')) return;

  try {
    const res = await fetch(`/api/v1/classes/${classId}/enroll`, {
      method: 'POST',
      headers
    });
    const json = await res.json();

    if (json.success) {
      alert('Berhasil mendaftar ke kelas!');
      window.location.href = '/dashboard.html';
    } else {
      alert(`Gagal: ${json.error.message}`);
    }
  } catch (error) {
    alert('Terjadi kesalahan pada server.');
  }
}

// Fungsi Load Detail Kelas (Materi)
async function loadClassDetail(classId) {
  try {
    const res = await fetch(`/api/v1/classes/${classId}`, { headers });
    const json = await res.json();

    if (!json.success) throw new Error(json.error?.message);

    const cls = json.data;
    document.getElementById('className').innerText = cls.name;
    document.getElementById('classDesc').innerText = cls.description || 'Tidak ada deskripsi';
    document.getElementById('classInstructor').innerText = cls.instructor.full_name;

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
              <h3 style="font-size: 18px; margin-bottom: 4px;">Materi ${index + 1}: ${mat.title}</h3>
              <span class="badge badge-pink">${mat.type}</span>
            </div>
          </div>
          <a href="${mat.url}" target="_blank" class="btn btn-primary">Buka Materi</a>
        </div>
      `;
    });
    materialContainer.innerHTML = materialHtml;

  } catch (error) {
    document.getElementById('className').innerText = "Gagal memuat detail kelas";
  }
}
