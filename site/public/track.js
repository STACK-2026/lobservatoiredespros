// STACK-2026 conversion tracker. Drop-in script: emits events to /api/track.
// No PII captured: only event type, target string, page path, session UUID.
// Auto-instruments:
//   - tel: links              -> phone_click
//   - [data-cta]              -> cta_click   (target = data-cta value)
//   - [data-form-id]          -> form_view (on first visibility),
//                                form_focus (first focusin),
//                                form_submit, form_abandon (unload w/o submit)
//   - <a href^="/go/">        -> affiliate_click
(function () {
  if (window.__stackTrackerInit) return;
  window.__stackTrackerInit = true;

  var SID_KEY = "stack_sid";
  var SID_TTL_DAYS = 30;
  function uuid() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, function (c) {
      return (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16);
    });
  }
  function sid() {
    try {
      var raw = localStorage.getItem(SID_KEY);
      if (raw) {
        var p = JSON.parse(raw);
        if (p && p.id && p.exp > Date.now()) return p.id;
      }
      var id = uuid();
      localStorage.setItem(SID_KEY, JSON.stringify({ id: id, exp: Date.now() + SID_TTL_DAYS * 86400000 }));
      return id;
    } catch (e) {
      return "ephemeral-" + Date.now();
    }
  }
  var SID = sid();
  var PAGE = location.pathname + location.search;

  function send(type, target) {
    var payload = JSON.stringify({ type: type, target: target || null, page: PAGE, sid: SID });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/event", new Blob([payload], { type: "application/json" }));
      } else {
        fetch("/api/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        });
      }
    } catch (e) {
      /* swallow */
    }
  }

  // 1. Phone clicks
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href^="tel:"]');
    if (a) send("phone_click", a.getAttribute("href"));
  });

  // 2. CTA clicks
  document.addEventListener("click", function (ev) {
    var el = ev.target.closest && ev.target.closest("[data-cta]");
    if (el) send("cta_click", el.getAttribute("data-cta"));
  });

  // 3. Affiliate outbound (/go/*)
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href^="/go/"]');
    if (a) send("affiliate_click", a.getAttribute("href"));
  });

  // 4. Form lifecycle. Each form must have data-form-id="<unique-name>".
  var formsSeen = new Set();
  var formsFocused = new Set();
  var formsSubmitted = new Set();

  function instrumentForm(form) {
    var fid = form.getAttribute("data-form-id");
    if (!fid) return;

    // First visibility -> form_view
    if (!formsSeen.has(fid) && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && !formsSeen.has(fid)) {
            formsSeen.add(fid);
            send("form_view", fid);
            io.disconnect();
          }
        });
      }, { threshold: 0.3 });
      io.observe(form);
    }

    form.addEventListener("focusin", function () {
      if (!formsFocused.has(fid)) {
        formsFocused.add(fid);
        send("form_focus", fid);
      }
    });

    form.addEventListener("submit", function () {
      formsSubmitted.add(fid);
      send("form_submit", fid);
    });
  }

  function scanForms() {
    document.querySelectorAll("form[data-form-id]").forEach(instrumentForm);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scanForms);
  } else {
    scanForms();
  }
  // Mutation observer for dynamically added forms (Astro islands etc).
  if ("MutationObserver" in window) {
    new MutationObserver(scanForms).observe(document.documentElement, { childList: true, subtree: true });
  }

  // Abandon = visibility loss after focus, before submit
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState !== "hidden") return;
    formsFocused.forEach(function (fid) {
      if (!formsSubmitted.has(fid)) send("form_abandon", fid);
    });
    formsFocused.clear();
  });
})();
