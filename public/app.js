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
  bankData: null,
  scannedSamsungFirmware: {
    slots: null,
    targetDir: '',
    activeWipeMode: 'clean' // 'clean' or 'keep'
  }
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
  btnCheckFastboot: document.getElementById('btn-check-fastboot'),
  btnRetryAuth: document.getElementById('btn-retry-auth'),
  btnRebootFastboot: document.getElementById('btn-reboot-fastboot'),
  btnRebootRecovery: document.getElementById('btn-reboot-recovery'),

  // Tab 4: Flasher & Sideload
  fbModeBadge: document.getElementById('fb-mode-badge'),
  fbProductBadge: document.getElementById('fb-product-badge'),
  fbUnlockBadge: document.getElementById('fb-unlock-badge'),
  fbSlotBadge: document.getElementById('fb-slot-badge'),
  btnFbRefresh: document.getElementById('btn-fb-refresh'),
  btnRebootToBootloader: document.getElementById('btn-reboot-to-bootloader'),
  btnRebootToFastbootd: document.getElementById('btn-reboot-to-fastbootd'),
  btnRebootToRecovery: document.getElementById('btn-reboot-to-recovery'),
  btnRebootToDownload: document.getElementById('btn-reboot-to-download'),
  btnRebootToEdl: document.getElementById('btn-reboot-to-edl'),
  btnRebootToSystem: document.getElementById('btn-reboot-to-system'),
  fbFilePath: document.getElementById('fb-file-path'),
  fbFileBrowser: document.getElementById('fb-file-browser'),
  btnBrowseImg: document.getElementById('btn-browse-img'),
  fbPartitionSelect: document.getElementById('fb-partition-select'),
  fbCustomPartition: document.getElementById('fb-custom-partition'),
  fbDisableVerity: document.getElementById('fb-disable-verity'),
  btnExecuteFlash: document.getElementById('btn-execute-flash'),
  btnExecuteBoot: document.getElementById('btn-execute-boot'),
  sideloadFilePath: document.getElementById('sideload-file-path'),
  sideloadFileBrowser: document.getElementById('sideload-file-browser'),
  btnBrowseZip: document.getElementById('btn-browse-zip'),
  btnExecuteSideload: document.getElementById('btn-execute-sideload'),
  btnSlotA: document.getElementById('btn-slot-a'),
  btnSlotB: document.getElementById('btn-slot-b'),
  btnEraseCache: document.getElementById('btn-erase-cache'),
  btnEraseUserdata: document.getElementById('btn-erase-userdata'),
  terminalBody: document.getElementById('terminal-body'),
  btnClearTerminal: document.getElementById('btn-clear-terminal'),
  btnCopyTerminal: document.getElementById('btn-copy-terminal'),

  // Samsung Hub
  samsungHubCard: document.getElementById('samsung-hub-card'),
  samModelBadge: document.getElementById('sam-model-badge'),
  samBitBadge: document.getElementById('sam-bit-badge'),
  samCscBadge: document.getElementById('sam-csc-badge'),
  samOdinBadge: document.getElementById('sam-odin-badge'),
  samDriverBadge: document.getElementById('sam-driver-badge'),
  btnLaunchOdin: document.getElementById('btn-launch-odin'),
  btnSamInstallDriver: document.getElementById('btn-sam-install-driver'),
  btnSamEnterDownload: document.getElementById('btn-sam-enter-download'),
  btnSamDownloadRom: document.getElementById('btn-sam-download-rom'),

  // Samsung Auto-Slotter & Wipe Selector
  samFolderInput: document.getElementById('sam-folder-input'),
  btnScanDownloadsRom: document.getElementById('btn-scan-downloads-rom'),
  btnScanCustomFolder: document.getElementById('btn-scan-custom-folder'),
  samScanStatus: document.getElementById('sam-scan-status'),
  btnModeCleanWipe: document.getElementById('btn-mode-clean-wipe'),
  btnModeKeepData: document.getElementById('btn-mode-keep-data'),
  slotCardBl: document.getElementById('slot-card-bl'),
  slotCardAp: document.getElementById('slot-card-ap'),
  slotCardCp: document.getElementById('slot-card-cp'),
  slotCardCsc: document.getElementById('slot-card-csc'),
  tagBlStatus: document.getElementById('tag-bl-status'),
  tagApStatus: document.getElementById('tag-ap-status'),
  tagCpStatus: document.getElementById('tag-cp-status'),
  tagCscMode: document.getElementById('tag-csc-mode'),
  textBlFile: document.getElementById('text-bl-file'),
  textApFile: document.getElementById('text-ap-file'),
  textCpFile: document.getElementById('text-cp-file'),
  textCscFile: document.getElementById('text-csc-file'),
  textBlSize: document.getElementById('text-bl-size'),
  textApSize: document.getElementById('text-ap-size'),
  textCpSize: document.getElementById('text-cp-size'),
  textCscSize: document.getElementById('text-csc-size'),
  btnCopyBl: document.getElementById('btn-copy-bl'),
  btnCopyAp: document.getElementById('btn-copy-ap'),
  btnCopyCp: document.getElementById('btn-copy-cp'),
  btnCopyCsc: document.getElementById('btn-copy-csc'),
  btnCopyAllSlots: document.getElementById('btn-copy-all-slots'),

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
  fetchSamsungStatus();
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
  if (el.btnRebootSafe) el.btnRebootSafe.addEventListener('click', () => handleReboot('safe-mode'));
  if (el.btnRebootNormal) el.btnRebootNormal.addEventListener('click', () => handleReboot('normal'));
  if (el.btnRebootFastboot) el.btnRebootFastboot.addEventListener('click', () => handleReboot('bootloader'));
  if (el.btnRebootRecovery) el.btnRebootRecovery.addEventListener('click', () => handleReboot('recovery'));

  if (el.btnCheckFastboot) {
    el.btnCheckFastboot.addEventListener('click', () => {
      setInlineButtonFeedback(el.btnCheckFastboot, '⏳ กำลังตรวจหา Fastboot...');
      checkFastbootMode();
    });
  }

  // Tab 4: Flasher & Sideload Events
  if (el.btnFbRefresh) {
    el.btnFbRefresh.addEventListener('click', () => {
      setInlineButtonFeedback(el.btnFbRefresh, '⏳ รีเฟรช...');
      loadFastbootInfo();
    });
  }

  if (el.btnRebootToBootloader) {
    el.btnRebootToBootloader.addEventListener('click', () => handleFastbootReboot('bootloader'));
  }
  if (el.btnRebootToFastbootd) {
    el.btnRebootToFastbootd.addEventListener('click', () => handleReboot('fastbootd'));
  }
  if (el.btnRebootToRecovery) {
    el.btnRebootToRecovery.addEventListener('click', () => handleFastbootReboot('recovery'));
  }
  if (el.btnRebootToDownload) {
    el.btnRebootToDownload.addEventListener('click', () => handleReboot('download'));
  }
  if (el.btnRebootToEdl) {
    el.btnRebootToEdl.addEventListener('click', () => handleReboot('edl'));
  }
  if (el.btnRebootToSystem) {
    el.btnRebootToSystem.addEventListener('click', () => handleFastbootReboot('system'));
  }

  // File browser & auto-detect for Image
  if (el.btnBrowseImg && el.fbFileBrowser) {
    el.btnBrowseImg.addEventListener('click', () => el.fbFileBrowser.click());
    el.fbFileBrowser.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        // Browsers in desktop mode give file.name, and if local or full path provided:
        el.fbFilePath.value = file.name;
        autoDetectPartition(file.name);
        appendTerminal(`เลือกไฟล์: ${file.name} (ขนาด ${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      }
    });
  }

  if (el.fbFilePath) {
    el.fbFilePath.addEventListener('input', (e) => {
      autoDetectPartition(e.target.value);
    });
  }

  if (el.fbPartitionSelect) {
    el.fbPartitionSelect.addEventListener('change', (e) => {
      if (el.fbCustomPartition) {
        el.fbCustomPartition.classList.toggle('hidden', e.target.value !== 'custom');
      }
    });
  }

  if (el.btnExecuteFlash) {
    el.btnExecuteFlash.addEventListener('click', handleFlashImage);
  }
  if (el.btnExecuteBoot) {
    el.btnExecuteBoot.addEventListener('click', handleFastbootBoot);
  }

  // Sideload Events
  if (el.btnBrowseZip && el.sideloadFileBrowser) {
    el.btnBrowseZip.addEventListener('click', () => el.sideloadFileBrowser.click());
    el.sideloadFileBrowser.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        el.sideloadFilePath.value = file.name;
        appendTerminal(`เลือกไฟล์ Sideload: ${file.name} (ขนาด ${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      }
    });
  }

  if (el.btnExecuteSideload) {
    el.btnExecuteSideload.addEventListener('click', handleSideload);
  }

  // Unbrick Utilities
  if (el.btnSlotA) el.btnSlotA.addEventListener('click', () => handleSwitchSlot('a'));
  if (el.btnSlotB) el.btnSlotB.addEventListener('click', () => handleSwitchSlot('b'));
  if (el.btnEraseCache) el.btnEraseCache.addEventListener('click', handleEraseCache);
  if (el.btnEraseUserdata) el.btnEraseUserdata.addEventListener('click', handleEraseUserdata);

  // Terminal Controls
  if (el.btnClearTerminal) {
    el.btnClearTerminal.addEventListener('click', () => {
      if (el.terminalBody) el.terminalBody.textContent = '[SYSTEM] ล้างหน้าต่างเทอร์มินัลเรียบร้อย';
    });
  }
  if (el.btnCopyTerminal) {
    el.btnCopyTerminal.addEventListener('click', () => {
      if (el.terminalBody) {
        navigator.clipboard.writeText(el.terminalBody.textContent);
        setInlineButtonFeedback(el.btnCopyTerminal, '✅ คัดลอกแล้ว');
      }
    });
  }

  // Samsung Hub Events
  if (el.btnLaunchOdin) {
    el.btnLaunchOdin.addEventListener('click', handleLaunchOdin);
  }
  if (el.btnSamInstallDriver) {
    el.btnSamInstallDriver.addEventListener('click', handleInstallSamsungDriver);
  }
  if (el.btnSamEnterDownload) {
    el.btnSamEnterDownload.addEventListener('click', () => handleReboot('download'));
  }

  // Samsung Auto-Slotter & Wipe Selector Events
  if (el.btnScanDownloadsRom) {
    el.btnScanDownloadsRom.addEventListener('click', () => {
      scanSamsungFirmware('');
    });
  }
  if (el.btnScanCustomFolder) {
    el.btnScanCustomFolder.addEventListener('click', () => {
      const folder = (el.samFolderInput ? el.samFolderInput.value : '').trim();
      scanSamsungFirmware(folder);
    });
  }
  if (el.btnModeCleanWipe) {
    el.btnModeCleanWipe.addEventListener('click', () => {
      setSamsungWipeMode('clean');
    });
  }
  if (el.btnModeKeepData) {
    el.btnModeKeepData.addEventListener('click', () => {
      setSamsungWipeMode('keep');
    });
  }
  if (el.btnCopyBl) {
    el.btnCopyBl.addEventListener('click', () => copySlotPath('BL', el.btnCopyBl));
  }
  if (el.btnCopyAp) {
    el.btnCopyAp.addEventListener('click', () => copySlotPath('AP', el.btnCopyAp));
  }
  if (el.btnCopyCp) {
    el.btnCopyCp.addEventListener('click', () => copySlotPath('CP', el.btnCopyCp));
  }
  if (el.btnCopyCsc) {
    el.btnCopyCsc.addEventListener('click', () => copySlotPath('CSC', el.btnCopyCsc));
  }
  if (el.btnCopyAllSlots) {
    el.btnCopyAllSlots.addEventListener('click', copyAllSlotPaths);
  }

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
  } else if (tabId === 'tab-flasher') {
    loadFastbootInfo();
    fetchSamsungStatus();
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
    } else if (data.connected && data.state === 'fastboot') {
      state.device = data;
      showState('connected');
      updateHeaderPill('fastboot', '⚡ โหมด Fastboot');
      el.devName.textContent = 'อุปกรณ์ Fastboot (Bootloader)';
      el.devAndroid.textContent = 'Fastboot Protocol';
      el.devSerial.textContent = `ID: ${data.serial || '-'}`;
      el.devBattery.textContent = 'โหมดแฟลชเครื่อง';
      stopTopAppMonitor();
      switchTab('tab-flasher');
      loadFastbootInfo();
    } else if (data.connected && (data.state === 'recovery' || data.state === 'sideload')) {
      state.device = data;
      showState('connected');
      updateHeaderPill('fastboot', `โหมด ${data.state.toUpperCase()}`);
      el.devName.textContent = `โหมด ${data.state.toUpperCase()}`;
      el.devAndroid.textContent = 'Recovery Protocol';
      el.devSerial.textContent = `ID: ${data.serial || '-'}`;
      el.devBattery.textContent = 'พร้อมรับ Sideload';
      stopTopAppMonitor();
      switchTab('tab-flasher');
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
      if (state.justDisabledAdb) {
        el.emptyFeedback.innerHTML = '✅ <strong>คุณได้สั่งปิดโหมดนักพัฒนาเรียบร้อยแล้ว!</strong><br>ตัวเครื่องปลอดภัยและพร้อมเข้าใช้งานแอปธนาคาร / เป๋าตัง ได้ทันที สามารถถอดสาย USB ออกได้เลยครับ';
      } else if (data.message && data.state === 'error') {
        el.emptyFeedback.textContent = data.message;
      }
    }
  } catch (err) {
    showState('disconnected');
    updateHeaderPill('disconnected', 'เซิร์ฟเวอร์ขัดข้อง');
    stopTopAppMonitor();
  }
}

async function checkFastbootMode() {
  try {
    const res = await fetch('/api/fastboot/devices');
    const data = await res.json();
    if (data.ok && data.connected && data.devices.length > 0) {
      const dev = data.devices[0];
      state.device = { connected: true, state: 'fastboot', serial: dev.serial };
      showState('connected');
      updateHeaderPill('fastboot', '⚡ โหมด Fastboot');
      el.devName.textContent = 'อุปกรณ์ Fastboot (Bootloader)';
      el.devAndroid.textContent = 'Fastboot Protocol';
      el.devSerial.textContent = `ID: ${dev.serial}`;
      el.devBattery.textContent = 'โหมดแฟลชเครื่อง';
      stopTopAppMonitor();
      switchTab('tab-flasher');
      loadFastbootInfo();
    } else {
      el.emptyFeedback.textContent = '⚠️ ยังไม่พบอุปกรณ์ในโหมด Fastboot กรุณากดปุ่ม Power + ลดเสียง พร้อมกันจนหน้าจอขึ้น Fastboot';
    }
  } catch (err) {
    el.emptyFeedback.textContent = `⚠️ ข้อผิดพลาด: ${err.message}`;
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

  // Update Samsung Hub if info is available
  if (dev.samsungInfo && dev.samsungInfo.isSamsung) {
    if (el.samModelBadge) el.samModelBadge.textContent = `Model: ${dev.samsungInfo.model}`;
    if (el.samBitBadge) el.samBitBadge.textContent = `Binary: Bit ${dev.samsungInfo.binaryBit || '-'}`;
    if (el.samCscBadge) el.samCscBadge.textContent = `CSC: ${dev.samsungInfo.csc || 'THL'}`;
    if (el.btnSamDownloadRom && dev.samsungInfo.firmwareUrl) {
      el.btnSamDownloadRom.href = dev.samsungInfo.firmwareUrl;
      el.btnSamDownloadRom.title = `คลิกเพื่อดาวน์โหลดรอมศูนย์ตรงรุ่น ${dev.samsungInfo.model} (${dev.samsungInfo.csc})`;
    }
  } else {
    if (el.samModelBadge) el.samModelBadge.textContent = 'Samsung: สแตนด์บาย (Odin พร้อม)';
    if (el.samBitBadge) el.samBitBadge.textContent = 'Binary: -';
    if (el.samCscBadge) el.samCscBadge.textContent = 'CSC: -';
    if (el.btnSamDownloadRom) {
      el.btnSamDownloadRom.href = 'https://samfw.com';
      el.btnSamDownloadRom.title = 'ค้นหารอมศูนย์ Samsung';
    }
  }
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
      showEmergencyMessage(`❌ ไม่สามารถถอนการติดตั้ง: ${data.message}`, 'error');
      btn.innerHTML = `❌ ล้มเหลว`;
      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = `ยืนยันการลบแอป`;
      }, 2000);
    }
  } catch (err) {
    showEmergencyMessage(`❌ เกิดข้อผิดพลาด: ${err.message}`, 'error');
    btn.innerHTML = `❌ เกิดข้อผิดพลาด`;
    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = `ยืนยันการลบแอป`;
    }, 2000);
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
      state.justDisabledAdb = true;
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

// 11. Reboot Actions (ADB Mode)
async function handleReboot(mode) {
  let label = 'รีสตาร์ทปกติ';
  if (mode === 'safe-mode') label = 'Safe Mode (โหมดปลอดภัย)';
  else if (mode === 'bootloader') label = 'Fastboot / Bootloader';
  else if (mode === 'recovery') label = 'Recovery Mode';
  else if (mode === 'fastbootd') label = 'FastbootD';

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
      setTimeout(checkDevice, 3000);
    } else {
      showEmergencyMessage(`❌ ${data.message}`, 'error');
    }
  } catch (err) {
    showEmergencyMessage(`❌ ${err.message}`, 'error');
  }
}

// ==========================================
// 12. Module 4: Fastboot & Sideload Handlers
// ==========================================

// Terminal Logger
function appendTerminal(text, type = 'info') {
  if (!el.terminalBody) return;
  const time = new Date().toLocaleTimeString('th-TH');
  let prefix = `[${time}]`;
  if (type === 'error') prefix += ' [!]';
  else if (type === 'success') prefix += ' [✓]';
  else prefix += ' [i]';

  el.terminalBody.textContent += `\n${prefix} ${text}`;
  el.terminalBody.scrollTop = el.terminalBody.scrollHeight;
}

// Auto-Detect Partition from Filename
function autoDetectPartition(filename) {
  if (!filename) return;
  const cleanName = filename.toLowerCase().replace(/\\/g, '/').split('/').pop();
  
  if (cleanName.includes('init_boot') || cleanName.startsWith('init_boot')) {
    setPartitionValue('init_boot');
  } else if (cleanName.startsWith('boot') || (cleanName.includes('boot') && !cleanName.includes('vendor'))) {
    setPartitionValue('boot');
  } else if (cleanName.includes('recovery') || cleanName.includes('twrp') || cleanName.includes('orangefox')) {
    setPartitionValue('recovery');
  } else if (cleanName.includes('vbmeta')) {
    setPartitionValue('vbmeta');
    if (el.fbDisableVerity) el.fbDisableVerity.checked = true;
  } else if (cleanName.includes('vendor_boot')) {
    setPartitionValue('vendor_boot');
  } else if (cleanName.includes('dtbo')) {
    setPartitionValue('dtbo');
  } else if (cleanName.includes('super')) {
    setPartitionValue('super');
  } else if (cleanName.includes('system')) {
    setPartitionValue('system');
  } else if (cleanName.includes('userdata')) {
    setPartitionValue('userdata');
  }
}

function setPartitionValue(val) {
  if (!el.fbPartitionSelect) return;
  el.fbPartitionSelect.value = val;
  if (el.fbCustomPartition) {
    el.fbCustomPartition.classList.toggle('hidden', val !== 'custom');
  }
}

// Query Fastboot Hardware Variables
async function loadFastbootInfo() {
  if (el.fbProductBadge) el.fbProductBadge.textContent = 'Product: ตรวจสอบ...';
  if (el.fbUnlockBadge) el.fbUnlockBadge.textContent = 'Bootloader: ตรวจสอบ...';
  if (el.fbSlotBadge) el.fbSlotBadge.textContent = 'Slot: -';

  try {
    const res = await fetch('/api/fastboot/info');
    const data = await res.json();
    if (data.ok) {
      if (el.fbProductBadge) el.fbProductBadge.textContent = `Product: ${data.product}`;
      if (el.fbUnlockBadge) {
        const isUnlocked = data.unlocked === 'yes';
        el.fbUnlockBadge.textContent = isUnlocked ? '🔓 Bootloader: UNLOCKED' : '🔒 Bootloader: LOCKED';
        el.fbUnlockBadge.style.color = isUnlocked ? '#4ade80' : '#f87171';
      }
      if (el.fbSlotBadge) {
        el.fbSlotBadge.textContent = data.currentSlot !== 'none' ? `Active Slot: ${data.currentSlot.toUpperCase()}` : 'A/B: ไม่รองรับ (A-only)';
      }
      appendTerminal(`[DEVICE DETECTED] Codename: ${data.product} | Slot: ${data.currentSlot} | Unlocked: ${data.unlocked}`, 'info');
    } else {
      if (el.fbProductBadge) el.fbProductBadge.textContent = 'Product: -';
      if (el.fbUnlockBadge) el.fbUnlockBadge.textContent = 'Bootloader: -';
      appendTerminal(data.message || 'ไม่พบอุปกรณ์ในโหมด Fastboot', 'info');
    }
  } catch (err) {
    appendTerminal(`ไม่สามารถดึงข้อมูล Fastboot ได้: ${err.message}`, 'error');
  }
}

// Execute Flash Partition
async function handleFlashImage() {
  const filePath = (el.fbFilePath.value || '').trim();
  let partition = el.fbPartitionSelect.value;
  if (partition === 'custom') {
    partition = (el.fbCustomPartition.value || '').trim();
  }
  const disableVerity = el.fbDisableVerity.checked;

  if (!filePath) {
    if (el.fbFilePath) el.fbFilePath.focus();
    appendTerminal('⚠️ [แจ้งเตือน] กรุณาระบุหรือคลิกเลือกไฟล์ Image (.img) บนคอมพิวเตอร์ก่อนสั่งแฟลช', 'error');
    return;
  }
  if (!partition) {
    if (el.fbPartitionSelect) el.fbPartitionSelect.focus();
    appendTerminal('⚠️ [แจ้งเตือน] กรุณาเลือกหรือพิมพ์ชื่อพาร์ติชันเป้าหมาย', 'error');
    return;
  }

  const btn = el.btnExecuteFlash;
  const origHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerText = '⏳ กำลังแฟลชไฟล์...';
  appendTerminal(`[START FLASH] กำลังแฟลชไฟล์: ${filePath} ไปยังพาร์ติชัน: ${partition}...`);

  try {
    const res = await fetch('/api/fastboot/flash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partition, filePath, disableVerity })
    });
    const data = await res.json();
    if (data.ok) {
      appendTerminal(`[FLASH SUCCESS] ${data.message}`, 'success');
      if (data.output) appendTerminal(data.output);
      btn.innerText = '✅ แฟลชสำเร็จ!';
    } else {
      appendTerminal(`[FLASH FAILED] ${data.message}`, 'error');
      if (data.output) appendTerminal(data.output, 'error');
      btn.innerText = '❌ ผิดพลาด';
    }
  } catch (err) {
    appendTerminal(`[NETWORK ERROR] ${err.message}`, 'error');
    btn.innerText = '❌ เกิดข้อผิดพลาด';
  }

  setTimeout(() => {
    btn.innerHTML = origHtml;
    btn.disabled = false;
  }, 2500);
}

// Temporary Boot
async function handleFastbootBoot() {
  const filePath = (el.fbFilePath.value || '').trim();
  if (!filePath) {
    if (el.fbFilePath) el.fbFilePath.focus();
    appendTerminal('⚠️ [แจ้งเตือน] กรุณาระบุหรือคลิกเลือกไฟล์ Image (.img) ที่ต้องการทดลองบูต', 'error');
    return;
  }

  const btn = el.btnExecuteBoot;
  const origHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerText = '⏳ กำลังส่งคำสั่งบูต...';
  appendTerminal(`[FASTBOOT BOOT] กำลังส่ง ${filePath} เพื่อทดลองบูตชั่วคราว...`);

  try {
    const res = await fetch('/api/fastboot/boot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath })
    });
    const data = await res.json();
    if (data.ok) {
      appendTerminal(`[BOOT SUCCESS] ${data.message}`, 'success');
      if (data.output) appendTerminal(data.output);
      btn.innerText = '✅ สั่งบูตแล้ว!';
    } else {
      appendTerminal(`[BOOT FAILED] ${data.message}`, 'error');
      if (data.output) appendTerminal(data.output, 'error');
      btn.innerText = '❌ ผิดพลาด';
    }
  } catch (err) {
    appendTerminal(`[BOOT ERROR] ${err.message}`, 'error');
    btn.innerText = '❌ เกิดข้อผิดพลาด';
  }

  setTimeout(() => {
    btn.innerHTML = origHtml;
    btn.disabled = false;
  }, 2500);
}

// Sideload ZIP via ADB Recovery
async function handleSideload() {
  const filePath = (el.sideloadFilePath.value || '').trim();
  if (!filePath) {
    if (el.sideloadFilePath) el.sideloadFilePath.focus();
    appendTerminal('⚠️ [แจ้งเตือน] กรุณาระบุหรือเลือกไฟล์ .zip ที่ต้องการ Sideload', 'error');
    return;
  }

  const btn = el.btnExecuteSideload;
  const origHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerText = '⏳ กำลังส่งไฟล์ Sideload... (อาจใช้เวลา 1-3 นาที)';
  appendTerminal(`[SIDELOAD] เริ่มส่งไฟล์ ${filePath} ผ่าน ADB Sideload...`);

  try {
    const res = await fetch('/api/sideload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath })
    });
    const data = await res.json();
    if (data.ok) {
      appendTerminal(`[SIDELOAD SUCCESS] ${data.message}`, 'success');
      if (data.output) appendTerminal(data.output);
      btn.innerText = '✅ ส่งไฟล์สำเร็จ!';
      showEmergencyMessage('✅ ส่งไฟล์ Sideload สำเร็จแล้ว', 'success');
    } else {
      appendTerminal(`[SIDELOAD FAILED] ${data.message}`, 'error');
      if (data.output) appendTerminal(data.output, 'error');
      btn.innerText = '❌ ผิดพลาด';
      showEmergencyMessage(`❌ Sideload ล้มเหลว: ${data.message}`, 'error');
    }
  } catch (err) {
    appendTerminal(`[SIDELOAD ERROR] ${err.message}`, 'error');
    btn.innerText = '❌ เกิดข้อผิดพลาด';
  }

  setTimeout(() => {
    btn.innerHTML = origHtml;
    btn.disabled = false;
  }, 3000);
}

// Switch A/B Active Slot
async function handleSwitchSlot(slot) {
  if (!confirm(`คุณต้องการสลับระบบไปยัง Slot: ${slot.toUpperCase()} เพื่อแก้อาการบูตวนใช่หรือไม่?`)) return;

  appendTerminal(`[A/B SLOT] กำลังสลับระบบไปที่ Slot ${slot.toUpperCase()}...`);
  try {
    const res = await fetch('/api/fastboot/slot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot })
    });
    const data = await res.json();
    if (data.ok) {
      appendTerminal(`[SLOT SUCCESS] ${data.message}`, 'success');
      loadFastbootInfo();
    } else {
      appendTerminal(`[SLOT FAILED] ${data.message}`, 'error');
    }
  } catch (err) {
    appendTerminal(`[SLOT ERROR] ${err.message}`, 'error');
  }
}

// Erase Cache Partition
async function handleEraseCache() {
  if (!confirm('ยืนยันการล้างพาร์ติชันแคช (Wipe Cache) ใช่หรือไม่?')) return;
  appendTerminal('[ERASE] กำลังล้างพาร์ติชันแคช (fastboot erase cache)...');
  try {
    const res = await fetch('/api/fastboot/erase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partition: 'cache' })
    });
    const data = await res.json();
    if (data.ok) {
      appendTerminal(`[ERASE SUCCESS] ${data.message}`, 'success');
    } else {
      appendTerminal(`[ERASE FAILED] ${data.message}`, 'error');
    }
  } catch (err) {
    appendTerminal(`[ERASE ERROR] ${err.message}`, 'error');
  }
}

// Erase Userdata (Clean Wipe / Factory Reset)
async function handleEraseUserdata() {
  if (!confirm('⚠️ คำเตือนสำคัญ!\n\nคุณกำลังจะล้างข้อมูลพาร์ติชัน Userdata (Clean Wipe / Factory Reset)\nรูปภาพ แอป และรหัสผ่านหน้าจอจะถูกลบทั้งหมดเหมือนเพิ่งแกะกล่องใหม่\n\nต้องการดำเนินการต่อใช่หรือไม่?')) return;
  appendTerminal('[CLEAN WIPE] กำลังล้างพาร์ติชัน Userdata (fastboot erase userdata)...');
  try {
    const res = await fetch('/api/fastboot/erase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partition: 'userdata' })
    });
    const data = await res.json();
    if (data.ok) {
      appendTerminal(`[CLEAN WIPE SUCCESS] ${data.message} - เครื่องอยู่ในสภาพแกะกล่องแล้ว!`, 'success');
    } else {
      appendTerminal(`[CLEAN WIPE FAILED] ${data.message}`, 'error');
    }
  } catch (err) {
    appendTerminal(`[CLEAN WIPE ERROR] ${err.message}`, 'error');
  }
}

// Fastboot Reboot Commands
async function handleFastbootReboot(target) {
  let label = 'ระบบปกติ';
  if (target === 'recovery') label = 'Recovery Mode';
  else if (target === 'bootloader') label = 'Bootloader';
  else if (target === 'fastbootd') label = 'FastbootD';

  appendTerminal(`[REBOOT] กำลังส่งคำสั่งรีบูตเข้าสู่ ${label}...`);
  try {
    const res = await fetch('/api/fastboot/reboot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target })
    });
    const data = await res.json();
    if (data.ok) {
      appendTerminal(`[REBOOT SUCCESS] ${data.message}`, 'success');
      showEmergencyMessage(`✅ กำลังรีบูตโทรศัพท์เข้าสู่ ${label}...`, 'success');
      setTimeout(checkDevice, 3000);
    } else {
      appendTerminal(`[REBOOT FAILED] ${data.message}`, 'error');
      showEmergencyMessage(`❌ รีบูตไม่สำเร็จ: ${data.message}`, 'error');
    }
  } catch (err) {
    appendTerminal(`[REBOOT ERROR] ${err.message}`, 'error');
  }
}

// Launch Odin3 Executable
async function handleLaunchOdin() {
  const btn = el.btnLaunchOdin;
  const origHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerText = '⏳ กำลังเปิด Odin3...';

  try {
    const res = await fetch('/api/samsung/launch-odin', { method: 'POST' });
    const data = await res.json();
    if (data.ok) {
      btn.innerText = '✅ เปิด Odin3 แล้ว!';
      appendTerminal(`[ODIN3] สั่งเปิดโปรแกรมสำเร็จ: ${data.odinPath || 'Odin3.exe'}`);
    } else {
      btn.innerText = '❌ ไม่พบไฟล์';
      appendTerminal(`[ODIN3 ERROR] ${data.message}`, 'error');
    }
  } catch (err) {
    btn.innerText = '❌ ข้อผิดพลาด';
    appendTerminal(`[ODIN3 ERROR] ${err.message}`, 'error');
  }

  setTimeout(() => {
    btn.innerHTML = origHtml;
    btn.disabled = false;
  }, 2500);
}

// Fetch Samsung Hub, Odin, and Driver Status
async function fetchSamsungStatus() {
  try {
    const res = await fetch('/api/samsung/status');
    const data = await res.json();
    if (!data.ok) return;

    // Odin Badge
    if (el.samOdinBadge) {
      if (data.odin.available) {
        el.samOdinBadge.innerText = data.odin.isEmbedded
          ? 'Odin: พร้อมใช้งาน (Embedded)'
          : `Odin: พร้อมใช้งาน (${data.odin.version})`;
        el.samOdinBadge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        el.samOdinBadge.style.color = '#34d399';
      } else {
        el.samOdinBadge.innerText = 'Odin: ไม่พบไฟล์';
        el.samOdinBadge.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        el.samOdinBadge.style.color = '#f87171';
      }
    }

    // Driver Badge & Button
    if (el.samDriverBadge) {
      if (data.driver.isInstalled) {
        el.samDriverBadge.innerText = `Driver: ติดตั้งแล้ว (${data.driver.version})`;
        el.samDriverBadge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        el.samDriverBadge.style.color = '#34d399';
        if (el.btnSamInstallDriver) {
          el.btnSamInstallDriver.innerHTML = '<span class="btn-icon">✅</span> Samsung Driver ติดตั้งแล้ว (คลิกเพื่อลงซ้ำ)';
        }
      } else if (data.driver.installerAvailable) {
        el.samDriverBadge.innerText = 'Driver: พร้อมติดตั้ง (ในโฟลเดอร์)';
        el.samDriverBadge.style.borderColor = 'rgba(245, 158, 11, 0.4)';
        el.samDriverBadge.style.color = '#fbbf24';
        if (el.btnSamInstallDriver) {
          el.btnSamInstallDriver.innerHTML = '<span class="btn-icon">⚡</span> 1-คลิกติดตั้ง Samsung USB Driver';
        }
      } else {
        el.samDriverBadge.innerText = 'Driver: ยังไม่ได้ติดตั้ง';
        el.samDriverBadge.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        el.samDriverBadge.style.color = '#f87171';
      }
    }
  } catch (err) {
    console.warn('[Samsung Status Error]', err);
  }
}

// Launch Samsung Driver Installer
async function handleInstallSamsungDriver() {
  const btn = el.btnSamInstallDriver;
  if (!btn) return;
  const origHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerText = '⏳ กำลังเปิดตัวติดตั้ง Driver...';

  try {
    const res = await fetch('/api/samsung/install-driver', { method: 'POST' });
    const data = await res.json();
    if (data.ok) {
      btn.innerText = '✅ สั่งเปิดตัวติดตั้งแล้ว!';
      appendTerminal(`[SAMSUNG DRIVER] ${data.message}`);
      if (data.installerPath) {
        appendTerminal(`[SAMSUNG DRIVER] ที่อยู่ตัวติดตั้ง: ${data.installerPath}`);
      }
    } else {
      btn.innerText = '❌ เกิดข้อผิดพลาด';
      appendTerminal(`[SAMSUNG DRIVER ERROR] ${data.message}`, 'error');
    }
  } catch (err) {
    btn.innerText = '❌ เกิดข้อผิดพลาด';
    appendTerminal(`[SAMSUNG DRIVER ERROR] ${err.message}`, 'error');
  }

  setTimeout(() => {
    btn.innerHTML = origHtml;
    btn.disabled = false;
    fetchSamsungStatus();
  }, 4000);
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

// ==============================================================
// Samsung Firmware Auto-Slotter & Wipe Selector Methods
// ==============================================================

function setSamsungWipeMode(mode) {
  state.scannedSamsungFirmware.activeWipeMode = mode;
  if (mode === 'clean') {
    if (el.btnModeCleanWipe) el.btnModeCleanWipe.classList.add('active');
    if (el.btnModeKeepData) el.btnModeKeepData.classList.remove('active');
    if (el.tagCscMode) {
      el.tagCscMode.innerText = 'โหมด Clean Wipe';
      el.tagCscMode.style.color = '#fbbf24';
      el.tagCscMode.style.borderColor = 'rgba(245, 158, 11, 0.4)';
    }
    if (el.slotCardCsc) {
      el.slotCardCsc.style.borderColor = 'rgba(245, 158, 11, 0.4)';
    }
  } else {
    if (el.btnModeCleanWipe) el.btnModeCleanWipe.classList.remove('active');
    if (el.btnModeKeepData) el.btnModeKeepData.classList.add('active');
    if (el.tagCscMode) {
      el.tagCscMode.innerText = 'โหมด Keep Data (รูปไม่หาย)';
      el.tagCscMode.style.color = '#34d399';
      el.tagCscMode.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    }
    if (el.slotCardCsc) {
      el.slotCardCsc.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    }
  }
  renderSamsungFirmwareSlots();
}

async function scanSamsungFirmware(folderPath) {
  const btn = el.btnScanDownloadsRom;
  const origHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span> กำลังสแกน...';
  }
  if (el.samScanStatus) {
    el.samScanStatus.innerHTML = '<span class="loading-spinner"></span> กำลังค้นหาไฟล์รอมศูนย์ (.tar.md5)...';
  }

  try {
    const res = await fetch('/api/samsung/scan-firmware', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderPath: folderPath || '' })
    });
    const data = await res.json();

    if (data.ok) {
      state.scannedSamsungFirmware.slots = data.slots;
      state.scannedSamsungFirmware.targetDir = data.targetDir;
      if (el.samFolderInput) el.samFolderInput.value = data.targetDir;

      if (data.foundCount > 0) {
        if (el.samScanStatus) {
          el.samScanStatus.innerHTML = `✅ ${data.message}`;
          el.samScanStatus.style.color = '#34d399';
        }
        appendTerminal(`[SAMSUNG ROM SCAN] พบไฟล์รอม ${data.foundCount}/4 ส่วนใน: ${data.targetDir}`, 'success');
      } else {
        if (el.samScanStatus) {
          el.samScanStatus.innerHTML = `⚠️ ไม่พบไฟล์รอม .tar.md5 ในโฟลเดอร์นี้ กรุณาแตกไฟล์ .zip ก่อน`;
          el.samScanStatus.style.color = '#f59e0b';
        }
        appendTerminal(`[SAMSUNG ROM SCAN] ไม่พบไฟล์รอมใน: ${data.targetDir}`, 'warning');
      }
      renderSamsungFirmwareSlots();
    } else {
      if (el.samScanStatus) {
        el.samScanStatus.innerHTML = `❌ ${data.message}`;
        el.samScanStatus.style.color = '#f87171';
      }
      appendTerminal(`[SAMSUNG ROM SCAN ERROR] ${data.message}`, 'error');
    }
  } catch (err) {
    if (el.samScanStatus) {
      el.samScanStatus.innerHTML = `❌ ข้อผิดพลาด: ${err.message}`;
      el.samScanStatus.style.color = '#f87171';
    }
    appendTerminal(`[SAMSUNG ROM SCAN ERROR] ${err.message}`, 'error');
  } finally {
    if (btn) {
      btn.innerHTML = origHtml;
      btn.disabled = false;
    }
  }
}

function renderSamsungFirmwareSlots() {
  const { slots, activeWipeMode } = state.scannedSamsungFirmware;
  if (!slots) return;

  // BL Slot
  if (slots.BL) {
    if (el.textBlFile) {
      el.textBlFile.innerText = slots.BL.fileName;
      el.textBlFile.title = slots.BL.fullPath;
    }
    if (el.textBlSize) el.textBlSize.innerText = `ขนาด: ${slots.BL.sizeMb} MB`;
    if (el.tagBlStatus) {
      el.tagBlStatus.innerText = 'พร้อมใช้งาน';
      el.tagBlStatus.style.color = '#34d399';
      el.tagBlStatus.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    }
    if (el.slotCardBl) el.slotCardBl.classList.add('matched');
    if (el.btnCopyBl) el.btnCopyBl.disabled = false;
  } else {
    if (el.textBlFile) el.textBlFile.innerText = 'ไม่พบไฟล์ BL_...';
    if (el.tagBlStatus) {
      el.tagBlStatus.innerText = 'ขาดไฟล์';
      el.tagBlStatus.style.color = '#f87171';
      el.tagBlStatus.style.borderColor = 'rgba(239, 68, 68, 0.4)';
    }
    if (el.slotCardBl) el.slotCardBl.classList.remove('matched');
    if (el.btnCopyBl) el.btnCopyBl.disabled = true;
  }

  // AP Slot
  if (slots.AP) {
    if (el.textApFile) {
      el.textApFile.innerText = slots.AP.fileName;
      el.textApFile.title = slots.AP.fullPath;
    }
    if (el.textApSize) el.textApSize.innerText = `ขนาด: ${slots.AP.sizeGb} GB`;
    if (el.tagApStatus) {
      el.tagApStatus.innerText = 'พร้อมใช้งาน';
      el.tagApStatus.style.color = '#34d399';
      el.tagApStatus.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    }
    if (el.slotCardAp) el.slotCardAp.classList.add('matched');
    if (el.btnCopyAp) el.btnCopyAp.disabled = false;
  } else {
    if (el.textApFile) el.textApFile.innerText = 'ไม่พบไฟล์ AP_...';
    if (el.tagApStatus) {
      el.tagApStatus.innerText = 'ขาดไฟล์';
      el.tagApStatus.style.color = '#f87171';
      el.tagApStatus.style.borderColor = 'rgba(239, 68, 68, 0.4)';
    }
    if (el.slotCardAp) el.slotCardAp.classList.remove('matched');
    if (el.btnCopyAp) el.btnCopyAp.disabled = true;
  }

  // CP Slot
  if (slots.CP) {
    if (el.textCpFile) {
      el.textCpFile.innerText = slots.CP.fileName;
      el.textCpFile.title = slots.CP.fullPath;
    }
    if (el.textCpSize) el.textCpSize.innerText = `ขนาด: ${slots.CP.sizeMb} MB`;
    if (el.tagCpStatus) {
      el.tagCpStatus.innerText = 'พร้อมใช้งาน';
      el.tagCpStatus.style.color = '#34d399';
      el.tagCpStatus.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    }
    if (el.slotCardCp) el.slotCardCp.classList.add('matched');
    if (el.btnCopyCp) el.btnCopyCp.disabled = false;
  } else {
    if (el.textCpFile) el.textCpFile.innerText = 'ไม่พบไฟล์ CP_...';
    if (el.tagCpStatus) {
      el.tagCpStatus.innerText = 'ขาดไฟล์';
      el.tagCpStatus.style.color = '#f87171';
      el.tagCpStatus.style.borderColor = 'rgba(239, 68, 68, 0.4)';
    }
    if (el.slotCardCp) el.slotCardCp.classList.remove('matched');
    if (el.btnCopyCp) el.btnCopyCp.disabled = true;
  }

  // CSC Slot (Clean vs Keep)
  const cscFile = activeWipeMode === 'clean' ? slots.CSC : slots.HOME_CSC;
  if (cscFile) {
    if (el.textCscFile) {
      el.textCscFile.innerText = cscFile.fileName;
      el.textCscFile.title = cscFile.fullPath;
    }
    if (el.textCscSize) el.textCscSize.innerText = `ขนาด: ${cscFile.sizeMb} MB`;
    if (el.slotCardCsc) el.slotCardCsc.classList.add('matched');
    if (el.btnCopyCsc) el.btnCopyCsc.disabled = false;
  } else {
    const missingName = activeWipeMode === 'clean' ? 'CSC_...' : 'HOME_CSC_...';
    if (el.textCscFile) el.textCscFile.innerText = `ไม่พบไฟล์ ${missingName}`;
    if (el.textCscSize) el.textCscSize.innerText = 'ขนาด: -';
    if (el.slotCardCsc) el.slotCardCsc.classList.remove('matched');
    if (el.btnCopyCsc) el.btnCopyCsc.disabled = true;
  }

  // Enable Copy All if any slot is found
  if (el.btnCopyAllSlots) {
    const hasAny = slots.BL || slots.AP || slots.CP || cscFile;
    el.btnCopyAllSlots.disabled = !hasAny;
  }
}

function copySlotPath(slotType, btnElement) {
  const { slots, activeWipeMode } = state.scannedSamsungFirmware;
  if (!slots) return;

  let target = null;
  if (slotType === 'BL') target = slots.BL;
  else if (slotType === 'AP') target = slots.AP;
  else if (slotType === 'CP') target = slots.CP;
  else if (slotType === 'CSC') {
    target = activeWipeMode === 'clean' ? slots.CSC : slots.HOME_CSC;
  }

  if (target && target.fullPath) {
    navigator.clipboard.writeText(target.fullPath).then(() => {
      setInlineButtonFeedback(btnElement, `✅ คัดลอกแล้ว`);
    });
  }
}

function copyAllSlotPaths() {
  const { slots, activeWipeMode } = state.scannedSamsungFirmware;
  if (!slots) return;

  const cscFile = activeWipeMode === 'clean' ? slots.CSC : slots.HOME_CSC;
  const lines = [
    slots.BL ? `BL: ${slots.BL.fullPath}` : null,
    slots.AP ? `AP: ${slots.AP.fullPath}` : null,
    slots.CP ? `CP: ${slots.CP.fullPath}` : null,
    cscFile ? `CSC (${activeWipeMode === 'clean' ? 'Clean Wipe' : 'Keep Data'}): ${cscFile.fullPath}` : null
  ].filter(Boolean);

  if (lines.length > 0) {
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setInlineButtonFeedback(el.btnCopyAllSlots, '✅ คัดลอกครบทุกช่องแล้ว!');
    });
  }
}
