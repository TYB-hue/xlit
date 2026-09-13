'use client';

import { ChangeEvent, DragEvent, FormEvent, useRef, useState } from 'react';
import Reveal from './Reveal';

const MAX_FILES = 3;
const MAX_TOTAL_FILE_SIZE = 10 * 1024 * 1024;
const FORMSUBMIT_EMAIL =
  process.env.NEXT_PUBLIC_FORMSUBMIT_EMAIL ?? 'ahmed.pruo@gmail.com';

type StoredFile = {
  id: string;
  file: File;
};

type Submission = {
  name: string;
  email: string;
  phone: string;
  description: string;
  files: StoredFile[];
};

const readableFileSize = (bytes: number) => {
  const megabytes = bytes / 1024 / 1024;
  return `${megabytes >= 10 ? megabytes.toFixed(0) : megabytes.toFixed(1)} MB`;
};

const isAcceptedFile = (file: File) =>
  file.type === 'application/pdf' || file.type.startsWith('image/');

export default function CustomizeUpload() {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [message, setMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState('');
  const [submission, setSubmission] = useState<Submission | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (incomingFiles: File[]) => {
    const availableSlots = MAX_FILES - files.length;
    const errors: string[] = [];
    let remainingBytes =
      MAX_TOTAL_FILE_SIZE - files.reduce((total, storedFile) => total + storedFile.file.size, 0);

    if (availableSlots <= 0) {
      setMessage('You can upload a maximum of 3 files. Remove a file before adding another.');
      return;
    }

    const acceptedFiles: File[] = [];
    for (const file of incomingFiles) {
      if (acceptedFiles.length === availableSlots) {
        errors.push(`Only ${MAX_FILES} files can be stored.`);
        break;
      }
      if (!isAcceptedFile(file)) {
        errors.push(`${file.name} is not an image or PDF.`);
        continue;
      }
      if (file.size > remainingBytes) {
        errors.push(`${file.name} could not upload because files together must stay under 10 MB.`);
        continue;
      }
      acceptedFiles.push(file);
      remainingBytes -= file.size;
    }

    if (acceptedFiles.length) {
      setFiles((current) => [
        ...current,
        ...acceptedFiles.map((file) => ({ id: crypto.randomUUID(), file })),
      ]);
    }

    setMessage(
      errors.length
        ? errors.join(' ')
        : `${acceptedFiles.length} file${acceptedFiles.length === 1 ? '' : 's'} uploaded successfully and stored for this session.`,
    );
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const phone = String(formData.get('phone') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();

    if (!files.length) {
      setFormMessage('Add at least one image or PDF before submitting your request.');
      return;
    }
    if (!name || (!email && !phone)) {
      setFormMessage('Enter your name and at least one contact method: email or phone number.');
      return;
    }

    const requestData = new FormData();
    requestData.append('_subject', `New XLIT customization request from ${name}`);
    requestData.append('_template', 'table');
    requestData.append('_captcha', 'false');
    if (email) requestData.append('_replyto', email);
    requestData.append('Name', name);
    requestData.append('Email', email || 'Not provided');
    requestData.append('Phone', phone || 'Not provided');
    requestData.append('message', description || 'Not provided');
    requestData.append('Description', description || 'Not provided');
    requestData.append('Files', files.map(({ file }) => file.name).join(', '));
    files.forEach(({ file }, index) => {
      const fieldName = index === 0 ? 'attachment' : `attachment${index + 1}`;
      requestData.append(fieldName, file, file.name);
    });

    setIsSubmitting(true);
    setFormMessage('');
    try {
      const response = await fetch(
        `https://formsubmit.co/ajax/${encodeURIComponent(FORMSUBMIT_EMAIL)}`,
        {
          method: 'POST',
          body: requestData,
          headers: { Accept: 'application/json' },
        },
      );
      const result = await response.json().catch(() => ({}));
      const submitted = result.success === true || result.success === 'true';
      if (!response.ok || !submitted) {
        setFormMessage(
          result.message ?? result.error ?? 'The form could not be submitted. Please try again.',
        );
        return;
      }

      setSubmission({ name, email, phone, description, files });
      setFiles([]);
      setMessage('');
      setFormMessage('Your form has been submitted successfully.');
      form.reset();
    } catch {
      setFormMessage('The form could not be submitted. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-10 lg:py-20">
      <Reveal>
      <div className="relative overflow-hidden rounded-3xl border border-stroke bg-card px-6 py-10 sm:px-10 lg:grid lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-16 lg:py-16">
        <div className="relative z-10">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-lime">Custom, made real</p>
          <h1 className="font-display mt-5 max-w-xl text-4xl font-light leading-tight tracking-[-0.04em] text-ink sm:text-5xl lg:text-6xl">
            Have a design in mind? Let&apos;s put it on a real piece.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-inkdim sm:text-lg">
            Send us your artwork, reference images, or a sketch. XLIT will review your idea and turn it into a custom product, printed for you with care.
          </p>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-inkdim">
            <span><span className="mr-2 text-lime">01</span>Share your idea</span>
            <span><span className="mr-2 text-lime">02</span>We make it real</span>
          </div>
        </div>
        <div className="relative mt-10 flex min-h-64 items-end justify-center lg:mt-0 lg:min-h-[390px]">
          <div className="absolute inset-x-8 bottom-0 h-4/5 rounded-t-[4rem] bg-lime/10 blur-3xl" aria-hidden="true" />
          <img
            src="/products/custom-shirt.png"
            alt="Custom T-shirt ready for your design"
            className="relative z-10 max-h-[390px] w-auto object-contain drop-shadow-2xl"
          />
        </div>
      </div>
      </Reveal>

      <Reveal className="mx-auto mt-16 max-w-3xl delay-100">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-lime">Start your custom order</p>
        <h2 className="font-display mt-5 text-4xl font-light tracking-[-0.04em] text-ink sm:text-5xl">
          Upload your references.
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-inkdim sm:text-lg">
          Add up to three images or PDFs. FormSubmit allows 10 MB total across all files. Your files stay here until you submit.
        </p>
      </Reveal>

      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept="image/*,application/pdf"
        multiple
        onChange={handleInput}
      />

      <Reveal className="mx-auto mt-10 max-w-3xl delay-150">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`cursor-pointer rounded-2xl border border-dashed p-10 text-center transition-colors sm:p-14 ${
          isDragging ? 'border-lime bg-lime/10' : 'border-stroke bg-card/70 hover:border-inkdim'
        }`}
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-cardmuted shadow-sm">
          <svg
            className="h-6 w-6 text-ink"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 13v8" />
            <path d="m16 17-4-4-4 4" />
            <path d="M20.4 18.4A5 5 0 0 0 18 9.1 7 7 0 0 0 4.1 10.4 4.5 4.5 0 0 0 5.5 19H7" />
          </svg>
        </span>
        <p className="mt-5 text-lg font-medium text-ink">
          <span className="text-lime">Click to upload</span>
          <span className="text-inkdim"> or drag and drop</span>
        </p>
        <p className="mt-2 text-sm text-inkdim">PNG, JPG or PDF (max. 10 MB total)</p>
      </div>
      </Reveal>

      {message && (
        <p className={`mx-auto mt-5 max-w-3xl rounded-xl border px-4 py-3 text-sm ${message.includes('could not') || message.includes('maximum') || message.includes('not an') ? 'border-red-400/40 bg-red-400/10 text-red-200' : 'border-lime/40 bg-lime/10 text-lime'}`}>
          {message}
        </p>
      )}

      {files.length > 0 && (
        <ul className="mx-auto mt-6 max-w-3xl space-y-3" aria-label="Uploaded files">
          {files.map(({ id, file }) => (
            <li key={id} className="flex items-center gap-4 rounded-xl border border-stroke bg-card px-4 py-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cardmuted text-xs font-semibold text-lime">
                {file.type === 'application/pdf' ? 'PDF' : 'IMG'}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">{file.name}</span>
                <span className="block text-xs text-inkdim">{readableFileSize(file.size)} · Stored successfully</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setFiles((current) => current.filter((storedFile) => storedFile.id !== id));
                  setMessage('');
                }}
                className="rounded-lg px-3 py-2 text-sm text-inkdim transition-colors hover:bg-white/10 hover:text-ink"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <Reveal className="mx-auto mt-12 max-w-3xl delay-150">
      <form onSubmit={handleSubmit} className="border-t border-stroke pt-10">
        <h2 className="font-display text-3xl font-light tracking-[-0.03em] text-ink">Tell us about your idea.</h2>
        <p className="mt-3 text-sm leading-relaxed text-inkdim">Name and one contact method are required. Your description is optional.</p>

        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-ink">
            Name
            <input
              name="name"
              required
              autoComplete="name"
              className="mt-2 w-full rounded-xl border border-stroke bg-card px-4 py-3 text-base text-ink outline-none transition-colors placeholder:text-inkdim focus:border-lime"
              placeholder="Your name"
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              className="mt-2 w-full rounded-xl border border-stroke bg-card px-4 py-3 text-base text-ink outline-none transition-colors placeholder:text-inkdim focus:border-lime"
              placeholder="you@example.com"
            />
          </label>
          <label className="block text-sm font-medium text-ink sm:col-span-2">
            Phone number
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              className="mt-2 w-full rounded-xl border border-stroke bg-card px-4 py-3 text-base text-ink outline-none transition-colors placeholder:text-inkdim focus:border-lime"
              placeholder="Your phone number"
            />
          </label>
        </div>

        <label className="mt-5 block text-sm font-medium text-ink">
          Description <span className="font-normal text-inkdim">(optional)</span>
          <textarea
            name="description"
            rows={5}
            className="mt-2 w-full resize-y rounded-xl border border-stroke bg-card px-4 py-3 text-base text-ink outline-none transition-colors placeholder:text-inkdim focus:border-lime"
            placeholder="Tell us what you would like to create."
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-7 rounded-lg bg-lime px-6 py-3 text-sm font-medium text-bg transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Submitting…' : 'Submit request'}
        </button>
      </form>
      </Reveal>

      {formMessage && (
        <p className={`mx-auto mt-5 max-w-3xl rounded-xl border px-4 py-3 text-sm ${formMessage.includes('successfully') ? 'border-lime/40 bg-lime/10 text-lime' : 'border-red-400/40 bg-red-400/10 text-red-200'}`}>
          {formMessage}
        </p>
      )}

      {submission && (
        <section className="mx-auto mt-6 max-w-3xl rounded-2xl border border-lime/30 bg-lime/5 p-5" aria-label="Created customization request">
          <h2 className="text-base font-medium text-ink">Customization request ready</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-inkdim">Name</dt><dd className="mt-1 text-ink">{submission.name}</dd></div>
            <div><dt className="text-inkdim">Contact</dt><dd className="mt-1 text-ink">{submission.email || submission.phone}</dd></div>
            {submission.description && <div className="sm:col-span-2"><dt className="text-inkdim">Description</dt><dd className="mt-1 text-ink">{submission.description}</dd></div>}
            <div className="sm:col-span-2"><dt className="text-inkdim">Files</dt><dd className="mt-1 text-ink">{submission.files.map(({ file }) => file.name).join(', ')}</dd></div>
          </dl>
        </section>
      )}
    </section>
  );
}
