import { catalog, estimate, firstOrderDate, formatDate, rupiah, shipping, sizesFor, startingPrice } from "./catalog.js";
import { addToCart, cartLine, cartSummary, changeQuantity, defaultSelection, readCart, saveCart } from "./cart.js";

const find = (selector) => document.querySelector(selector);
const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const picture = (file) => "./assets/images/" + file;
const productPhoto = (product) => picture(product.id + ".jpg");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const products = find("#products");
const search = find("#product-search");
const more = find("#more");
const filters = document.querySelectorAll("[data-category]");
const sheet = find("#shop-sheet");
const itemForm = find("#item-form");
const orderForm = find("#order-form");
const cartItems = find("#cart-items");
const dateInput = find("#event-date");
const dateError = find("#date-error");
const delivery = find("#delivery");
const isCatalog = document.documentElement.hasAttribute("data-catalog");
const whatsappContact = find("#whatsapp-contact");
const whatsappBase = whatsappContact.href;
const sendOrder = isCatalog ? null : find("#submit-whatsapp");
const copyOrder = isCatalog ? null : find("#copy-order");
const dock = find(".dock");
const dockHighlight = find(".dock-highlight");
const copyStatus = find("#copy-status");
const photo = find("#active-photo");
const photoButtons = find("#photo-buttons");
const toast = find("#toast");

let category = "all";
let showAll = false;
let activeProduct;
let activePhotos = [];
let lines = readCart();
let toastTimer;
let destination = location.hash === "#menu" ? "menu" : "home";

function updateDock(route) {
  if (dock.dataset.active !== route) moveDockHighlight(route);
  for (const link of dock.querySelectorAll("[data-route]")) {
    if (link.dataset.route === route) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  }
}

function moveDockHighlight(route) {
  if (reduceMotion.matches) {
    dock.dataset.active = route;
    return;
  }
  const from = dockHighlight.getBoundingClientRect();
  dockHighlight.getAnimations().forEach((animation) => animation.cancel());
  dock.dataset.active = route;
  const to = dockHighlight.getBoundingClientRect();
  const distance = from.left - to.left;
  if (!from.width || !to.width || Math.abs(distance) < 1) return;

  const stretch = Math.min(Math.abs(distance) * 0.46, to.width * 0.55);
  const middle = distance * 0.39 - (distance > 0 ? stretch : 0);
  const frame = (x, scale, offset) => ({ transform: `translateX(${x}px) scaleX(${scale})`, offset });
  dockHighlight.animate([
    frame(distance, from.width / to.width, 0),
    frame(middle, 1 + stretch / to.width, 0.45),
    frame(distance > 0 ? -4 : 4, 1.08, 0.76),
    frame(0, 1, 1),
  ], { duration: 460, easing: "cubic-bezier(.22,.8,.25,1)" });
}

function replayMotion(element, animation) {
  if (reduceMotion.matches) return;
  element.classList.remove(animation);
  void element.offsetWidth;
  element.classList.add(animation);
}

function selectDestination(route) {
  destination = route;
  updateDock(route);
}

function renderMenu({ append = false } = {}) {
  const query = search.value.trim().toLocaleLowerCase("id");
  const matches = catalog.filter((product) =>
    (category === "all" || product.categories.includes(category)) &&
    (product.name + " " + product.series).toLocaleLowerCase("id").includes(query));
  const isFeatured = category === "all" && !query && !showAll;
  const visible = isFeatured ? matches.slice(0, 4) : matches;
  const added = append ? visible.slice(products.childElementCount) : visible;

  const cards = added.map((product, index) => `
    <article class="product-card motion-safe:animate-card-in" style="--card-delay:${Math.min(index, 7) * 24}ms">
      <button class="product-link" type="button" data-product="${product.id}" aria-label="Lihat ${product.name}">
        <img class="product-photo" src="${productPhoto(product)}" width="1265" height="621" loading="lazy" alt="">
        <span class="product-name">${product.name}</span>
      </button>
      <div class="card-body">
        <span class="product-meta">${product.note ? product.series + " · " + product.note : product.series}</span>
        <div class="card-bottom">
          <span class="price">${product.price ? "" : '<small>Mulai</small> '}${rupiah(startingPrice(product))}</span>
          <button class="add-button icon-button" type="button" data-add="${product.id}" aria-label="Tambah ${product.name}">
            ${icon("plus")}
          </button>
        </div>
      </div>
    </article>`).join("");

  if (append) products.insertAdjacentHTML("beforeend", cards);
  else products.innerHTML = cards || '<p class="no-results">Produk belum ditemukan. Coba kata kunci atau kategori lain.</p>';

  more.hidden = !isFeatured;
  find("#menu-heading").textContent = query ? "Hasil pencarian" : isFeatured ? "Menu pilihan" : "Menu Cakes Appeal";
  find("#menu-status").textContent = (isFeatured ? visible.length + " dari " : "") + matches.length + " produk";
}

for (const filter of filters) {
  filter.addEventListener("click", () => {
    if (category === filter.dataset.category && !showAll) return;
    category = filter.dataset.category;
    showAll = false;
    for (const button of filters) button.setAttribute("aria-pressed", String(button === filter));
    renderMenu();
  });
}

search.addEventListener("input", () => renderMenu());
more.addEventListener("click", (event) => {
  const firstNewIndex = products.childElementCount;
  showAll = true;
  renderMenu({ append: true });
  const firstNewProduct = products.children[firstNewIndex]?.querySelector(".product-link");
  firstNewProduct?.focus({ preventScroll: true });
  if (event.detail === 0) firstNewProduct?.scrollIntoView({ block: "nearest" });
});

function optionText(item, absolutePrice = false) {
  return item.label + (item.price ? " · " + (absolutePrice ? "" : "+") + rupiah(item.price) : "");
}

function sizeMarkup(sizes, selected = 0) {
  return sizes.map((item, index) => `
    <label class="choice">
      <input type="radio" name="size" value="${index}" ${index === selected ? "checked" : ""}>
      <span><b>${item.label}</b><small class="price">${rupiah(item.price)}</small></span>
    </label>`).join("");
}

function renderProductForm(product, choices) {
  const shapes = Object.keys(product.shapes ?? {});
  const sizes = sizesFor(product, choices.shape);
  itemForm.innerHTML = [
    shapes.length ? `<fieldset><legend>Bentuk kue</legend><div class="shape-options">
      ${shapes.map((shape, index) => `<label class="choice">
        <input type="radio" name="shape" value="${shape}" ${index ? "" : "checked"}>
        <span>${shape}</span></label>`).join("")}
      </div></fieldset>` : "",
    sizes ? `<fieldset><legend>Ukuran</legend><div class="size-options" id="size-options">${sizeMarkup(sizes)}</div></fieldset>` : "",
    product.kind === "millecrepes" ? '<p class="fixed-option"><strong>Ukuran</strong> 22 cm</p>' : "",
    product.flavors ? `<label class="field">Rasa<select name="flavor">${product.flavors.map((item, index) =>
      `<option value="${index}">${optionText(item, product.kind === "millecrepes")}</option>`).join("")}</select></label>` : "",
    product.flavor ? `<p class="fixed-option"><strong>Rasa</strong> ${product.flavor}</p>` : "",
    product.decor ? `<fieldset><legend>Tambahan dekor</legend><div class="decor-options">
      ${product.decor.map((item, index) => `<label class="decor-choice">
        <input type="checkbox" name="decor" value="${index}"><span>${item.label}</span>
        <small class="price">+${rupiah(item.price)}</small>
      </label>`).join("")}
      </div></fieldset>` : "",
  ].join("");
}

function setPhoto(index) {
  photo.src = picture(activePhotos[index]);
  photo.alt = activeProduct.name + (index ? " dalam tampilan potongan" : "");
  for (const button of photoButtons.children) {
    button.setAttribute("aria-pressed", String(Number(button.dataset.photo) === index));
  }
  if (!reduceMotion.matches) {
    photo.getAnimations().forEach((animation) => animation.cancel());
    photo.animate([{ opacity: 0.72, scale: 0.988 }, { opacity: 1, scale: 1 }], {
      duration: 300, easing: "cubic-bezier(.22, .8, .25, 1)",
    });
  }
}

photoButtons.addEventListener("click", (event) => {
  const button = event.target.closest("[data-photo]");
  if (button) setPhoto(Number(button.dataset.photo));
});

function showView(name) {
  const view = find("#" + name + "-view");
  for (const panel of sheet.querySelectorAll(".sheet-view")) panel.hidden = panel !== view;
  sheet.setAttribute("aria-labelledby", name + "-title");
  if (!sheet.open) sheet.showModal();
  if (name !== "product") updateDock("cart");
  view.querySelector(".sheet-scroll").scrollTop = 0;
  find("#" + name + "-title").focus({ preventScroll: true });
}

function openProduct(product) {
  activeProduct = product;
  const { name, description, note, series, photos } = product;
  find("#product-title").textContent = name;
  find("#product-series").textContent = series;
  find("#product-description").textContent = description ?? note ?? "";
  find("#product-description").hidden = !description && !note;

  activePhotos = photos ?? [product.id + ".jpg"];
  photoButtons.hidden = activePhotos.length < 2;
  photoButtons.innerHTML = activePhotos.map((file, index) => `
    <button type="button" data-photo="${index}" aria-label="${index ? "Foto potongan" : "Foto utama"}">
      <img src="${picture(file)}" alt="" width="44" height="44">
    </button>`).join("");
  setPhoto(0);

  const choices = defaultSelection(product);
  renderProductForm(product, choices);
  find("#item-total").value = rupiah(estimate(product, choices).total);
  showView("product");
}

function getSelection() {
  const fields = new FormData(itemForm);
  return {
    shape: fields.get("shape"),
    size: Number(fields.get("size")),
    flavor: Number(fields.get("flavor")),
    decor: fields.getAll("decor").map(Number),
  };
}

itemForm.addEventListener("change", (event) => {
  const choices = getSelection();
  if (event.target.name === "shape") {
    find("#size-options").innerHTML = sizeMarkup(sizesFor(activeProduct, choices.shape), choices.size);
  }
  find("#item-total").value = rupiah(estimate(activeProduct, choices).total);
});

function updateBadge(count) {
  for (const badge of document.querySelectorAll("[data-cart-count]")) {
    const changed = badge.textContent !== String(count);
    badge.hidden = count === 0;
    badge.textContent = count;
    if (changed && count) replayMotion(badge, "motion-safe:animate-badge-in");
  }
  for (const button of document.querySelectorAll("[data-open-cart]:not(.text-button)")) {
    button.setAttribute("aria-label", count ? "Keranjang, " + count + " item" : "Keranjang");
  }
}

function setLines(updated) {
  lines = updated;
  saveCart(lines);
  updateBadge(cartSummary(lines).count);
}

function notifyAdded(productName) {
  clearTimeout(toastTimer);
  toast.querySelector("span").textContent = productName + " ditambahkan.";
  toast.hidden = false;
  replayMotion(toast, "motion-safe:animate-toast-in");
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3800);
}

itemForm.addEventListener("submit", (event) => {
  event.preventDefault();
  setLines(addToCart(lines, cartLine(activeProduct.id, getSelection())));
  openCart();
});

function showDateError(text = "") {
  dateError.hidden = !text;
  dateError.textContent = text;
  if (text) dateInput.setAttribute("aria-invalid", "true");
  else dateInput.removeAttribute("aria-invalid");
}

delivery.innerHTML = shipping.map((item, index) =>
  `<option value="${index}">${optionText(item)}</option>`).join("");

function currentOrder() {
  return cartSummary(lines, Number(delivery.value));
}

function renderCart() {
  const { items, count, leadDays, total } = currentOrder();
  const isEmpty = !count;
  find("#cart-caption").textContent = count ? count + " item" : "";
  find("#cart-empty").hidden = !isEmpty;
  find("#add-more").hidden = isEmpty;
  cartItems.hidden = isEmpty;
  orderForm.hidden = isEmpty;
  find("#cart-bar").hidden = isEmpty;
  find("#cart-total").value = rupiah(total);
  dateInput.min = isEmpty ? "" : firstOrderDate(leadDays);
  find("#date-note").textContent = isEmpty ? "" : "Pemesanan minimal H-" + leadDays + ".";
  cartItems.innerHTML = items.map(({ product, variant, quantity, amount }, index) => `
    <li class="cart-line">
      <img src="${productPhoto(product)}" alt="" width="64" height="64">
      <div class="cart-main">
        <strong>${product.name}</strong>
        <p>${[variant.size, variant.flavor, ...variant.decor, product.note].filter(Boolean).join(" · ") || product.series}</p>
        <div class="line-bottom">
          <span class="price">${rupiah(amount)}</span>
          <div class="stepper">
            <button type="button" data-row="${index}" data-delta="-1" aria-label="${quantity === 1 ? "Hapus" : "Kurangi jumlah"} ${product.name}">${icon("minus")}</button>
            <span class="stepper-count" aria-label="Jumlah ${quantity}">${quantity}</span>
            <button type="button" data-row="${index}" data-delta="1" aria-label="Tambah jumlah ${product.name}">${icon("plus")}</button>
          </div>
        </div>
      </div>
    </li>`).join("");
}

function openCart() {
  toast.hidden = true;
  renderCart();
  showDateError();
  showView("cart");
}

cartItems.addEventListener("click", (event) => {
  const button = event.target.closest("[data-row]");
  if (!button) return;
  const { row, delta } = button.dataset;
  setLines(changeQuantity(lines, Number(row), Number(delta)));
  renderCart();
  showDateError();
  const next = cartItems.querySelector(`[data-row="${row}"][data-delta="${delta}"]`) ?? find("#cart-title");
  next.focus({ preventScroll: true });
});

document.addEventListener("click", (event) => {
  const route = event.target.closest("a[data-route]");
  if (route) selectDestination(route.dataset.route);
  if (event.target.closest("[data-open-cart]")) {
    openCart();
    return;
  }
  const add = event.target.closest("[data-add]");
  const detail = event.target.closest("[data-product]");
  const productId = add?.dataset.add ?? detail?.dataset.product;
  if (!productId) return;
  const product = catalog.find(({ id }) => id === productId);
  if (add && product.kind === "simple") {
    setLines(addToCart(lines, cartLine(product.id, defaultSelection(product))));
    notifyAdded(product.name);
    return;
  }
  openProduct(product);
});

delivery.addEventListener("change", () => { find("#cart-total").value = rupiah(currentOrder().total); });
dateInput.addEventListener("input", () => showDateError());
function checkoutDetails(fields, order) {
  const details = [
    ["Nama pemesan", fields.get("customer").trim() || "Belum diisi"],
    ["Alamat kirim", fields.get("address").trim() || "Belum diisi"],
    ["Catatan tambahan", fields.get("notes").trim() || "—"],
    ["Tanggal acara", formatDate(fields.get("date"))],
    ["Pengiriman", order.delivery.label + (order.delivery.price ? " (+" + rupiah(order.delivery.price) + ")" : "")],
  ];
  for (const [key, label] of [
    ["inscription", "Tulisan di kue"], ["phone", "HP pemesan"],
    ["recipient", "Nama penerima"], ["recipientPhone", "HP penerima"],
  ]) {
    const value = fields.get(key).trim();
    if (value) details.push([label, value]);
  }
  return details;
}

function orderMessage(order, details, pendingShipping) {
  const text = ["Halo Cakes Appeal! Saya mau pesan:", ""];
  for (const [index, { product, variant, quantity, amount }] of order.items.entries()) {
    text.push((index + 1) + ". " + product.name + " (" + product.series + ") ×" + quantity);
    if (product.note) text.push("   " + product.note);
    if (variant.size) text.push("   Ukuran: " + variant.size);
    if (variant.flavor) text.push("   Rasa: " + variant.flavor);
    if (variant.decor.length) text.push("   Dekor: " + variant.decor.join(", "));
    text.push("   Subtotal: " + rupiah(amount), "");
  }
  for (const [label, value] of details) text.push(label + ": " + value);
  const shippingNote = pendingShipping ? " (belum termasuk ongkir)" : "";
  text.push("Estimasi: " + rupiah(order.total) + shippingNote);
  text.push("", "Boleh dicek ketersediaan tanggal dan total akhirnya? Terima kasih!");
  return text.join("\n");
}

function whatsappDraft(base, text) {
  return base + "?text=" + encodeURIComponent(text);
}

function renderReview(fields, order) {
  const details = checkoutDetails(fields, order);
  const deliveryIndex = Number(fields.get("delivery"));
  const pendingShipping = deliveryIndex === 0 || deliveryIndex === 2;

  find("#review-items").innerHTML = order.items.map(({ product, variant, quantity, amount }) => `
    <li>
      <div><strong>${product.name} <span>×${quantity}</span></strong>
      <p>${[variant.size, variant.flavor, ...variant.decor, product.note].filter(Boolean).join(" · ") || product.series}</p></div>
      <span class="price">${rupiah(amount)}</span>
    </li>`).join("");
  find("#review-details").replaceChildren(...details.map(([label, value]) => {
    const row = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = value;
    row.append(term, description);
    return row;
  }));
  find("#review-total").value = rupiah(order.total);
  find("#review-shipping-note").hidden = !pendingShipping;
  if (sendOrder) {
    sendOrder.href = whatsappDraft(whatsappBase, orderMessage(order, details, pendingShipping));
    sendOrder.removeAttribute("aria-disabled");
  }
  copyStatus.textContent = "";
}

orderForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const order = currentOrder();
  if (!order.count) return;
  dateInput.min = firstOrderDate(order.leadDays);
  if (!dateInput.validity.valid) {
    showDateError(dateInput.value ? "Pilih tanggal mulai " + formatDate(dateInput.min) + "." : "Pilih tanggal acara.");
    dateInput.focus({ preventScroll: true });
    dateInput.scrollIntoView({ block: "center" });
    return;
  }
  showDateError();
  renderReview(new FormData(orderForm), order);
  showView("review");
});

find("#edit-order").addEventListener("click", openCart);
copyOrder?.addEventListener("click", async () => {
  if (!sendOrder.hasAttribute("href")) return;
  try {
    await navigator.clipboard.writeText(new URL(sendOrder.href).searchParams.get("text"));
    copyStatus.textContent = "Pesanan disalin.";
  } catch {
    copyStatus.textContent = "Gagal menyalin. Buka pesanan lewat WhatsApp.";
  }
});

async function closeSheet() {
  if (!sheet.open || sheet.classList.contains("closing")) return;
  if (!reduceMotion.matches) {
    sheet.classList.add("closing");
    await Promise.allSettled(sheet.getAnimations().map((animation) => animation.finished));
  }
  sheet.close();
  sheet.classList.remove("closing");
  updateDock(destination);
}
find("#close-sheet").addEventListener("click", closeSheet);
whatsappContact.href = whatsappDraft(whatsappBase, "Halo Cakes Appeal! Saya mau tanya tentang menunya.");
sheet.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeSheet();
});
sheet.addEventListener("click", (event) => {
  if (event.target === sheet) closeSheet();
});
for (const button of sheet.querySelectorAll("[data-browse-menu]")) {
  button.addEventListener("click", async () => {
    await closeSheet();
    selectDestination("menu");
    find("#menu").scrollIntoView();
    find("#menu-heading").focus({ preventScroll: true });
  });
}
window.addEventListener("storage", () => {
  lines = readCart();
  updateBadge(cartSummary(lines).count);
  if (sheet.open && !find("#cart-view").hidden) renderCart();
});

window.addEventListener("hashchange", () => {
  destination = location.hash === "#menu" ? "menu" : "home";
  if (!sheet.open) updateDock(destination);
});

updateDock(destination);
updateBadge(cartSummary(lines).count);
renderMenu();
