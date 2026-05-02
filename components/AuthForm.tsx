import { signUp, logIn } from "@/app/actions/auth";

export function AuthForm({ mode, error }: { mode: "login" | "signup"; error?: string }) {
  const isSignup = mode === "signup";
  return (
    <form action={isSignup ? signUp : logIn} className="card mx-auto w-full max-w-md space-y-4">
      <input type="hidden" name="origin" value={process.env.NEXT_PUBLIC_SITE_URL ?? ""} />
      <div>
        <h1 className="text-2xl font-bold">{isSignup ? "Create your account" : "Welcome back"}</h1>
        <p className="mt-1 text-sm text-slate-600">Use Supabase Auth for secure session management. Passwords are never stored by this app.</p>
      </div>
      {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-urgent">{error}</p> : null}
      {isSignup ? (
        <div className="space-y-1">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" required />
        </div>
      ) : null}
      <div className="space-y-1">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-1">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} minLength={8} required />
      </div>
      <button className="btn-primary w-full" type="submit">{isSignup ? "Sign Up" : "Log In"}</button>
    </form>
  );
}
