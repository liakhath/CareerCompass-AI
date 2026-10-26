(() => {
  "use strict";
  const API_BASE = window.CAREERCOMPASS_API_BASE || window.location.origin;
  const STORAGE = { profileId: "careercompass.profileId", lastResult: "careercompass.lastResult", lastProfile: "careercompass.lastProfile" };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const state = {
    metadata: null, careers: [], health: null, currentView: "overview",
    latestResult: null, currentProfile: null, profileId: null, activeCareerId: null,
    exploreSearch: "", exploreCategory: "", compareIds: new Set(), compareResult: null
  };

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));
  }
  function readStored() {
    try { state.profileId = Number(localStorage.getItem(STORAGE.profileId)) || null; } catch (_) {}
    try { state.latestResult = JSON.parse(localStorage.getItem(STORAGE.lastResult) || "null"); } catch (_) {}
    try { state.currentProfile = JSON.parse(localStorage.getItem(STORAGE.lastProfile) || "null"); } catch (_) {}
  }
  function store(key, value) {
    try { if (value == null) localStorage.removeItem(key); else localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value)); } catch (_) {}
  }
  async function api(path, options = {}) {
    const headers = { Accept: "application/json", ...(options.headers || {}) };
    if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
    let response;
    try {
      response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    } catch (error) {
      throw new Error("Cannot reach the backend. Start it with: python -m uvicorn app.main:app --reload");
    }
    const type = response.headers.get("content-type") || "";
    const body = type.includes("application/json") ? await response.json() : await response.text();
    if (!response.ok) {
      const detail = body && body.detail;
      const message = Array.isArray(detail) ? detail.map(x => x.msg || JSON.stringify(x)).join("; ") : (typeof detail === "string" ? detail : detail ? JSON.stringify(detail) : `Request failed (${response.status})`);
      throw new Error(message);
    }
    return body;
  }
  function toast(message, kind = "success") {
    let el = $("#ccToast");
    if (!el) { el = document.createElement("div"); el.id = "ccToast"; el.className = "fixed bottom-5 right-5 z-[120] max-w-md rounded-xl shadow-xl p-4 text-sm font-semibold"; el.setAttribute("role", "status"); document.body.appendChild(el); }
    el.style.background = kind === "error" ? "#fff1f2" : "#ecfdf5";
    el.style.color = kind === "error" ? "#9f1239" : "#065f46";
    el.style.border = `1px solid ${kind === "error" ? "#fecdd3" : "#a7f3d0"}`;
    el.textContent = message;
    el.style.opacity = "1";
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(() => { el.style.opacity = "0"; }, 3600);
  }
  function setApiStatus(ok, label = "") {
    const status = $("#apiStatusLabel");
    const dot = $("#apiStatusDot");
    if (status) status.textContent = ok ? "FastAPI: Connected" : "FastAPI: Offline";
    if (dot) { dot.className = `w-2 h-2 rounded-full ${ok ? "bg-emerald-500" : "bg-rose-500"}`; }
    const sync = $("#syncStatusText");
    if (sync) sync.textContent = ok ? "Sync: Connected" : "Sync: Offline";
    const footer = $$('aside span').find(el => /v1\.0 API Active/.test(el.textContent));
    if (footer) footer.textContent = ok ? "v1.0 API Connected" : "API Not Connected";
    if (label) console.info("CareerCompass API:", label);
  }
  function refreshReveal() {
    if (typeof window.initScrollReveal === "function") {
      try { window.initScrollReveal(); } catch (_) {}
    } else {
      $$("#appViews .reveal-section, #appViews .reveal-card").forEach(el => el.classList.add("reveal-visible"));
    }
  }
  function navRoute(route) {
    const canonical = route === "career-detail" ? "explore-careers" : route;
    $$("aside nav a[data-path]").forEach(a => {
      const active = a.dataset.path === canonical;
      a.classList.toggle("is-active", active);
      if (active) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
  }
  function navigate(route) {
    state.currentView = route;
    navRoute(route);
    const overview = $("#overviewView");
    const views = $("#appViews");
    if (route === "overview") {
      overview.style.display = "";
      views.style.display = "none";
      window.scrollTo(0, 0);
      return;
    }
    overview.style.display = "none";
    views.style.display = "block";
    window.scrollTo(0, 0);
    const renderers = {
      "career-assessment": renderAssessment,
      "my-recommendations": renderRecommendations,
      "explore-careers": renderExplore,
      "compare-careers": renderCompare,
      "my-profile-and-history": renderProfileHistory,
      "career-detail": renderCareerDetail
    };
    const renderer = renderers[route];
    if (renderer) renderer();
    else renderUnknown(route);
  }
  function pageHead(kicker, title, description, actions = "") {
    return `<div class="app-page max-w-[1380px] mx-auto"><div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-7 reveal-section"><div><p class="text-xs font-bold tracking-[.16em] uppercase text-primary mb-2">${esc(kicker)}</p><h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface">${esc(title)}</h1><p class="app-muted mt-2 max-w-3xl leading-relaxed">${esc(description)}</p></div><div class="flex flex-wrap gap-2">${actions}</div></div>`;
  }
  function button(label, action, kind = "primary", extra = "") {
    const styles = kind === "primary" ? "app-button app-button-primary" : kind === "quiet" ? "app-button app-button-quiet" : "app-button app-button-secondary";
    return `<button type="button" class="${styles}" data-action="${esc(action)}" ${extra}>${label}</button>`;
  }
  function tags(values) { return (values || []).map(v => `<span class="app-tag">${esc(v)}</span>`).join("") || '<span class="app-muted text-sm">No items listed</span>'; }
  function emptyState(title, message, actionLabel = "Start assessment", action = "career-assessment") {
    return `<div class="app-empty reveal-section"><span class="material-symbols-outlined text-primary text-4xl">explore</span><h2 class="text-xl font-bold mt-3">${esc(title)}</h2><p class="app-muted max-w-lg mx-auto mt-2">${esc(message)}</p><div class="mt-5">${button(esc(actionLabel), action, "primary")}</div></div>`;
  }
  function careerCard(career, options = {}) {
    const score = Number.isFinite(Number(career.match_score)) ? Number(career.match_score) : null;
    const scoreBlock = score === null ? `<span class="app-tag">${esc(career.category)}</span>` : `<div class="flex items-center justify-between gap-3"><span class="text-xs font-bold uppercase tracking-wider text-primary">${esc(career.match_label || "Profile match")}</span><strong class="text-lg text-primary">${score.toFixed(1)}%</strong></div><div class="app-match-track mt-2"><div class="app-match-fill" style="width:${Math.max(0, Math.min(100, score))}%"></div></div>`;
    const skills = career.matched_skills && career.matched_skills.length ? career.matched_skills : (career.skills || []).slice(0, 4);
    return `<article class="app-career-card reveal-card"><div class="flex items-start justify-between gap-3"><div><p class="text-xs uppercase tracking-wider font-bold text-primary">${esc(career.category)}</p><h3 class="text-lg font-bold mt-1">${esc(career.title)}</h3></div><span class="material-symbols-outlined text-primary text-2xl">${score === null ? "work_outline" : "auto_awesome"}</span></div><p class="app-muted text-sm leading-relaxed mt-3">${esc(career.summary)}</p><div class="mt-4">${scoreBlock}</div><div class="mt-3">${tags(skills.slice(0, 4))}</div><div class="flex flex-wrap gap-2 mt-5">${button('View details <span class="material-symbols-outlined text-base">arrow_forward</span>', 'view-career', 'secondary', `data-career-id="${esc(career.career_id)}"`)}${button('Compare', 'add-compare', 'quiet', `data-career-id="${esc(career.career_id)}"`)}</div></article>`;
  }
  function afterRender() { refreshReveal(); }
  function setView(html) { $("#appViews").innerHTML = html; afterRender(); }

  async function loadReferenceData() {
    try {
      const [health, metadata, data] = await Promise.all([
        api("/api/v1/health"), api("/api/v1/metadata"), api("/api/v1/careers")
      ]);
      state.health = health; state.metadata = metadata; state.careers = data.careers || [];
      setApiStatus(health.status === "ok" && health.database === "ok", `${state.careers.length} careers loaded`);
      updateOverviewMetrics();
      renderFeaturedCareers();
    } catch (e) {
      setApiStatus(false, e.message);
      const count = $("#careerCountMetric"); if (count) count.textContent = "—";
      toast(e.message, "error");
    }
  }
  function updateOverviewMetrics() {
    const count = $("#careerCountMetric");
    if (count) { count.textContent = state.careers.length; count.removeAttribute("data-target"); }
    const categories = new Set(state.careers.map(c => c.category));
    const categoryLabel = $("#careerCategoryCount");
    if (categoryLabel) categoryLabel.textContent = `${categories.size} categories`;
    const profiles = $("#profileSignalMetric");
    if (profiles) { profiles.textContent = "5"; profiles.removeAttribute("data-target"); }
    const method = $("#modelMethodMetric"); if (method) method.textContent = "TF-IDF";
  }
  function renderFeaturedCareers() {
    const grid = $("#featuredCareersGrid");
    if (!grid || !state.careers.length) return;
    grid.innerHTML = state.careers.slice(0, 3).map(c => careerCard(c)).join("");
    // Use the current API catalogue rather than the original sample career cards.
    afterRender();
  }
  function renderUnknown(route) {
    setView(pageHead("CareerCompass", "Page unavailable", "That view is not available.") + emptyState("Nothing to show", "Return to the overview and choose a supported section.", "Go to overview", "overview") + "</div>");
  }

  function selectionGroup(name, title, options, help = "Select all that apply.") {
    const selected = new Set((state.currentProfile && state.currentProfile[name]) || []);
    const choices = (options || []).map((option, i) => {
      const id = `${name}_${i}`;
      return `<label class="choice-chip"><input type="checkbox" id="${id}" name="${name}" value="${esc(option)}" ${selected.has(option) ? "checked" : ""}/><span>${esc(option)}</span></label>`;
    }).join("");
    return `<fieldset class="app-panel"><legend class="text-base font-bold">${esc(title)}</legend><p class="app-muted text-sm mt-1 mb-3">${esc(help)}</p><div class="flex flex-wrap gap-2">${choices}</div></fieldset>`;
  }
  function renderAssessment() {
    if (!state.metadata) {
      setView(pageHead("Assessment", "Build your student profile", "Fetching valid selections from the API…") + '<div class="app-panel">Loading assessment options…</div></div>');
      api("/api/v1/metadata").then(m => { state.metadata = m; renderAssessment(); }).catch(e => setView(pageHead("Assessment", "Backend unavailable", e.message) + emptyState("Cannot load assessment options", "Check that the FastAPI server is running.", "Try again", "career-assessment") + "</div>"));
      return;
    }
    const opts = state.metadata.options;
    const saved = state.currentProfile || {};
    const education = (opts.education_levels || []).map(v => `<option ${saved.education_level === v ? "selected" : ""} value="${esc(v)}">${esc(v)}</option>`).join("");
    const interest = selectionGroup("interests", "1. What interests you?", opts.interests, "Pick topics or activities you genuinely enjoy.");
    const skills = selectionGroup("skills", "2. Skills and strengths", opts.skills, "Select skills you have or would enjoy developing.");
    const subjects = selectionGroup("subjects", "3. Favourite subjects", opts.subjects, "Choose subjects you like studying.");
    const styles = selectionGroup("work_styles", "4. Preferred work style", opts.work_styles, "Think about the type of environment you prefer.");
    const html = pageHead("Career assessment", "Tell us what makes you, you.", "Your answers power the real recommendation model. You can skip any section and revise your profile later.", button('Use sample profile', 'sample-profile', 'secondary')) + `
      <form id="assessmentForm" class="space-y-5">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label class="app-panel block"><span class="font-semibold text-sm">Name <span class="app-muted">(optional)</span></span><input class="app-input mt-2" name="full_name" maxlength="100" placeholder="Your name" value="${esc(saved.full_name || "")}"/></label>
          <label class="app-panel block"><span class="font-semibold text-sm">Current education level</span><select class="app-input mt-2" name="education_level"><option value="">Select your level</option>${education}</select></label>
        </div>
        ${interest}${skills}${subjects}${styles}
        <div class="app-panel"><label class="font-semibold block" for="careerGoals">5. Career goals (optional)</label><p class="app-muted text-sm mt-1">Tell us what you want to build, change, learn, or achieve.</p><textarea id="careerGoals" class="app-input mt-3 min-h-28" name="goals" maxlength="2000" placeholder="For example: I enjoy building apps and using data to solve practical problems.">${esc(saved.goals || "")}</textarea></div>
        <div class="app-panel"><div class="flex items-start gap-3"><span class="material-symbols-outlined text-primary">info</span><div><p class="font-semibold">Academic score is optional</p><p class="app-muted text-sm">Your marks are recorded only for context and are not used to rank careers.</p></div></div><label class="block mt-4 text-sm font-semibold" for="academicScore">Approximate score (%)</label><input id="academicScore" class="w-full mt-2 accent-primary" type="range" name="academic_score" min="0" max="100" value="${esc(saved.academic_score ?? 75)}"/><div class="flex justify-between text-xs app-muted"><span>0%</span><strong id="academicScoreLabel">${esc(saved.academic_score ?? 75)}%</strong><span>100%</span></div></div>
        <div id="assessmentError" class="hidden app-error" role="alert"></div>
        <div class="flex flex-wrap gap-3 justify-end">${button('Back to overview <span class="material-symbols-outlined text-base">arrow_back</span>', 'go-overview', 'secondary')}<button id="assessmentSubmit" class="app-button app-button-primary" type="submit">Generate my recommendations <span class="material-symbols-outlined text-base">auto_awesome</span></button></div>
      </form></div>`;
    setView(html);
  }
  function sampleProfile() {
    return {
      full_name: "Demo Student", education_level: "Undergraduate",
      interests: ["Technology", "Coding", "Data & Patterns", "Problem Solving"],
      skills: ["Programming", "Logical Thinking", "Problem Solving", "Teamwork"],
      subjects: ["Computer Science", "Mathematics"],
      work_styles: ["Independent Deep Work", "Collaborative Teamwork"],
      goals: "I want to build useful applications and explore artificial intelligence.", academic_score: 78
    };
  }
  function collectProfile(form) {
    const getSelected = name => $$(`input[name="${name}"]:checked`, form).map(el => el.value);
    const score = Number(form.elements.academic_score.value);
    return {
      full_name: form.elements.full_name.value.trim() || null,
      education_level: form.elements.education_level.value || null,
      interests: getSelected("interests"), skills: getSelected("skills"), subjects: getSelected("subjects"),
      work_styles: getSelected("work_styles"), goals: form.elements.goals.value.trim() || null,
      academic_score: Number.isFinite(score) ? score : null
    };
  }
  async function runRecommendation(profile, submitButton = null) {
    const signalCount = (profile.interests || []).length + (profile.skills || []).length + (profile.subjects || []).length + (profile.work_styles || []).length + (profile.goals || "").length;
    if (!signalCount) throw new Error("Select at least one interest, skill, subject, work style, or write a career goal.");
    if (submitButton) { submitButton.disabled = true; submitButton.dataset.originalText = submitButton.innerHTML; submitButton.textContent = "Analysing your profile…"; }
    try {
      // Save a profile first so the recommendation is attached to persistent history.
      const saved = await api("/api/v1/profiles", { method: "POST", body: JSON.stringify(profile) });
      state.profileId = saved.profile_id; state.currentProfile = saved.profile;
      store(STORAGE.profileId, String(saved.profile_id)); store(STORAGE.lastProfile, saved.profile);
      const result = await api("/api/v1/recommendations", { method: "POST", body: JSON.stringify({ ...profile, profile_id: saved.profile_id, top_k: 5 }) });
      state.latestResult = result; store(STORAGE.lastResult, result);
      toast("Your recommendations are ready.");
      navigate("my-recommendations");
      return result;
    } finally {
      if (submitButton) { submitButton.disabled = false; submitButton.innerHTML = submitButton.dataset.originalText || "Generate my recommendations"; }
    }
  }
  async function handleAssessmentSubmit(form) {
    const errorBox = $("#assessmentError", form);
    errorBox.classList.add("hidden"); errorBox.textContent = "";
    const profile = collectProfile(form);
    const submit = $("#assessmentSubmit", form);
    try { await runRecommendation(profile, submit); }
    catch (e) { errorBox.textContent = e.message; errorBox.classList.remove("hidden"); toast(e.message, "error"); }
  }
  function renderRecommendations() {
    let result = state.latestResult;
    if (!result || !Array.isArray(result.recommendations)) {
      const html = pageHead("Your results", "Your career matches", "Complete the assessment to see recommendations generated by the live AI model.") + emptyState("No recommendations yet", "Tell us about your interests and skills. The backend will compare your profile with its career catalogue and explain each match.", "Start career assessment", "career-assessment") + "</div>";
      setView(html); return;
    }
    const recommendations = result.recommendations;
    const cards = recommendations.map((r, i) => `<div class="relative">${i === 0 ? '<div class="absolute -top-2 left-4 z-10 bg-primary text-white rounded-full px-3 py-1 text-xs font-bold shadow">TOP MATCH</div>' : ''}${careerCard(r)}</div>`).join("");
    const html = pageHead("Your results", "Your career matches", "These ranked suggestions come from your submitted profile and the current career catalogue. Match scores are relative similarity indicators, not probabilities of career success.", button('Retake assessment', 'career-assessment', 'secondary') + button('Explore all careers', 'explore-careers', 'primary')) + `<div class="app-info mb-5 reveal-section"><strong>Model:</strong> ${esc(result.model || "TF-IDF + cosine similarity")} &nbsp; <span class="app-muted">Request #${esc(result.request_id)}</span></div><div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">${cards}</div><div class="app-panel mt-6 reveal-section"><h2 class="text-xl font-bold">What to work on next</h2><p class="app-muted mt-1">Every match includes strengths and possible skill gaps. Open a career to review its learning roadmap and resources.</p><div class="mt-4 flex flex-wrap gap-2">${button('Open my saved profile & history', 'my-profile-and-history', 'secondary')}${button('Compare these careers', 'compare-results', 'quiet')}</div></div><p class="app-muted text-xs mt-5">${esc(result.disclaimer || "For exploratory use only.")}</p></div>`;
    setView(html);
  }
  function filteredCareers() {
    const search = (state.exploreSearch || "").trim().toLowerCase();
    return state.careers.filter(c => (!state.exploreCategory || c.category === state.exploreCategory) && (!search || [c.title,c.category,c.summary,...(c.interests||[]),...(c.skills||[]),...(c.subjects||[])].join(" ").toLowerCase().includes(search)));
  }
  function renderExplore() {
    if (!state.careers.length) {
      setView(pageHead("Career directory", "Explore careers", "Search career descriptions, categories, skills, and subjects.") + '<div class="app-panel">Loading careers from the backend…</div></div>');
      api("/api/v1/careers").then(data => { state.careers = data.careers || []; renderExplore(); }).catch(e => setView(pageHead("Career directory", "Explore careers", e.message) + emptyState("Career catalogue unavailable", "Check your backend connection and retry.", "Retry", "explore-careers") + "</div>"));
      return;
    }
    const categories = Array.from(new Set(state.careers.map(c => c.category))).sort();
    const options = ['<option value="">All categories</option>', ...categories.map(c => `<option value="${esc(c)}" ${state.exploreCategory === c ? "selected" : ""}>${esc(c)}</option>`) ].join("");
    setView(pageHead("Career directory", "Explore career paths", `${state.careers.length} career profiles from the live backend catalogue. Search by role, skill, subject, or category.`) + `<div class="app-panel mb-6 reveal-section"><div class="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-3"><label><span class="font-semibold text-sm">Search the catalogue</span><input id="exploreSearch" class="app-input mt-2" placeholder="Try data, design, networking…" value="${esc(state.exploreSearch)}"/></label><label><span class="font-semibold text-sm">Category</span><select id="exploreCategory" class="app-input mt-2">${options}</select></label></div><p id="exploreCount" class="app-muted text-sm mt-3"></p></div><div id="exploreCareerGrid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"></div></div>`);
    updateExploreResults();
  }
  function updateExploreResults() {
    const grid = $("#exploreCareerGrid"); if (!grid) return;
    const filtered = filteredCareers();
    const count = $("#exploreCount"); if (count) count.textContent = `Showing ${filtered.length} of ${state.careers.length} careers`;
    grid.innerHTML = filtered.length ? filtered.map(c => careerCard(c)).join("") : `<div class="app-empty md:col-span-2 xl:col-span-3"><h3 class="font-bold text-lg">No careers found</h3><p class="app-muted mt-2">Try another search term or clear the category filter.</p><button class="app-button app-button-secondary mt-4" data-action="clear-explore">Clear filters</button></div>`;
    afterRender();
  }
  async function renderCareerDetail() {
    const careerId = state.activeCareerId;
    if (!careerId) { navigate("explore-careers"); return; }
    setView(pageHead("Career detail", "Loading career profile…", "Fetching full details from the backend.") + '<div class="app-panel">Loading…</div></div>');
    try {
      const c = await api(`/api/v1/careers/${encodeURIComponent(careerId)}`);
      const roadmap = c.roadmap || {};
      const tasks = (c.responsibilities || []).map(x => `<li class="flex gap-2 mb-2"><span class="material-symbols-outlined text-secondary">check_circle</span><span>${esc(x)}</span></li>`).join("");
      const resourceList = (c.resources || []).map(item => {
        const match = item.match(/https?:\/\/\S+/); const url = match ? match[0] : ""; const label = url ? item.replace(url, "").replace(/[—-]\s*$/, "").trim() || url : item;
        return `<li class="mb-2">${url ? `<a class="text-primary underline underline-offset-2" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>` : esc(label)}</li>`;
      }).join("");
      setView(pageHead(c.category, c.title, c.summary, button('Back to catalogue', 'explore-careers', 'secondary') + button('Add to comparison', 'add-compare', 'primary', `data-career-id="${esc(c.career_id)}"`)) + `<div class="grid grid-cols-1 xl:grid-cols-3 gap-5"><div class="xl:col-span-2 space-y-5"><section class="app-panel reveal-section"><h2 class="text-xl font-bold">What this role involves</h2><ul class="mt-4">${tasks}</ul></section><section class="app-panel reveal-section"><h2 class="text-xl font-bold">Learning roadmap</h2><p class="app-muted mt-1">A suggested way to build skills—not a promise of employment.</p><div class="app-roadmap-line mt-6 space-y-6">${[['30 days',roadmap['30_days']],['60 days',roadmap['60_days']],['90 days',roadmap['90_days']]].map(([label,body]) => `<div><div class="app-roadmap-dot"></div><p class="font-bold">${esc(label)}</p><p class="app-muted mt-1 leading-relaxed">${esc(body || "Add a practical learning milestone for this period.")}</p></div>`).join("")}</div></section><section class="app-panel reveal-section"><h2 class="text-xl font-bold">Recommended learning resources</h2><ul class="list-disc pl-5 mt-3">${resourceList}</ul></section></div><aside class="space-y-5"><section class="app-panel reveal-section"><h2 class="text-lg font-bold">Core interests</h2><div class="mt-2">${tags(c.interests)}</div><h2 class="text-lg font-bold mt-5">Relevant skills</h2><div class="mt-2">${tags(c.skills)}</div><h2 class="text-lg font-bold mt-5">Helpful subjects</h2><div class="mt-2">${tags(c.subjects)}</div></section><section class="app-panel reveal-section"><h2 class="text-lg font-bold">Education path</h2><p class="app-muted mt-2 leading-relaxed">${esc(c.education_path)}</p><h2 class="text-lg font-bold mt-5">Skills to develop</h2><div class="mt-2">${tags(c.skill_gaps)}</div></section></aside></div></div>`);
    } catch (e) {
      setView(pageHead("Career detail", "Career not available", e.message) + emptyState("Unable to load this career", "It may have been removed from the current catalogue.", "Back to careers", "explore-careers") + "</div>");
    }
  }
  function renderCompare() {
    if (!state.careers.length) {
      setView(pageHead("Career comparison", "Compare career paths", "Choose two to four careers and compare their skills and responsibilities.") + '<div class="app-panel">Loading career catalogue…</div></div>');
      api("/api/v1/careers").then(d => { state.careers = d.careers || []; renderCompare(); }).catch(e => setView(pageHead("Career comparison", "Unable to load", e.message) + "</div>"));
      return;
    }
    const chosen = state.careers.filter(c => state.compareIds.has(c.career_id));
    const items = state.careers.map(c => `<label class="flex items-start gap-3 border border-outline-variant/40 rounded-lg p-3 hover:border-primary/50 cursor-pointer"><input type="checkbox" class="mt-1 accent-primary" data-compare-check="${esc(c.career_id)}" ${state.compareIds.has(c.career_id) ? "checked" : ""}/><span class="flex-1"><strong>${esc(c.title)}</strong><span class="block text-sm app-muted mt-1">${esc(c.category)}</span></span></label>`).join("");
    let resultHtml = "";
    if (state.compareResult) {
      const r = state.compareResult;
      resultHtml = `<section class="app-panel mt-6 reveal-section"><h2 class="text-xl font-bold">Comparison results</h2><p class="app-muted mt-1">${esc(r.note)}</p><div class="mt-4"><h3 class="font-bold">Shared skills</h3><div class="mt-2">${tags(r.shared_skills)}</div></div><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mt-5">${r.careers.map(c => `<div class="app-surface"><h3 class="font-bold">${esc(c.title)}</h3><p class="text-xs app-muted mt-1">Distinct skills</p><div class="mt-2">${tags(r.distinct_skills[c.career_id] || [])}</div><p class="text-sm app-muted mt-3">${esc(c.summary)}</p></div>`).join("")}</div></section>`;
    }
    setView(pageHead("Career comparison", "Compare career paths", "Choose two to four career profiles. The comparison uses the backend's actual catalogue and shared-skill calculation.") + `<div class="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5"><section class="app-panel reveal-section"><div class="flex items-center justify-between"><h2 class="text-lg font-bold">Select careers</h2><span class="app-tag" id="compareCount">${chosen.length}/4 selected</span></div><p class="app-muted text-sm mt-1 mb-4">Choose at least two and no more than four.</p><div class="space-y-2 max-h-[560px] overflow-y-auto pr-1">${items}</div><div id="compareError" class="hidden app-error mt-3"></div><button id="compareSubmit" type="button" class="app-button app-button-primary w-full mt-4" data-action="run-compare" ${chosen.length < 2 || chosen.length > 4 ? "disabled" : ""}>Compare selected careers</button></section><section>${resultHtml || `<div class="app-empty"><span class="material-symbols-outlined text-primary text-4xl">compare_arrows</span><h2 class="text-xl font-bold mt-3">Your comparison will appear here</h2><p class="app-muted mt-2">Select two to four roles, then run the comparison.</p></div>`}</section></div></div>`);
  }
  async function submitCompare() {
    const err = $("#compareError");
    if (state.compareIds.size < 2 || state.compareIds.size > 4) { if(err){err.textContent="Select between two and four distinct careers.";err.classList.remove("hidden");} return; }
    const btn = $("#compareSubmit"); if (btn) {btn.disabled=true;btn.textContent="Comparing…";}
    try {
      state.compareResult = await api("/api/v1/compare", { method:"POST", body:JSON.stringify({career_ids:Array.from(state.compareIds)}) });
      renderCompare();
    } catch(e) { if(err){err.textContent=e.message;err.classList.remove("hidden");} toast(e.message,"error"); if(btn){btn.disabled=false;btn.textContent="Compare selected careers";} }
  }
  async function renderProfileHistory() {
    if (!state.profileId) {
      setView(pageHead("Student workspace", "My profile & history", "Profiles are saved in the local SQLite database when you submit the assessment.") + emptyState("No saved student profile", "Complete an assessment to save a student profile and keep recommendation history.", "Create my profile", "career-assessment") + "</div>");
      return;
    }
    setView(pageHead("Student workspace", "My profile & history", "Your current saved profile and previous recommendation runs.") + '<div class="app-panel">Loading saved profile and history…</div></div>');
    try {
      const [saved, hist] = await Promise.all([api(`/api/v1/profiles/${state.profileId}`), api(`/api/v1/profiles/${state.profileId}/history?limit=20`)]);
      state.currentProfile = saved.profile; store(STORAGE.lastProfile, saved.profile);
      const p = saved.profile;
      const profileHtml = `<section class="app-panel reveal-section"><div class="flex flex-col md:flex-row md:items-start justify-between gap-4"><div><p class="text-xs uppercase tracking-wider font-bold text-primary">Saved profile #${saved.profile_id}</p><h2 class="text-2xl font-bold mt-1">${esc(p.full_name || "Student profile")}</h2><p class="app-muted mt-1">${esc(p.education_level || "Education level not set")} · Created ${esc(String(saved.created_at).replace("T"," ").replace("Z"," UTC"))}</p></div><div class="flex gap-2">${button('Edit profile', 'career-assessment', 'secondary')}${button('Run recommendations again', 'rerun-saved', 'primary')}</div></div><div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">${[["Interests",p.interests],["Skills",p.skills],["Favourite subjects",p.subjects],["Preferred work styles",p.work_styles]].map(([k,v])=>`<div class="app-surface"><h3 class="font-bold">${k}</h3><div class="mt-2">${tags(v)}</div></div>`).join("")}</div>${p.goals ? `<div class="mt-4"><h3 class="font-bold">Career goals</h3><p class="app-muted mt-1">${esc(p.goals)}</p></div>` : ""}<div class="mt-5 border-t border-outline-variant/30 pt-4 flex flex-wrap items-center justify-between gap-3"><p class="app-muted text-sm">Stored locally in SQLite for this demo.</p>${button('Delete saved profile', 'delete-profile', 'secondary')}</div></section>`;
      const historyHtml = hist.history.length ? `<section class="app-panel mt-5 reveal-section"><h2 class="text-xl font-bold">Recommendation history</h2><div class="mt-4 space-y-3">${hist.history.map(run => `<div class="border border-outline-variant/30 rounded-lg p-4"><div class="flex flex-col md:flex-row md:items-center justify-between gap-2"><div><p class="font-bold">Run #${run.request_id}</p><p class="app-muted text-xs mt-1">${esc(String(run.created_at).replace("T"," ").replace("Z"," UTC"))}</p></div>${button('Run again', 'rerun-saved', 'quiet', `data-request-id="${run.request_id}"`)}</div><div class="flex flex-wrap gap-3 mt-3">${run.recommendations.map(rec=>`<span class="app-tag">${esc(rec.title)} · ${Number(rec.match_score).toFixed(1)}%</span>`).join("")}</div></div>`).join("")}</div></section>` : `<section class="app-panel mt-5">No recommendation runs found yet. Generate recommendations to begin building your history.</section>`;
      setView(pageHead("Student workspace", "My profile & history", "Your saved profile and recommendation runs are retrieved from the backend.") + profileHtml + historyHtml + "</div>");
    } catch(e) {
      state.profileId = null; store(STORAGE.profileId, null); store(STORAGE.lastProfile, null);
      setView(pageHead("Student workspace", "Saved profile unavailable", e.message) + emptyState("Your saved profile could not be loaded", "It may have been deleted or the local database reset.", "Create a new profile", "career-assessment") + "</div>");
    }
  }
  async function rerunSaved() {
    if (!state.profileId) { navigate("career-assessment"); return; }
    try {
      const result = await api(`/api/v1/profiles/${state.profileId}/recommendations`, {method:"POST", body:JSON.stringify({top_k:5})});
      state.latestResult = result; store(STORAGE.lastResult,result); toast("Recommendations refreshed from your saved profile."); navigate("my-recommendations");
    } catch(e) { toast(e.message,"error"); }
  }
  async function deleteSaved() {
    if (!state.profileId || !window.confirm("Delete this saved profile? Its linked recommendation history will no longer be associated with the profile.")) return;
    try {
      await api(`/api/v1/profiles/${state.profileId}`, {method:"DELETE"});
      state.profileId = null; state.currentProfile = null; state.latestResult = null;
      store(STORAGE.profileId,null); store(STORAGE.lastProfile,null); store(STORAGE.lastResult,null);
      toast("Saved profile deleted."); renderProfileHistory();
    } catch(e) { toast(e.message,"error"); }
  }
  function addCompare(careerId) {
    if (!careerId) return;
    if (state.compareIds.has(careerId)) state.compareIds.delete(careerId);
    else if (state.compareIds.size >= 4) { toast("Compare up to four careers at a time.","error"); return; }
    else state.compareIds.add(careerId);
    state.compareResult = null;
  }
  function compareResults() {
    const recs = state.latestResult && state.latestResult.recommendations || [];
    if (!state.compareIds.size && recs.length) recs.slice(0, Math.min(4, recs.length)).forEach(r => state.compareIds.add(r.career_id));
    navigate("compare-careers");
  }
  function bindEvents() {
    document.addEventListener("click", async event => {
      const pathLink = event.target.closest("a[data-path]");
      if (pathLink) { event.preventDefault(); navigate(pathLink.dataset.path); return; }
      const actionEl = event.target.closest("[data-action]");
      if (actionEl) {
        const action = actionEl.dataset.action;
        if (action === "go-overview") { navigate("overview"); return; }
        if (["overview", "career-assessment", "my-recommendations", "explore-careers", "compare-careers", "my-profile-and-history"].includes(action)) { navigate(action); return; }
        if (action === "view-career") { state.activeCareerId = actionEl.dataset.careerId; navigate("career-detail"); return; }
        if (action === "add-compare") { addCompare(actionEl.dataset.careerId); toast(state.compareIds.has(actionEl.dataset.careerId) ? "Added to comparison." : "Removed from comparison."); return; }
        if (action === "clear-explore") { state.exploreSearch=""; state.exploreCategory=""; renderExplore(); return; }
        if (action === "sample-profile") { const p=sampleProfile(); state.currentProfile=p; navigate("career-assessment"); setTimeout(()=>{const form=$("#assessmentForm"); if(!form)return; form.elements.full_name.value=p.full_name;form.elements.education_level.value=p.education_level; for(const key of ["interests","skills","subjects","work_styles"]){const wanted=new Set(p[key]); $$(`input[name="${key}"]`,form).forEach(el=>el.checked=wanted.has(el.value));}form.elements.goals.value=p.goals;form.elements.academic_score.value=p.academic_score;$("#academicScoreLabel").textContent=p.academic_score+"%";},30); return; }
        if (action === "compare-results") { compareResults(); return; }
        if (action === "run-compare") { await submitCompare(); return; }
        if (action === "rerun-saved") { await rerunSaved(); return; }
        if (action === "delete-profile") { await deleteSaved(); return; }
      }
      if (event.target.closest("#trySampleProfileButton")) {
        const p = sampleProfile(); state.currentProfile = p;
        try { await runRecommendation(p); } catch(e) { toast(e.message,"error"); }
      }
    });
    document.addEventListener("submit", async event => {
      if (event.target.id === "assessmentForm") { event.preventDefault(); await handleAssessmentSubmit(event.target); }
    });
    document.addEventListener("input", event => {
      if (event.target.id === "academicScore") { const label=$("#academicScoreLabel"); if(label) label.textContent=event.target.value+"%"; }
      if (event.target.id === "exploreSearch") { state.exploreSearch=event.target.value; updateExploreResults(); }
    });
    document.addEventListener("change", event => {
      if (event.target.id === "exploreCategory") { state.exploreCategory=event.target.value; updateExploreResults(); }
      if (event.target.matches("[data-compare-check]")) {
        const id=event.target.dataset.compareCheck;
        if (event.target.checked) {
          if (state.compareIds.size >= 4) { event.target.checked=false; toast("Choose no more than four careers.","error"); return; }
          state.compareIds.add(id);
        } else state.compareIds.delete(id);
        state.compareResult=null;
        const count=$("#compareCount"); if(count) count.textContent=`${state.compareIds.size}/4 selected`;
        const btn=$("#compareSubmit"); if(btn) btn.disabled=state.compareIds.size<2 || state.compareIds.size>4;
      }
    });
    const globalSearch=$("#globalCareerSearch");
    if (globalSearch) globalSearch.addEventListener("keydown", event => {
      if (event.key === "Enter") { event.preventDefault(); state.exploreSearch=globalSearch.value.trim(); navigate("explore-careers"); }
    });
    document.addEventListener("keydown", event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase()==="k") { event.preventDefault(); globalSearch?.focus(); }
    });
  }
  async function init() {
    readStored(); bindEvents();
    // Avoid leaving a hard-coded demo client name in the chrome.
    const userName = $("header .text-right .font-label-md");
    if (userName && state.currentProfile && state.currentProfile.full_name) userName.textContent = state.currentProfile.full_name;
    await loadReferenceData();
    if (state.currentProfile && state.currentProfile.full_name) {
      const heading = $("#overviewView h1"); if (heading) heading.textContent = `Find a career that fits you, ${state.currentProfile.full_name.split(/\s+/)[0]}.`;
    } else {
      const heading = $("#overviewView h1"); if (heading) heading.textContent = "Find a career that fits you.";
    }
    // Existing sidebar routes now switch to real app views. Overview remains the original Stitch screen.
  }
  document.addEventListener("DOMContentLoaded", init, { once: true });
})();
