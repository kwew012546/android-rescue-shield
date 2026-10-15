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

## 🏛️ The 4 Core Modules (4 โมดูลหลักในโปรแกรม)

### 🚨 [โมดูล 1] กู้ภัยปราบแอปป่วนจอ (Rescue Shield)
- **Instant Emergency Kill:** ตรวจจับแบบ Real-time ว่าแอปใดกำลังแสดงผลทับหน้าจออยู่ กดปุ่มเดียวสั่ง Force-Stop ให้มือถือหลุดจากการล็อกทันที
- **👻 Ghost Touch Killer:** ปุ่มคลิกเดียวสั่ง **ปิดสิทธิ์ Accessibility ทั้งหมด** ปราบแอปที่กำลังเลื่อนจอเองหรือแย่งแตะหน้าจอให้เป็นอัมพาตทันที
- **❄️ App Freezing:** แช่แข็งแอป (`pm disable-user`) สำหรับแอปดื้อด้านที่ชอบรีสตาร์ทตัวเอง
- **🗑️ Force / Silent Uninstall:** สั่งถอนการติดตั้งผ่าน ADB พร้อมระบบ **ปลดสิทธิ์ Device Admin อัตโนมัติ** ก่อนลบ
- **🔍 Deep Risk Inspector:** สแกนตรวจจับสิทธิ์อันตราย (`SYSTEM_ALERT_WINDOW`, `BOOT_COMPLETED`, ซ่อนไอคอน)

### 🏦 [โมดูล 2] ปลดล็อกแอปธนาคาร & เป๋าตังค์ (Bank Safety Guard)
- **📷 Background Camera Inspector:** ตรวจจับว่ามีแอปใดกำลังแอบเปิดเซ็นเซอร์กล้องค้างอยู่เบื้องหลัง พร้อมปุ่มสั่งปิดทันที เพื่อให้สแกนใบหน้า KYC ผ่านฉลุย
- **👁️ Anti-Spyware & Remote Check:** ตรวจจับสิทธิ์การเข้าถึงพิเศษ (Accessibility) ที่เสี่ยงต่อการถูกรีโมทดูดเงิน
- **🔒 One-Click Disable USB Debugging:** ปุ่มคลิกเดียวจากคอมพิวเตอร์เพื่อ **สั่งปิดการดีบัก USB และโหมดนักพัฒนาในมือถือทันที** เพื่อให้เปิดเข้าแอปเป๋าตัง / ทางรัฐ / K PLUS / SCB ได้ทันทีโดยไม่ติดบล็อก

### 🧹 [โมดูล 3] ลบแอปขยะติดเครื่องจากโรงงาน (Universal Debloater)
- **Zero-Root Debloating:** ลบแอปขยะที่โรงงานยัดมา (Facebook Services, Mi Ads/Cleaner, Samsung Bixby, แอปค่ายมือถือ) ผ่าน `pm uninstall --user 0` โดยไม่ต้องรูทเครื่อง
- **Curated Safety Presets:** มีระบบแนะนำความปลอดภัย (🟢 ปลอดภัยลบได้ / 🟡 แนะนำหากไม่ใช้)
- **🔄 One-Click Restore:** สามารถกดปุ่ม **"กู้คืน"** แอปเดิมกลับมาได้ตลอดเวลา ไม่ต้องกลัวเครื่องมีปัญหา

### ⚡ [โมดูล 4] แฟลชเครื่อง & กู้บริค (Multi-Brand Hardware & Unbrick Hub)
- **🧭 Multi-Brand Hub Navigation:** แถบเมนูสลับค่ายมือถือเพื่อเปิดเครื่องมือเฉพาะทางของแต่ละแบรนด์ใน 1 คลิก:
  - **🔵 Samsung Technician Hub (100% Offline Bundle):**
    - **Embedded Odin3 v3.14.4:** ฝังตัวโปรแกรม Odin3 ไว้ใน `tools/samsung/odin/` พร้อมเปิดใช้งานได้ทันทีใน 1 คลิก
    - **Embedded Samsung USB Driver v1.9.5.0:** ฝังตัวติดตั้งไดรเวอร์ใน `tools/samsung/drivers/` พร้อมปุ่ม 1-คลิกสั่งติดตั้งจากหน้าเว็บ
    - **Auto Hardware & Binary Inspection:** ตรวจเช็กรหัสรุ่น, Binary Bit (SW REV), CSC อัตโนมัติ เลือกรอมศูนย์แท้ตรงรุ่นไม่ติดบล็อก
    - **⚡ Smart Odin Auto-Slotter & Wipe Selector:** สแกนหาไฟล์รอมในเครื่องอัตโนมัติ จัดไฟล์ `BL`, `AP`, `CP` ลงช่องให้อัตโนมัติ พร้อมสลับช่อง CSC เป็น `CSC_xxxx` (⚡ Clean Wipe ล้างเกลี้ยง) หรือ `HOME_CSC_xxxx` (⭐ Keep Data รูปไม่หาย) ในคลิกเดียว พร้อมปุ่ม 1-คลิกคัดลอก Path แต่ละช่อง
  - **🟠 Xiaomi / Redmi / POCO Native Fastboot Flasher (100% In-App):**
    - **No Extra Tools Needed:** สั่งแฟลชรอม Fastboot ตรงจากหน้าเว็บโปรแกรมได้ทันที 100% ไม่ต้องติดตั้ง Mi Flash Tool
    - **Auto Codename & Bootloader Check:** ดึงรหัสรุ่นเครื่อง (เช่น `curtana`, `sweet`, `vayu`) และสถานะปลดล็อก Bootloader พร้อมลิงก์ดาวน์โหลดรอมศูนย์ตรงรุ่น
    - **3-Mode Flashing Selector:** สลับระหว่าง `flash_all.bat` (Clean Wipe), `flash_all_except_storage.bat` (Keep Data), และ `flash_all_lock.bat` (Clean & Lock) พร้อมนับไฟล์อิมเมจในโฟลเดอร์ `images/`
    - **Live Progress Streaming:** สตรีม Log แสดงความคืบหน้าระหว่างแฟลชลง Terminal แบบเรียลไทม์
  - **🟢 Oppo / Realme / Vivo Recovery & Emergency Hub:**
    - **Official Recovery OTA Links:** รวมลิงก์ดาวน์โหลดรอมศูนย์ทางการเพื่อนำไฟล์ `.zip` หรือ `.ozip` มาแฟลชกู้เครื่องแบบรูปไม่หายผ่าน ADB Sideload หรือ OTG
    - **1-Click Emergency EDL 9008:** ปุ่มสั่งรีบูตเครื่องเข้าโหมดฉุกเฉิน Qualcomm EDL 9008 สำหรับกู้เครื่องดับสนิท
- **⚡ Universal Partition Flasher:** แฟลชไฟล์ `.img` ตรงเข้าชิป (`boot`, `init_boot`, `recovery`, `vbmeta`, `super`, `system`, `userdata`)
- **🚀 Temporary Boot:** ทดลองบูตเคอร์เนลหรือ Recovery ชั่วคราว (`fastboot boot <image>`) โดยไม่ต้องเขียนทับ ROM จริง
- **🛟 A/B Slot Switcher (แก้ Bootloop):** สลับ Slot A <-> B กู้คืนเครื่องที่บูตวนหลังอัปเดตระบบผิดพลาด ข้อมูลไม่หาย 100%
- **📥 Recovery Sideload:** ติดตั้งไฟล์ OTA Update, Custom ROM หรือ Magisk.zip ผ่าน `adb sideload` ใน Recovery Mode
- **🖥️ Live Console Execution:** หน้าต่างแสดงผลคำสั่งระดับ Low-Level แบบ Real-time

---

## 📱 Brand Compatibility Matrix (ตารางความเข้ากันได้รายยี่ห้อ)

| ยี่ห้อ / แบรนด์ | ระดับการรองรับ | โหมดที่ใช้ | รายละเอียด & เทคนิคช่าง |
| :--- | :---: | :---: | :--- |
| **Samsung Galaxy** | 🟢 100% (สมบูรณ์) | Odin (Download Mode) / Sideload | ฝัง Odin3 + USB Driver ในตัว, ตรวจ Binary Bit ตรงรุ่น, มีระบบ **Smart Auto-Slotter** สลับ Clean Wipe vs Keep Data อัตโนมัติ |
| **Xiaomi / Redmi / POCO** | 🟢 100% (สมบูรณ์) | Native Fastboot | มีระบบ **Smart Fastboot Flasher** ในตัว สั่งรัน `flash_all` (Clean Wipe) หรือ `flash_all_except_storage` (Keep Data) ได้จากหน้าเว็บโดยตรง ไม่ต้องลง Mi Flash |
| **Google Pixel** (1 - 9 Pro) | 🟢 100% (สมบูรณ์) | Fastboot / FastbootD | มาตรฐาน AOSP แท้ แฟลชได้ทุกพาร์ติชัน ปลดล็อกง่ายผ่าน `fastboot flashing unlock` |
| **OnePlus / Nothing / Motorola / Sony** | 🟢 100% (สมบูรณ์) | Fastboot / A-B Slot | รองรับ Fastboot เต็มตัว กู้เครื่องบูตวนได้ง่ายด้วยการสลับ Slot A/B |
| **OPPO / Realme / Vivo / iQOO** | 🟢 สูง (พร้อมกู้ชีพ) | Sideload / Recovery / EDL 9008 | กู้เครื่องรูปไม่หายผ่าน Recovery Sideload OTA (.zip/.ozip), สั่งเข้า EDL 9008 ใน 1 คลิก |
| **Transsion** (Infinix, Tecno) | 🟢 สูง | Fastboot / MTK | รองรับการแฟลช GSI, Magisk Patched Boot ผ่าน Fastboot เมื่อเปิด OEM Unlock |
| **Huawei (HarmonyOS)** | 🔴 จำกัด / แตกต่าง | Fastboot / HDC | EMUI เก่าใช้ Fastboot แต่ HarmonyOS NEXT สลัด AOSP ทิ้ง หันไปใช้ HDC แทน |
| **Apple iOS** (iPhone) | ❌ ไม่รองรับ | DFU / IPSW | คนละสถาปัตยกรรม (iOS ไม่ใช้ ADB/Fastboot ต้องใช้ iTunes/3uTools ผ่านสาย Lightning/Type-C) |

---

## 💡 Technician Field Hacks (เคล็ดลับช่างแก้จอค้างก่อนต่อคอม)
1. **📴 สูตรตัดเน็ตทันที (ถอดซิม + ปิด WiFi):** จิ้มถาดซิมการ์ดออกทันที โฆษณาจะโหลดไม่ขึ้น จอจะหยุดเด้ง 80%
2. **🛡️ สูตรเข้า Safe Mode (โหมดปลอดภัย):** กดปุ่ม Power ค้าง > แตะปุ่ม "ปิดเครื่อง" ค้างไว้ 2 วินาที (หรือใช้ปุ่มลดเสียง) ระบบจะแช่แข็งแอปภายนอก 100% ทำให้เปิด USB Debugging ได้แบบไม่ต้องแข่งกับเวลา *(ออกจาก Safe Mode แค่รีสตาร์ทเครื่องปกติ 1 ครั้ง)*
3. **🖱️ สูตรเมาส์ OTG:** เสียบเมาส์คอมพิวเตอร์ผ่านสาย OTG เข้าตูดมือถือเพื่อคลิกรูดหน้าจอเข้า Settings กรณีทัชสกรีนหลอก

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

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
