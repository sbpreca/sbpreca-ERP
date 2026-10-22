# send-doc-mail

발주서·거래명세표 PDF를 네이버 SMTP로 발송합니다.

## 배포

```bash
supabase functions deploy send-doc-mail --project-ref hmaemfokkkodcmwfzpov
```

## 시크릿 (발신 계정별 네이버 SMTP 비밀번호)

네이버 메일 → 환경설정 → POP3/IMAP 설정에서 SMTP 사용을 켠 뒤,
2단계 인증이 있으면 **애플리케이션 비밀번호**를 발급해 등록합니다.

```bash
supabase secrets set NAVER_SMTP_PASS_FLYINGEJ='이은진계정비밀번호'
supabase secrets set NAVER_SMTP_PASS_OKEHKIM='김은희계정비밀번호'
```

- `flyingej@naver.com` → `NAVER_SMTP_PASS_FLYINGEJ`
- `okehkim@naver.com` → `NAVER_SMTP_PASS_OKEHKIM`

발신인으로 고른 주소가 From / Reply-To 가 되므로, 거래처 회신도 그 주소로 갑니다.
