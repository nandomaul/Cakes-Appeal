import { catalog, estimate, shipping, sizesFor } from "./catalog.js";

const byId = new Map(catalog.map((product) => [product.id, product]));
export const defaultSelection = (product) => ({
  shape: Object.keys(product.shapes ?? {})[0] ?? null,
  size: 0,
  flavor: 0,
  decor: [],
});

export function cartLine(productId, selection, quantity = 1) {
  const product = byId.get(productId);
  if (!product || !selection || !Number.isSafeInteger(quantity) || quantity < 1) return null;

  const defaults = defaultSelection(product);
  const shape = product.shapes && Object.hasOwn(product.shapes, selection.shape)
    ? selection.shape : defaults.shape;
  const sizes = sizesFor(product, shape);
  const getIndex = (index, options) => Number.isInteger(index) && options?.[index] ? index : 0;
  const validDecor = Array.isArray(selection.decor)
    ? selection.decor.filter((index) => Number.isInteger(index) && product.decor?.[index])
    : [];
  const choices = {
    shape,
    size: getIndex(selection.size, sizes),
    flavor: getIndex(selection.flavor, product.flavors),
    decor: [...new Set(validDecor)].sort((a, b) => a - b),
  };

  return { key: JSON.stringify([product.id, choices]), productId, selection: choices, quantity };
}

export function addToCart(lines, line) {
  if (!line) return lines;
  if (lines.some(({ key }) => key === line.key)) {
    return lines.map((entry) => entry.key === line.key
      ? { ...entry, quantity: entry.quantity + line.quantity }
      : entry);
  }
  return [...lines, line];
}

export function changeQuantity(lines, index, delta) {
  return lines.map((entry, position) => position === index
    ? { ...entry, quantity: entry.quantity + delta }
    : entry).filter(({ quantity }) => quantity > 0);
}

export function cartSummary(lines, deliveryIndex = 0) {
  const delivery = shipping[deliveryIndex];
  const items = lines.map((line) => {
    const product = byId.get(line.productId);
    const variant = estimate(product, line.selection);
    return { ...line, product, variant, amount: variant.total * line.quantity };
  });
  const subtotal = items.reduce((sum, { amount }) => sum + amount, 0);
  return {
    items,
    count: items.reduce((sum, { quantity }) => sum + quantity, 0),
    leadDays: items.reduce((days, { product }) => Math.max(days, product.leadDays), 0),
    delivery,
    total: subtotal + (items.length ? delivery.price : 0),
  };
}

const storageKey = "cakes-appeal-cart-v3";
export function readCart(storage) {
  try {
    const stored = JSON.parse((storage ?? globalThis.localStorage).getItem(storageKey));
    if (Array.isArray(stored)) {
      return stored.reduce((lines, entry) => {
        if (!entry) return lines;
        return addToCart(lines, cartLine(entry.productId, entry.selection, entry.quantity));
      }, []);
    }
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
  return [];
}

export function saveCart(lines, storage) {
  try {
    (storage ?? globalThis.localStorage).setItem(storageKey, JSON.stringify(lines));
  } catch {
    // Keep the cart usable for the current page if storage is unavailable.
  }
}
