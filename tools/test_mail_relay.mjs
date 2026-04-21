import process from "node:process";

function parseArgs(argv) {
  const options = {
    endpoint: "",
    to: "",
    origin: "",
    referer: "",
    subject: "AzubiMatch Relay Test",
    text: "Dies ist ein nicht-oeffentlicher Test des AzubiMatch Mail-Relay.",
    html: "",
    apiKey: process.env.AZUBIMATCH_MAIL_RELAY_API_KEY || "",
    includeAttachment: false,
    timeoutMs: 15000
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--endpoint" && next) {
      options.endpoint = next;
      index += 1;
      continue;
    }
    if (arg === "--to" && next) {
      options.to = next;
      index += 1;
      continue;
    }
    if (arg === "--origin" && next) {
      options.origin = next;
      index += 1;
      continue;
    }
    if (arg === "--referer" && next) {
      options.referer = next;
      index += 1;
      continue;
    }
    if (arg === "--subject" && next) {
      options.subject = next;
      index += 1;
      continue;
    }
    if (arg === "--text" && next) {
      options.text = next;
      index += 1;
      continue;
    }
    if (arg === "--html" && next) {
      options.html = next;
      index += 1;
      continue;
    }
    if (arg === "--api-key" && next) {
      options.apiKey = next;
      index += 1;
      continue;
    }
    if (arg === "--timeout-ms" && next) {
      options.timeoutMs = Number.parseInt(next, 10) || options.timeoutMs;
      index += 1;
      continue;
    }
    if (arg === "--attachment") {
      options.includeAttachment = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      options.help = true;
    }
  }

  return options;
}

function printHelp() {
  console.log([
    "Usage:",
    "  node tools/test_mail_relay.mjs --endpoint <url> --to <email> [options]",
    "",
    "Options:",
    "  --origin <url>       Override Origin header. Defaults to the endpoint origin.",
    "  --referer <url>      Override Referer header. Defaults to the origin.",
    "  --subject <text>     Mail subject.",
    "  --text <text>        Plain text body.",
    "  --html <html>        HTML body. Defaults to a <p>-wrapped text version.",
    "  --api-key <value>    Optional relay API key. Also read from AZUBIMATCH_MAIL_RELAY_API_KEY.",
    "  --attachment         Include a small text attachment.",
    "  --timeout-ms <n>     Request timeout in milliseconds. Default: 15000.",
    "  --help               Show this help.",
    "",
    "Examples:",
    "  node tools/test_mail_relay.mjs --endpoint http://127.0.0.1:8080/mail_relay.php --to test@example.com",
    "  node tools/test_mail_relay.mjs --endpoint https://example.com/wp-json/azubimatch/v1/mail-relay --to test@example.com --attachment"
  ].join("\n"));
}

function deriveOrigin(endpoint) {
  const url = new URL(endpoint);
  return `${url.protocol}//${url.host}`;
}

function deriveReferer(origin) {
  return origin.endsWith("/") ? origin : `${origin}/`;
}

function buildHtml(text) {
  return `<p>${String(text || "").replace(/[&<>]/g, (match) => {
    if (match === "&") return "&amp;";
    if (match === "<") return "&lt;";
    return "&gt;";
  }).replace(/\n/g, "<br>")}</p>`;
}

function buildPayload(options) {
  const payload = {
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html || buildHtml(options.text),
    attachments: []
  };

  if (options.includeAttachment) {
    payload.attachments.push({
      filename: "relay-test.txt",
      contentType: "text/plain",
      contentBase64: Buffer.from("AzubiMatch Relay Testanhang", "utf8").toString("base64")
    });
  }

  return payload;
}

function classifyFailure(status, bodyText, contentType) {
  const loweredBody = String(bodyText || "").toLowerCase();
  const loweredType = String(contentType || "").toLowerCase();

  if (loweredType.includes("text/html") && loweredBody.includes("construction")) {
    return "Maintenance- oder Baustellenseite ueberdeckt den Relay-Endpunkt.";
  }
  if (status === 403) {
    return "Same-Origin-Pruefung oder API-Key-Konfiguration abgelehnt.";
  }
  if (status === 400) {
    return "Request-Body oder Pflichtfelder sind ungueltig.";
  }
  if (status === 502) {
    return "Relay wurde erreicht, aber der Servermailer konnte nicht zustellen.";
  }
  if (status >= 500) {
    return "Serverfehler beim Relay-Endpunkt.";
  }
  return "Relay antwortete nicht mit einem erfolgreichen JSON-Ergebnis.";
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  if (!options.endpoint || !options.to) {
    printHelp();
    process.exitCode = 1;
    return;
  }

  const origin = options.origin || deriveOrigin(options.endpoint);
  const referer = options.referer || deriveReferer(origin);
  const payload = buildPayload(options);

  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-Requested-With": "AzubiMatchMailRelay",
    "Origin": origin,
    "Referer": referer
  };

  if (String(options.apiKey || "").trim()) {
    headers["X-API-Key"] = String(options.apiKey).trim();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

  let response;
  let rawBody = "";
  try {
    response = await fetch(options.endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    rawBody = await response.text();
  } catch (error) {
    clearTimeout(timeout);
    console.error("FAIL: Request konnte nicht abgeschlossen werden.");
    console.error(String(error && error.message ? error.message : error));
    process.exitCode = 1;
    return;
  }
  clearTimeout(timeout);

  const contentType = response.headers.get("content-type") || "";
  let parsed = null;
  if (contentType.toLowerCase().includes("application/json")) {
    try {
      parsed = JSON.parse(rawBody);
    } catch (error) {
      parsed = null;
    }
  }

  console.log(`Endpoint: ${options.endpoint}`);
  console.log(`Origin:   ${origin}`);
  console.log(`Referer:  ${referer}`);
  console.log(`Status:   ${response.status}`);
  console.log(`Type:     ${contentType || "-"}`);

  if (parsed) {
    console.log(`Body:     ${JSON.stringify(parsed)}`);
  } else {
    const compactBody = rawBody.replace(/\s+/g, " ").trim();
    console.log(`Body:     ${compactBody.slice(0, 400) || "<leer>"}`);
  }

  if (response.ok && parsed && parsed.success === true) {
    console.log("PASS: Relay hat den Versand bestaetigt.");
    process.exitCode = 0;
    return;
  }

  console.error(`FAIL: ${classifyFailure(response.status, rawBody, contentType)}`);
  process.exitCode = 1;
}

main();