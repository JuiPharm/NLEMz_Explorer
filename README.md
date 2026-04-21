> สำคัญ: เวลาอัปโหลดขึ้น GitHub ต้องอัปโหลดทั้งโฟลเดอร์ `assets/` และ `data/` ไปพร้อมกัน ไม่เช่นนั้นหน้าเว็บจะเปิดได้แต่ข้อมูลจะไม่โหลด

> แนะนำให้อ่านไฟล์ `UPLOAD_GUIDE_TH.md` ก่อนอัปโหลด

# NLEM Explorer Premium

เว็บแอปค้นหาข้อมูลบัญชียาหลักแห่งชาติ พร้อม fuzzy search ไทย/อังกฤษ และมุมมองบัญชีเดิม/บัญชีใหม่

## ใช้งานแบบ local
ใช้ Live Server หรือ
```bash
python -m http.server 8000
```

## Deploy บน GitHub Pages
1. สร้าง GitHub repo
2. อัปโหลดทุกไฟล์ในโฟลเดอร์นี้
3. ไปที่ Settings > Pages
4. เลือก Deploy from a branch หรือ GitHub Actions

## Rebuild data จาก Excel ใหม่
```bash
python scripts/build_from_excel.py "path/to/file.xlsx"
```
