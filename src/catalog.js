const options = (pairs) => pairs.map(([label, price = 0]) => ({ label, price }));

const birthdayDecor = options([
  ["Buttercream", 75000], ["Whipped Cream", 100000],
  ["Chocolate Ganache (Dripcake)", 100000], ["Fondant", 175000],
  ["Edible Image", 80000], ["Hias Karakter Cake", 75000],
]);
const ketoDecor = options([["Full Basic Frosting dengan Whipped Cream", 100000]]);

function ketoItem(id, name, price, note = "") {
  return { id, name, kind: "simple", categories: ["keto"], series: "Keto", price, note, leadDays: 3 };
}

export const catalog = [
  {
    id: "birthday-cake", name: "Birthday Cake", kind: "cake", categories: ["birthday"],
    series: "Non-Keto", description: "Pilih bentuk, ukuran, rasa, dan dekor untuk ulang tahunmu.", leadDays: 7,
    shapes: {
      Bulat: options([["20 cm", 325000], ["22 cm", 440000], ["24 cm", 545000], ["28 cm", 655000]]),
      Kotak: options([["20 cm", 345000], ["22 cm", 455000], ["24 cm", 565000], ["28 cm", 675000]]),
    },
    flavors: options([["Vanilla"], ["Chocolate"], ["Mocca"], ["Green Tea"], ["Red Velvet (Cream Cheese)", 30000]]),
    decor: birthdayDecor, photos: ["birthday-cake.jpg", "birthday-slice.jpg"],
  },
  {
    id: "millecrepes", name: "Millecrepes Cake", kind: "millecrepes", categories: ["millecrepes"],
    series: "Non-Keto", description: "Kue lapis crepe ukuran 22 cm. Pilih rasa dan tambah dekor sesuai selera.", leadDays: 7,
    flavors: options([
      ["Vanilla", 330000], ["Greentea", 360000], ["Oreo", 360000], ["Chocolate", 360000],
      ["Cheese", 420000], ["Red Velvet", 420000], ["Nutella", 420000],
    ]),
    decor: options([["Whipcream Swirl Full", 50000], ["Buttercream Swirl dan Wafer", 75000], ["Edible Image", 75000]]),
    photos: ["millecrepes.jpg", "millecrepes-slice.jpg"],
  },
  {
    id: "keto-birthday", name: "Birthday Cake Keto", kind: "cake", categories: ["birthday", "keto"],
    series: "Keto", description: "Kue ulang tahun dengan base keto. Tersedia dalam empat pilihan rasa.", leadDays: 3,
    sizes: options([["16 cm", 440000], ["20 cm", 540000], ["24 cm", 640000]]),
    flavors: options([["Vanilla"], ["Chocolate"], ["Pandan"], ["Mocha"]]),
    decor: ketoDecor,
  },
  {
    id: "keto-red-velvet", name: "Red Velvet Keto", kind: "cake", categories: ["birthday", "keto"],
    series: "Keto", description: "Red velvet dengan cream cheese. Pilih diameter kue sesuai kebutuhan.", leadDays: 3,
    sizes: options([["16 cm", 550000], ["20 cm", 690000], ["24 cm", 790000]]),
    flavor: "Red Velvet (Cream Cheese)", decor: ketoDecor,
  },
  ketoItem("classic-bread", "Classic Bread", 85000),
  ketoItem("dinner-roll", "Dinner Roll", 85000, "Min. 10 pcs"),
  ketoItem("cream-cheese-brownies", "Cream Cheese Brownies", 105000),
  ketoItem("brownies", "Brownies", 90000),
  ketoItem("tuna-roll", "Tuna Roll Cake", 225000),
  ketoItem("chocolate-roll", "Chocolate Roll Cake", 225000),
  ketoItem("cheese-roll", "Cheese Roll Cake", 225000),
  ketoItem("quiche", "Smoked Beef Cheese Quiche", 195000),
  ketoItem("cheese-tart", "Cheese Tart", 225000),
  ketoItem("kastangel", "Kastangel Cookies", 200000),
];

export const shipping = options([
  ["Tentukan nanti"], ["Kurir Kue", 100000], ["Kurir online"], ["Ambil sendiri"],
]);

const currencyFormat = new Intl.NumberFormat("id-ID");
const dateFormat = new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "UTC" });
const jakartaDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit",
});
const parseDay = (value) => new Date(value + "T00:00:00Z");
export const rupiah = (amount) => "Rp" + currencyFormat.format(amount);
export const formatDate = (value) => dateFormat.format(parseDay(value));

export function firstOrderDate(leadDays, now = new Date()) {
  const parts = Object.fromEntries(jakartaDate.formatToParts(now).map(({ type, value }) => [type, value]));
  const date = parseDay(parts.year + "-" + parts.month + "-" + parts.day);
  date.setUTCDate(date.getUTCDate() + leadDays);
  return date.toISOString().slice(0, 10);
}

export const sizesFor = (product, shape) => product.shapes?.[shape] ?? product.sizes;
export function startingPrice(product) {
  const sizes = product.shapes ? Object.values(product.shapes).flat() : product.sizes;
  return product.price ?? Math.min(...(sizes ?? product.flavors).map(({ price }) => price));
}

export function estimate(product, selection) {
  const { shape, size, flavor, decor = [], delivery = 0 } = selection;
  const isMillecrepes = product.kind === "millecrepes";
  const chosenSize = sizesFor(product, shape)?.[size];
  const chosenFlavor = product.flavors?.[flavor];
  const chosenDecor = decor.map((index) => product.decor[index]);
  const chosenDelivery = shipping[delivery];
  const base = product.price ?? chosenSize?.price ?? chosenFlavor.price;
  const flavorCharge = isMillecrepes ? 0 : chosenFlavor?.price ?? 0;
  const decorCharge = chosenDecor.reduce((amount, entry) => amount + entry.price, 0);

  return {
    size: isMillecrepes ? "22 cm" : [shape ?? (chosenSize ? "Bulat" : ""), chosenSize?.label].filter(Boolean).join(" "),
    flavor: chosenFlavor?.label ?? product.flavor,
    decor: chosenDecor.map(({ label }) => label),
    delivery: chosenDelivery.label,
    base, flavorCharge, decorCharge, deliveryCharge: chosenDelivery.price,
    total: base + flavorCharge + decorCharge + chosenDelivery.price,
  };
}
