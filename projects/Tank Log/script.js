// The Tank Log — daily tip rotation
// Picks a tip deterministically from the day of year, so the homepage
// reads as "updated today" without needing a backend. The refresh
// button lets a visitor browse other entries in the notebook.

const TIPS = [
  "Change 10–15% of the water weekly rather than 50% monthly — small, frequent changes keep parameters stable and fish stay calmer.",
  "New tank? Wait for the nitrogen cycle to finish before adding a full stocking list. Ammonia and nitrite should both read zero for at least a week.",
  "Match the flow rate to the fish, not the filter box size — Bettas and other slow swimmers do better with a spray bar or baffle.",
  "Quarantine every new fish for 2–4 weeks in a separate tank. It's the single best thing you can do to stop disease outbreaks.",
  "Test your water, don't guess. A basic freshwater kit covering ammonia, nitrite, nitrate, and pH costs less than one dead fish.",
  "Overfeeding is the most common beginner mistake. Most fish only need what they can eat in 2 minutes, once or twice a day.",
  "Driftwood tannins turning your water tea-colored isn't dirty water — it's just tannic acid, and many fish from blackwater rivers prefer it.",
  "Acclimate new arrivals slowly: float the bag for 15–20 minutes, then add small amounts of tank water over another 20–30 minutes before release.",
  "A bare-bottom quarantine tank is easier to keep clean and lets you spot parasites like ich against the glass early.",
  "Live plants outcompete algae for the same nutrients — a well-planted tank often needs less scrubbing, not more.",
  "Cycle a filter, not a tank. If you swap filters, keep the old media running alongside the new one for a few weeks.",
  "Cherry shrimp are extremely copper-sensitive — check that any medication or tap water conditioner is copper-free before dosing a shrimp tank.",
  "Cooler water holds more dissolved oxygen than warm water — if a heatwave pushes the tank temp up, add extra surface agitation.",
  "Corydoras are shoaling fish and get stressed alone — keep them in groups of six or more for natural, confident behavior.",
  "A gap between the water line and the tank lid isn't wasted space — it's oxygen exchange, and jumpers like danios need a lid regardless.",
  "Rinse new substrate until the runoff is clear before adding it — skipping this step is the #1 cause of a cloudy first fill.",
  "Snails aren't just cleanup crew — a sudden increase in your snail population usually means you're overfeeding.",
  "Direct sunlight on a tank is a fast track to an algae bloom. South- or west-facing windows are the usual culprits.",
  "Betta fins recover from nipping and stress far slower than they tear — patience and stable water matter more than any fin-repair product.",
  "A drop checker only tells you CO2 levels from an hour ago — for planted tanks running CO2, that lag matters when tuning injection rate.",
  "Floating plants like frogbit shade the water column and pull nitrates fast, which is why breeders lean on them for fry tanks.",
  "Copper-based medications will kill your invertebrates. Always read the active ingredient before treating a tank that houses shrimp or snails.",
  "Two male bettas, one tank, ever — even in a divided setup, they can flare themselves into constant stress through the divider.",
  "A python-style gravel vacuum turns water changes from a chore into a five-minute task — worth the up-front cost for anyone with more than one tank.",
  "Ramshorn snails reproduce fastest in tanks with excess uneaten food — trimming feeding is more effective than manual removal.",
  "Fish don't have eyelids, but that doesn't mean they don't sleep — most species have a rest cycle, just without closing their eyes.",
  "A background isn't just decoration — dark backgrounds reduce a fish's stress by cutting down on startling reflections from the room.",
  "Air stones don't meaningfully raise oxygen through the bubbles themselves — it's the surface agitation the bubbles create that does the work.",
  "When rescaping, keep at least some of the old substrate and decor — established beneficial bacteria live there, not just in the filter.",
  "Angelfish are cichlids first, community fish second — they'll eat anything small enough to fit in their mouth, neon tetras included, once grown.",
];

function dayOfYear(date){
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  return Math.floor(diff / 86400000);
}

function renderTip(index){
  const tipText = document.querySelector("[data-tip-text]");
  const tipMeta = document.querySelector("[data-tip-meta]");
  if(!tipText) return;
  const i = ((index % TIPS.length) + TIPS.length) % TIPS.length;
  tipText.textContent = TIPS[i];
  if(tipMeta){
    const today = new Date();
    const dateStr = today.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    tipMeta.textContent = `Entry for ${dateStr} · No. ${i + 1} of ${TIPS.length}`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const todayIndex = dayOfYear(new Date());
  let currentIndex = todayIndex;
  renderTip(currentIndex);

  const btn = document.querySelector("[data-tip-refresh]");
  if(btn){
    btn.addEventListener("click", () => {
      currentIndex += 1;
      renderTip(currentIndex);
    });
  }

  // mark active nav link
  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("nav.primary a").forEach(a => {
    if(a.getAttribute("href") === path) a.classList.add("active");
  });
});