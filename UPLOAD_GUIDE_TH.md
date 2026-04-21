# วิธีอัปโหลดขึ้น GitHub Pages แบบทีละคลิก

## สิ่งสำคัญที่สุด
ต้องอัปโหลด **ทุกไฟล์และทุกโฟลเดอร์** ในโฟลเดอร์นี้ขึ้น GitHub
โดยเฉพาะโฟลเดอร์
- `assets/`
- `data/`

ถ้าขาด 2 โฟลเดอร์นี้ เว็บจะเปิดได้แต่ใช้งานไม่ได้

---

## วิธีที่ง่ายที่สุดบน iPhone/iPad/คอม

### ขั้นที่ 1: แตก ZIP
1. ดาวน์โหลดไฟล์ ZIP นี้
2. แตก ZIP ให้เห็นไฟล์ข้างใน
3. ตรวจสอบว่ามีไฟล์เหล่านี้อยู่จริง
   - `index.html`
   - `404.html`
   - `manifest.webmanifest`
   - `sw.js`
   - `.nojekyll`
   - โฟลเดอร์ `assets`
   - โฟลเดอร์ `data`

### ขั้นที่ 2: เข้า GitHub repo
1. เปิด repo: `NLEMz_Explorer`
2. กดปุ่ม **Add file**
3. เลือก **Upload files**

### ขั้นที่ 3: ลบไฟล์เดิมใน repo ก่อน
ถ้ามีไฟล์ค้างเดิมอยู่ ให้ลบไฟล์เดิมใน repo ออกก่อน หรือสร้าง repo ใหม่จะง่ายที่สุด

### ขั้นที่ 4: อัปโหลดทั้งชุด
1. เปิดโฟลเดอร์ที่แตก ZIP แล้ว
2. เลือก **ทุกไฟล์และทุกโฟลเดอร์ด้านในทั้งหมด**
3. ลากทั้งหมดลงหน้า Upload ของ GitHub
4. รอจน GitHub แสดงรายการไฟล์ครบ

ต้องเห็นอย่างน้อยโครงนี้บนหน้าอัปโหลด

```text
index.html
404.html
manifest.webmanifest
sw.js
.nojekyll
assets/
data/
scripts/
README.md
UPLOAD_GUIDE_TH.md
```

### ขั้นที่ 5: Commit
1. เลื่อนลงล่าง
2. ใส่ข้อความเช่น `upload complete app files`
3. กด **Commit changes**

### ขั้นที่ 6: เปิด GitHub Pages
1. ไปที่ **Settings**
2. เลือก **Pages**
3. ที่หัวข้อ **Build and deployment**
4. เลือก
   - **Source** = `Deploy from a branch`
   - **Branch** = `main`
   - **Folder** = `/ (root)`
5. กด **Save**

### ขั้นที่ 7: รอ deploy
1. รอ 1–3 นาที
2. เปิดลิงก์ GitHub Pages
3. ถ้ายังไม่ขึ้น ให้กดรีเฟรชแบบแรงหรือเปิดแบบ private/incognito

---

## วิธีเช็กว่าขึ้นครบหรือยัง
ในหน้า repo ต้องเห็น
- `assets`
- `data`

ถ้าไม่เห็น 2 โฟลเดอร์นี้ แปลว่ายังอัปโหลดไม่ครบ

---

## วิธีเช็กถ้าเว็บยังใช้งานไม่ได้
ให้ลองเปิดลิงก์เหล่านี้ตรง ๆ
- `https://YOUR-USERNAME.github.io/YOUR-REPO/assets/js/app.js`
- `https://YOUR-USERNAME.github.io/YOUR-REPO/data/meta.json`
- `https://YOUR-USERNAME.github.io/YOUR-REPO/data/nlem.json`

ถ้าเปิดแล้วขึ้น 404 แปลว่าไฟล์ยังขึ้นไม่ครบ

---

## แนะนำเพื่อกันพลาด
- ถ้าไม่มั่นใจ ให้สร้าง repo ใหม่แล้วอัปโหลดทั้งชุดนี้ทีเดียว
- อย่าอัปโหลดเฉพาะ 4–5 ไฟล์บนสุด
- อย่าลืมโฟลเดอร์ `assets` และ `data`
- ไฟล์ `.nojekyll` ควรมีค้างไว้เสมอ

---

## หลังอัปโหลดสำเร็จ
หน้าเว็บควรค้นหาได้ และไม่ขึ้นข้อความว่าโหลดข้อมูลไม่ได้

