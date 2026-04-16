import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const name = String(form.get("name") || "").slice(0, 200);
  const email = String(form.get("email") || "").slice(0, 200);
  const company = String(form.get("company") || "").slice(0, 200);
  const message = String(form.get("message") || "").slice(0, 5000);

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[contact] RESEND_API_KEY not set — logging submission");
    console.log({ name, email, company, message });
  } else {
    const resend = new Resend(key);
    await resend.emails.send({
      from: "SponsorWatch <noreply@sponsorwatch.co.uk>",
      to: "andrew@twocores.com",
      subject: `SponsorWatch contact: ${name}`,
      replyTo: email,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        company ? `Company: ${company}` : "",
        "",
        message,
      ]
        .filter(Boolean)
        .join("\n"),
    });
  }

  return NextResponse.redirect(new URL("/contact/thanks", req.url), 303);
}
