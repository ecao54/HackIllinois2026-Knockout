import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PenguinSvg from '../components/PenguinSvg';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    try {
      await login(trimmed);
      navigate('/dashboard');
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Login failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <PenguinSvg size={80} color="blue" className="mx-auto mb-4 animate-float" />
          <h1 className="text-3xl font-bold text-slate-heading">Welcome Back</h1>
          <p className="text-slate-muted mt-2">Log in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-ice-200 rounded-2xl p-6 space-y-5 shadow-sm">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-heading mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="coolpenguin42"
              autoComplete="username"
              className="w-full px-4 py-3 rounded-xl bg-ice-50 border border-ice-200
                         text-slate-heading placeholder:text-slate-muted/50 focus:outline-none
                         focus:ring-2 focus:ring-ice-400/40 focus:border-ice-400/40
                         transition-all"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full py-3.5 rounded-xl bg-ice-500 hover:bg-ice-600
                       text-white font-bold text-lg transition-all duration-150
                       hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50
                       disabled:cursor-not-allowed cursor-pointer shadow-md shadow-ice-200"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Logging in...
              </span>
            ) : (
              'Log In'
            )}
          </button>

          <p className="text-center text-slate-muted text-sm">
            Don't have an account?{' '}
            <Link to="/signup" className="text-penguin-orange hover:text-orange-600 font-medium">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
