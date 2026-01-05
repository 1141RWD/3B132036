// js/cart.js
document.addEventListener("DOMContentLoaded", () => {
  MiniShop.ensureDemo();
  MiniShop.initTheme();

  document.getElementById("themeBtn")?.addEventListener("click", MiniShop.toggleTheme);

  const badge = document.getElementById("cartBadge");
  const cartList = document.getElementById("cartList");
  const empty = document.getElementById("emptyCart");

  const subTotal = document.getElementById("subTotal");
  const shipping = document.getElementById("shipping");
  const grandTotal = document.getElementById("grandTotal");

  const clearBtn = document.getElementById("clearCartBtn");
  const checkoutBtn = document.getElementById("checkoutBtn");

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem("minishop_session"));
    } catch {
      return null;
    }
  }

  function updateBadge() {
    if (badge) badge.textContent = String(MiniShop.cartCount());
  }

  function cssUrlSafe(s){
    return String(s).replaceAll("\\", "\\\\").replaceAll("'", "\\'");
  }

  function render() {
    const products = MiniShop.getProducts();
    const cart = MiniShop.getCart();
    const items = Object.entries(cart).filter(([, qty]) => (Number(qty) || 0) > 0);

    if (!cartList) return;

    if (items.length === 0) {
      cartList.innerHTML = "";
      empty?.classList.remove("hidden");
      setTotals(0);
      updateBadge();
      return;
    }

    empty?.classList.add("hidden");

    let sum = 0;

    cartList.innerHTML = items.map(([pid, qty]) => {
      const p = products.find(x => x.id === pid);
      if (!p) return "";

      const q = Number(qty) || 0;
      const price = Number(p.price) || 0;
      const line = q * price;
      sum += line;

      const thumbStyle = p.img
        ? `style="background-image:url('${cssUrlSafe(p.img)}');background-size:cover;background-position:center;"`
        : "";

      return `
        <div class="cartItem">
          <div class="cartThumb" ${thumbStyle}></div>
          <div>
            <div class="cartTitle">${escapeHTML(p.name)}</div>
            <div class="cartRow">
              <span class="muted">${escapeHTML(p.category || "")}</span>
              <span class="muted">單價：${MiniShop.money(price)}</span>
            </div>
            <div class="cartRow" style="margin-top:10px">
              <div class="qty">
                <button type="button" data-dec="${pid}">−</button>
                <span>${q}</span>
                <button type="button" data-inc="${pid}">＋</button>
              </div>
              <button class="btn btn--ghost btn--sm" data-del="${pid}">移除</button>
            </div>
          </div>
          <div style="text-align:right">
            <div class="price">${MiniShop.money(line)}</div>
            <div class="muted tiny">庫存：${Number(p.stock) || 0}</div>
          </div>
        </div>
      `;
    }).join("");

    cartList.querySelectorAll("[data-inc]").forEach(b => b.addEventListener("click", () => inc(b.dataset.inc)));
    cartList.querySelectorAll("[data-dec]").forEach(b => b.addEventListener("click", () => dec(b.dataset.dec)));
    cartList.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => del(b.dataset.del)));

    setTotals(sum);
    updateBadge();
  }

  function setTotals(sum) {
    const ship = sum > 0 ? 60 : 0;
    subTotal.textContent = MiniShop.money(sum);
    shipping.textContent = MiniShop.money(ship);
    grandTotal.textContent = MiniShop.money(sum + ship);
  }

  function inc(pid) {
    const products = MiniShop.getProducts();
    const p = products.find(x => x.id === pid);
    if (!p) return;

    const cart = MiniShop.getCart();
    const now = Number(cart[pid]) || 0;
    if (now + 1 > Number(p.stock)) {
      MiniShop.toast("warn", "超過庫存", "無法再增加");
      return;
    }
    cart[pid] = now + 1;
    MiniShop.setCart(cart);
    render();
  }

  function dec(pid) {
    const cart = MiniShop.getCart();
    const now = Number(cart[pid]) || 0;
    if (now <= 1) delete cart[pid];
    else cart[pid] = now - 1;
    MiniShop.setCart(cart);
    render();
  }

  function del(pid) {
    const cart = MiniShop.getCart();
    delete cart[pid];
    MiniShop.setCart(cart);
    MiniShop.toast("", "已移除", "商品已從購物車移除");
    render();
  }

  clearBtn?.addEventListener("click", () => {
    MiniShop.setCart({});
    MiniShop.toast("", "已清空", "購物車已清空");
    render();
  });

  checkoutBtn?.addEventListener("click", () => {
    const session = getSession();

    const name = document.getElementById("buyerName")?.value.trim();
    const phone = document.getElementById("buyerPhone")?.value.trim();
    const addr = document.getElementById("buyerAddr")?.value.trim();

    if (!name || !phone || !addr) {
      MiniShop.toast("warn", "資料不足", "請填寫收件人、電話與地址");
      return;
    }

    const products = MiniShop.getProducts();
    const cart = MiniShop.getCart();
    const items = Object.entries(cart).filter(([, qty]) => (Number(qty) || 0) > 0);

    if (items.length === 0) {
      MiniShop.toast("warn", "無法結帳", "購物車是空的");
      return;
    }

    for (const [pid, qty] of items) {
      const p = products.find(x => x.id === pid);
      if (!p || qty > p.stock) {
        MiniShop.toast("warn", "庫存不足", `${p?.name || "商品"} 庫存不夠`);
        return;
      }
    }

    // ✅ 修正：...p
    const nextProducts = products.map(p => {
      const q = Number(cart[p.id]) || 0;
      return q > 0 ? { ...p, stock: p.stock - q } : p;
    });
    MiniShop.setProducts(nextProducts);

    const orderItems = items.map(([pid, qty]) => {
      const p = products.find(x => x.id === pid);
      return { pid, name: p.name, price: p.price, qty };
    });

    const sub = orderItems.reduce((s, it) => s + it.price * it.qty, 0);
    const ship = 60;
    const orderId = "o_" + Date.now().toString(16);

    const orders = MiniShop.getOrders();
    orders.unshift({
      id: orderId,
      createdAt: Date.now(),
      user: session?.username || "guest",
      buyer: { name, phone, addr },
      items: orderItems,
      subTotal: sub,
      shipping: ship,
      total: sub + ship,
      status: "已成立"
    });
    MiniShop.setOrders(orders);

    localStorage.setItem("minishop_last_order_id", orderId);
    MiniShop.setCart({});

    MiniShop.toast("", "下單成功", "訂單已建立");

    const isAdmin = session?.username === "a1" && session?.role === "admin";
    setTimeout(() => {
      location.href = isAdmin ? "./admin.html" : "./order_success.html";
    }, 900);
  });

  function escapeHTML(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  updateBadge();
  render();
});
