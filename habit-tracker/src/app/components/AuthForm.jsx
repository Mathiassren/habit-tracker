"use client";

export default function AuthForm({
  mode,
  email,
  password,
  setEmail,
  setPassword,
  loading,
  authError,
  infoMsg,
  onSubmit,
  onForgotPassword,
  onSwitchMode,
}) {
  return (
    <form onSubmit={onSubmit} className="mt-6">
      <div className="mb-4">
        <label htmlFor="email" className="block mb-2 text-sm text-gray-300">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-sm border border-gray-600 bg-transparent px-3 py-2 outline-none focus:border-purple-500"
          placeholder="you@example.com"
          autoComplete="email"
          aria-invalid={!!authError}
        />
      </div>

      <div className="mb-2">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="password" className="text-sm text-gray-300">
            Password
          </label>
          {mode === "login" && (
            <button
              type="button"
              className="text-xs underline underline-offset-4 text-gray-400 hover:text-gray-200"
              onClick={onForgotPassword}
            >
              Forgot password?
            </button>
          )}
        </div>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-sm border border-gray-600 bg-transparent px-3 py-2 outline-none focus:border-purple-500"
          placeholder={
            mode === "signup" ? "Create a strong password" : "Your password"
          }
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          aria-invalid={!!authError}
        />
      </div>

      {authError && (
        <p className="mt-3 text-sm text-red-400" role="alert">
          {authError}
        </p>
      )}
      {infoMsg && (
        <p className="mt-3 text-sm text-emerald-400" role="status">
          {infoMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white py-2 px-6 rounded-lg shadow-lg transition-transform duration-300 transform hover:scale-105 hover:bg-blue-700"
      >
        {loading
          ? mode === "login"
            ? "Logging in..."
            : "Creating account..."
          : mode === "login"
          ? "Login"
          : "Create Account"}
      </button>

      <p className="mt-4 text-sm text-gray-400">
        {mode === "login" ? (
          <>
            No account?{" "}
            <button
              type="button"
              onClick={onSwitchMode}
              className="underline underline-offset-4 hover:text-gray-200"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={onSwitchMode}
              className="underline underline-offset-4 hover:text-gray-200"
            >
              Log in
            </button>
          </>
        )}
      </p>
    </form>
  );
}
