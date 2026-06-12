import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
      <main className="flex flex-col gap-6 items-center max-w-2xl">
        <h1 className="text-5xl font-extrabold tracking-tight text-blue-600 sm:text-7xl">
          SMM Panel
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300 sm:text-xl">
          The ultimate platform to automate, manage, and scale your social media presence.
        </p>
        <div className="flex gap-4 mt-6">
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 text-white px-6 py-3 text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-lg border border-slate-300 bg-transparent px-6 py-3 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 transition-colors"
          >
            Create Account
          </Link>
        </div>
      </main>
    </div>
  );
}