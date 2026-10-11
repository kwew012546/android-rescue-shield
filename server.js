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

  // POST /api/reboot - Reboot device (normal or safe-mode)
  if (pathname === '/api/reboot' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const mode = body.mode; // 'safe-mode' or 'normal'
    const args = mode === 'safe-mode' ? ['reboot', 'safe-mode'] : ['reboot'];
    const rebRes = await runAdb(args);
    if (!rebRes.ok) {
      return sendJson(res, 500, { ok: false, message: 'คำสั่งรีบูตไม่สำเร็จ: ' + rebRes.stderr });
    }
    return sendJson(res, 200, {
      ok: true,
      message: mode === 'safe-mode' ? 'กำลังรีสตาร์ทมือถือเข้าสู่ Safe Mode...' : 'กำลังรีสตาร์ทมือถือ...'
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

server.listen(PORT, '127.0.0.1', () => {
  console.log(`=======================================================`);
  console.log(`🛡️  Android Adware & Screen Hijack Rescue Tool`);
  console.log(`🚀 Server running at: http://127.0.0.1:${PORT}`);
  console.log(`=======================================================`);
});
