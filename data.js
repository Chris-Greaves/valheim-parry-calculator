/* =========================================================================
   Valheim Parry Calculator — data
   -------------------------------------------------------------------------
   Sources (community-maintained, Oct 2026):
     - Blocking/parry mechanics & formula: valheim.tools/guides/combat,
       Valheim Wiki "Blocking" page (weirdgloop mirror)
     - Shield stats: Valheim Wiki "Shields" page (weirdgloop mirror)
     - Enemy attack damage: Fextralife Valheim Wiki, creature pages
     - Food stats: Valheim Wiki "Food" page (weirdgloop mirror)

   None of this is pulled from the game files directly, so treat exact
   numbers as "best available community data" rather than ground truth -
   the calculator lets you override anything with values read straight off
   your own item tooltips in-game, which is always the most reliable source.
   ========================================================================= */

// Shields: blockMin/blockMax = Block Armor at quality level 1 / level 4.
// parryBonus = multiplier applied to block power on a successful parry.
// Tower shields cannot parry (parryBonus = null).
const SHIELDS = [
  // --- Round shields (parry bonus x1.5) ---
  { name: "Wood Shield",        type: "Round",   blockMin: 6,   blockMax: 18,  parryBonus: 1.5 },
  { name: "Banded Shield",      type: "Round",   blockMin: 42,  blockMax: 54,  parryBonus: 1.5 },
  { name: "Shield of Roots",    type: "Round",   blockMin: 48,  blockMax: 60,  parryBonus: 1.5 },
  { name: "Silver Shield",      type: "Round",   blockMin: 60,  blockMax: 72,  parryBonus: 1.5 },
  { name: "Black Metal Shield", type: "Round",   blockMin: 78,  blockMax: 90,  parryBonus: 1.5 },
  { name: "Carapace Shield",    type: "Round",   blockMin: 96,  blockMax: 108, parryBonus: 1.5 },
  { name: "Flametal Shield",    type: "Round",   blockMin: 114, blockMax: 126, parryBonus: 1.5 },
  { name: "Nord Shield",        type: "Round",   blockMin: 132, blockMax: 144, parryBonus: 1.5 },

  // --- Bucklers (parry bonus x2.5, best parry multiplier, weakest raw block) ---
  { name: "Bronze Buckler",     type: "Buckler", blockMin: 16, blockMax: 28,  parryBonus: 2.5 },
  { name: "Iron Buckler",       type: "Buckler", blockMin: 28, blockMax: 40,  parryBonus: 2.5 },
  { name: "Carapace Buckler",   type: "Buckler", blockMin: 78, blockMax: 90,  parryBonus: 2.5 },
  { name: "Nord Buckler",       type: "Buckler", blockMin: 88, blockMax: 100, parryBonus: 2.5 },

  // --- Tower shields (highest raw block, cannot parry) ---
  { name: "Wood Tower Shield",        type: "Tower", blockMin: 10,  blockMax: 22,  parryBonus: null },
  { name: "Bone Tower Shield",        type: "Tower", blockMin: 32,  blockMax: 44,  parryBonus: null },
  { name: "Iron Tower Shield",        type: "Tower", blockMin: 52,  blockMax: 64,  parryBonus: null },
  { name: "Serpent Scale Shield",     type: "Tower", blockMin: 60,  blockMax: 72,  parryBonus: null },
  { name: "Black Metal Tower Shield", type: "Tower", blockMin: 104, blockMax: 116, parryBonus: null },
  { name: "Flametal Tower Shield",    type: "Tower", blockMin: 140, blockMax: 152, parryBonus: null },
  { name: "Nord Greatshield",         type: "Tower", blockMin: 158, blockMax: 170, parryBonus: null },

  // A few non-shield weapons that can also block/parry, for completeness.
  // Their block-power data is thinner/less consistent across sources, so
  // treat these as rough starting points - prefer "Custom" + your tooltip.
  { name: "Bronze Atgeir (weapon)",      type: "Weapon", blockMin: 16, blockMax: 16, parryBonus: 2 },
  { name: "Iron Atgeir (weapon)",        type: "Weapon", blockMin: 28, blockMax: 28, parryBonus: 2 },
  { name: "Black Metal Atgeir (weapon)", type: "Weapon", blockMin: 52, blockMax: 52, parryBonus: 2 },
  { name: "Crystal Battleaxe (weapon)",  type: "Weapon", blockMin: 40, blockMax: 40, parryBonus: 2 },

  { name: "Custom (enter your own tooltip values)", type: "Custom", blockMin: 20, blockMax: 20, parryBonus: 2 },
];

// Enemies grouped by biome. Each attack has a label and a base (0-star) damage
// amount + damage type(s) shown for flavor. Star scaling is applied uniformly
// as x1 / x1.5 / x2 for 0/1/2 stars, which matches observed in-game ratios.
// Bosses don't have star variants and generally can't be staggered by a parry
// (the damage-reduction math still applies - they just won't flinch).
const ENEMIES = [
  { name: "Boar", biome: "Meadows", attacks: [{ label: "Charge", type: "blunt", amount: 10 }] },
  { name: "Greyling", biome: "Meadows", attacks: [{ label: "Claw", type: "slash", amount: 5 }] },
  { name: "Neck", biome: "Meadows", attacks: [{ label: "Bite", type: "slash", amount: 6 }] },
  { name: "Greydwarf", biome: "Meadows / Black Forest", attacks: [{ label: "Claw", type: "slash", amount: 14 }] },
  { name: "Greydwarf Brute", biome: "Meadows / Black Forest", attacks: [{ label: "Slam", type: "slash", amount: 30 }] },
  { name: "Greydwarf Shaman", biome: "Meadows / Black Forest", attacks: [
    { label: "Claw", type: "slash", amount: 14 },
    { label: "Poison bolt", type: "poison", amount: 30 },
  ]},
  { name: "Eikthyr", biome: "Meadows (boss)", boss: true, attacks: [
    { label: "Antler gore", type: "pierce", amount: 20 },
    { label: "Lightning stomp/charge", type: "lightning", amount: 15 },
  ]},

  { name: "Bear", biome: "Black Forest", attacks: [
    { label: "Bite", type: "pierce", amount: 55 },
    { label: "Slam", type: "blunt", amount: 50 },
  ]},
  { name: "Ghost", biome: "Black Forest", attacks: [{ label: "Claw", type: "slash", amount: 25 }] },
  { name: "Troll", biome: "Black Forest", attacks: [
    { label: "Log swing", type: "blunt", amount: 70 },
    { label: "Punch", type: "blunt", amount: 60 },
  ]},
  { name: "The Elder", biome: "Black Forest (boss)", boss: true, attacks: [
    { label: "Root stomp", type: "blunt", amount: 60 },
    { label: "Spike shot", type: "pierce", amount: 35 },
  ]},

  { name: "Bat", biome: "Swamp / Mountain", attacks: [{ label: "Bite", type: "slash", amount: 20 }] },
  { name: "Blob", biome: "Swamp", attacks: [{ label: "Splat", type: "poison", amount: 90 }] },
  { name: "Oozer", biome: "Swamp", attacks: [{ label: "Splat", type: "poison", amount: 115 }] },
  { name: "Draugr", biome: "Swamp", attacks: [
    { label: "Axe swing", type: "slash", amount: 48 },
    { label: "Bow shot", type: "pierce", amount: 48 },
  ]},
  { name: "Draugr Elite", biome: "Swamp", attacks: [{ label: "Weapon swing", type: "slash", amount: 58 }] },
  { name: "Leech", biome: "Swamp", attacks: [{ label: "Bite", type: "poison/pierce", amount: 90 }] },
  { name: "Skeleton", biome: "Swamp / Mountain", attacks: [
    { label: "Mace swing", type: "blunt", amount: 105 },
    { label: "Sword swing", type: "slash", amount: 60 },
    { label: "Bow shot", type: "pierce", amount: 60 },
  ]},
  { name: "Wraith", biome: "Swamp", attacks: [{ label: "Claw", type: "slash", amount: 60 }] },
  { name: "Abomination", biome: "Swamp", attacks: [
    { label: "Swing (1-2)", type: "blunt", amount: 80 },
    { label: "Swing (3)", type: "blunt", amount: 60 },
  ]},
  { name: "Bonemass", biome: "Swamp (boss)", boss: true, attacks: [
    { label: "Punch", type: "blunt/poison", amount: 130 },
    { label: "Area poison", type: "poison", amount: 130 },
  ]},

  { name: "Wolf", biome: "Mountain", attacks: [{ label: "Bite/claw", type: "slash", amount: 70 }] },
  { name: "Ulv", biome: "Mountain", attacks: [
    { label: "Bite", type: "slash", amount: 80 },
    { label: "Slash", type: "slash", amount: 70 },
  ]},
  { name: "Fenring", biome: "Mountain", attacks: [
    { label: "Jump", type: "slash", amount: 95 },
    { label: "Claw", type: "slash", amount: 85 },
  ]},
  { name: "Drake", biome: "Mountain", attacks: [{ label: "Frost breath", type: "frost", amount: 90 }] },
  { name: "Stone Golem", biome: "Mountain", attacks: [{ label: "Slam", type: "blunt", amount: 110 }] },
  { name: "Frost Blob", biome: "Mountain", attacks: [{ label: "Splat", type: "frost", amount: 100 }] },
  { name: "Cultist", biome: "Mountain", attacks: [
    { label: "Fire claw", type: "fire/slash", amount: 75 },
    { label: "Flame burst", type: "fire", amount: 50 },
  ]},
  { name: "Moder", biome: "Mountain (boss)", boss: true, attacks: [
    { label: "Frost spit", type: "frost/pierce", amount: 230 },
    { label: "Cold breath", type: "frost", amount: 200 },
    { label: "Bite", type: "pierce", amount: 120 },
  ]},

  { name: "Deathsquito", biome: "Plains", attacks: [{ label: "Stinger", type: "pierce", amount: 90 }] },
  { name: "Fuling", biome: "Plains", attacks: [
    { label: "Torch", type: "fire/blunt", amount: 90 },
    { label: "Sword", type: "slash", amount: 85 },
    { label: "Spear", type: "pierce", amount: 85 },
  ]},
  { name: "Fuling Berserker", biome: "Plains", attacks: [
    { label: "Rage attack", type: "blunt", amount: 130 },
    { label: "Taunt swing", type: "slash", amount: 80 },
  ]},
  { name: "Fuling Shaman", biome: "Plains", attacks: [
    { label: "Fireball", type: "fire/blunt", amount: 120 },
    { label: "Poke", type: "blunt", amount: 100 },
    { label: "Feather burst", type: "blunt", amount: 80 },
  ]},
  { name: "Lox", biome: "Plains", attacks: [
    { label: "Bite", type: "slash", amount: 130 },
    { label: "Stomp", type: "blunt", amount: 120 },
  ]},
  { name: "Growth", biome: "Plains", attacks: [{ label: "Burst", type: "poison/blunt", amount: 95 }] },
  { name: "Vile", biome: "Plains", attacks: [
    { label: "Slam", type: "blunt", amount: 150 },
    { label: "Bite", type: "pierce/slash", amount: 150 },
    { label: "Claws", type: "slash", amount: 130 },
  ]},
  { name: "Yagluth", biome: "Plains (boss)", boss: true, attacks: [
    { label: "Nova", type: "lightning/fire", amount: 130 },
    { label: "Beam", type: "fire/lightning", amount: 60 },
  ]},

  { name: "Tick", biome: "Mistlands", attacks: [{ label: "Bite", type: "pierce", amount: 50 }] },
  { name: "Seeker Brood", biome: "Mistlands", attacks: [{ label: "Bite", type: "pierce", amount: 60 }] },
  { name: "Seeker", biome: "Mistlands", attacks: [
    { label: "Land/takeoff slam", type: "frost/pierce", amount: 230 },
    { label: "Claw", type: "pierce", amount: 120 },
  ]},
  { name: "Seeker Soldier", biome: "Mistlands", attacks: [
    { label: "Groundslam", type: "blunt", amount: 120 },
    { label: "Bite", type: "slash", amount: 100 },
    { label: "Ram", type: "blunt", amount: 100 },
  ]},
  { name: "Dvergr Mage", biome: "Mistlands", attacks: [
    { label: "Icebolt", type: "frost", amount: 200 },
    { label: "Fireball", type: "fire", amount: 130 },
    { label: "Ice staff", type: "frost", amount: 120 },
  ]},
  { name: "Dvergr Rogue", biome: "Mistlands", attacks: [{ label: "Arbalest shot", type: "pierce", amount: 160 }] },
  { name: "Gjall", biome: "Mistlands", attacks: [
    { label: "Spit", type: "fire/blunt", amount: 130 },
    { label: "Shake", type: "blunt", amount: 20 },
  ]},
  { name: "Mistile", biome: "Mistlands", attacks: [{ label: "Kamikaze blast", type: "blunt", amount: 150 }] },
  { name: "The Queen", biome: "Mistlands (boss)", boss: true, attacks: [
    { label: "Bite", type: "pierce/poison", amount: 240 },
    { label: "Area attack", type: "pierce", amount: 150 },
    { label: "Slap", type: "slash", amount: 130 },
  ]},

  { name: "Surtling", biome: "Ashlands", attacks: [{ label: "Burn", type: "fire/blunt", amount: 50 }] },
  { name: "Charred Marksman", biome: "Ashlands", attacks: [
    { label: "Bow shot", type: "pierce", amount: 90 },
    { label: "Volley", type: "pierce", amount: 60 },
  ]},
  { name: "Charred Twitcher", biome: "Ashlands", attacks: [
    { label: "Scratch", type: "slash", amount: 100 },
    { label: "Throw", type: "pierce", amount: 75 },
  ]},
  { name: "Charred Warlock", biome: "Ashlands", attacks: [{ label: "Staff attack", type: "pierce", amount: 100 }] },
  { name: "Charred Warrior", biome: "Ashlands", attacks: [
    { label: "Thrust", type: "pierce", amount: 160 },
    { label: "Swing", type: "slash", amount: 150 },
  ]},
  { name: "Volture", biome: "Ashlands", attacks: [{ label: "Dive", type: "slash", amount: 110 }] },
  { name: "Morgen", biome: "Ashlands", attacks: [
    { label: "Bodyslam", type: "blunt", amount: 160 },
    { label: "Swipe", type: "pierce", amount: 160 },
  ]},
  { name: "Asksvin", biome: "Ashlands", attacks: [
    { label: "Pounce", type: "blunt", amount: 150 },
    { label: "Bite", type: "slash/blunt", amount: 150 },
    { label: "Headbutt", type: "blunt", amount: 120 },
  ]},
  { name: "Bonemaw", biome: "Ashlands", attacks: [
    { label: "Bite", type: "slash", amount: 140 },
    { label: "Spit", type: "blunt/poison/fire", amount: 80 },
  ]},
  { name: "Fallen Valkyrie", biome: "Ashlands", attacks: [
    { label: "Spin", type: "pierce/blunt", amount: 220 },
    { label: "Claws", type: "slash/pierce", amount: 160 },
  ]},
  { name: "Fader", biome: "Ashlands (boss)", boss: true, attacks: [
    { label: "Bite", type: "pierce", amount: 210 },
    { label: "Claw", type: "pierce", amount: 200 },
  ]},

  { name: "Serpent", biome: "Ocean", attacks: [{ label: "Bite", type: "slash", amount: 70 }] },

  { name: "Moose", biome: "Deep North", attacks: [
    { label: "Horns", type: "slash", amount: 160 },
    { label: "Hooves", type: "blunt", amount: 150 },
  ]},
  { name: "Frysling", biome: "Deep North", attacks: [{ label: "Attack", type: "frost/blunt", amount: 150 }] },
  { name: "Hexen", biome: "Deep North", attacks: [{ label: "Dodge attack", type: "slash", amount: 150 }] },
  { name: "Krigen", biome: "Deep North", attacks: [{ label: "Attack", type: "slash", amount: 170 }] },
  { name: "Shadow", biome: "Deep North", attacks: [
    { label: "Attack (slash/spirit)", type: "slash/spirit", amount: 120 },
    { label: "Attack", type: "slash", amount: 95 },
  ]},
  { name: "Elaking", biome: "Deep North", attacks: [
    { label: "Lantern", type: "slash/blunt/fire", amount: 165 },
    { label: "Claw", type: "slash/blunt", amount: 140 },
  ]},
  { name: "Captive Fuling", biome: "Deep North", attacks: [
    { label: "Torch", type: "fire/blunt", amount: 170 },
    { label: "Sword", type: "slash", amount: 160 },
  ]},
  { name: "Gammeltroll", biome: "Deep North", attacks: [{ label: "Punch/groundslam", type: "blunt", amount: 220 }] },
  { name: "Barka", biome: "Deep North (boss)", boss: true, attacks: [
    { label: "Slam drive", type: "blunt/frost", amount: 280 },
    { label: "Backslam", type: "blunt/frost", amount: 270 },
  ]},
  { name: "Kall Fimbulbringer", biome: "Deep North (boss)", boss: true, attacks: [
    { label: "Chain rush", type: "pierce/blunt", amount: 250 },
    { label: "Flurry", type: "blunt", amount: 250 },
  ]},
];

// Food: base character health is 25. Up to 3 foods can be active at once.
const FOODS = [
  { name: "Raspberries", biome: "Meadows", health: 7, stamina: 20, eitr: 0 },
  { name: "Honey", biome: "Meadows", health: 8, stamina: 35, eitr: 0 },
  { name: "Mushroom", biome: "Meadows", health: 15, stamina: 15, eitr: 0 },
  { name: "Grilled Neck Tail", biome: "Meadows", health: 25, stamina: 8, eitr: 0 },
  { name: "Cooked Boar Meat", biome: "Meadows", health: 30, stamina: 10, eitr: 0 },
  { name: "Cooked Deer Meat", biome: "Meadows", health: 35, stamina: 12, eitr: 0 },

  { name: "Blueberries", biome: "Black Forest", health: 8, stamina: 25, eitr: 0 },
  { name: "Yellow Mushroom", biome: "Black Forest", health: 10, stamina: 30, eitr: 0 },
  { name: "Carrot", biome: "Black Forest", health: 10, stamina: 32, eitr: 0 },
  { name: "Queen's Jam", biome: "Black Forest", health: 14, stamina: 40, eitr: 0 },
  { name: "Carrot Soup", biome: "Black Forest", health: 15, stamina: 45, eitr: 0 },
  { name: "Boar Jerky", biome: "Black Forest", health: 23, stamina: 23, eitr: 0 },
  { name: "Pulled Bear", biome: "Black Forest", health: 37, stamina: 16, eitr: 0 },
  { name: "Cooked Bear Meat", biome: "Black Forest", health: 40, stamina: 13, eitr: 0 },
  { name: "Minced Meat Sauce", biome: "Black Forest", health: 40, stamina: 13, eitr: 0 },
  { name: "Deer Stew", biome: "Black Forest", health: 45, stamina: 15, eitr: 0 },

  { name: "Muckshake", biome: "Swamp", health: 16, stamina: 50, eitr: 0 },
  { name: "Turnip Stew", biome: "Swamp", health: 18, stamina: 55, eitr: 0 },
  { name: "Cooked Fish", biome: "Swamp", health: 45, stamina: 15, eitr: 0 },
  { name: "Black Soup", biome: "Swamp", health: 50, stamina: 17, eitr: 0 },
  { name: "Sausages", biome: "Swamp", health: 55, stamina: 18, eitr: 0 },
  { name: "Cooked Serpent Meat", biome: "Swamp", health: 70, stamina: 23, eitr: 0 },
  { name: "Serpent Stew", biome: "Swamp", health: 80, stamina: 26, eitr: 0 },

  { name: "Onion", biome: "Mountain", health: 13, stamina: 40, eitr: 0 },
  { name: "Onion Soup", biome: "Mountain", health: 20, stamina: 60, eitr: 0 },
  { name: "Eyescream", biome: "Mountain", health: 21, stamina: 65, eitr: 0 },
  { name: "Wolf Jerky", biome: "Mountain", health: 33, stamina: 33, eitr: 0 },
  { name: "Cooked Wolf Meat", biome: "Mountain", health: 45, stamina: 15, eitr: 0 },
  { name: "Wolf Skewer", biome: "Mountain", health: 65, stamina: 21, eitr: 0 },

  { name: "Cloudberries", biome: "Plains", health: 13, stamina: 40, eitr: 0 },
  { name: "Bread", biome: "Plains", health: 23, stamina: 70, eitr: 0 },
  { name: "Blood Pudding", biome: "Plains", health: 25, stamina: 75, eitr: 0 },
  { name: "Cooked Egg", biome: "Plains", health: 35, stamina: 12, eitr: 0 },
  { name: "Frosted Sweetbread", biome: "Plains", health: 43, stamina: 43, eitr: 0 },
  { name: "Cooked Lox Meat", biome: "Plains", health: 50, stamina: 16, eitr: 0 },
  { name: "Cooked Chicken Meat", biome: "Plains", health: 60, stamina: 20, eitr: 0 },
  { name: "Fish Wraps", biome: "Plains", health: 70, stamina: 23, eitr: 0 },
  { name: "Lox Meat Pie", biome: "Plains", health: 75, stamina: 24, eitr: 0 },

  { name: "Stuffed Mushroom", biome: "Mistlands", health: 25, stamina: 12, eitr: 75 },
  { name: "Jotun Puffs", biome: "Mistlands", health: 25, stamina: 25, eitr: 0 },
  { name: "Magecap", biome: "Mistlands", health: 25, stamina: 25, eitr: 25 },
  { name: "Salad", biome: "Mistlands", health: 26, stamina: 80, eitr: 0 },
  { name: "Yggdrasil Porridge", biome: "Mistlands", health: 27, stamina: 13, eitr: 80 },
  { name: "Seeker Aspic", biome: "Mistlands", health: 28, stamina: 14, eitr: 85 },
  { name: "Mushroom Omelette", biome: "Mistlands", health: 28, stamina: 0, eitr: 85 },
  { name: "Fish 'n' Bread", biome: "Mistlands", health: 30, stamina: 0, eitr: 90 },
  { name: "Cooked Seeker Meat", biome: "Mistlands", health: 60, stamina: 20, eitr: 0 },
  { name: "Cooked Hare Meat", biome: "Mistlands", health: 60, stamina: 20, eitr: 0 },
  { name: "Meat Platter", biome: "Mistlands", health: 80, stamina: 26, eitr: 0 },
  { name: "Honey Glazed Chicken", biome: "Mistlands", health: 80, stamina: 26, eitr: 0 },
  { name: "Misthare Supreme", biome: "Mistlands", health: 85, stamina: 28, eitr: 0 },

  { name: "Smoke Puff", biome: "Ashlands", health: 15, stamina: 15, eitr: 0 },
  { name: "Fiddlehead", biome: "Ashlands", health: 30, stamina: 30, eitr: 0 },
  { name: "Vineberry Cluster", biome: "Ashlands", health: 30, stamina: 30, eitr: 30 },
  { name: "Sizzling Berry Broth", biome: "Ashlands", health: 28, stamina: 14, eitr: 85 },
  { name: "Sparkling Shroomshake", biome: "Ashlands", health: 30, stamina: 15, eitr: 90 },
  { name: "Spicy Marmalade", biome: "Ashlands", health: 30, stamina: 0, eitr: 90 },
  { name: "Marinated Greens", biome: "Ashlands", health: 32, stamina: 16, eitr: 95 },
  { name: "Scorching Medley", biome: "Ashlands", health: 32, stamina: 0, eitr: 95 },
  { name: "Roasted Crust Pie", biome: "Ashlands", health: 34, stamina: 0, eitr: 100 },
  { name: "Cooked Asksvin Tail", biome: "Ashlands", health: 70, stamina: 24, eitr: 0 },
  { name: "Cooked Volture Meat", biome: "Ashlands", health: 70, stamina: 24, eitr: 0 },
  { name: "Cooked Bonemaw Meat", biome: "Ashlands", health: 90, stamina: 30, eitr: 0 },
  { name: "Fiery Svinstew", biome: "Ashlands", health: 95, stamina: 32, eitr: 0 },
  { name: "Mashed Meat", biome: "Ashlands", health: 100, stamina: 34, eitr: 0 },
  { name: "Piquant Pie", biome: "Ashlands", health: 105, stamina: 35, eitr: 0 },

  { name: "Smoked Fish", biome: "Deep North", health: 30, stamina: 16, eitr: 95 },
  { name: "Luminous Larva", biome: "Deep North", health: 30, stamina: 30, eitr: 0 },
  { name: "Oats", biome: "Deep North", health: 33, stamina: 33, eitr: 0 },
  { name: "Baked Poteitr", biome: "Deep North", health: 34, stamina: 17, eitr: 100 },
  { name: "Meatballs and Poteitr", biome: "Deep North", health: 35, stamina: 18, eitr: 105 },
  { name: "Kale", biome: "Deep North", health: 35, stamina: 35, eitr: 0 },
  { name: "Lingonberries", biome: "Deep North", health: 35, stamina: 35, eitr: 0 },
  { name: "Poteitr", biome: "Deep North", health: 35, stamina: 35, eitr: 35 },
  { name: "Kale Chips", biome: "Deep North", health: 35, stamina: 0, eitr: 105 },
  { name: "Lingonberry Juice", biome: "Deep North", health: 35, stamina: 0, eitr: 105 },
  { name: "Oven Pancake", biome: "Deep North", health: 37, stamina: 18, eitr: 105 },
  { name: "Fish Soup", biome: "Deep North", health: 37, stamina: 18, eitr: 105 },
  { name: "Oat Milk", biome: "Deep North", health: 37, stamina: 0, eitr: 110 },
  { name: "Pancakes", biome: "Deep North", health: 39, stamina: 0, eitr: 115 },
  { name: "Oatmeal", biome: "Deep North", health: 39, stamina: 0, eitr: 85 },
  { name: "Cooked Seal Blubber", biome: "Deep North", health: 60, stamina: 20, eitr: 0 },
  { name: "Cooked Moose Meat", biome: "Deep North", health: 80, stamina: 27, eitr: 0 },
  { name: "Smoked Moose Meat", biome: "Deep North", health: 105, stamina: 35, eitr: 0 },
  { name: "Meat In Bread", biome: "Deep North", health: 110, stamina: 37, eitr: 0 },
  { name: "Seal Meat Soup", biome: "Deep North", health: 110, stamina: 37, eitr: 0 },
];

const BASE_HEALTH = 25;
