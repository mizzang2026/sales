import { supabase, supabaseConfigured } from './supabase.js';

const unitToggle = document.querySelector('#unitToggle');

unitToggle?.addEventListener('click', () => {
  const showPyeong = !unitToggle.classList.contains('on');
  unitToggle.classList.toggle('on', showPyeong);
  unitToggle.setAttribute('aria-pressed', String(showPyeong));
  document.querySelectorAll('[data-sqm]').forEach((element) => {
    element.textContent = showPyeong ? element.dataset.py : element.dataset.sqm;
  });
});

document.querySelector('#contactForm')?.addEventListener('submit', (event) => {
  event.preventDefault();
  event.currentTarget.querySelector('.form-message').textContent =
    '상담 요청이 접수되었습니다. 담당자가 확인 후 연락드리겠습니다.';
  event.currentTarget.reset();
});

const qnaForm = document.querySelector('#qnaForm');
const qnaList = document.querySelector('#qnaList');
const qnaEmpty = document.querySelector('#qnaEmpty');
const qnaCount = document.querySelector('#qnaCount');
const submitButton = qnaForm?.querySelector('.qna-submit');
const message = qnaForm?.querySelector('.qna-message');
const db = supabaseConfigured ? supabase : null;

function setMessage(text, isError = false) {
  if (!message) return;
  message.textContent = text;
  message.classList.toggle('error', isError);
}

function formatDate(value) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date(value));
}

function renderQuestions(questions) {
  qnaCount.textContent = `${questions.length}개의 질문`;
  qnaEmpty.classList.toggle('hidden', questions.length > 0);
  qnaList.replaceChildren(...questions.map((question) => {
    const item = document.createElement('details');
    item.className = 'qna-item';
    const summary = document.createElement('summary');
    const status = document.createElement('span');
    status.className = 'qna-status';
    status.textContent = '답변 대기';
    const title = document.createElement('span');
    title.className = 'qna-title';
    title.textContent = question.title;
    const meta = document.createElement('span');
    meta.className = 'qna-meta';
    meta.textContent = `${question.author} · ${formatDate(question.created_at)}`;
    summary.append(status, title, meta);
    const content = document.createElement('p');
    content.className = 'qna-content';
    content.textContent = question.content;
    item.append(summary, content);
    return item;
  }));
}

async function loadQuestions() {
  if (!db) {
    setMessage('게시판 데이터베이스 연결 준비 중입니다.', true);
    return;
  }
  const { data, error } = await db
    .from('qna_questions')
    .select('id, author, title, content, created_at')
    .eq('status', 'approved')
    .eq('is_private', false)
    .order('created_at', { ascending: false });
  if (error) {
    setMessage('질문 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.', true);
    return;
  }
  renderQuestions(data || []);
}

qnaForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!db) {
    setMessage('게시판 데이터베이스 연결 준비 중입니다.', true);
    return;
  }
  const formData = new FormData(qnaForm);
  if (String(formData.get('website') || '').trim()) return;
  const lastSubmittedAt = Number(localStorage.getItem('factoryon-qna-last-submit') || 0);
  if (Date.now() - lastSubmittedAt < 60000) {
    setMessage('질문은 1분에 한 번 등록할 수 있습니다.', true);
    return;
  }
  submitButton.disabled = true;
  setMessage('질문을 등록하고 있습니다.');
  const { error } = await db.from('qna_questions').insert({
    author: String(formData.get('author')).trim(),
    title: String(formData.get('title')).trim(),
    content: String(formData.get('content')).trim(),
    is_private: formData.get('isPrivate') === 'on'
  });
  submitButton.disabled = false;
  if (error) {
    setMessage('등록하지 못했습니다. 내용을 확인한 후 다시 시도해 주세요.', true);
    return;
  }
  localStorage.setItem('factoryon-qna-last-submit', String(Date.now()));
  qnaForm.reset();
  setMessage('질문이 등록되었습니다. 관리자 확인 후 공개됩니다.');
});

loadQuestions();
