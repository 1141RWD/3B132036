// js/app.js
document.addEventListener("DOMContentLoaded", () => {
  MiniShop.ensureDemo();
  MiniShop.initTheme();

  const themeBtn = document.getElementById("themeBtn");
  themeBtn?.addEventListener("click", MiniShop.toggleTheme);

  const badge = document.getElementById("cartBadge");
  const grid = document.getElementById("productGrid");
  const q = document.getElementById("q");
  const category = document.getElementById("category");
  const sort = document.getElementById("sort");

  function updateBadge(){
    if(badge) badge.textContent = String(MiniShop.cartCount());
  }

  function uniqueCategories(products){
    const s = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(s);
  }

  function fillCategories(products){
    if(!category) return;
    const cats = uniqueCategories(products);
    category.innerHTML =
      `<option value="all">全部分類</option>` +
      cats.map(c => `<option value="${escapeAttr(c)}">${escapeHTML(c)}</option>`).join("");
  }

  function escapeHTML(s){
    return String(s)
      .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
      .replaceAll('"',"&quot;").replaceAll("'","&#039;");
  }
  function escapeAttr(s){
    return escapeHTML(s).replaceAll("`","&#096;");
  }
  function cssUrlSafe(s){
    return String(s).replaceAll("\\", "\\\\").replaceAll("'", "\\'");
  }

  function render(){
    if(!grid) return;

    const products = MiniShop.getProducts();
    fillCategories(products);

    const keyword = (q?.value || "").trim().toLowerCase();
    const cat = category?.value || "all";
    const mode = sort?.value || "popular";

    let list = products.slice();

    if(keyword){
      list = list.filter(p => (p.name||"").toLowerCase().includes(keyword));
    }
    if(cat !== "all"){
      list = list.filter(p => p.category === cat);
    }

    if(mode === "priceAsc") list.sort((a,b)=> (a.price||0) - (b.price||0));
    if(mode === "priceDesc") list.sort((a,b)=> (b.price||0) - (a.price||0));
    if(mode === "newest") list.sort((a,b)=> (b.createdAt||0) - (a.createdAt||0));
    if(mode === "popular") list.sort((a,b)=> (b.popularity||0) - (a.popularity||0));

    grid.innerHTML = list.map(p => cardHTML(p)).join("");

    grid.querySelectorAll("[data-add]").forEach(btn => {
      btn.addEventListener("click", () => addToCart(btn.getAttribute("data-add")));
    });
  }

  function cardHTML(p){
    const stock = Number(p.stock) || 0;
    const disabled = stock <= 0 ? "disabled" : "";
    const tag = (p.tag || "").trim();

    const mediaStyle = p.img
      ? `style="background-image:url('${cssUrlSafe(p.img)}');background-size:cover;background-position:center;"`
      : "";

    return `
      <article class="product">
        <div class="product__media" role="img" aria-label="${escapeAttr(p.name)} 形象圖" ${mediaStyle}></div>
        <div class="product__body">
          <h3 class="product__title">${escapeHTML(p.name)}</h3>
          <div class="product__meta">
            <span class="price">${MiniShop.money(p.price)}</span>
            ${tag ? `<span class="tag">${escapeHTML(tag)}</span>` : `<span class="tag">${escapeHTML(p.category||"")}</span>`}
          </div>
          <p class="muted tiny" style="margin:10px 0 0">${escapeHTML(p.desc || "")}</p>
          <div class="stock">庫存：${stock}</div>
          <div style="display:flex; gap:10px; margin-top:10px; flex-wrap:wrap">
            <button class="btn btn--primary" ${disabled} data-add="${escapeAttr(p.id)}">
              ${stock <= 0 ? "已售完" : "加入購物車"}
            </button>
            <a class="btn btn--ghost" href="./cart.html">去結帳</a>
          </div>
        </div>
      </article>
    `;
  }

  function addToCart(pid){
    const products = MiniShop.getProducts();
    const p = products.find(x => x.id === pid);
    if(!p){
      MiniShop.toast("danger", "加入失敗", "商品不存在");
      return;
    }
    if((Number(p.stock)||0) <= 0){
      MiniShop.toast("warn", "庫存不足", "這個商品目前已售完");
      return;
    }

    const cart = MiniShop.getCart();
    const nextQty = (Number(cart[pid])||0) + 1;

    if(nextQty > (Number(p.stock)||0)){
      MiniShop.toast("warn", "超過庫存", "數量已達庫存上限");
      return;
    }

    cart[pid] = nextQty;
    MiniShop.setCart(cart);
    updateBadge();
    MiniShop.toast("", "已加入購物車", `${p.name} x${nextQty}`);
  }

  q?.addEventListener("input", render);
  category?.addEventListener("change", render);
  sort?.addEventListener("change", render);

  updateBadge();
  render();
});
