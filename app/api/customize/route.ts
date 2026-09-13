import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const MAX_FILES = 3;
const MAX_FILE_SIZE = 30 * 1024 * 1024;
const DEFAULT_RECIPIENTS = ['frank.wilson.incall@gmail.com', 'ahmed.pruo@gmail.com'];

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
  if (!apiKey) {
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
    if (files.some((file) => !isAcceptedFile(file) || file.size > MAX_FILE_SIZE)) {
      return NextResponse.json({ error: 'Attachments must be images or PDFs no larger than 30 MB.' }, { status: 400 });
    }

    const attachments = await Promise.all(
      files.map(async (file) => ({
        filename: file.name,
        content: Buffer.from(await file.arrayBuffer()),
      })),
    );

    const recipients = (process.env.RESEND_TO_EMAIL ?? DEFAULT_RECIPIENTS.join(','))
      .split(',')
      .map((address) => address.trim())
      .filter((address) => address.includes('@'));
    if (!recipients.length) {
      return NextResponse.json({ error: 'Email delivery is not configured.' }, { status: 503 });
    }

    const resend = new Resend(apiKey);
    const payload = {
      from: process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev',
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

    const results = await Promise.all(
      recipients.map(async (to) => {
        const { error } = await resend.emails.send({ ...payload, to });
        return { to, error: error?.message ?? null };
      }),
    );
    const delivered = results.filter((result) => !result.error);
    if (!delivered.length) {
      return NextResponse.json(
        { error: results.map((result) => `${result.to}: ${result.error}`).join(' ') },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      delivered: delivered.map((result) => result.to),
      failed: results.filter((result) => result.error),
    });
  } catch {
    return NextResponse.json({ error: 'The request could not be submitted. Please try again.' }, { status: 500 });
  }
}
