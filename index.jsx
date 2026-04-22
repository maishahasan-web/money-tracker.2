import { useState, useEffect, useCallback } from "react";

// ── Palette & helpers ──────────────────────────────────────────────────────
const fmt = (n) =>
  "৳" + Math.abs(n).toLocaleString("en-BD", { minimumFractionDigits: 2 });

// ── Storage helpers (namespaced per user) ──────────────────────────────────
const usersKey = "mt_users";
const txKey = (u) => `mt_tx_${u}`;

const getUsers = () => JSON.parse(localStorage.getItem(usersKey) || "{}");
const saveUsers = (u) => localStorage.setItem(usersKey, JSON.stringify(u));
const getTx = (u) => JSON.parse(localStorage.getItem(txKey(u)) || "[]");
const saveTx = (u, tx) => localStorage.setItem(txKey(u), JSON.stringify(tx));

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("login"); // login | register | app
  const [currentUser, setCurrentUser] = useState(null);
  const [authError, setAuthError] = useState("");

  // auth fields
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [regForm, setRegForm] = useState({
    username: "",
    password: "",
    confirm: "",
  });

  // transactions
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({
    desc: "",
    amount: "",
    type: "income",
  });
  const [formError, setFormError] = useState("");
  const [tab, setTab] = useState("transactions"); // transactions | overview
  const [filterType, setFilterType] = useState("all");
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  // load transactions when user logs in
  useEffect(() => {
    if (currentUser) {
      setTransactions(getTx(currentUser));
    }
  }, [currentUser]);

  // persist transactions
  useEffect(() => {
    if (currentUser) saveTx(currentUser, transactions);
  }, [transactions, currentUser]);

  // ── Auth ──
  const handleLogin = () => {
    setAuthError("");
    const users = getUsers();
    const { username, password } = loginForm;
    if (!username || !password) return setAuthError("Please fill all fields.");
    if (!users[username]) return setAuthError("Username not found.");
    if (users[username] !== password)
      return setAuthError("Wrong password.");
    setCurrentUser(username);
    setScreen("app");
    showToast(`Welcome back, ${username}!`);
  };

  const handleRegister = () => {
    setAuthError("");
    const { username, password, confirm } = regForm;
    if (!username || !password || !confirm)
      return setAuthError("Please fill all fields.");
    if (username.length < 3)
      return setAuthError("Username must be at least 3 characters.");
    if (password.length < 4)
      return setAuthError("Password must be at least 4 characters.");
    if (password !== confirm) return setAuthError("Passwords don't match.");
    const users = getUsers();
    if (users[username]) return setAuthError("Username already taken.");
    users[username] = password;
    saveUsers(users);
    setCurrentUser(username);
    setScreen("app");
    showToast(`Account created! Welcome, ${username}!`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setTransactions([]);
    setScreen("login");
    setLoginForm({ username: "", password: "" });
  };

  // ── Transactions ──
  const addTransaction = () => {
    setFormError("");
    const { desc, amount, type } = form;
    if (!desc.trim()) return setFormError("Description is required.");
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0)
      return setFormError("Enter a valid positive amount.");
    const tx = {
      id: Date.now(),
      desc: desc.trim(),
      amount: num,
      type,
      date: new Date().toLocaleDateString("en-BD", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    };
    setTransactions((prev) => [tx, ...prev]);
    setForm({ desc: "", amount: "", type: "income" });
    showToast(type === "income" ? "Income added!" : "Expense recorded!");
  };

  const deleteTransaction = (id) =>
    setTransactions((prev) => prev.filter((t) => t.id !== id));

  // ── Stats ──
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const savingsRate =
    income > 0 ? Math.max(0, Math.round(((income - expense) / income) * 100)) : 0;

  const filtered =
    filterType === "all"
      ? transactions
      : transactions.filter((t) => t.type === filterType);

  // monthly chart data
  const monthlyData = (() => {
    const map = {};
    transactions.forEach((t) => {
      const key = t.date.split(" ").slice(1).join(" ");
      if (!map[key]) map[key] = { income: 0, expense: 0 };
      map[key][t.type] += t.amount;
    });
    return Object.entries(map)
      .slice(-6)
      .map(([k, v]) => ({ label: k, ...v }));
  })();

  const maxBar =
    Math.max(...monthlyData.flatMap((d) => [d.income, d.expense]), 1);

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  const styles = {
    root: {
      minHeight: "100vh",
      background: "#0d0f14",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      color: "#e8eaf0",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "0 16px 40px",
    },
    // AUTH CARD
    authWrap: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      width: "100%",
    },
    authCard: {
      background: "#181b23",
      border: "1px solid #2a2d38",
      borderRadius: 20,
      padding: "40px 36px",
      width: "100%",
      maxWidth: 400,
      boxShadow: "0 24px 60px rgba(0,0,0,.5)",
    },
    authTitle: {
      fontSize: 26,
      fontWeight: 700,
      marginBottom: 4,
      color: "#fff",
      letterSpacing: -0.5,
    },
    authSub: { fontSize: 14, color: "#6b7280", marginBottom: 28 },
    label: { fontSize: 12, color: "#9ca3af", marginBottom: 6, display: "block" },
    input: {
      width: "100%",
      background: "#0d0f14",
      border: "1px solid #2a2d38",
      borderRadius: 10,
      padding: "12px 14px",
      color: "#e8eaf0",
      fontSize: 15,
      marginBottom: 16,
      outline: "none",
      boxSizing: "border-box",
      transition: "border-color .2s",
    },
    btn: {
      width: "100%",
      padding: "13px",
      borderRadius: 10,
      border: "none",
      background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
      color: "#fff",
      fontSize: 15,
      fontWeight: 600,
      cursor: "pointer",
      marginTop: 4,
    },
    btnOutline: {
      background: "transparent",
      border: "1px solid #2a2d38",
      color: "#9ca3af",
      marginTop: 12,
    },
    authError: {
      background: "#2d1a1a",
      border: "1px solid #7f1d1d",
      color: "#fca5a5",
      borderRadius: 8,
      padding: "10px 14px",
      fontSize: 13,
      marginBottom: 16,
    },
    switchLink: {
      textAlign: "center",
      marginTop: 20,
      fontSize: 13,
      color: "#6b7280",
    },
    switchBtn: {
      background: "none",
      border: "none",
      color: "#818cf8",
      cursor: "pointer",
      fontSize: 13,
      fontWeight: 600,
    },
    // APP
    header: {
      width: "100%",
      maxWidth: 700,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "24px 0 20px",
    },
    logoText: {
      fontSize: 20,
      fontWeight: 700,
      color: "#fff",
      letterSpacing: -0.5,
    },
    userChip: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      background: "#181b23",
      border: "1px solid #2a2d38",
      borderRadius: 40,
      padding: "6px 14px 6px 8px",
    },
    avatar: {
      width: 30,
      height: 30,
      borderRadius: "50%",
      background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 13,
      fontWeight: 700,
      color: "#fff",
    },
    logoutBtn: {
      background: "none",
      border: "none",
      color: "#6b7280",
      cursor: "pointer",
      fontSize: 12,
      padding: 0,
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 12,
      width: "100%",
      maxWidth: 700,
      marginBottom: 20,
    },
    statCard: (color) => ({
      background: "#181b23",
      border: `1px solid ${color}22`,
      borderRadius: 16,
      padding: "18px 20px",
    }),
    statLabel: { fontSize: 12, color: "#6b7280", marginBottom: 6 },
    statVal: (color) => ({
      fontSize: 22,
      fontWeight: 700,
      color,
      letterSpacing: -0.5,
    }),
    panel: {
      background: "#181b23",
      border: "1px solid #2a2d38",
      borderRadius: 20,
      padding: "24px",
      width: "100%",
      maxWidth: 700,
      marginBottom: 16,
      boxSizing: "border-box",
    },
    panelTitle: {
      fontSize: 15,
      fontWeight: 600,
      color: "#e8eaf0",
      marginBottom: 18,
    },
    formRow: {
      display: "grid",
      gridTemplateColumns: "1fr 120px",
      gap: 10,
      marginBottom: 10,
    },
    typeRow: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10,
      marginBottom: 14,
    },
    typeBtn: (active, color) => ({
      padding: "10px",
      borderRadius: 10,
      border: `1px solid ${active ? color : "#2a2d38"}`,
      background: active ? color + "18" : "transparent",
      color: active ? color : "#6b7280",
      fontWeight: 600,
      fontSize: 14,
      cursor: "pointer",
      transition: "all .2s",
    }),
    addBtn: {
      width: "100%",
      padding: "12px",
      borderRadius: 10,
      border: "none",
      background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
      color: "#fff",
      fontSize: 15,
      fontWeight: 600,
      cursor: "pointer",
    },
    formError: {
      color: "#fca5a5",
      fontSize: 13,
      marginBottom: 10,
    },
    tabs: {
      display: "flex",
      gap: 8,
      width: "100%",
      maxWidth: 700,
      marginBottom: 16,
    },
    tab: (active) => ({
      padding: "9px 20px",
      borderRadius: 10,
      border: "none",
      background: active ? "#6366f1" : "#181b23",
      color: active ? "#fff" : "#6b7280",
      fontWeight: 600,
      fontSize: 14,
      cursor: "pointer",
      border: `1px solid ${active ? "#6366f1" : "#2a2d38"}`,
    }),
    filterRow: {
      display: "flex",
      gap: 8,
      marginBottom: 16,
    },
    filterBtn: (active) => ({
      padding: "6px 14px",
      borderRadius: 8,
      border: `1px solid ${active ? "#6366f1" : "#2a2d38"}`,
      background: active ? "#6366f115" : "transparent",
      color: active ? "#818cf8" : "#6b7280",
      fontSize: 13,
      fontWeight: 500,
      cursor: "pointer",
    }),
    txItem: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "14px 0",
      borderBottom: "1px solid #1f2230",
    },
    txDesc: { fontSize: 15, fontWeight: 500, color: "#e8eaf0", marginBottom: 3 },
    txDate: { fontSize: 12, color: "#4b5563" },
    txAmt: (type) => ({
      fontSize: 16,
      fontWeight: 700,
      color: type === "income" ? "#34d399" : "#f87171",
    }),
    delBtn: {
      background: "none",
      border: "none",
      color: "#374151",
      cursor: "pointer",
      fontSize: 18,
      marginLeft: 12,
      lineHeight: 1,
      padding: "0 4px",
    },
    empty: {
      textAlign: "center",
      color: "#374151",
      padding: "32px 0",
      fontSize: 14,
    },
    barChart: {
      display: "flex",
      alignItems: "flex-end",
      gap: 8,
      height: 140,
      marginTop: 16,
    },
    barGroup: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 4,
      height: "100%",
      justifyContent: "flex-end",
    },
    barLabel: { fontSize: 10, color: "#4b5563", marginTop: 6, textAlign: "center" },
    toast: {
      position: "fixed",
      bottom: 28,
      left: "50%",
      transform: "translateX(-50%)",
      background: "#1f2937",
      border: "1px solid #374151",
      color: "#e8eaf0",
      borderRadius: 40,
      padding: "10px 22px",
      fontSize: 14,
      fontWeight: 500,
      zIndex: 999,
      boxShadow: "0 8px 32px rgba(0,0,0,.4)",
      pointerEvents: "none",
    },
  };

  // ── Auth screens ──
  if (screen === "login" || screen === "register") {
    const isLogin = screen === "login";
    return (
      <div style={styles.root}>
        <div style={styles.authWrap}>
          <div style={styles.authCard}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>💸</div>
            <div style={styles.authTitle}>
              {isLogin ? "Sign in" : "Create account"}
            </div>
            <div style={styles.authSub}>
              {isLogin
                ? "Welcome back! Your taka is waiting."
                : "Start tracking your personal taka."}
            </div>

            {authError && <div style={styles.authError}>{authError}</div>}

            {isLogin ? (
              <>
                <label style={styles.label}>Username</label>
                <input
                  style={styles.input}
                  placeholder="your_username"
                  value={loginForm.username}
                  onChange={(e) =>
                    setLoginForm((f) => ({ ...f, username: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
                <label style={styles.label}>Password</label>
                <input
                  style={styles.input}
                  type="password"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm((f) => ({ ...f, password: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
                <button style={styles.btn} onClick={handleLogin}>
                  Sign In →
                </button>
              </>
            ) : (
              <>
                <label style={styles.label}>Username</label>
                <input
                  style={styles.input}
                  placeholder="choose a username"
                  value={regForm.username}
                  onChange={(e) =>
                    setRegForm((f) => ({ ...f, username: e.target.value }))
                  }
                />
                <label style={styles.label}>Password</label>
                <input
                  style={styles.input}
                  type="password"
                  placeholder="••••••••"
                  value={regForm.password}
                  onChange={(e) =>
                    setRegForm((f) => ({ ...f, password: e.target.value }))
                  }
                />
                <label style={styles.label}>Confirm Password</label>
                <input
                  style={styles.input}
                  type="password"
                  placeholder="••••••••"
                  value={regForm.confirm}
                  onChange={(e) =>
                    setRegForm((f) => ({ ...f, confirm: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                />
                <button style={styles.btn} onClick={handleRegister}>
                  Create Account →
                </button>
              </>
            )}

            <div style={styles.switchLink}>
              {isLogin ? "No account? " : "Already have an account? "}
              <button
                style={styles.switchBtn}
                onClick={() => {
                  setAuthError("");
                  setScreen(isLogin ? "register" : "login");
                }}
              >
                {isLogin ? "Register" : "Sign in"}
              </button>
            </div>
          </div>
        </div>
        {toast && <div style={styles.toast}>{toast}</div>}
      </div>
    );
  }

  // ── Main app ──
  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.logoText}>💸 Money Tracker</span>
        <div style={styles.userChip}>
          <div style={styles.avatar}>
            {currentUser[0].toUpperCase()}
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#d1d5db" }}>
            {currentUser}
          </span>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard("#34d399")}>
          <div style={styles.statLabel}>Income</div>
          <div style={styles.statVal("#34d399")}>{fmt(income)}</div>
        </div>
        <div style={styles.statCard("#f87171")}>
          <div style={styles.statLabel}>Spent</div>
          <div style={styles.statVal("#f87171")}>{fmt(expense)}</div>
        </div>
        <div style={styles.statCard(balance >= 0 ? "#818cf8" : "#fb923c")}>
          <div style={styles.statLabel}>Balance</div>
          <div style={styles.statVal(balance >= 0 ? "#818cf8" : "#fb923c")}>
            {balance < 0 ? "-" : ""}{fmt(balance)}
          </div>
        </div>
      </div>

      {/* Add transaction */}
      <div style={styles.panel}>
        <div style={styles.panelTitle}>New Transaction</div>
        <div style={styles.formRow}>
          <input
            style={{ ...styles.input, marginBottom: 0 }}
            placeholder="Description"
            value={form.desc}
            onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
          />
          <input
            style={{ ...styles.input, marginBottom: 0 }}
            placeholder="Amount (৳)"
            type="number"
            min="0"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && addTransaction()}
          />
        </div>
        <div style={styles.typeRow}>
          <button
            style={styles.typeBtn(form.type === "income", "#34d399")}
            onClick={() => setForm((f) => ({ ...f, type: "income" }))}
          >
            + Income
          </button>
          <button
            style={styles.typeBtn(form.type === "expense", "#f87171")}
            onClick={() => setForm((f) => ({ ...f, type: "expense" }))}
          >
            − Expense
          </button>
        </div>
        {formError && <div style={styles.formError}>⚠ {formError}</div>}
        <button style={styles.addBtn} onClick={addTransaction}>
          Add Transaction
        </button>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button style={styles.tab(tab === "transactions")} onClick={() => setTab("transactions")}>
          Transactions
        </button>
        <button style={styles.tab(tab === "overview")} onClick={() => setTab("overview")}>
          Overview
        </button>
      </div>

      {/* Transactions tab */}
      {tab === "transactions" && (
        <div style={styles.panel}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={styles.panelTitle}>History</div>
            <div style={styles.filterRow}>
              {["all", "income", "expense"].map((f) => (
                <button
                  key={f}
                  style={styles.filterBtn(filterType === f)}
                  onClick={() => setFilterType(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div style={styles.empty}>No transactions yet. Add one above!</div>
          ) : (
            filtered.map((t) => (
              <div key={t.id} style={styles.txItem}>
                <div>
                  <div style={styles.txDesc}>{t.desc}</div>
                  <div style={styles.txDate}>{t.date}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div style={styles.txAmt(t.type)}>
                    {t.type === "income" ? "+" : "−"}{fmt(t.amount)}
                  </div>
                  <button
                    style={styles.delBtn}
                    onClick={() => deleteTransaction(t.id)}
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Overview tab */}
      {tab === "overview" && (
        <div style={styles.panel}>
          <div style={styles.panelTitle}>Overview</div>

          {/* Savings rate */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b7280", marginBottom: 8 }}>
              <span>Savings Rate</span>
              <span style={{ color: "#818cf8", fontWeight: 700 }}>{savingsRate}%</span>
            </div>
            <div style={{ height: 8, background: "#1f2230", borderRadius: 4, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${savingsRate}%`,
                  background: "linear-gradient(90deg,#6366f1,#34d399)",
                  borderRadius: 4,
                  transition: "width .5s",
                }}
              />
            </div>
          </div>

          {/* Bar chart */}
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>Monthly Breakdown</div>
          {monthlyData.length === 0 ? (
            <div style={styles.empty}>Add transactions to see your chart.</div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
                <span style={{ color: "#34d399" }}>■ Income</span>
                <span style={{ color: "#f87171" }}>■ Expense</span>
              </div>
              <div style={styles.barChart}>
                {monthlyData.map((d, i) => (
                  <div key={i} style={styles.barGroup}>
                    <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 120 }}>
                      <div
                        style={{
                          width: 16,
                          height: `${Math.round((d.income / maxBar) * 120)}px`,
                          background: "#34d399",
                          borderRadius: "4px 4px 0 0",
                          minHeight: 2,
                        }}
                      />
                      <div
                        style={{
                          width: 16,
                          height: `${Math.round((d.expense / maxBar) * 120)}px`,
                          background: "#f87171",
                          borderRadius: "4px 4px 0 0",
                          minHeight: 2,
                        }}
                      />
                    </div>
                    <div style={styles.barLabel}>{d.label}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Summary */}
          <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: "#0d0f14", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Total Transactions</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#e8eaf0" }}>{transactions.length}</div>
            </div>
            <div style={{ background: "#0d0f14", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Avg. Transaction</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#e8eaf0" }}>
                {transactions.length > 0
                  ? fmt((income + expense) / transactions.length)
                  : "৳0"}
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );
}
