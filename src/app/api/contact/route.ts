import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const form = await request.formData();
  const name = form.get("name") as string;
  const email = form.get("email") as string;
  const company = form.get("company") as string;
  const message = form.get("message") as string;

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Log for now — add Resend or similar when ready
  console.log("[contact]", { name, email, company, message });

  return NextResponse.redirect(new URL("/contact/thanks", request.url));
}
