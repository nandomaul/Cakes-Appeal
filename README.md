# Cakes Appeal · GitHub Pages

Proyek ini menyiapkan dua hasil build dari tampilan V4. `npm run build` menghasilkan demo interaktif di `dist/`. `npm run build:store` menghasilkan versi toko dengan pemesanan WhatsApp di `dist-store/`. GitHub Pages membatasi penggunaan situs untuk transaksi komersial. [GitHub Pages usage limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)

## Tes lokal

```bash
npm run build
npm run preview
```

Buka alamat yang tercetak di Terminal. Build dan preview menggunakan Node.js. Untuk cek hasil build toko, jalankan `npm run build:store` lalu `npm run preview -- --store`.

## Deploy demo ke GitHub Pages

1. Commit isi folder proyek, termasuk `.github/workflows/pages.yml`, ke default branch repository. Workflow di ZIP pakai mode manual. Untuk repo kosong `nandomaul/Cakes-Appeal`, jalankan perintah berikut dari folder proyek.

   ```bash
   git init -b main
   git add .
   git commit -m "Add Cakes Appeal Pages demo"
   git remote add origin https://github.com/nandomaul/Cakes-Appeal.git
   git push -u origin main
   ```

2. Di GitHub buka **Settings → Pages**, lalu pilih **Source → GitHub Actions**. [Dokumentasi publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
3. Buka **Actions → Deploy Cakes Appeal Demo → Run workflow**. Pilih `main` atau default branch yang lo pakai. Setelah run sukses, buka URL dari hasil deployment. [Cara menjalankan workflow manual](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow)

Untuk update, commit dan push perubahan. Klik **Run workflow** lagi. Workflow membangun dan mengunggah `dist/` dari commit yang dipilih.

## Deploy versi toko

Jalankan `npm run build:store`. Untuk publikasi manual dengan Netlify Drop, unggah folder `dist-store/`. Uji keranjang sampai WhatsApp membuka draf pesanan. Pembeli yang mengirim pesan dari WhatsApp. [Panduan Netlify Drop](https://docs.netlify.com/start/quickstarts/netlify-drop-quickstart/)

## Edit proyek

`npm run dev` menjalankan proyek V4 untuk pengembangan. `src/catalog.js` berisi daftar produk, harga, dan varian. Logo ada di `assets/logo.png` dan foto di `assets/images/`.

Jika lo edit sumber animasi `src/motion.tailwind.css`, jalankan `npm install` sekali lalu `npm run build:motion` untuk memperbarui CSS yang dipakai build.
