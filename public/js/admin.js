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
        <a href="/admin-class.html?id=${cls.id}" class="course-card">
          <img class="course-card-img" src="https://via.placeholder.com/400x225/E2E8F0/1C1D1F?text=${encodeURIComponent(cls.name)}" alt="Course">
          <div class="course-card-body">
            <div class="course-card-title">${cls.name}</div>
            <div class="course-card-instructor" style="margin-bottom: 4px;">${cls.description || 'No description'}</div>
            <div class="course-card-metrics">Manage Course &middot; ${cls._count.enrollments} Students</div>
          </div>
        </a>
      `;
    });
    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = `<p style="color: red;">Failed to load courses.</p>`;
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

// -----------------------------------------
// QUIZ CREATION LOGIC
// -----------------------------------------
let questionCount = 0;

document.addEventListener('DOMContentLoaded', () => {
  const addQuestionBtn = document.getElementById('addQuestionBtn');
  if (addQuestionBtn) {
    addQuestionBtn.addEventListener('click', addQuestionField);
    addQuestionField(); // Add first question by default
  }

  const quizForm = document.getElementById('quizForm');
  if (quizForm) {
    quizForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const urlParams = new URLSearchParams(window.location.search);
      const classId = urlParams.get('id');
      await submitQuiz(classId);
    });
  }

  const showQuizBtn = document.getElementById('showQuizFormBtn');
  if (showQuizBtn) {
    showQuizBtn.addEventListener('click', () => {
      const container = document.getElementById('quizFormContainer');
      container.style.display = container.style.display === 'none' ? 'block' : 'none';
    });
  }
});

function addQuestionField() {
  questionCount++;
  const container = document.getElementById('questionsContainer');
  const div = document.createElement('div');
  div.style.marginBottom = '24px';
  div.style.padding = '16px';
  div.style.backgroundColor = 'white';
  div.style.border = '1px solid var(--udemy-border)';
  
  div.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 8px;">Question ${questionCount}</div>
    <div class="form-group">
      <input type="text" class="form-control q-text" placeholder="Enter question..." required>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
      <input type="text" class="form-control q-opt" placeholder="Option A" required>
      <input type="text" class="form-control q-opt" placeholder="Option B" required>
      <input type="text" class="form-control q-opt" placeholder="Option C" required>
      <input type="text" class="form-control q-opt" placeholder="Option D" required>
    </div>
    <div class="form-group">
      <label>Correct Answer (Must exactly match one option above)</label>
      <input type="text" class="form-control q-correct" placeholder="Type the exact correct option" required>
    </div>
  `;
  container.appendChild(div);
}

async function submitQuiz(classId) {
  const title = document.getElementById('quizTitle').value;
  const questions = [];
  
  const questionBlocks = document.getElementById('questionsContainer').children;
  for (let block of questionBlocks) {
    const qText = block.querySelector('.q-text').value;
    const opts = Array.from(block.querySelectorAll('.q-opt')).map(input => input.value);
    const correct = block.querySelector('.q-correct').value;
    
    if (!opts.includes(correct)) {
      alert(`Correct answer "${correct}" must exactly match one of the options for question: ${qText}`);
      return;
    }

    questions.push({
      question_text: qText,
      options: opts,
      correct_answer: correct
    });
  }

  try {
    const res = await fetch('/api/v1/quizzes', {
      method: 'POST',
      headers,
      body: JSON.stringify({ classId, title, questions })
    });
    const json = await res.json();
    
    if (json.success) {
      alert('Quiz created successfully!');
      window.location.reload();
    } else {
      alert(json.error?.message || 'Failed to create quiz');
    }
  } catch (err) {
    alert('Internal server error');
  }
}
