/* ===== hero intro animation + scroll reveals ===== */
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const heroWrap = document.getElementById("heroImgWrap");

if (heroWrap && !prefersReduced){
  document.body.classList.add("intro-playing");   // hides heading + CTA
  heroWrap.classList.add("intro");                // raised + invisible start state

  // once the start state is painted, release everything at once: the mug fades
  // in while it settles into its final place (no later slide). rAF triggers it
  // on the first paint; the timeout is a fallback if rAF is throttled at load.
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    heroWrap.classList.remove("intro");
    document.body.classList.remove("intro-playing");
  };
  requestAnimationFrame(() => requestAnimationFrame(release));
  setTimeout(release, 120);
}

/* every CTA smooth-scrolls to the channel-link form */
const sendSection = document.getElementById("sendSection");
const channelInput = document.getElementById("channelInput");
function scrollToForm(){
  sendSection.scrollIntoView({ behavior: "smooth", block: "start" });
  if (channelInput) setTimeout(() => channelInput.focus({ preventScroll: true }), 550);
}
document.querySelectorAll(".js-cta").forEach(el => {
  el.addEventListener("click", e => { e.preventDefault(); scrollToForm(); });
});

/* content fades in as it scrolls into view */
const srEls = document.querySelectorAll(".sr");
if (!prefersReduced && "IntersectionObserver" in window){
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  srEls.forEach(el => io.observe(el));
} else {
  srEls.forEach(el => el.classList.add("in"));
}

/* ===== channel-link form: send the submitted @ to abcreatormerch@gmail.com ===== */
const MERCH_EMAIL = "abcreatormerch@gmail.com";
const channelFormEl = document.getElementById("channelFormEl");
const channelSubmit = document.getElementById("channelSubmit");
const channelStatus = document.getElementById("channelStatus");

function setStatus(msg, kind){
  channelStatus.textContent = msg;
  channelStatus.className = "cf-status" + (kind ? " is-" + kind : "");
}
function openMailFallback(channel){
  const su = "Free design request" + (channel ? " — " + channel : "");
  const body = "Hi AB Creator Merch,\n\nI'd like a free design for my channel:\n" + channel + "\n\nThanks!";
  const gmail = "https://mail.google.com/mail/?view=cm&fs=1&to=" + encodeURIComponent(MERCH_EMAIL) +
                "&su=" + encodeURIComponent(su) + "&body=" + encodeURIComponent(body);
  const win = window.open(gmail, "_blank", "noopener");
  if (!win) window.location.href = "mailto:" + MERCH_EMAIL +
    "?subject=" + encodeURIComponent(su) + "&body=" + encodeURIComponent(body);
}

if (channelFormEl){
  channelFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    const channel = channelInput.value.trim();
    if (!channel){
      setStatus("Please enter your channel link or @handle first.", "err");
      channelInput.focus();
      return;
    }
    channelSubmit.disabled = true;
    setStatus("Sending…", "");
    try {
      const res = await fetch("https://formsubmit.co/ajax/" + MERCH_EMAIL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          channel: channel,
          _subject: "New free design request: " + channel,
          _template: "table",
          message: "Channel link / @handle submitted from the AB Creator Merch site: " + channel
        })
      });
      if (!res.ok) throw new Error("bad status " + res.status);
      await res.json().catch(() => ({}));
      setStatus("✓ Sent! We'll reach out on your channel soon.", "ok");
      channelFormEl.reset();
    } catch (err) {
      setStatus("Opening your email so you can send it directly…", "");
      openMailFallback(channel);
    } finally {
      channelSubmit.disabled = false;
    }
  });
}

/* ===== sync the 3 design tiles with the first 3 images in column E of the sheet ===== */
const SHEET_ID = "1cueUnlwC3t7wtnW-LLcy8zhPRxu36pDh6gBA1kfft1o";
const DESIGN_COL = 4;   // column E ("design images")
const designTiles = document.querySelectorAll(".design-tile");
let lastDesignsSig = "";

function applyDesigns(urls){
  designTiles.forEach((tile, i) => {
    if (urls[i]) tile.style.backgroundImage = 'url("' + urls[i] + '")';
  });
}
function fetchSheet(){
  const cb = "__sheet_" + Math.random().toString(36).slice(2);
  const s = document.createElement("script");
  window[cb] = function(resp){
    try {
      const rows = (resp.table && resp.table.rows) || [];
      const imgs = rows
        .map(r => r.c && r.c[DESIGN_COL] && r.c[DESIGN_COL].v)
        .filter(v => v != null && String(v).trim() !== "")
        .map(String)
        .slice(0, 3);
      const sig = JSON.stringify(imgs);
      if (sig !== lastDesignsSig){ lastDesignsSig = sig; applyDesigns(imgs); }
    } catch (e) {}
    delete window[cb]; s.remove();
  };
  s.onerror = () => { delete window[cb]; s.remove(); };
  s.src = "https://docs.google.com/spreadsheets/d/" + SHEET_ID +
          "/gviz/tq?tqx=out:json;responseHandler:" + cb + "&headers=1&gid=0&_=" + Date.now();
  document.body.appendChild(s);
}
fetchSheet();
setInterval(() => { if (!document.hidden) fetchSheet(); }, 20000);
