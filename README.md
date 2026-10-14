# Valheim Parry Calculator

A small browser-based calculator for working out whether your shield/weapon
and health pool are enough to parry a given enemy attack in Valheim, and
which foods would get you there.

## Usage

No build step or server required — just open `index.html` in a browser.

1. **Your blocking item** — pick a shield or weapon, its upgrade quality
   (1–4), your Blocking skill level, and whether the block is timed as a
   parry (raised in roughly the last 0.25s before the hit lands). Tower
   shields can't parry, so the toggle disables itself when one is selected.
   Pick **Custom** to type in the Block Power / Parry Bonus shown on your
   own item's in-game tooltip instead of relying on the built-in table.
2. **The enemy attack** — filter by biome, pick an enemy and one of its
   attacks, and a star level (0/1/2★). You can also type a raw damage
   number directly to bypass the enemy list entirely.
3. **Result** — shows the raw hit, your effective block power, how much
   damage leaks through the block, how much is left after your regular
   armor, and the HP you'd need to survive it (with an adjustable safety
   buffer).
4. **Food planner** — shows your max HP (base 25 + up to 3 active foods)
   against the HP target from step 3, and can suggest the lightest 3-food
   combo that reaches it.

## How the numbers are calculated

Block and armor both reduce damage using the same piecewise curve:

```
if power >= damage / 2:
    damage_taken = damage² / (4 × power)
else:
    damage_taken = damage − power
```

- **Effective block power** = `lerp(blockMin, blockMax, (quality−1)/3)` × `(1 + blockSkill × 0.005)` × `(parryBonus if parrying, else 1)`.
- Whatever damage leaks past the block is run through the same curve again
  using your regular armor rating, since armor still applies on top of a
  block.
- Star level scales an attack's base damage by ×1 / ×1.5 / ×2 for 0/1/2★.
  Bosses don't have star variants and generally can't be staggered by a
  parry, but the damage math still applies the same way.

## Files

| File | Purpose |
|---|---|
| `index.html` | Page structure |
| `styles.css` | Styling (theme-friendly dark UI) |
| `data.js` | Shield, enemy, and food datasets |
| `app.js` | Calculation logic and UI wiring |

## Data sources & accuracy

Shield, enemy attack, and food values were pulled from community wikis
(Valheim Wiki / Fextralife), not extracted from game files, so treat them as
best-effort rather than ground truth:

- Star-level scaling is approximated uniformly as ×1.5 / ×2 — matches most
  observed cases but may be slightly off for a few enemies.
- Non-shield weapon block values are thinner/less consistent across
  sources than shield data.

If a number looks off, the **Custom** blocking-item option and the **raw
damage override** field let you plug in exact values read straight from
your own in-game tooltips.
