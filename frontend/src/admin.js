import { supabase as db, supabaseConfigured } from './supabase.js';

const loginPanel = document.querySelector('#loginPanel');
const loginForm = document.querySelector('#loginForm');
const loginMessage = document.querySelector('#loginMessage');
const dashboard = document.querySelector('#dashboard');
const dashboardMessage = document.querySelector('#dashboardMessage');
const logoutButton = document.querySelector('#logoutButton');
const questionList = document.querySelector('#adminQuestionList');
const empty = document.querySelector('#adminEmpty');
let currentStatus = 'pending';

function showMessage(element, text, isError = false) {
  element.textContent = text;
  element.classList.toggle('error', isError);
}

function dateTime(value) {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function renderQuestions(questions) {
  empty.hidden = questions.length > 0;
  questionList.replaceChildren(...questions.map((question) => {
    const card = document.createElement('article');
    card.className = 'admin-question';
    const head = document.createElement('div');
    head.className = 'question-head';
    const info = document.createElement('div');
    const title = document.createElement('h2');
    title.textContent = question.title;
    const meta = document.createElement('p');
    meta.className = 'question-meta';
    meta.textContent = `${question.author} · ${dateTime(question.created_at)} · ${question.status}`;
    info.append(title, meta);
    const badge = document.createElement('span');
    badge.className = `badge${question.is_private ? ' private' : ''}`;
    badge.textContent = question.is_private ? '비공개' : '공개';
    head.append(info, badge);
    const content = document.createElement('p');
    content.className = 'question-content';
    content.textContent = question.content;
    const actions = document.createElement('div');
    actions.className = 'question-actions';
    actions.append(
      actionButton('승인', 'approved', question.id),
      actionButton('거절', 'rejected', question.id, 'reject'),
      actionButton('삭제', 'delete', question.id, 'delete')
    );
    card.append(head, content, actions);
    return card;
  }));
}

function actionButton(label, action, id, className = '') {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.className = className;
  button.addEventListener('click', () => changeQuestion(id, action));
  return button;
}

async function loadQuestions() {
  showMessage(dashboardMessage, '불러오는 중입니다.');
  let query = db.from('qna_questions').select('*').order('created_at', { ascending: false });
  if (currentStatus !== 'all') query = query.eq('status', currentStatus);
  const { data, error } = await query;
  if (error) {
    showMessage(dashboardMessage, '관리자 권한이 없거나 목록을 불러오지 못했습니다.', true);
    renderQuestions([]);
    return;
  }
  showMessage(dashboardMessage, `${data.length}개의 질문`);
  renderQuestions(data);
}

async function changeQuestion(id, action) {
  if (action === 'delete') {
    if (!window.confirm('이 질문을 완전히 삭제할까요?')) return;
    const { error } = await db.from('qna_questions').delete().eq('id', id);
    if (error) return showMessage(dashboardMessage, '삭제하지 못했습니다.', true);
  } else {
    const { error } = await db.from('qna_questions').update({
      status: action,
      approved_at: action === 'approved' ? new Date().toISOString() : null
    }).eq('id', id);
    if (error) return showMessage(dashboardMessage, '상태를 변경하지 못했습니다.', true);
  }
  await loadQuestions();
}

function showDashboard(signedIn) {
  loginPanel.hidden = signedIn;
  dashboard.hidden = !signedIn;
  logoutButton.hidden = !signedIn;
  if (signedIn) loadQuestions();
}

async function enterAdminDashboard() {
  const { data, error } = await db.from('qna_admins').select('user_id').limit(1);
  if (error || !data?.length) {
    await db.auth.signOut();
    showDashboard(false);
    showMessage(loginMessage, '이 계정은 게시판 관리자로 등록되어 있지 않습니다.', true);
    return;
  }
  showDashboard(true);
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!supabaseConfigured) return showMessage(loginMessage, 'Supabase 연결값을 먼저 설정해 주세요.', true);
  const data = new FormData(loginForm);
  showMessage(loginMessage, '로그인 중입니다.');
  const { error } = await db.auth.signInWithPassword({
    email: String(data.get('email')).trim(),
    password: String(data.get('password'))
  });
  if (error) return showMessage(loginMessage, '이메일 또는 비밀번호를 확인해 주세요.', true);
  loginForm.reset();
  await enterAdminDashboard();
});

logoutButton.addEventListener('click', async () => {
  await db.auth.signOut();
  showDashboard(false);
});

document.querySelectorAll('[data-status]').forEach((button) => {
  button.addEventListener('click', () => {
    currentStatus = button.dataset.status;
    document.querySelectorAll('[data-status]').forEach((item) => item.classList.toggle('active', item === button));
    loadQuestions();
  });
});

(async () => {
  if (!supabaseConfigured) return showMessage(loginMessage, 'Supabase 연결값을 먼저 설정해 주세요.', true);
  const { data } = await db.auth.getSession();
  if (data.session) await enterAdminDashboard();
})();
