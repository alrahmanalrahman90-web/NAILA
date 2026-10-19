# MySchool + OpenAI API (Vercel)

Paket ini mengubah Chat AI MySchool dari Google Gemini menjadi OpenAI API. Desain dan halaman lain di `index.html` dipertahankan sebisa mungkin.

## Isi paket
- `index.html` — halaman MySchool, Chat AI memanggil `/api/chat`
- `api/chat.js` — backend serverless Vercel; API key hanya dibaca dari environment variable
- `package.json` — metadata proyek

## Cara memasang di GitHub dan Vercel

1. **Cadangkan proyek lama** atau buat branch baru di GitHub sebelum mengganti file.
2. Unggah/ganti HTML utama proyek dengan `index.html` dari paket ini. Pastikan file tersebut berada di root repository agar Vercel menyajikannya sebagai halaman utama.
3. Unggah folder `api` beserta `api/chat.js` ke root repository. Struktur harus seperti ini:
   ```
   index.html
   package.json
   api/
     chat.js
   ```
4. Buka proyek MySchool di Vercel → **Settings** → **Environment Variables**.
5. Tambahkan:
   - Name: `OPENAI_API_KEY`
   - Value: API key OpenAI kamu (rahasia)
   - Environment: pilih Production; pilih Preview juga jika ingin menguji deployment preview.
6. (Opsional) Tambahkan `OPENAI_MODEL` dengan nilai `gpt-4.1-mini`. Jika tidak diisi, backend memakai model tersebut secara default.
7. Simpan perubahan lalu buka **Deployments** dan lakukan **Redeploy**. Perubahan environment variable baru berlaku setelah redeploy.
8. Buka website Vercel, masuk ke Pengaturan → Chat AI, lalu coba kirim pesan.

## Penting
- Jangan menaruh API key di HTML, JavaScript browser, GitHub, atau mengirimkannya lewat chat.
- OpenAI API ditagih terpisah dari langganan ChatGPT. Periksa billing dan usage di akun OpenAI API.
- Endpoint ini dapat diakses publik karena website publik. Tetapkan batas penggunaan/billing di akun OpenAI dan pantau pemakaian. Untuk website ramai, tambahkan autentikasi dan rate limiting sebelum dipakai luas.
- Login/registrasi yang sudah ada pada file HTML ini tetap menggunakan `localStorage` browser; perubahan ini hanya mengganti integrasi Chat AI, bukan membangun autentikasi server.
- Saya belum dapat melakukan deployment ke akun GitHub/Vercel kamu dari sini. Paket perlu diunggah dan dikonfigurasi mengikuti langkah di atas.

## Jika chat gagal
- `Backend belum dikonfigurasi`: pastikan `OPENAI_API_KEY` sudah ditambahkan ke proyek Vercel dan lakukan redeploy.
- `API key OpenAI tidak valid`: periksa API key di Vercel, tanpa menaruhnya di HTML.
- `Batas penggunaan atau saldo API tercapai`: cek billing dan usage OpenAI API.
- `404` pada `/api/chat`: pastikan `api/chat.js` ada di root repository dan deployment sudah selesai.
