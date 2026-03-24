/* ═══════════════════════════════════════════════════
   🌸 Meadow Farm — game.js
   ═══════════════════════════════════════════════════ */

// ── Canvas ─────────────────────────────────────────
const canvas = document.getElementById('game-canvas');
const ctx    = canvas.getContext('2d');
const TILE = 48, COLS = 20, ROWS = 15;
canvas.width  = COLS * TILE;
canvas.height = ROWS * TILE;

// ── Colours ────────────────────────────────────────
const C = {
  grassA:'#c8e6a0', grassB:'#bedd92',
  soilTilled:'#c49060', soilWet:'#9a7048',
  path:'#e8d5b0', pathEdge:'#d0bb94',
  water:'#a8d8ea', waterHi:'#c4eaf6',
  treeTrunk:'#c8a878', treeLeaf:'#a8d880', treeLeaf2:'#90c868',
  shadow:'rgba(80,60,40,0.10)', grid:'rgba(160,130,90,0.12)',
  highlight:'rgba(255,240,100,0.35)', highlightW:'rgba(100,200,255,0.45)',
  highlightM:'rgba(255,180,80,0.45)',
};

// ── Crops ──────────────────────────────────────────
const CROPS = {
  carrot:     { name:'Carrot',     cost:5,  reward:18, growDays:2, stages:['🌱','🌿','🥕'], glow:'#ff9966' },
  strawberry: { name:'Strawberry', cost:8,  reward:28, growDays:3, stages:['🌱','🌿','🍓'], glow:'#ff6688' },
  sunflower:  { name:'Sunflower',  cost:6,  reward:22, growDays:2, stages:['🌱','🌿','🌻'], glow:'#ffd044' },
  pumpkin:    { name:'Pumpkin',    cost:10, reward:40, growDays:4, stages:['🌱','🌿','🎃'], glow:'#ff8844' },
};

const TOOL_LIST  = ['hoe','water','harvest','seed-carrot','seed-strawberry','seed-sunflower','seed-pumpkin'];
const TOOL_ICONS = { hoe:'⛏️',water:'💧',harvest:'🧺','seed-carrot':'🥕','seed-strawberry':'🍓','seed-sunflower':'🌻','seed-pumpkin':'🎃' };
const TOOL_NAMES = { hoe:'Hoe',water:'Water',harvest:'Harvest','seed-carrot':'Carrot','seed-strawberry':'Berry','seed-sunflower':'Sunflower','seed-pumpkin':'Pumpkin' };

// ── Map ────────────────────────────────────────────
const MAP_DEF = [
  ['T','T','G','G','G','G','G','G','G','P','G','G','G','G','G','G','G','T','T','T'],
  ['T','G','G','W','W','W','G','G','G','P','G','G','G','G','G','G','G','G','G','T'],
  ['G','G','G','W','W','W','G','G','G','P','G','S','S','S','S','S','S','G','G','G'],
  ['G','G','G','W','W','G','G','G','G','P','G','S','S','S','S','S','S','G','G','G'],
  ['G','G','G','G','G','G','G','G','G','P','G','S','S','S','S','S','S','G','G','G'],
  ['G','G','G','G','G','G','G','G','G','P','G','G','G','G','G','G','G','G','G','G'],
  ['G','G','G','G','G','G','G','G','G','P','G','G','G','G','G','G','G','G','G','T'],
  ['P','P','P','P','P','P','P','P','P','P','P','P','P','P','P','P','P','P','P','P'],
  ['G','G','G','G','G','G','G','G','G','P','G','G','G','G','G','G','G','G','G','G'],
  ['G','S','S','S','S','S','G','G','G','P','G','G','T','G','G','G','G','G','G','G'],
  ['G','S','S','S','S','S','G','G','G','P','G','G','T','G','G','S','S','S','G','G'],
  ['G','S','S','S','S','S','G','G','G','P','G','G','G','G','G','S','S','S','G','G'],
  ['G','S','S','S','S','S','G','G','G','P','G','G','G','G','G','S','S','S','G','G'],
  ['T','G','G','G','G','G','G','G','G','P','G','G','G','G','G','G','G','G','G','T'],
  ['T','T','G','G','G','G','G','G','G','P','G','G','G','G','G','G','G','T','T','T'],
];

const LAKE_TILES = [];
for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) if (MAP_DEF[r][c]==='W') LAKE_TILES.push({r,c});

const FLOWER_DEFS = [
  [0,2,'#f4b8c8',6,8],[0,6,'#f8d870',-5,10],[0,15,'#c8b4f4',4,7],
  [1,7,'#f4b8c8',-8,5],[1,16,'#f8d870',7,9],[2,7,'#c8b4f4',-4,6],
  [5,1,'#f4b8c8',8,-3],[5,6,'#f8d870',-6,8],[5,14,'#c8b4f4',5,4],
  [6,2,'#f4b8c8',-7,7],[6,14,'#f8d870',9,-5],[6,18,'#c8b4f4',-4,8],
  [8,1,'#f4b8c8',6,5],[8,14,'#f8d870',-5,9],[8,18,'#c8b4f4',8,-3],
  [13,1,'#f4b8c8',-6,6],[13,6,'#f8d870',5,8],[13,16,'#c8b4f4',-4,7],
  [14,2,'#f4b8c8',7,-4],[14,6,'#c8b4f4',-6,5],[14,16,'#f8d870',4,9],
];

// ── Merchant & Quests ──────────────────────────────
// Merchant spawns at tile (5,14) and stays for 7 days
const MERCHANT = {
  tile: { r:5, c:14 },   // fixed map position
  spawnDay: 1,
  stayDays: 7,
  name: '🧙 Barnaby',
  speeches: [
    "Greetings, young sprout! Got some jobs if you're up for it…",
    "These old bones need rest soon. Any takers?",
    "Aye, fresh crops and a warm breeze! Care to help?",
    "My wagon leaves in a few days — best hurry!",
    "Almost time for me to roll on. Last chance, friend!",
  ],
};

// Quest tiers — named like farm difficulty modes
// Sprout = easy, Harvest = medium, Bounty = hard
const QUEST_POOL = {
  sprout: [
    { id:'s1', name:'First Harvest',      desc:'Harvest any 3 crops.',               req:{ type:'harvest', count:3,  crop:null },        reward:25, tier:'sprout'  },
    { id:'s2', name:'Green Thumb',        desc:'Plant 5 seeds of any kind.',          req:{ type:'plant',   count:5,  crop:null },        reward:20, tier:'sprout'  },
    { id:'s3', name:'Carrot Crunch',      desc:'Harvest 3 carrots.',                 req:{ type:'harvest', count:3,  crop:'carrot' },    reward:30, tier:'sprout'  },
    { id:'s4', name:'Morning Ritual',     desc:'Water 4 soil tiles.',                req:{ type:'water',   count:4,  crop:null },        reward:22, tier:'sprout'  },
    { id:'s5', name:'Fresh Soil',         desc:'Till 6 soil tiles.',                 req:{ type:'till',    count:6,  crop:null },        reward:18, tier:'sprout'  },
  ],
  harvest: [
    { id:'h1', name:'Meadow Bounty',      desc:'Harvest 6 crops of any kind.',       req:{ type:'harvest', count:6,  crop:null },        reward:55, tier:'harvest' },
    { id:'h2', name:'Berry Season',       desc:'Harvest 4 strawberries.',            req:{ type:'harvest', count:4,  crop:'strawberry'}, reward:65, tier:'harvest' },
    { id:'h3', name:'Sunlit Fields',      desc:'Harvest 4 sunflowers.',              req:{ type:'harvest', count:4,  crop:'sunflower' }, reward:60, tier:'harvest' },
    { id:'h4', name:'Field Hand',         desc:'Till 10 soil tiles.',               req:{ type:'till',    count:10, crop:null },        reward:45, tier:'harvest' },
    { id:'h5', name:'Irrigation Day',     desc:'Water 8 soil tiles.',               req:{ type:'water',   count:8,  crop:null },        reward:50, tier:'harvest' },
  ],
  bounty: [
    { id:'b1', name:'Great Pumpkin Hunt', desc:'Harvest 5 pumpkins.',               req:{ type:'harvest', count:5,  crop:'pumpkin' },   reward:120, tier:'bounty' },
    { id:'b2', name:'Full Farmstead',     desc:'Harvest 12 crops total.',           req:{ type:'harvest', count:12, crop:null },        reward:150, tier:'bounty' },
    { id:'b3', name:'Tireless Tiller',    desc:'Till 20 soil tiles.',              req:{ type:'till',    count:20, crop:null },         reward:100, tier:'bounty' },
    { id:'b4', name:'Grand Garden',       desc:'Plant 10 seeds of any kind.',       req:{ type:'plant',   count:10, crop:null },        reward:110, tier:'bounty' },
    { id:'b5', name:'Colour Garden',      desc:'Harvest 3 of every crop type.',     req:{ type:'variety', count:3,  crop:null },        reward:180, tier:'bounty' },
  ],
};

// ── Grid ───────────────────────────────────────────
const grid = [];
function initGrid() {
  for (let r=0;r<ROWS;r++) { grid[r]=[];
    for (let c=0;c<COLS;c++) {
      const def=MAP_DEF[r][c];
      grid[r][c]={ base:def, tilled:def==='S', watered:false, crop:null, walkable:def!=='T'&&def!=='W' };
    }
  }
}

// ── Player ─────────────────────────────────────────
const player = { x:9*TILE+TILE/2, y:7*TILE+TILE/2, speed:2.6, facing:0, walkFrame:0, moving:false };

// ── Game State ─────────────────────────────────────
const state = {
  coins:100, cropsTotal:0, day:1, isNight:false, tool:'hoe',
  bucket:0, BUCKET_MAX:5,
  // Quest tracking
  quests: [],          // active quest objects { ...def, progress:{}, claimed:false }
  questLog: {          // lifetime counters
    harvest:{},        // { carrot:0, strawberry:0, sunflower:0, pumpkin:0, total:0 }
    plant:   { total:0 },
    water:   { total:0 },
    till:    { total:0 },
  },
  merchantGone: false,
  questPanelOpen: false,
  activeQuestTier: 'sprout',
};

// ── Day/Night Cycle ────────────────────────────────
const CYCLE = { DAY_MS:45000, NIGHT_MS:30000, FADE_MS:4000, alpha:0, phase:'day', elapsed:0 };
const STARS = Array.from({length:60},()=>({ x:Math.random()*COLS*TILE, y:Math.random()*ROWS*TILE*0.6, r:1+Math.random()*2, twinkle:Math.random()*Math.PI*2 }));
const MOON  = { x:COLS*TILE*0.78, y:ROWS*TILE*0.12 };

function updateDayNight(dt) {
  CYCLE.elapsed += dt*16.67;
  if (CYCLE.phase==='day') {
    CYCLE.alpha=0;
    if (CYCLE.elapsed>=CYCLE.DAY_MS) { CYCLE.elapsed=0; CYCLE.phase='toNight'; }
  } else if (CYCLE.phase==='toNight') {
    CYCLE.alpha=Math.min(1,CYCLE.elapsed/CYCLE.FADE_MS);
    if (CYCLE.elapsed>=CYCLE.FADE_MS) { CYCLE.alpha=1; CYCLE.elapsed=0; CYCLE.phase='night'; onNightStart(); }
  } else if (CYCLE.phase==='night') {
    CYCLE.alpha=1;
    if (CYCLE.elapsed>=CYCLE.NIGHT_MS) { CYCLE.elapsed=0; CYCLE.phase='toDay'; }
  } else if (CYCLE.phase==='toDay') {
    CYCLE.alpha=Math.max(0,1-CYCLE.elapsed/CYCLE.FADE_MS);
    if (CYCLE.elapsed>=CYCLE.FADE_MS) { CYCLE.alpha=0; CYCLE.elapsed=0; CYCLE.phase='day'; onDayStart(); }
  }
  const label = CYCLE.phase==='day'?`Day ${state.day}`:CYCLE.phase==='toNight'?`Dusk ${state.day}`:CYCLE.phase==='night'?`Night ${state.day}`:`Dawn ${state.day}`;
  document.getElementById('stat-time').textContent = label;
  document.getElementById('stat-time-wrap').firstChild.textContent = CYCLE.alpha<0.3?'☀️ ':CYCLE.alpha>0.7?'🌙 ':'🌅 ';
}

function onNightStart() {
  state.isNight=true; state.day++;
  let grew=0;
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
    const cell=grid[r][c]; if (!cell.crop) continue;
    const def=CROPS[cell.crop.kind];
    if (cell.crop.watered&&cell.crop.stage<2) {
      const ns=Math.min(2,Math.floor((state.day-cell.crop.daysPlanted)/(def.growDays/2)));
      if (ns>cell.crop.stage) { cell.crop.stage=ns; grew++; }
    }
    cell.watered=cell.crop.watered=false;
  }
  // Check if merchant leaves
  if (!state.merchantGone && state.day > MERCHANT.spawnDay + MERCHANT.stayDays) {
    state.merchantGone=true;
    closeQuestPanel();
    notify('🧙 Barnaby packed up his wagon and rode off into the night…');
  }
  updateHUD(); updateQuestPanel();
  notify(`🌙 Night falls… ${grew?`${grew} crop(s) grew! 🌿`:'Sweet dreams!'}`);
  saveGame();
}

function onDayStart() {
  state.isNight=false;
  if (!state.merchantGone) {
    const daysLeft = MERCHANT.spawnDay + MERCHANT.stayDays - state.day;
    notify(`☀️ Day ${state.day} — Barnaby has ${daysLeft} day(s) left! 🧙`);
  } else {
    notify(`☀️ Good morning! Day ${state.day} 🌸`);
  }
  updateHUD();
}

// ── Draw Night Overlay ─────────────────────────────
function drawNightOverlay() {
  if (CYCLE.alpha<=0) return;
  const a=CYCLE.alpha;
  ctx.fillStyle=`rgba(20,24,60,${a*0.72})`; ctx.fillRect(0,0,canvas.width,canvas.height);
  const now=Date.now()/1000;
  for (const s of STARS) {
    const tw=0.5+0.5*Math.sin(now*2+s.twinkle);
    ctx.globalAlpha=a*tw*0.9; ctx.fillStyle='#fff8e8';
    ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha=a; ctx.fillStyle='#fff8e0'; ctx.shadowColor='#fffacc'; ctx.shadowBlur=20;
  ctx.beginPath(); ctx.arc(MOON.x,MOON.y,22,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=`rgba(20,24,60,${a*0.85})`; ctx.shadowBlur=0;
  ctx.beginPath(); ctx.arc(MOON.x+8,MOON.y-4,18,0,Math.PI*2); ctx.fill();
  ctx.globalAlpha=1; ctx.shadowBlur=0;
}

// ── Merchant NPC ───────────────────────────────────
function isMerchantPresent() {
  return !state.merchantGone && state.day >= MERCHANT.spawnDay && state.day <= MERCHANT.spawnDay + MERCHANT.stayDays;
}
function isAdjacentToMerchant() {
  if (!isMerchantPresent()) return false;
  const {r,c} = facingTile();
  return r===MERCHANT.tile.r && c===MERCHANT.tile.c;
}

function drawMerchant() {
  if (!isMerchantPresent()) return;
  const mx = MERCHANT.tile.c*TILE+TILE/2;
  const my = MERCHANT.tile.r*TILE+TILE/2;
  const t  = Date.now()/1000;
  const bob = Math.sin(t*1.2)*3;

  ctx.save(); ctx.translate(mx, my+bob);

  // Shadow
  ctx.fillStyle='rgba(80,60,40,0.18)'; ctx.beginPath(); ctx.ellipse(0,18,13,5,0,0,Math.PI*2); ctx.fill();

  // Robe
  ctx.fillStyle='#d4b8f4'; roundRect(-10,-4,20,18,6); ctx.fill();
  ctx.fillStyle='#c4a8e4'; roundRect(-7,8,14,10,4); ctx.fill();

  // Arms
  ctx.fillStyle='#d4b8f4';
  roundRect(-16,-2,7,12,4); ctx.fill();
  roundRect( 9,-2,7,12,4); ctx.fill();

  // Staff
  ctx.strokeStyle='#c8a870'; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(16,18); ctx.lineTo(16,-20); ctx.stroke();
  ctx.fillStyle='#f8d870'; ctx.shadowColor='#f8e090'; ctx.shadowBlur=8;
  ctx.beginPath(); ctx.arc(16,-22,5,0,Math.PI*2); ctx.fill();
  ctx.shadowBlur=0;

  // Head
  ctx.fillStyle='#fce8c8'; ctx.beginPath(); ctx.arc(0,-14,10,0,Math.PI*2); ctx.fill();

  // Beard
  ctx.fillStyle='#f0f0f0';
  ctx.beginPath(); ctx.arc(0,-6,7,0,Math.PI); ctx.fill();
  roundRect(-4,-10,8,5,2); ctx.fill();

  // Hat (tall wizard hat)
  ctx.fillStyle='#9080d0';
  ctx.beginPath(); ctx.moveTo(-12,-24); ctx.lineTo(12,-24); ctx.lineTo(6,-48); ctx.lineTo(-6,-48); ctx.closePath(); ctx.fill();
  roundRect(-13,-26,26,5,3); ctx.fill();
  // Star on hat
  ctx.font='10px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillStyle='#f8e070'; ctx.fillText('⭐',0,-40);

  // Eyes
  ctx.fillStyle='#6060a0';
  ctx.beginPath(); ctx.arc(-3,-15,2,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( 3,-15,2,0,Math.PI*2); ctx.fill();

  // "Talk" indicator if player is near
  if (isAdjacentToMerchant()) {
    ctx.fillStyle='rgba(255,248,220,0.92)';
    roundRect(-22,-60,44,16,8); ctx.fill();
    ctx.strokeStyle='#d4b060'; ctx.lineWidth=1.5; ctx.stroke();
    ctx.fillStyle='#a07040'; ctx.font='bold 9px Nunito,sans-serif';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('Space: Talk',0,-52);
  }

  ctx.restore();
}

// ── Quest System ───────────────────────────────────
function initQuests() {
  if (state.quests.length > 0) return; // already loaded
  // Pick 2 from each tier
  state.quests = [];
  for (const tier of ['sprout','harvest','bounty']) {
    const pool = [...QUEST_POOL[tier]];
    for (let i=0;i<2;i++) {
      const idx=Math.floor(Math.random()*pool.length);
      const q = {...pool.splice(idx,1)[0]};
      q.progress = 0;
      q.claimed  = false;
      state.quests.push(q);
    }
  }
}

function questProgress(type, cropKind) {
  // Update all active matching quests
  for (const q of state.quests) {
    if (q.claimed) continue;
    const r = q.req;
    if (r.type === 'variety') continue; // handled separately
    if (r.type !== type) continue;
    if (r.crop && r.crop !== cropKind) continue;
    if (q.progress < r.count) {
      q.progress++;
      if (q.progress >= r.count) notify(`✨ Quest ready: "${q.name}" — talk to Barnaby!`);
    }
  }
  // variety quest (3 of each crop)
  for (const q of state.quests) {
    if (q.claimed || q.req.type !== 'variety') continue;
    const log = state.questLog.harvest;
    const min = Math.min(log.carrot||0, log.strawberry||0, log.sunflower||0, log.pumpkin||0);
    q.progress = Math.min(q.req.count, min);
    if (q.progress >= q.req.count && !q._notified) {
      q._notified=true; notify(`✨ Quest ready: "${q.name}" — talk to Barnaby!`);
    }
  }
  updateQuestPanel();
}

function trackAction(type, cropKind) {
  const log = state.questLog;
  if (type==='harvest') {
    log.harvest[cropKind] = (log.harvest[cropKind]||0)+1;
    log.harvest.total     = (log.harvest.total||0)+1;
  } else if (type==='plant') {
    log.plant.total++;
  } else if (type==='water') {
    log.water.total++;
  } else if (type==='till') {
    log.till.total++;
  }
  questProgress(type, cropKind);
}

function claimQuest(questId) {
  const q = state.quests.find(x=>x.id===questId);
  if (!q || q.claimed || q.progress < q.req.count) return;
  q.claimed = true;
  state.coins += q.reward;
  state.cropsTotal = (state.cropsTotal||0); // unchanged, just trigger hud
  updateHUD();
  spawnFloatTextScreen(`+${q.reward}🪙 Quest!`);
  notify(`🏆 Quest "${q.name}" complete! +${q.reward}🪙`);
  updateQuestPanel();
  saveGame();
}

// ── Quest Panel UI ─────────────────────────────────
function openQuestPanel() {
  if (!isMerchantPresent()) return;
  state.questPanelOpen = true;
  const panel = document.getElementById('quest-panel');
  const speech = MERCHANT.speeches[Math.min(state.day-1, MERCHANT.speeches.length-1)];
  document.getElementById('quest-merchant-speech').textContent = `"${speech}"`;
  const daysLeft = MERCHANT.spawnDay + MERCHANT.stayDays - state.day;
  document.getElementById('quest-days-left').textContent = `Leaves in ${daysLeft}d`;
  panel.classList.remove('hidden');
  renderQuestTab(state.activeQuestTier);
}

function closeQuestPanel() {
  state.questPanelOpen = false;
  document.getElementById('quest-panel').classList.add('hidden');
}

function renderQuestTab(tier) {
  state.activeQuestTier = tier;
  document.querySelectorAll('.quest-tab').forEach(t => t.classList.toggle('active', t.dataset.tier===tier));
  const list = document.getElementById('quest-list');
  list.innerHTML = '';
  const quests = state.quests.filter(q=>q.tier===tier);
  for (const q of quests) {
    const pct   = Math.min(100, (q.progress/q.req.count)*100);
    const done  = q.progress >= q.req.count;
    const card  = document.createElement('div');
    card.className = `quest-card tier-${tier}${q.claimed?' completed':''}`;
    const tierLabels = { sprout:'🌱 Sprout', harvest:'🌾 Harvest', bounty:'🏆 Bounty' };

    card.innerHTML = `
      <div class="quest-title">
        ${q.name}
        <span class="quest-badge">${tierLabels[tier]}</span>
      </div>
      <div class="quest-desc">${q.desc}</div>
      <div class="quest-progress-bar">
        <div class="quest-progress-fill" style="width:${q.claimed?100:pct}%"></div>
      </div>
      <div class="quest-footer">
        <span class="quest-reward">+${q.reward}🪙</span>
        <span class="quest-status ${q.claimed?'done':done?'done':'active'}">
          ${q.claimed ? '✅ Claimed' : done ? '🎉 Ready!' : `${q.progress}/${q.req.count}`}
        </span>
        ${done&&!q.claimed ? `<button class="quest-claim-btn" data-qid="${q.id}">Claim!</button>` : ''}
      </div>`;
    list.appendChild(card);
  }

  list.querySelectorAll('.quest-claim-btn').forEach(btn => {
    btn.addEventListener('click', () => claimQuest(btn.dataset.qid));
  });
}

function updateQuestPanel() {
  if (state.questPanelOpen) renderQuestTab(state.activeQuestTier);
}

document.getElementById('quest-close').addEventListener('click', closeQuestPanel);
document.querySelectorAll('.quest-tab').forEach(tab => {
  tab.addEventListener('click', () => renderQuestTab(tab.dataset.tier));
});

// ── Input ──────────────────────────────────────────
const keys = {};
document.addEventListener('keydown', e => { keys[e.code]=true; onKeyDown(e); });
document.addEventListener('keyup',   e => { keys[e.code]=false; });

// ── Save / Load ────────────────────────────────────
const SAVE_KEY = 'meadowfarm_v4';
function saveGame() {
  const gd=[];
  for (let r=0;r<ROWS;r++) { gd[r]=[];
    for (let c=0;c<COLS;c++) { const {tilled,watered,crop}=grid[r][c]; gd[r][c]={tilled,watered,crop:crop?{...crop}:null}; }
  }
  try { localStorage.setItem(SAVE_KEY,JSON.stringify({ version:4, state:{...state, quests:state.quests.map(q=>({...q}))}, player:{x:player.x,y:player.y,facing:player.facing}, cycle:{phase:CYCLE.phase,elapsed:CYCLE.elapsed,alpha:CYCLE.alpha}, grid:gd })); } catch(e){}
}
function loadGame() {
  try {
    const raw=localStorage.getItem(SAVE_KEY); if (!raw) return false;
    const data=JSON.parse(raw); if (!data||data.version!==4) return false;
    const {quests, questLog, merchantGone, questPanelOpen, activeQuestTier, ...rest} = data.state;
    Object.assign(state, rest);
    state.quests           = quests||[];
    state.questLog         = questLog||{ harvest:{}, plant:{total:0}, water:{total:0}, till:{total:0} };
    state.merchantGone     = merchantGone||false;
    state.questPanelOpen   = false;
    state.activeQuestTier  = activeQuestTier||'sprout';
    player.x=data.player.x; player.y=data.player.y; player.facing=data.player.facing;
    CYCLE.phase=data.cycle.phase; CYCLE.elapsed=data.cycle.elapsed; CYCLE.alpha=data.cycle.alpha;
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) { const s=data.grid[r][c]; grid[r][c].tilled=s.tilled; grid[r][c].watered=s.watered; grid[r][c].crop=s.crop; }
    return true;
  } catch(e){ return false; }
}
setInterval(saveGame, 30000);

// ── Helpers ────────────────────────────────────────
function tileAt(r,c) { if (r<0||r>=ROWS||c<0||c>=COLS) return null; return grid[r][c]; }
function playerTile() { return { r:Math.floor(player.y/TILE), c:Math.floor(player.x/TILE) }; }
function facingTile() {
  const {r,c}=playerTile();
  const dirs=[[1,0],[-1,0],[0,-1],[0,1]];
  const [dr,dc]=dirs[player.facing];
  return { r:r+dr, c:c+dc };
}
function roundRect(x,y,w,h,r) {
  ctx.beginPath(); ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);     ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}

// ── Draw Tile ──────────────────────────────────────
function drawTile(r,c) {
  const x=c*TILE,y=r*TILE,cell=grid[r][c],base=cell.base;
  ctx.fillStyle=(r+c)%2===0?C.grassA:C.grassB; ctx.fillRect(x,y,TILE,TILE);
  if (base==='P') {
    ctx.fillStyle=C.path; ctx.fillRect(x,y,TILE,TILE);
    ctx.fillStyle=C.pathEdge;
    ctx.fillRect(x,y,TILE,2); ctx.fillRect(x,y+TILE-2,TILE,2);
    ctx.fillRect(x,y,2,TILE); ctx.fillRect(x+TILE-2,y,2,TILE); return;
  }
  if (base==='W') {
    ctx.fillStyle=C.water; ctx.fillRect(x,y,TILE,TILE);
    ctx.fillStyle=C.waterHi;
    const wave=Math.sin(Date.now()/1200+r+c)*2;
    ctx.fillRect(x+6,y+8+wave,16,3); ctx.fillRect(x+20,y+22-wave,18,3); ctx.fillRect(x+8,y+34+wave,12,3); return;
  }
  if (base==='T') return;
  if (cell.tilled) {
    ctx.fillStyle=cell.watered?C.soilWet:C.soilTilled;
    roundRect(x+3,y+3,TILE-6,TILE-6,5); ctx.fill();
    ctx.strokeStyle=cell.watered?'#7a5838':'#a87848'; ctx.lineWidth=1.5;
    for (let i=1;i<4;i++) { ctx.beginPath(); ctx.moveTo(x+5,y+5+i*11); ctx.lineTo(x+TILE-5,y+5+i*11); ctx.stroke(); }
  }
  ctx.strokeStyle=C.grid; ctx.lineWidth=1; ctx.strokeRect(x,y,TILE,TILE);
}
function drawTree(r,c) {
  const x=c*TILE,y=r*TILE,cx=x+TILE/2,cy=y+TILE/2;
  ctx.fillStyle=C.shadow; ctx.beginPath(); ctx.ellipse(cx,cy+14,16,6,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=C.treeTrunk; roundRect(cx-5,cy+2,10,14,3); ctx.fill();
  ctx.fillStyle=C.treeLeaf; ctx.beginPath(); ctx.arc(cx,cy-4,16,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=C.treeLeaf2;
  ctx.beginPath(); ctx.arc(cx-5,cy-9,10,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx+5,cy-9,10,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx,cy-14,9,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#f4a8b8'; ctx.beginPath(); ctx.arc(cx-4,cy-5,3,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#f8e070'; ctx.beginPath(); ctx.arc(cx+4,cy-2,2.5,0,Math.PI*2); ctx.fill();
}
function drawFlower(r,c,color,ox,oy) {
  const x=c*TILE+TILE/2+ox,y=r*TILE+TILE/2+oy;
  ctx.strokeStyle='#a0c060'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(x,y+7); ctx.lineTo(x,y+1); ctx.stroke();
  ctx.fillStyle=color;
  for (let i=0;i<5;i++) { const a=(i/5)*Math.PI*2; ctx.beginPath(); ctx.ellipse(x+Math.cos(a)*4.5,y+Math.sin(a)*4.5,3.5,2.2,a,0,Math.PI*2); ctx.fill(); }
  ctx.fillStyle='#fff8a0'; ctx.beginPath(); ctx.arc(x,y,2.8,0,Math.PI*2); ctx.fill();
}
function drawCrop(r,c) {
  const cell=grid[r][c]; if (!cell.crop) return;
  const {kind,stage}=cell.crop, def=CROPS[kind];
  const x=c*TILE+TILE/2,y=r*TILE+TILE/2;
  if (stage===2) { ctx.shadowColor=def.glow; ctx.shadowBlur=12; }
  ctx.font=`${[15,19,26][stage]}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(def.stages[stage],x,y); ctx.shadowBlur=0;
}
function drawFacingHighlight() {
  const {r,c}=facingTile(), cell=tileAt(r,c); if (!cell) return;
  if (cell.base==='W'&&state.tool==='water') {
    ctx.fillStyle=C.highlightW; roundRect(c*TILE+2,r*TILE+2,TILE-4,TILE-4,6); ctx.fill();
    ctx.strokeStyle='rgba(80,160,255,0.6)'; ctx.lineWidth=2; ctx.stroke(); return;
  }
  if (r===MERCHANT.tile.r&&c===MERCHANT.tile.c&&isMerchantPresent()) {
    ctx.fillStyle=C.highlightM; roundRect(c*TILE+2,r*TILE+2,TILE-4,TILE-4,6); ctx.fill();
    ctx.strokeStyle='rgba(240,160,40,0.6)'; ctx.lineWidth=2; ctx.stroke(); return;
  }
  if (cell.base==='T'||cell.base==='W') return;
  ctx.fillStyle=C.highlight; roundRect(c*TILE+2,r*TILE+2,TILE-4,TILE-4,6); ctx.fill();
  ctx.strokeStyle='rgba(220,200,60,0.5)'; ctx.lineWidth=2; ctx.stroke();
}

// ── Draw Player ────────────────────────────────────
function drawPlayer() {
  const px=player.x,py=player.y;
  const bob=player.moving?Math.sin(player.walkFrame*0.18)*2.5:0;
  const legS=player.moving?Math.sin(player.walkFrame*0.18)*6:0;
  const armS=player.moving?Math.sin(player.walkFrame*0.18+Math.PI)*5:0;
  ctx.save(); ctx.translate(px,py+bob);
  ctx.fillStyle='rgba(80,60,40,0.18)'; ctx.beginPath(); ctx.ellipse(0,16,11,4,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#d4b0c8'; roundRect(-6+legS,6,5,10,3); ctx.fill(); roundRect(1-legS,6,5,10,3); ctx.fill();
  ctx.fillStyle='#f4c8d4'; roundRect(-9,-5,18,14,7); ctx.fill();
  ctx.fillStyle='#fce0e8'; roundRect(-5,0,10,9,4); ctx.fill();
  ctx.fillStyle='#f4c8d4'; roundRect(-13,-4+armS,5,10,3); ctx.fill(); roundRect(8,-4-armS,5,10,3); ctx.fill();
  if (state.bucket>0) {
    ctx.font='14px serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('🪣',18,2);
    ctx.fillStyle='#a8d8ea'; roundRect(12,8,12,4*(state.bucket/state.BUCKET_MAX),2); ctx.fill();
  }
  ctx.fillStyle='#fce8c8'; ctx.beginPath(); ctx.arc(0,-14,10,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#d4944a'; ctx.beginPath(); ctx.arc(0,-18,9,Math.PI,0); ctx.fill();
  ctx.beginPath(); ctx.arc(-8,-14,5,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(8,-14,5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#c8b4f4'; roundRect(-10,-28,20,9,4); ctx.fill(); roundRect(-7,-34,14,8,4); ctx.fill();
  ctx.fillStyle='#f4a5b5'; ctx.beginPath(); ctx.arc(-2,-31,3.5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#fff070'; ctx.beginPath(); ctx.arc(-2,-31,1.8,0,Math.PI*2); ctx.fill();
  if (player.facing!==1) {
    ctx.fillStyle='#7a5848';
    ctx.beginPath(); ctx.arc(-3.5,-15,1.8,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(3.5,-15,1.8,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(244,165,181,0.55)';
    ctx.beginPath(); ctx.arc(-5.5,-12,3.5,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(5.5,-12,3.5,0,Math.PI*2); ctx.fill();
  }
  if (state.bucket===0) { ctx.font='13px serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(TOOL_ICONS[state.tool]||'⛏️',16,-8); }
  ctx.restore();
}

// ── Movement ───────────────────────────────────────
function updatePlayer(dt) {
  let dx=0,dy=0;
  if (keys['ArrowLeft']||keys['KeyA'])  { dx-=1; player.facing=2; }
  if (keys['ArrowRight']||keys['KeyD']) { dx+=1; player.facing=3; }
  if (keys['ArrowUp']||keys['KeyW'])    { dy-=1; player.facing=1; }
  if (keys['ArrowDown']||keys['KeyS'])  { dy+=1; player.facing=0; }
  if (joystickState.active) { dx=joystickState.dx; dy=joystickState.dy; }
  if (!joystickState.active&&dx&&dy) { dx*=0.707; dy*=0.707; }
  player.moving=Math.abs(dx)>0.01||Math.abs(dy)>0.01;
  if (player.moving) player.walkFrame++;
  const spd=player.speed*dt, R=12;
  const nx=player.x+dx*spd, ny=player.y+dy*spd;
  if (canWalk(nx,player.y,R)) player.x=nx;
  if (canWalk(player.x,ny,R)) player.y=ny;
  player.x=Math.max(R,Math.min(COLS*TILE-R,player.x));
  player.y=Math.max(R,Math.min(ROWS*TILE-R,player.y));
}
function canWalk(px,py,r) {
  for (const [cx,cy] of [[px-r,py-r],[px+r,py-r],[px-r,py+r],[px+r,py+r]]) {
    const cell=tileAt(Math.floor(cy/TILE),Math.floor(cx/TILE));
    if (!cell||!cell.walkable) return false;
  }
  return true;
}

// ── Use Tool ───────────────────────────────────────
function useTool() {
  const {r,c}=facingTile(), cell=tileAt(r,c);
  if (!cell) return;

  // Talk to merchant
  if (r===MERCHANT.tile.r&&c===MERCHANT.tile.c) {
    if (isMerchantPresent()) { openQuestPanel(); return; }
    else { notify('🧙 Barnaby is no longer here…'); return; }
  }

  const tool=state.tool;
  if (tool==='hoe') {
    if (cell.base!=='G'&&cell.base!=='S') { notify('💬 Can only till grass or soil!'); return; }
    if (cell.tilled) { notify('💬 Already tilled!'); return; }
    cell.tilled=true;
    trackAction('till', null);
    notify('⛏️ Tilled!'); saveGame();
  }
  else if (tool==='water') {
    if (cell.base==='W') {
      if (state.bucket>=state.BUCKET_MAX) { notify('🪣 Bucket already full!'); return; }
      state.bucket=state.BUCKET_MAX; updateHUD();
      notify(`🪣 Bucket filled! (${state.bucket}/${state.BUCKET_MAX} uses)`); return;
    }
    if (!cell.tilled)       { notify('💬 Till the soil first!'); return; }
    if (cell.watered)       { notify('💧 Already watered!'); return; }
    if (state.bucket<=0)    { notify('🪣 No water! Face the lake & press Space.'); return; }
    cell.watered=true; if (cell.crop) cell.crop.watered=true;
    state.bucket--; updateHUD();
    trackAction('water', null);
    notify(`💧 Watered! (${state.bucket}/${state.BUCKET_MAX} left)`); saveGame();
  }
  else if (tool==='harvest') {
    if (!cell.crop||cell.crop.stage<2) { notify('💬 Nothing ready here!'); return; }
    const def=CROPS[cell.crop.kind];
    state.coins+=def.reward; state.cropsTotal++;
    spawnFloatText(`+${def.reward}🪙`,r,c);
    const kind=cell.crop.kind;
    cell.crop=null; cell.tilled=false; cell.watered=false;
    updateHUD();
    trackAction('harvest', kind);
    notify(`🧺 Harvested ${def.name}! +${def.reward}🪙`); saveGame();
  }
  else if (tool.startsWith('seed-')) {
    const kind=tool.replace('seed-',''), def=CROPS[kind];
    if (!cell.tilled)           { notify('💬 Till first!'); return; }
    if (cell.crop)              { notify('💬 Already planted!'); return; }
    if (state.coins<def.cost)   { notify(`💬 Need ${def.cost}🪙!`); return; }
    state.coins-=def.cost;
    cell.crop={ kind, stage:0, daysPlanted:state.day, watered:cell.watered };
    updateHUD();
    trackAction('plant', kind);
    notify(`🌱 Planted ${def.name}!`); saveGame();
  }
}

// ── Key Handler ────────────────────────────────────
function onKeyDown(e) {
  if (e.code==='Escape') { closeQuestPanel(); return; }
  if (state.questPanelOpen) return; // block game keys while panel open
  if (e.code==='Space'||e.code==='KeyF') { e.preventDefault(); useTool(); return; }
  const digit=parseInt(e.key);
  if (digit>=1&&digit<=TOOL_LIST.length) selectTool(TOOL_LIST[digit-1]);
}

// ── Tool Selection ─────────────────────────────────
function selectTool(t) {
  state.tool=t;
  document.querySelectorAll('.tool-btn').forEach(b=>b.classList.toggle('active',b.dataset.tool===t));
  const icon=document.getElementById('mobile-tool-icon');
  const name=document.getElementById('mobile-tool-name');
  if (icon) icon.textContent=TOOL_ICONS[t]||'⛏️';
  if (name) name.textContent=TOOL_NAMES[t]||t;
}
document.querySelectorAll('.tool-btn').forEach(btn=>btn.addEventListener('click',()=>selectTool(btn.dataset.tool)));

// ── Mobile ─────────────────────────────────────────
const joystickState = { dx:0, dy:0, active:false };
const CTRL_POS_KEY = 'meadowfarm_ctrl_pos';

function setupMobile() {
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  if (!isTouch) return;

  const joystickZone = document.getElementById('joystick-zone');
  const actionZone   = document.getElementById('action-zone');
  const btnRepos     = document.getElementById('btn-reposition');
  const btnDone      = document.getElementById('btn-reposition-done');
  const hint         = document.getElementById('reposition-hint');

  // Show all mobile elements
  joystickZone.style.display = 'block';
  actionZone.style.display   = 'flex';
  btnRepos.style.display     = 'block';

  // Restore saved positions
  try {
    const saved = JSON.parse(localStorage.getItem(CTRL_POS_KEY) || '{}');
    if (saved.joy) { joystickZone.style.left = saved.joy.l; joystickZone.style.bottom = saved.joy.b; joystickZone.style.top = saved.joy.t || ''; }
    if (saved.act) { actionZone.style.right  = ''; actionZone.style.left = saved.act.l; actionZone.style.bottom = saved.act.b; actionZone.style.top = saved.act.t || ''; }
  } catch(e) {}

  // ── Joystick ────────────────────────────────────
  const base  = document.getElementById('joystick-base');
  const knob  = document.getElementById('joystick-knob');
  const baseR = 60, knobR = 24, dz = 0.18;
  let joyTouchId = null;

  function joyCenter() { const r = base.getBoundingClientRect(); return { x: r.left+r.width/2, y: r.top+r.height/2 }; }
  function moveKnob(cx, cy) {
    const ctr = joyCenter();
    let dx = cx - ctr.x, dy = cy - ctr.y;
    const dist = Math.sqrt(dx*dx+dy*dy), md = baseR - knobR;
    if (dist > md) { dx = dx/dist*md; dy = dy/dist*md; }
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    const nx = dx/md, ny = dy/md;
    joystickState.dx = Math.abs(nx) > dz ? nx : 0;
    joystickState.dy = Math.abs(ny) > dz ? ny : 0;
    joystickState.active = true;
    const ax = Math.abs(joystickState.dx), ay = Math.abs(joystickState.dy);
    if (ax > dz || ay > dz) player.facing = ax > ay ? (joystickState.dx > 0 ? 3 : 2) : (joystickState.dy > 0 ? 0 : 1);
  }
  function releaseKnob() { joyTouchId = null; knob.style.transform = 'translate(-50%,-50%)'; joystickState.dx = joystickState.dy = 0; joystickState.active = false; }

  base.addEventListener('touchstart', e => { e.preventDefault(); if (repositioning) return; if (joyTouchId !== null) return; const t = e.changedTouches[0]; joyTouchId = t.identifier; moveKnob(t.clientX, t.clientY); }, { passive:false });
  base.addEventListener('touchmove',  e => { e.preventDefault(); if (repositioning) return; for (const t of e.changedTouches) if (t.identifier === joyTouchId) { moveKnob(t.clientX, t.clientY); break; } }, { passive:false });
  base.addEventListener('touchend',   e => { for (const t of e.changedTouches) if (t.identifier === joyTouchId) { releaseKnob(); break; } }, { passive:false });
  base.addEventListener('touchcancel', releaseKnob, { passive:false });

  // ── Action button ────────────────────────────────
  document.getElementById('btn-action').addEventListener('touchstart', e => { e.preventDefault(); if (!repositioning) useTool(); }, { passive:false });
  document.getElementById('btn-action').addEventListener('click', () => { if (!repositioning) useTool(); });

  // ── Tool switcher ────────────────────────────────
  let toolIdx = TOOL_LIST.indexOf(state.tool);
  function bumpTool(d) { toolIdx = (toolIdx + d + TOOL_LIST.length) % TOOL_LIST.length; selectTool(TOOL_LIST[toolIdx]); }
  document.getElementById('tool-prev').addEventListener('click', () => bumpTool(-1));
  document.getElementById('tool-next').addEventListener('click', () => bumpTool(+1));
  document.querySelectorAll('.tool-btn').forEach(btn => btn.addEventListener('click', () => { toolIdx = TOOL_LIST.indexOf(btn.dataset.tool); }));

  // ── Reposition mode ──────────────────────────────
  let repositioning = false;

  function makeDraggable(el) {
    let dragTouchId = null, startTX, startTY, startLeft, startTop;

    el.addEventListener('touchstart', e => {
      if (!repositioning) return;
      e.preventDefault(); e.stopPropagation();
      if (dragTouchId !== null) return;
      const t = e.changedTouches[0];
      dragTouchId = t.identifier;
      const rect = el.getBoundingClientRect();
      startLeft = rect.left;
      startTop  = rect.top;
      startTX   = t.clientX;
      startTY   = t.clientY;
      el.style.right  = '';
      el.style.bottom = '';
      el.style.left   = startLeft + 'px';
      el.style.top    = startTop  + 'px';
    }, { passive:false });

    document.addEventListener('touchmove', e => {
      if (!repositioning || dragTouchId === null) return;
      for (const t of e.changedTouches) {
        if (t.identifier !== dragTouchId) continue;
        e.preventDefault();
        const newL = startLeft + (t.clientX - startTX);
        const newT = startTop  + (t.clientY - startTY);
        // Clamp to viewport
        const W = window.innerWidth, H = window.innerHeight;
        const rw = el.offsetWidth, rh = el.offsetHeight;
        el.style.left = Math.max(0, Math.min(W - rw, newL)) + 'px';
        el.style.top  = Math.max(0, Math.min(H - rh, newT)) + 'px';
        break;
      }
    }, { passive:false });

    document.addEventListener('touchend', e => {
      for (const t of e.changedTouches) {
        if (t.identifier === dragTouchId) { dragTouchId = null; break; }
      }
    }, { passive:false });
  }

  makeDraggable(joystickZone);
  makeDraggable(actionZone);

  btnRepos.addEventListener('click', () => {
    repositioning = true;
    joystickZone.classList.add('repositioning');
    actionZone.classList.add('repositioning');
    btnRepos.style.display     = 'none';
    btnDone.style.display      = 'block';
    hint.style.display         = 'block';
  });

  btnDone.addEventListener('click', () => {
    repositioning = false;
    joystickZone.classList.remove('repositioning');
    actionZone.classList.remove('repositioning');
    btnDone.style.display  = 'none';
    hint.style.display     = 'none';
    btnRepos.style.display = 'block';
    // Save positions
    try {
      const jR = joystickZone.getBoundingClientRect();
      const aR = actionZone.getBoundingClientRect();
      localStorage.setItem(CTRL_POS_KEY, JSON.stringify({
        joy: { l: joystickZone.style.left, t: joystickZone.style.top, b: joystickZone.style.bottom },
        act: { l: actionZone.style.left,   t: actionZone.style.top,   b: actionZone.style.bottom },
      }));
    } catch(e) {}
  });
}

// ── Tooltip ────────────────────────────────────────
const tooltip=document.getElementById('tooltip');
canvas.addEventListener('mousemove',e=>{
  const rect=canvas.getBoundingClientRect();
  const c=Math.floor((e.clientX-rect.left)*(canvas.width/rect.width)/TILE);
  const r=Math.floor((e.clientY-rect.top)*(canvas.height/rect.height)/TILE);
  const cell=tileAt(r,c); if (!cell) { tooltip.classList.remove('visible'); return; }
  let tip='';
  if (r===MERCHANT.tile.r&&c===MERCHANT.tile.c&&isMerchantPresent()) tip='🧙 Barnaby — face him & press Space to talk!';
  else if (cell.crop) { const def=CROPS[cell.crop.kind]; tip=`${def.name} — ${['Seedling 🌱','Growing 🌿','Ready! ✨'][cell.crop.stage]} ${cell.crop.watered?'💧':'🏜️'}`; }
  else if (cell.tilled) tip=cell.watered?'✅ Wet — plant something!':'🌾 Tilled — needs water';
  else if (cell.base==='W') tip='🪣 Lake — face it with Water tool & press Space';
  else if (cell.base==='T') tip='🌳 Tree';
  else if (cell.base==='P') tip='Stone path';
  else tip='Grass — hoe to till';
  tooltip.textContent=tip;
  tooltip.style.left=(e.clientX+14)+'px'; tooltip.style.top=(e.clientY-30)+'px';
  tooltip.classList.add('visible');
});
canvas.addEventListener('mouseleave',()=>tooltip.classList.remove('visible'));

// ── HUD ────────────────────────────────────────────
function updateHUD() {
  document.getElementById('stat-crops').textContent=state.cropsTotal;
  document.getElementById('stat-coins').textContent=state.coins;
  document.getElementById('stat-day').textContent=state.day;
  document.getElementById('stat-water').textContent=state.bucket;
}

// ── Notification ───────────────────────────────────
let notifTimer;
function notify(msg) {
  const el=document.getElementById('notif');
  el.textContent=msg; el.classList.add('show');
  clearTimeout(notifTimer); notifTimer=setTimeout(()=>el.classList.remove('show'),2400);
}

// ── Float Text ─────────────────────────────────────
function spawnFloatText(text,r,c) {
  const rect=canvas.getBoundingClientRect();
  const x=rect.left+(c*TILE+TILE/2)*(rect.width/canvas.width);
  const y=rect.top+(r*TILE+TILE/2)*(rect.height/canvas.height);
  const el=document.createElement('div');
  el.className='float-text'; el.textContent=text; el.style.left=x+'px'; el.style.top=y+'px';
  document.body.appendChild(el); setTimeout(()=>el.remove(),1100);
}
function spawnFloatTextScreen(text) {
  const el=document.createElement('div');
  el.className='float-text'; el.textContent=text;
  el.style.left='50%'; el.style.top='40%'; el.style.transform='translateX(-50%)'; el.style.fontSize='20px';
  document.body.appendChild(el); setTimeout(()=>el.remove(),1400);
}

// ── Particles ──────────────────────────────────────
function spawnParticles() {
  const cont=document.getElementById('particles');
  const cols=['#f4b8c8','#ffd870','#c8e6a0','#c8b4f4','#a8d8ea','#ffddb0'];
  for (let i=0;i<20;i++) {
    const p=document.createElement('div'); p.className='particle';
    const sz=4+Math.random()*7;
    p.style.cssText=`width:${sz}px;height:${sz}px;left:${Math.random()*100}%;bottom:${Math.random()*20-10}px;background:${cols[Math.floor(Math.random()*cols.length)]};animation-duration:${9+Math.random()*14}s;animation-delay:${Math.random()*14}s;`;
    cont.appendChild(p);
  }
}

// ── Music ──────────────────────────────────────────
const bgMusic=document.getElementById('bg-music'); let musicPlaying=false;
document.getElementById('btn-music-toggle').addEventListener('click',()=>{
  const btn=document.getElementById('btn-music-toggle');
  if (musicPlaying) { bgMusic.pause(); btn.textContent='🎵'; btn.classList.add('muted'); musicPlaying=false; }
  else { bgMusic.volume=0.5; bgMusic.play().catch(()=>{}); btn.textContent='🔇'; btn.classList.remove('muted'); musicPlaying=true; }
});
function startMusicOnce() {
  if (!musicPlaying) { bgMusic.volume=0.5; bgMusic.play().then(()=>{ musicPlaying=true; document.getElementById('btn-music-toggle').textContent='🔇'; document.getElementById('btn-music-toggle').classList.remove('muted'); }).catch(()=>{}); }
}
document.addEventListener('keydown',startMusicOnce,{once:true});
document.addEventListener('click',startMusicOnce,{once:true});
document.addEventListener('touchstart',startMusicOnce,{once:true});

// ── Render ─────────────────────────────────────────
function render() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) drawTile(r,c);
  for (const [r,c,col,ox,oy] of FLOWER_DEFS) drawFlower(r,c,col,ox,oy);
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) if (MAP_DEF[r][c]==='T') drawTree(r,c);
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) drawCrop(r,c);
  drawMerchant();
  drawFacingHighlight();
  drawPlayer();
  drawNightOverlay();
}

// ── Game Loop ──────────────────────────────────────
let lastTime=0;
function loop(ts) {
  const dt=Math.min((ts-lastTime)/16.67,3); lastTime=ts;
  updatePlayer(dt); updateDayNight(dt); render();
  requestAnimationFrame(loop);
}

// ── Init ───────────────────────────────────────────
initGrid();
const loaded=loadGame();
if (state.quests.length===0) initQuests();
spawnParticles();
setupMobile();
updateHUD();
selectTool(state.tool);
requestAnimationFrame(loop);

setTimeout(()=>{
  if (loaded) notify(`🌸 Welcome back! Day ${state.day} — ${state.coins}🪙`);
  else notify('🌸 Welcome! WASD=move, Space=use tool, talk to Barnaby 🧙 for quests!');
},400);
