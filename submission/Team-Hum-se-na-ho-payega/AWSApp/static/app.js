// Front end for Backup Vault. Plain JS, no build step.

let selected = null;

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

async function api(path, body) {
  const res = await fetch(path, body === undefined ? {} : {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function prettyTime(iso) {
  if (!iso) return "never";
  return new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function prettySize(n) {
  if (n == null) return "-";
  if (n < 1024) return n + " B";
  if (n < 1048576) return (n / 1024).toFixed(1) + " KB";
  return (n / 1048576).toFixed(1) + " MB";
}

function showBanner(text, isInfo) {
  const b = $("banner");
  b.textContent = text;
  b.className = isInfo ? "info" : "";
  b.hidden = !text;
}

async function refresh() {
  const s = await api("/api/status");
  $("mode").textContent = s.mode;

  const t = s.totals;
  $("stats").innerHTML = `
    <div class="stat"><b>${t.jobs}</b><span>backup jobs</span></div>
    <div class="stat good"><b>${t.ok}</b><span>succeeded</span></div>
    <div class="stat ${t.failed ? "bad" : ""}"><b>${t.failed}</b><span>failed</span></div>
    <div class="stat ${t.missed ? "bad" : "good"}"><b>${t.last_success ? prettyTime(t.last_success) : "none yet"}</b><span>last successful backup</span></div>
    <div class="stat"><b>${t.versions} / ${prettySize(t.bytes)}</b><span>stored versions</span></div>`;

  if (t.missed) {
    showBanner(t.last_success
      ? `No successful backup within the ${s.policy.rpo_hours}h RPO. Run a backup.`
      : "No backup has run yet. Click Back up now.");
  } else if ($("banner").className === "") {
    showBanner("");
  }

  $("files").innerHTML = `<tr><th>File</th><th>Backup</th><th>Versions</th><th>Size</th></tr>` +
    s.files.map((f) => `
      <tr class="pick ${f.file === selected ? "active" : ""}" data-file="${esc(f.file)}">
        <td>${esc(f.file)}</td>
        <td>${f.in_backup ? '<span class="ok">present</span>' : '<span class="bad">missing</span>'}</td>
        <td>${f.versions}</td><td>${prettySize(f.size)}</td>
      </tr>`).join("");

  const st = s.setup;
  const check = (label, good) => `<li><span class="${good ? "ok" : "info"}">${good ? "Done" : "Not yet"}</span> &nbsp;${label}</li>`;
  $("storage").innerHTML = [
    check("Bucket created", !!st),
    check("Public access blocked", st && st.public_access_blocked),
    check("Versioning enabled", st && st.versioning),
    check("Encryption at rest", st && st.encryption),
    check("Lifecycle rule for old versions", st && st.lifecycle),
  ].join("");

  for (const [name, value] of Object.entries(s.policy)) {
    const el = document.querySelector(`#policy [name=${name}]`);
    if (el && document.activeElement !== el) el.value = value;
  }

  $("recoveries").innerHTML = s.recoveries.length
    ? s.recoveries.map((r) => `<li>${esc(r.file)} from ${esc(r.from_version)}
        <span class="${r.verified ? "ok" : "bad"}">${r.verified ? "verified" : "checksum mismatch"}</span>
        <div class="muted small">${prettyTime(r.time)}</div></li>`).join("")
    : '<li class="muted">Nothing restored yet.</li>';

  $("events").innerHTML = s.events.length
    ? s.events.map((e) => `<li><span class="${e.level}">${e.level}</span> ${esc(e.message)}
        <div class="muted small">${prettyTime(e.time)}</div></li>`).join("")
    : '<li class="muted">No events yet.</li>';

  $("jobs").innerHTML = `<tr><th>Time</th><th>File</th><th>Outcome</th></tr>` +
    s.recent_jobs.map((j) => `<tr><td>${prettyTime(j.time)}</td><td>${esc(j.file)}</td>
      <td class="${j.outcome}">${j.outcome}${j.error ? `<div class="muted">${esc(j.error)}</div>` : ""}</td></tr>`).join("");

  const v = s.verify;
  $("verify-out").innerHTML = !v ? "Not run yet." : `
    <p>${prettyTime(v.time)}: ${v.found} of ${v.expected} files found, ${v.healthy} match exactly.</p>
    <table class="compact">${v.rows.map((r) =>
      `<tr><td>${esc(r.file)}</td><td class="${r.status}">${r.status.replace("_", " ")}</td><td class="muted">${esc(r.note)}</td></tr>`).join("")}</table>`;

  if (selected) loadVersions();
}

async function loadVersions() {
  const versions = await api("/api/versions?key=" + encodeURIComponent(selected));
  $("history-panel").hidden = false;
  $("history-title").textContent = "History: " + selected;
  $("versions").innerHTML = `<tr><th>Version</th><th>Saved</th><th>Size</th><th></th></tr>` +
    versions.map((v, i) => `
      <tr>
        <td>${esc(v.id.slice(0, 12))}${i === 0 ? ' <span class="muted">(latest)</span>' : ""}</td>
        <td>${prettyTime(v.time)}</td>
        <td>${v.deleted ? '<span class="bad">delete marker</span>' : prettySize(v.size)}</td>
        <td>${v.deleted ? "" : `<button class="small-btn" data-restore="${esc(v.id)}">Restore this</button>`}</td>
      </tr>`).join("");
}

// run an action, then redraw. Errors go to the banner.
async function run(fn, okMessage) {
  try {
    await fn();
    showBanner(okMessage || "", true);
  } catch (err) {
    showBanner(err.message);
  }
  await refresh();
}

$("setup").onclick = () => run(() => api("/api/setup", {}), "Storage is set up.");
$("backup").onclick = () => run(async () => {
  const jobs = await api("/api/backup", {});
  const failed = jobs.filter((j) => j.outcome === "failed").length;
  if (failed) throw new Error(`${failed} file(s) failed to back up. See the log below.`);
}, "Backup finished.");
$("fail").onclick = () => run(async () => {
  await api("/api/backup", { fail: true });
  throw new Error("Backup finished with a failure. An alert was recorded in the event list.");
});
$("verify").onclick = () => run(() => api("/api/verify", {}), "Verification complete.");

$("files").onclick = (e) => {
  const row = e.target.closest("tr.pick");
  if (!row) return;
  selected = row.dataset.file;
  refresh();
};

document.querySelectorAll("[data-sim]").forEach((btn) => {
  btn.onclick = () => {
    if (!selected) return;
    const kind = btn.dataset.sim;
    if (kind === "edit") return run(() => api("/api/edit-source", { file: selected }), "Local file edited. Back up to save a new version.");
    run(() => api("/api/simulate", { file: selected, action: kind === "bad" ? "bad-update" : "delete" }),
      kind === "bad" ? "Bad content uploaded. Restore an earlier version." : "File deleted. Restore a version below.");
  };
});

$("versions").onclick = (e) => {
  const id = e.target.dataset.restore;
  if (!id) return;
  run(async () => {
    const r = await api("/api/restore", { file: selected, version: id });
    if (!r.verified) throw new Error("Restored, but the checksum did not match.");
  }, "Restored and verified against the original checksum.");
};

$("policy").onsubmit = (e) => {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(e.target));
  run(() => api("/api/policy", body), "Targets saved. Re-run Set up storage to apply new retention to the bucket.");
};

refresh();
