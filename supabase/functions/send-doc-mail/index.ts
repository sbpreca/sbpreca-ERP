import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Buffer } from "node:buffer";
import nodemailer from "npm:nodemailer@6.9.16";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_FROM = new Set(["flyingej@naver.com", "okehkim@naver.com"]);
const ADMIN_EMAILS = new Set(["flyingej@naver.com", "okehkim@naver.com"]);

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function smtpPassFor(fromEmail: string): string | undefined {
  if (fromEmail === "flyingej@naver.com") {
    return Deno.env.get("NAVER_SMTP_PASS_FLYINGEJ") || undefined;
  }
  if (fromEmail === "okehkim@naver.com") {
    return Deno.env.get("NAVER_SMTP_PASS_OKEHKIM") || undefined;
  }
  return undefined;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return json(401, { error: "로그인이 필요합니다" });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user?.email) {
      return json(401, { error: "인증에 실패했습니다" });
    }
    const caller = String(userData.user.email).toLowerCase();
    if (!ADMIN_EMAILS.has(caller)) {
      return json(403, { error: "메일 발송 권한이 없습니다" });
    }

    const payload = await req.json();
    const fromEmail = String(payload.fromEmail || "").trim().toLowerCase();
    const fromName = String(payload.fromName || "").trim();
    const toEmail = String(payload.toEmail || "").trim();
    const toName = String(payload.toName || "").trim();
    const subject = String(payload.subject || "").trim();
    const body = String(payload.body || "");
    const pdfBase64 = String(payload.pdfBase64 || "")
      .replace(/^data:application\/pdf;base64,/i, "")
      .replace(/\s+/g, "");
    // 네이버 SMTP는 한글 파일명을 자주 깨뜨리므로 ASCII만 사용
    const rawName = String(payload.filename || "document.pdf");
    const asciiBase = rawName
      .replace(/\.pdf$/i, "")
      .replace(/[^\w.\-]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "") || "document";
    const filename = `${asciiBase}.pdf`;

    if (!ALLOWED_FROM.has(fromEmail)) {
      return json(400, { error: "허용되지 않은 발신 주소입니다" });
    }
    if (!toEmail.includes("@") || !subject || !pdfBase64) {
      return json(400, { error: "수신인, 제목, PDF가 필요합니다" });
    }
    if (pdfBase64.length > 7_000_000) {
      return json(413, { error: "PDF가 너무 큽니다. 페이지 수를 줄이거나 다시 시도해 주세요" });
    }

    let pdfBuf: Buffer;
    try {
      pdfBuf = Buffer.from(pdfBase64, "base64");
    } catch {
      return json(400, { error: "PDF 데이터가 올바르지 않습니다" });
    }
    if (pdfBuf.length < 100 || pdfBuf.subarray(0, 4).toString("utf8") !== "%PDF") {
      return json(400, {
        error: `유효한 PDF 첨부가 아닙니다 (받은 크기: ${pdfBuf.length} bytes)`,
      });
    }

    const pass = smtpPassFor(fromEmail);
    if (!pass) {
      return json(503, {
        error:
          "네이버 SMTP 비밀번호가 서버에 설정되지 않았습니다. (NAVER_SMTP_PASS_FLYINGEJ / NAVER_SMTP_PASS_OKEHKIM)",
      });
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.naver.com",
      port: 465,
      secure: true,
      auth: { user: fromEmail, pass },
    });

    const displayFrom = fromName
      ? `"${fromName.replace(/"/g, "")} (상보프레카)" <${fromEmail}>`
      : `"상보프레카" <${fromEmail}>`;

    const info = await transporter.sendMail({
      from: displayFrom,
      replyTo: fromEmail,
      to: toName ? `"${toName.replace(/"/g, "")}" <${toEmail}>` : toEmail,
      subject,
      text: body || " ",
      attachments: [
        {
          filename,
          content: pdfBuf,
          contentType: "application/pdf",
          contentDisposition: "attachment",
        },
      ],
    });

    return json(200, {
      ok: true,
      from: fromEmail,
      to: toEmail,
      filename,
      bytes: pdfBuf.length,
      messageId: info.messageId || "",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("send-doc-mail error", msg);
    return json(500, { error: `메일 발송 실패: ${msg}` });
  }
});
