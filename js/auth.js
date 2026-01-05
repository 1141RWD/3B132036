// js/auth.js
document.addEventListener("DOMContentLoaded", () => {
  MiniShop.ensureDemo();
  MiniShop.initTheme();

  // theme toggle
  document.getElementById("themeBtn")?.addEventListener("click", MiniShop.toggleTheme);

  // badge
  const badge = document.getElementById("cartBadge");
  if (badge) badge.textContent = String(MiniShop.cartCount());

  // ensure admin exists
  ensureAdminAccount();

  // show/hide admin link
  applyNavAuthUI();

  // protect admin page if currently on admin.html
  if (location.pathname.endsWith("/admin.html") || location.pathname.endsWith("admin.html")) {
    requireAdmin();
  }

  // bind login/register if forms exist
  bindLoginForm();
  bindRegisterForm();
});

function LSKEYS() {
  return {
    USERS: "minishop_users",
    SESSION: "minishop_session",
  };
}

function ensureAdminAccount() {
  const { USERS } = LSKEYS();
  const users = readJSON(USERS, []);

  // admin: a1 / 123
  if (!users.some(u => u.username === "a1")) {
    users.unshift({
      username: "a1",
      // 作業示範：純前端不安全，這裡用簡單存法（不要用於真實網站）
      password: "123",
      role: "admin",
      name: "管理員",
      createdAt: Date.now(),
    });
    localStorage.setItem(USERS, JSON.stringify(users));
  }
}

function currentSession() {
  const { SESSION } = LSKEYS();
  return readJSON(SESSION, null);
}

function isAdmin() {
  const s = currentSession();
  return s?.role === "admin" && s?.username === "a1";
}

function applyNavAuthUI() {
      const profileLink = document.getElementById("profileLink");
        if (profileLink) {
            // 沒登入可以先顯示也行，但點進去 profile.js 會要求登入。
            // 若你想「沒登入就不要顯示」，用下面這行：
            profileLink.classList.toggle("hidden", !currentSession());
        }


  const adminLink = document.getElementById("adminLink");
  if (adminLink) {
    adminLink.classList.toggle("hidden", !isAdmin());
  }

  // 可選：如果你的 index/cart/admin header 想顯示「登出」按鈕，可以用這段自動插入
  const nav = document.querySelector(".nav");
  if (!nav) return;

  let logoutBtn = document.getElementById("logoutBtn");
  if (!logoutBtn) {
    logoutBtn = document.createElement("button");
    logoutBtn.id = "logoutBtn";
    logoutBtn.type = "button";
    logoutBtn.className = "btn btn--ghost btn--sm";
    logoutBtn.style.marginLeft = "6px";
    logoutBtn.textContent = "登出";
    logoutBtn.addEventListener("click", () => {
      logout();
      MiniShop.toast("", "已登出", "你已退出登入狀態");
      setTimeout(() => location.href = "./index.html", 450);
    });
    nav.appendChild(logoutBtn);
  }

  // 只有登入中才顯示登出
  logoutBtn.classList.toggle("hidden", !currentSession());
    // 登入/登出顯示切換（右上角登入連結）
  const loginLink = document.getElementById("loginLink");
  if (loginLink) {
    loginLink.classList.toggle("hidden", !!currentSession());
  }

}

function requireAdmin() {
  if (!isAdmin()) {
    // 不是管理員：導回登入
    MiniShop.toast("warn", "無權限", "請使用管理員帳號登入後再進入後台");
    setTimeout(() => (location.href = "./login.html"), 600);
  }
}

function bindLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("username")?.value.trim();
    const password = document.getElementById("password")?.value;

    if (!username || !password) {
      MiniShop.toast("warn", "資料不足", "請輸入帳號與密碼");
      return;
    }

    const user = findUser(username);
    if (!user || user.password !== password) {
      MiniShop.toast("danger", "登入失敗", "帳號或密碼錯誤");
      return;
    }

    setSession({ username: user.username, role: user.role, name: user.name || "" });
    MiniShop.toast("", "登入成功", user.role === "admin" ? "歡迎管理員" : "歡迎回來");

    // 管理員登入→去後台；一般會員→回商城
    setTimeout(() => {
      location.href = user.role === "admin" ? "./admin.html" : "./index.html";
    }, 550);
  });
}

function bindRegisterForm() {
  const form = document.getElementById("registerForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("rUsername")?.value.trim();
    const password = document.getElementById("rPassword")?.value;
    const name = document.getElementById("rName")?.value.trim();

    if (!username || !password) {
      MiniShop.toast("warn", "資料不足", "請輸入帳號與密碼");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      MiniShop.toast("warn", "帳號格式不符", "只能使用英文、數字、底線");
      return;
    }

    if (username === "a1") {
      MiniShop.toast("warn", "不可使用", "a1 為系統預設管理員帳號");
      return;
    }

    if (findUser(username)) {
      MiniShop.toast("warn", "註冊失敗", "此帳號已存在");
      return;
    }

    const { USERS } = LSKEYS();
    const users = readJSON(USERS, []);
    users.push({
      username,
      password,
      role: "user",
      name: name || username,
      createdAt: Date.now(),
    });
    localStorage.setItem(USERS, JSON.stringify(users));

    MiniShop.toast("", "註冊成功", "已建立帳號，請登入");
    setTimeout(() => (location.href = "./login.html"), 650);
  });
}

function logout() {
  const { SESSION } = LSKEYS();
  localStorage.removeItem(SESSION);
}

function setSession(session) {
  const { SESSION } = LSKEYS();
  localStorage.setItem(SESSION, JSON.stringify(session));
}

function findUser(username) {
  const { USERS } = LSKEYS();
  const users = readJSON(USERS, []);
  return users.find(u => u.username === username) || null;
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
