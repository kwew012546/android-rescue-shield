// Android Rescue Suite Frontend Logic

// App State
const state = {
  device: null,
  apps: [],
  detailedApps: new Map(), // package -> details
  topApp: null,
  pendingUninstallPackage: null,
  isScanning: false,
  topAppTimer: null,
  activeTab: 'tab-rescue',
  debloatApps: [],
  bankData: null
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

  // Global Inline Message
  emergencyFeedback: document.getElementById('emergency-feedback'),

  // Tab 1: Emergency & Rescue
  topAppDisplay: document.getElementById('top-app-display'),
  btnEmergencyKill: document.getElementById('btn-emergency-kill'),
  btnKillGhost: document.getElementById('btn-kill-ghost'),
  btnEmergencyUninstall: document.getElementById('btn-emergency-uninstall'),
  appsCountBadge: document.getElementById('apps-count-badge'),
  inputSearch: document.getElementById('input-search'),
  selectFilter: document.getElementById('select-filter'),
  btnScanDeep: document.getElementById('btn-scan-deep'),
  appsTbody: document.getElementById('apps-tbody'),

  // Tab 2: Bank Guard
  btnBankRefresh: document.getElementById('btn-bank-refresh'),
  labelCameraStatus: document.getElementById('label-camera-status'),
  cameraHogsList: document.getElementById('camera-hogs-list'),
  labelAccStatus: document.getElementById('label-acc-status'),
  accServicesList: document.getElementById('acc-services-list'),
  labelAdbStatus: document.getElementById('label-adb-status'),
  btnDisableAdb: document.getElementById('btn-disable-adb'),

  // Tab 3: Debloater
  debloatCountBadge: document.getElementById('debloat-count-badge'),
  inputSearchDebloat: document.getElementById('input-search-debloat'),
  selectFilterDebloat: document.getElementById('select-filter-debloat'),
  btnReloadDebloat: document.getElementById('btn-reload-debloat'),
  debloatTbody: document.getElementById('debloat-tbody'),

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

  // Tab Switching
  document.querySelectorAll('.suite-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Tab 1 Events
  el.btnEmergencyKill.addEventListener('click', handleEmergencyKill);
  if (el.btnKillGhost) {
    el.btnKillGhost.addEventListener('click', handleKillGhost);
  }
  el.btnEmergencyUninstall.addEventListener('click', () => {
    if (state.topApp && state.topApp.package) {
      promptUninstall(state.topApp.package);
    }
  });
  el.btnScanDeep.addEventListener('click', runDeepScan);
  el.inputSearch.addEventListener('input', renderAppsTable);
  el.selectFilter.addEventListener('change', renderAppsTable);

  // Tab 2 Events (Bank Guard)
  if (el.btnBankRefresh) {
    el.btnBankRefresh.addEventListener('click', loadBankCheck);
  }
  if (el.btnDisableAdb) {
    el.btnDisableAdb.addEventListener('click', handleDisableAdb);
  }

  // Tab 3 Events (Debloater)
  if (el.btnReloadDebloat) {
    el.btnReloadDebloat.addEventListener('click', loadDebloatList);
  }
  if (el.inputSearchDebloat) {
    el.inputSearchDebloat.addEventListener('input', renderDebloatTable);
  }
  if (el.selectFilterDebloat) {
    el.selectFilterDebloat.addEventListener('change', renderDebloatTable);
  }

  // Quick Actions
  el.btnRebootSafe.addEventListener('click', () => handleReboot('safe-mode'));
  el.btnRebootNormal.addEventListener('click', () => handleReboot('normal'));

  el.btnCancelUninstall.addEventListener('click', closeModal);
  el.btnConfirmUninstall.addEventListener('click', executeUninstall);
}

// Tab Switching Handler
function switchTab(tabId) {
  state.activeTab = tabId;
  document.querySelectorAll('.suite-tab-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.tab-pane').forEach(p => {
    p.classList.toggle('hidden', p.id !== tabId);
  });

  if (tabId === 'tab-bank') {
    loadBankCheck();
  } else if (tabId === 'tab-debloat') {
    if (state.debloatApps.length === 0) {
      loadDebloatList();
    }
  }
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
  if (!state.device || state.activeTab !== 'tab-rescue') return;
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
  } catch (e) {}
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

async function handleKillGhost() {
  if (!el.btnKillGhost) return;
  const btn = el.btnKillGhost;
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="loading-spinner"></span> กำลังปิดสิทธิ์ Accessibility...`;

  try {
    const res = await fetch('/api/clear-accessibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (data.ok) {
      showEmergencyMessage(`✅ ${data.message}`, 'success');
      pollTopApp();
      loadAppsList();
    } else {
      showEmergencyMessage(`⚠️ ${data.message}`, 'error');
    }
  } catch (err) {
    showEmergencyMessage(`❌ ${err.message}`, 'error');
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
  }, 4500);
}

// 4. Load Apps List (Tab 1)
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
      inspectBatch(data.apps.slice(0, 15));
    } else {
      el.appsTbody.innerHTML = `<tr><td colspan="5" class="td-empty">ไม่สามารถโหลดรายชื่อแอปได้: ${data.message || ''}</td></tr>`;
    }
  } catch (err) {
    el.appsTbody.innerHTML = `<tr><td colspan="5" class="td-empty">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>`;
  }
}

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

async function inspectBatch(appList) {
  for (const app of appList) {
    if (!state.detailedApps.has(app.packageName)) {
      await inspectApp(app.packageName);
      await new Promise(r => setTimeout(r, 60));
    }
  }
  renderAppsTable();
}

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

// 5. Render Apps Table (Tab 1)
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

    let riskBadge = '<span class="badge-risk badge-normal">ทั่วไป</span>';
    if (risk === 'dangerous' || isDeviceAdmin) {
      riskBadge = '<span class="badge-risk badge-danger">🔴 เสี่ยงสูง (Adware/Lock)</span>';
    } else if (risk === 'warning') {
      riskBadge = '<span class="badge-risk badge-warning">🟡 เฝ้าระวัง</span>';
    }

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
            <button class="btn btn-secondary btn-sm" onclick="forceStopApp('${escapeHtml(app.packageName)}', this)" title="สั่งหยุดการทำงาน">
              🛑 หยุด
            </button>
            <button class="btn btn-ghost btn-sm" onclick="freezeApp('${escapeHtml(app.packageName)}', this)" title="แช่แข็ง ปิดการทำงานไม่ให้รันตัวเองได้อีก">
              ❄️ แช่แข็ง
            </button>
            <button class="btn btn-danger btn-sm" onclick="promptUninstall('${escapeHtml(app.packageName)}')" title="ถอนการติดตั้ง">
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

// 6. Action: Copy Package Name
window.copyPackage = function(pkg, btn) {
  navigator.clipboard.writeText(pkg).then(() => {
    const orig = btn.innerText;
    btn.innerText = '✅';
    setTimeout(() => {
      btn.innerText = orig;
    }, 1500);
  });
};

// 7. Action: Force Stop
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

// 7.1 Action: Freeze App
window.freezeApp = async function(pkg, btn) {
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerText = '⏳';

  try {
    const res = await fetch('/api/freeze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package: pkg, action: 'disable' })
    });
    const data = await res.json();
    if (data.ok) {
      btn.innerText = '❄️ แช่แข็งแล้ว';
      showEmergencyMessage(`✅ แช่แข็ง ${pkg} สำเร็จแล้ว แอปถูกปิดกั้นการทำงาน 100%`, 'success');
    } else {
      btn.innerText = '❌ ผิดพลาด';
      showEmergencyMessage(`⚠️ ${data.message}`, 'error');
    }
  } catch (e) {
    btn.innerText = '❌';
  }

  setTimeout(() => {
    btn.innerHTML = orig;
    btn.disabled = false;
  }, 2000);
};

// 8. Action: Prompt & Execute Uninstall
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

// 9. Module 2: Banking & Privacy Guard
async function loadBankCheck() {
  el.labelCameraStatus.textContent = '⏳ กำลังตรวจเซ็นเซอร์กล้อง...';
  el.labelAccStatus.textContent = '⏳ กำลังตรวจสิทธิ์เข้าถึง...';
  el.cameraHogsList.innerHTML = '';
  el.accServicesList.innerHTML = '';

  try {
    const res = await fetch('/api/bank-check');
    const data = await res.json();
    state.bankData = data;

    // 1. Camera check
    if (data.cameraApps && data.cameraApps.length > 0) {
      el.labelCameraStatus.className = 'status-indicator danger';
      el.labelCameraStatus.textContent = `❌ พบ ${data.cameraApps.length} แอปกำลังแอบใช้กล้องอยู่!`;
      el.cameraHogsList.innerHTML = data.cameraApps.map(pkg => `
        <div class="hog-item">
          <code>${escapeHtml(pkg)}</code>
          <button class="btn btn-danger btn-sm" onclick="forceStopApp('${escapeHtml(pkg)}', this)">🛑 สั่งปิดกล้องทันที</button>
        </div>
      `).join('');
    } else {
      el.labelCameraStatus.className = 'status-indicator ready';
      el.labelCameraStatus.textContent = '✅ เซ็นเซอร์กล้องว่าง พร้อมสแกนหน้าปลอดภัย';
      el.cameraHogsList.innerHTML = '<span style="font-size: 0.82rem; color: #94a3b8;">ไม่มีแอปใดแอบดักจับภาพเบื้องหลัง</span>';
    }

    // 2. Accessibility check
    if (data.accessibilityServices && data.accessibilityServices.length > 0) {
      el.labelAccStatus.className = 'status-indicator warn';
      el.labelAccStatus.textContent = `⚠️ พบ ${data.accessibilityServices.length} สิทธิ์ที่เปิดค้างไว้`;
      el.accServicesList.innerHTML = `
        <div style="font-size: 0.82rem; color: #fde68a;">
          ${data.accessibilityServices.map(s => `<div>• ${escapeHtml(s)}</div>`).join('')}
        </div>
        <button class="btn btn-secondary btn-sm" style="margin-top: 0.5rem;" onclick="handleKillGhost()">👻 ปิดสิทธิ์ทั้งหมดทันที</button>
      `;
    } else {
      el.labelAccStatus.className = 'status-indicator ready';
      el.labelAccStatus.textContent = '✅ ปลอดภัย ไม่พบแอปดักจับหรือแอบควบคุมจอ';
      el.accServicesList.innerHTML = '<span style="font-size: 0.82rem; color: #94a3b8;">ปลอดภัยจากแอปรีโมทและโทรจันดูดเงิน</span>';
    }

    // 3. ADB Status
    if (data.adbEnabled) {
      el.labelAdbStatus.className = 'status-indicator warn';
      el.labelAdbStatus.textContent = '⚠️ เปิดอยู่ (ต้องกดปิดด้านล่างก่อนเข้าแอปธนาคาร)';
    } else {
      el.labelAdbStatus.className = 'status-indicator ready';
      el.labelAdbStatus.textContent = '✅ ปิดแล้ว พร้อมเข้าแอปธนาคารได้ทันที';
    }
  } catch (err) {
    el.labelCameraStatus.textContent = 'เกิดข้อผิดพลาดในการตรวจสอบ';
  }
}

async function handleDisableAdb() {
  if (!confirm('คุณต้องการสั่งปิดการดีบัก USB จากคอมพิวเตอร์ใช่หรือไม่?\n\n(หลังจากกดปุ่มนี้ คอมพิวเตอร์จะตัดการเชื่อมต่อ ให้ดึงสายออกและเข้าแอปธนาคารได้ทันที)')) return;

  const btn = el.btnDisableAdb;
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="loading-spinner"></span> กำลังส่งคำสั่งปิด...`;

  try {
    const res = await fetch('/api/disable-adb', { method: 'POST' });
    const data = await res.json();
    if (data.ok) {
      showEmergencyMessage(`✅ ${data.message}`, 'success');
      el.labelAdbStatus.className = 'status-indicator ready';
      el.labelAdbStatus.textContent = '✅ ปิดสำเร็จแล้ว สามารถดึงสายออกได้เลย';
      setTimeout(checkDevice, 2000);
    } else {
      showEmergencyMessage(`❌ ${data.message}`, 'error');
    }
  } catch (e) {
    showEmergencyMessage(`❌ เกิดข้อผิดพลาด`, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

// 10. Module 3: Universal Debloater
async function loadDebloatList() {
  el.debloatTbody.innerHTML = `
    <tr>
      <td colspan="5" class="td-loading">
        <div class="loading-spinner"></div> กำลังดึงรายชื่อแอประบบ (System Bloatware)...
      </td>
    </tr>
  `;

  try {
    const res = await fetch('/api/debloat-list');
    const data = await res.json();
    if (data.ok && Array.isArray(data.packages)) {
      state.debloatApps = data.packages;
      el.debloatCountBadge.textContent = `${data.packages.length} แอประบบ`;
      renderDebloatTable();
    } else {
      el.debloatTbody.innerHTML = `<tr><td colspan="5" class="td-empty">ไม่สามารถโหลดรายชื่อได้: ${data.message || ''}</td></tr>`;
    }
  } catch (e) {
    el.debloatTbody.innerHTML = `<tr><td colspan="5" class="td-empty">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>`;
  }
}

function renderDebloatTable() {
  const query = (el.inputSearchDebloat ? el.inputSearchDebloat.value : '').trim().toLowerCase();
  const filter = el.selectFilterDebloat ? el.selectFilterDebloat.value : 'recommended';

  let list = state.debloatApps.filter(app => {
    const match = !query || app.packageName.toLowerCase().includes(query) || (app.name && app.name.toLowerCase().includes(query));
    if (!match) return false;

    if (filter === 'recommended') {
      return (app.safety === 'safe' || app.safety === 'recommended') && !app.isUninstalled;
    }
    if (filter === 'uninstalled') {
      return app.isUninstalled;
    }
    return true; // all
  });

  if (list.length === 0) {
    el.debloatTbody.innerHTML = `<tr><td colspan="5" class="td-empty">ไม่พบแอปตามเงื่อนไขที่ค้นหา</td></tr>`;
    return;
  }

  // Sort known first, then by name
  list.sort((a, b) => {
    if (a.isKnown && !b.isKnown) return -1;
    if (!a.isKnown && b.isKnown) return 1;
    return a.packageName.localeCompare(b.packageName);
  });

  const rows = list.map(app => {
    let safetyBadge = '<span class="badge-risk badge-system">System</span>';
    if (app.safety === 'safe') {
      safetyBadge = '<span class="badge-risk badge-safe">🟢 ปลอดภัย ลบได้เลย</span>';
    } else if (app.safety === 'recommended') {
      safetyBadge = '<span class="badge-risk badge-recommended">🟡 แนะนำหากไม่ใช้</span>';
    }

    const actionBtn = app.isUninstalled
      ? `<button class="btn btn-secondary btn-sm" onclick="debloatRestore('${escapeHtml(app.packageName)}', this)">🔄 กู้คืน (Restore)</button>`
      : `<button class="btn btn-danger btn-sm" onclick="debloatUninstall('${escapeHtml(app.packageName)}', this)">🗑️ ลบแอปนี้</button>`;

    return `
      <tr>
        <td>
          <strong>${escapeHtml(app.name)}</strong>
          <span style="font-size: 0.75rem; color: #94a3b8; display: block;">${escapeHtml(app.brand)}</span>
        </td>
        <td><code class="pkg-code">${escapeHtml(app.packageName)}</code></td>
        <td style="font-size: 0.85rem; color: #cbd5e1;">${escapeHtml(app.desc)}</td>
        <td>${safetyBadge}</td>
        <td class="td-actions">${actionBtn}</td>
      </tr>
    `;
  }).join('');

  el.debloatTbody.innerHTML = rows;
}

window.debloatUninstall = async function(pkg, btn) {
  if (!confirm(`คุณต้องการลบแอประบบ "${pkg}" ออกจากผู้ใช้นี้ใช่หรือไม่?\n\n(คุณสามารถกู้คืนกลับมาได้ตลอดเวลา)`)) return;

  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerText = '⏳';

  try {
    const res = await fetch('/api/debloat-uninstall', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package: pkg })
    });
    const data = await res.json();
    if (data.ok) {
      showEmergencyMessage(`✅ ${data.message}`, 'success');
      const item = state.debloatApps.find(a => a.packageName === pkg);
      if (item) item.isUninstalled = true;
      renderDebloatTable();
    } else {
      showEmergencyMessage(`❌ ${data.message}`, 'error');
      btn.innerHTML = orig;
      btn.disabled = false;
    }
  } catch (e) {
    showEmergencyMessage('❌ เกิดข้อผิดพลาด', 'error');
    btn.innerHTML = orig;
    btn.disabled = false;
  }
};

window.debloatRestore = async function(pkg, btn) {
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerText = '⏳';

  try {
    const res = await fetch('/api/debloat-restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package: pkg })
    });
    const data = await res.json();
    if (data.ok) {
      showEmergencyMessage(`✅ ${data.message}`, 'success');
      const item = state.debloatApps.find(a => a.packageName === pkg);
      if (item) item.isUninstalled = false;
      renderDebloatTable();
    } else {
      showEmergencyMessage(`❌ ${data.message}`, 'error');
      btn.innerHTML = orig;
      btn.disabled = false;
    }
  } catch (e) {
    showEmergencyMessage('❌ เกิดข้อผิดพลาด', 'error');
    btn.innerHTML = orig;
    btn.disabled = false;
  }
};

// 11. Reboot Actions
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
