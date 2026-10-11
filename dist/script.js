const unitToggle = document.querySelector('#unitToggle');

unitToggle.addEventListener('click', () => {
  const showPyeong = !unitToggle.classList.contains('on');
  unitToggle.classList.toggle('on', showPyeong);
  unitToggle.setAttribute('aria-pressed', String(showPyeong));
  document.querySelectorAll('[data-sqm]').forEach((element) => {
    element.textContent = showPyeong ? element.dataset.py : element.dataset.sqm;
  });
});

document.querySelector('#contactForm').addEventListener('submit', (event) => {
  event.preventDefault();
  event.currentTarget.querySelector('.form-message').textContent =
    '상담 요청이 접수되었습니다. 담당자가 확인 후 연락드리겠습니다.';
  event.currentTarget.reset();
});

const storageKey = 'factoryon-qna-items';
const qnaForm = document.querySelector('#qnaForm');
const qnaList = document.querySelector('#qnaList');
const qnaEmpty = document.querySelector('#qnaEmpty');
const qnaCount = document.querySelector('#qnaCount');

function loadQuestions() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch {
    return [];
  }
}

function escapeHtml(value) {
  const container = document.createElement('div');
  container.textContent = value;
  return container.innerHTML;
}

function renderQuestions() {
  const questions = loadQuestions();
  qnaCount.textContent = `${questions.length}개의 질문`;
  qnaEmpty.classList.toggle('hidden', questions.length > 0);
  qnaList.innerHTML = questions.map((question) => `
    <details class="qna-item">
      <summary>
        <span class="qna-status">답변대기</span>
        <span class="qna-title">${question.isPrivate ? '🔒 ' : ''}${escapeHtml(question.title)}</span>
        <span class="qna-meta">${escapeHtml(question.author)} · ${question.date}</span>
      </summary>
      <p class="qna-content">${escapeHtml(question.content)}</p>
    </details>
  `).join('');
}

qnaForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(qnaForm);
  const questions = loadQuestions();
  questions.unshift({
    author: String(data.get('author')).trim(),
    title: String(data.get('title')).trim(),
    content: String(data.get('content')).trim(),
    isPrivate: data.get('isPrivate') === 'on',
    date: new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date())
  });
  localStorage.setItem(storageKey, JSON.stringify(questions));
  qnaForm.reset();
  qnaForm.querySelector('.qna-message').textContent = '질문이 등록되었습니다.';
  renderQuestions();
});

renderQuestions();
