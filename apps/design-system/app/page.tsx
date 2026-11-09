import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-frost px-6 py-20 text-primary">
      <div className="mx-auto max-w-5xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em]">REVREBEL Client Tools</p>
        <h1 className="max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl">Design System</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8">
          Shared foundations, components, interaction patterns, and implementation guidance for the Client Tools platform.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link className="border-2 border-primary bg-primary px-5 py-3 font-semibold text-white" href="/docs">
            Open documentation
          </Link>
          <a className="border-2 border-primary px-5 py-3 font-semibold" href="https://github.com/REVREBEL/client-tools">
            View repository
          </a>
        </div>
      </div>
    </main>
  );
}
