// js/profile.js
document.addEventListener("DOMContentLoaded", () => {
  MiniShop.ensureDemo();
  MiniShop.initTheme();
  document.getElementById("themeBtn")?.addEventListener("click", MiniShop.toggleTheme);

  // badge
  const badge = document.getElementById("cartBadge");
  if (badge) badge.textContent = String(MiniShop.cartCount());

  // 必須登入才可看
  const session = getSession();
  if (!session) {
    MiniShop.toast("warn", "需要登入", "請先登入才能查看個人資料");
    setTimeout(() => (location.href = "./login.html"), 600);
    return;
  }

  // 顯示角色
  const roleTag = document.getElementById("roleTag");
  if (roleTag) roleTag.textContent = session.role === "admin" ? "管理員" : "會員";

  // 登出
  document.getElementById("logoutBtn2")?.addEventListener("click", () => {
    localStorage.removeItem("minishop_session");
    MiniShop.toast("", "已登出", "你已退出登入狀態");
    setTimeout(() => (location.href = "./index.html"), 450);
  });

  // 載入使用者資料（不能改帳密）
  const user = findUser(session.username);
  if (!user) {
    MiniShop.toast("danger", "錯誤", "找不到使用者資料");
    return;
  }

  const pUsername = document.getElementById("pUsername");
  const pName = document.getElementById("pName");
  const pEmail = document.getElementById("pEmail");
  const pPhone = document.getElementById("pPhone");
  const pAddr = document.getElementById("pAddr");

  if (pUsername) pUsername.value = user.username;
  if (pName) pName.value = user.name || "";
  if (pEmail) pEmail.value = user.email || "";
  if (pPhone) pPhone.value = user.phone || "";
  if (pAddr) pAddr.value = user.addr || "";

  // 儲存基本資料
  document.getElementById("profileForm")?.addEventListener("submit", (e) => {
    e.preventDefault();

    const next = {
      ...user,
      name: (pName?.value || "").trim(),
      email: (pEmail?.value || "").trim(),
      phone: (pPhone?.value || "").trim(),
      addr: (pAddr?.value || "").trim(),
    };

    updateUser(next);

    // 同步 session 顯示用名稱（不改帳密）
    const s = getSession();
    if (s) {
      localStorage.setItem("minishop_session", JSON.stringify({ ...s, name: next.name || s.name || "" }));
    }

    MiniShop.toast("", "已儲存", "基本資料已更新");
  });

  // 歷史訂單（依登入帳號篩選）
  const q = document.getElementById("orderQ");
  q?.addEventListener("input", () => renderOrders(session.username));

  renderOrders(session.username);
});

function getSession(){
  try { return JSON.parse(localStorage.getItem("minishop_session")); }
  catch { return null; }
}

function readUsers(){
  try { return JSON.parse(localStorage.getItem("minishop_users")) || []; }
  catch { return []; }
}

function writeUsers(users){
  localStorage.setItem("minishop_users", JSON.stringify(users));
}

function findUser(username){
  const users = readUsers();
  return users.find(u => u.username === username) || null;
}

function updateUser(nextUser){
  const users = readUsers();
  const idx = users.findIndex(u => u.username === nextUser.username);
  if (idx === -1) return;
  // 保護：不能改帳號/密碼/角色
  users[idx] = {
    ...users[idx],
    name: nextUser.name,
    email: nextUser.email,
    phone: nextUser.phone,
    addr: nextUser.addr,
  };
  writeUsers(users);
}

function renderOrders(username){
  const wrap = document.getElementById("myOrders");
  if (!wrap) return;

  const keyword = (document.getElementById("orderQ")?.value || "").trim().toLowerCase();

  const orders = MiniShop.getOrders()
    .filter(o => o.user === username)
    .filter(o => {
      if (!keyword) return true;
      const hitId = (o.id || "").toLowerCase().includes(keyword);
      const hitItem = (o.items || []).some(it => (it.name || "").toLowerCase().includes(keyword));
      return hitId || hitItem;
    });

  if (orders.length === 0) {
    wrap.innerHTML = `
      <div class="orderItem">
        <div style="font-weight:1000">沒有歷史訂單</div>
        <div class="muted tiny">你可以到購物車送出訂單，這裡就會出現。</div>
      </div>
    `;
    return;
  }

  wrap.innerHTML = orders.map(o => `
    <div class="orderItem">
      <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start">
        <div>
          <div style="font-weight:1000">
            訂單 ${escapeHTML(o.id)} ・ <span class="tag">${escapeHTML(o.status || "已成立")}</span>
          </div>
          <div class="muted tiny">時間：${new Date(o.createdAt).toLocaleString("zh-Hant-TW")}</div>
          <div class="muted tiny">總計：${MiniShop.money(o.total)}</div>
        </div>
        <div class="stackRow">
          <a class="btn btn--ghost btn--sm" href="./order_success.html?id=${encodeURIComponent(o.id)}">查看</a>
        </div>
      </div>
      <div class="divider"></div>
      <div class="muted tiny">
        ${(o.items || []).map(it => `${escapeHTML(it.name)} x${it.qty}`).join("、")}
      </div>
    </div>
  `).join("");
}

function escapeHTML(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
