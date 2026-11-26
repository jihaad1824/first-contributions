// Builds the page from brief.json.
// Step 1: load the brief. Step 2: check it. Step 3: fill the page.
// If anything goes wrong, the page shows a clear message instead of a blank screen.

(function () {
  "use strict";

  function $(id) {
    return document.getElementById(id);
  }

  // Put text into an element safely (never as raw HTML, so content cannot inject code).
  function setText(id, value) {
    var el = $(id);
    if (el) el.textContent = value || "";
  }

  // Check the brief has the parts the page needs. Returns a list of problems.
  function validate(brief) {
    var problems = [];
    if (!brief || typeof brief !== "object") return ["brief is empty or not an object"];
    if (!brief.siteName) problems.push("siteName is missing");
    if (!brief.hero || !brief.hero.headline) problems.push("hero.headline is missing");
    if (!Array.isArray(brief.features) || brief.features.length === 0) {
      problems.push("features must be a non-empty list");
    } else if (brief.features.some(function (f) { return !f || typeof f !== "object"; })) {
      problems.push("every item in features must be an object with title and text");
    }
    if (!brief.cta || !brief.cta.label) problems.push("cta.label is missing");
    return problems;
  }

  // Allow only safe link targets: web addresses (http/https), page anchors (#...)
  // and relative paths. Anything else (for example "javascript:...") becomes "#".
  function safeHref(value) {
    if (typeof value !== "string") return "#";
    var v = value.trim();
    return /^(https?:\/\/|[^:]*$)/i.test(v) && v !== "" ? v : "#";
  }

  // Apply colours from the brief to CSS variables.
  function applyTheme(theme) {
    if (!theme) return;
    var root = document.documentElement.style;
    Object.keys(theme).forEach(function (key) {
      root.setProperty("--" + key, theme[key]);
    });
  }

  function renderFeatures(features) {
    var box = $("features");
    features.forEach(function (f) {
      var card = document.createElement("article");
      card.className = "feature";

      var h = document.createElement("h2");
      h.textContent = f.title || "";

      var p = document.createElement("p");
      p.textContent = f.text || "";

      card.appendChild(h);
      card.appendChild(p);
      box.appendChild(card);
    });
  }

  function renderHeroImage(hero) {
    var figure = $("hero-media");
    if (hero.image) {
      var img = document.createElement("img");
      img.src = hero.image;
      img.alt = hero.imageAlt || "";
      img.loading = "lazy";
      figure.appendChild(img);
    }
    // If there is no image, the coloured box stays as a placeholder.
  }

  function render(brief) {
    document.title = brief.siteName;
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", brief.hero.subheadline || "");

    applyTheme(brief.theme);

    setText("brand", brief.siteName);
    setText("headline", brief.hero.headline);
    setText("subheadline", brief.hero.subheadline);
    renderHeroImage(brief.hero);
    renderFeatures(brief.features);

    ["cta-top", "cta-bottom"].forEach(function (id) {
      setText(id, brief.cta.label);
      var link = $(id);
      if (link) link.setAttribute("href", safeHref(brief.cta.href));
    });
    setText("cta-note", brief.cta.note);
    setText("footer", brief.footer);
  }

  function showError(message) {
    document.title = "Page could not be loaded";
    var main = document.querySelector("main");
    if (main) {
      main.innerHTML = "";
      var p = document.createElement("p");
      p.className = "container";
      p.textContent = "Sorry, this page could not be loaded: " + message;
      main.appendChild(p);
    }
  }

  fetch("brief.json", { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) throw new Error("brief.json returned " + response.status);
      return response.json();
    })
    .then(function (brief) {
      var problems = validate(brief);
      if (problems.length) throw new Error(problems.join("; "));
      render(brief);
    })
    .catch(function (err) {
      console.error(err);
      showError(err.message);
    });
})();
