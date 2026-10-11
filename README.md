# FACTORYON Sales Site

공장·물류창고 매물 안내와 관리자 승인형 Q&A 게시판을 제공하는 Vite 사이트입니다.

## 폴더 구조

```text
frontend/             Vite 프런트엔드 및 관리자 화면
supabase/migrations/  데이터베이스 테이블과 RLS 정책
```

## 로컬 실행

`frontend/.env.example`을 `frontend/.env.local`로 복사해 Supabase 공개 연결값을
입력한 뒤 실행합니다.

```powershell
cd frontend
npm install
npm run dev
```

자세한 Supabase 및 Vercel 설정은 `SUPABASE_SETUP.md`를 참고하세요.
