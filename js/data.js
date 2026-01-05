// js/data.js
(function initDataLayer(){
  const LS = {
    PRODUCTS: "minishop_products",
    CART: "minishop_cart",
    ORDERS: "minishop_orders",
    THEME: "minishop_theme"
  };

  const demoProducts = [
    { id: uid(), name: "羽球拍 Pro 88", category: "球拍", price: 2590, stock: 24, desc: "中杆彈性佳，甜區穩定，攻守兼備。", tag: "熱賣", popularity: 86, createdAt: Date.now() - 1000*60*60*24*6 },
    { id: uid(), name: "網球拍 Control 100", category: "球拍", price: 3290, stock: 15, desc: "控球導向，適合底線拉鋸。", tag: "新品", popularity: 72, createdAt: Date.now() - 1000*60*60*24*2 },
    { id: uid(), name: "運動鞋 AeroRun", category: "鞋類", price: 1890, stock: 32, desc: "透氣輕量，回彈好，久走不累。", tag: "", popularity: 65, createdAt: Date.now() - 1000*60*60*24*12 },
    { id: uid(), name: "機能短T DryFit", category: "服飾", price: 690, stock: 50, desc: "快乾排汗，日常與訓練都好搭。", tag: "", popularity: 58, createdAt: Date.now() - 1000*60*60*24*20 },
    { id: uid(), name: "護腕 PowerGrip", category: "配件", price: 280, stock: 80, desc: "加壓支撐，減少運動不適感。", tag: "加購", popularity: 61, createdAt: Date.now() - 1000*60*60*24*9 },
  ];

  function uid(){
    return "p_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
  }

  function readJSON(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }catch{
      return fallback;
    }
  }

  function writeJSON(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  }

  function money(n){
    const x = Number(n) || 0;
    return "$" + x.toLocaleString("zh-Hant-TW");
  }

  function toast(type, title, msg){
    const host = document.getElementById("toastHost");
    if(!host) return;

    const el = document.createElement("div");
    el.className = `toast ${type ? "toast--"+type : ""}`.trim();
    el.innerHTML = `
      <div class="toast__dot"></div>
      <div>
        <div class="toast__title">${escapeHTML(title || "通知")}</div>
        <div class="toast__msg">${escapeHTML(msg || "")}</div>
      </div>
    `;
    host.appendChild(el);
    setTimeout(()=>{ el.style.opacity = "0"; el.style.transform = "translateY(6px)"; }, 2600);
    setTimeout(()=>{ el.remove(); }, 3000);
  }

  function escapeHTML(s){
    return String(s)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function ensureDemo(){
    const existing = readJSON(LS.PRODUCTS, null);
    if(!existing || !Array.isArray(existing) || existing.length === 0){
      writeJSON(LS.PRODUCTS, demoProducts);
    }
    const cart = readJSON(LS.CART, null);
    if(!cart || typeof cart !== "object") writeJSON(LS.CART, {});
    const orders = readJSON(LS.ORDERS, null);
    if(!Array.isArray(orders)) writeJSON(LS.ORDERS, []);
  }

  function getProducts(){ ensureDemo(); return readJSON(LS.PRODUCTS, []); }
  function setProducts(list){ writeJSON(LS.PRODUCTS, list); }

  function getCart(){ ensureDemo(); return readJSON(LS.CART, {}); }
  function setCart(cart){ writeJSON(LS.CART, cart); }

  function getOrders(){ ensureDemo(); return readJSON(LS.ORDERS, []); }
  function setOrders(list){ writeJSON(LS.ORDERS, list); }

  function cartCount(){
    const cart = getCart();
    return Object.values(cart).reduce((sum, qty)=> sum + (Number(qty)||0), 0);
  }

  function setTheme(theme){
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(LS.THEME, theme);
  }
  function initTheme(){
    const t = localStorage.getItem(LS.THEME) || "dark";
    setTheme(t);
  }
  function toggleTheme(){
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    setTheme(current === "dark" ? "light" : "dark");
    toast("", "已切換主題", `目前為：${document.documentElement.getAttribute("data-theme")}`);
  }

  window.MiniShop = {
    LS, uid, money, toast,
    getProducts, setProducts,
    getCart, setCart,
    getOrders, setOrders,
    cartCount,
    initTheme, toggleTheme,
    ensureDemo
  };
})();
