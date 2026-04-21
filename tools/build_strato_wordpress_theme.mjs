import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputRoot = path.join(rootDir, 'dist', 'strato-wordpress');
const themeSlug = 'azubimatch-strato';
const buildAssetVersion = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
const themeDir = path.join(outputRoot, themeSlug);
const zipPath = path.join(outputRoot, `${themeSlug}.zip`);
const templatesDir = path.join(themeDir, 'templates');
const assetsDir = path.join(themeDir, 'assets');
const legacyDir = path.join(themeDir, 'legacy-php');

const pageConfigs = [
  {
    key: 'index',
    source: 'index.html',
    slug: '',
    title: 'AzubiMatcher – Start und Themenübersicht'
  },
  {
    key: 'home',
    source: 'home.html',
    slug: 'home',
    title: 'AzubiMatcher – Vorstellung, Ziel und Überblick'
  },
  {
    key: 'platform',
    source: 'platform.html',
    slug: 'platform',
    title: 'AzubiMatcher – Platform'
  },
  {
    key: 'ausbildung_sichern',
    source: 'ausbildung-sichern.html',
    slug: 'ausbildung-sichern',
    title: 'AzubiMatcher – Ausbildung stabil begleiten'
  },
  {
    key: 'inklusion',
    source: 'inklusion.html',
    slug: 'inklusion',
    title: 'AzubiMatcher – Inklusion in Ausbildung'
  },
  {
    key: 'berufsfelder_markt',
    source: 'berufsfelder-markt.html',
    slug: 'berufsfelder-markt',
    title: 'AzubiMatcher – Berufsfelder, Berufswahl und Ausbildungsmarkt'
  },
  {
    key: 'app',
    source: 'app.html',
    slug: 'app',
    title: 'AzubiMatcher – Handy-App für Bewerbende und Unternehmen'
  },
  {
    key: 'lehrberufe',
    source: 'lehrberufe.html',
    slug: 'lehrberufe',
    title: 'AzubiMatcher – Ausbildungsberufe'
  },
  {
    key: 'anmeldung',
    source: 'anmeldung.html',
    slug: 'anmeldung',
    title: 'AzubiMatcher – Anmeldung'
  },
  {
    key: 'bewerber',
    source: 'bewerber.html',
    slug: 'bewerber',
    title: 'AzubiMatcher – Portal für Bewerbende'
  },
  {
    key: 'bewerber_app',
    source: 'bewerber_app.html',
    slug: 'bewerber-app',
    title: 'AzubiMatcher – Bewerber-App'
  },
  {
    key: 'bewerber_profil',
    source: 'bewerber_profil.html',
    slug: 'bewerber-profil',
    title: 'AzubiMatcher – Mein Profil'
  },
  {
    key: 'bewerber_praktikum',
    source: 'bewerber_praktikum.html',
    slug: 'bewerber-praktikum',
    title: 'AzubiMatcher – Schulpraktikum für Bewerbende'
  },
  {
    key: 'firma',
    source: 'firma.html',
    slug: 'firma',
    title: 'AzubiMatcher – Firmen-Portal'
  },
  {
    key: 'firma_profil',
    source: 'firma_profil.html',
    slug: 'firma-profil',
    title: 'AzubiMatcher – Firmenprofil'
  },
  {
    key: 'firma_praktikum',
    source: 'firma_praktikum.html',
    slug: 'firma-praktikum',
    title: 'AzubiMatcher – Schulpraktikum für Unternehmen'
  },
  {
    key: 'firma_schnellprofil',
    source: 'firma_schnellprofil.html',
    slug: 'firma-schnellprofil',
    title: 'AzubiMatcher – Kurzprofil Firma'
  },
  {
    key: 'trainings',
    source: 'trainings.html',
    slug: 'trainings',
    title: 'AzubiMatcher – Trainings'
  },
  {
    key: 'unternehmen_info',
    source: 'unternehmen-info.html',
    slug: 'unternehmen-info',
    title: 'AzubiMatcher – Informationen für Unternehmen'
  },
  {
    key: 'admin',
    source: 'admin.html',
    slug: 'admin',
    title: 'AzubiMatcher – Admin Portal'
  },
  {
    key: 'impressum',
    source: 'impressum.html',
    slug: 'impressum',
    title: 'AzubiMatcher – Impressum'
  },
  {
    key: 'datenschutzerklaerung',
    source: 'datenschutzerklaerung.html',
    slug: 'datenschutzerklaerung',
    title: 'AzubiMatcher – Datenschutzerklärung'
  },
  {
    key: 'nutzungsbedingungen',
    source: 'nutzungsbedingungen.html',
    slug: 'nutzungsbedingungen',
    title: 'AzubiMatcher – Nutzungsbedingungen'
  }
];

const legacyPhpFiles = ['anmeldung.php', 'registrierung.php', 'index.php', 'php_auth_bootstrap.php'];

const pageByKey = new Map(pageConfigs.map((entry) => [entry.key, entry]));
const pageBySource = new Map(pageConfigs.map((entry) => [entry.source, entry]));

function phpSingleQuoted(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildInternalUrlExpression(rawTarget) {
  const [targetWithoutHash, hash = ''] = String(rawTarget).split('#');
  const [pathname, query = ''] = targetWithoutHash.split('?');
  const ext = path.extname(pathname).toLowerCase();
  const basename = path.basename(pathname, ext);

  let baseExpression = '';
  if (ext === '.html') {
    const pageConfig = pageByKey.get(basename) || pageBySource.get(path.basename(pathname));
    if (!pageConfig) return null;
    baseExpression = `azubimatch_theme_page_url('${phpSingleQuoted(pageConfig.key)}')`;
  } else if (ext === '.php') {
    baseExpression = `azubimatch_theme_legacy_url('${phpSingleQuoted(path.basename(pathname))}')`;
  } else {
    return null;
  }

  if (query) {
    baseExpression += ` . '?${phpSingleQuoted(query)}'`;
  }
  if (hash) {
    baseExpression += ` . '#${phpSingleQuoted(hash)}'`;
  }

  return `<?php echo esc_url(${baseExpression}); ?>`;
}

function transformMarkupReferences(markup) {
  let nextMarkup = markup;

  nextMarkup = nextMarkup.replace(/\s*<script\b[^>]*src=["'](?:script\.js|privacy-settings\.js|discovery\.js)["'][^>]*><\/script>\s*/gi, '\n');
  nextMarkup = nextMarkup.replace(/\s*<script\b[^>]*src=["'][^"']*unpkg\.com\/leaflet[^"']*["'][^>]*><\/script>\s*/gi, '\n');
  nextMarkup = nextMarkup.replace(/<link\b[^>]*href=["']style\.css["'][^>]*>\s*/gi, '');
  nextMarkup = nextMarkup.replace(/<link\b[^>]*href=["'][^"']*unpkg\.com\/leaflet[^"']*["'][^>]*>\s*/gi, '');

  nextMarkup = nextMarkup.replace(/\b(href|action)="([^"]+\.(?:html|php)(?:\?[^"#]*)?(?:#[^"]*)?)"/gi, (full, attributeName, target) => {
    const expression = buildInternalUrlExpression(target);
    if (!expression) return full;
    return `${attributeName}="${expression}"`;
  });

  nextMarkup = nextMarkup.replace(/\bsrc="images\/([^"]+)"/gi, (_full, assetPath) => {
    return `src="<?php echo esc_url(AZUBIMATCH_THEME_URL . '/assets/images/${assetPath}'); ?>"`;
  });

  nextMarkup = nextMarkup.replace(/"url":\s*"https:\/\/azubimatch\.example\.com"/gi, '"url": "<?php echo esc_url(home_url('/')); ?>"');
  nextMarkup = nextMarkup.replace(/"logo":\s*"images\/([^"]+)"/gi, (_full, assetPath) => {
    return `"logo": "<?php echo esc_url(AZUBIMATCH_THEME_URL . '/assets/images/${assetPath}'); ?>"`;
  });

  nextMarkup = nextMarkup.replace(/<script>([\s\S]*?)<\/script>/gi, (_full, inlineSource) => {
    const normalizedSource = String(inlineSource || '').trim();
    if (!normalizedSource) {
      return '';
    }
    return `<script>\n(function () {\n${normalizedSource}\n})();\n<\/script>`;
  });

  return nextMarkup.trim();
}

function extractBody(fileContent) {
  const bodyMatch = fileContent.match(/<body\b([^>]*)>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) {
    throw new Error('Konnte den <body>-Inhalt nicht extrahieren.');
  }

  const attributes = bodyMatch[1] || '';
  const classMatch = attributes.match(/class="([^"]+)"/i);
  return {
    bodyClasses: classMatch ? classMatch[1].trim() : '',
    bodyContent: bodyMatch[2].trim()
  };
}

function extractHeadEnhancements(fileContent) {
  const headMatch = fileContent.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
  if (!headMatch) {
    return '';
  }

  const headContent = headMatch[1] || '';
  const collected = [];
  const linkMatches = headContent.match(/<link\b[^>]*>/gi) || [];
  const styleMatches = headContent.match(/<style\b[^>]*>[\s\S]*?<\/style>/gi) || [];

  linkMatches.forEach((linkTag) => {
    const relMatch = linkTag.match(/\brel=(['"])(.*?)\1/i);
    const hrefMatch = linkTag.match(/\bhref=(['"])(.*?)\1/i);
    const rel = String(relMatch?.[2] || '').toLowerCase();
    const href = String(hrefMatch?.[2] || '').trim();
    const isExternalHref = /^(https?:)?\/\//i.test(href);

    if (rel === 'preconnect' || rel === 'dns-prefetch' || rel === 'preload') {
      collected.push(linkTag.trim());
      return;
    }

    if (rel.includes('stylesheet') && isExternalHref) {
      collected.push(linkTag.trim());
    }
  });

  styleMatches.forEach((styleTag) => {
    collected.push(styleTag.trim());
  });

  return collected.join('\n').trim();
}

function transformAppScript(source) {
  let nextSource = source;

  const pageStateReplacements = [
    ['window.location.href.includes("bewerber.html")', 'window.AzubiMatchPage.matches(window.AzubiMatchRoutes.bewerber)'],
    ["window.location.pathname.endsWith('firma_profil.html')", 'window.AzubiMatchPage.matches(window.AzubiMatchRoutes.firma_profil)'],
    ["window.location.pathname.endsWith('admin.html')", 'window.AzubiMatchPage.matches(window.AzubiMatchRoutes.admin)'],
    ["window.location.pathname.indexOf('firma_profil.html') === -1", '!window.AzubiMatchPage.matches(window.AzubiMatchRoutes.firma_profil)'],
    ["window.location.pathname.endsWith('bewerber_profil.html')", 'window.AzubiMatchPage.matches(window.AzubiMatchRoutes.bewerber_profil)']
  ];

  pageStateReplacements.forEach(([from, to]) => {
    nextSource = nextSource.split(from).join(to);
  });

  return nextSource;
}

function hardenMobileAppRuntimeScript(content) {
  if (typeof content !== 'string' || content.trim() === '') {
    return content;
  }

  let next = content;
  next = next.replace(
    /getMobileAppRuntimeValue\("mobileAppManifestUrl",\s*"[^"]*"\)/g,
    'getMobileAppRuntimeValue("mobileAppManifestUrl", "/app.webmanifest")'
  );
  next = next.replace(
    /getMobileAppRuntimeValue\("mobileAppIconUrl",\s*"[^"]*"\)/g,
    'getMobileAppRuntimeValue("mobileAppIconUrl", "/wp-content/themes/azubimatch-strato/assets/images/azubimatch-app-icon.svg")'
  );
  next = next.replace(
    /getMobileAppRuntimeValue\("mobileAppServiceWorkerUrl",\s*"[^"]*"\)/g,
    'getMobileAppRuntimeValue("mobileAppServiceWorkerUrl", "/app-sw.js")'
  );

  // Keep PWA meta/sw setup app-scoped and avoid manifest fetches on protected non-app pages.
  next = next.replace(
    /\nensureMobileAppMeta\(\);\nregisterMobileAppInstallListeners\(\);\nregisterMobileAppServiceWorker\(\);\n/g,
    '\n'
  );

  return next;
}

function buildThemeStyleCss() {
  return `/*
Theme Name: AzubiMatcher Strato
Theme URI: https://example.com/azubimatch-strato
Author: AzubiMatcher
Description: WordPress-Theme-Paket fuer das Strato-Hosting auf Basis der aktuellen AzubiMatcher-Seiten.
Version: 1.0.1
Requires at least: 6.4
Tested up to: 6.8
Requires PHP: 8.0
Text Domain: azubimatch-strato
*/

body.wp-admin-bar .index-topbar,
body.wp-admin-bar .admin-sidebar,
body.wp-admin-bar .firm-sticky-column,
body.wp-admin-bar .student-sticky-column {
  top: calc(32px + 16px) !important;
}

@media (max-width: 782px) {
  body.wp-admin-bar .index-topbar,
  body.wp-admin-bar .admin-sidebar,
  body.wp-admin-bar .firm-sticky-column,
  body.wp-admin-bar .student-sticky-column {
    top: calc(46px + 12px) !important;
  }
}
`;
}

function buildFunctionsPhp() {
  const pageMapPhp = pageConfigs.map((page) => {
    return `    '${phpSingleQuoted(page.key)}' => [
      'slug' => '${phpSingleQuoted(page.slug)}',
      'source' => '${phpSingleQuoted(page.source)}',
      'title' => '${phpSingleQuoted(page.title)}',
      'template' => '${phpSingleQuoted(page.key)}.php',
      'body_classes' => '${phpSingleQuoted(page.bodyClasses || '')}'
    ]`;
  }).join(",\n");

  const routeLiteralMapPhp = pageConfigs.map((page) => {
    return `    '${phpSingleQuoted(page.source)}' => azubimatch_theme_page_url('${phpSingleQuoted(page.key)}')`;
  }).join(",\n");

  return `<?php
define('AZUBIMATCH_THEME_DIR', get_template_directory());
define('AZUBIMATCH_THEME_URL', get_template_directory_uri());

function azubimatch_theme_pages() {
  static $pages = null;
  if ($pages !== null) {
    return $pages;
  }

  $pages = [
${pageMapPhp}
  ];

  return $pages;
}

function azubimatch_theme_page_config($key) {
  $pages = azubimatch_theme_pages();
  return $pages[$key] ?? null;
}

function azubimatch_theme_page_by_slug($slug) {
  foreach (azubimatch_theme_pages() as $key => $config) {
    if (($config['slug'] ?? '') === $slug) {
      return ['key' => $key, 'config' => $config];
    }
  }
  return null;
}

function azubimatch_theme_page_by_source($source) {
  $normalizedSource = ltrim(trim((string) $source), '/');
  if ($normalizedSource === '') {
    return null;
  }

  foreach (azubimatch_theme_pages() as $key => $config) {
    if (($config['source'] ?? '') === $normalizedSource) {
      return ['key' => $key, 'config' => $config];
    }
  }

  return null;
}

function azubimatch_theme_page_url($key) {
  $config = azubimatch_theme_page_config($key);
  if (!$config) {
    return home_url('/');
  }

  $slug = $config['slug'] ?? '';
  if ($slug === '') {
    return home_url('/');
  }

  return home_url('/' . trim($slug, '/') . '/');
}

function azubimatch_theme_legacy_url($filename) {
  return trailingslashit(AZUBIMATCH_THEME_URL) . 'legacy-php/' . rawurlencode($filename);
}

function azubimatch_theme_page_admin_title($config) {
  $title = trim((string) ($config['title'] ?? ''));
  if ($title !== '') {
    $title = preg_replace('/^AzubiMatcher\s+[–-]\s+/u', '', $title);
    $title = trim((string) $title);
  }

  if ($title === '') {
    $title = trim((string) ($config['slug'] ?? ''));
  }

  return $title !== '' ? $title : 'Seite';
}

function azubimatch_sync_theme_pages() {
  if (function_exists('wp_installing') && wp_installing()) {
    return;
  }

  $syncOption = 'azubimatch_theme_page_sync_version';
  $currentVersion = (string) get_option($syncOption, '');
  if ($currentVersion === AZUBIMATCH_THEME_ASSET_VERSION) {
    return;
  }

  $allSynced = true;
  foreach (azubimatch_theme_pages() as $config) {
    $slug = trim((string) ($config['slug'] ?? ''));
    if ($slug === '') {
      continue;
    }

    $existingPage = get_page_by_path($slug, OBJECT, 'page');
    if ($existingPage) {
      continue;
    }

    $insertResult = wp_insert_post([
      'post_type' => 'page',
      'post_status' => 'publish',
      'post_title' => azubimatch_theme_page_admin_title($config),
      'post_name' => $slug,
      'post_content' => '',
      'comment_status' => 'closed',
      'ping_status' => 'closed'
    ], true);

    if (is_wp_error($insertResult)) {
      $allSynced = false;
    }
  }

  if ($allSynced) {
    update_option($syncOption, AZUBIMATCH_THEME_ASSET_VERSION, false);
  }
}
add_action('init', 'azubimatch_sync_theme_pages', 1);

function azubimatch_requested_theme_page() {
  $requestUri = trim((string) ($_SERVER['REQUEST_URI'] ?? ''));
  if ($requestUri === '') {
    return null;
  }

  $requestPath = trim((string) wp_parse_url($requestUri, PHP_URL_PATH), '/');
  if ($requestPath === '') {
    return [
      'key' => 'index',
      'config' => azubimatch_theme_page_config('index')
    ];
  }

  if (strpos($requestPath, '/') !== false) {
    return null;
  }

  $pageBySource = azubimatch_theme_page_by_source($requestPath);
  if ($pageBySource) {
    return $pageBySource;
  }

  $requestBase = pathinfo($requestPath, PATHINFO_FILENAME);
  if ($requestBase !== '' && $requestBase !== $requestPath) {
    $pageByBaseSlug = azubimatch_theme_page_by_slug($requestBase);
    if ($pageByBaseSlug) {
      return $pageByBaseSlug;
    }
  }

  return azubimatch_theme_page_by_slug($requestPath);
}

function azubimatch_maybe_redirect_source_literal_page() {
  if (is_admin() || is_feed() || wp_doing_ajax()) {
    return;
  }

  if (is_page() || is_front_page()) {
    return;
  }

  $requestUri = trim((string) ($_SERVER['REQUEST_URI'] ?? ''));
  if ($requestUri === '') {
    return;
  }

  $requestPath = trim((string) wp_parse_url($requestUri, PHP_URL_PATH), '/');
  if ($requestPath === '' || strpos($requestPath, '/') !== false) {
    return;
  }

  $page = azubimatch_theme_page_by_source($requestPath);
  if (!$page || empty($page['key'])) {
    return;
  }

  $targetUrl = azubimatch_theme_page_url($page['key']);
  $queryString = trim((string) wp_parse_url($requestUri, PHP_URL_QUERY));
  if ($queryString !== '') {
    $targetUrl .= (strpos($targetUrl, '?') === false ? '?' : '&') . $queryString;
  }

  wp_safe_redirect($targetUrl, 301);
  exit;
}
add_action('template_redirect', 'azubimatch_maybe_redirect_source_literal_page', 0);

function azubimatch_current_theme_page() {
  if (is_front_page()) {
    return [
      'key' => 'index',
      'config' => azubimatch_theme_page_config('index')
    ];
  }

  if (!is_page()) {
    return azubimatch_requested_theme_page();
  }

  $post = get_queried_object();
  if (!$post || empty($post->post_name)) {
    return azubimatch_requested_theme_page();
  }

  return azubimatch_theme_page_by_slug($post->post_name) ?: azubimatch_requested_theme_page();
}

function azubimatch_array_is_list_compat($value) {
  if (!is_array($value)) {
    return false;
  }

  if (function_exists('array_is_list')) {
    return array_is_list($value);
  }

  $expectedIndex = 0;
  foreach (array_keys($value) as $key) {
    if ($key !== $expectedIndex) {
      return false;
    }
    $expectedIndex++;
  }

  return true;
}

function azubimatch_normalize_host_for_origin_check($host) {
  $value = strtolower(trim((string) $host));
  if ($value === '') {
    return '';
  }

  if (strpos($value, 'www.') === 0) {
    $value = substr($value, 4);
  }

  return $value;
}

function azubimatch_is_same_origin_request($request, $expectedRequestedWith) {
  $requestedWith = trim((string) $request->get_header('x-requested-with'));
  if ($expectedRequestedWith !== '' && $requestedWith !== $expectedRequestedWith) {
    return false;
  }

  $expectedHost = strtolower((string) wp_parse_url(home_url('/'), PHP_URL_HOST));
  $expectedPort = (string) wp_parse_url(home_url('/'), PHP_URL_PORT);
  $requestHostHeader = trim((string) ($_SERVER['HTTP_HOST'] ?? ''));
  $requestHost = strtolower((string) wp_parse_url('http://' . $requestHostHeader, PHP_URL_HOST));
  $requestPort = (string) wp_parse_url('http://' . $requestHostHeader, PHP_URL_PORT);
  $normalizedExpectedHost = azubimatch_normalize_host_for_origin_check($expectedHost);
  $normalizedRequestHost = azubimatch_normalize_host_for_origin_check($requestHost);

  if ($normalizedExpectedHost === '' && $normalizedRequestHost === '') {
    return false;
  }

  foreach (['origin', 'referer'] as $headerName) {
    $value = trim((string) $request->get_header($headerName));
    if ($value === '') {
      continue;
    }

    $candidateHost = strtolower((string) wp_parse_url($value, PHP_URL_HOST));
    $candidatePort = (string) wp_parse_url($value, PHP_URL_PORT);
    $normalizedCandidateHost = azubimatch_normalize_host_for_origin_check($candidateHost);
    $hostMatches = $normalizedCandidateHost !== ''
      && ($normalizedCandidateHost === $normalizedExpectedHost
        || ($normalizedRequestHost !== '' && $normalizedCandidateHost === $normalizedRequestHost));

    if ($hostMatches) {
      $portMatchesExpected = $candidatePort === '' || $expectedPort === '' || $candidatePort === $expectedPort;
      $portMatchesRequest = $candidatePort === '' || $requestPort === '' || $candidatePort === $requestPort;
      if ($portMatchesExpected || $portMatchesRequest) {
        return true;
      }
    }
  }

  return false;
}

function azubimatch_mail_relay_encode_header($value) {
  $sanitized = trim(preg_replace('/[\\r\\n]+/', ' ', (string) $value));
  if ($sanitized === '') {
    return '';
  }

  return '=?UTF-8?B?' . base64_encode($sanitized) . '?=';
}

function azubimatch_mail_relay_load_config() {
  $config = [
    'apiKey' => '',
    'fromEmail' => 'noreply@a-zu-bio.de',
    'fromName' => 'AzubiMatch',
    'smtpHost' => '',
    'smtpPort' => 587,
    'smtpEncryption' => 'tls',
    'smtpUser' => '',
    'smtpPassword' => ''
  ];

  $configPath = AZUBIMATCH_THEME_DIR . '/mail_relay_config.php';
  if (is_file($configPath)) {
    $loaded = require $configPath;
    if (is_array($loaded)) {
      $config = array_merge($config, $loaded);
    }
  }

  $constantMap = [
    'apiKey' => 'AZUBIMATCH_MAIL_RELAY_API_KEY',
    'fromEmail' => 'AZUBIMATCH_MAIL_FROM_EMAIL',
    'fromName' => 'AZUBIMATCH_MAIL_FROM_NAME',
    'smtpHost' => 'AZUBIMATCH_SMTP_HOST',
    'smtpPort' => 'AZUBIMATCH_SMTP_PORT',
    'smtpEncryption' => 'AZUBIMATCH_SMTP_ENCRYPTION',
    'smtpUser' => 'AZUBIMATCH_SMTP_USER',
    'smtpPassword' => 'AZUBIMATCH_SMTP_PASSWORD'
  ];

  foreach ($constantMap as $key => $constantName) {
    if (defined($constantName)) {
      $value = trim((string) constant($constantName));
      if ($value !== '') {
        $config[$key] = $value;
      }
    }
  }

  $environmentMap = [
    'apiKey' => 'AZUBIMATCH_MAIL_RELAY_API_KEY',
    'fromEmail' => 'AZUBIMATCH_MAIL_FROM_EMAIL',
    'fromName' => 'AZUBIMATCH_MAIL_FROM_NAME',
    'smtpHost' => 'AZUBIMATCH_SMTP_HOST',
    'smtpPort' => 'AZUBIMATCH_SMTP_PORT',
    'smtpEncryption' => 'AZUBIMATCH_SMTP_ENCRYPTION',
    'smtpUser' => 'AZUBIMATCH_SMTP_USER',
    'smtpPassword' => 'AZUBIMATCH_SMTP_PASSWORD'
  ];

  foreach ($environmentMap as $key => $envName) {
    $value = getenv($envName);
    if ($value !== false && trim((string) $value) !== '') {
      $config[$key] = trim((string) $value);
    }
  }

  return $config;
}

function azubimatch_mail_relay_is_same_origin_request($request) {
  return azubimatch_is_same_origin_request($request, 'AzubiMatchMailRelay');
}

function azubimatch_state_schema() {
  static $schema = null;
  if ($schema !== null) {
    return $schema;
  }

  $schema = [
    'azubimatch_students' => 'array',
    'azubimatch_offers' => 'array',
    'azubimatch_internship_students' => 'array',
    'azubimatch_internship_offers' => 'array',
    'azubimatch_internship_calendar_entries' => 'array',
    'azubimatch_messages' => 'array',
    'azubimatch_firm_users' => 'array',
    'azubimatch_student_retention_checkins' => 'object',
    'azubimatch_health_monitor_config' => 'object',
    'azubimatch_health_monitor_state' => 'object',
    'azubimatch_health_monitor_reports' => 'array',
    'azubimatch_fullprofile_requests' => 'array',
    'azubimatch_firm_student_msgs' => 'array',
    'azubimatch_student_users' => 'array',
    'schuelerListe' => 'array',
    'azubimatch_lebenslaeufe' => 'object',
    'azubimatch_contact_requests' => 'array',
    'azubimatch_contact_notifications' => 'array',
    'azubimatch_matches' => 'array',
    'azubimatch_unmatched_students' => 'array',
    'azubimatch_unmatched_firms' => 'array'
  ];

  return $schema;
}

function azubimatch_state_default_value($key) {
  $type = azubimatch_state_schema()[$key] ?? '';
  return $type === 'object' ? new stdClass() : [];
}

function azubimatch_state_base_dir() {
  $uploadDir = wp_upload_dir(null, false);
  $baseDir = trim((string) ($uploadDir['basedir'] ?? ''));
  if ($baseDir === '') {
    return '';
  }

  $stateDir = trailingslashit($baseDir) . 'azubimatch-state';
  if (!is_dir($stateDir) && !wp_mkdir_p($stateDir)) {
    return '';
  }

  $indexPath = trailingslashit($stateDir) . 'index.php';
  if (!is_file($indexPath)) {
    @file_put_contents($indexPath, "<?php\n// Silence is golden.\n");
  }

  $htaccessPath = trailingslashit($stateDir) . '.htaccess';
  if (!is_file($htaccessPath)) {
    @file_put_contents($htaccessPath, "<IfModule mod_authz_core.c>\nRequire all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\nDeny from all\n</IfModule>\n");
  }

  return $stateDir;
}

function azubimatch_state_file_path($key) {
  $baseDir = azubimatch_state_base_dir();
  if ($baseDir === '') {
    return '';
  }

  return trailingslashit($baseDir) . sanitize_file_name($key) . '.json';
}

function azubimatch_state_normalize_value($key, $value) {
  $schema = azubimatch_state_schema();
  if (!array_key_exists($key, $schema)) {
    return new WP_Error('azubimatch_state_invalid_key', 'Unbekannter State-Key.', ['status' => 400]);
  }

  if ($schema[$key] === 'object') {
    if ($value instanceof stdClass) {
      return $value;
    }
    if (is_object($value)) {
      return (object) get_object_vars($value);
    }
    if (is_array($value) && !azubimatch_array_is_list_compat($value)) {
      return $value;
    }
    return new stdClass();
  }

  if (!is_array($value)) {
    return [];
  }

  return array_values($value);
}

function azubimatch_state_read($key) {
  $normalized = azubimatch_state_normalize_value($key, azubimatch_state_default_value($key));
  if (is_wp_error($normalized)) {
    return azubimatch_state_default_value($key);
  }

  $path = azubimatch_state_file_path($key);
  if ($path === '' || !is_file($path)) {
    return $normalized;
  }

  $raw = file_get_contents($path);
  if (!is_string($raw) || trim($raw) === '') {
    return $normalized;
  }

  $decoded = json_decode($raw);
  if (json_last_error() !== JSON_ERROR_NONE) {
    return $normalized;
  }

  $decodedValue = azubimatch_state_normalize_value($key, $decoded);
  return is_wp_error($decodedValue) ? $normalized : $decodedValue;
}

function azubimatch_state_write($key, $value) {
  $normalized = azubimatch_state_normalize_value($key, $value);
  if (is_wp_error($normalized)) {
    return $normalized;
  }

  $path = azubimatch_state_file_path($key);
  if ($path === '') {
    return new WP_Error('azubimatch_state_directory_unavailable', 'State-Verzeichnis konnte nicht erstellt werden.', ['status' => 500]);
  }

  $encoded = wp_json_encode($normalized, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  if (!is_string($encoded) || $encoded === '') {
    return new WP_Error('azubimatch_state_encode_failed', 'State konnte nicht serialisiert werden.', ['status' => 500]);
  }

  if (file_put_contents($path, $encoded, LOCK_EX) === false) {
    return new WP_Error('azubimatch_state_write_failed', 'State konnte nicht gespeichert werden.', ['status' => 500]);
  }

  return $normalized;
}

function azubimatch_state_permission_callback($request) {
  if (!azubimatch_is_same_origin_request($request, 'AzubiMatchStateSync')) {
    return new WP_Error('azubimatch_state_forbidden', 'Same-Origin-Pruefung fuer den State-Store fehlgeschlagen.', ['status' => 403]);
  }

  return true;
}

function azubimatch_state_get_callback($request) {
  $key = trim((string) $request->get_param('key'));
  if ($key === '' || !array_key_exists($key, azubimatch_state_schema())) {
    return new WP_Error('azubimatch_state_invalid_key', 'State-Key fehlt oder ist ungueltig.', ['status' => 400]);
  }

  $path = azubimatch_state_file_path($key);
  $exists = $path !== '' && is_file($path);

  return new WP_REST_Response([
    'success' => true,
    'key' => $key,
    'exists' => $exists,
    'value' => azubimatch_state_read($key)
  ], 200);
}

function azubimatch_state_post_callback($request) {
  $payload = $request->get_json_params();
  if (!is_array($payload)) {
    return new WP_Error('azubimatch_state_invalid_json', 'Ungueltiger JSON-Body.', ['status' => 400]);
  }

  $key = trim((string) ($payload['key'] ?? ''));
  if ($key === '' || !array_key_exists($key, azubimatch_state_schema())) {
    return new WP_Error('azubimatch_state_invalid_key', 'State-Key fehlt oder ist ungueltig.', ['status' => 400]);
  }

  $storedValue = azubimatch_state_write($key, $payload['value'] ?? null);
  if (is_wp_error($storedValue)) {
    return $storedValue;
  }

  return new WP_REST_Response([
    'success' => true,
    'key' => $key,
    'exists' => true,
    'value' => $storedValue
  ], 200);
}

function azubimatch_register_state_route() {
  register_rest_route('azubimatch/v1', '/state', [
    [
      'methods' => WP_REST_Server::READABLE,
      'callback' => 'azubimatch_state_get_callback',
      'permission_callback' => 'azubimatch_state_permission_callback'
    ],
    [
      'methods' => WP_REST_Server::CREATABLE,
      'callback' => 'azubimatch_state_post_callback',
      'permission_callback' => 'azubimatch_state_permission_callback'
    ]
  ]);
}

function azubimatch_mail_relay_normalize_payload($data) {
  if (!is_array($data)) {
    return new WP_Error('azubimatch_mail_relay_invalid_json', 'Ungueltiger JSON-Body.', ['status' => 400]);
  }

  $recipient = sanitize_email((string) ($data['to'] ?? ''));
  $subject = trim((string) ($data['subject'] ?? ''));
  $text = trim((string) ($data['text'] ?? ''));
  $html = trim((string) ($data['html'] ?? ''));
  $attachments = [];
  $totalAttachmentBytes = 0;

  if (!$recipient || !is_email($recipient)) {
    return new WP_Error('azubimatch_mail_relay_missing_recipient', 'Empfaengeradresse fehlt.', ['status' => 400]);
  }
  if ($subject === '') {
    return new WP_Error('azubimatch_mail_relay_missing_subject', 'Betreff fehlt.', ['status' => 400]);
  }
  if ($text === '' && $html === '') {
    return new WP_Error('azubimatch_mail_relay_missing_content', 'Mailinhalt fehlt.', ['status' => 400]);
  }

  $rawAttachments = is_array($data['attachments'] ?? null) ? $data['attachments'] : [];
  foreach ($rawAttachments as $attachment) {
    if (!is_array($attachment)) {
      continue;
    }

    $filename = trim((string) ($attachment['filename'] ?? 'Dokument'));
    $contentType = trim((string) ($attachment['contentType'] ?? 'application/octet-stream'));
    $contentBase64 = preg_replace('/\\s+/', '', (string) ($attachment['contentBase64'] ?? ''));
    if ($contentBase64 === '') {
      continue;
    }

    $binary = base64_decode($contentBase64, true);
    if ($binary === false) {
      return new WP_Error('azubimatch_mail_relay_invalid_attachment', 'Ein Anhang ist nicht gueltig base64-kodiert.', ['status' => 400]);
    }

    $totalAttachmentBytes += strlen($binary);
    if ($totalAttachmentBytes > 15 * 1024 * 1024) {
      return new WP_Error('azubimatch_mail_relay_attachment_limit', 'Die Gesamtgroesse der Anhaenge ueberschreitet 15 MB.', ['status' => 400]);
    }

    $attachments[] = [
      'filename' => $filename !== '' ? $filename : 'Dokument',
      'contentType' => $contentType !== '' ? $contentType : 'application/octet-stream',
      'contentBase64' => $contentBase64
    ];
  }

  return [
    'to' => $recipient,
    'subject' => $subject,
    'text' => $text !== '' ? $text : wp_strip_all_tags(str_replace(['<br>', '<br/>', '<br />'], '\\n', $html)),
    'html' => $html !== '' ? $html : nl2br(esc_html($text)),
    'attachments' => $attachments
  ];
}

function azubimatch_mail_relay_create_temp_attachments($attachments) {
  $paths = [];

  foreach ($attachments as $attachment) {
    $binary = base64_decode((string) $attachment['contentBase64'], true);
    if ($binary === false) {
      foreach ($paths as $path) {
        if (is_string($path) && is_file($path)) {
          wp_delete_file($path);
        }
      }
      return new WP_Error('azubimatch_mail_relay_invalid_attachment', 'Ein Anhang ist nicht gueltig base64-kodiert.', ['status' => 400]);
    }

    $filename = sanitize_file_name((string) ($attachment['filename'] ?? 'Dokument'));
    $tempPath = wp_tempnam($filename !== '' ? $filename : 'azubimatch-attachment.tmp');
    if (!$tempPath) {
      foreach ($paths as $path) {
        if (is_string($path) && is_file($path)) {
          wp_delete_file($path);
        }
      }
      return new WP_Error('azubimatch_mail_relay_tempfile_failed', 'Temporaere Datei fuer Anhang konnte nicht erstellt werden.', ['status' => 500]);
    }

    if (file_put_contents($tempPath, $binary) === false) {
      if (is_file($tempPath)) {
        wp_delete_file($tempPath);
      }
      foreach ($paths as $path) {
        if (is_string($path) && is_file($path)) {
          wp_delete_file($path);
        }
      }
      return new WP_Error('azubimatch_mail_relay_tempfile_write_failed', 'Anhang konnte nicht zwischengespeichert werden.', ['status' => 500]);
    }

    $paths[] = $tempPath;
  }

  return $paths;
}

function azubimatch_mail_relay_send($config, $payload) {
  $fromEmail = trim((string) ($config['fromEmail'] ?? ''));
  $fromName = trim((string) ($config['fromName'] ?? 'AzubiMatch'));
  $fromHeader = $fromEmail;
  $headers = [];

  if ($fromEmail !== '' && $fromName !== '') {
    $fromHeader = azubimatch_mail_relay_encode_header($fromName) . ' <' . $fromEmail . '>';
  }

  if ($fromHeader !== '') {
    $headers[] = 'From: ' . $fromHeader;
    $headers[] = 'Reply-To: ' . $fromHeader;
  }

  $attachmentPaths = azubimatch_mail_relay_create_temp_attachments($payload['attachments']);
  if (is_wp_error($attachmentPaths)) {
    return $attachmentPaths;
  }

  $contentTypeFilter = static function () {
    return 'text/html';
  };

  $mailerInit = static function ($phpmailer) use ($payload, $fromEmail, $fromName, $config) {
    $phpmailer->CharSet = 'UTF-8';
    $phpmailer->Encoding = 'base64';
    if (!empty($payload['text'])) {
      $phpmailer->AltBody = (string) $payload['text'];
    }
    if ($fromEmail !== '') {
      $phpmailer->Sender = $fromEmail;
      try {
        $phpmailer->setFrom($fromEmail, $fromName !== '' ? $fromName : 'AzubiMatch', false);
      } catch (Exception $exception) {
      }
    }
    $smtpPassword = trim((string) ($config['smtpPassword'] ?? ''));
    if ($smtpPassword !== '') {
      $smtpHost = trim((string) ($config['smtpHost'] ?? 'smtp.strato.de'));
      $smtpPort = (int) ($config['smtpPort'] ?? 587);
      $smtpEncryption = strtolower(trim((string) ($config['smtpEncryption'] ?? 'tls')));
      $smtpUser = trim((string) ($config['smtpUser'] ?? $fromEmail));
      $phpmailer->isSMTP();
      $phpmailer->Host = $smtpHost !== '' ? $smtpHost : 'smtp.strato.de';
      $phpmailer->SMTPAuth = true;
      $phpmailer->Username = $smtpUser !== '' ? $smtpUser : $fromEmail;
      $phpmailer->Password = $smtpPassword;
      $phpmailer->SMTPSecure = $smtpEncryption === 'ssl' ? 'ssl' : 'tls';
      $phpmailer->Port = $smtpPort > 0 ? $smtpPort : 587;
    }
  };

  add_filter('wp_mail_content_type', $contentTypeFilter);
  add_action('phpmailer_init', $mailerInit);

  try {
    $sent = wp_mail(
      (string) $payload['to'],
      (string) $payload['subject'],
      (string) $payload['html'],
      $headers,
      $attachmentPaths
    );
  } finally {
    remove_filter('wp_mail_content_type', $contentTypeFilter);
    remove_action('phpmailer_init', $mailerInit);
    foreach ($attachmentPaths as $path) {
      if (is_string($path) && is_file($path)) {
        wp_delete_file($path);
      }
    }
  }

  if (!$sent) {
    return new WP_Error('azubimatch_mail_relay_send_failed', 'Der Servermailer konnte die Nachricht nicht versenden. Pruefen Sie die Mail-Konfiguration des Servers.', ['status' => 502]);
  }

  return true;
}

function azubimatch_mail_relay_permission_callback($request) {
  if (!azubimatch_mail_relay_is_same_origin_request($request)) {
    return new WP_Error('azubimatch_mail_relay_forbidden', 'Same-Origin-Pruefung fuer den Mail-Relay fehlgeschlagen.', ['status' => 403]);
  }

  $config = azubimatch_mail_relay_load_config();
  $expectedApiKey = trim((string) ($config['apiKey'] ?? ''));
  if ($expectedApiKey !== '') {
    $providedApiKey = trim((string) $request->get_header('x-api-key'));
    if ($providedApiKey === '' || !hash_equals($expectedApiKey, $providedApiKey)) {
      return new WP_Error('azubimatch_mail_relay_invalid_api_key', 'Ungueltiger API-Schluessel fuer den Mail-Relay.', ['status' => 403]);
    }
  }

  return true;
}

function azubimatch_mail_relay_rest_callback($request) {
  $payload = azubimatch_mail_relay_normalize_payload($request->get_json_params());
  if (is_wp_error($payload)) {
    return $payload;
  }

  $result = azubimatch_mail_relay_send(azubimatch_mail_relay_load_config(), $payload);
  if (is_wp_error($result)) {
    return $result;
  }

  return new WP_REST_Response(['success' => true], 200);
}

function azubimatch_register_mail_relay_route() {
  register_rest_route('azubimatch/v1', '/mail-relay', [
    'methods' => WP_REST_Server::CREATABLE,
    'callback' => 'azubimatch_mail_relay_rest_callback',
    'permission_callback' => 'azubimatch_mail_relay_permission_callback'
  ]);
}

function azubimatch_allow_mail_relay_rest_when_globally_blocked($result) {
  if (!is_wp_error($result)) {
    return $result;
  }

  $requestUri = (string) ($_SERVER['REQUEST_URI'] ?? '');
  if ($requestUri === '') {
    return $result;
  }

  $requestPath = trim((string) wp_parse_url($requestUri, PHP_URL_PATH), '/');
  if ($requestPath === '') {
    return $result;
  }

  if (preg_match('#(?:^|/)wp-json/azubimatch/v1/mail-relay/?$#i', $requestPath) === 1) {
    $code = (string) $result->get_error_code();
    if ($code === 'rest_cannot_access' || $code === 'rest_forbidden' || $code === 'rest_disabled') {
      return true;
    }
  }

  return $result;
}
add_filter('rest_authentication_errors', 'azubimatch_allow_mail_relay_rest_when_globally_blocked', 99);

add_action('rest_api_init', 'azubimatch_register_mail_relay_route');
add_action('rest_api_init', 'azubimatch_register_state_route');

define('AZUBIMATCH_THEME_ASSET_VERSION', '${buildAssetVersion}');

function azubimatch_enqueue_assets() {
  wp_enqueue_style(
    'leaflet',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    [],
    '1.9.4'
  );

  wp_enqueue_style(
    'azubimatch-app-style',
    trailingslashit(AZUBIMATCH_THEME_URL) . 'assets/style.css',
    [],
    AZUBIMATCH_THEME_ASSET_VERSION
  );

  wp_enqueue_style(
    'azubimatch-theme-style',
    get_stylesheet_uri(),
    ['azubimatch-app-style'],
    AZUBIMATCH_THEME_ASSET_VERSION
  );

  wp_enqueue_script(
     'leaflet',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    [],
    '1.9.4',
    true
  );

  wp_enqueue_script(
     'azubimatch-privacy',
    trailingslashit(AZUBIMATCH_THEME_URL) . 'assets/privacy-settings.js',
    [],
    AZUBIMATCH_THEME_ASSET_VERSION,
    true
  );

  wp_enqueue_script(
     'azubimatch-discovery',
    trailingslashit(AZUBIMATCH_THEME_URL) . 'assets/discovery.js',
    [],
    AZUBIMATCH_THEME_ASSET_VERSION,
    true
  );

  wp_enqueue_script(
     'azubimatch-app',
    trailingslashit(AZUBIMATCH_THEME_URL) . 'assets/script.js',
    ['azubimatch-privacy', 'azubimatch-discovery', 'leaflet'],
    filemtime(AZUBIMATCH_THEME_DIR . '/assets/script.js'),
    true
  );

  $routes = [];
  foreach (azubimatch_theme_pages() as $key => $config) {
    $routes[$key] = azubimatch_theme_page_url($key);
  }

  $routeLiterals = [
${routeLiteralMapPhp}
  ];

  $inlineBefore = 'window.AzubiMatchRoutes = ' . wp_json_encode($routes) . ';'
    . 'window.AzubiMatchRouteMap = ' . wp_json_encode($routeLiterals) . ';'
    . 'window.AzubiMatchRuntime = Object.assign({}, window.AzubiMatchRuntime || {}, ' . wp_json_encode([
      'assetVersion' => AZUBIMATCH_THEME_ASSET_VERSION,
      'mailRelayEndpoint' => '/' . trim((string) rest_get_url_prefix(), '/') . '/azubimatch/v1/mail-relay',
      'stateEndpoint' => '/' . trim((string) rest_get_url_prefix(), '/') . '/azubimatch/v1/state',
      'mobileAppUrl' => esc_url_raw(azubimatch_theme_page_url('app')),
      'mobileAppManifestUrl' => esc_url_raw(home_url('/app.webmanifest')),
      'mobileAppServiceWorkerUrl' => esc_url_raw(home_url('/app-sw.js')),
      'mobileAppIconUrl' => esc_url_raw(trailingslashit(AZUBIMATCH_THEME_URL) . 'assets/images/azubimatch-app-icon.svg')
    ]) . ');'
    . 'window.AzubiMatchRouteLiteral = function(target){'
    . 'var key = String(target || "");'
    . 'return (window.AzubiMatchRouteMap && window.AzubiMatchRouteMap[key]) ? window.AzubiMatchRouteMap[key] : key;'
    . '};'
    . 'window.AzubiMatchPage = {'
    . 'matches: function(target){'
    . 'var current = window.location.href.replace(/\\\/$/, "");'
    . 'var candidate = String(target || "").replace(/\\\/$/, "");'
    . 'return current === candidate || current.indexOf(candidate + "?") === 0 || current.indexOf(candidate + "#") === 0;'
    . '}'
    . '};';
  wp_add_inline_script('azubimatch-app', $inlineBefore, 'before');
}
add_action('wp_enqueue_scripts', 'azubimatch_enqueue_assets');

function azubimatch_mobile_app_manifest_url() {
  return home_url('/app.webmanifest');
}

function azubimatch_mobile_app_service_worker_url() {
  return home_url('/app-sw.js');
}

function azubimatch_mobile_app_icon_url() {
  return trailingslashit(AZUBIMATCH_THEME_URL) . 'assets/images/azubimatch-app-icon.svg';
}

function azubimatch_render_mobile_app_meta() {
  echo '<link rel="manifest" href="' . esc_url(azubimatch_mobile_app_manifest_url()) . '">' . "\n";
  echo '<meta name="theme-color" content="#0f4c81">' . "\n";
  echo '<meta name="mobile-web-app-capable" content="yes">' . "\n";
  echo '<meta name="apple-mobile-web-app-capable" content="yes">' . "\n";
  echo '<meta name="apple-mobile-web-app-title" content="AzubiMatch">' . "\n";
  echo '<link rel="icon" type="image/svg+xml" href="' . esc_url(azubimatch_mobile_app_icon_url()) . '">' . "\n";
  echo '<link rel="apple-touch-icon" href="' . esc_url(azubimatch_mobile_app_icon_url()) . '">' . "\n";
}
add_action('wp_head', 'azubimatch_render_mobile_app_meta', 1);

function azubimatch_maybe_serve_mobile_app_asset() {
  if (is_admin()) {
    return;
  }

  $requestUri = trim((string) ($_SERVER['REQUEST_URI'] ?? ''));
  if ($requestUri === '') {
    return;
  }

  $requestPath = trim((string) wp_parse_url($requestUri, PHP_URL_PATH), '/');
  $basename = $requestPath === '' ? '' : basename($requestPath);
  if ($basename !== 'app.webmanifest' && $basename !== 'app-sw.js') {
    return;
  }

  $fileMap = [
    'app.webmanifest' => [
      'path' => AZUBIMATCH_THEME_DIR . '/assets/app.webmanifest',
      'content_type' => 'application/manifest+json; charset=utf-8'
    ],
    'app-sw.js' => [
      'path' => AZUBIMATCH_THEME_DIR . '/assets/app-sw.js',
      'content_type' => 'application/javascript; charset=utf-8'
    ]
  ];

  $assetConfig = $fileMap[$basename] ?? null;
  if (!$assetConfig || !is_file($assetConfig['path'])) {
    status_header(404);
    exit;
  }

  $content = file_get_contents($assetConfig['path']);
  if (!is_string($content)) {
    status_header(500);
    exit;
  }

  if ($basename === 'app.webmanifest') {
    $content = str_replace('"id": "./app.html"', '"id": "' . esc_url_raw(azubimatch_theme_page_url('app')) . '"', $content);
    $content = str_replace('"start_url": "./app.html"', '"start_url": "' . esc_url_raw(azubimatch_theme_page_url('app')) . '"', $content);
    $content = str_replace('"scope": "./"', '"scope": "' . esc_url_raw(home_url('/')) . '"', $content);
    $content = str_replace('"./images/azubimatch-app-icon.svg"', '"' . esc_url_raw(azubimatch_mobile_app_icon_url()) . '"', $content);
    $content = str_replace('"url": "./bewerber_app.html"', '"url": "' . esc_url_raw(azubimatch_theme_page_url('bewerber_app')) . '"', $content);
  }

  if ($basename === 'app-sw.js') {
    $content = str_replace('__AZUBIMATCH_SW_VERSION__', AZUBIMATCH_THEME_ASSET_VERSION, $content);
  }

  nocache_headers();
  header('Content-Type: ' . $assetConfig['content_type']);
  header('Content-Length: ' . strlen($content));
  if ($basename === 'app-sw.js') {
    header('Service-Worker-Allowed: /');
  }

  echo $content;
  exit;
}
add_action('init', 'azubimatch_maybe_serve_mobile_app_asset', 0);

function azubimatch_maybe_render_virtual_theme_page() {
  if (is_admin() || is_feed() || wp_doing_ajax()) {
    return;
  }

  if (is_page() || is_front_page()) {
    return;
  }

  $current = azubimatch_requested_theme_page();
  if (!$current || empty($current['key']) || $current['key'] === 'index') {
    return;
  }

  global $wp_query;
  if ($wp_query instanceof WP_Query) {
    $wp_query->is_404 = false;
    $wp_query->is_page = true;
    $wp_query->is_singular = true;
  }

  status_header(200);
  azubimatch_render_theme_page($current['key']);
  exit;
}
add_action('template_redirect', 'azubimatch_maybe_render_virtual_theme_page', 1);

function azubimatch_render_theme_page($pageKey) {
  $config = azubimatch_theme_page_config($pageKey);
  if (!$config) {
    status_header(404);
    echo '<main class="start-wrapper" style="padding:2rem 0 3rem;"><div class="panel"><h1>Seite nicht gefunden</h1><p>Die angeforderte Vorlage ist im Theme nicht vorhanden.</p></div></main>';
    return;
  }

  $templatePath = AZUBIMATCH_THEME_DIR . '/templates/' . $config['template'];
  $headTemplatePath = AZUBIMATCH_THEME_DIR . '/templates/' . $pageKey . '.head.php';
  if (!file_exists($templatePath)) {
    status_header(500);
    echo '<main class="start-wrapper" style="padding:2rem 0 3rem;"><div class="panel"><h1>Vorlage fehlt</h1><p>Die generierte Theme-Datei konnte nicht geladen werden.</p></div></main>';
    return;
  }

  $classes = trim((string) ($config['body_classes'] ?? ''));
  ?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo('charset'); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <?php wp_head(); ?>
  <?php if (file_exists($headTemplatePath)) { include $headTemplatePath; } ?>
</head>
<body <?php body_class($classes); ?>>
<?php wp_body_open(); ?>
<?php include $templatePath; ?>
<?php wp_footer(); ?>
</body>
</html><?php
}

function azubimatch_document_title($title) {
  $current = azubimatch_current_theme_page();
  if (!$current || empty($current['config']['title'])) {
    return $title;
  }

  return $current['config']['title'];
}
add_filter('pre_get_document_title', 'azubimatch_document_title');

add_action('after_setup_theme', function () {
  add_theme_support('title-tag');
  add_theme_support('post-thumbnails');
  add_theme_support('html5', ['search-form', 'gallery', 'caption', 'style', 'script']);
});

function azubimatch_inject_app_manifest() {
  $current = azubimatch_current_theme_page();
  if (!$current || ($current['key'] ?? '') !== 'app') {
    return;
  }
  $url = esc_url(trailingslashit(AZUBIMATCH_THEME_URL) . 'assets/app.webmanifest');
  echo '<link rel="manifest" href="' . $url . '">' . PHP_EOL;
}
add_action('wp_head', 'azubimatch_inject_app_manifest', 1);
`;
}

function buildPagePhp() {
  return `<?php
$page = azubimatch_current_theme_page();
if ($page && !empty($page['key'])) {
  azubimatch_render_theme_page($page['key']);
  return;
}

?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo('charset'); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<main class="start-wrapper" style="padding:2rem 0 3rem;">
  <div class="panel">
    <?php
    while (have_posts()) {
      the_post();
      the_title('<h1>', '</h1>');
      the_content();
    }
    ?>
  </div>
</main>
<?php wp_footer(); ?>
</body>
</html>
`;
}

function buildFrontPagePhp() {
  return `<?php
azubimatch_render_theme_page('index');
`;
}

function buildThemeIndexPhp() {
  return `<?php
require __DIR__ . '/page.php';
`;
}

function buildManifestJson() {
  return JSON.stringify({
    theme: themeSlug,
    generatedAt: new Date().toISOString(),
    pages: pageConfigs.map((page) => ({
      key: page.key,
      slug: page.slug,
      source: page.source,
      title: page.title
    })),
    legacyPhpFiles
  }, null, 2) + '\n';
}

function buildHtaccessRedirects() {
  const rules = pageConfigs
    .filter((page) => page.key !== 'index')
    .map((page) => `Redirect 301 /${page.source} /${page.slug}/`)
    .join('\n');

  return `# Alte AzubiMatch-Routen auf die WordPress-Seiten umleiten\nRedirect 301 /index.html /\nRedirect 301 /profil.html /bewerber-profil/\n${rules}\n`;
}

async function ensureEmptyDirectory(targetDir) {
  try {
    await fs.rm(targetDir, { recursive: true, force: true });
  } catch (error) {
    if (!error || error.code !== 'EBUSY') {
      throw error;
    }

    const entries = await fs.readdir(targetDir, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      const entryPath = path.join(targetDir, entry.name);
      try {
        await fs.rm(entryPath, { recursive: true, force: true });
      } catch (entryError) {
        if (!entryError || entryError.code !== 'EBUSY') {
          throw entryError;
        }
        console.warn(`WARN: Ueberspringe gesperrte Datei oder Ordner beim Export: ${entryPath}`);
      }
    }
  }
  await fs.mkdir(targetDir, { recursive: true });
}

async function writeFile(targetPath, content) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, content, 'utf8');
}

async function copyFile(sourceRelative, targetPath) {
  const sourcePath = path.join(rootDir, sourceRelative);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.copyFile(sourcePath, targetPath);
}

async function copyDirectory(sourceRelative, targetPath) {
  const sourcePath = path.join(rootDir, sourceRelative);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.cp(sourcePath, targetPath, { recursive: true });
}

function buildCrc32Table() {
  const table = new Uint32Array(256);

  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    }
    table[index] = value >>> 0;
  }

  return table;
}

const CRC32_TABLE = buildCrc32Table();

function crc32(buffer) {
  let value = 0xffffffff;
  for (const byte of buffer) {
    value = CRC32_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function getDosDateTime(date) {
  const safeDate = new Date(date instanceof Date ? date : Date.now());
  const year = Math.max(1980, safeDate.getFullYear());
  const dosTime = ((safeDate.getHours() & 0x1f) << 11)
    | ((safeDate.getMinutes() & 0x3f) << 5)
    | Math.floor((safeDate.getSeconds() || 0) / 2);
  const dosDate = (((year - 1980) & 0x7f) << 9)
    | (((safeDate.getMonth() + 1) & 0x0f) << 5)
    | (safeDate.getDate() & 0x1f);

  return {
    dosTime,
    dosDate
  };
}

async function collectFilesRecursive(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFilesRecursive(absolutePath));
      continue;
    }
    if (entry.isFile()) {
      files.push(absolutePath);
    }
  }

  return files;
}

function buildFallbackZipPath() {
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  return path.join(outputRoot, `${themeSlug}-${timestamp}.zip`);
}

async function buildThemeArchive() {
  let archivePath = zipPath;
  try {
    await fs.rm(archivePath, { force: true });
  } catch (error) {
    if (!error || error.code !== 'EBUSY') {
      throw error;
    }
    archivePath = buildFallbackZipPath();
    console.warn(`WARN: Standard-ZIP ist gesperrt, nutze Ausweichpfad: ${archivePath}`);
    await fs.rm(archivePath, { force: true }).catch(() => {});
  }
  const files = (await collectFilesRecursive(themeDir)).sort();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const filePath of files) {
    const stats = await fs.stat(filePath);
    const data = await fs.readFile(filePath);
    const archiveName = path.relative(outputRoot, filePath).split(path.sep).join('/');
    const fileNameBuffer = Buffer.from(archiveName, 'utf8');
    const fileCrc32 = crc32(data);
    const { dosTime, dosDate } = getDosDateTime(stats.mtime);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(fileCrc32, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(fileNameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, fileNameBuffer, data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(fileCrc32, 16);
    centralHeader.writeUInt32LE(data.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(fileNameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, fileNameBuffer);
    offset += localHeader.length + fileNameBuffer.length + data.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const endOfCentralDirectory = Buffer.alloc(22);
  endOfCentralDirectory.writeUInt32LE(0x06054b50, 0);
  endOfCentralDirectory.writeUInt16LE(0, 4);
  endOfCentralDirectory.writeUInt16LE(0, 6);
  endOfCentralDirectory.writeUInt16LE(files.length, 8);
  endOfCentralDirectory.writeUInt16LE(files.length, 10);
  endOfCentralDirectory.writeUInt32LE(centralDirectory.length, 12);
  endOfCentralDirectory.writeUInt32LE(offset, 16);
  endOfCentralDirectory.writeUInt16LE(0, 20);

  await fs.writeFile(archivePath, Buffer.concat([...localParts, centralDirectory, endOfCentralDirectory]));
  return archivePath;
}

async function buildTheme() {
  await ensureEmptyDirectory(outputRoot);
  await fs.mkdir(themeDir, { recursive: true });
  await fs.mkdir(templatesDir, { recursive: true });
  await fs.mkdir(assetsDir, { recursive: true });
  await fs.mkdir(legacyDir, { recursive: true });

  await copyDirectory('images', path.join(assetsDir, 'images'));
  await copyDirectory('vendor', path.join(assetsDir, 'vendor'));
  await copyFile('style.css', path.join(assetsDir, 'style.css'));
  await copyFile('app.webmanifest', path.join(assetsDir, 'app.webmanifest'));
  await copyFile('app-sw.js', path.join(assetsDir, 'app-sw.js'));
  await copyFile('privacy-settings.js', path.join(assetsDir, 'privacy-settings.js'));
  await copyFile('discovery.js', path.join(assetsDir, 'discovery.js'));
  await copyFile('bewerber-iphone-fallback.html', path.join(themeDir, 'bewerber-iphone-fallback.html'));

  const originalScript = await fs.readFile(path.join(rootDir, 'script.js'), 'utf8');
  const transformedScript = transformAppScript(originalScript);
  await writeFile(path.join(assetsDir, 'script.js'), hardenMobileAppRuntimeScript(transformedScript));

  for (const page of pageConfigs) {
    const sourcePath = path.join(rootDir, page.source);
    const sourceContent = await fs.readFile(sourcePath, 'utf8');
    const { bodyClasses, bodyContent } = extractBody(sourceContent);
    const headEnhancements = extractHeadEnhancements(sourceContent);
    page.bodyClasses = bodyClasses;
    await writeFile(path.join(templatesDir, `${page.key}.php`), transformMarkupReferences(bodyContent) + '\n');
    if (headEnhancements) {
      await writeFile(path.join(templatesDir, `${page.key}.head.php`), transformMarkupReferences(headEnhancements) + '\n');
    }
  }

  for (const legacyFile of legacyPhpFiles) {
    await copyFile(legacyFile, path.join(legacyDir, legacyFile));
  }

  const mailConfigSrc = path.join(rootDir, 'mail_relay_config.php');
  try {
    await fs.access(mailConfigSrc);
    await copyFile('mail_relay_config.php', path.join(themeDir, 'mail_relay_config.php'));
  } catch (_e) { /* Datei nicht vorhanden – wird übersprungen */ }

  await writeFile(path.join(themeDir, 'style.css'), buildThemeStyleCss());
  await writeFile(path.join(themeDir, 'functions.php'), buildFunctionsPhp());
  await writeFile(path.join(themeDir, 'page.php'), buildPagePhp());
  await writeFile(path.join(themeDir, 'front-page.php'), buildFrontPagePhp());
  await writeFile(path.join(themeDir, 'index.php'), buildThemeIndexPhp());
  await writeFile(path.join(outputRoot, 'page-manifest.json'), buildManifestJson());
  await writeFile(path.join(outputRoot, 'strato-redirects.htaccess'), buildHtaccessRedirects());

  return {
    archivePath: await buildThemeArchive()
  };
}

buildTheme()
  .then(({ archivePath }) => {
    const archiveMessage = archivePath ? ` ZIP: ${archivePath}` : ' ZIP: nicht erstellt';
    console.log(`PASS: WordPress-Theme nach ${outputRoot} exportiert.${archiveMessage}`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });