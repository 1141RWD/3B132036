// js/order_success.js
document.addEventListener("DOMContentLoaded", () => {
  MiniShop.ensureDemo();
  MiniShop.initTheme();
  document.getElementById("themeBtn")?.addEventListener("click", MiniShop.toggleTheme);

  const badge = document.getElementById("cartBadge");
  if (badge) badge.textContent = String(MiniShop.cartCount());

  const box = document.getElementById("successBox");
  if (!box) return;

  // 支援兩種取訂單方式：URL ?id=xxx 或 localStorage last order
  const params = new URLSearchParams(location.search);
  const idFromUrl = params.get("id");
  const lastId = localStorage.getItem("minishop_last_order_id");
  const orderId = idFromUrl || lastId;

  if (!orderId) {
    box.innerHTML = `
      <div class="orderItem">
        <div style="font-weight:1000">找不到訂單</div>
        <div class="muted tiny">可能你不是從結帳流程進來，或已清除瀏覽器資料。</div>
        <div class="divider"></div>
        <a class="btn btn--primary" href="./index.html">回到商城</a>
      </div>
    `;
    return;
  }

  const orders = MiniShop.getOrders();
  const o = orders.find(x => x.id === orderId);

  if (!o) {
    box.innerHTML = `
      <div class="orderItem">
        <div style="font-weight:1000">找不到訂單：${escapeHTML(orderId)}</div>
        <div class="muted tiny">訂單可能已被清空。</div>
        <div class="divider"></div>
        <a class="btn btn--primary" href="./index.html">回到商城</a>
      </div>
    `;
    return;
  }

  box.innerHTML = `
    <div class="orderItem">
      <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start">
        <div>
          <div style="font-weight:1000; font-size:18px;">訂單編號：${escapeHTML(o.id)}</div>
          <div class="muted tiny">成立時間：${new Date(o.createdAt).toLocaleString("zh-Hant-TW")}</div>
          <div class="divider"></div>
          <div style="font-weight:900">收件資訊</div>
          <div class="muted tiny">收件人：${escapeHTML(o.buyer?.name || "")}</div>
          <div class="muted tiny">電話：${escapeHTML(o.buyer?.phone || "")}</div>
          <div class="muted tiny">地址：${escapeHTML(o.buyer?.addr || "")}</div>
        </div>

        <div style="text-align:right">
          <div class="price" style="font-size:22px">${MiniShop.money(o.total)}</div>
          <div class="muted tiny">小計 ${MiniShop.money(o.subTotal)} + 運費 ${MiniShop.money(o.shipping)}</div>
          <div class="muted tiny">狀態：${escapeHTML(o.status || "已成立")}</div>
        </div>
      </div>

      <div class="divider"></div>
      <div style="font-weight:900; margin-bottom:6px;">商品明細</div>
      <div class="muted tiny">
        ${o.items.map(it => `${escapeHTML(it.name)} x${it.qty}（${MiniShop.money(it.price)}）`).join("、")}
      </div>

      <div class="divider"></div>
      <div class="stackRow">
        <a class="btn btn--ghost" href="./profile.html">查看歷史訂單</a>
        <a class="btn btn--primary" href="./index.html">繼續購物</a>
      </div>
    </div>
  `;
});

function escapeHTML(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
