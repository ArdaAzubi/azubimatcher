(function () {
  const SETTINGS_KEY = "azubimatch_privacy_settings";
  const AUTH_KEYS = ["azubimatch_student_auth", "azubimatch_firm_auth"];
  const DEFAULT_SETTINGS = Object.freeze({
    version: 1,
    rememberLogin: true,
    savedAt: ""
  });
  const PUBLIC_NOTICE_PATHS = new Set([
    "/",
    "/index.html",
    "/home",
    "/home.html",
    "/lehrberufe",
    "/lehrberufe.html",
    "/trainings",
    "/trainings.html",
    "/impressum",
    "/impressum.html",
    "/datenschutzerklaerung",
    "/datenschutzerklaerung.html",
    "/nutzungsbedingungen",
    "/nutzungsbedingungen.html",
    "/index.php"
  ]);

  let ui = null;
  let cachedSettings = null;

  function getStorageValue(storage, key) {
    try {
      return storage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function setStorageValue(storage, key, value) {
    try {
      if (value == null) {
        storage.removeItem(key);
      } else {
        storage.setItem(key, value);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function parseJson(raw) {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function normalizeSettings(raw) {
    const next = Object.assign({}, DEFAULT_SETTINGS, raw && typeof raw === "object" ? raw : {});
    next.version = 1;
    next.rememberLogin = next.rememberLogin !== false;
    next.savedAt = typeof next.savedAt === "string" ? next.savedAt : "";
    return next;
  }

  function getSettings() {
    if (cachedSettings) {
      return Object.assign({}, cachedSettings);
    }
    cachedSettings = normalizeSettings(parseJson(getStorageValue(localStorage, SETTINGS_KEY)));
    return Object.assign({}, cachedSettings);
  }

  function getAuthStorageMode(settings) {
    return (settings || getSettings()).rememberLogin ? "local" : "session";
  }

  function getPrimaryStorage(settings) {
    return getAuthStorageMode(settings) === "local" ? localStorage : sessionStorage;
  }

  function getSecondaryStorage(settings) {
    return getAuthStorageMode(settings) === "local" ? sessionStorage : localStorage;
  }

  function moveAuthValueToPreferredStorage(key, settings) {
    const primaryStorage = getPrimaryStorage(settings);
    const secondaryStorage = getSecondaryStorage(settings);
    const primaryRaw = getStorageValue(primaryStorage, key);
    if (primaryRaw) {
      setStorageValue(secondaryStorage, key, null);
      return primaryRaw;
    }

    const secondaryRaw = getStorageValue(secondaryStorage, key);
    if (!secondaryRaw) {
      return null;
    }

    setStorageValue(primaryStorage, key, secondaryRaw);
    setStorageValue(secondaryStorage, key, null);
    return secondaryRaw;
  }

  function dispatchSettingsEvent(settings) {
    if (typeof window.CustomEvent !== "function") return;
    document.dispatchEvent(new CustomEvent("azubimatch:privacy-settings-changed", {
      detail: { settings: Object.assign({}, settings) }
    }));
  }

  function syncAuthStorage(settings) {
    AUTH_KEYS.forEach((key) => {
      moveAuthValueToPreferredStorage(key, settings);
    });
    dispatchSettingsEvent(settings);
  }

  function saveSettings(patch) {
    const current = getSettings();
    const next = normalizeSettings(Object.assign({}, current, patch || {}, {
      savedAt: new Date().toISOString()
    }));
    cachedSettings = next;
    setStorageValue(localStorage, SETTINGS_KEY, JSON.stringify(next));
    syncAuthStorage(next);
    refreshUi();
    return Object.assign({}, next);
  }

  function readAuthSessionRaw(key) {
    return moveAuthValueToPreferredStorage(key, getSettings());
  }

  function readAuthSession(key) {
    return parseJson(readAuthSessionRaw(key));
  }

  function writeAuthSession(key, value) {
    const raw = typeof value === "string" ? value : JSON.stringify(value);
    const settings = getSettings();
    setStorageValue(getPrimaryStorage(settings), key, raw);
    setStorageValue(getSecondaryStorage(settings), key, null);
  }

  function clearAuthSession(key) {
    setStorageValue(localStorage, key, null);
    setStorageValue(sessionStorage, key, null);
  }

  function hasSavedChoice() {
    return !!getSettings().savedAt;
  }

  function getRouteLiteral(target) {
    const key = String(target || "");
    if (typeof window.AzubiMatchRouteLiteral === "function") {
      return window.AzubiMatchRouteLiteral(key);
    }
    if (window.AzubiMatchRouteMap && window.AzubiMatchRouteMap[key]) {
      return window.AzubiMatchRouteMap[key];
    }
    return key;
  }

  function isPublicNoticePath() {
    const rawPath = String(window.location.pathname || "").replace(/\\/g, "/");
    const path = rawPath && rawPath !== "/" && rawPath.endsWith("/") ? rawPath.slice(0, -1) : rawPath || "/";
    if (PUBLIC_NOTICE_PATHS.has(path)) {
      return true;
    }
    const lastSegment = path.split("/").pop() || "";
    return PUBLIC_NOTICE_PATHS.has("/" + lastSegment);
  }

  function injectStyles() {
    if (document.getElementById("azubimatch-privacy-style")) return;

    const style = document.createElement("style");
    style.id = "azubimatch-privacy-style";
    style.textContent = [
      ".az-privacy-launcher{position:fixed;right:18px;bottom:18px;z-index:2147483000;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:46px;padding:0 16px;border:1px solid rgba(15,23,42,.14);border-radius:999px;background:rgba(15,23,42,.94);color:#fff;font:600 14px/1.2 'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,sans-serif;box-shadow:0 18px 40px rgba(15,23,42,.24);cursor:pointer}",
      ".az-privacy-launcher:hover{background:#0b1220}",
      ".az-privacy-banner{position:fixed;left:18px;bottom:18px;z-index:2147482999;width:min(420px,calc(100vw - 108px));padding:18px;border:1px solid rgba(191,219,254,.7);border-radius:20px;background:rgba(255,255,255,.98);box-shadow:0 20px 44px rgba(15,23,42,.14);font:400 14px/1.55 'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,sans-serif;color:#172033}",
      ".az-privacy-banner[hidden]{display:none}",
      ".az-privacy-banner strong{display:block;margin-bottom:6px;font-size:15px}",
      ".az-privacy-banner p{margin:0;color:#41526b}",
      ".az-privacy-banner__actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}",
      ".az-privacy-btn{border:0;border-radius:999px;min-height:40px;padding:0 14px;background:#1d4ed8;color:#fff;font:600 14px/1 'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,sans-serif;cursor:pointer}",
      ".az-privacy-btn:hover{background:#1e40af}",
      ".az-privacy-btn.secondary{background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe}",
      ".az-privacy-btn.secondary:hover{background:#dbeafe}",
      ".az-privacy-backdrop{position:fixed;inset:0;z-index:2147483001;display:flex;align-items:flex-start;justify-content:center;padding:18px;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;background:rgba(15,23,42,.46)}",
      ".az-privacy-backdrop[hidden]{display:none}",
      ".az-privacy-dialog{width:min(760px,100%);margin:clamp(18px,4vh,40px) 0;overflow:visible;padding:26px;border-radius:28px;background:#fff;color:#172033;box-shadow:0 28px 80px rgba(15,23,42,.28);font:400 15px/1.6 'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,sans-serif}",
      ".az-privacy-dialog__head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:10px}",
      ".az-privacy-dialog__head h2{margin:0;font-size:30px;line-height:1.15}",
      ".az-privacy-dialog__head p{margin:10px 0 0;color:#4c5c74}",
      ".az-privacy-close{border:0;background:#eff6ff;color:#1d4ed8;width:42px;height:42px;border-radius:999px;font-size:22px;cursor:pointer;flex:0 0 auto}",
      ".az-privacy-summary{margin:0 0 18px;padding:14px 16px;border-radius:18px;background:#eff6ff;color:#1e3a8a;font-weight:600}",
      ".az-privacy-grid{display:grid;gap:14px}",
      ".az-privacy-card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:start;padding:18px;border:1px solid #dbe5f2;border-radius:20px;background:#f8fbff}",
      ".az-privacy-card__title{margin:0 0 4px;font-size:17px;font-weight:700}",
      ".az-privacy-card p{margin:0;color:#4c5c74}",
      ".az-privacy-status{display:inline-flex;align-items:center;justify-content:center;min-height:32px;padding:0 12px;border-radius:999px;background:#dbeafe;color:#1d4ed8;font-weight:700;white-space:nowrap}",
      ".az-privacy-status.muted{background:#eef2f7;color:#475569}",
      ".az-privacy-toggle{display:flex;align-items:flex-start;gap:12px}",
      ".az-privacy-toggle input{width:18px;height:18px;margin-top:3px;accent-color:#1d4ed8}",
      ".az-privacy-note{margin:16px 0 0;color:#64748b;font-size:14px}",
      ".az-privacy-actions{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:22px}",
      ".az-privacy-link{display:inline-flex;align-items:center;min-height:40px;padding:0 14px;border-radius:999px;background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;text-decoration:none;font-weight:600}",
      "body.az-privacy-modal-open{overflow:hidden}",
      "@media (max-width:760px){.az-privacy-launcher{left:12px;right:12px;bottom:12px}.az-privacy-banner{left:12px;right:12px;bottom:68px;width:auto}.az-privacy-dialog{padding:20px;border-radius:24px}.az-privacy-dialog__head h2{font-size:24px}.az-privacy-card{grid-template-columns:1fr}}"
    ].join("");
    document.head.appendChild(style);
  }

  function buildUi() {
    if (ui || !document.body) return ui;

    injectStyles();

    const privacyPolicyUrl = getRouteLiteral("datenschutzerklaerung.html");

    const banner = document.createElement("aside");
    banner.className = "az-privacy-banner";
    banner.hidden = true;
    banner.innerHTML = "<strong>Privatsphäre & Cookies</strong><p>AzubiMatch verwendet keine Analyse- oder Marketing-Cookies. Für Portalzugriffe, Sicherheit und lokale Datenhaltung werden technisch notwendige Browser-Speicher genutzt. Du kannst festlegen, ob Login-Sitzungen nur für die aktuelle Browser-Sitzung gelten oder auf diesem Gerät gespeichert bleiben.</p><div class='az-privacy-banner__actions'><button type='button' class='az-privacy-btn secondary' data-privacy-mode='session'>Nur notwendige Speicherung</button><button type='button' class='az-privacy-btn' data-privacy-mode='local'>Login speichern</button><button type='button' class='az-privacy-btn secondary' data-open-privacy-settings='banner'>Details</button></div>";

    const backdrop = document.createElement("div");
    backdrop.className = "az-privacy-backdrop";
    backdrop.hidden = true;
    backdrop.innerHTML = "<div class='az-privacy-dialog' role='dialog' aria-modal='true' aria-labelledby='azPrivacyTitle'><div class='az-privacy-dialog__head'><div><h2 id='azPrivacyTitle'>Privatsphäre und Cookie-Einstellungen</h2><p>AzubiMatch arbeitet ohne Analyse- und Marketing-Cookies. Für den Plattformbetrieb nutzt die Anwendung technische Browser-Speicher. Hier kannst du vor allem steuern, ob Login-Sitzungen nach dem Schließen des Browsers erhalten bleiben.</p></div><button type='button' class='az-privacy-close' data-close-privacy-dialog aria-label='Dialog schließen'>&times;</button></div><p class='az-privacy-summary' id='azPrivacySummary'></p><div class='az-privacy-grid'><div class='az-privacy-card'><div><h3 class='az-privacy-card__title'>Technisch erforderliche Speicherung</h3><p>Notwendig für Nutzerkonten, Matching, Nachrichten, Sicherheitsfunktionen und die lokale Datenhaltung im Browser. Diese Speicherarten sind für den Betrieb der aktuellen AzubiMatch-Architektur erforderlich.</p></div><span class='az-privacy-status'>Immer aktiv</span></div><div class='az-privacy-card'><label class='az-privacy-toggle' for='azPrivacyRememberLogin'><input type='checkbox' id='azPrivacyRememberLogin'><div><h3 class='az-privacy-card__title'>Login-Komfort</h3><p>Wenn aktiv, dürfen Bewerber- und Firmen-Logins auf diesem Gerät browserübergreifend gespeichert bleiben. Wenn deaktiviert, werden Login-Sitzungen nur in der aktuellen Browser-Sitzung gehalten.</p></div></label><span class='az-privacy-status' id='azPrivacyRememberLoginStatus'></span></div><div class='az-privacy-card'><div><h3 class='az-privacy-card__title'>Analyse und Marketing</h3><p>Aktuell nicht im Einsatz. Es werden keine Tracking-, Statistik- oder Marketing-Cookies gesetzt.</p></div><span class='az-privacy-status muted'>Inaktiv</span></div></div><p class='az-privacy-note'>Die getroffene Auswahl wird lokal gespeichert, damit sie bei weiteren Seitenaufrufen berücksichtigt werden kann.</p><div class='az-privacy-actions'><a class='az-privacy-link' href='" + privacyPolicyUrl + "'>Datenschutzerklärung lesen</a><button type='button' class='az-privacy-btn secondary' data-privacy-mode='session'>Nur notwendige Speicherung</button><button type='button' class='az-privacy-btn' data-save-privacy-settings>Speichern</button></div></div>";

    document.body.appendChild(banner);
    document.body.appendChild(backdrop);

    ui = {
      banner: banner,
      backdrop: backdrop,
      summary: backdrop.querySelector("#azPrivacySummary"),
      rememberLogin: backdrop.querySelector("#azPrivacyRememberLogin"),
      rememberLoginStatus: backdrop.querySelector("#azPrivacyRememberLoginStatus")
    };

    banner.addEventListener("click", handleActionClick);
    backdrop.addEventListener("click", function (event) {
      if (event.target === backdrop || event.target.closest("[data-close-privacy-dialog]")) {
        closeSettings();
        return;
      }
      handleActionClick(event);
    });

    document.addEventListener("click", function (event) {
      const trigger = event.target.closest("[data-open-privacy-settings]");
      if (!trigger) return;
      event.preventDefault();
      openSettings();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && ui && !ui.backdrop.hidden) {
        closeSettings();
      }
    });

    refreshUi();
    return ui;
  }

  function handleActionClick(event) {
    const modeTrigger = event.target.closest("[data-privacy-mode]");
    if (modeTrigger) {
      const mode = modeTrigger.getAttribute("data-privacy-mode") === "session" ? "session" : "local";
      saveSettings({ rememberLogin: mode === "local" });
      if (ui && !ui.backdrop.hidden) {
        closeSettings();
      }
      return;
    }

    if (event.target.closest("[data-save-privacy-settings]")) {
      const currentUi = buildUi();
      saveSettings({ rememberLogin: !!(currentUi && currentUi.rememberLogin && currentUi.rememberLogin.checked) });
      closeSettings();
    }
  }

  function refreshUi() {
    if (!ui) return;

    const settings = getSettings();
    const rememberLogin = !!settings.rememberLogin;

    if (ui.rememberLogin) {
      ui.rememberLogin.checked = rememberLogin;
    }
    if (ui.summary) {
      ui.summary.textContent = rememberLogin
        ? "Aktuell dürfen Login-Sitzungen browserübergreifend auf diesem Gerät gespeichert bleiben."
        : "Aktuell werden Login-Sitzungen nur in der laufenden Browser-Sitzung gehalten.";
    }
    if (ui.rememberLoginStatus) {
      ui.rememberLoginStatus.textContent = rememberLogin ? "Gespeichert" : "Nur Sitzung";
    }
    if (ui.banner) {
      ui.banner.hidden = hasSavedChoice() || !isPublicNoticePath();
    }
  }

  function openSettings() {
    const currentUi = buildUi();
    if (!currentUi) return;
    refreshUi();
    currentUi.backdrop.hidden = false;
    document.body.classList.add("az-privacy-modal-open");
    if (currentUi.rememberLogin) {
      currentUi.rememberLogin.focus();
    }
  }

  function closeSettings() {
    if (!ui) return;
    ui.backdrop.hidden = true;
    document.body.classList.remove("az-privacy-modal-open");
  }

  window.AzubiMatchPrivacy = {
    getSettings: getSettings,
    saveSettings: saveSettings,
    openSettings: openSettings,
    closeSettings: closeSettings,
    readAuthSession: readAuthSession,
    readAuthSessionRaw: readAuthSessionRaw,
    writeAuthSession: writeAuthSession,
    clearAuthSession: clearAuthSession,
    isRememberLoginEnabled: function () {
      return !!getSettings().rememberLogin;
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildUi);
  } else {
    buildUi();
  }
})();