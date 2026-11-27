# Cakes Appeal

## Jalankan toko

```bash
npm run dev
```

Buka alamat yang tercetak di Terminal. **Pesan sekarang** membuka pilihan kue. Setelah mengecek ringkasan, **Beli sekarang** membuka draf langsung ke kontak WhatsApp Cakes Appeal. Nama, alamat, catatan, dan rincian produk ikut terisi.

## Publikasikan toko

```bash
npm run build
```

Unggah folder `dist/` lewat [Netlify Drop](https://app.netlify.com/drop). Jalankan `npm run preview` untuk menguji build di Mac. Jika sudah punya URL toko, gunakan `CAKES_APPEAL_SITE_URL=https://alamat-situs-lo/ npm run build` supaya metadata share memakai URL tersebut. `npm run build:store` juga tersedia dan menulis hasilnya ke `dist-store/`.

Ikon WhatsApp di footer membuka draf pertanyaan tentang menu.

## Katalog GitHub Pages

Workflow **Deploy Cakes Appeal Catalog** memakai `npm run build:pages` dan menerbitkan `dist-pages/`. Katalog berisi produk dan estimasi, dengan tautan WhatsApp, LINE, dan Instagram di footer. Setelah commit dan push, buka [workflow Pages](https://github.com/nandomaul/Cakes-Appeal/actions/workflows/pages.yml) dan pilih **Run workflow** jika sumber Pages adalah GitHub Actions. [Batas penggunaan GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)

## Edit proyek

`src/catalog.js` berisi daftar produk, harga, dan varian. Logo ada di `assets/logo.png`, foto di `assets/images/`, dan gambar share di `assets/images/share-cakes-appeal-v3.jpg`.

Jika sumber animasi `src/motion.tailwind.css` berubah, jalankan `npm install` sekali lalu `npm run build:motion` untuk memperbarui CSS.
