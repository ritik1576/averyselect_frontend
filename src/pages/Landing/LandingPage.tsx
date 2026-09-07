import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Code2, BrainCircuit, ShieldCheck, GitPullRequest, Search, LineChart } from 'lucide-react';
import './LandingPage.css';

const PerspectiveCard = ({ icon, title, desc, delay }: { icon: React.ReactNode, title: string, desc: string, delay: number }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      style={{ perspective: 1000, position: 'relative' }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
    >
      <motion.div
        className="lp-feature-card"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div className="lp-feature-icon" style={{ transform: "translateZ(40px)" }}>{icon}</div>
        <h3 className="lp-feature-title" style={{ transform: "translateZ(30px)" }}>{title}</h3>
        <p className="lp-feature-desc" style={{ transform: "translateZ(20px)" }}>{desc}</p>
      </motion.div>
    </motion.div>
  );
};
export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleNavigate = (path: string) => {
    setIsExiting(true);
    setTimeout(() => {
      navigate(path);
    }, 400); // 400ms fade out transition
  };

  // Autoplay robustness
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.play().catch(() => {});

    const interval = setInterval(() => {
      if (video.paused) { video.muted = true; video.play().catch(() => {}); }
      else clearInterval(interval);
    }, 1000);

    const unlock = () => { video.muted = true; video.play().catch(() => {}); };
    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true });

    return () => {
      clearInterval(interval);
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
    };
  }, []);

  // Close menu on landscape resize
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth / window.innerHeight > 1.1) setMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div 
      className={`lp-stage${menuOpen ? ' lp-stage--open' : ''}`}
      style={{ opacity: isExiting ? 0 : 1, transition: 'opacity 0.4s ease-out' }}
    >

      {/* VIDEO PLATE */}
      <div className="lp-plate">
        <video
          ref={videoRef}
          className="lp-plate-video"
          autoPlay muted loop playsInline preload="auto"
          aria-hidden="true"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260808_112712_da9d53df-6d27-4b12-bdf6-aa9dc2622bdf.mp4"
            type="video/mp4"
          />
        </video>
      </div>

      {/* TOPBAR */}
      <header className="lp-topbar">
        {/* Brand mark */}
        <button
          className="lp-brand"
          aria-label="AverySelect Home"
          onClick={() => window.scrollTo(0, 0)}
        >
          <svg viewBox="0 0 31.5 48.5" fill="none" xmlns="http://www.w3.org/2000/svg" className="lp-brand-icon">
            <defs>
              <linearGradient id="lp-bg1" x1="8" y1="0" x2="34.1" y2="28.9" gradientUnits="userSpaceOnUse">
                <stop offset="0"   stopColor="#c94018"/>
                <stop offset=".28" stopColor="#d94820"/>
                <stop offset=".34" stopColor="#d44220"/>
                <stop offset=".40" stopColor="#8b2a10"/>
                <stop offset=".55" stopColor="#932e14"/>
                <stop offset=".60" stopColor="#c03820"/>
                <stop offset=".68" stopColor="#d04422"/>
                <stop offset=".80" stopColor="#e05030"/>
                <stop offset=".95" stopColor="#f06040"/>
                <stop offset="1"   stopColor="#f47050"/>
              </linearGradient>
            </defs>
            <path d="M21.5 0 L21.5 19.5 L31.5 19.5 L31.5 29 L10 48.5 L10 28.5 L0.5 28.5 L0.5 18.5 Z" fill="url(#lp-bg1)"/>
            <rect x="0.5" y="18.5" width="9" height="10" fill="#ff6040"/>
            <rect x="22" y="19.5" width="9.5" height="9.5" fill="#ff6040"/>
          </svg>
          <span className="lp-brand-text">AverySelect</span>
        </button>

        {/* Desktop nav */}
        <nav className="lp-links" aria-label="Primary">
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <a href="#faq">FAQ</a>
          <a href="#contact">Contact</a>
        </nav>

        {/* Desktop header CTA */}
        <button className="lp-pill-nav" onClick={() => handleNavigate('/register')}>
          <span>Get Started</span>
        </button>

        {/* Mobile burger */}
        <button
          className="lp-burger"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(v => !v)}
        >
          <i /><i />
        </button>
      </header>

      {/* MOBILE MENU */}
      <nav className="lp-menu" aria-hidden={!menuOpen} aria-label="Mobile navigation">
        <div className="lp-menu-inner">
          <p className="lp-menu-eyebrow">Menu</p>
          <ul className="lp-menu-list">
            {['About', 'Features', 'FAQ', 'Contact'].map(item => (
              <li key={item}>
                <a href={`#${item.toLowerCase()}`} onClick={() => setMenuOpen(false)}>{item}</a>
              </li>
            ))}
          </ul>
          <div className="lp-menu-foot">
            <button className="lp-menu-foot-pill" onClick={() => { setMenuOpen(false); handleNavigate('/register'); }}>
              Get Started
            </button>
            <button className="lp-menu-foot-ghost" onClick={() => { setMenuOpen(false); handleNavigate('/login'); }}>
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* HERO COPY */}
      <main className="lp-hero" aria-label="Hero">
        <h1 className="lp-headline">
          <span>The Next Layer </span>
          <span>of Technical <span style={{ color: 'var(--lp-accent)', display: 'inline' }}>Intelligence</span></span>
        </h1>
        <p className="lp-sub">
          <span>A unified assessment platform to help teams hire, evaluate, </span>
          <span>and scale engineering talent with confidence.</span>
        </p>
        <div className="lp-actions">
          <button className="lp-pill-cta" onClick={() => handleNavigate('/register')}>
            <span>Get Started</span>
          </button>
          <button className="lp-ghost" onClick={() => handleNavigate('/login')}>
            Sign In
          </button>
        </div>
      </main>

      {/* PARTNER LOGOS */}
      <div className="lp-logos" role="list" aria-label="Trusted by">

        <div className="lp-lg lp-lg1" role="listitem">
          <svg viewBox="0 0 30 31" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <mask id="lp-m1">
                <rect width="30" height="31" fill="white"/>
                <circle cx="19.5" cy="10.5" r="5.1" fill="black"/>
              </mask>
            </defs>
            <rect x="1" y="1" width="28" height="29" rx="2" stroke="currentColor" strokeWidth="2" mask="url(#lp-m1)"/>
            <circle cx="19.5" cy="10.5" r="4.1" stroke="currentColor" strokeWidth="1.8"/>
          </svg>
          <span className="lp-lg-word">Accenture</span>
        </div>

        <div className="lp-lg lp-lg2" role="listitem">
          <svg viewBox="0 0 25 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="5" height="28" rx="2.5" fill="currentColor"/>
            <path d="M8 15 A7 7 0 1 1 8 14.9" stroke="currentColor" strokeWidth="2" fill="none"/>
          </svg>
          <span className="lp-lg-word">Infosys<span className="lp-dot"/></span>
        </div>

        <div className="lp-lg lp-lg3" role="listitem">
          <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="14" cy="14" r="12.35" stroke="currentColor" strokeWidth="3.1"/>
            <path d="M6 10 Q14 6 22 10" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <path d="M6 18 Q14 22 22 18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
          </svg>
          <span className="lp-lg-word">TechMahindra</span>
        </div>

        <div className="lp-lg lp-lg4" role="listitem">
          <svg viewBox="0 0 28 25.5" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 12 Q7 2 14 8 Q21 14 28 4" fill="currentColor" opacity=".35"/>
            <path d="M0 12 Q7 2 14 8 Q21 14 28 4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <path d="M0 18 Q7 10 14 15 Q21 20 28 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <path d="M0 23.5 Q7 16 14 21 Q21 26 28 19" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
          </svg>
          <span className="lp-lg-word">HCL</span>
        </div>

      </div>

      {/* ── NEW SECTIONS ── */}
      
      {/* FEATURES SECTION */}
      <section id="features" className="lp-features-section">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="lp-section-title">The Complete Technical Intelligence Platform</h2>
        </motion.div>

        <div className="lp-features-grid">
          <PerspectiveCard
            icon={<Code2 size={24} />}
            title="Interactive Code Environments"
            desc="Evaluate candidates in real-world scenarios with our in-browser IDE supporting multiple languages, full syntax highlighting, and live code execution."
            delay={0.1}
          />
          <PerspectiveCard
            icon={<BrainCircuit size={24} />}
            title="AI-Powered Evaluation"
            desc="Go beyond simple test cases. Our AI engine evaluates code quality, time complexity, and logical approach to give deep insights into developer skill."
            delay={0.2}
          />
          <PerspectiveCard
            icon={<ShieldCheck size={24} />}
            title="Plagiarism & Anti-Cheating"
            desc="Maintain assessment integrity with advanced plagiarism detection, tab-switch monitoring, and full keystroke playback of the candidate's session."
            delay={0.3}
          />
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="about" className="lp-how-it-works">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="lp-section-title">How It Works</h2>
        </motion.div>

        <div className="lp-steps-container">
          {[
            {
              icon: <GitPullRequest size={32} className="lp-accent" />,
              title: "1. Create Assessments",
              desc: "Build custom tests using our extensive question library, or create your own coding, free-text, and multiple-choice questions."
            },
            {
              icon: <Search size={32} className="lp-accent" />,
              title: "2. Candidates Take the Test",
              desc: "Candidates complete the assessment in a state-of-the-art secure environment designed for a fantastic developer experience."
            },
            {
              icon: <LineChart size={32} className="lp-accent" />,
              title: "3. Review Deep Insights",
              desc: "Get an instant, detailed breakdown of their performance, including an AI-generated summary of their coding style and logic."
            }
          ].map((step, idx) => (
            <motion.div 
              key={idx}
              className="lp-step"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
            >
              <div className="lp-step-number">{idx + 1}</div>
              <div className="lp-step-content">
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="lp-footer-cta">Ready to scale your engineering team?</h2>
          <button className="lp-pill-cta" onClick={() => handleNavigate('/register')} style={{ margin: '0 auto' }}>
            <span>Start Hiring Smarter</span>
          </button>
        </motion.div>

        <div className="lp-footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact Support</a>
        </div>
      </footer>

    </div>
  );
};
