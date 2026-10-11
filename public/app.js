// Android Rescue Shield Frontend Logic

// App State
const state = {
  device: null,
  apps: [],
  detailedApps: new Map(), // package -> details
  topApp: null,
  pendingUninstallPackage: null,
  isScanning: false,
  topAppTimer: null
};

// DOM Elements
const el = {
  devicePill: document.getElementById('device-pill'),
  devicePillText: document.getElementById('device-pill-text'),
  stateDisconnected: document.getElementById('state-disconnected'),
  stateUnauthorized: document.getElementById('state-unauthorized'),
  stateConnected: document.getElementById('state-connected'),
  emptyFeedback: document.getElementById('empty-feedback'),

  // Device Info
  devName: document.getElementById('dev-name'),
  devAndroid: document.getElementById('dev-android'),
  devSerial: document.getElementById('dev-serial'),
  devBattery: document.getElementById('dev-battery'),
  btnRebootSafe: document.getElementById('btn-reboot-safe'),
  btnRebootNormal: document.getElementById('btn-reboot-normal'),

  // Emergency Banner
  topAppDisplay: document.getElementById('top-app-display'),
  btnEmergencyKill: document.getElementById('btn-emergency-kill'),
  btnEmergencyUninstall: document.getElementById('btn-emergency-uninstall'),
  emergencyFeedback: document.getElementById('emergency-feedback'),

  // Scanner & Table
  appsCountBadge: document.getElementById('apps-count-badge'),
  inputSearch: document.getElementById('input-search'),
  selectFilter: document.getElementById('select-filter'),
  btnScanDeep: document.getElementById('btn-scan-deep'),
  appsTbody: document.getElementById('apps-tbody'),

  // Buttons for Check
  btnCheckDevice: document.getElementById('btn-check-device'),
  btnRetryAuth: document.getElementById('btn-retry-auth'),

  // Modal
  modalUninstall: document.getElementById('modal-uninstall'),
  modalPkgName: document.getElementById('modal-pkg-name'),
  btnCancelUninstall: document.getElementById('btn-cancel-uninstall'),
  btnConfirmUninstall: document.getElementById('btn-confirm-uninstall')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  checkDevice();
  bindEvents();
});

// Event Bindings
function bindEvents() {
  el.btnCheckDevice.addEventListener('click', () => {
    setInlineButtonFeedback(el.btnCheckDevice, '⏳ กำลังค้นหา...');
    checkDevice();
  });

  el.btnRetryAuth.addEventListener('click', () => {
    setInlineButtonFeedback(el.btnRetryAuth, '⏳ กำลังตรวจสอบ...');
    checkDevice();
  });

  el.btnEmergencyKill.addEventListener('click', handleEmergencyKill);
  el.btnEmergencyUninstall.addEventListener('click', () => {
    if (state.topApp && state.topApp.package) {
      promptUninstall(state.topApp.package);
    }
  });

  el.btnScanDeep.addEventListener('click', runDeepScan);
  el.inputSearch.addEventListener('input', renderAppsTable);
  el.selectFilter.addEventListener('change', renderAppsTable);

  el.btnRebootSafe.addEventListener('click', () => handleReboot('safe-mode'));
  el.btnRebootNormal.addEventListener('click', () => handleReboot('normal'));

  el.btnCancelUninstall.addEventListener('click', closeModal);
  el.btnConfirmUninstall.addEventListener('click', executeUninstall);
}

// Inline temporary button feedback helper (Quiet UX)
function setInlineButtonFeedback(btn, tempText, duration = 1500) {
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerText = tempText;
  setTimeout(() => {
    btn.innerHTML = originalHtml;
    btn.disabled = false;
  }, duration);
}

// 1. Device Connection Check
async function checkDevice() {
  try {
    const res = await fetch('/api/device');
    const data = await res.json();

    if (data.connected && data.state === 'device') {
      state.device = data;
      showState('connected');
      updateDeviceHeader(data);
      startTopAppMonitor();
      loadAppsList();
    } else if (data.state === 'unauthorized') {
      state.device = null;
      showState('unauthorized');
      updateHeaderPill('unauthorized', 'รอการอนุญาตบนมือถือ');
      stopTopAppMonitor();
    } else {
      state.device = null;
      showState('disconnected');
      updateHeaderPill('disconnected', 'ไม่ได้เชื่อมต่อ');
      stopTopAppMonitor();
      if (data.message && data.state === 'error') {
        el.emptyFeedback.textContent = data.message;
      }
    }
  } catch (err) {
    showState('disconnected');
    updateHeaderPill('disconnected', 'เซิร์ฟเวอร์ขัดข้อง');
    stopTopAppMonitor();
  }
}

function showState(mode) {
  el.stateDisconnected.classList.toggle('hidden', mode !== 'disconnected');
  el.stateUnauthorized.classList.toggle('hidden', mode !== 'unauthorized');
  el.stateConnected.classList.toggle('hidden', mode !== 'connected');
}

function updateHeaderPill(type, text) {
  el.devicePill.className = `status-pill status-${type}`;
  el.devicePillText.textContent = text;
}

function updateDeviceHeader(dev) {
  updateHeaderPill('connected', 'เชื่อมต่อแล้ว');
  el.devName.textContent = `${dev.brand ? dev.brand + ' ' : ''}${dev.model || 'Android Device'}`;
  el.devAndroid.textContent = `Android ${dev.androidVersion || '-'}`;
  el.devSerial.textContent = `ID: ${dev.serial || '-'}`;
  el.devBattery.textContent = dev.batteryLevel !== null ? `แบตเตอรี่: ${dev.batteryLevel}%` : 'แบตเตอรี่: -';
}

// 2. Real-time Top App Monitor
function startTopAppMonitor() {
  stopTopAppMonitor();
  pollTopApp();
  state.topAppTimer = setInterval(pollTopApp, 3500);
}

function stopTopAppMonitor() {
  if (state.topAppTimer) {
    clearInterval(state.topAppTimer);
    state.topAppTimer = null;
  }
}

async function pollTopApp() {
  if (!state.device) return;
  try {
    const res = await fetch('/api/top-app');
    const data = await res.json();
    state.topApp = data;

    if (data.package) {
      el.topAppDisplay.textContent = data.package;
      if (data.isSystemLauncher) {
        el.topAppDisplay.style.color = '#94a3b8';
        el.topAppDisplay.title = 'หน้าโฮมระบบ (Launcher ปกติ)';
        el.btnEmergencyUninstall.classList.add('hidden');
      } else {
        el.topAppDisplay.style.color = '#38bdf8';
        el.topAppDisplay.title = 'แอปภายนอกที่กำลังรันอยู่';
        el.btnEmergencyUninstall.classList.remove('hidden');
      }
    } else {
      el.topAppDisplay.textContent = 'ไม่สามารถตรวจจับหน้าจอได้';
      el.btnEmergencyUninstall.classList.add('hidden');
    }
  } catch (e) {
    // Silent degradation
  }
}

// 3. Emergency Kill Action
async function handleEmergencyKill() {
  const btn = el.btnEmergencyKill;
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="loading-spinner"></span> กำลังสั่งหยุด...`;

  try {
    const res = await fetch('/api/emergency-kill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await res.json();

    if (data.ok) {
      showEmergencyMessage(`✅ ${data.message}`, 'success');
      // Immediate re-check
      pollTopApp();
    } else {
      showEmergencyMessage(`⚠️ ${data.message}`, 'error');
    }
  } catch (err) {
    showEmergencyMessage(`❌ เกิดข้อผิดพลาดในการส่งคำสั่ง: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

function showEmergencyMessage(msg, type) {
  el.emergencyFeedback.textContent = msg;
  el.emergencyFeedback.className = `inline-msg active ${type}`;
  setTimeout(() => {
    el.emergencyFeedback.className = 'inline-msg';
  }, 4000);
}

// 4. Load Apps List
async function loadAppsList() {
  el.appsTbody.innerHTML = `
    <tr>
      <td colspan="5" class="td-loading">
        <div class="loading-spinner"></div> กำลังดึงรายชื่อแอป 3rd-party จากโทรศัพท์...
      </td>
    </tr>
  `;

  try {
    const res = await fetch('/api/apps');
    const data = await res.json();

    if (data.ok && Array.isArray(data.apps)) {
      state.apps = data.apps;
      el.appsCountBadge.textContent = `${data.apps.length} แอป`;
      renderAppsTable();

      // Automatically inspect first 15 newest apps in background for smooth experience
      inspectBatch(data.apps.slice(0, 15));
    } else {
      el.appsTbody.innerHTML = `<tr><td colspan="5" class="td-empty">ไม่สามารถโหลดรายชื่อแอปได้: ${data.message || ''}</td></tr>`;
    }
  } catch (err) {
    el.appsTbody.innerHTML = `<tr><td colspan="5" class="td-empty">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>`;
  }
}

// Inspect single app
async function inspectApp(pkgName) {
  if (state.detailedApps.has(pkgName)) {
    return state.detailedApps.get(pkgName);
  }
  try {
    const res = await fetch('/api/app-inspect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package: pkgName })
    });
    const data = await res.json();
    if (data.ok) {
      state.detailedApps.set(pkgName, data);
      return data;
    }
  } catch (e) {}
  return null;
}

// Background batch inspection
async function inspectBatch(appList) {
  for (const app of appList) {
    if (!state.detailedApps.has(app.packageName)) {
      await inspectApp(app.packageName);
      // Small pause to keep ADB responsive
      await new Promise(r => setTimeout(r, 60));
    }
  }
  renderAppsTable();
}

// Deep Scan button
async function runDeepScan() {
  if (state.isScanning) return;
  state.isScanning = true;
  const btn = el.btnScanDeep;
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="loading-spinner"></span> กำลังสแกน (${state.apps.length} แอป)...`;

  for (let i = 0; i < state.apps.length; i++) {
    const app = state.apps[i];
    if (!state.detailedApps.has(app.packageName)) {
      await inspectApp(app.packageName);
    }
    if (i % 5 === 0) {
      btn.innerHTML = `<span class="loading-spinner"></span> สแกนแล้ว ${i + 1}/${state.apps.length}...`;
      renderAppsTable();
    }
  }

  btn.disabled = false;
  btn.innerHTML = `✅ สแกนครบแล้ว`;
  state.isScanning = false;
  renderAppsTable();

  setTimeout(() => {
    btn.innerHTML = original;
  }, 2500);
}

// 5. Render Apps Table
function renderAppsTable() {
  const query = el.inputSearch.value.trim().toLowerCase();
  const filter = el.selectFilter.value;

  let filtered = state.apps.filter(app => {
    const matchQuery = !query || app.packageName.toLowerCase().includes(query);
    if (!matchQuery) return false;

    const details = state.detailedApps.get(app.packageName);
    const risk = details ? details.riskLevel : (app.isDeviceAdmin ? 'dangerous' : 'normal');

    if (filter === 'suspicious') {
      return risk === 'warning' || risk === 'dangerous' || app.isDeviceAdmin;
    }
    if (filter === 'dangerous') {
      return risk === 'dangerous' || app.isDeviceAdmin;
    }
    return true;
  });

  if (filtered.length === 0) {
    el.appsTbody.innerHTML = `<tr><td colspan="5" class="td-empty">ไม่พบแอปตามเงื่อนไขที่ค้นหา</td></tr>`;
    return;
  }

  // Sort: dangerous first, then by package name
  filtered.sort((a, b) => {
    const dA = state.detailedApps.get(a.packageName);
    const dB = state.detailedApps.get(b.packageName);
    const scoreA = getRiskScore(dA, a.isDeviceAdmin);
    const scoreB = getRiskScore(dB, b.isDeviceAdmin);
    return scoreB - scoreA;
  });

  const rowsHtml = filtered.map(app => {
    const details = state.detailedApps.get(app.packageName);
    const isDeviceAdmin = app.isDeviceAdmin;
    const risk = details ? details.riskLevel : (isDeviceAdmin ? 'dangerous' : 'normal');

    // Risk badge
    let riskBadge = '<span class="badge-risk badge-normal">ทั่วไป</span>';
    if (risk === 'dangerous' || isDeviceAdmin) {
      riskBadge = '<span class="badge-risk badge-danger">🔴 เสี่ยงสูง (Adware/Lock)</span>';
    } else if (risk === 'warning') {
      riskBadge = '<span class="badge-risk badge-warning">🟡 เฝ้าระวัง</span>';
    }

    // Permissions tags
    const tags = [];
    if (isDeviceAdmin) {
      tags.push('<span class="perm-tag tag-danger">🛡️ ล็อก Device Admin</span>');
    }
    if (details) {
      if (details.hasOverlay) tags.push('<span class="perm-tag tag-danger">📱 สิทธิ์วาดทับหน้าจอ</span>');
      if (details.hasBoot) tags.push('<span class="perm-tag">⚡ รันตอนเปิดเครื่อง</span>');
      if (details.hasAccessibility) tags.push('<span class="perm-tag tag-danger">👁️ สิทธิ์การเข้าถึง</span>');
      if (!details.hasLauncher) tags.push('<span class="perm-tag tag-danger">🚫 ไม่มีไอคอนในโฮม</span>');
    } else {
      tags.push('<span class="perm-tag" style="opacity: 0.6">รอสแกนละเอียด...</span>');
    }

    const installDate = details && details.firstInstallTime ? details.firstInstallTime : '-';

    return `
      <tr data-pkg="${escapeHtml(app.packageName)}">
        <td>${riskBadge}</td>
        <td>
          <code class="pkg-code">${escapeHtml(app.packageName)}</code>
          <button class="copy-btn" onclick="copyPackage('${escapeHtml(app.packageName)}', this)" title="คัดลอกชื่อ package">📋</button>
        </td>
        <td>${tags.join(' ')}</td>
        <td style="color: #94a3b8; font-size: 0.85rem;">${installDate}</td>
        <td class="td-actions">
          <div class="row-actions">
            <button class="btn btn-secondary btn-sm" onclick="forceStopApp('${escapeHtml(app.packageName)}', this)">
              🛑 หยุด
            </button>
            <button class="btn btn-danger btn-sm" onclick="promptUninstall('${escapeHtml(app.packageName)}')">
              🗑️ ถอน
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  el.appsTbody.innerHTML = rowsHtml;
}

function getRiskScore(details, isDeviceAdmin) {
  let score = 0;
  if (isDeviceAdmin) score += 5;
  if (!details) return score;
  if (details.hasOverlay) score += 4;
  if (details.hasBoot) score += 2;
  if (details.hasAccessibility) score += 3;
  if (!details.hasLauncher) score += 3;
  return score;
}

// 6. Action: Copy Package Name (Inline Feedback)
window.copyPackage = function(pkg, btn) {
  navigator.clipboard.writeText(pkg).then(() => {
    const orig = btn.innerText;
    btn.innerText = '✅';
    setTimeout(() => {
      btn.innerText = orig;
    }, 1500);
  });
};

// 7. Action: Force Stop Single App
window.forceStopApp = async function(pkg, btn) {
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerText = '⏳';

  try {
    const res = await fetch('/api/force-stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package: pkg })
    });
    const data = await res.json();
    if (data.ok) {
      btn.innerText = '✅ หยุดแล้ว';
    } else {
      btn.innerText = '❌ ผิดพลาด';
    }
  } catch (e) {
    btn.innerText = '❌';
  }

  setTimeout(() => {
    btn.innerHTML = orig;
    btn.disabled = false;
  }, 1500);
};

// 8. Action: Prompt & Execute Uninstall (Closed-Loop UX)
window.promptUninstall = function(pkg) {
  state.pendingUninstallPackage = pkg;
  el.modalPkgName.textContent = pkg;
  el.modalUninstall.classList.remove('hidden');
};

function closeModal() {
  state.pendingUninstallPackage = null;
  el.modalUninstall.classList.add('hidden');
}

async function executeUninstall() {
  const pkg = state.pendingUninstallPackage;
  if (!pkg) return;

  const btn = el.btnConfirmUninstall;
  btn.disabled = true;
  btn.innerHTML = `<span class="loading-spinner"></span> กำลังถอนการติดตั้ง...`;

  try {
    const res = await fetch('/api/uninstall', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package: pkg })
    });
    const data = await res.json();

    if (data.ok) {
      // Closed-Loop UX: Optimistically remove from local state immediately
      state.apps = state.apps.filter(a => a.packageName !== pkg);
      state.detailedApps.delete(pkg);
      el.appsCountBadge.textContent = `${state.apps.length} แอป`;
      closeModal();
      renderAppsTable();
      showEmergencyMessage(`✅ ถอนการติดตั้ง ${pkg} สำเร็จแล้ว`, 'success');
    } else {
      alert(`ไม่สามารถถอนการติดตั้งได้: ${data.message}`);
      btn.disabled = false;
      btn.innerHTML = `ยืนยันการลบแอป`;
    }
  } catch (err) {
    alert(`เกิดข้อผิดพลาด: ${err.message}`);
    btn.disabled = false;
    btn.innerHTML = `ยืนยันการลบแอป`;
  }
}

// 9. Reboot Actions
async function handleReboot(mode) {
  const label = mode === 'safe-mode' ? 'Safe Mode' : 'รีสตาร์ทปกติ';
  if (!confirm(`คุณต้องการสั่งให้โทรศัพท์มือถือเข้าสู่ "${label}" ใช่หรือไม่?`)) return;

  try {
    const res = await fetch('/api/reboot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode })
    });
    const data = await res.json();
    if (data.ok) {
      showEmergencyMessage(`✅ ${data.message}`, 'success');
      // After reboot, connection will drop
      setTimeout(checkDevice, 2000);
    } else {
      showEmergencyMessage(`❌ ${data.message}`, 'error');
    }
  } catch (err) {
    showEmergencyMessage(`❌ ${err.message}`, 'error');
  }
}

// Helper: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}
