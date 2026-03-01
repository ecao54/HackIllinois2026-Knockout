import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PenguinSvg from './PenguinSvg';

export default function Navbar() {
  const { account, balance, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-ice-200/60 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <PenguinSvg size={28} color="orange" />
          <span className="font-bold text-slate-heading group-hover:text-ice-600 transition-colors">
            Penguin <span className="text-penguin-orange">KO</span>
          </span>
        </Link>

        {account ? (
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 bg-ice-50 hover:bg-ice-100 border border-ice-200
                         rounded-full px-4 py-1.5 transition-colors"
            >
              <span className="text-xs text-slate-muted">Balance</span>
              <span className="font-bold text-penguin-orange text-sm">
                ${balance?.usdc_balance?.toFixed(2) ?? '—'}
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="text-sm text-slate-heading hover:text-ice-600 transition-colors font-medium"
              >
                {account.displayName}
              </Link>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="text-xs text-slate-muted hover:text-red-500 transition-colors cursor-pointer"
              >
                Log out
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-slate-heading hover:text-ice-600 transition-colors font-medium"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="text-sm bg-penguin-orange hover:bg-orange-600 text-white
                         px-4 py-1.5 rounded-full font-medium transition-colors"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
