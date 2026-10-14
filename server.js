const http = require('http');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const url = require('url');

const PORT = process.env.PORT || 3210;
const PUBLIC_DIR = path.join(__dirname, 'public');

// Locate ADB executable
function findAdb() {
  if (process.env.ADB_PATH && fs.existsSync(process.env.ADB_PATH)) {
    return process.env.ADB_PATH;
  }
  const localAppData = process.env.LOCALAPPDATA || '';
  const candidates = [
    path.join(localAppData, 'Android', 'Sdk', 'platform-tools', 'adb.exe'),
    path.join(process.env.PROGRAMFILES || '', 'Android', 'platform-tools', 'adb.exe'),
    path.join(process.env['PROGRAMFILES(X86)'] || '', 'Android', 'platform-tools', 'adb.exe'),
    'adb'
  ];
  for (const c of candidates) {
    if (c === 'adb' || fs.existsSync(c)) {
      return c;
    }
  }
  return 'adb';
}

const ADB_BIN = findAdb();
console.log(`[ADB] Using binary: ${ADB_BIN}`);

// Execute ADB command with promise & timeout
function runAdb(args, timeoutMs = 12000) {
  return new Promise((resolve) => {
    execFile(ADB_BIN, args, { timeout: timeoutMs, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        resolve({
          ok: false,
          error: err.message,
          code: err.code,
          stdout: stdout || '',
          stderr: stderr || ''
        });
      } else {
        resolve({
          ok: true,
          stdout: stdout || '',
          stderr: stderr || ''
        });
      }
    });
  });
}

function findFastboot() {
  if (process.env.FASTBOOT_PATH && fs.existsSync(process.env.FASTBOOT_PATH)) {
    return process.env.FASTBOOT_PATH;
  }
  const localAppData = process.env.LOCALAPPDATA || '';
  const candidates = [
    path.join(localAppData, 'Android', 'Sdk', 'platform-tools', 'fastboot.exe'),
    path.join(process.env.PROGRAMFILES || '', 'Android', 'platform-tools', 'fastboot.exe'),
    path.join(process.env['PROGRAMFILES(X86)'] || '', 'Android', 'platform-tools', 'fastboot.exe'),
    'fastboot'
  ];
  for (const c of candidates) {
    if (c === 'fastboot' || fs.existsSync(c)) {
      return c;
    }
  }
  return 'fastboot';
}

const FASTBOOT_BIN = findFastboot();
console.log(`[Fastboot] Using binary: ${FASTBOOT_BIN}`);

// Execute Fastboot command with promise & timeout
// Note: Fastboot on Windows outputs both progress & status to stderr
function runFastboot(args, timeoutMs = 60000) {
  return new Promise((resolve) => {
    execFile(FASTBOOT_BIN, args, { timeout: timeoutMs, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      const outText = (stdout || '').trim();
      const errText = (stderr || '').trim();
      const combined = [outText, errText].filter(Boolean).join('\n');
      const isFailed = err || combined.includes('FAILED') || combined.includes('error:');

      if (isFailed && err) {
        resolve({
          ok: false,
          error: err.message,
          code: err.code,
          stdout: outText,
          stderr: errText,
          output: combined || err.message
        });
      } else if (isFailed) {
        resolve({
          ok: false,
          error: 'Fastboot returned error status',
          stdout: outText,
          stderr: errText,
          output: combined
        });
      } else {
        resolve({
          ok: true,
          stdout: outText,
          stderr: errText,
          output: combined
        });
      }
    });
  });
}

// Known common system launchers to avoid killing accidentally
const SYSTEM_LAUNCHERS = new Set([
  'com.google.android.apps.nexuslauncher',
  'com.sec.android.app.launcher',
  'com.miui.home',
  'com.android.launcher',
  'com.android.launcher3',
  'com.huawei.android.launcher',
  'com.oppo.launcher',
  'com.bbk.launcher2',
  'com.transsion.hilauncher',
  'com.oneplus.launcher',
  'com.asus.launcher',
  'com.sonymobile.home',
  'com.motorola.launcher3'
]);

// Curated database of known bloatware for Module 3 (Universal Debloater)
const BLOATWARE_DB = {
  // Facebook
  'com.facebook.katana': { name: 'Facebook', safety: 'safe', brand: 'Facebook', desc: 'แอปหลัก Facebook ที่ฝังมากับเครื่อง' },
  'com.facebook.services': { name: 'Facebook Services', safety: 'safe', brand: 'Facebook', desc: 'บริการเบื้องหลังของ Facebook แอบกินแบต' },
  'com.facebook.system': { name: 'Facebook App Installer', safety: 'safe', brand: 'Facebook', desc: 'ตัวติดตั้งแอปของ Facebook ฝังมากับระบบ' },
  'com.facebook.appmanager': { name: 'Facebook App Manager', safety: 'safe', brand: 'Facebook', desc: 'ตัวจัดการอัปเดตของ Facebook' },
  // Netflix
  'com.netflix.mediaclient': { name: 'Netflix', safety: 'safe', brand: 'Netflix', desc: 'แอปดูภาพยนตร์ Netflix ติดมากับเครื่อง' },
  'com.netflix.partner.activation': { name: 'Netflix Activation', safety: 'safe', brand: 'Netflix', desc: 'เซอร์วิสพาร์ทเนอร์ของ Netflix' },
  // Microsoft
  'com.microsoft.skydrive': { name: 'OneDrive', safety: 'safe', brand: 'Microsoft', desc: 'คลาวด์ไดรฟ์ของ Microsoft' },
  'com.microsoft.office.officehubrow': { name: 'Microsoft 365 (Office)', safety: 'safe', brand: 'Microsoft', desc: 'ชุดโปรแกรม Office ติดเครื่อง' },
  'com.linkedin.android': { name: 'LinkedIn', safety: 'safe', brand: 'Microsoft', desc: 'แอปเครือข่ายสังคมธุรกิจ' },
  // Xiaomi / HyperOS
  'com.miui.cleanmaster': { name: 'Mi Cleaner (CleanMaster)', safety: 'safe', brand: 'Xiaomi', desc: 'ตัวล้างขยะของ Cheetah Mobile มีโฆษณาแฝง' },
  'com.miui.analytics': { name: 'MIUI Analytics', safety: 'safe', brand: 'Xiaomi', desc: 'ระบบดักเก็บข้อมูลและพฤติกรรมของ Xiaomi' },
  'com.miui.msa.global': { name: 'MIUI System Ads (MSA)', safety: 'safe', brand: 'Xiaomi', desc: 'ตัวการยิงโฆษณาในรอม Xiaomi!' },
  'com.xiaomi.glgm': { name: 'Games Center (Xiaomi)', safety: 'safe', brand: 'Xiaomi', desc: 'ศูนย์เกมแถมของเสียวหมี่ มีแจ้งเตือนสแปม' },
  'com.miui.bugreport': { name: 'Mi Bug Report', safety: 'safe', brand: 'Xiaomi', desc: 'ระบบส่งรายงานข้อผิดพลาด กินแบตเบื้องหลัง' },
  'com.miui.player': { name: 'Mi Music', safety: 'recommended', brand: 'Xiaomi', desc: 'เครื่องเล่นเพลงของ Xiaomi มักมีโฆษณา' },
  'com.mi.globalbrowser': { name: 'Mi Browser', safety: 'recommended', brand: 'Xiaomi', desc: 'เบราว์เซอร์ของ Xiaomi กินแรมและแจ้งเตือนเยอะ' },
  // Samsung
  'com.samsung.android.bixby.agent': { name: 'Bixby Voice / Agent', safety: 'safe', brand: 'Samsung', desc: 'ผู้ช่วยเสียง Bixby หากไม่ใช้งานลบได้' },
  'com.samsung.android.bixby.wakeup': { name: 'Bixby Wakeup', safety: 'safe', brand: 'Samsung', desc: 'เซอร์วิสรอรับฟังเสียงเรียก Bixby' },
  'com.samsung.android.game.gamehome': { name: 'Gaming Hub (Game Launcher)', safety: 'safe', brand: 'Samsung', desc: 'ศูนย์รวมเกมของซัมซุง' },
  'com.samsung.android.spay': { name: 'Samsung Pay / Wallet', safety: 'recommended', brand: 'Samsung', desc: 'ระบบกระเป๋าเงินซัมซุง หากไม่ใช้ลบได้' },
  'com.sec.android.app.sbrowser': { name: 'Samsung Internet', safety: 'recommended', brand: 'Samsung', desc: 'เบราว์เซอร์ซัมซุง (หากใช้ Chrome อยู่แล้ว)' },
  'com.samsung.android.kidsinstaller': { name: 'Samsung Kids Mode', safety: 'safe', brand: 'Samsung', desc: 'โหมดสำหรับเด็ก' },
  // Google
  'com.google.android.apps.tachyon': { name: 'Google Meet (Duo)', safety: 'safe', brand: 'Google', desc: 'แอปวิดีโอคอลของกูเกิล' },
  'com.google.android.apps.youtube.music': { name: 'YouTube Music', safety: 'recommended', brand: 'Google', desc: 'แอปฟังเพลง YouTube Music' },
  'com.google.android.videos': { name: 'Google TV', safety: 'safe', brand: 'Google', desc: 'แอปดูภาพยนตร์ของ Google' },
  'com.google.android.projection.gearhead': { name: 'Android Auto', safety: 'recommended', brand: 'Google', desc: 'ระบบเชื่อมต่อหน้าจอรถยนต์ หากไม่มีรถลบได้' },
  // Carriers (TH)
  'com.ais.mimo.ais5g': { name: 'myAIS', safety: 'safe', brand: 'Carrier', desc: 'แอปผู้ให้บริการเครือข่าย AIS' },
  'th.co.crie.truelifetv.trueid': { name: 'TrueID', safety: 'safe', brand: 'Carrier', desc: 'แอปบันเทิงของ True' },
  'th.co.dtac.allinone': { name: 'dtac app', safety: 'safe', brand: 'Carrier', desc: 'แอปเครือข่าย dtac' }
};

// Helper to parse JSON body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// Helper to send JSON response
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data));
}

// MIME types for static assets
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// API Route Handlers
async function handleApi(req, res, pathname) {
  // GET /api/device - Check connected device status
  if (pathname === '/api/device' && req.method === 'GET') {
    const devRes = await runAdb(['devices', '-l']);
    if (!devRes.ok) {
      return sendJson(res, 200, {
        connected: false,
        state: 'error',
        message: 'ไม่สามารถติดต่อ ADB ได้: ' + (devRes.error || devRes.stderr)
      });
    }

    const lines = devRes.stdout.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0 && !l.startsWith('List of devices attached') && !l.startsWith('*'));

    if (lines.length === 0) {
      // Check if any device is connected in Fastboot mode
      const fbDevRes = await runFastboot(['devices'], 2000);
      if (fbDevRes.ok && fbDevRes.stdout.trim().length > 0) {
        const fbLines = fbDevRes.stdout.trim().split('\n');
        const fbFirst = fbLines[0].trim();
        const fbParts = fbFirst.split(/\s+/);
        const fbSerial = fbParts[0] || 'Unknown';
        return sendJson(res, 200, {
          connected: true,
          state: 'fastboot',
          serial: fbSerial,
          model: 'Fastboot Device',
          brand: 'Bootloader',
          androidVersion: 'Fastboot Mode',
          batteryLevel: null,
          message: 'พบอุปกรณ์เชื่อมต่อในโหมด Fastboot / Bootloader'
        });
      }

      return sendJson(res, 200, {
        connected: false,
        state: 'disconnected',
        message: 'ยังไม่พบอุปกรณ์ที่เชื่อมต่อผ่าน USB'
      });
    }

    const firstLine = lines[0];
    const parts = firstLine.split(/\s+/);
    const serial = parts[0];
    const status = parts[1];

    if (status === 'unauthorized') {
      return sendJson(res, 200, {
        connected: false,
        state: 'unauthorized',
        serial,
        message: 'อุปกรณ์เชื่อมต่อแล้ว แต่ยังรอการกด "อนุญาตการดีบัก USB" (Allow USB Debugging) บนหน้าจอมือถือ'
      });
    }

    if (status === 'recovery' || status === 'sideload') {
      return sendJson(res, 200, {
        connected: true,
        state: status,
        serial,
        model: `${status.toUpperCase()} Device`,
        brand: 'Recovery Mode',
        androidVersion: status === 'sideload' ? 'ADB Sideload' : 'Recovery',
        batteryLevel: null,
        message: `อุปกรณ์เชื่อมต่อในโหมด ${status.toUpperCase()} (พร้อมสำหรับการแฟลช Sideload)`
      });
    }

    if (status !== 'device') {
      return sendJson(res, 200, {
        connected: false,
        state: status,
        serial,
        message: `สถานะอุปกรณ์: ${status}`
      });
    }

    // Device is authorized and connected! Query details
    const [modelRes, brandRes, releaseRes, batteryRes] = await Promise.all([
      runAdb(['shell', 'getprop', 'ro.product.model']),
      runAdb(['shell', 'getprop', 'ro.product.brand']),
      runAdb(['shell', 'getprop', 'ro.build.version.release']),
      runAdb(['shell', 'dumpsys', 'battery'])
    ]);

    let batteryLevel = null;
    if (batteryRes.ok) {
      const levelMatch = batteryRes.stdout.match(/level:\s*(\d+)/i);
      if (levelMatch) batteryLevel = parseInt(levelMatch[1], 10);
    }

    return sendJson(res, 200, {
      connected: true,
      state: 'device',
      serial,
      model: (modelRes.stdout || '').trim() || serial,
      brand: (brandRes.stdout || '').trim(),
      androidVersion: (releaseRes.stdout || '').trim() || 'Unknown',
      batteryLevel
    });
  }

  // GET /api/top-app - Find the package currently on foreground/top of screen
  if (pathname === '/api/top-app' && req.method === 'GET') {
    // Check mCurrentFocus or mFocusedApp or mResumedActivity
    const [winRes, actRes] = await Promise.all([
      runAdb(['shell', 'dumpsys', 'window']),
      runAdb(['shell', 'dumpsys', 'activity', 'activities'])
    ]);

    let topPackage = null;
    let topActivity = null;

    // Search window focus
    if (winRes.ok) {
      const focusMatch = winRes.stdout.match(/mCurrentFocus[^\n]*?([a-zA-Z0-9_.]+)\/([a-zA-Z0-9_.$]+)/);
      if (focusMatch) {
        topPackage = focusMatch[1];
        topActivity = focusMatch[2];
      }
    }

    // Fallback to activity resumes
    if (!topPackage && actRes.ok) {
      const resumedMatch = actRes.stdout.match(/mResumedActivity:[^\n]*?([a-zA-Z0-9_.]+)\/([a-zA-Z0-9_.$]+)/);
      if (resumedMatch) {
        topPackage = resumedMatch[1];
        topActivity = resumedMatch[2];
      }
    }

    const isSystemLauncher = topPackage ? SYSTEM_LAUNCHERS.has(topPackage) : false;

    return sendJson(res, 200, {
      package: topPackage,
      activity: topActivity,
      isSystemLauncher,
      isHijackerLikely: topPackage && !isSystemLauncher && !topPackage.startsWith('com.android.systemui')
    });
  }

  // POST /api/emergency-kill - Force kill current top blocker app or specified app
  if (pathname === '/api/emergency-kill' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    let targetPackage = body.package;

    if (!targetPackage) {
      // Find top app first
      const winRes = await runAdb(['shell', 'dumpsys', 'window']);
      if (winRes.ok) {
        const match = winRes.stdout.match(/mCurrentFocus[^\n]*?([a-zA-Z0-9_.]+)\/([a-zA-Z0-9_.$]+)/);
        if (match) targetPackage = match[1];
      }
    }

    if (!targetPackage) {
      return sendJson(res, 400, { ok: false, message: 'ไม่พบแอปที่กำลังเปิดอยู่หน้าจอ' });
    }

    if (SYSTEM_LAUNCHERS.has(targetPackage) || targetPackage === 'com.android.systemui') {
      return sendJson(res, 400, {
        ok: false,
        message: `แอปที่เปิดอยู่คือระบบหน้าโฮม (${targetPackage}) ไม่ใช่แอปอันตราย`
      });
    }

    // Execute force-stop
    const killRes = await runAdb(['shell', 'am', 'force-stop', targetPackage]);
    if (!killRes.ok) {
      return sendJson(res, 500, {
        ok: false,
        message: `ไม่สามารถหยุด ${targetPackage}: ${killRes.stderr || killRes.error}`
      });
    }

    return sendJson(res, 200, {
      ok: true,
      package: targetPackage,
      message: `หยุดการทำงานของ ${targetPackage} สำเร็จแล้ว หน้าจอมือถือควรกลับมาปกติ`
    });
  }

  // GET /api/apps - List 3rd-party apps with risk assessment
  if (pathname === '/api/apps' && req.method === 'GET') {
    // 1. Get 3rd-party packages
    const pkgRes = await runAdb(['shell', 'pm', 'list', 'packages', '-3', '-f']);
    if (!pkgRes.ok) {
      return sendJson(res, 500, { ok: false, message: 'ไม่สามารถดึงรายชื่อแอปได้: ' + (pkgRes.stderr || pkgRes.error) });
    }

    // 2. Get active device admins to see which apps have locked uninstall
    const dpmRes = await runAdb(['shell', 'dpm', 'get-active-admins']);
    const activeAdmins = new Set();
    if (dpmRes.ok) {
      const adminMatches = dpmRes.stdout.match(/([a-zA-Z0-9_.]+)\/[a-zA-Z0-9_.$]+/g) || [];
      adminMatches.forEach(adm => {
        const p = adm.split('/')[0];
        if (p) activeAdmins.add(p);
      });
    }

    // Parse package lines: package:/data/app/.../base.apk=com.example.app
    const rawLines = pkgRes.stdout.split('\n').map(l => l.trim()).filter(l => l.startsWith('package:'));
    const apps = [];

    for (const line of rawLines) {
      const clean = line.replace(/^package:/, '');
      const eqIdx = clean.lastIndexOf('=');
      if (eqIdx !== -1) {
        const apkPath = clean.substring(0, eqIdx);
        const pkgName = clean.substring(eqIdx + 1);
        apps.push({
          packageName: pkgName,
          apkPath,
          isDeviceAdmin: activeAdmins.has(pkgName)
        });
      }
    }

    return sendJson(res, 200, {
      ok: true,
      totalCount: apps.length,
      apps
    });
  }

  // POST /api/app-inspect - Inspect single app permissions & timestamps
  if (pathname === '/api/app-inspect' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const pkg = body.package;
    if (!pkg) {
      return sendJson(res, 400, { ok: false, message: 'กรุณาระบุชื่อ package' });
    }

    const dumpRes = await runAdb(['shell', 'dumpsys', 'package', pkg]);
    if (!dumpRes.ok) {
      return sendJson(res, 500, { ok: false, message: 'ไม่สามารถตรวจสอบ package ได้: ' + dumpRes.stderr });
    }

    const dump = dumpRes.stdout;

    // Extract install & update times
    const firstInstallMatch = dump.match(/firstInstallTime=([0-9-]+\s+[0-9:]+)/);
    const lastUpdateMatch = dump.match(/lastUpdateTime=([0-9-]+\s+[0-9:]+)/);
    const versionNameMatch = dump.match(/versionName=([^\s]+)/);

    // Extract dangerous permissions
    const hasOverlay = /android\.permission\.SYSTEM_ALERT_WINDOW/.test(dump);
    const hasBoot = /android\.permission\.RECEIVE_BOOT_COMPLETED/.test(dump);
    const hasAccessibility = /android\.permission\.BIND_ACCESSIBILITY_SERVICE/.test(dump);
    const hasUsageStats = /android\.permission\.PACKAGE_USAGE_STATS/.test(dump);

    // Check if it has launcher activity
    // Query intent: adb shell cmd package resolve-activity --brief <pkg>
    const resolveRes = await runAdb(['shell', 'cmd', 'package', 'resolve-activity', '--brief', pkg]);
    const hasLauncher = resolveRes.ok && !resolveRes.stdout.includes('No activity found') && resolveRes.stdout.trim().length > 0;

    // Calculate Risk Score
    let riskLevel = 'normal'; // normal, warning, dangerous
    const riskReasons = [];

    if (hasOverlay) {
      riskReasons.push('มีสิทธิ์วาดทับหน้าจอ (SYSTEM_ALERT_WINDOW) - สาเหตุหลักของโฆษณาบังจอ');
    }
    if (hasBoot) {
      riskReasons.push('มีสิทธิ์เริ่มทำงานทันทีตอนเปิดเครื่อง (RECEIVE_BOOT_COMPLETED)');
    }
    if (hasAccessibility) {
      riskReasons.push('มีสิทธิ์การเข้าถึง (ACCESSIBILITY_SERVICE) - สามารถกดหน้าจอแทนผู้ใช้ได้');
    }
    if (!hasLauncher) {
      riskReasons.push('ไม่มีไอคอนในหน้าหลัก (ซ่อนตัวจาก Launcher ทำให้หาลบยาก)');
    }

    if (hasOverlay && (hasBoot || !hasLauncher)) {
      riskLevel = 'dangerous';
    } else if (hasOverlay || hasAccessibility || !hasLauncher) {
      riskLevel = 'warning';
    }

    return sendJson(res, 200, {
      ok: true,
      package: pkg,
      versionName: versionNameMatch ? versionNameMatch[1] : 'Unknown',
      firstInstallTime: firstInstallMatch ? firstInstallMatch[1] : null,
      lastUpdateTime: lastUpdateMatch ? lastUpdateMatch[1] : null,
      hasOverlay,
      hasBoot,
      hasAccessibility,
      hasUsageStats,
      hasLauncher,
      riskLevel,
      riskReasons
    });
  }

  // POST /api/uninstall - Force uninstall app
  if (pathname === '/api/uninstall' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const pkg = body.package;
    if (!pkg) {
      return sendJson(res, 400, { ok: false, message: 'กรุณาระบุชื่อ package' });
    }

    // 1. Force stop first to prevent interference
    await runAdb(['shell', 'am', 'force-stop', pkg]);

    // 2. Check if active admin; if so, remove it
    const dpmRes = await runAdb(['shell', 'dpm', 'get-active-admins']);
    if (dpmRes.ok && dpmRes.stdout.includes(pkg)) {
      const match = dpmRes.stdout.match(new RegExp(`${pkg}/([a-zA-Z0-9_.$]+)`));
      if (match) {
        const fullAdmin = `${pkg}/${match[1]}`;
        await runAdb(['shell', 'dpm', 'remove-active-admin', fullAdmin]);
      }
    }

    // 3. Uninstall app
    const unRes = await runAdb(['uninstall', pkg]);
    if (unRes.ok && (unRes.stdout.includes('Success') || !unRes.stdout.includes('Failure'))) {
      return sendJson(res, 200, {
        ok: true,
        package: pkg,
        message: `ถอนการติดตั้ง ${pkg} สำเร็จแล้ว`
      });
    }

    // 4. Fallback to user 0 uninstall
    const fbRes = await runAdb(['shell', 'pm', 'uninstall', '-k', '--user', '0', pkg]);
    if (fbRes.ok && fbRes.stdout.includes('Success')) {
      return sendJson(res, 200, {
        ok: true,
        package: pkg,
        message: `ถอนการติดตั้ง ${pkg} สำหรับผู้ใช้หลักสำเร็จแล้ว`
      });
    }

    return sendJson(res, 500, {
      ok: false,
      package: pkg,
      message: `ถอนการติดตั้งไม่สำเร็จ: ${unRes.stderr || unRes.stdout || fbRes.stderr || fbRes.stdout}`
    });
  }

  // POST /api/freeze - Freeze / Disable app completely (Castrate auto-restart)
  if (pathname === '/api/freeze' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const pkg = body.package;
    const action = body.action || 'disable'; // 'disable' or 'enable'
    if (!pkg) return sendJson(res, 400, { ok: false, message: 'กรุณาระบุ package' });

    const cmd = action === 'disable' ? ['shell', 'pm', 'disable-user', '--user', '0', pkg] : ['shell', 'pm', 'enable', pkg];
    const frRes = await runAdb(cmd);
    if (!frRes.ok) {
      return sendJson(res, 500, { ok: false, message: `แช่แข็งไม่สำเร็จ: ${frRes.stderr || frRes.error}` });
    }
    return sendJson(res, 200, {
      ok: true,
      action,
      package: pkg,
      message: action === 'disable' ? `แช่แข็ง (Freeze) ${pkg} สำเร็จแล้ว แอปจะไม่สามารถทำงานได้อีก` : `ยกเลิกแช่แข็ง ${pkg} สำเร็จ`
    });
  }

  // GET /api/accessibility - Check active accessibility services (Ghost touch / auto clickers)
  if (pathname === '/api/accessibility' && req.method === 'GET') {
    const accRes = await runAdb(['shell', 'settings', 'get', 'secure', 'enabled_accessibility_services']);
    const raw = (accRes.stdout || '').trim();
    const services = raw && raw !== 'null' ? raw.split(':').filter(Boolean) : [];
    return sendJson(res, 200, {
      ok: true,
      raw,
      services,
      hasActiveServices: services.length > 0
    });
  }

  // POST /api/clear-accessibility - Immediately disable all accessibility services (Stop ghost scrolling & auto-clickers)
  if (pathname === '/api/clear-accessibility' && req.method === 'POST') {
    const resClear = await runAdb(['shell', 'settings', 'put', 'secure', 'enabled_accessibility_services', '""']);
    if (!resClear.ok) {
      return sendJson(res, 500, { ok: false, message: 'ไม่สามารถปิด Accessibility ได้: ' + resClear.stderr });
    }
    return sendJson(res, 200, {
      ok: true,
      message: 'ปิดสิทธิ์ Accessibility ทั้งหมดสำเร็จแล้ว! อาการแย่งกดหน้าจอหรือเลื่อนเองจะหยุดทันที'
    });
  }

  // POST /api/force-stop - Force stop app
  if (pathname === '/api/force-stop' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const pkg = body.package;
    if (!pkg) return sendJson(res, 400, { ok: false, message: 'กรุณาระบุ package' });

    const stopRes = await runAdb(['shell', 'am', 'force-stop', pkg]);
    if (!stopRes.ok) {
      return sendJson(res, 500, { ok: false, message: 'หยุดการทำงานไม่สำเร็จ: ' + stopRes.stderr });
    }
    return sendJson(res, 200, { ok: true, message: `สั่งหยุดการทำงานของ ${pkg} เรียบร้อยแล้ว` });
  }

  // POST /api/reboot - Reboot device (normal, safe-mode, bootloader, recovery, fastbootd)
  if (pathname === '/api/reboot' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const mode = body.mode || 'normal';
    let args = ['reboot'];
    let msg = 'กำลังรีสตาร์ทมือถือ...';

    if (mode === 'safe-mode') {
      args = ['reboot', 'safe-mode'];
      msg = 'กำลังรีสตาร์ทมือถือเข้าสู่ Safe Mode...';
    } else if (mode === 'bootloader') {
      args = ['reboot', 'bootloader'];
      msg = 'กำลังรีสตาร์ทมือถือเข้าสู่ Fastboot / Bootloader...';
    } else if (mode === 'recovery') {
      args = ['reboot', 'recovery'];
      msg = 'กำลังรีสตาร์ทมือถือเข้าสู่ Recovery Mode...';
    } else if (mode === 'fastbootd') {
      args = ['reboot', 'fastboot'];
      msg = 'กำลังรีสตาร์ทมือถือเข้าสู่ FastbootD...';
    } else if (mode === 'sideload') {
      args = ['reboot', 'sideload'];
      msg = 'กำลังรีสตาร์ทมือถือเข้าสู่โหมด Sideload...';
    }

    const rebRes = await runAdb(args);
    if (!rebRes.ok) {
      return sendJson(res, 500, { ok: false, message: 'คำสั่งรีบูตไม่สำเร็จ: ' + rebRes.stderr });
    }
    return sendJson(res, 200, {
      ok: true,
      message: msg
    });
  }

  // ==========================================
  // MODULE 2: Banking & Privacy Guard APIs
  // ==========================================

  // GET /api/bank-check - Check camera hogs, accessibility apps, and USB debugging status
  if (pathname === '/api/bank-check' && req.method === 'GET') {
    const [camRes, accRes, adbRes, devRes] = await Promise.all([
      runAdb(['shell', 'dumpsys', 'camera']),
      runAdb(['shell', 'settings', 'get', 'secure', 'enabled_accessibility_services']),
      runAdb(['shell', 'settings', 'get', 'global', 'adb_enabled']),
      runAdb(['shell', 'settings', 'get', 'global', 'development_settings_enabled'])
    ]);

    // Parse camera clients
    const cameraApps = new Set();
    if (camRes.ok) {
      const text = camRes.stdout;
      // Match active clients in dumpsys camera
      const m1 = text.matchAll(/Client\[\d+\]\s*\([^\)]*,\s*([a-zA-Z0-9_.]+)/g);
      for (const match of m1) {
        if (match[1] && !match[1].includes('android.hardware') && !match[1].includes('mediaserver')) {
          cameraApps.add(match[1]);
        }
      }
      const m2 = text.matchAll(/clientPackageName\s*=\s*([a-zA-Z0-9_.]+)/g);
      for (const match of m2) {
        if (match[1] && !match[1].includes('android.hardware') && !match[1].includes('mediaserver')) {
          cameraApps.add(match[1]);
        }
      }
      const m3 = text.matchAll(/User:\s*([a-zA-Z0-9_.]+)/g);
      for (const match of m3) {
        if (match[1] && match[1].includes('.')) {
          cameraApps.add(match[1]);
        }
      }
    }

    // Parse accessibility
    const rawAcc = (accRes.stdout || '').trim();
    const accServices = rawAcc && rawAcc !== 'null' ? rawAcc.split(':').filter(Boolean) : [];

    const adbEnabled = (adbRes.stdout || '').trim() === '1';
    const devSettingsEnabled = (devRes.stdout || '').trim() === '1';

    const isBankReady = cameraApps.size === 0 && accServices.length === 0 && !adbEnabled;

    return sendJson(res, 200, {
      ok: true,
      cameraApps: Array.from(cameraApps),
      accessibilityServices: accServices,
      adbEnabled,
      devSettingsEnabled,
      isBankReady
    });
  }

  // POST /api/disable-adb - One-click disable USB Debugging & Dev Options to unblock banking apps
  if (pathname === '/api/disable-adb' && req.method === 'POST') {
    await runAdb(['shell', 'settings', 'put', 'global', 'adb_enabled', '0']);
    await runAdb(['shell', 'settings', 'put', 'global', 'development_settings_enabled', '0']);
    return sendJson(res, 200, {
      ok: true,
      message: 'ปิดโหมดการดีบัก USB และโหมดนักพัฒนาเรียบร้อยแล้ว! สามารถดึงสายออกแล้วเข้าแอปเป๋าตัง/ธนาคารได้ทันที'
    });
  }

  // ==========================================
  // MODULE 3: Universal Debloater APIs
  // ==========================================

  // GET /api/debloat-list - Get all system packages and match against known bloatware
  if (pathname === '/api/debloat-list' && req.method === 'GET') {
    const [sysRes, uninstalledRes] = await Promise.all([
      runAdb(['shell', 'pm', 'list', 'packages', '-s', '-f']),
      runAdb(['shell', 'pm', 'list', 'packages', '-u', '-d'])
    ]);

    if (!sysRes.ok) {
      return sendJson(res, 500, { ok: false, message: 'ไม่สามารถดึงรายชื่อแอประบบได้: ' + sysRes.stderr });
    }

    const uninstalledSet = new Set();
    if (uninstalledRes.ok) {
      uninstalledRes.stdout.split('\n').forEach(line => {
        const p = line.trim().replace(/^package:/, '');
        if (p) uninstalledSet.add(p);
      });
    }

    const lines = sysRes.stdout.split('\n').map(l => l.trim()).filter(l => l.startsWith('package:'));
    const packages = [];

    for (const line of lines) {
      const clean = line.replace(/^package:/, '');
      const eqIdx = clean.lastIndexOf('=');
      const pkgName = eqIdx !== -1 ? clean.substring(eqIdx + 1) : clean;

      const known = BLOATWARE_DB[pkgName];
      packages.push({
        packageName: pkgName,
        name: known ? known.name : pkgName,
        desc: known ? known.desc : 'แอปพลิเคชันระบบ',
        brand: known ? known.brand : 'System',
        safety: known ? known.safety : 'system', // safe, recommended, system
        isKnown: !!known,
        isUninstalled: uninstalledSet.has(pkgName)
      });
    }

    return sendJson(res, 200, {
      ok: true,
      totalCount: packages.length,
      packages
    });
  }

  // POST /api/debloat-uninstall - Uninstall system bloatware via user 0
  if (pathname === '/api/debloat-uninstall' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const pkg = body.package;
    if (!pkg) return sendJson(res, 400, { ok: false, message: 'กรุณาระบุ package' });

    // Force stop first
    await runAdb(['shell', 'am', 'force-stop', pkg]);

    const unRes = await runAdb(['shell', 'pm', 'uninstall', '-k', '--user', '0', pkg]);
    if (unRes.ok && unRes.stdout.includes('Success')) {
      return sendJson(res, 200, {
        ok: true,
        package: pkg,
        message: `ลบ ${pkg} ออกจากผู้ใช้เรียบร้อยแล้ว (สามารถกู้คืนได้ตลอดเวลา)`
      });
    }
    return sendJson(res, 500, {
      ok: false,
      message: 'ลบแอประบบไม่สำเร็จ: ' + (unRes.stderr || unRes.stdout)
    });
  }

  // POST /api/debloat-restore - Restore uninstalled system package
  if (pathname === '/api/debloat-restore' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const pkg = body.package;
    if (!pkg) return sendJson(res, 400, { ok: false, message: 'กรุณาระบุ package' });

    const resRest = await runAdb(['shell', 'cmd', 'package', 'install-existing', pkg]);
    if (resRest.ok && (resRest.stdout.includes('installed') || !resRest.stdout.includes('Error'))) {
      return sendJson(res, 200, {
        ok: true,
        package: pkg,
        message: `กู้คืน ${pkg} กลับมาใช้งานได้ตามปกติแล้ว`
      });
    }
    return sendJson(res, 500, {
      ok: false,
      message: 'กู้คืนแอปไม่สำเร็จ: ' + (resRest.stderr || resRest.stdout)
    });
  }

  // ==========================================
  // MODULE 4: Hardware/Firmware Flashing APIs
  // ==========================================

  // GET /api/fastboot/devices - List devices currently in Fastboot mode
  if (pathname === '/api/fastboot/devices' && req.method === 'GET') {
    const fbRes = await runFastboot(['devices'], 3000);
    const devices = [];
    if (fbRes.ok && fbRes.stdout.trim().length > 0) {
      const lines = fbRes.stdout.trim().split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 2) {
          devices.push({ serial: parts[0], mode: parts[1] });
        }
      }
    }
    return sendJson(res, 200, {
      ok: true,
      connected: devices.length > 0,
      devices
    });
  }

  // GET /api/fastboot/info - Get hardware variables from Fastboot
  if (pathname === '/api/fastboot/info' && req.method === 'GET') {
    const devCheck = await runFastboot(['devices'], 3000);
    if (!devCheck.ok || !devCheck.stdout.trim()) {
      return sendJson(res, 200, {
        ok: false,
        message: 'ไม่พบอุปกรณ์ในโหมด Fastboot กรุณาต่อสาย USB และเปิดมือถือเข้าหน้า Fastboot / Bootloader'
      });
    }

    // Query essential fastboot variables
    const [allRes, prodRes, unlockRes, slotRes, secRes, userRes] = await Promise.all([
      runFastboot(['getvar', 'all'], 5000),
      runFastboot(['getvar', 'product'], 4000),
      runFastboot(['getvar', 'unlocked'], 4000),
      runFastboot(['getvar', 'current-slot'], 4000),
      runFastboot(['getvar', 'secure'], 4000),
      runFastboot(['getvar', 'is-userspace'], 4000)
    ]);

    const combinedOutput = [
      allRes.output,
      prodRes.output,
      unlockRes.output,
      slotRes.output,
      secRes.output,
      userRes.output
    ].filter(Boolean).join('\n');

    const extractVar = (key) => {
      const reg = new RegExp(`(?:bootloader\\)\\s*)?${key}:\\s*([^\\r\\n]+)`, 'i');
      const m = combinedOutput.match(reg);
      return m ? m[1].trim() : null;
    };

    const product = extractVar('product');
    const unlocked = extractVar('unlocked');
    const currentSlot = extractVar('current-slot');
    const secure = extractVar('secure');
    const isUserspace = extractVar('is-userspace');

    return sendJson(res, 200, {
      ok: true,
      product: product || 'Unknown',
      unlocked: unlocked ? (unlocked.toLowerCase() === 'yes' ? 'yes' : 'no') : 'unknown',
      currentSlot: currentSlot ? currentSlot.toLowerCase() : 'none',
      isUserspace: isUserspace ? isUserspace.toLowerCase() === 'yes' : false,
      secure: secure ? secure.toLowerCase() === 'yes' : null,
      raw: combinedOutput
    });
  }

  // POST /api/fastboot/flash - Flash partition (e.g. boot, recovery, vbmeta, super)
  if (pathname === '/api/fastboot/flash' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const partition = (body.partition || '').trim();
    const filePath = (body.filePath || '').trim();
    const disableVerity = !!body.disableVerity;

    if (!partition || !/^[a-zA-Z0-9_\-\.]+$/.test(partition)) {
      return sendJson(res, 400, { ok: false, message: 'ชื่อพาร์ติชันไม่ถูกต้อง' });
    }

    if (!filePath) {
      return sendJson(res, 400, { ok: false, message: 'กรุณาระบุที่อยู่ไฟล์ (File Path) บนคอมพิวเตอร์' });
    }

    if (!fs.existsSync(filePath)) {
      return sendJson(res, 400, { ok: false, message: `ไม่พบไฟล์ที่ระบุ: ${filePath}` });
    }

    const stat = fs.statSync(filePath);
    if (!stat.isFile()) {
      return sendJson(res, 400, { ok: false, message: 'เส้นทางที่ระบุไม่ใช่ไฟล์ที่ถูกต้อง' });
    }

    // Check device connection
    const devCheck = await runFastboot(['devices'], 3000);
    if (!devCheck.ok || !devCheck.stdout.trim()) {
      return sendJson(res, 400, {
        ok: false,
        message: 'ไม่พบอุปกรณ์ในโหมด Fastboot กรุณาต่อสาย USB และเปิดเครื่องเข้า Fastboot ก่อน'
      });
    }

    let args = [];
    if (partition === 'vbmeta' && disableVerity) {
      args = ['--disable-verity', '--disable-verification', 'flash', 'vbmeta', filePath];
    } else {
      args = ['flash', partition, filePath];
    }

    const flashRes = await runFastboot(args, 180000); // 3 minutes timeout
    return sendJson(res, 200, {
      ok: flashRes.ok,
      message: flashRes.ok
        ? `แฟลชพาร์ติชัน ${partition} เรียบร้อยแล้ว!`
        : `การแฟลชล้มเหลว: ${flashRes.output || flashRes.error}`,
      output: flashRes.output
    });
  }

  // POST /api/fastboot/boot - Temporary boot (e.g. fastboot boot twrp.img / boot.img)
  if (pathname === '/api/fastboot/boot' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const filePath = (body.filePath || '').trim();

    if (!filePath || !fs.existsSync(filePath)) {
      return sendJson(res, 400, { ok: false, message: 'ไม่พบไฟล์อิมเมจที่ระบุบนคอมพิวเตอร์' });
    }

    const devCheck = await runFastboot(['devices'], 3000);
    if (!devCheck.ok || !devCheck.stdout.trim()) {
      return sendJson(res, 400, { ok: false, message: 'ไม่พบอุปกรณ์ในโหมด Fastboot' });
    }

    const bootRes = await runFastboot(['boot', filePath], 60000);
    return sendJson(res, 200, {
      ok: bootRes.ok,
      message: bootRes.ok
        ? 'ส่งไฟล์และสั่งบูตชั่วคราวสำเร็จ! (โทรศัพท์จะบูตเข้าระบบทดลองทันที)'
        : `บูตไม่สำเร็จ: ${bootRes.output || bootRes.error}`,
      output: bootRes.output
    });
  }

  // POST /api/fastboot/slot - Switch active A/B slot
  if (pathname === '/api/fastboot/slot' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const slot = (body.slot || '').toLowerCase().trim();

    if (slot !== 'a' && slot !== 'b' && slot !== 'other') {
      return sendJson(res, 400, { ok: false, message: 'สล็อตต้องเป็น a, b หรือ other' });
    }

    const devCheck = await runFastboot(['devices'], 3000);
    if (!devCheck.ok || !devCheck.stdout.trim()) {
      return sendJson(res, 400, { ok: false, message: 'ไม่พบอุปกรณ์ในโหมด Fastboot' });
    }

    const slotRes = await runFastboot(['set_active', slot], 10000);
    return sendJson(res, 200, {
      ok: slotRes.ok,
      message: slotRes.ok
        ? `สลับสล็อตสำเร็จ! ปัจจุบันระบบเปลี่ยนไปใช้ Slot: ${slot.toUpperCase()}`
        : `สลับสล็อตไม่สำเร็จ: ${slotRes.output || slotRes.error}`,
      output: slotRes.output
    });
  }

  // POST /api/fastboot/erase - Wipe partition (e.g. cache, userdata)
  if (pathname === '/api/fastboot/erase' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const partition = (body.partition || '').trim();

    if (!partition || !/^[a-zA-Z0-9_\-]+$/.test(partition)) {
      return sendJson(res, 400, { ok: false, message: 'ชื่อพาร์ติชันไม่ถูกต้อง' });
    }

    const devCheck = await runFastboot(['devices'], 3000);
    if (!devCheck.ok || !devCheck.stdout.trim()) {
      return sendJson(res, 400, { ok: false, message: 'ไม่พบอุปกรณ์ในโหมด Fastboot' });
    }

    const eraseRes = await runFastboot(['erase', partition], 30000);
    return sendJson(res, 200, {
      ok: eraseRes.ok,
      message: eraseRes.ok
        ? `ล้างข้อมูลพาร์ติชัน ${partition} สำเร็จแล้ว`
        : `ล้างข้อมูลไม่สำเร็จ: ${eraseRes.output || eraseRes.error}`,
      output: eraseRes.output
    });
  }

  // POST /api/fastboot/reboot - Reboot from fastboot mode
  if (pathname === '/api/fastboot/reboot' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const target = body.target || 'system'; // system, recovery, bootloader, fastbootd

    let args = ['reboot'];
    let msg = 'กำลังรีบูตเข้าสู่ระบบปกติ...';
    if (target === 'recovery') {
      args = ['reboot', 'recovery'];
      msg = 'กำลังรีบูตเข้าสู่ Recovery Mode...';
    } else if (target === 'bootloader') {
      args = ['reboot', 'bootloader'];
      msg = 'กำลังรีบูตกลับเข้า Bootloader...';
    } else if (target === 'fastbootd') {
      args = ['reboot', 'fastboot'];
      msg = 'กำลังรีบูตเข้าสู่ FastbootD...';
    }

    const devCheck = await runFastboot(['devices'], 3000);
    if (!devCheck.ok || !devCheck.stdout.trim()) {
      return sendJson(res, 400, { ok: false, message: 'ไม่พบอุปกรณ์ในโหมด Fastboot' });
    }

    const rebRes = await runFastboot(args, 15000);
    return sendJson(res, 200, {
      ok: rebRes.ok,
      message: rebRes.ok ? msg : `รีบูตไม่สำเร็จ: ${rebRes.output || rebRes.error}`,
      output: rebRes.output
    });
  }

  // POST /api/sideload - Flash ROM/Update via ADB Sideload
  if (pathname === '/api/sideload' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const filePath = (body.filePath || '').trim();

    if (!filePath || !fs.existsSync(filePath)) {
      return sendJson(res, 400, { ok: false, message: 'ไม่พบไฟล์ .zip ที่ระบุบนคอมพิวเตอร์' });
    }

    if (!filePath.toLowerCase().endsWith('.zip')) {
      return sendJson(res, 400, { ok: false, message: 'ไฟล์ Sideload ต้องเป็นนามสกุล .zip เท่านั้น' });
    }

    const sideRes = await runAdb(['sideload', filePath], 300000); // 5 minutes timeout
    const combined = [sideRes.stdout, sideRes.stderr].filter(Boolean).join('\n');
    return sendJson(res, 200, {
      ok: sideRes.ok,
      message: sideRes.ok
        ? 'ส่งไฟล์ผ่าน ADB Sideload สำเร็จแล้ว! เครื่องมือกำลังติดตั้งบนโทรศัพท์'
        : `Sideload ล้มเหลว: ${combined || sideRes.error}`,
      output: combined
    });
  }

  // 404 for unknown API
  return sendJson(res, 404, { ok: false, message: 'API Not Found' });
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  // Handle API routes
  if (pathname.startsWith('/api/')) {
    try {
      await handleApi(req, res, pathname);
    } catch (err) {
      console.error('[API Error]', err);
      sendJson(res, 500, { ok: false, message: 'Internal Server Error: ' + err.message });
    }
    return;
  }

  // Serve Static Files
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  // Security check: prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA if not found
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500);
        res.end('Error loading file');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`\n=======================================================`);
    console.log(`   [!] Port ${PORT} is already in use.`);
    console.log(`   Android Rescue Shield is already running!`);
    console.log(`   Opening GUI window at http://localhost:${PORT} ...`);
    console.log(`=======================================================\n`);

    const appUrl = `http://localhost:${PORT}`;
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const edgePath64 = 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe';

    if (fs.existsSync(edgePath)) {
      execFile(edgePath, [`--app=${appUrl}`], () => {});
    } else if (fs.existsSync(edgePath64)) {
      execFile(edgePath64, [`--app=${appUrl}`], () => {});
    } else {
      const { exec } = require('child_process');
      exec(`start ${appUrl}`);
    }
  } else {
    console.error('[Server Error]', err);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`=======================================================`);
  console.log(`   Android Rescue Shield`);
  console.log(`   Server running at: http://127.0.0.1:${PORT}`);
  console.log(`=======================================================`);

  // Auto-launch desktop GUI window
  const appUrl = `http://localhost:${PORT}`;
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgePath64 = 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe';

  if (fs.existsSync(edgePath)) {
    execFile(edgePath, [`--app=${appUrl}`], () => {});
  } else if (fs.existsSync(edgePath64)) {
    execFile(edgePath64, [`--app=${appUrl}`], () => {});
  } else {
    const { exec } = require('child_process');
    exec(`start ${appUrl}`);
  }
});

