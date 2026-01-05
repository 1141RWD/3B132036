// js/admin.js
document.addEventListener("DOMContentLoaded", () => {
  MiniShop.ensureDemo();
  MiniShop.initTheme();

  document.getElementById("themeBtn")?.addEventListener("click", MiniShop.toggleTheme);

  const badge = document.getElementById("cartBadge");
  const listEl = document.getElementById("adminProductList");
  const orderEl = document.getElementById("orderList");
  const adminQ = document.getElementById("adminQ");

  const modal = document.getElementById("modal");
  const form = document.getElementById("productForm");

  const openAddBtn = document.getElementById("openAddBtn");
  const resetDemoBtn = document.getElementById("resetDemoBtn");
  const clearOrdersBtn = document.getElementById("clearOrdersBtn");

  const imgInput = document.getElementById("pimage");          // <input type="file">
  const imgPreview = document.getElementById("pimagePreview"); // <img> 預覽

  function updateBadge() {
    if (badge) badge.textContent = String(MiniShop.cartCount());
  }

  function setPreview(src) {
    if (!imgPreview) return;
    if (src) {
      imgPreview.src = src;
      imgPreview.classList.remove("hidden");
    } else {
      imgPreview.removeAttribute("src");
      imgPreview.classList.add("hidden");
    }
  }

  function openModal(product) {
    if (!modal) return;

    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    document.getElementById("pid").value = product?.id || "";
    document.getElementById("pname").value = product?.name || "";
    document.getElementById("pcat").value = product?.category || "";
    document.getElementById("pprice").value = String(product?.price ?? "");
    document.getElementById("pstock").value = String(product?.stock ?? "");
    document.getElementById("pdesc").value = product?.desc || "";
    document.getElementById("ptag").value = product?.tag || "";
    document.getElementById("pbadge").value = String(product?.popularity ?? "");

    // ✅ file input 不能預填，所以打開視窗一定要清空
    if (imgInput) imgInput.value = "";

    // ✅ 用 imgPreview 顯示目前已存的圖片（這才是「編輯時顯示圖片」的正解）
    setPreview(product?.img || "");
  }

  function closeModal() {
    modal?.classList.add("hidden");
    document.body.style.overflow = "";
  }

  modal?.addEventListener("click", (e) => {
    const target = e.target;
    if (target?.dataset?.close === "1") closeModal();
  });

  openAddBtn?.addEventListener("click", () => openModal(null));

  resetDemoBtn?.addEventListener("click", () => {
    localStorage.removeItem(MiniShop.LS.PRODUCTS);
    localStorage.removeItem(MiniShop.LS.CART);
    localStorage.removeItem(MiniShop.LS.ORDERS);
    MiniShop.ensureDemo();
    MiniShop.toast("", "已重置", "示範資料已恢復");
    renderProducts();
    renderOrders();
    updateBadge();
  });

  clearOrdersBtn?.addEventListener("click", () => {
    MiniShop.setOrders([]);
    MiniShop.toast("", "已清空", "訂單列表已清空");
    renderOrders();
  });

  adminQ?.addEventListener("input", renderProducts);

  // ✅ 選到新圖片就立刻預覽（但是否存檔要按「儲存」才會真的寫進 products）
  imgInput?.addEventListener("change", async () => {
    const f = imgInput.files?.[0];
    if (!f) {
      // 如果使用者取消選檔，就維持原本預覽（不要硬清空）
      return;
    }
    const dataURL = await fileToDataURLResized(f, 700, 0.82);
    setPreview(dataURL);
  });

  // ✅ submit 改 async：才能 await 圖片轉 dataURL
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("pid").value.trim();
    const name = document.getElementById("pname").value.trim();
    const category = document.getElementById("pcat").value.trim();
    const price = Number(document.getElementById("pprice").value);
    const stock = Number(document.getElementById("pstock").value);
    const desc = document.getElementById("pdesc").value.trim();
    const tag = document.getElementById("ptag").value.trim();
    const popularity = Number(document.getElementById("pbadge").value) || 50;

    if (!name || !category || !Number.isFinite(price) || !Number.isFinite(stock)) {
      MiniShop.toast("warn", "資料不完整", "請確認名稱/分類/價格/庫存");
      return;
    }
    if (price < 0 || stock < 0) {
      MiniShop.toast("warn", "數值錯誤", "價格與庫存不能小於 0");
      return;
    }

    const products = MiniShop.getProducts();

    // ✅ 如果有選新圖片才轉，沒選就維持原本
    let newImg = "";
    const f = imgInput?.files?.[0] || null;
    if (f) newImg = await fileToDataURLResized(f, 700, 0.82);

    if (id) {
      const idx = products.findIndex((p) => p.id === id);
      if (idx === -1) {
        MiniShop.toast("danger", "更新失敗", "找不到要更新的商品");
        return;
      }

      products[idx] = {
        ...products[idx],              // ✅ 修正：保留原欄位
        name, category, price, stock, desc, tag, popularity,
        img: newImg || products[idx].img || "" // ✅ 沒選新圖就保留舊圖
      };

      MiniShop.setProducts(products);
      MiniShop.toast("", "已更新商品", name);
    } else {
      products.unshift({
        id: MiniShop.uid(),
        name, category, price, stock, desc, tag, popularity,
        img: newImg,                   // ✅ 新增時存圖片（可為空）
        createdAt: Date.now()
      });

      MiniShop.setProducts(products);
      MiniShop.toast("", "已新增商品", name);
    }

    closeModal();
    renderProducts();
  });

  function renderProducts() {
    if (!listEl) return;

    const keyword = (adminQ?.value || "").trim().toLowerCase();
    let products = MiniShop.getProducts();

    if (keyword) {
      products = products.filter((p) => (p.name || "").toLowerCase().includes(keyword));
    }

    listEl.innerHTML = products.map(p => `
      <div class="adminItem">
        <div class="adminItem__top">
          <div style="display:flex; gap:10px; align-items:flex-start">
            ${
              p.img
                ? `<div style="width:54px;height:54px;border-radius:14px;border:1px solid var(--line);background:url('${escapeAttr(p.img)}') center/cover no-repeat;"></div>`
                : `<div style="width:54px;height:54px;border-radius:14px;border:1px solid var(--line);background:rgba(255,255,255,.05);display:grid;place-items:center" class="muted tiny">無圖</div>`
            }
            <div>
              <div style="font-weight:900">${escapeHTML(p.name)}</div>
              <div class="muted tiny">${escapeHTML(p.category)} ・ ${MiniShop.money(p.price)} ・ 庫存 ${Number(p.stock)||0}</div>
              <div class="muted tiny">人氣：${Number(p.popularity)||0} ・ ${p.tag ? "標籤："+escapeHTML(p.tag)+" ・ " : ""}ID：${escapeHTML(p.id)}</div>
            </div>
          </div>
          <div class="adminItem__actions">
            <button class="btn btn--ghost btn--sm" type="button" data-edit="${escapeAttr(p.id)}">編輯</button>
            <button class="btn btn--ghost btn--sm" type="button" data-del="${escapeAttr(p.id)}">刪除</button>
          </div>
        </div>
        ${p.desc ? `<div class="muted tiny" style="margin-top:8px">${escapeHTML(p.desc)}</div>` : ""}
      </div>
    `).join("");

    listEl.querySelectorAll("[data-edit]").forEach((b) => {
      b.addEventListener("click", () => {
        const id = b.dataset.edit;
        const p = MiniShop.getProducts().find(x => x.id === id);
        if (!p) return MiniShop.toast("danger", "找不到商品", "可能已被刪除");
        openModal(p);
      });
    });

    listEl.querySelectorAll("[data-del]").forEach((b) => {
      b.addEventListener("click", () => delProduct(b.dataset.del));
    });
  }

  function delProduct(id) {
    const products = MiniShop.getProducts();
    const p = products.find((x) => x.id === id);
    if (!p) {
      MiniShop.toast("danger", "刪除失敗", "商品不存在");
      return;
    }

    const cart = MiniShop.getCart();
    if (cart[id]) {
      delete cart[id];
      MiniShop.setCart(cart);
      updateBadge();
    }

    MiniShop.setProducts(products.filter((x) => x.id !== id));
    MiniShop.toast("", "已刪除商品", p.name);
    renderProducts();
  }

  function renderOrders() {
    if (!orderEl) return;

    const orders = MiniShop.getOrders();
    if (orders.length === 0) {
      orderEl.innerHTML = `
        <div class="orderItem">
          <div style="font-weight:900">目前沒有訂單</div>
          <div class="muted tiny">你可以到「購物車」送出訂單，這裡就會出現。</div>
        </div>
      `;
      return;
    }

    orderEl.innerHTML = orders.map(o => `
      <div class="orderItem">
        <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start">
          <div>
            <div style="font-weight:900">訂單 ${escapeHTML(o.id)} ・ <span class="tag">${escapeHTML(o.status)}</span></div>
            <div class="muted tiny">時間：${new Date(o.createdAt).toLocaleString("zh-Hant-TW")}</div>
            <div class="muted tiny">收件人：${escapeHTML(o.buyer?.name||"")}｜${escapeHTML(o.buyer?.phone||"")}</div>
            <div class="muted tiny">地址：${escapeHTML(o.buyer?.addr||"")}</div>
          </div>
          <div style="text-align:right">
            <div class="price">${MiniShop.money(o.total)}</div>
            <div class="muted tiny">小計 ${MiniShop.money(o.subTotal)} + 運費 ${MiniShop.money(o.shipping)}</div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="muted tiny">
          ${o.items.map(it => `${escapeHTML(it.name)} x${it.qty}（${MiniShop.money(it.price)}）`).join("、")}
        </div>
      </div>
    `).join("");
  }

  function escapeHTML(s) {
    return String(s)
      .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
      .replaceAll('"',"&quot;").replaceAll("'","&#039;");
  }
  function escapeAttr(s) {
    return escapeHTML(s).replaceAll("`","&#096;");
  }

  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ""));
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  async function fileToDataURLResized(file, maxW = 700, quality = 0.82) {
    const src = await fileToDataURL(file);
    if (!src.startsWith("data:image/")) return src;

    const img = new Image();
    img.src = src;
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
    });

    const scale = Math.min(1, maxW / img.width);
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(img, 0, 0, w, h);

    return canvas.toDataURL("image/jpeg", quality);
  }

  updateBadge();
  renderProducts();
  renderOrders();
});
