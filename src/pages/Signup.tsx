import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PenguinSvg from '../components/PenguinSvg';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) return;

    if (trimmed.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setError('Username can only contain letters, numbers, and underscores.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signup(trimmed, displayName.trim());
      navigate('/dashboard');
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Failed to create account. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <PenguinSvg size={80} color="green" className="mx-auto mb-4 animate-float" />
          <h1 className="text-3xl font-bold text-slate-heading">Create Account</h1>
          <p className="text-slate-muted mt-2">Join the ice and start playing</p>
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
                         focus:ring-2 focus:ring-penguin-orange/40 focus:border-penguin-orange/40
                         transition-all"
            />
          </div>

          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-slate-heading mb-2">
              Display Name <span className="text-slate-muted font-normal">(optional)</span>
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Cool Penguin"
              autoComplete="name"
              className="w-full px-4 py-3 rounded-xl bg-ice-50 border border-ice-200
                         text-slate-heading placeholder:text-slate-muted/50 focus:outline-none
                         focus:ring-2 focus:ring-penguin-orange/40 focus:border-penguin-orange/40
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
            className="w-full py-3.5 rounded-xl bg-penguin-orange hover:bg-orange-600
                       text-white font-bold text-lg transition-all duration-150
                       hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50
                       disabled:cursor-not-allowed cursor-pointer shadow-md shadow-orange-200"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating account...
              </span>
            ) : (
              'Sign Up'
            )}
          </button>

          <p className="text-center text-slate-muted text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-ice-600 hover:text-ice-700 font-medium">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
