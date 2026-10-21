/* API layer: talks to JSON Server (db.json) at localhost:3000 */
const LOGO =
  '<svg viewBox="0 0 100 100"><circle cx="31" cy="38" r="9" fill="#6c5ce0"/><path d="M14 68q17-17 34 0z" fill="#6c5ce0"/><circle cx="68" cy="52" r="9" fill="#ff5f8e"/><path d="M51 82q17-17 34 0z" fill="#ff5f8e"/><path d="M42 14A40 40 0 0 1 92 52" stroke="#6c5ce0" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M44 5L26 15l18 11z" fill="#6c5ce0"/><path d="M58 86A40 40 0 0 1 8 48" stroke="#ff5f8e" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M56 75l18 10-18 11z" fill="#ff5f8e"/></svg>';
const CATS = ["Programming", "Design", "Writing", "Tutoring"],
  IC = { Programming: "💻", Design: "🎨", Writing: "✍️", Tutoring: "🎓" },
  PAY = { Paid: "Paid", SkillSwap: "Skill swap", Free: "Free" };
const $ = (s) => document.querySelector(s),
  D = (o) => new Date(Date.now() + o * 864e5).toISOString().slice(0, 10);
const e = (s) =>
  String(s ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

const BASE = "http://localhost:3000";
async function http(m, path, body) {
  let r;
  try {
    r = await fetch(BASE + path, {
      method: m,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (x) {
    throw {
      status: 0,
      message: "Database server is not running. Run: npm start",
    };
  }
  if (!r.ok) throw { status: r.status, message: "Server error " + r.status };
  return r.json();
}
const gs = (g) => ({
  ...g,
  status: g.status == "Open" && g.deadline < D(0) ? "Expired" : g.status,
});
const one = async (path) => {
  try {
    return await http("GET", path);
  } catch (x) {
    if (x.status == 404) return null;
    throw x;
  }
};
async function api(m, url, body, uid) {
  body = body || {};
  const [path, qs] = url.split("?"),
    q = Object.fromEntries(new URLSearchParams(qs || "")),
    p = path.split("/").filter(Boolean),
    X = (s, msg) => {
      throw { status: s, message: msg };
    };
  if (m == "GET" && p[0] == "gigs") {
    const sp = new URLSearchParams();
    ["category", "type", "payment_type", "q"].forEach(
      (k) => q[k] && sp.set(k, q[k]),
    );
    let l = (await http("GET", "/gigs?" + sp)).map(gs);
    if (q.min) l = l.filter((g) => g.budget != null && g.budget >= +q.min);
    if (q.max) l = l.filter((g) => g.budget != null && g.budget <= +q.max);
    if (q.q)
      l = l.filter((g) =>
        (g.title + " " + g.description)
          .toLowerCase()
          .includes(q.q.toLowerCase()),
      );
    return l.sort((a, b) => b.id - a.id);
  }
  if (m == "GET" && p[0] == "users")
    return (await http("GET", "/users")).map(({ password, ...u }) => u);
  if (m == "GET") return http("GET", "/" + p[0]);
  if (m == "POST" && p[0] == "login") {
    const r = await http(
      "GET",
      "/users?email=" +
        encodeURIComponent(body.email.trim().toLowerCase()) +
        "&password=" +
        encodeURIComponent(body.password),
    );
    return r[0] ? { id: r[0].id } : X(401, "Wrong email or password");
  }
  if (m == "POST" && p[0] == "users") {
    const em = (body.email || "").trim().toLowerCase();
    if (!body.name || !/^\S+@\S+\.\S+$/.test(em))
      X(422, "Enter your name and a valid email");
    if ((body.password || "").length < 4)
      X(422, "Password needs 4+ characters");
    if ((await http("GET", "/users?email=" + encodeURIComponent(em))).length)
      X(409, "Email already registered");
    const u = await http("POST", "/users", {
      name: body.name,
      email: em,
      password: body.password,
      major: body.major || "Undeclared",
      semester: +body.semester || 1,
      bio: body.bio || "",
      skills: (body.skills || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
    return { id: u.id };
  }
  if (!uid) X(401, "Please log in");
  if (m == "POST" && p[0] == "gigs") {
    const b = body;
    if ((b.title || "").trim().length < 3) X(422, "Title needs 3+ characters");
    if ((b.description || "").trim().length < 10)
      X(422, "Description needs 10+ characters");
    if (
      !CATS.includes(b.category) ||
      !["Offering", "Requesting"].includes(b.type) ||
      !PAY[b.payment_type]
    )
      X(422, "Pick a type, category and payment");
    if (b.payment_type == "Paid" && !(+b.budget > 0))
      X(422, "Paid gigs need a budget above 0");
    if (!b.deadline || b.deadline < D(0))
      X(422, "Deadline must be today or later");
    return http("POST", "/gigs", {
      user_id: uid,
      title: b.title.trim(),
      description: b.description.trim(),
      type: b.type,
      category: b.category,
      payment_type: b.payment_type,
      budget: b.payment_type == "Paid" ? +b.budget : null,
      deadline: b.deadline,
      status: "Open",
      accepted_applicant_id: null,
      created_at: D(0),
    });
  }
  if (m == "POST" && p[0] == "applications") {
    const g = await one("/gigs/" + body.gig_id);
    if (!g) X(404, "Gig not found");
    if (g.user_id == uid) X(403, "You cannot apply to your own gig");
    if (gs(g).status != "Open") X(409, "This gig is not open for applications");
    if (
      (
        await http(
          "GET",
          "/applications?gig_id=" + g.id + "&applicant_id=" + uid,
        )
      ).length
    )
      X(409, "You already applied to this gig");
    if ((body.message || "").trim().length < 5) X(422, "Add a short message");
    return http("POST", "/applications", {
      gig_id: g.id,
      applicant_id: uid,
      message: body.message.trim(),
      status: "Pending",
      created_at: D(0),
    });
  }
  if (m == "PATCH" && p[0] == "applications") {
    const a = await one("/applications/" + p[1]);
    if (!a) X(404, "Not found");
    const g = await http("GET", "/gigs/" + a.gig_id);
    if (g.user_id != uid) X(403, "Only the gig owner can do this");
    if (a.status != "Pending") X(409, "Already decided");
    if (gs(g).status != "Open") X(409, "Gig is closed to applications");
    if (!["Accepted", "Rejected"].includes(body.status)) X(422, "Bad status");
    const r = await http("PATCH", "/applications/" + a.id, {
      status: body.status,
    });
    if (body.status == "Accepted") {
      await http("PATCH", "/gigs/" + g.id, {
        status: "In Progress",
        accepted_applicant_id: a.applicant_id,
      });
      const rest = await http(
        "GET",
        "/applications?gig_id=" + g.id + "&status=Pending",
      );
      await Promise.all(
        rest.map((o) =>
          http("PATCH", "/applications/" + o.id, { status: "Rejected" }),
        ),
      );
    }
    return r;
  }
  if (m == "PATCH" && p[0] == "gigs") {
    const g = await one("/gigs/" + p[1]);
    if (!g) X(404, "Not found");
    if (g.user_id != uid) X(403, "Only the gig owner can change status");
    const s = body.status,
      cur = gs(g).status;
    if (s == "Completed" && cur != "In Progress")
      X(409, "Only gigs In Progress can be completed");
    else if (s == "Cancelled" && !["Open", "In Progress"].includes(cur))
      X(409, "This gig cannot be cancelled");
    else if (!["Completed", "Cancelled"].includes(s))
      X(422, "Use an application to start work");
    return http("PATCH", "/gigs/" + g.id, { status: s });
  }
  if (m == "POST" && p[0] == "reviews") {
    const g = await one("/gigs/" + body.gig_id);
    if (!g) X(404, "Gig not found");
    if (g.status != "Completed") X(409, "Reviews open after completion");
    if (![g.user_id, g.accepted_applicant_id].includes(uid))
      X(403, "Only the owner and accepted applicant can review");
    if (
      (await http("GET", "/reviews?gig_id=" + g.id + "&reviewer_id=" + uid))
        .length
    )
      X(409, "You already reviewed this gig");
    const rt = +body.rating;
    if (!(rt >= 1 && rt <= 5)) X(422, "Rating must be 1 to 5");
    return http("POST", "/reviews", {
      gig_id: g.id,
      reviewer_id: uid,
      reviewee_id: uid == g.user_id ? g.accepted_applicant_id : g.user_id,
      rating: rt,
      comment: (body.comment || "").trim(),
    });
  }
  X(404, "Unknown endpoint");
}
