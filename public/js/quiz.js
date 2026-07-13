const token = localStorage.getItem('token');
if (!token) window.location.href = '/login.html';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const quizId = urlParams.get('id');
  if (!quizId) {
    document.getElementById('quizTitle').innerText = "Invalid Quiz";
    return;
  }

  loadQuiz(quizId);

  document.getElementById('quizSubmitForm').addEventListener('submit', (e) => submitQuizAttempt(e, quizId));
});

let loadedQuestions = [];

async function loadQuiz(quizId) {
  try {
    const res = await fetch(`/api/v1/quizzes/${quizId}`, { headers });
    const json = await res.json();

    if (!json.success) throw new Error(json.error?.message);

    const quiz = json.data;
    loadedQuestions = quiz.questions;
    
    document.getElementById('quizNavTitle').innerText = quiz.title;
    document.getElementById('quizTitle').innerText = quiz.title;
    document.getElementById('quizMeta').innerText = `${quiz.questions.length} Questions`;

    const container = document.getElementById('questionsContainer');
    let html = '';

    quiz.questions.forEach((q, index) => {
      let optionsHtml = '';
      q.options.forEach((opt, optIndex) => {
        optionsHtml += `
          <label class="option-label">
            <input type="radio" name="q_${q.id}" value="${opt}" required>
            ${opt}
          </label>
        `;
      });

      html += `
        <div class="question-block">
          <div class="question-text">${index + 1}. ${q.question_text}</div>
          <div>${optionsHtml}</div>
        </div>
      `;
    });

    container.innerHTML = html;
    document.getElementById('submitBtn').style.display = 'block';

  } catch (error) {
    document.getElementById('quizTitle').innerText = "Failed to load quiz";
    document.getElementById('questionsContainer').innerHTML = "";
  }
}

async function submitQuizAttempt(e, quizId) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const answers = {};

  loadedQuestions.forEach(q => {
    answers[q.id] = formData.get(`q_${q.id}`);
  });

  document.getElementById('submitBtn').disabled = true;
  document.getElementById('submitBtn').innerText = 'Submitting...';

  try {
    const res = await fetch(`/api/v1/quizzes/${quizId}/submit`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ answers })
    });
    const json = await res.json();

    if (json.success) {
      document.getElementById('quizSubmitForm').style.display = 'none';
      document.getElementById('quizHeader').style.display = 'none';
      
      const resultContainer = document.getElementById('resultContainer');
      resultContainer.style.display = 'block';
      document.getElementById('resultScore').innerText = `${json.data.score}%`;
    } else {
      alert(json.error?.message || 'Failed to submit quiz');
      document.getElementById('submitBtn').disabled = false;
      document.getElementById('submitBtn').innerText = 'Submit Quiz';
    }
  } catch (error) {
    alert('Server error');
    document.getElementById('submitBtn').disabled = false;
    document.getElementById('submitBtn').innerText = 'Submit Quiz';
  }
}
