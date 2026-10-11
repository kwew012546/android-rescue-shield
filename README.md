<p align="center">
  <img src="public/icon.png" width="120" height="120" alt="Android Rescue Shield Logo" style="border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
</p>

<h1 align="center">Android Rescue Shield</h1>

<p align="center">
  <strong>Lightweight Desktop Rescue & Adware Removal Tool for Android via ADB</strong><br>
  โปรแกรมกู้ภัยมือถือโดนล็อกหน้าจอ • ถอนแอปขโมยหน้าจอ • ล้างบาง Adware เด้งรัว
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white" alt="Windows">
  <img src="https://img.shields.io/badge/Android-ADB%20Bridge-3DDC84?style=for-the-badge&logo=android&logoColor=white" alt="Android ADB">
  <img src="https://img.shields.io/badge/Node.js-v20+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="License">
</p>

---

## 📌 The Problem (ปัญหาที่เกิดขึ้น)
เมื่อโทรศัพท์มือถือ Android ติดมัลแวร์หรือ Adware อาการทั่วไปที่ผู้ใช้พบคือ:
1. **หน้าจอถูกขโมย (Screen Overlay Hijack):** โฆษณาหรือหน้าต่างปลอมเด้งบังตลอดเวลา ทัชสกรีนอะไรบนจอมือถือไม่ได้เลย
2. **รันตัวเองทันทีตอนเปิดเครื่อง (`BOOT_COMPLETED`):** รีสตาร์ทเครื่องแล้วไม่หาย เพราะตัวแอปจะสตาร์ทตัวเองทันทีก่อนที่เราจะทันกดลบ
3. **พรางตัว & ล็อกสิทธิ์:** ซ่อนไอคอนในหน้าหลัก (No Launcher Activity) หรือแอบขอสิทธิ์ **Device Admin** ทำให้ปุ่ม "ถอนการติดตั้ง" ใน Settings กลายเป็นสีเทากดไม่ได้

**Android Rescue Shield** แก้ปัญหานี้ด้วยการสั่งการระดับฮาร์ดแวร์ผ่านสาย USB (ADB) จากคอมพิวเตอร์ ทำให้สั่งปลดล็อกและถอนการติดตั้งได้ 100% โดยไม่ต้องพึ่งพาหน้าจอมือถือ

---

## ✨ Features (ฟังก์ชันเด่น)

- 🚨 **Instant Emergency Kill (กู้ภัยจอค้างเร่งด่วน):** มอนิเตอร์ว่าแอปใดกำลังแสดงผลทับหน้าจออยู่แบบ Real-time กดปุ่มเดียวสั่ง Force-Stop ให้มือถือหลุดจากการล็อกทันที
- 🗑️ **Force / Silent Uninstall:** สั่งถอนการติดตั้งผ่าน ADB โดยตรง พร้อมระบบ **ปลดสิทธิ์ Device Admin อัตโนมัติ** ก่อนลบ
- 🔍 **Deep Risk Inspector:** สแกนตรวจจับสิทธิ์อันตรายที่ส่อแวว Adware อัตโนมัติ:
  - `SYSTEM_ALERT_WINDOW`: วาดทับหน้าจอ (ตัวการโฆษณาบังจอ)
  - `RECEIVE_BOOT_COMPLETED`: สตาร์ทตัวเองตอนเปิดเครื่อง
  - `BIND_ACCESSIBILITY_SERVICE`: สิทธิ์การเข้าถึง / บังคับคลิก
  - `NO LAUNCHER ICON`: ซ่อนตัวจากหน้าโฮม
- 🛡️ **One-Click Safe Mode Reboot:** ปุ่มลัดสั่งมือถือรีบูตเข้า Safe Mode จากคอมพิวเตอร์
- 💻 **Zero-Dependency Lightweight GUI:** รันผ่าน Node.js ในตัว พร้อมหน้าต่าง Desktop UI สวยงาม ไร้การติดตั้ง dependencies ภายนอกที่หนักหน่วง

---

## 🚀 Quick Start (วิธีเริ่มต้นใช้งาน)

### 1. การเตรียมโทรศัพท์มือถือ (ทำครั้งเดียว)
1. เข้า **การตั้งค่า (Settings)** > **เกี่ยวกับโทรศัพท์ (About phone)** > แตะที่ **"หมายเลขบิลด์ (Build Number)"** 7 ครั้ง เพื่อเปิด *โหมดนักพัฒนา*
2. เข้า **ตัวเลือกสำหรับนักพัฒนา (Developer Options)** > เปิดใช้งาน **"การดีบัก USB" (USB Debugging)**
3. เสียบสาย USB เข้าคอมพิวเตอร์ หากมีป๊อปอัปขึ้นบนมือถือ ให้ติ๊ก **"อนุญาตเสมอจากคอมพิวเตอร์นี้" (Always allow)** แล้วกด ตกลง

### 2. เปิดใช้งานโปรแกรม
ดับเบิ้ลคลิกไฟล์ **`start.bat`** ในโฟลเดอร์โปรเจกต์:
```bash
# หรือรันผ่าน Terminal
node server.js
```
หน้าต่างโปรแกรม GUI จะเปิดขึ้นมาอัตโนมัติที่ `http://localhost:3210`

---

## 🗺️ Future Roadmap (แผนพัฒนาสู่ All-in-One Suite)

โปรเจกต์นี้กำลังพัฒนาต่อยอดเป็น **Android PowerSuite** โดยมีแผนเพิ่มโมดูล:
- [ ] 🧹 **Universal Debloater:** ลบแอปขยะที่ติดมากับเครื่อง (Bloatware) ได้โดยไม่ต้องรูท
- [ ] 🖥️ **Screen Mirroring & Remote Control:** สตรีมหน้าจอมือถือขึ้นคอมพิวเตอร์ผ่านเอนจิน `scrcpy`
- [ ] 📦 **Batch APK Installer:** ลากไฟล์ APK จากคอมมาลงมือถือพร้อมกันหลายแอป
- [ ] 🔋 **Device Health Monitor:** ตรวจสอบรอบการชาร์จแบตเตอรี่ (Cycle Count) และอุณหภูมิเครื่อง

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
