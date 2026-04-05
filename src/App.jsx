import { useState, useEffect, createContext, useContext } from "react";
import "./App.css";

const API = "https://evoting-backend-production-dd0f.up.railway.app/api";
const AuthContext = createContext(null);
function useAuth() { return useContext(AuthContext); }

async function apiFetch(endpoint, options = {}, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

const Icon = {
  shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  lock:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  vote:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  chain:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
  chart:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  user:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  check:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
};

// ── LANDING PAGE ──────────────────────────────────────────────────────────────
function Landing({ onNavigate }) {
  return (
    <div className="landing">
      <div className="landing-bg"></div>
      <nav className="nav">
        <div className="nav-brand">{Icon.shield}<span>BlockVote</span></div>
        <div className="nav-links">
          <button onClick={() => onNavigate("login")} className="btn btn-ghost">Sign In</button>
          <button onClick={() => onNavigate("register")} className="btn btn-primary">Register</button>
        </div>
      </nav>
      <main className="hero">
        <div className="hero-badge">🔐 Blockchain Secured · Multi-Factor Auth</div>
        <h1 className="hero-title">The Future of<br/><span className="gradient-text">Democratic Voting</span></h1>
        <p className="hero-sub">Tamper-proof elections powered by blockchain technology and military-grade MFA. Every vote cryptographically secured and publicly verifiable.</p>
        <div className="hero-cta">
          <button onClick={() => onNavigate("register")} className="btn btn-primary btn-lg">{Icon.vote} Cast Your Vote</button>
          <button onClick={() => onNavigate("login")} className="btn btn-outline btn-lg">Sign In →</button>
        </div>
        <div className="feature-cards">
          {[
            { icon: Icon.chain, title: "Immutable Blockchain", desc: "Every vote recorded as a cryptographic block. Impossible to alter or delete." },
            { icon: Icon.shield, title: "Multi-Factor Auth", desc: "TOTP-based OTP via Google Authenticator for zero-trust security." },
            { icon: Icon.vote, title: "Anonymous Voting", desc: "SHA-256 hashed ballots ensure your vote is private yet verifiable." },
          ].map((f, i) => (
            <div className="feature-card" key={i}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// ── REGISTER PAGE ─────────────────────────────────────────────────────────────
function Register({ onNavigate }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", password: "", voterId: "" });
  const [qrCode, setQrCode] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg({ type: "", text: "" });
    try {
      const data = await apiFetch("/auth/register", { method: "POST", body: JSON.stringify(form) });
      setQrCode(data.qrCode);
      setStep(2);
    } catch (err) { setMsg({ type: "error", text: err.message }); }
    setLoading(false);
  };

  const handleEnableMFA = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const loginData = await apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email: form.email, password: form.password }) });
      await apiFetch("/auth/enable-mfa", { method: "POST", body: JSON.stringify({ userId: loginData.userId, token: otpCode }) });
      setMsg({ type: "success", text: "MFA enabled! Redirecting to login..." });
      setTimeout(() => onNavigate("login"), 1500);
    } catch (err) { setMsg({ type: "error", text: err.message }); }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <button className="back-btn" onClick={() => onNavigate("landing")}>← Back</button>
        <div className="auth-header">
          <div className="auth-icon">{Icon.user}</div>
          <h2>{step === 1 ? "Create Account" : "Setup Authenticator"}</h2>
          <p>{step === 1 ? "Register to participate in the election" : "Scan QR code with Google Authenticator"}</p>
        </div>
        {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
        {step === 1 ? (
          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-group">
              <label>Full Name</label>
              <input placeholder="Your full name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Voter ID</label>
              <input placeholder="e.g. VTR-2024-001" value={form.voterId} onChange={e => setForm({...form, voterId: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="Min 8 characters" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={8} />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? "Creating Account..." : "Register →"}
            </button>
            <p className="auth-link">Already have an account? <span onClick={() => onNavigate("login")}>Sign In</span></p>
          </form>
        ) : (
          <div className="mfa-setup">
            <div className="qr-container">
              <img src={qrCode} alt="QR Code" className="qr-code" />
            </div>
            <div className="mfa-steps">
              <p>1. Install <strong>Google Authenticator</strong> on your phone</p>
              <p>2. Tap + and scan the QR code above</p>
              <p>3. Enter the 6-digit code below</p>
            </div>
            <form onSubmit={handleEnableMFA} className="auth-form">
              <div className="form-group">
                <label>6-Digit OTP Code</label>
                <input className="otp-input" placeholder="000000" value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g,'').slice(0,6))}
                  maxLength={6} required />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading || otpCode.length !== 6}>
                {loading ? "Verifying..." : "Enable MFA & Complete Setup"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// ── LOGIN PAGE ────────────────────────────────────────────────────────────────
function Login({ onNavigate, onLogin }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: "", password: "" });
  const [tempToken, setTempToken] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const handleCredentials = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg({ type: "", text: "" });
    try {
      const data = await apiFetch("/auth/login", { method: "POST", body: JSON.stringify(form) });
      if (!data.mfaEnabled) {
        setMsg({ type: "error", text: "MFA not set up. Please register first." });
      } else {
        setTempToken(data.tempToken);
        setStep(2);
      }
    } catch (err) { setMsg({ type: "error", text: err.message }); }
    setLoading(false);
  };

  const handleMFA = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg({ type: "", text: "" });
    try {
      const data = await apiFetch("/auth/verify-mfa", { method: "POST", body: JSON.stringify({ tempToken, otpToken: otp }) });
      onLogin(data.token, data.user);
    } catch (err) { setMsg({ type: "error", text: err.message }); }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <button className="back-btn" onClick={() => onNavigate("landing")}>← Back</button>
        <div className="auth-header">
          <div className="auth-icon">{Icon.lock}</div>
          <h2>{step === 1 ? "Secure Login" : "OTP Verification"}</h2>
          <p>{step === 1 ? "Two-factor authentication required" : "Enter code from your authenticator app"}</p>
        </div>
        {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
        {step === 1 ? (
          <form onSubmit={handleCredentials} className="auth-form">
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="Your password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? "Verifying..." : "Continue →"}
            </button>
            <p className="auth-link">New voter? <span onClick={() => onNavigate("register")}>Register here</span></p>
          </form>
        ) : (
          <form onSubmit={handleMFA} className="auth-form">
            <div className="mfa-prompt">
              <div className="mfa-icon">🔐</div>
              <p>Open <strong>Google Authenticator</strong> and enter the 6-digit code for BlockVote</p>
            </div>
            <div className="form-group">
              <label>OTP Code</label>
              <input className="otp-input" placeholder="000000" value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
                maxLength={6} required />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading || otp.length !== 6}>
              {loading ? "Verifying..." : "Verify & Login"}
            </button>
            <button type="button" className="btn btn-ghost btn-full" onClick={() => setStep(1)}>← Back</button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function Dashboard({ onLogout }) {
  const { user, token } = useAuth();
  const [tab, setTab] = useState("vote");
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [results, setResults] = useState(null);
  const [blockchain, setBlockchain] = useState(null);
  const [voteReceipt, setVoteReceipt] = useState(null);
  const [verifyHash, setVerifyHash] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [hasVoted, setHasVoted] = useState(user.hasVoted);

  useEffect(() => {
    apiFetch("/candidates", {}, token).then(setCandidates).catch(console.error);
    apiFetch("/results", {}, token).then(setResults).catch(console.error);
  }, []);

  const handleVote = async () => {
    if (!selected) return;
    setLoading(true); setMsg({ type: "", text: "" });
    try {
      const data = await apiFetch("/vote", { method: "POST", body: JSON.stringify({ candidateId: selected }) }, token);
      setVoteReceipt(data);
      setHasVoted(true);
      setMsg({ type: "success", text: "✅ Vote cast and recorded on the blockchain!" });
      const updated = await apiFetch("/results", {}, token);
      setResults(updated);
      setTimeout(() => setTab("results"), 2000);
    } catch (err) { setMsg({ type: "error", text: err.message }); }
    setLoading(false);
  };

  const handleVerify = async () => {
    if (!verifyHash) return;
    setLoading(true);
    try {
      const data = await apiFetch("/verify-vote", { method: "POST", body: JSON.stringify({ voteHash: verifyHash }) }, token);
      setVerifyResult(data);
    } catch (err) { setVerifyResult({ error: err.message }); }
    setLoading(false);
  };

  const tabs = [
    { id: "vote",       label: "Cast Vote",      icon: Icon.vote },
    { id: "results",    label: "Live Results",   icon: Icon.chart },
    { id: "blockchain", label: "Blockchain",     icon: Icon.chain },
    { id: "verify",     label: "Verify Vote",    icon: Icon.search },
  ];

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="dash-brand">{Icon.shield}<span>BlockVote</span></div>
        <div className="dash-user">
          <span className="user-badge">{Icon.user} {user.name}</span>
          {hasVoted && <span className="voted-badge">{Icon.check} Voted</span>}
          <button className="btn btn-ghost btn-sm" onClick={onLogout}>{Icon.logout} Logout</button>
        </div>
      </header>

      <nav className="dash-nav">
        {tabs.map(t => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : ""}`}
            onClick={() => { setTab(t.id); if (t.id === "blockchain") apiFetch("/blockchain", {}, token).then(setBlockchain); }}>
            {t.icon}{t.label}
          </button>
        ))}
      </nav>

      <main className="dash-content">
        {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

        {/* VOTE TAB */}
        {tab === "vote" && (
          <div className="vote-section">
            <div className="section-header">
              <h2>Cast Your Vote</h2>
              <p>{hasVoted ? "You have already cast your vote in this election." : "Select a candidate and submit your ballot."}</p>
            </div>
            {hasVoted && voteReceipt && (
              <div className="receipt-card">
                <h3>🧾 Your Vote Receipt</h3>
                <div className="receipt-row"><span>Vote Hash:</span><code>{voteReceipt.voteHash.slice(0,40)}...</code></div>
                <div className="receipt-row"><span>Block Index:</span><code>#{voteReceipt.blockIndex}</code></div>
                <div className="receipt-row"><span>Block Hash:</span><code>{voteReceipt.blockHash.slice(0,30)}...</code></div>
                <p className="receipt-note">⚠️ Save your Vote Hash to verify your vote on the blockchain anytime.</p>
              </div>
            )}
            <div className="candidates-grid">
              {candidates.map(c => (
                <div key={c.id}
                  className={`candidate-card ${selected === c.id ? "selected" : ""} ${hasVoted ? "disabled" : ""}`}
                  onClick={() => !hasVoted && setSelected(c.id)}>
                  <div className="candidate-symbol">{c.symbol}</div>
                  <h3>{c.name}</h3>
                  <p>{c.party}</p>
                  {selected === c.id && <div className="selected-mark">{Icon.check}</div>}
                </div>
              ))}
            </div>
            {!hasVoted && (
              <div className="vote-action">
                <button className="btn btn-primary btn-lg" onClick={handleVote} disabled={!selected || loading}>
                  {loading ? "Processing on Blockchain..." : `${Icon.vote} Submit Ballot`}
                </button>
                {selected && <p className="vote-warning">⚠️ This is irreversible. Your vote will be permanently recorded on the blockchain.</p>}
              </div>
            )}
          </div>
        )}

        {/* RESULTS TAB */}
        {tab === "results" && results && (
          <div className="results-section">
            <div className="section-header">
              <h2>Live Election Results</h2>
              <p>Total Votes: <strong>{results.totalVotes}</strong> &nbsp;|&nbsp; Chain Valid: <span className={results.chainValid ? "status-ok" : "status-err"}>{results.chainValid ? "✅ Yes" : "❌ No"}</span></p>
            </div>
            <div className="results-list">
              {results.results.map((c, i) => (
                <div key={c.id} className={`result-row ${i === 0 && c.votes > 0 ? "winner" : ""}`}>
                  <div className="result-rank">#{i+1}</div>
                  <div className="result-symbol">{c.symbol}</div>
                  <div className="result-info">
                    <strong>{c.name}</strong>
                    <span>{c.party}</span>
                  </div>
                  <div className="result-bar-wrap">
                    <div className="result-bar" style={{width: `${c.percentage}%`}}></div>
                  </div>
                  <div className="result-stats">
                    <strong>{c.votes} votes</strong>
                    <span>{c.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BLOCKCHAIN TAB */}
        {tab === "blockchain" && (
          <div className="blockchain-section">
            <div className="section-header">
              <h2>Blockchain Explorer</h2>
              {blockchain && <p>{blockchain.length} Blocks &nbsp;|&nbsp; Chain Valid: <span className={blockchain.isValid ? "status-ok" : "status-err"}>{blockchain.isValid ? "✅ Valid" : "❌ Invalid"}</span></p>}
            </div>
            {!blockchain && <p style={{color:'var(--text2)'}}>Click the Blockchain tab to load...</p>}
            <div className="blocks-list">
              {blockchain?.chain.slice().reverse().map(block => (
                <div key={block.index} className={`block-card ${block.data.type === "GENESIS" ? "genesis" : ""}`}>
                  <div className="block-header">
                    <span className="block-index">Block #{block.index}</span>
                    <span className="block-type">{block.data.type}</span>
                    <span className="block-time">{new Date(block.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="block-hash"><label>Hash</label><code>{block.hash}</code></div>
                  <div className="block-hash"><label>Prev Hash</label><code>{block.previousHash}</code></div>
                  <div className="block-hash"><label>Nonce</label><code>{block.nonce}</code></div>
                  {block.data.type === "VOTE" && (
                    <div className="block-data"><span>🗳️ Voted for: <strong>{block.data.candidateName}</strong></span></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VERIFY TAB */}
        {tab === "verify" && (
          <div className="verify-section">
            <div className="section-header">
              <h2>Verify Your Vote</h2>
              <p>Paste your vote hash to confirm it is recorded on the blockchain</p>
            </div>
            <div className="verify-form">
              <input className="verify-input" placeholder="Paste your vote hash here..."
                value={verifyHash} onChange={e => setVerifyHash(e.target.value)} />
              <button className="btn btn-primary" onClick={handleVerify} disabled={!verifyHash || loading}>
                {loading ? "Searching..." : "Verify"}
              </button>
            </div>
            {verifyResult && (
              <div className={`verify-result ${verifyResult.error ? "verify-fail" : "verify-ok"}`}>
                {verifyResult.error ? (
                  <><div className="vr-icon">❌</div><p>{verifyResult.error}</p></>
                ) : (
                  <>
                    <div className="vr-icon">✅</div>
                    <h3>Vote Verified on Blockchain!</h3>
                    <div className="vr-details">
                      <div><span>Candidate</span><strong>{verifyResult.block.data.candidateName}</strong></div>
                      <div><span>Block Index</span><strong>#{verifyResult.vote.blockIndex}</strong></div>
                      <div><span>Timestamp</span><strong>{new Date(verifyResult.vote.timestamp).toLocaleString()}</strong></div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ── ROOT APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("landing");
  const [auth, setAuth] = useState(() => {
    const t = localStorage.getItem("ev_token");
    const u = localStorage.getItem("ev_user");
    return t && u ? { token: t, user: JSON.parse(u) } : null;
  });

  const handleLogin = (token, user) => {
    localStorage.setItem("ev_token", token);
    localStorage.setItem("ev_user", JSON.stringify(user));
    setAuth({ token, user });
    setPage("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("ev_token");
    localStorage.removeItem("ev_user");
    setAuth(null);
    setPage("landing");
  };

  useEffect(() => { if (auth) setPage("dashboard"); }, []);

  return (
    <AuthContext.Provider value={auth}>
      {page === "landing"   && <Landing    onNavigate={setPage} />}
      {page === "register"  && <Register   onNavigate={setPage} />}
      {page === "login"     && <Login      onNavigate={setPage} onLogin={handleLogin} />}
      {page === "dashboard" && auth && <Dashboard onLogout={handleLogout} />}
    </AuthContext.Provider>
  );
}