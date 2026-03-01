import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PenguinSvg from '../components/PenguinSvg';

const STEPS = [
  { num: '1', title: 'Create an account', desc: 'Sign up in seconds — no downloads, no hassle.' },
  { num: '2', title: 'Fund & play', desc: 'Add money with your card and jump into a match.' },
  { num: '3', title: 'Win the pot', desc: 'Last penguin standing takes home all the wagered money.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const { account } = useAuth();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 pt-16 pb-8 relative overflow-hidden">
        {/* Floating ice chunks background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-xl"
              style={{
                width: `${30 + Math.random() * 50}px`,
                height: `${30 + Math.random() * 50}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: i % 2 === 0
                  ? 'linear-gradient(135deg, rgba(186,230,253,0.4), rgba(224,242,254,0.2))'
                  : 'linear-gradient(135deg, rgba(147,197,253,0.3), rgba(191,219,254,0.15))',
                animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <div className="animate-float mb-6">
            <PenguinSvg size={120} color="orange" />
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4">
            <span className="text-ice-600">Penguin</span>{' '}
            <span className="text-penguin-orange">Knockout</span>
          </h1>

          <p className="text-xl md:text-2xl text-ice-700 font-medium mb-8">
            Bet. Survive. Win.
          </p>

          <p className="text-slate-body text-lg mb-10 max-w-lg mx-auto">
            A last-penguin-standing game on crumbling ice. Wager real money,
            outmaneuver your opponents, and take home the entire pot.
          </p>

          <button
            onClick={() => navigate(account ? '/lobby' : '/signup')}
            className="inline-flex items-center gap-3 bg-penguin-orange hover:bg-orange-600
                       text-white font-bold text-xl px-10 py-4 rounded-2xl
                       transition-all duration-200 animate-pulse-glow
                       hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-orange-200"
          >
            {account ? 'Play Now' : 'Get Started'}
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 pb-20 pt-8">
        <h2 className="text-center text-2xl font-bold text-slate-heading mb-10">How it works</h2>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((step) => (
            <div
              key={step.num}
              className="bg-white border border-ice-200 rounded-2xl p-6 text-center
                         shadow-sm hover:shadow-md hover:border-ice-300 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-full bg-penguin-orange/10 text-penguin-orange
                              font-bold text-xl flex items-center justify-center mx-auto mb-4">
                {step.num}
              </div>
              <h3 className="font-semibold text-lg text-slate-heading mb-2">{step.title}</h3>
              <p className="text-slate-muted text-sm">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-slate-muted text-sm border-t border-ice-200/60">
        Penguin Knockout &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
