/* =========================================================================
   Valheim Parry Calculator — logic
   -------------------------------------------------------------------------
   Core mechanic (per community research, see data.js header for sources):

   1. Effective block power =
        lerp(blockMin, blockMax, (quality-1)/3)      // item upgrade level 1-4
        * (1 + blockSkill * 0.005)                   // +0.5%/level, +50% at lvl 100
        * (isParry ? parryBonus : 1)                 // parry window hit, if item can parry

   2. Damage vs a power value (used for both block power AND regular armor)
      follows the same piecewise curve the game uses for armor:
        if power >= damage / 2:  taken = damage^2 / (4 * power)
        else:                    taken = damage - power

   3. A block/parry applies step 2 using effective block power. Whatever
      damage leaks through is then run through step 2 again using the
      player's regular armor rating, since armor still applies on top of
      a block.

   4. Star level (0/1/2) scales an attack's base damage by x1 / x1.5 / x2.
   ========================================================================= */

const els = {
  shield: document.getElementById("shieldSelect"),
  shieldInfo: document.getElementById("shieldInfo"),
  quality: document.getElementById("quality"),
  qualityOut: document.getElementById("qualityOut"),
  skill: document.getElementById("skill"),
  skillOut: document.getElementById("skillOut"),
  customWrap: document.getElementById("customWrap"),
  customPower: document.getElementById("customPower"),
  customParry: document.getElementById("customParry"),
  parryToggle: document.getElementById("parryToggle"),
  parryNote: document.getElementById("parryNote"),
  armor: document.getElementById("armor"),

  biome: document.getElementById("biomeSelect"),
  enemy: document.getElementById("enemySelect"),
  attack: document.getElementById("attackSelect"),
  star: document.getElementById("starSelect"),
  bossNote: document.getElementById("bossNote"),
  customDamage: document.getElementById("customDamage"),

  buffer: document.getElementById("buffer"),

  rawDamage: document.getElementById("rawDamage"),
  effPower: document.getElementById("effPower"),
  leaked: document.getElementById("leaked"),
  finalDamage: document.getElementById("finalDamage"),
  verdict: document.getElementById("verdict"),
  neededHP: document.getElementById("neededHP"),

  targetHP: document.getElementById("targetHP"),
  foodSlot1: document.getElementById("foodSlot1"),
  foodSlot2: document.getElementById("foodSlot2"),
  foodSlot3: document.getElementById("foodSlot3"),
  foodTotal: document.getElementById("foodTotal"),
  foodVerdict: document.getElementById("foodVerdict"),
  suggestBtn: document.getElementById("suggestBtn"),
  suggestions: document.getElementById("suggestions"),
};

// ---- populate shield dropdown ----
for (const s of SHIELDS) {
  const opt = document.createElement("option");
  opt.value = s.name;
  opt.textContent = `${s.name} (${s.type})`;
  els.shield.appendChild(opt);
}

// ---- populate biome + enemy dropdowns ----
const biomes = [...new Set(ENEMIES.map(e => e.biome))];
for (const b of biomes) {
  const opt = document.createElement("option");
  opt.value = b;
  opt.textContent = b;
  els.biome.appendChild(opt);
}

function populateEnemiesForBiome() {
  const biome = els.biome.value;
  els.enemy.innerHTML = "";
  const list = biome ? ENEMIES.filter(e => e.biome === biome) : ENEMIES;
  for (const e of list) {
    const opt = document.createElement("option");
    opt.value = e.name;
    opt.textContent = e.name;
    els.enemy.appendChild(opt);
  }
  populateAttacksForEnemy();
}

function currentEnemy() {
  return ENEMIES.find(e => e.name === els.enemy.value);
}

function populateAttacksForEnemy() {
  const enemy = currentEnemy();
  els.attack.innerHTML = "";
  if (!enemy) return;
  for (const a of enemy.attacks) {
    const opt = document.createElement("option");
    opt.value = a.label;
    opt.textContent = `${a.label} — ${a.amount} ${a.type}`;
    els.attack.appendChild(opt);
  }
  els.bossNote.style.display = enemy.boss ? "block" : "none";
  els.star.disabled = !!enemy.boss;
  if (enemy.boss) els.star.value = "0";
}

// ---- populate food dropdowns ----
function fillFoodSelect(sel) {
  const none = document.createElement("option");
  none.value = "";
  none.textContent = "— none —";
  sel.appendChild(none);
  for (const f of FOODS) {
    const opt = document.createElement("option");
    opt.value = f.name;
    opt.textContent = `${f.name} (+${f.health} HP, ${f.biome})`;
    sel.appendChild(opt);
  }
}
[els.foodSlot1, els.foodSlot2, els.foodSlot3].forEach(fillFoodSelect);

// ---- shield selection behavior ----
function currentShield() {
  return SHIELDS.find(s => s.name === els.shield.value);
}

function updateShieldInfo() {
  const s = currentShield();
  const isCustom = s.type === "Custom";
  els.customWrap.style.display = isCustom ? "flex" : "none";

  if (isCustom) {
    els.shieldInfo.textContent =
      "Type in the Block Power and Parry Bonus shown on your item's in-game tooltip.";
  } else {
    els.shieldInfo.textContent =
      `Block armor ${s.blockMin}–${s.blockMax} across upgrade levels 1–4. ` +
      (s.parryBonus ? `Parry bonus x${s.parryBonus}.` : `Cannot parry (tower shield) — it only blocks.`);
  }

  const canParry = isCustom ? true : !!s.parryBonus;
  els.parryToggle.disabled = !canParry;
  if (!canParry) {
    els.parryToggle.checked = false;
    els.parryNote.textContent = "This shield can't parry — it will always be treated as a normal block.";
  } else {
    els.parryNote.textContent = "A parry is a block raised in roughly the last 0.25s before the hit lands.";
  }
  recalc();
}

function effectiveBlockPower() {
  const s = currentShield();
  const isParry = els.parryToggle.checked && !els.parryToggle.disabled;
  let base, parryBonus;

  if (s.type === "Custom") {
    base = Number(els.customPower.value) || 0;
    parryBonus = Number(els.customParry.value) || 1;
  } else {
    const q = Number(els.quality.value); // 1-4
    base = s.blockMin + (s.blockMax - s.blockMin) * ((q - 1) / 3);
    parryBonus = s.parryBonus || 1;
  }

  const skill = Number(els.skill.value);
  const withSkill = base * (1 + skill * 0.005);
  return isParry ? withSkill * parryBonus : withSkill;
}

// The piecewise block/armor damage curve used for both block power and
// regular armor.
function damageAfterPower(damage, power) {
  if (damage <= 0) return 0;
  if (power <= 0) return damage;
  if (power >= damage / 2) {
    return (damage * damage) / (4 * power);
  }
  return Math.max(0, damage - power);
}

function starMultiplier(star) {
  if (star === "1") return 1.5;
  if (star === "2") return 2;
  return 1;
}

function currentRawDamage() {
  const customOverride = els.customDamage.value.trim();
  if (customOverride !== "") {
    return Number(customOverride) || 0;
  }
  const enemy = currentEnemy();
  if (!enemy) return 0;
  const attack = enemy.attacks.find(a => a.label === els.attack.value);
  if (!attack) return 0;
  const mult = enemy.boss ? 1 : starMultiplier(els.star.value);
  return attack.amount * mult;
}

function fmt(n) {
  return Math.round(n * 10) / 10;
}

function recalc() {
  const raw = currentRawDamage();
  const power = effectiveBlockPower();
  const leaked = damageAfterPower(raw, power);
  const armor = Number(els.armor.value) || 0;
  const final = damageAfterPower(leaked, armor);
  const buffer = Number(els.buffer.value) || 0;
  const needed = Math.max(1, Math.ceil(final) + buffer);

  els.rawDamage.textContent = fmt(raw);
  els.effPower.textContent = fmt(power);
  els.leaked.textContent = fmt(leaked);
  els.finalDamage.textContent = fmt(final);
  els.neededHP.textContent = needed;

  if (final <= 0.05) {
    els.verdict.textContent = "Fully absorbed — this hit does effectively no damage through the block.";
    els.verdict.className = "verdict good";
  } else if (final < raw * 0.25) {
    els.verdict.textContent = `Mostly absorbed — about ${fmt(final)} damage still gets through.`;
    els.verdict.className = "verdict ok";
  } else {
    els.verdict.textContent = `Your block is overwhelmed — ${fmt(final)} damage gets through, close to the full hit.`;
    els.verdict.className = "verdict bad";
  }

  els.targetHP.value = needed;
  recalcFood();
}

// ---- food planner ----
function foodByName(name) {
  return FOODS.find(f => f.name === name);
}

function recalcFood() {
  const names = [els.foodSlot1.value, els.foodSlot2.value, els.foodSlot3.value].filter(Boolean);
  const sum = names.reduce((acc, n) => acc + (foodByName(n)?.health || 0), 0);
  const total = BASE_HEALTH + sum;
  els.foodTotal.textContent = total;

  const target = Number(els.targetHP.value) || 0;
  if (total >= target) {
    els.foodVerdict.textContent = `✓ ${total} max HP covers the ${target} HP you need.`;
    els.foodVerdict.className = "verdict good";
  } else {
    els.foodVerdict.textContent = `✗ ${total} max HP is short of the ${target} HP you need (by ${target - total}).`;
    els.foodVerdict.className = "verdict bad";
  }
}

function suggestCombos() {
  const target = Number(els.targetHP.value) || 0;
  const needFromFood = target - BASE_HEALTH;
  els.suggestions.innerHTML = "";

  if (needFromFood <= 0) {
    els.suggestions.innerHTML = "<p>Base 25 HP already covers this — no food required.</p>";
    return;
  }

  // Brute force over combos of 3 foods (repeats allowed - you can eat the
  // same dish in multiple slots), keep ones that meet target with the
  // smallest overshoot.
  const n = FOODS.length;
  let best = [];
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      for (let k = j; k < n; k++) {
        const sum = FOODS[i].health + FOODS[j].health + FOODS[k].health;
        if (sum >= needFromFood) {
          best.push({ combo: [FOODS[i], FOODS[j], FOODS[k]], sum });
        }
      }
    }
  }
  best.sort((a, b) => a.sum - b.sum);
  best = best.slice(0, 6);

  if (best.length === 0) {
    els.suggestions.innerHTML = "<p>No 3-food combo reaches that much health — you'd need a higher-tier food or a bigger buffer margin.</p>";
    return;
  }

  const list = document.createElement("div");
  for (const entry of best) {
    const row = document.createElement("div");
    row.className = "suggestion";
    const names = entry.combo.map(f => f.name).join(" + ");
    row.innerHTML = `<button class="use-btn">Use</button> <span>${names}</span> <span class="muted">= +${entry.sum} HP (total ${BASE_HEALTH + entry.sum})</span>`;
    row.querySelector(".use-btn").addEventListener("click", () => {
      els.foodSlot1.value = entry.combo[0].name;
      els.foodSlot2.value = entry.combo[1].name;
      els.foodSlot3.value = entry.combo[2].name;
      recalcFood();
    });
    list.appendChild(row);
  }
  els.suggestions.appendChild(list);
}

// ---- wire up events ----
els.shield.addEventListener("change", updateShieldInfo);
els.quality.addEventListener("input", () => { els.qualityOut.textContent = els.quality.value; recalc(); });
els.skill.addEventListener("input", () => { els.skillOut.textContent = els.skill.value; recalc(); });
els.customPower.addEventListener("input", recalc);
els.customParry.addEventListener("input", recalc);
els.parryToggle.addEventListener("change", recalc);
els.armor.addEventListener("input", recalc);

els.biome.addEventListener("change", populateEnemiesForBiome);
els.enemy.addEventListener("change", populateAttacksForEnemy);
els.attack.addEventListener("change", recalc);
els.star.addEventListener("change", recalc);
els.customDamage.addEventListener("input", recalc);
els.buffer.addEventListener("input", recalc);

els.targetHP.addEventListener("input", recalcFood);
els.foodSlot1.addEventListener("change", recalcFood);
els.foodSlot2.addEventListener("change", recalcFood);
els.foodSlot3.addEventListener("change", recalcFood);
els.suggestBtn.addEventListener("click", suggestCombos);

// ---- init ----
els.shield.value = "Bronze Buckler";
populateEnemiesForBiome();
updateShieldInfo();
