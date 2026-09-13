import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const MAX_FILES = 3;
const MAX_TOTAL_FILE_SIZE = 10 * 1024 * 1024;
const DEFAULT_RECIPIENT = 'frank.wilson.incall@gmail.com';

export const runtime = 'nodejs';

const escapeHtml = (value: string) =>
  value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] ?? character);

const isAcceptedFile = (file: File) =>
  file.type === 'application/pdf' || file.type.startsWith('image/');

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    return NextResponse.json({ error: 'Email delivery is not configured.' }, { status: 503 });
  }

  try {
    const formData = await request.formData();
    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const phone = String(formData.get('phone') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();
    const files = formData.getAll('files').filter((entry): entry is File => typeof entry !== 'string');

    if (!name || (!email && !phone)) {
      return NextResponse.json({ error: 'A name and email or phone number are required.' }, { status: 400 });
    }
    if (!files.length || files.length > MAX_FILES) {
      return NextResponse.json({ error: 'Attach between 1 and 3 files.' }, { status: 400 });
    }
    if (files.some((file) => !isAcceptedFile(file))) {
      return NextResponse.json({ error: 'Attachments must be images or PDFs.' }, { status: 400 });
    }
    if (files.reduce((total, file) => total + file.size, 0) > MAX_TOTAL_FILE_SIZE) {
      return NextResponse.json({ error: 'Attachments must be 10 MB or less in total.' }, { status: 400 });
    }

    const attachments = await Promise.all(
      files.map(async (file) => ({
        filename: file.name,
        content: Buffer.from(await file.arrayBuffer()),
      })),
    );

    const recipients = (process.env.RESEND_TO_EMAIL ?? DEFAULT_RECIPIENT)
      .split(',')
      .map((address) => address.trim())
      .filter((address) => address.includes('@'));
    if (!recipients.length) {
      return NextResponse.json({ error: 'Email delivery is not configured.' }, { status: 503 });
    }

    const resend = new Resend(apiKey);
    const payload = {
      from,
      to: recipients,
      replyTo: email || undefined,
      subject: `New XLIT customization request from ${name}`,
      text: [
        'New XLIT customization request',
        `Name: ${name}`,
        `Email: ${email || 'Not provided'}`,
        `Phone: ${phone || 'Not provided'}`,
        `Description: ${description || 'Not provided'}`,
        `Files: ${files.map((file) => file.name).join(', ')}`,
      ].join('\n\n'),
      html: `
        <h1>New XLIT customization request</h1>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email || 'Not provided')}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone || 'Not provided')}</p>
        <p><strong>Description:</strong><br>${escapeHtml(description || 'Not provided').replace(/\n/g, '<br>')}</p>
        <p><strong>Files:</strong> ${files.map((file) => escapeHtml(file.name)).join(', ')}</p>
      `,
      attachments,
    };

    let data: { id: string } | null = null;
    let error: { message: string } | null = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const result = await resend.emails.send(payload);
      data = result.data;
      error = result.error;
      if (!error || !/could not be resolved|unable to fetch data/i.test(error.message)) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      delivered: recipients,
      id: data?.id,
    });
  } catch {
    return NextResponse.json({ error: 'The request could not be submitted. Please try again.' }, { status: 500 });
  }
}
