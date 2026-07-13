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
        <a href="/class-detail.html?id=${cls.id}" class="course-card">
          <img class="course-card-img" src="https://via.placeholder.com/400x225/E2E8F0/1C1D1F?text=${encodeURIComponent(cls.name)}" alt="Course">
          <div class="course-card-body">
            <div class="course-card-title">${cls.name}</div>
            <div class="course-card-instructor">${cls.instructor.full_name}</div>
            <div class="course-card-metrics">View Course</div>
          </div>
        </a>
      `;
    });
    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = `<p style="color: red;">Failed to load courses.</p>`;
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
      container.innerHTML = `<p>No courses available.</p>`;
      return;
    }

    let html = '';
    json.data.forEach(cls => {
      html += `
        <div class="course-card">
          <img class="course-card-img" src="https://via.placeholder.com/400x225/E2E8F0/1C1D1F?text=${encodeURIComponent(cls.name)}" alt="Course">
          <div class="course-card-body">
            <div class="course-card-title">${cls.name}</div>
            <div class="course-card-instructor" style="margin-bottom: 4px;">${cls.description || 'No description'}</div>
            <div class="course-card-instructor">${cls.instructor.full_name}</div>
            <div class="course-card-metrics" style="margin-bottom: 12px; font-weight: normal;">${cls._count.enrollments} students enrolled</div>
            <button onclick="enrollClass('${cls.id}')" class="btn btn-primary" style="width: 100%; margin-top: auto;">Enroll Now</button>
          </div>
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
    document.getElementById('classDesc').innerText = cls.description || 'No description provided.';
    document.getElementById('classInstructor').innerText = cls.instructor.full_name;

    const materialContainer = document.getElementById('materialList');
    if (cls.materials.length === 0) {
      materialContainer.innerHTML = `<p style="padding: 16px;">No materials available yet.</p>`;
      return;
    }

    let materialHtml = '';
    cls.materials.forEach((mat, index) => {
      let icon = '📄';
      if (mat.type === 'video') icon = '🎬';
      else if (mat.type === 'link') icon = '🔗';

      materialHtml += `
        <a href="${mat.url}" target="_blank" class="material-item" style="color: var(--udemy-dark);">
          <div style="display: flex; align-items: center;">
            <span class="material-icon">${icon}</span>
            <div>
              <div style="font-size: 16px; font-weight: 700;">Section ${index + 1}: ${mat.title}</div>
              <div style="font-size: 12px; color: var(--udemy-gray-text); margin-top: 4px;">${mat.type.toUpperCase()}</div>
            </div>
          </div>
        </a>
      `;
    });
    materialContainer.innerHTML = materialHtml;

  } catch (error) {
    document.getElementById('className').innerText = "Failed to load class details";
  }
}

async function loadClassQuizzes(classId) {
  try {
    const res = await fetch(`/api/v1/quizzes/class/${classId}`, { headers });
    const json = await res.json();
    
    if (!json.success) return;

    const quizContainer = document.getElementById('quizList');
    if (json.data.length === 0) {
      quizContainer.innerHTML = `<p style="padding: 16px;">No quizzes available.</p>`;
      return;
    }

    let quizHtml = '';
    json.data.forEach((quiz, index) => {
      let statusHtml = '';
      if (quiz.attempts && quiz.attempts.length > 0) {
        statusHtml = `<span style="color: #1A7B5F; font-weight: 700;">Score: ${quiz.attempts[0].score}/100</span>`;
      } else {
        statusHtml = `<span style="color: var(--udemy-gray-text);">Not Attempted</span>`;
      }

      quizHtml += `
        <a href="/quiz.html?id=${quiz.id}" class="material-item" style="color: var(--udemy-dark);">
          <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
            <div style="display: flex; align-items: center;">
              <span class="material-icon">📝</span>
              <div>
                <div style="font-size: 16px; font-weight: 700;">Quiz ${index + 1}: ${quiz.title}</div>
                <div style="font-size: 12px; color: var(--udemy-gray-text); margin-top: 4px;">${quiz._count.questions} Questions</div>
              </div>
            </div>
            <div>${statusHtml}</div>
          </div>
        </a>
      `;
    });
    quizContainer.innerHTML = quizHtml;
  } catch (error) {
    console.error('Failed to load quizzes');
  }
}
