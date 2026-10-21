/* ---------- App ---------- */
let S = {
  me: null,
  users: [],
  gigs: [],
  apps: [],
  revs: [],
  view: "discover",
  pv: null,
  f: { q: "", type: "", category: "", payment_type: "", min: "", max: "" },
};
try {
  S.me = JSON.parse(localStorage.getItem("cs_me"));
} catch (x) {}
const usr = (id) =>
    S.users.find((u) => u.id == id) || { name: "?", skills: [] },
  rate = (id) => {
    const r = S.revs.filter((x) => x.reviewee_id == id);
    return r.length ? r.reduce((a, b) => a + b.rating, 0) / r.length : 0;
  },
  ini = (n) =>
    n
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2),
  pay = (g) => PAY[g.payment_type] + (g.budget ? " · Rs " + g.budget : ""),
  sb = (s) => `<span class="st s-${s.replace(" ", "-")}">${s}</span>`;
const done = (id) =>
  S.gigs.filter(
    (g) =>
      g.status == "Completed" &&
      (g.user_id == id || g.accepted_applicant_id == id),
  ).length;
async function refresh() {
  [S.users, S.gigs, S.apps, S.revs] = await Promise.all(
    ["users", "gigs", "applications", "reviews"].map((k) =>
      api("GET", "/" + k),
    ),
  );
  S.gigs = S.gigs.map(gs);
}
function toast(m, er) {
  const t = $("#toast");
  t.textContent = m;
  t.className = er ? "err" : "";
  t.hidden = false;
  clearTimeout(t.h);
  t.h = setTimeout(() => (t.hidden = true), 2600);
}
async function call(fn, ok) {
  try {
    await fn();
    if (ok) toast(ok);
    await refresh();
    render();
  } catch (x) {
    toast(x.message || "Something went wrong", 1);
  }
}
function card(g, i) {
  const o = usr(g.user_id);
  return `<article class="card cd" style="animation-delay:${Math.min(i, 10) * 40}ms" data-act="open" data-id="${g.id}"><div class="row"><div class="av">${ini(o.name)}</div><div class="sp"><b>${e(o.name)}</b> <span class="m">★ ${rate(o.id).toFixed(1)}</span><div class="m">${e(o.major)} · Sem ${o.semester}</div></div><span class="tag ${g.type}">${g.type}</span></div><h3 style="margin-top:10px">${IC[g.category]} ${e(g.title)}</h3><p>${e(g.description)}</p><div class="row"><span class="m">🗓 ${g.deadline}</span><span class="sp"></span><span class="pill">${pay(g)}</span>${sb(g.status)}</div></article>`;
}
function auth() {
  const s = S.mode == "up";
  $("#app").innerHTML =
    `<div class="auth"><div class="blob" style="width:300px;height:300px;background:#a78bfa;top:-60px;left:-60px"></div><div class="blob" style="width:260px;height:260px;background:#ff8fbb;bottom:-40px;right:-40px;animation-delay:-4s"></div><div class="shell"><div class="hero"><span class="big">${LOGO}</span><h1>CampusSwap</h1><p>Offer a skill, request help and build a trusted campus reputation.</p><ul><li>💻 Gigs in Programming, Design, Writing and Tutoring</li><li>🤝 Get paid, swap skills or help for free</li><li>⭐ Earn ratings after every completed gig</li></ul></div><div class="box"><span class="big sm">${LOGO}</span><h1 style="text-align:center">CampusSwap</h1><p class="m" style="text-align:center;margin:0">Offer a skill, request help, build your reputation.</p><div class="tabs"><button class="chip ${s ? "" : "on"}" data-act="mode" data-v="in">Log in</button><button class="chip ${s ? "on" : ""}" data-act="mode" data-v="up">Sign up</button></div><form data-f="${s ? "signup" : "login"}">${s ? '<input name="name" placeholder="Full name" required><input name="major" placeholder="Major"><input name="semester" type="number" min="1" max="12" placeholder="Semester"><input name="skills" placeholder="Skills, comma separated"><input name="bio" placeholder="Short bio">' : ""}<input name="email" type="email" placeholder="Email" required><input name="password" type="password" placeholder="Password" required><button class="btn w">${s ? "Create account" : "Log in"}</button></form></div></div></div>`;
}
function render() {
  if (!S.me) return auth();
  const me = usr(S.me.id),
    N = [
      ["discover", "✨", "Discover"],
      ["post", "＋", "Post"],
      ["activity", "🔔", "Activity"],
      ["profile", "👤", "Profile"],
    ];
  $("#app").innerHTML =
    `<header><div class="lg">${LOGO}CampusSwap</div><div class="me"><div class="av" style="width:28px;height:28px;font-size:.75rem">${ini(me.name)}</div><b>${e(me.name.split(" ")[0])}</b></div><button class="btn o s" data-act="logout">Log out</button></header><main id="v"></main><nav>${N.map((n) => `<button class="${n[0] == "post" ? "post " : ""}${S.view == n[0] ? "on" : ""}" data-act="nav" data-v="${n[0]}"><i>${n[1]}</i>${n[2]}</button>`).join("")}</nav>`;
  ({ discover, post, activity, profile })[S.view]();
}
function discover() {
  const f = S.f;
  $("#v").innerHTML =
    `<input id="q" placeholder="🔍 Search title or description" value="${e(f.q)}"><div class="chips">${["", "Offering", "Requesting"].map((t) => `<button class="chip ${f.type == t ? "on" : ""}" data-act="ft" data-v="${t}">${t || "✨ All"}</button>`).join("")}</div><div class="cats">${["", ...CATS].map((c) => `<button class="cat ${f.category == c ? "on" : ""}" data-act="fc" data-v="${c}"><i>${c ? IC[c] : "✨"}</i>${c || "All"}</button>`).join("")}</div><div class="fil"><select id="fp"><option value="">Any payment</option>${Object.keys(
      PAY,
    )
      .map(
        (k) =>
          `<option value="${k}" ${f.payment_type == k ? "selected" : ""}>${PAY[k]}</option>`,
      )
      .join(
        "",
      )}</select><input id="mn" type="number" placeholder="Min Rs" value="${f.min}"><input id="mx" type="number" placeholder="Max Rs" value="${f.max}"></div><div class="grid" id="list"></div>`;
  list();
}
async function list() {
  const f = S.f,
    qs = Object.entries(f)
      .filter((x) => x[1] !== "")
      .map(([k, v]) => k + "=" + encodeURIComponent(v))
      .join("&"),
    l = (await api("GET", "/gigs?" + qs)).map(gs),
    el = $("#list");
  if (el)
    el.innerHTML =
      l.map(card).join("") ||
      '<p class="m">No gigs match. Clear a filter or post your own.</p>';
}
function post() {
  $("#v").innerHTML =
    `<h2>Post a campus listing</h2><p class="m">Offer a skill or request help from peers.</p><form data-f="post" style="max-width:560px"><label>Listing type</label><div class="seg"><label><input type="radio" name="type" value="Offering" checked><span>I want to offer</span></label><label><input type="radio" name="type" value="Requesting"><span>I need help</span></label></div><label>Payment type</label><div class="seg"><label><input type="radio" name="payment_type" value="SkillSwap" checked><span>Skill swap</span></label><label><input type="radio" name="payment_type" value="Paid"><span>Paid</span></label><label><input type="radio" name="payment_type" value="Free"><span>Free</span></label></div><label>Title</label><input name="title" placeholder="e.g. 1-on-1 calculus tutoring" required><label>Category</label><select name="category">${CATS.map((c) => `<option>${c}</option>`).join("")}</select><label>Description and deliverables</label><textarea name="description" rows="4" required></textarea><label>Budget in Rs (Paid only)</label><input name="budget" type="number" min="1"><label>Deadline</label><input name="deadline" type="date" min="${D(0)}" required><button class="btn w">Publish listing</button></form>`;
}
function activity() {
  const id = S.me.id,
    mine = S.gigs.filter((g) => g.user_id == id),
    myA = S.apps.filter((a) => a.applicant_id == id),
    rv = S.gigs.filter(
      (g) =>
        g.status == "Completed" &&
        [g.user_id, g.accepted_applicant_id].includes(id) &&
        !S.revs.some((r) => r.gig_id == g.id && r.reviewer_id == id),
    );
  $("#v").innerHTML =
    `<h2>Activity and exchanges</h2>${rv.length ? `<div class="sec"><b>Reviews to leave</b>${rv.map((g) => `<div class="row" style="margin-top:6px"><span class="sp">${e(g.title)}</span><button class="btn s" data-act="open" data-id="${g.id}">Review</button></div>`).join("")}</div>` : ""}<h3>My gigs</h3><div class="grid">${
      mine
        .map((g) => {
          const a = S.apps.filter((x) => x.gig_id == g.id);
          return `<div class="card" style="cursor:default"><div class="row"><b class="sp" style="cursor:pointer" data-act="open" data-id="${g.id}">${e(g.title)}</b>${sb(g.status)}</div><div class="m">${a.length} application${a.length == 1 ? "" : "s"}</div>${a.map((x) => `<div class="row" style="margin-top:8px"><div class="sp"><b>${e(usr(x.applicant_id).name)}</b><div class="m">${e(x.message)}</div></div>${x.status == "Pending" && g.status == "Open" ? `<button class="btn s" data-act="acc" data-id="${x.id}" data-v="Accepted">Accept</button><button class="btn o s" data-act="acc" data-id="${x.id}" data-v="Rejected">Reject</button>` : sb(x.status)}</div>`).join("")}</div>`;
        })
        .join("") || '<p class="m">You have not posted a gig yet.</p>'
    }</div><div class="card" style="cursor:default;margin-top:14px;background:linear-gradient(135deg,#5b3fd1,#c2358a);color:#fff"><b>My application statuses</b>${
      myA
        .map((a) => {
          const g = S.gigs.find((x) => x.id == a.gig_id);
          return `<div class="row" style="margin-top:6px"><span class="sp">${e(g.title)}</span><b>${a.status}</b></div>`;
        })
        .join("") || "<p>No applications yet. Browse Discover and apply.</p>"
    }</div>`;
}
function profile() {
  const id = S.pv || S.me.id,
    u = usr(id),
    r = S.revs.filter((x) => x.reviewee_id == id);
  $("#v").innerHTML =
    `<div class="card cd" style="cursor:default;max-width:640px">${S.pv && S.pv != S.me.id ? '<a data-act="mine">‹ My profile</a>' : ""}<div class="row"><div class="av" style="width:64px;height:64px;font-size:1.4rem">${ini(u.name)}</div><div><h2>${e(u.name)}</h2><div class="m">${e(u.major)} · Semester ${u.semester}</div></div></div><p>${e(u.bio)}</p><div class="row">${u.skills.map((s) => `<span class="pill">${e(s)}</span>`).join("")}</div><div class="stat"><div><b>${S.gigs.filter((g) => g.user_id == id).length}</b>Posted</div><div><b>${done(id)}</b>Completed</div><div><b>★ ${r.length ? rate(id).toFixed(1) : "–"}</b>${r.length} review${r.length == 1 ? "" : "s"}</div></div><h3>Reviews</h3>${r.map((x) => `<div class="sec"><b>${"★".repeat(x.rating)}</b> <span class="m">from ${e(usr(x.reviewer_id).name)}</span><div>${e(x.comment)}</div></div>`).join("") || '<p class="m">No reviews yet.</p>'}</div>`;
}
function detail(id) {
  const g = S.gigs.find((x) => x.id == id),
    o = usr(g.user_id),
    mine = g.user_id == S.me.id,
    apps = S.apps.filter((a) => a.gig_id == g.id),
    my = apps.find((a) => a.applicant_id == S.me.id),
    party = mine || g.accepted_applicant_id == S.me.id;
  let h = `<div class="row"><h2 class="sp">${IC[g.category]} ${e(g.title)}</h2><button class="btn o s" data-act="close">Close</button></div><div class="m">by <a data-act="prof" data-id="${o.id}">${e(o.name)}</a> · ★ ${rate(o.id).toFixed(1)} · ${g.category}</div><p>${e(g.description)}</p><div class="row"><span class="tag ${g.type}">${g.type}</span><span class="pill">${pay(g)}</span><span class="pill">🗓 ${g.deadline}</span>${sb(g.status)}</div>`;
  if (g.accepted_applicant_id)
    h += `<p class="m">Accepted: <a data-act="prof" data-id="${g.accepted_applicant_id}">${e(usr(g.accepted_applicant_id).name)}</a></p>`;
  if (mine) {
    h += `<div class="sec"><b>Applications (${apps.length})</b>${apps.map((a) => `<div class="row" style="margin-top:6px"><div class="sp"><a data-act="prof" data-id="${a.applicant_id}">${e(usr(a.applicant_id).name)}</a><div class="m">${e(a.message)}</div></div>${a.status == "Pending" && g.status == "Open" ? `<button class="btn s" data-act="acc" data-id="${a.id}" data-v="Accepted">Accept</button><button class="btn o s" data-act="acc" data-id="${a.id}" data-v="Rejected">Reject</button>` : sb(a.status)}</div>`).join("")}</div><div class="row">${g.status == "In Progress" ? `<button class="btn s" data-act="gst" data-id="${g.id}" data-v="Completed">Mark completed</button>` : ""}${["Open", "In Progress"].includes(g.status) ? `<button class="btn r s" data-act="gst" data-id="${g.id}" data-v="Cancelled">Cancel gig</button>` : ""}</div>`;
  } else if (my)
    h += `<div class="sec">Your application: ${sb(my.status)}<div class="m">${e(my.message)}</div></div>`;
  else if (g.status == "Open")
    h += `<form data-f="apply" data-id="${g.id}"><label>Apply with a short message</label><textarea name="message" rows="3" required></textarea><button class="btn w">Send application</button></form>`;
  const rs = S.revs.filter((r) => r.gig_id == g.id);
  h += rs
    .map(
      (r) =>
        `<div class="sec"><b>${"★".repeat(r.rating)}</b> <span class="m">${e(usr(r.reviewer_id).name)} reviewed ${e(usr(r.reviewee_id).name)}</span><div>${e(r.comment)}</div></div>`,
    )
    .join("");
  if (
    g.status == "Completed" &&
    party &&
    !rs.some((r) => r.reviewer_id == S.me.id)
  )
    h += `<form data-f="review" data-id="${g.id}"><label>Rate the other person</label><select name="rating">${[5, 4, 3, 2, 1].map((n) => `<option value="${n}">${"★".repeat(n)}</option>`).join("")}</select><textarea name="comment" rows="2" placeholder="Leave a comment"></textarea><button class="btn w">Submit review</button></form>`;
  let m = $(".ov");
  if (!m) {
    m = document.createElement("div");
    m.className = "ov";
    document.body.append(m);
  }
  m.innerHTML = `<div class="md">${h}</div>`;
  m.dataset.g = id;
}
const closeM = () => {
  $(".ov")?.remove();
};
document.addEventListener("click", (ev) => {
  const t = ev.target;
  if (t.classList.contains("ov")) return closeM();
  const a = t.closest("[data-act]");
  if (!a) return;
  const d = a.dataset,
    v = d.v,
    u = S.me?.id;
  const reopen = async (fn) => {
    const g = $(".ov")?.dataset.g;
    await call(fn);
    if (g) detail(g);
  };
  ({
    mode: () => {
      S.mode = v;
      auth();
    },
    logout: () => {
      S.me = null;
      try {
        localStorage.removeItem("cs_me");
      } catch (x) {}
      closeM();
      auth();
    },
    nav: () => {
      S.view = v;
      S.pv = null;
      closeM();
      render();
    },
    ft: () => {
      S.f.type = v;
      discover();
    },
    fc: () => {
      S.f.category = v;
      discover();
    },
    open: () => detail(d.id),
    close: closeM,
    prof: () => {
      S.pv = +d.id;
      S.view = "profile";
      closeM();
      render();
    },
    mine: () => {
      S.pv = null;
      profile();
    },
    acc: () =>
      reopen(() => api("PATCH", "/applications/" + d.id, { status: v }, u)),
    gst: () => reopen(() => api("PATCH", "/gigs/" + d.id, { status: v }, u)),
  })[d.act]?.();
});
["input", "change"].forEach((ev) =>
  document.addEventListener(ev, (x) => {
    const i = x.target,
      k = { q: "q", fp: "payment_type", mn: "min", mx: "max" }[i.id];
    if (k && (ev == "input") == (i.tagName != "SELECT")) {
      S.f[k] = i.value;
      clearTimeout(S.dt);
      S.dt = setTimeout(list, 250);
    }
  }),
);
async function login(b) {
  try {
    const r = await api("POST", "/login", b);
    S.me = r;
    try {
      localStorage.setItem("cs_me", JSON.stringify(r));
    } catch (x) {}
    await refresh();
    S.view = "discover";
    render();
  } catch (x) {
    toast(x.message, 1);
  }
}
document.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const f = ev.target,
    d = Object.fromEntries(new FormData(f)),
    k = f.dataset.f,
    u = S.me?.id;
  if (k == "login") return login(d);
  if (k == "signup") {
    try {
      const r = await api("POST", "/users", d);
      return login({ email: d.email, password: d.password });
    } catch (x) {
      return toast(x.message, 1);
    }
  }
  const g = $(".ov")?.dataset.g;
  if (k == "post")
    return call(async () => {
      await api("POST", "/gigs", d, u);
      S.view = "discover";
    }, "Listing published");
  if (k == "apply")
    return call(
      () =>
        api(
          "POST",
          "/applications",
          { gig_id: +f.dataset.id, message: d.message },
          u,
        ),
      "Application sent",
    ).then(() => g && detail(g));
  if (k == "review")
    return call(
      () => api("POST", "/reviews", { gig_id: +f.dataset.id, ...d }, u),
      "Review submitted",
    ).then(() => g && detail(g));
});
(async () => {
  try {
    await refresh();
    render();
  } catch (x) {
    $("#app").innerHTML =
      '<div class="auth"><div class="box"><h2>Database not connected</h2><p>' +
      e(x.message) +
      '</p><p class="m">Open a terminal in this folder and run <b>npm start</b>, then refresh.</p></div></div>';
  }
})();
