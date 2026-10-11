# Supabase 게시판 연결

현재 코드는 다음 흐름으로 구성되어 있습니다.

- 방문자는 회원가입 없이 질문을 등록합니다.
- 새 질문은 항상 `pending`(승인 대기)으로 저장됩니다.
- 공개 질문은 관리자가 승인한 글만 메인 페이지에 표시됩니다.
- 비공개 질문은 승인 여부와 관계없이 일반 방문자에게 노출되지 않습니다.
- 관리자는 `admin.html`에서 로그인해 승인, 거절, 삭제할 수 있습니다.

## 1. Supabase 프로젝트 만들기

Supabase Dashboard에서 새 프로젝트를 만듭니다.

## 2. 테이블과 보안 정책 만들기

SQL Editor에서 `supabase/migrations/20261011000000_create_qna.sql` 전체를 실행합니다.

## 3. 관리자 계정 등록

1. Authentication > Users에서 이메일/비밀번호 방식으로 관리자 사용자를 만듭니다.
2. 생성된 사용자의 UUID를 복사합니다.
3. SQL Editor에서 아래 문장을 UUID에 맞게 실행합니다.

```sql
insert into public.qna_admins (user_id)
values ('관리자-사용자-UUID');
```

## 4. 사이트 연결값 넣기

Project Settings > API에서 Project URL과 Publishable key를 복사합니다.
`frontend/.env.example`을 `frontend/.env.local`로 복사한 뒤 실제 값을 입력합니다.
구형 프로젝트라면 Publishable key 대신 `anon` key를 사용할 수 있습니다.

```env
VITE_SUPABASE_URL=https://프로젝트.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

`.env.local`은 Git에서 제외됩니다. `service_role` 또는 secret key는 브라우저용
환경변수에 절대로 넣지 않습니다.

## 5. 로컬 실행

```powershell
cd frontend
npm install
npm run dev
```

터미널에 표시된 로컬 주소로 접속합니다. 관리자 화면은 `/admin.html`입니다.

## 6. Vercel 배포

Vercel에서 GitHub 저장소를 연결하고 아래처럼 설정합니다.

- Root Directory: `frontend`
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`

## 7. 관리자 화면

배포된 사이트의 `/admin.html`에 접속해 3단계에서 만든 계정으로 로그인합니다.

## 스팸 방지 수준

현재 숨은 입력칸(허니팟), 글자 수 제한, 브라우저 기준 1분 등록 제한이 적용됩니다.
실제 광고성 등록이 늘면 Cloudflare Turnstile과 Supabase Edge Function을 추가해
서버에서 CAPTCHA와 IP별 요청 빈도를 검증하는 것이 좋습니다.
