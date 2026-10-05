/**
 * LIFE OS // THE SYSTEM - Main Application Controller
 * Grounded gamification with Left-Hand Sidebar, Live Date, and Dear Diary
 */

import { audio } from './audio.js';
import { 
  renderWeeklyTrendChart,
  renderWorkoutHistoryChart,
  renderProteinHistoryChart,
  renderMoodHistoryChart,
  renderCareerHistoryChart,
  renderCampaignHeatmap
} from './charts.js';
import { renderRadarChart } from './radar.js';
import { loadState, saveState, calculateRank, getHistoricalTimeline } from './storage.js';
import { 
  getCloudConfig, 
  saveCloudConfig, 
  isCloudConfigured, 
  onSyncStatusChange, 
  testCloudConnection, 
  pushStateToCloud, 
  pullStateFromCloud 
} from './sync.js';

let state = loadState();

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupLiveDates();
  setupAudioControls();
  setupMidnightCountdown();
  setupEmergencyProtocol();
  setupCravingSurfer();
  setupBreachModal();
  setupDiaryModule();
  setupWorkoutModule();
  setupRoutinesModule();
  setupAuraModule();
  setupApexCareerModule();
  setupShopModule();
  setupSettingsModule();
  setupLevelUpModal();
  initFreezeEventListeners();
  setupCloudSync();

  renderAll();

  // Periodic second-by-second updates
  setInterval(() => {
    updateMidnightCountdown();
    updateSmokeRecoveryMeters();
    updatePurityStreakDisplay();
  }, 1000);

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const dashTab = document.getElementById('tab-dashboard');
      if (dashTab && dashTab.classList.contains('active')) {
        renderDashboardAnalytics();
      }
    }, 150);
  });
});

// ==========================================================================
// LIVE DATE DISPLAY
// ==========================================================================
function setupLiveDates() {
  const now = new Date();
  const optionsShort = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
  const optionsLong = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

  const shortStr = now.toLocaleDateString('en-US', optionsShort);
  const longStr = now.toLocaleDateString('en-US', optionsLong);

  const sidebarDate = document.getElementById('live-date-str');
  if (sidebarDate) sidebarDate.innerText = shortStr;

  const headerDate = document.getElementById('header-full-date');
  if (headerDate) headerDate.innerText = longStr;

  const diaryDate = document.getElementById('diary-current-date-label');
  if (diaryDate) diaryDate.innerText = longStr;
}

// ==========================================================================
// RENDER & UI SYNC
// ==========================================================================
function renderAll() {
  renderHud();
  updateFreezeStatusAndBanner();
  renderDashboardAnalytics();
  renderDiary();
  renderPillarPurity();
  renderPillarEngine();
  renderPillarForge();
  renderPillarHunter();
  renderPillarAura();
  renderPillarApex();
  renderQuestLog();
  renderShop();
}

function renderHud() {
  const { player } = state;
  const rankInfo = calculateRank(player.level);
  player.rank = rankInfo.rank;
  player.title = rankInfo.title;

  // Top Bar Player Identity & Rank
  const hudName = document.getElementById('hud-player-name');
  if (hudName) hudName.innerText = player.name || 'Suhas S';
  const hudRank = document.getElementById('hud-player-rank');
  if (hudRank) hudRank.innerText = `Rank ${player.rank}`;

  // Level & XP
  const lvlEl = document.getElementById('hud-player-level');
  if (lvlEl) lvlEl.innerText = player.level;
  const xpEl = document.getElementById('hud-xp-ratio');
  if (xpEl) xpEl.innerText = `${player.xp} / ${player.xpRequired} XP`;
  const xpFill = document.getElementById('hud-xp-fill');
  if (xpFill) {
    const xpPct = Math.min((player.xp / player.xpRequired) * 100, 100);
    xpFill.style.width = `${xpPct}%`;
  }

  // Sidebar Player Snippet
  const sbLvl = document.getElementById('sidebar-player-level');
  if (sbLvl) sbLvl.innerText = player.level;
  const sbName = document.getElementById('sidebar-player-name');
  if (sbName) sbName.innerText = (player.name || 'Suhas S').toUpperCase();
  const sbRank = document.getElementById('sidebar-rank-text');
  if (sbRank) sbRank.innerText = `Rank ${player.rank}`;
  const sbTitle = document.getElementById('sidebar-player-title');
  if (sbTitle) sbTitle.innerText = `Rank ${player.rank}`;

  // Currencies
  const goldEl = document.getElementById('hud-gold-val');
  if (goldEl) goldEl.innerText = player.gold;
  const savedCashEl = document.getElementById('hud-saved-cash');
  if (savedCashEl) {
    const totalSaved = state.pillarEngine.moneySaved || 0;
    savedCashEl.innerText = totalSaved.toLocaleString();
  }
}

// ==========================================================================
// DASHBOARD ANALYTICS & PROGRESS CENTER
// ==========================================================================
function renderDashboardAnalytics() {
  // 1. Top KPI Cards
  const purStreak = state.pillarPurity.streakDays || 0;
  const purEl = document.getElementById('dash-kpi-purity');
  if (purEl) purEl.innerText = `${purStreak} ${purStreak === 1 ? 'Day' : 'Days'}`;
  const purSub = document.getElementById('dash-kpi-purity-sub');
  if (purSub) {
    const nextM = purStreak < 3 ? 'Milestone: Day 3 (Clear Mind)' : purStreak < 7 ? 'Milestone: Day 7 (Willpower)' : 'Milestone: Day 14 (Dopamine Reset)';
    purSub.innerText = nextM;
  }

  const smokeEl = document.getElementById('dash-kpi-smoke');
  const smokeSub = document.getElementById('dash-kpi-smoke-sub');
  const campaignStart = new Date('2026-10-05T00:00:00').getTime();
  const smokeStart = state.pillarEngine?.smokeFreeStartTimestamp || campaignStart;
  const diffMs = Math.max(Date.now() - smokeStart, 0);
  const diffHours = diffMs / 3600000;
  const smokeDays = Math.floor(diffHours / 24);
  const smokeRemHours = Math.floor(diffHours % 24);

  if (smokeEl) {
    smokeEl.innerText = smokeDays > 0 ? `${smokeDays}d ${smokeRemHours}h Clean` : `${Math.floor(diffHours)}h Clean`;
  }
  if (smokeSub) {
    smokeSub.innerText = `${state.pillarEngine?.cigsAvoidedCount || 0} Cigs Avoided (₹${(state.pillarEngine?.moneySaved || 0).toLocaleString()} Saved)`;
  }

  const gymEl = document.getElementById('dash-kpi-gym');
  const gymSub = document.getElementById('dash-kpi-gym-sub');
  if (gymEl) gymEl.innerText = `${state.pillarForge?.workoutsDone || 0} Workouts`;
  if (gymSub) gymSub.innerText = `Streak: ${state.pillarForge?.currentStreak || 0} • Bench: ${state.pillarForge?.benchPr || 50}kg`;

  const careerTracks = state.pillarApex?.tracks || [];
  const careerDoneCount = careerTracks.filter(t => t.done).length;
  const careerEl = document.getElementById('dash-kpi-career');
  const careerSub = document.getElementById('dash-kpi-career-sub');
  if (careerEl) {
    const careerPct = Math.round((careerDoneCount / Math.max(careerTracks.length, 1)) * 100);
    careerEl.innerText = `${careerPct}% Done`;
  }
  if (careerSub) {
    careerSub.innerText = `${careerDoneCount}/5 Tracks • Target: 15+ LPA FMCG Role`;
  }

  // 2. Flagship Chart 1: 6-Attribute System Radar Chart
  if (state.stats) {
    renderRadarChart('stats-radar-canvas', state.stats);
    const rPur = document.getElementById('r-stat-pur'); if (rPur) rPur.innerText = state.stats.pur || 10;
    const rVit = document.getElementById('r-stat-vit'); if (rVit) rVit.innerText = state.stats.vit || 10;
    const rStr = document.getElementById('r-stat-str'); if (rStr) rStr.innerText = state.stats.str || 10;
    const rCha = document.getElementById('r-stat-cha'); if (rCha) rCha.innerText = state.stats.cha || 10;
    const rAura = document.getElementById('r-stat-aura'); if (rAura) rAura.innerText = state.stats.aura || 10;
    const rInt = document.getElementById('r-stat-int'); if (rInt) rInt.innerText = state.stats.int || 10;
  }

  // 3. Flagship Chart 2: 7-Day Consistency & Momentum Trend
  const timeline = getHistoricalTimeline(state, 7);
  renderWeeklyTrendChart('growth-trend-canvas', timeline);

  // 4. Card 1: Daily Routine & Nutrition Progress (from Daily Routine Page)
  const dawnTasks = state.pillarHunter?.dawnTasks || [];
  const dawnDone = dawnTasks.filter(t => t.done).length;
  const dawnPct = Math.round((dawnDone / Math.max(dawnTasks.length, 1)) * 100);
  const dawnRatioEl = document.getElementById('dash-dawn-ratio');
  if (dawnRatioEl) dawnRatioEl.innerText = `${dawnDone} / ${dawnTasks.length} Done`;
  const dawnBarEl = document.getElementById('dash-dawn-bar');
  if (dawnBarEl) dawnBarEl.style.width = `${dawnPct}%`;

  const nightTasks = state.pillarHunter?.nightTasks || [];
  const nightDone = nightTasks.filter(t => t.done).length;
  const nightPct = Math.round((nightDone / Math.max(nightTasks.length, 1)) * 100);
  const duskRatioEl = document.getElementById('dash-dusk-ratio');
  if (duskRatioEl) duskRatioEl.innerText = `${nightDone} / ${nightTasks.length} Done`;
  const duskBarEl = document.getElementById('dash-dusk-bar');
  if (duskBarEl) duskBarEl.style.width = `${nightPct}%`;

  const proteinVal = state.pillarHunter?.proteinGrams || 0;
  const proteinTarget = state.pillarHunter?.proteinTarget || 120;
  const proteinPct = Math.min(Math.round((proteinVal / proteinTarget) * 100), 100);
  const proteinValEl = document.getElementById('dash-protein-val');
  if (proteinValEl) proteinValEl.innerText = `${proteinVal} / ${proteinTarget}g (${proteinPct}%)`;
  const proteinBarEl = document.getElementById('dash-protein-bar');
  if (proteinBarEl) proteinBarEl.style.width = `${proteinPct}%`;

  const skinGlowVal = typeof state.pillarHunter?.skinGlow === 'number' ? state.pillarHunter.skinGlow : 0;
  const skinGlowValEl = document.getElementById('dash-skin-glow-val');
  if (skinGlowValEl) skinGlowValEl.innerText = `${skinGlowVal}% Glow`;
  const skinGlowBarEl = document.getElementById('dash-skin-glow-bar');
  if (skinGlowBarEl) skinGlowBarEl.style.width = `${skinGlowVal}%`;

  const junkClaimed = state.pillarHunter?.antiJunkClaimed || false;
  const junkTextEl = document.getElementById('dash-anti-junk-text');
  if (junkTextEl) {
    junkTextEl.innerText = junkClaimed ? 'Clean Fuel Shield: Active Today (Zero Junk Food)' : 'Clean Fuel Shield: Ready to Claim (+50 XP)';
  }
  const junkPillEl = document.getElementById('dash-anti-junk-pill');
  if (junkPillEl) {
    junkPillEl.style.borderColor = junkClaimed ? 'rgba(34, 197, 94, 0.4)' : 'rgba(255, 255, 255, 0.08)';
  }

  const routineScoreBadge = document.getElementById('dash-routine-score-badge');
  if (routineScoreBadge) {
    const totalTasks = dawnTasks.length + nightTasks.length;
    const totalDone = dawnDone + nightDone;
    const overallRoutinePct = Math.round((totalDone / Math.max(totalTasks, 1)) * 100);
    routineScoreBadge.innerText = `${overallRoutinePct}% Completed`;
  }

  // Multi-day protein intake vs 120g benchmark curve
  renderProteinHistoryChart('dash-protein-history-canvas', timeline);

  // 5. Card 2: Fitness & Body Progress (from Fitness & Body Page)
  const weeklySched = state.pillarForge?.weeklySchedule || {};
  const todayDayNum = new Date().getDay(); // 0: Sunday, 1: Monday...
  const daysOrder = [1, 2, 3, 4, 5, 6, 0];
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const splitChartRow = document.getElementById('dash-split-chart-row');
  let splitCompletedCount = 0;
  if (splitChartRow) {
    splitChartRow.innerHTML = daysOrder.map((dNum, idx) => {
      const s = weeklySched[dNum] || { day: dayLabels[idx], split: 'Training', done: false };
      if (s.done) splitCompletedCount++;
      const isToday = dNum === todayDayNum;
      return `
        <div class="wsc-col ${isToday ? 'today' : ''} ${s.done ? 'done' : ''}" title="${s.day}: ${s.split}">
          <span class="wsc-day">${dayLabels[idx]}</span>
          <span class="wsc-split">${s.split || 'PPL'}</span>
          <span class="wsc-status">${s.done ? '✓' : isToday ? 'TODAY' : '•'}</span>
        </div>
      `;
    }).join('');
  }

  const splitCompletedEl = document.getElementById('dash-split-completed-count');
  if (splitCompletedEl) splitCompletedEl.innerText = `${splitCompletedCount} / 7`;

  const strengthList = state.pillarForge?.strengthExercises || [];
  const strengthDone = strengthList.filter(e => e.done).length;
  const strengthSummaryEl = document.getElementById('dash-strength-summary');
  if (strengthSummaryEl) {
    strengthSummaryEl.innerText = `${strengthDone} / ${strengthList.length} Sets Logged`;
  }
  const strengthBarEl = document.getElementById('dash-strength-bar');
  if (strengthBarEl) {
    const strPct = strengthList.length ? Math.round((strengthDone / strengthList.length) * 100) : 0;
    strengthBarEl.style.width = `${strPct}%`;
  }

  const workoutsCountEl = document.getElementById('dash-workouts-count');
  if (workoutsCountEl) workoutsCountEl.innerText = state.pillarForge?.workoutsDone || 0;
  const workoutsStreakEl = document.getElementById('dash-workouts-streak');
  if (workoutsStreakEl) workoutsStreakEl.innerText = state.pillarForge?.currentStreak || 0;

  const forgeStatusBadge = document.getElementById('dash-forge-status-badge');
  if (forgeStatusBadge) {
    const todaySchedule = weeklySched[todayDayNum];
    forgeStatusBadge.innerText = todaySchedule ? todaySchedule.split.toUpperCase() : 'ACTIVE';
  }

  // Multi-day workout & training frequency bar chart
  renderWorkoutHistoryChart('dash-workout-history-canvas', timeline);

  // 6. Card 3: Career Engine Progress (from Career Engine Page)
  const careerTracksList = document.getElementById('dash-career-tracks-list');
  if (careerTracksList) {
    careerTracksList.innerHTML = careerTracks.map(t => `
      <div class="dct-item ${t.done ? 'done' : ''}">
        <div class="dct-info">
          <span class="dct-num">T${t.trackNum}</span>
          <span class="dct-title">${t.title}</span>
        </div>
        <span class="dct-badge ${t.done ? 'done' : 'pending'}">
          ${t.done ? '✓ DONE (+' + t.xp + ' XP)' : 'PENDING'}
        </span>
      </div>
    `).join('');
  }

  const careerGateBadge = document.getElementById('dash-career-gate-badge');
  if (careerGateBadge) careerGateBadge.innerText = `${careerDoneCount} / 5 Done`;

  const careerOverallPct = Math.round((careerDoneCount / Math.max(careerTracks.length, 1)) * 100);
  const careerGatePct = document.getElementById('dash-career-gate-pct');
  if (careerGatePct) careerGatePct.innerText = `${careerOverallPct}% Cleared (15+ LPA Gate)`;
  const careerGateFill = document.getElementById('dash-career-gate-fill');
  if (careerGateFill) careerGateFill.style.width = `${careerOverallPct}%`;

  // 5-Track Execution Multi-Day Sprint Chart
  renderCareerHistoryChart('dash-career-history-canvas', timeline);

  // 7. Card 4: Character & Mindset Progress (from Character & Mindset Page)
  const moodVal = state.pillarAura?.dailyMoodScore || 8;
  const moodValEl = document.getElementById('dash-mood-val');
  if (moodValEl) moodValEl.innerText = `${moodVal} / 10`;
  const moodFillEl = document.getElementById('dash-mood-fill');
  if (moodFillEl) moodFillEl.style.width = `${moodVal * 10}%`;

  const moodDescEl = document.getElementById('dash-mood-desc');
  if (moodDescEl) {
    const moodDescriptions = {
      1: 'Low Dopamine • Needs Physical Grounding & Stillness',
      2: 'High Agitation • Step Away, Breathe & Reset',
      3: 'Mental Fog • Hydrate, Cold Splash & Walk',
      4: 'Restless Urges • Stand Tall & Remember Your Vow',
      5: 'Neutral Observer • Moving Calmly & Without Reaction',
      6: 'Steadily Focused • Building Inner Stability',
      7: 'High Composure • Dignified & Unbothered',
      8: 'Grounded & Focused • Calm Sovereign Presence',
      9: 'Peak Vitality • High Standards & Electric Energy',
      10: 'The Sovereign Apex • Zero Needs, Pure Authority'
    };
    moodDescEl.innerText = moodDescriptions[moodVal] || 'Calm Sovereign Presence';
  }

  // Stoic Mood & Frequency Trend Curve (1 to 10)
  renderMoodHistoryChart('dash-mood-history-canvas', timeline);

  const auraTasks = state.pillarAura?.auraTasks || [];
  const auraDone = auraTasks.filter(t => t.done).length;
  const auraRatioEl = document.getElementById('dash-aura-habits-ratio');
  if (auraRatioEl) auraRatioEl.innerText = `${auraDone} / ${auraTasks.length} Active`;
  const auraFillEl = document.getElementById('dash-aura-habits-fill');
  if (auraFillEl) {
    const auraPct = Math.round((auraDone / Math.max(auraTasks.length, 1)) * 100);
    auraFillEl.style.width = `${auraPct}%`;
  }

  const isGratitudeSealed = Boolean(state.pillarAura?.gratitudeSealedDate);
  const gratitudeStatusEl = document.getElementById('dash-gratitude-status');
  if (gratitudeStatusEl) {
    gratitudeStatusEl.innerText = isGratitudeSealed ? 'Gratitude to God: Sealed Today (+75 XP)' : 'Gratitude to God: Pending Today';
  }
  const gratitudePillEl = document.getElementById('dash-gratitude-pill');
  if (gratitudePillEl) {
    gratitudePillEl.style.borderColor = isGratitudeSealed ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255, 255, 255, 0.08)';
  }

  // 8. Card 5: Purity & Control Progress (from Purity Page)
  const purStreakVal = state.pillarPurity?.streakDays || 0;
  const purityBadge = document.getElementById('dash-purity-streak-badge');
  if (purityBadge) purityBadge.innerText = `${purStreakVal} Clean Day${purStreakVal === 1 ? '' : 's'}`;

  const milestoneDays = [3, 7, 14, 30, 90];
  milestoneDays.forEach(d => {
    const node = document.getElementById(`pms-${d}`);
    if (node) node.classList.toggle('reached', purStreakVal >= d);
  });

  let nextTarget = 3;
  if (purStreakVal >= 30) nextTarget = 90;
  else if (purStreakVal >= 14) nextTarget = 30;
  else if (purStreakVal >= 7) nextTarget = 14;
  else if (purStreakVal >= 3) nextTarget = 7;

  const nextMText = document.getElementById('dash-purity-next-label');
  if (nextMText) nextMText.innerText = `Progress to Day ${nextTarget} Milestone`;
  const nextMVal = document.getElementById('dash-purity-next-val');
  if (nextMVal) nextMVal.innerText = `${purStreakVal} / ${nextTarget} Days`;
  const nextMFill = document.getElementById('dash-purity-milestone-fill');
  if (nextMFill) {
    const pPct = Math.min(Math.round((purStreakVal / nextTarget) * 100), 100);
    nextMFill.style.width = `${pPct}%`;
  }

  // 9. Card 6: Smoke-Free Recovery (from Smoke-Free Page)
  const coPct = Math.min((diffHours / 8) * 100, 100);
  const coText = document.getElementById('dash-bio-co-text');
  if (coText) coText.innerText = `${Math.round(coPct)}% Cleared`;
  const coFill = document.getElementById('dash-bio-co-fill');
  if (coFill) coFill.style.width = `${coPct}%`;

  const nicPct = Math.min((diffHours / 72) * 100, 100);
  const nicText = document.getElementById('dash-bio-nic-text');
  if (nicText) nicText.innerText = `${Math.round(nicPct)}% Detox`;
  const nicFill = document.getElementById('dash-bio-nic-fill');
  if (nicFill) nicFill.style.width = `${nicPct}%`;

  const lungPct = Math.min((diffHours / 336) * 100, 100);
  const lungText = document.getElementById('dash-bio-lung-text');
  if (lungText) lungText.innerText = `${Math.round(lungPct)}% Rebuilding`;
  const lungFill = document.getElementById('dash-bio-lung-fill');
  if (lungFill) lungFill.style.width = `${lungPct}%`;

  const savedMoneyEl = document.getElementById('dash-saved-money-kpi');
  if (savedMoneyEl) savedMoneyEl.innerText = `₹${(state.pillarEngine?.moneySaved || 0).toLocaleString()}`;
  const cigsAvoidedEl = document.getElementById('dash-cigs-avoided-kpi');
  if (cigsAvoidedEl) cigsAvoidedEl.innerText = (state.pillarEngine?.cigsAvoidedCount || 0).toLocaleString();

  const smokeCleanBadge = document.getElementById('dash-smoke-clean-badge');
  if (smokeCleanBadge) {
    smokeCleanBadge.innerText = smokeDays > 0 ? `${smokeDays}d ${smokeRemHours}h Clean` : `${Math.floor(diffHours)}h Clean`;
  }

  // 10. Card 7: Daily Diary Progress & Reflections
  const diaryEntries = state.diaryEntries || [];
  const diaryCountBadge = document.getElementById('dash-diary-count-badge');
  if (diaryCountBadge) {
    diaryCountBadge.innerText = `${diaryEntries.length} ${diaryEntries.length === 1 ? 'Entry' : 'Entries'}`;
  }

  const todayStr = new Date().toDateString();
  const todayDiary = diaryEntries.find(e => {
    if (e.timestamp && new Date(e.timestamp).toDateString() === todayStr) return true;
    if (e.date && new Date(e.date).toDateString() === todayStr) return true;
    return false;
  });

  const cardDiaryStatus = document.getElementById('dash-card-diary-status');
  const cardDiaryText = document.getElementById('dash-card-diary-text');
  if (todayDiary) {
    if (cardDiaryStatus) {
      cardDiaryStatus.innerText = `Logged Today (${(todayDiary.mood || 'Sovereign').toUpperCase()})`;
      cardDiaryStatus.className = 'psc-mb-val neon-green';
    }
    if (cardDiaryText) {
      const snippet = todayDiary.text.length > 140 ? todayDiary.text.substring(0, 140) + '...' : todayDiary.text;
      cardDiaryText.innerHTML = `<strong>${escapeHtml(todayDiary.title || 'Today\'s Reflection')}:</strong> <em>"${escapeHtml(snippet)}"</em>`;
    }
  } else {
    if (cardDiaryStatus) {
      cardDiaryStatus.innerText = 'Pending Today';
      cardDiaryStatus.className = 'psc-mb-val neon-amber';
    }
    if (cardDiaryText) {
      cardDiaryText.innerText = 'No Daily Diary reflection recorded for today yet. Write down your honest thoughts, lessons, and wins to seal your mindset (+50 XP).';
    }
  }

  // 11. GitHub-Style Campaign Heatmap Grid
  renderCampaignHeatmap('campaign-heatmap-grid', state);

  // 12. Interactive Calendar View & Historical Protocol / Diary Inspector
  renderCalendarInspector();
}

let selectedCalendarDate = new Date();
let calendarViewMonth = selectedCalendarDate.getMonth();
let calendarViewYear = selectedCalendarDate.getFullYear();
let calendarControlsInitialized = false;

function initCalendarInspectorControls() {
  if (calendarControlsInitialized) return;
  calendarControlsInitialized = true;

  const prevBtn = document.getElementById('cal-prev-btn');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      calendarViewMonth--;
      if (calendarViewMonth < 0) {
        calendarViewMonth = 11;
        calendarViewYear--;
      }
      renderCalendarInspector();
      audio.playClick();
    });
  }

  const nextBtn = document.getElementById('cal-next-btn');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      calendarViewMonth++;
      if (calendarViewMonth > 11) {
        calendarViewMonth = 0;
        calendarViewYear++;
      }
      renderCalendarInspector();
      audio.playClick();
    });
  }

  const todayBtn = document.getElementById('cal-today-btn');
  if (todayBtn) {
    todayBtn.addEventListener('click', () => {
      selectedCalendarDate = new Date();
      calendarViewMonth = selectedCalendarDate.getMonth();
      calendarViewYear = selectedCalendarDate.getFullYear();
      renderCalendarInspector();
      audio.playClick();
    });
  }

  // Quick action buttons to open diary tab
  const btnDashWrite = document.getElementById('btn-dash-write-diary');
  if (btnDashWrite) {
    btnDashWrite.addEventListener('click', () => {
      switchTab('diary');
      const textInput = document.getElementById('diary-text-input');
      if (textInput) textInput.focus();
    });
  }

  const btnDashViewAll = document.getElementById('btn-dash-view-all-diary');
  if (btnDashViewAll) {
    btnDashViewAll.addEventListener('click', () => {
      switchTab('diary');
    });
  }

  const cdrOpenBtn = document.getElementById('cdr-open-diary-btn');
  if (cdrOpenBtn) {
    cdrOpenBtn.addEventListener('click', () => {
      switchTab('diary');
    });
  }
}

function renderCalendarInspector() {
  initCalendarInspectorControls();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthTitleEl = document.getElementById('cal-month-title');
  if (monthTitleEl) {
    monthTitleEl.innerText = `${monthNames[calendarViewMonth]} ${calendarViewYear}`;
  }

  const modeBadge = document.getElementById('cal-inspector-mode');
  if (modeBadge) {
    modeBadge.innerText = `${monthNames[calendarViewMonth].toUpperCase()} ${calendarViewYear}`;
  }

  const gridEl = document.getElementById('cal-days-grid');
  if (!gridEl) return;

  const firstDayIndex = new Date(calendarViewYear, calendarViewMonth, 1).getDay(); // 0 is Sunday
  const daysInCurrentMonth = new Date(calendarViewYear, calendarViewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(calendarViewYear, calendarViewMonth, 0).getDate();

  const history = state?.dailyHistory || {};
  const frozenDates = state?.frozenDates || {};
  const diaryEntries = state?.diaryEntries || [];
  const today = new Date();
  const todayDateStr = today.toDateString();
  const selDateStr = selectedCalendarDate.toDateString();

  let html = '';

  // 1. Previous month muted trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const prevDayNum = daysInPrevMonth - i;
    html += `<div class="cal-widget-day other-month">${prevDayNum}</div>`;
  }

  // 2. Current month days
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const currentCellDate = new Date(calendarViewYear, calendarViewMonth, day);
    const dateStr = currentCellDate.toDateString();
    const isToday = dateStr === todayDateStr;
    const isSelected = dateStr === selDateStr;
    const isFrozen = Boolean(frozenDates[dateStr]);
    const hasHistoryRecord = Boolean(history[dateStr]);
    const hasDiaryRecord = diaryEntries.some(e => {
      if (e.timestamp && new Date(e.timestamp).toDateString() === dateStr) return true;
      if (e.date && new Date(e.date).toDateString() === dateStr) return true;
      return false;
    });

    const hasData = hasHistoryRecord || hasDiaryRecord || (isToday && (state.player?.xp || 0) > 0);

    let classes = ['cal-widget-day'];
    if (isSelected) classes.push('cal-selected');
    if (isToday) classes.push('cal-today');

    let dotHtml = '';
    if (isFrozen) {
      dotHtml = '<span class="cal-dot dot-frozen" title="Stasis Freeze"></span>';
    } else if (hasData) {
      dotHtml = '<span class="cal-dot dot-has-data" title="Completed Protocol / Diary Log"></span>';
    }

    html += `
      <div class="${classes.join(' ')}" data-day="${day}" title="${currentCellDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}">
        <span>${day}</span>
        ${dotHtml}
      </div>
    `;
  }

  // 3. Next month muted leading days
  const totalRendered = firstDayIndex + daysInCurrentMonth;
  const totalSlots = totalRendered > 35 ? 42 : 35;
  const remaining = totalSlots - totalRendered;
  for (let nextDay = 1; nextDay <= remaining; nextDay++) {
    html += `<div class="cal-widget-day other-month">${nextDay}</div>`;
  }

  gridEl.innerHTML = html;

  // Click listeners on days
  gridEl.querySelectorAll('.cal-widget-day:not(.other-month)').forEach(cell => {
    cell.addEventListener('click', () => {
      const dayNum = parseInt(cell.getAttribute('data-day'), 10);
      selectedCalendarDate = new Date(calendarViewYear, calendarViewMonth, dayNum);
      renderCalendarInspector();
      audio.playClick();
    });
  });

  renderCalendarDayReport(selectedCalendarDate);
}

function renderCalendarDayReport(targetDate) {
  const dateTitleEl = document.getElementById('cdr-date-title');
  const statusBadge = document.getElementById('cdr-status-badge');
  const xpVal = document.getElementById('cdr-xp-val');
  const routineVal = document.getElementById('cdr-routine-val');
  const forgeVal = document.getElementById('cdr-forge-val');
  const careerVal = document.getElementById('cdr-career-val');
  const moodVal = document.getElementById('cdr-mood-val');
  const purityVal = document.getElementById('cdr-purity-val');
  const diaryMoodBadge = document.getElementById('cdr-diary-mood-badge');
  const diaryContent = document.getElementById('cdr-diary-content');

  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const fullDateStr = targetDate.toLocaleDateString('en-US', options);
  if (dateTitleEl) dateTitleEl.innerText = fullDateStr;

  const today = new Date();
  const isToday = targetDate.toDateString() === today.toDateString();
  const campaignStart = new Date('2026-10-05T00:00:00');
  const isBeforeLaunch = targetDate < campaignStart && !isToday;
  const targetDateKey = targetDate.toDateString();

  const history = state?.dailyHistory || {};
  const frozenDates = state?.frozenDates || {};
  const isFrozen = Boolean(frozenDates[targetDateKey]);
  const rec = history[targetDateKey];

  // Diary search for this specific calendar date
  const diaryEntries = state?.diaryEntries || [];
  const diaryEntry = diaryEntries.find(e => {
    if (e.timestamp && new Date(e.timestamp).toDateString() === targetDateKey) return true;
    if (e.date && new Date(e.date).toDateString() === targetDateKey) return true;
    return false;
  });

  if (isFrozen) {
    if (statusBadge) {
      statusBadge.className = 'badge-purple';
      statusBadge.innerText = 'STASIS FROZEN (+1 EXTENSION)';
    }
  } else if (isToday) {
    if (statusBadge) {
      statusBadge.className = targetDate < campaignStart ? 'badge-amber' : 'badge-cyan';
      statusBadge.innerText = targetDate < campaignStart ? 'PRE-CAMPAIGN // STARTS OCT 5' : 'TODAY (LIVE TRACKER)';
    }
  } else if (isBeforeLaunch) {
    if (statusBadge) {
      statusBadge.className = 'badge-slate';
      statusBadge.innerText = 'PRE-CAMPAIGN BASELINE';
    }
  } else if (rec) {
    if (statusBadge) {
      statusBadge.className = 'badge-green';
      statusBadge.innerText = 'ARCHIVED PROTOCOL RECORD';
    }
  } else {
    if (statusBadge) {
      statusBadge.className = targetDate > today ? 'badge-slate' : 'badge-amber';
      statusBadge.innerText = targetDate > today ? 'SCHEDULED PROTOCOL DAY' : 'UNLOGGED DAY';
    }
  }

  // Populate Metrics
  if (isToday) {
    const dawnDone = (state?.pillarHunter?.dawnTasks || []).filter(t => t.done).length;
    const nightDone = (state?.pillarHunter?.nightTasks || []).filter(t => t.done).length;
    const protein = state?.pillarHunter?.proteinGrams || 0;
    const gymDone = Boolean((state?.dailyChecklist || []).find(q => q.id === 'core_gym')?.done);
    const splitToday = state?.pillarForge?.weeklySchedule?.[today.getDay()]?.split || 'Active';
    const careerDone = (state?.pillarApex?.tracks || []).filter(t => t.done).length;
    const mood = state?.pillarAura?.dailyMoodScore || 0;
    const purStreak = state?.pillarPurity?.streakDays || 0;

    if (xpVal) xpVal.innerText = `${state?.player?.xp || 0} XP`;
    if (routineVal) routineVal.innerText = `${dawnDone + nightDone}/8 Tasks • ${protein}g`;
    if (forgeVal) forgeVal.innerText = gymDone ? `Done (${splitToday})` : `Pending (${splitToday})`;
    if (careerVal) careerVal.innerText = `${careerDone} / 5 Done`;
    if (moodVal) moodVal.innerText = mood > 0 ? `${mood} / 10` : '— / 10';
    if (purityVal) purityVal.innerText = `${purStreak}d Clean • Smoke-Free`;
  } else if (rec) {
    if (xpVal) xpVal.innerText = `${rec.xpEarned || 0} XP`;
    if (routineVal) routineVal.innerText = `${(rec.dawnDone || 0) + (rec.nightDone || 0)}/8 Tasks • ${rec.proteinGrams || 0}g`;
    if (forgeVal) forgeVal.innerText = rec.workoutCompleted ? 'Completed ✓' : 'Rest Day';
    if (careerVal) careerVal.innerText = `${rec.careerTracksDoneCount || 0} / 5 Done`;
    if (moodVal) moodVal.innerText = rec.dailyMoodScore ? `${rec.dailyMoodScore} / 10` : '— / 10';
    if (purityVal) purityVal.innerText = `${rec.purityStreak || 0}d Clean`;
  } else {
    if (xpVal) xpVal.innerText = '0 XP';
    if (routineVal) routineVal.innerText = '0 Tasks • 0g';
    if (forgeVal) forgeVal.innerText = 'Rest / Unlogged';
    if (careerVal) careerVal.innerText = '0 / 5 Done';
    if (moodVal) moodVal.innerText = '— / 10';
    if (purityVal) purityVal.innerText = 'Clean Baseline';
  }

  // Populate Dear Diary Reflection
  if (diaryEntry) {
    if (diaryMoodBadge) {
      diaryMoodBadge.className = 'badge-purple';
      diaryMoodBadge.innerText = (diaryEntry.mood || 'SOVEREIGN').toUpperCase();
    }
    if (diaryContent) {
      diaryContent.innerHTML = `
        <div class="cdr-diary-title">${escapeHtml(diaryEntry.title || 'Daily Diary Reflection')}</div>
        <div class="cdr-diary-text">${escapeHtml(diaryEntry.text)}</div>
      `;
    }
  } else {
    if (diaryMoodBadge) {
      diaryMoodBadge.className = 'badge-slate';
      diaryMoodBadge.innerText = 'NOT LOGGED';
    }
    if (diaryContent) {
      diaryContent.innerHTML = `
        <div class="cdr-empty-diary">
          <p id="cdr-empty-diary-msg">
            ${isToday 
              ? 'No Daily Diary reflection recorded for today yet. Click "Write / Open Diary" to document your truth (+50 XP).'
              : 'No Daily Diary reflection was recorded on this date.'}
          </p>
        </div>
      `;
    }
  }
}

function setGauge(prefix, pct, pctText, subText) {
  const pctEl = document.getElementById(`${prefix}-pct`);
  const fillEl = document.getElementById(`${prefix}-fill`);
  const subEl = document.getElementById(`${prefix}-sub`);
  if (pctEl) pctEl.innerText = pctText;
  if (fillEl) fillEl.style.width = `${Math.min(pct, 100)}%`;
  if (subEl) subEl.innerText = subText;
}

// ==========================================================================
// EXPERIENCE & LEVEL UP ENGINE
// ==========================================================================
export function getXpRequiredForLevel(level) {
  if (level <= 1) return 100;
  return 90 + (level * 8);
}

export function addXp(amount, sourceTitle = '') {
  state.player.xp += amount;
  audio.playChime();

  while (state.player.xp >= state.player.xpRequired) {
    state.player.xp -= state.player.xpRequired;
    state.player.level += 1;
    state.player.xpRequired = getXpRequiredForLevel(state.player.level);
    state.player.gold += 100;
    state.player.unallocatedStatPoints += 3;
    state.player.hp = state.player.maxHp;
    state.player.mp = state.player.maxMp;

    // Distribute stats
    state.stats.pur += 1;
    state.stats.vit += 1;
    state.stats.str += 1;
    state.stats.cha += 1;
    state.stats.aura += 1;
    state.stats.int += 1;

    const rankInfo = calculateRank(state.player.level);
    state.player.rank = rankInfo.rank;
    state.player.title = rankInfo.title;

    triggerLevelUpModal(state.player.level - 1, state.player.level);
  }

  saveState(state);
  renderAll();
}

export function reverseXp(amount, sourceTitle = '') {
  state.player.xp -= amount;

  while (state.player.xp < 0 && state.player.level > 1) {
    state.player.level -= 1;
    state.player.xpRequired = getXpRequiredForLevel(state.player.level);
    state.player.xp += state.player.xpRequired;
    state.player.gold = Math.max(0, state.player.gold - 100);
    state.player.unallocatedStatPoints = Math.max(0, state.player.unallocatedStatPoints - 3);

    state.stats.pur = Math.max(10, state.stats.pur - 1);
    state.stats.vit = Math.max(10, state.stats.vit - 1);
    state.stats.str = Math.max(10, state.stats.str - 1);
    state.stats.cha = Math.max(10, state.stats.cha - 1);
    state.stats.aura = Math.max(10, state.stats.aura - 1);
    state.stats.int = Math.max(10, state.stats.int - 1);

    const rankInfo = calculateRank(state.player.level);
    state.player.rank = rankInfo.rank;
    state.player.title = rankInfo.title;
  }

  if (state.player.xp < 0) {
    state.player.xp = 0;
  }

  saveState(state);
  renderAll();
}

function triggerLevelUpModal(oldLvl, newLvl) {
  audio.playLevelUp();
  document.getElementById('modal-old-level').innerText = oldLvl;
  document.getElementById('modal-new-level').innerText = newLvl;
  document.getElementById('modal-level-up').classList.add('active');
}

function setupLevelUpModal() {
  document.getElementById('btn-claim-level-up').addEventListener('click', () => {
    document.getElementById('modal-level-up').classList.remove('active');
    audio.playClick();
  });
}

// ==========================================================================
// LEFT-SIDEBAR NAVIGATION
// ==========================================================================
function switchTab(targetTab) {
  if (isSystemInStasisToday() && targetTab !== 'rules') {
    showToast('System is in Stasis for today. Tasks and down pages are locked.');
    return;
  }
  const tabs = document.querySelectorAll('.nav-item');
  tabs.forEach(t => {
    if (t.getAttribute('data-tab') === targetTab) {
      t.classList.add('active');
    } else {
      t.classList.remove('active');
    }
  });

  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  const activePanel = document.getElementById(`tab-${targetTab}`);
  if (activePanel) {
    activePanel.classList.add('active');
  }

  if (targetTab === 'dashboard') {
    requestAnimationFrame(() => {
      renderDashboardAnalytics();
    });
  }
}

function setupNavigation() {
  const tabs = document.querySelectorAll('.nav-item');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      if (isSystemInStasisToday() && targetTab !== 'rules') {
        showToast('System is in Stasis for today. Tasks and down pages are locked.');
        return;
      }
      audio.playClick();
      switchTab(targetTab);
    });
  });

  // Quick Write Diary Button in Top Bar
  const quickDiaryBtn = document.getElementById('btn-quick-diary');
  if (quickDiaryBtn) {
    quickDiaryBtn.addEventListener('click', () => {
      if (isSystemInStasisToday()) {
        showToast('System is in Stasis for today. Diary and tasks are locked.');
        return;
      }
      audio.playClick();
      switchTab('diary');
      const input = document.getElementById('diary-title-input');
      if (input) input.focus();
    });
  }

  // Dashboard "View all diary entries"
  const gotoDiaryBtn = document.getElementById('btn-goto-diary');
  if (gotoDiaryBtn) {
    gotoDiaryBtn.addEventListener('click', () => {
      audio.playClick();
      switchTab('diary');
    });
  }
}

// ==========================================================================
// AUDIO CONTROLS
// ==========================================================================
function setupAudioControls() {
  const toggleBtn = document.getElementById('btn-audio-toggle');
  const icon = document.getElementById('audio-icon');

  function updateIcon() {
    icon.innerText = audio.enabled ? 'SND: ON' : 'SND: OFF';
  }
  updateIcon();

  toggleBtn.addEventListener('click', () => {
    const isEnabled = audio.toggle();
    updateIcon();
  });
}

// ==========================================================================
// MIDNIGHT COUNTDOWN
// ==========================================================================
function setupMidnightCountdown() {
  updateMidnightCountdown();
}

function updateMidnightCountdown() {
  checkMidnightLiveReset();

  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);

  const diffMs = midnight - now;
  if (diffMs <= 0) {
    const resetTimer = document.getElementById('sidebar-midnight-timer');
    if (resetTimer) resetTimer.innerText = "00:00:00";
    const hudTimer = document.getElementById('hud-midnight-timer');
    if (hudTimer) hudTimer.innerText = "00:00:00";
    return;
  }

  const hours = String(Math.floor(diffMs / 3600000)).padStart(2, '0');
  const mins = String(Math.floor((diffMs % 3600000) / 60000)).padStart(2, '0');
  const secs = String(Math.floor((diffMs % 60000) / 1000)).padStart(2, '0');

  const timerEl = document.getElementById('sidebar-midnight-timer');
  if (timerEl) {
    timerEl.innerText = `${hours}:${mins}:${secs}`;
  }
  const hudTimerEl = document.getElementById('hud-midnight-timer');
  if (hudTimerEl) {
    hudTimerEl.innerText = `${hours}:${mins}:${secs}`;
  }
}

function checkMidnightLiveReset() {
  const today = new Date().toDateString();
  if (state.lastResetDate && state.lastResetDate !== today) {
    if (!state.dailyHistory) state.dailyHistory = {};
    state.dailyHistory[state.lastResetDate] = {
      date: state.lastResetDate,
      purityStreak: state.pillarPurity?.streakDays || 0,
      cigsAvoided: state.pillarEngine?.cigsAvoidedCount || 0,
      workoutsDone: state.pillarForge?.workoutsDone || 0,
      completedQuests: (state.dailyChecklist || []).filter(q => q.done).map(q => q.title),
      savedCash: state.pillarEngine?.moneySaved || 0,
      proteinGrams: state.pillarHunter?.proteinGrams || 0,
      careerTracksDone: (state.pillarApex?.tracks || []).filter(t => t.done).map(t => t.title),
      dailyMoodScore: state.pillarAura?.dailyMoodScore || 8,
      antiJunkClaimed: state.pillarHunter?.antiJunkClaimed || false,
      gratitudeSealed: Boolean(state.pillarAura?.gratitudeSealedDate)
    };

    state.lastResetDate = today;
    if (state.dailyChecklist) state.dailyChecklist.forEach(q => q.done = false);
    if (state.pillarHunter) {
      state.pillarHunter.dawnTasks.forEach(t => t.done = false);
      state.pillarHunter.nightTasks.forEach(t => t.done = false);
      state.pillarHunter.antiJunkClaimed = false;
      state.pillarHunter.proteinGrams = 0;
    }
    if (state.pillarAura) {
      state.pillarAura.auraTasks.forEach(t => t.done = false);
      state.pillarAura.gratitudeSealedDate = null;
    }
    if (state.pillarApex && state.pillarApex.tracks) {
      state.pillarApex.tracks.forEach(t => t.done = false);
    }
    saveState(state);
    setupLiveDates();
    renderAll();
    showToast("Midnight Rollover: Yesterday's records archived. New day loaded!");
  }
}

// ==========================================================================
// DEAR DIARY & DAILY REMARKS MODULE
// ==========================================================================
function renderDiary() {
  const container = document.getElementById('diary-entries-container');
  const countLabel = document.getElementById('diary-entries-count');
  const dashPreview = document.getElementById('dashboard-recent-diary');

  const entries = state.diaryEntries || [];
  if (countLabel) {
    countLabel.innerText = `${entries.length} ${entries.length === 1 ? 'Entry' : 'Entries'}`;
  }

  // Dashboard preview
  if (dashPreview) {
    if (entries.length === 0) {
      dashPreview.innerHTML = `
        <div class="small-text text-muted">No diary entries written yet. Click 'Write in Diary' above to record today's reflection.</div>
      `;
    } else {
      const latest = entries[0];
      dashPreview.innerHTML = `
        <div class="rdb-header">
          <span>${latest.date}</span>
          <span class="rdb-mood">${latest.mood || 'Reflection'}</span>
        </div>
        <div class="rdb-title">${latest.title || 'Today’s Remark'}</div>
        <div class="rdb-text">${latest.text}</div>
      `;
    }
  }

  // Full Diary Archive List
  if (container) {
    if (entries.length === 0) {
      container.innerHTML = `<div class="small-text text-muted text-center" style="padding: 20px;">Your diary is empty. Write your first reflection on the left!</div>`;
      return;
    }

    container.innerHTML = entries.map((e, idx) => `
      <div class="diary-entry-card">
        <div class="dec-top">
          <span class="dec-date">${e.date}</span>
          <span class="dec-mood">${e.mood || 'Note'}</span>
        </div>
        <div class="dec-title">${e.title || 'Untitled Entry'}</div>
        <div class="dec-text">${e.text}</div>
        <div class="dec-footer">
          <button class="btn-delete-entry" data-idx="${idx}">Delete</button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.btn-delete-entry').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        if (confirm('Delete this diary entry?')) {
          audio.playClick();
          state.diaryEntries.splice(idx, 1);
          saveState(state);
          renderDiary();
        }
      });
    });
  }
}

function setupDiaryModule() {
  const saveBtn = document.getElementById('btn-save-diary-entry');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const mood = document.getElementById('diary-mood-select').value;
      const title = document.getElementById('diary-title-input').value.trim() || 'Daily Remark';
      const text = document.getElementById('diary-text-input').value.trim();

      if (!text) {
        alert('Please write something in your diary entry before saving!');
        return;
      }

      const todayStr = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });

      if (!state.diaryEntries) state.diaryEntries = [];

      state.diaryEntries.unshift({
        id: `entry_${Date.now()}`,
        date: todayStr,
        timestamp: Date.now(),
        mood,
        title,
        text
      });

      // Clear form inputs
      document.getElementById('diary-title-input').value = '';
      document.getElementById('diary-text-input').value = '';

      audio.playQuestComplete();
      state.stats.aura += 1;
      addXp(50, 'Recorded Daily Diary Entry');
      saveState(state);
      renderDiary();
      alert('DIARY ENTRY SAVED! +50 XP, +1 Mindset/Aura. Keep recording your truth.');
    });
  }
}

// ==========================================================================
// DAILY HABITS CHECKLIST
// ==========================================================================
function renderDailyQuests() {
  const container = document.getElementById('command-daily-checklist');
  if (!container) return;

  const total = state.dailyChecklist.length;
  const completedCount = state.dailyChecklist.filter(q => q.done).length;

  document.getElementById('daily-completion-ratio').innerText = `${completedCount} / ${total} COMPLETED`;

  const penaltyText = document.getElementById('penalty-text');
  if (completedCount === total) {
    penaltyText.innerText = "All Anchors Cleared!";
    penaltyText.className = "green-text";
  } else {
    penaltyText.innerText = `${total - completedCount} Remaining`;
    penaltyText.className = "amber-text";
  }

  container.innerHTML = state.dailyChecklist.map((q, idx) => `
    <div class="quest-item ${q.done ? 'completed' : ''}" data-idx="${idx}">
      <div class="quest-left">
        <div class="quest-checkbox">${q.done ? '✓' : ''}</div>
        <div class="quest-title-wrap">
          <span class="quest-title">${q.title}</span>
          <span class="quest-pillar-sub">${q.pillar}</span>
        </div>
      </div>
      <span class="quest-xp-reward">+${q.xp} XP</span>
    </div>
  `).join('');

  container.querySelectorAll('.quest-item').forEach(item => {
    item.addEventListener('click', () => {
      const idx = parseInt(item.getAttribute('data-idx'), 10);
      const quest = state.dailyChecklist[idx];
      if (isSystemInStasisToday()) {
        showToast('System In Stasis: Today is frozen. Nothing to tick.');
        return;
      }
      quest.done = !quest.done;

      if (quest.done) {
        audio.playQuestComplete();
        state.player.gold += quest.gold;
        addXp(quest.xp, quest.title);
      } else {
        audio.playClick();
        state.player.gold = Math.max(0, state.player.gold - quest.gold);
        reverseXp(quest.xp, quest.title);
        showToast(`Unticked: -${quest.xp} XP reversed`);
      }

      saveState(state);
      renderAll();
    });
  });
}

// ==========================================================================
// PURITY & CONTROL
// ==========================================================================
function renderPillarPurity() {
  updatePurityStreakDisplay();

  const days = state.pillarPurity.streakDays || 0;
  [3, 7, 14, 30, 90].forEach(m => {
    const el = document.getElementById(`m-pur-${m}`);
    if (el) {
      if (days >= m) el.classList.add('achieved');
      else el.classList.remove('achieved');
    }
  });

  const tbody = document.getElementById('breach-log-tbody');
  if (tbody) {
    if (!state.pillarPurity.breachHistory || state.pillarPurity.breachHistory.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-table-msg">No slips logged. The Shield remains strong.</td></tr>`;
    } else {
      tbody.innerHTML = state.pillarPurity.breachHistory.map(b => `
        <tr>
          <td>${new Date(b.timestamp).toLocaleDateString()}</td>
          <td><span class="badge-danger">${b.type}</span></td>
          <td>${b.timeOfDay}</td>
          <td>${b.trigger}</td>
          <td>${b.countermeasure}</td>
        </tr>
      `).join('');
    }
  }
}

function updatePurityStreakDisplay() {
  const daysEl = document.getElementById('purity-streak-days');
  const hoursEl = document.getElementById('purity-streak-hours');
  if (!daysEl || !hoursEl) return;

  const campaignStart = new Date('2026-10-05T00:00:00').getTime();
  const start = state.pillarPurity.lastRelapseTimestamp || campaignStart;
  const diffMs = Math.max(Date.now() - start, 0);
  const totalHours = Math.floor(diffMs / 3600000);
  const days = Math.floor(totalHours / 24);

  state.pillarPurity.streakDays = days;
  daysEl.innerText = days;
  hoursEl.innerText = `${totalHours} Hours Clean`;
}

function setupEmergencyProtocol() {
  const openBtn = document.getElementById('btn-emergency-protocol');
  const openBtn2 = document.getElementById('btn-trigger-panic-modal');
  const closeBtn = document.getElementById('btn-close-emergency');
  const modal = document.getElementById('modal-emergency');
  const survivedBtn = document.getElementById('btn-survived-urge');

  const timerDisplay = document.getElementById('emergency-clock-timer');
  const cueSub = document.getElementById('emergency-cue-text');
  const guidanceText = document.getElementById('emergency-guidance-text');
  const progressBar = document.getElementById('emergency-clock-progress');
  const statusTag = document.getElementById('emergency-breathe-status');
  const circleVisual = document.getElementById('emergency-breathe-circle');
  const toggleBtn = document.getElementById('btn-emergency-timer-toggle');
  const resetBtn = document.getElementById('btn-emergency-timer-reset');

  let remainingSeconds = 60;
  let timerInterval = null;
  let isRunning = false;

  function updateBreathingUI() {
    const elapsed = 60 - remainingSeconds;
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    if (timerDisplay) {
      timerDisplay.innerText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    if (progressBar) {
      progressBar.style.width = `${(elapsed / 60) * 100}%`;
    }

    if (remainingSeconds <= 0) {
      if (statusTag) statusTag.innerText = '60s Breathing Complete!';
      if (cueSub) cueSub.innerText = 'CALM';
      if (guidanceText) {
        guidanceText.innerHTML = '<strong>Nervous system reset complete.</strong> Your brain is back in control. Urge defused. Stand up and conquer your day!';
      }
      if (circleVisual) {
        circleVisual.className = 'eb-circle-visual complete';
      }
      if (survivedBtn) {
        survivedBtn.classList.add('pulse-crimson');
      }
      audio.playQuestComplete();
      stopTimer();
      if (toggleBtn) toggleBtn.innerText = 'Done';
      return;
    }

    // 16-second box breathing cycle: Inhale (4s) -> Hold (4s) -> Exhale (4s) -> Hold (4s)
    const cyclePos = elapsed % 16;
    if (cyclePos < 4) {
      if (circleVisual) circleVisual.className = 'eb-circle-visual inhale';
      if (cueSub) cueSub.innerText = 'INHALE';
      if (guidanceText) guidanceText.innerText = 'Breathe in slowly through your nose... fill your belly and chest (4s)';
      if (statusTag) statusTag.innerText = 'Inhaling deeply...';
    } else if (cyclePos < 8) {
      if (circleVisual) circleVisual.className = 'eb-circle-visual hold';
      if (cueSub) cueSub.innerText = 'HOLD';
      if (guidanceText) guidanceText.innerText = 'Hold the air, relax your shoulders, stay completely motionless (4s)';
      if (statusTag) statusTag.innerText = 'Holding steady...';
    } else if (cyclePos < 12) {
      if (circleVisual) circleVisual.className = 'eb-circle-visual exhale';
      if (cueSub) cueSub.innerText = 'EXHALE';
      if (guidanceText) guidanceText.innerText = 'Slowly exhale through your mouth, letting all physical tension drain (4s)';
      if (statusTag) statusTag.innerText = 'Exhaling tension...';
    } else {
      if (circleVisual) circleVisual.className = 'eb-circle-visual';
      if (cueSub) cueSub.innerText = 'HOLD';
      if (guidanceText) guidanceText.innerText = 'Hold empty, feel your body ground itself in the present moment (4s)';
      if (statusTag) statusTag.innerText = 'Grounded & calm...';
    }
  }

  function startTimer() {
    if (isRunning) return;
    isRunning = true;
    if (toggleBtn) toggleBtn.innerText = '⏸️ Pause';
    timerInterval = setInterval(() => {
      remainingSeconds--;
      updateBreathingUI();
    }, 1000);
  }

  function stopTimer() {
    isRunning = false;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    if (toggleBtn && remainingSeconds > 0) toggleBtn.innerText = '▶️ Resume';
  }

  function resetTimer() {
    stopTimer();
    remainingSeconds = 60;
    updateBreathingUI();
    startTimer();
  }

  function open() {
    audio.playEmergency();
    modal.classList.add('active');
    resetTimer();
  }

  function close() {
    audio.playClick();
    stopTimer();
    modal.classList.remove('active');
  }

  if (openBtn) openBtn.addEventListener('click', open);
  if (openBtn2) openBtn2.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      audio.playClick();
      if (isRunning) stopTimer();
      else if (remainingSeconds > 0) startTimer();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      audio.playClick();
      resetTimer();
    });
  }

  if (survivedBtn) {
    survivedBtn.addEventListener('click', () => {
      audio.playQuestComplete();
      state.stats.pur += 2;
      state.stats.aura += 1;
      state.player.gold += 50;
      addXp(100, 'Overcame Severe Urge');
      close();
      alert('URGE OVERCOME! +100 XP, +2 Purity, +1 Aura. You defended your dignity and your future.');
    });
  }
}

function setupBreachModal() {
  const openBtn = document.getElementById('btn-open-breach-modal');
  const closeBtn = document.getElementById('btn-close-breach');
  const modal = document.getElementById('modal-shield-breach');
  const submitBtn = document.getElementById('btn-submit-breach');

  if (openBtn) openBtn.addEventListener('click', () => {
    audio.playClick();
    modal.classList.add('active');
  });

  if (closeBtn) closeBtn.addEventListener('click', () => {
    audio.playClick();
    modal.classList.remove('active');
  });

  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      const type = document.getElementById('breach-type-select').value;
      const trigger = document.getElementById('breach-trigger-input').value.trim() || 'Late night boredom';
      const countermeasure = document.getElementById('breach-countermeasure-input').value.trim() || 'Lock phone away from bed';

      const hours = new Date().getHours();
      const timeOfDay = hours < 12 ? 'Morning' : hours < 18 ? 'Afternoon' : hours < 22 ? 'Evening' : 'Late Night';

      state.pillarPurity.breachHistory.unshift({
        timestamp: Date.now(),
        type,
        trigger,
        timeOfDay,
        countermeasure
      });

      state.pillarPurity.lastRelapseTimestamp = Date.now();
      state.pillarPurity.streakDays = 0;

      saveState(state);
      modal.classList.remove('active');
      audio.playClick();
      renderAll();
      alert('Slip recorded objectively. No shame, no guilt. We learn the pattern, adjust the environment, and move forward.');
    });
  }
}

// ==========================================================================
// SMOKE-FREE (CLEAN ENGINE)
// ==========================================================================
function renderPillarEngine() {
  updateSmokeRecoveryMeters();
}

function updateSmokeRecoveryMeters() {
  const timerEl = document.getElementById('smoke-free-counter');
  if (!timerEl) return;

  const campaignStart = new Date('2026-10-05T00:00:00').getTime();
  const start = state.pillarEngine.smokeFreeStartTimestamp || campaignStart;
  const diffMs = Math.max(Date.now() - start, 0);
  const totalSecs = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);

  timerEl.innerText = `${String(days).padStart(2, '0')}d ${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`;

  const totalHours = diffMs / 3600000;
  const cigsPerDay = state.settings.cigsPerDay || 2;
  const cigsPerHour = cigsPerDay / 24;
  const avoidedCigs = Math.floor(totalHours * cigsPerHour);
  const costPerCig = state.settings.costPerCig || 25;
  const moneySaved = Math.round(avoidedCigs * costPerCig);

  state.pillarEngine.cigsAvoidedCount = avoidedCigs;
  state.pillarEngine.moneySaved = moneySaved;

  const cigsAvoidedEl = document.getElementById('metric-cigs-avoided');
  if (cigsAvoidedEl) cigsAvoidedEl.innerText = avoidedCigs;

  const smokeCashEl = document.getElementById('metric-smoke-cash');
  if (smokeCashEl) smokeCashEl.innerText = `₹${moneySaved.toLocaleString()}`;

  const lifeRegainedEl = document.getElementById('metric-life-regained');
  if (lifeRegainedEl) lifeRegainedEl.innerText = `${Math.round(avoidedCigs * 11 / 60)} hrs`;

  const mealsBadgeEl = document.getElementById('smoke-meals-saved-badge');
  if (mealsBadgeEl) {
    const mealsCount = Math.max(1, Math.floor(moneySaved / 25));
    mealsBadgeEl.innerText = `₹${moneySaved.toLocaleString()} Saved = ${mealsCount} Warm Meal${mealsCount === 1 ? '' : 's'} for someone in need`;
  }

  // Bio bars
  const coPct = Math.min((totalHours / 8) * 100, 100);
  document.getElementById('bio-co-fill').style.width = `${coPct}%`;
  document.getElementById('bio-co-text').innerText = coPct >= 100 ? '100% Cleared' : `${Math.round(coPct)}% Cleared`;

  const nicPct = Math.min((totalHours / 72) * 100, 100);
  document.getElementById('bio-nic-fill').style.width = `${nicPct}%`;
  document.getElementById('bio-nic-text').innerText = nicPct >= 100 ? '100% Free' : `${Math.round(nicPct)}% Purged`;

  const lungPct = Math.min((totalHours / 336) * 100, 100);
  document.getElementById('bio-lung-fill').style.width = `${lungPct}%`;
  document.getElementById('bio-lung-text').innerText = lungPct >= 100 ? 'Peak Surge (+20%)' : `${Math.round(lungPct)}% Regained`;
}

function setupCravingSurfer() {
  const openBtn = document.getElementById('btn-start-craving-surfer');
  const closeBtn = document.getElementById('btn-close-surfer');
  const completeBtn = document.getElementById('btn-complete-wave');
  const modal = document.getElementById('modal-craving-surfer');
  const timerDisplay = document.getElementById('surfer-countdown');

  let surferInterval = null;
  let remainingSeconds = 180;

  function startSurfer() {
    audio.playClick();
    remainingSeconds = 180;
    modal.classList.add('active');

    if (surferInterval) clearInterval(surferInterval);
    surferInterval = setInterval(() => {
      remainingSeconds--;
      if (remainingSeconds <= 0) {
        clearInterval(surferInterval);
        remainingSeconds = 0;
      }
      const m = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
      const s = String(remainingSeconds % 60).padStart(2, '0');
      timerDisplay.innerText = `${m}:${s}`;
    }, 1000);
  }

  function stopSurfer() {
    audio.playClick();
    if (surferInterval) clearInterval(surferInterval);
    modal.classList.remove('active');
  }

  if (openBtn) openBtn.addEventListener('click', startSurfer);
  if (closeBtn) closeBtn.addEventListener('click', stopSurfer);

  if (completeBtn) {
    completeBtn.addEventListener('click', () => {
      stopSurfer();
      audio.playQuestComplete();
      state.pillarEngine.cravingSurfedCount = (state.pillarEngine.cravingSurfedCount || 0) + 1;
      state.stats.vit += 2;
      state.player.gold += 30;
      addXp(75, 'Surfed 3-Minute Craving');
      alert('WAVE SURFED! Receptors calmed down. +75 XP, +2 Vitality, +30 Gold.');
    });
  }
}

// ==========================================================================
// FITNESS & GYM (THE IRON FORGE)
// ==========================================================================

let selectedSplitChip = null;

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

function getSplitPillClass(splitName) {
  if (!splitName) return '';
  const s = splitName.toLowerCase();
  if (s.includes('legs')) return 'pill-legs';
  if (s.includes('pull')) return 'pill-pull';
  if (s.includes('push')) return 'pill-push';
  if (s.includes('holiday')) return 'pill-holiday';
  if (s.includes('cardio')) return 'pill-cardio';
  if (s.includes('arms')) return 'pill-arms';
  return '';
}

function renderPillarForge() {
  const workoutsDoneEl = document.getElementById('gym-workouts-done');
  if (workoutsDoneEl) workoutsDoneEl.innerText = state.pillarForge.workoutsDone || 0;

  const currentStreakEl = document.getElementById('gym-current-streak');
  if (currentStreakEl) currentStreakEl.innerText = state.pillarForge.currentStreak || 0;

  const todayDayIdx = new Date().getDay();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todaySchedule = state.pillarForge.weeklySchedule?.[todayDayIdx];
  const todaySplitName = todaySchedule?.split || (todayDayIdx === 0 ? 'Rest Day' : 'Workout');

  const todayBadge = document.getElementById('gym-today-badge');
  if (todayBadge) todayBadge.innerText = `TODAY: ${dayNames[todayDayIdx].toUpperCase()}`;

  const phaseEl = document.getElementById('gym-body-phase');
  if (phaseEl) phaseEl.innerText = todaySplitName.toUpperCase();

  const statusBadge = document.getElementById('gym-status-badge');
  if (statusBadge) {
    if (todayDayIdx === 0) {
      statusBadge.innerText = 'RECOVERY';
      statusBadge.className = 'fmt-val neon-cyan';
    } else if (todaySchedule?.done) {
      statusBadge.innerText = 'DONE';
      statusBadge.className = 'fmt-val neon-green';
    } else {
      statusBadge.innerText = 'PENDING';
      statusBadge.className = 'fmt-val neon-amber';
    }
  }

  renderWeeklyCalendar();
  renderStrengthExercisesList();
}

function renderWeeklyCalendar() {
  const gridEl = document.getElementById('weekly-calendar-grid');
  if (!gridEl) return;

  const todayDayIdx = new Date().getDay();
  const calendarOrder = [1, 2, 3, 4, 5, 6, 0]; // Mon to Sun

  const dayLabels = {
    1: 'MON',
    2: 'TUE',
    3: 'WED',
    4: 'THU',
    5: 'FRI',
    6: 'SAT',
    0: 'SUN'
  };

  const splitCycleOptions = [
    'Legs & Abs',
    'Pull (Back & Biceps)',
    'Push (Chest & Triceps)',
    'Rest Day',
    'Cardio & Core',
    'Arms & Delts'
  ];

  gridEl.innerHTML = calendarOrder.map(dayKey => {
    const dayData = state.pillarForge.weeklySchedule?.[dayKey] || { day: dayLabels[dayKey], split: 'Rest Day', done: false };
    const isToday = (dayKey === todayDayIdx);
    const pillClass = getSplitPillClass(dayData.split);

    return `
      <div class="split-day-card cal-day-cell ${isToday ? 'is-today' : ''} ${dayData.done ? 'is-completed' : ''}" data-day="${dayKey}">
        <div class="day-header">
          <span class="day-name">${dayLabels[dayKey]}</span>
          ${isToday ? '<span class="today-pill">TODAY</span>' : ''}
        </div>
        <div class="day-split-box">
          <button type="button" class="assigned-split-pill ${pillClass}" data-day="${dayKey}" title="Click to cycle split">
            ${escapeHtml(dayData.split || 'Rest Day')}
          </button>
          <span class="split-hint-text">Click to cycle</span>
        </div>
        <div class="day-footer">
          <button type="button" class="btn-toggle-day-done ${dayData.done ? 'completed' : ''}" data-day="${dayKey}">
            ${dayData.done ? '✓ Done' : 'Mark Done'}
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Re-attach cycle split listeners
  gridEl.querySelectorAll('.assigned-split-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      const dayKey = parseInt(pill.getAttribute('data-day'), 10);
      if (state.pillarForge.weeklySchedule?.[dayKey]) {
        const currentSplit = state.pillarForge.weeklySchedule[dayKey].split || 'Rest Day';
        const curIdx = splitCycleOptions.findIndex(s => s.toLowerCase() === currentSplit.toLowerCase());
        const nextIdx = (curIdx + 1) % splitCycleOptions.length;
        state.pillarForge.weeklySchedule[dayKey].split = splitCycleOptions[nextIdx];
        audio.playClick();
        saveState(state);
        renderPillarForge();
      }
    });
  });

  // Re-attach toggle done listeners with reversible XP
  gridEl.querySelectorAll('.btn-toggle-day-done').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const dayKey = parseInt(btn.getAttribute('data-day'), 10);
      if (state.pillarForge.weeklySchedule?.[dayKey]) {
        const isDone = !state.pillarForge.weeklySchedule[dayKey].done;
        state.pillarForge.weeklySchedule[dayKey].done = isDone;

        if (isDone) {
          audio.playQuestComplete();
          state.pillarForge.workoutsDone = (state.pillarForge.workoutsDone || 0) + 1;
          state.pillarForge.currentStreak = (state.pillarForge.currentStreak || 0) + 1;
          state.stats.str += 1;
          addXp(40, `Completed ${state.pillarForge.weeklySchedule[dayKey].day} Split`);
          showToast(`Completed ${state.pillarForge.weeklySchedule[dayKey].day} Split: +40 XP`);
        } else {
          audio.playClick();
          if (state.pillarForge.workoutsDone > 0) state.pillarForge.workoutsDone--;
          if (state.pillarForge.currentStreak > 0) state.pillarForge.currentStreak--;
          state.stats.str = Math.max(10, state.stats.str - 1);
          reverseXp(40, `Reversed ${state.pillarForge.weeklySchedule[dayKey].day} Split`);
          showToast('Unticked workout split: -40 XP reversed');
        }

        saveState(state);
        renderPillarForge();
        renderHud();
      }
    });
  });
}

function renderStrengthExercisesList() {
  const listEl = document.getElementById('strength-exercises-list');
  const countEl = document.getElementById('strength-logged-count');
  if (!listEl) return;

  const list = state.pillarForge.strengthExercises || [];
  if (countEl) countEl.innerText = `${list.length} Exercise${list.length === 1 ? '' : 's'} Logged`;

  if (list.length === 0) {
    listEl.innerHTML = `<div class="empty-strength-msg">No exercises logged today. Type a workout name and sets above to add!</div>`;
    return;
  }

  listEl.innerHTML = list.map((item, idx) => `
    <div class="strength-item-row ${item.done ? 'completed' : ''}" data-idx="${idx}">
      <div class="si-left">
        <input type="checkbox" class="si-check" data-idx="${idx}" ${item.done ? 'checked' : ''} />
        <span class="si-name">${escapeHtml(item.name)}</span>
      </div>
      <div class="si-right">
        <span class="si-sets-badge">${item.sets} SET${item.sets > 1 ? 'S' : ''}</span>
        <button class="btn-delete-strength-item" data-idx="${idx}" title="Delete exercise">✕</button>
      </div>
    </div>
  `).join('');

  // Checkbox completion
  listEl.querySelectorAll('.si-check').forEach(chk => {
    chk.addEventListener('change', () => {
      const idx = parseInt(chk.getAttribute('data-idx'), 10);
      if (list[idx]) {
        list[idx].done = chk.checked;
        if (chk.checked) {
          audio.playQuestComplete();
          state.stats.str += 1;
          addXp(25, `Finished ${list[idx].name} (${list[idx].sets} sets)`);
        } else {
          audio.playClick();
          state.stats.str = Math.max(10, state.stats.str - 1);
          reverseXp(25, `Finished ${list[idx].name} (${list[idx].sets} sets)`);
          showToast(`Unticked exercise: -25 XP reversed`);
        }
        saveState(state);
        renderStrengthExercisesList();
        renderHud();
      }
    });
  });

  // Delete exercise
  listEl.querySelectorAll('.btn-delete-strength-item').forEach(delBtn => {
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(delBtn.getAttribute('data-idx'), 10);
      list.splice(idx, 1);
      audio.playClick();
      saveState(state);
      renderStrengthExercisesList();
    });
  });
}

function setupWorkoutModule() {
  // Quick Log Workout Today (+100 XP)
  const quickLogBtn = document.getElementById('btn-quick-log-workout');
  if (quickLogBtn) {
    quickLogBtn.addEventListener('click', () => {
      const todayIdx = new Date().getDay();
      const todaySched = state.pillarForge.weeklySchedule?.[todayIdx];
      const isAlreadyDone = todaySched?.done;

      if (isAlreadyDone) {
        showToast("Today's workout is already logged and sealed!");
        return;
      }

      audio.playQuestComplete();
      state.pillarForge.workoutsDone = (state.pillarForge.workoutsDone || 0) + 1;
      state.pillarForge.currentStreak = (state.pillarForge.currentStreak || 0) + 1;
      if (todaySched) todaySched.done = true;

      state.stats.str += 2;
      state.stats.vit += 1;
      state.player.gold += 40;
      addXp(100, 'Logged Workout / 15-Min Minimum Session');
      saveState(state);
      renderAll();
      showToast('WORKOUT LOGGED! Streak protected. +100 XP, +2 STR, +1 Vitality, +40 Gold');
    });
  }

  // Save Weekly Calendar Schedule Button
  const saveCalBtn = document.getElementById('btn-save-weekly-calendar');
  if (saveCalBtn) {
    saveCalBtn.addEventListener('click', () => {
      audio.playQuestComplete();
      addXp(50, 'Saved Weekly Split Schedule');
      saveState(state);
      renderHud();
      showToast('WEEKLY SCHEDULE SAVED! Your calendar split is locked in. +50 XP');
    });
  }

  // Reset Default Schedule Button
  const resetCalBtn = document.getElementById('btn-reset-default-schedule');
  if (resetCalBtn) {
    resetCalBtn.addEventListener('click', () => {
      audio.playClick();
      state.pillarForge.weeklySchedule = {
        1: { day: 'Monday', split: 'Legs & Abs', done: false },
        2: { day: 'Tuesday', split: 'Pull (Back & Biceps)', done: false },
        3: { day: 'Wednesday', split: 'Push (Chest & Triceps)', done: false },
        4: { day: 'Thursday', split: 'Legs & Abs', done: false },
        5: { day: 'Friday', split: 'Pull (Back & Biceps)', done: false },
        6: { day: 'Saturday', split: 'Push (Chest & Triceps)', done: false },
        0: { day: 'Sunday', split: 'Rest Day', done: false }
      };
      saveState(state);
      renderPillarForge();
      showToast('Reset split to standard Mon-Sat PPL + Sunday Rest');
    });
  }

  // Strength Training: Add Exercise (Only Name and Number of Sets)
  const addExBtn = document.getElementById('btn-add-strength-exercise');
  const nameInput = document.getElementById('input-strength-exercise-name');
  const setsInput = document.getElementById('input-strength-sets-num');

  if (addExBtn && nameInput && setsInput) {
    const handleAdd = () => {
      const name = nameInput.value.trim();
      const sets = parseInt(setsInput.value, 10) || 3;
      if (!name) {
        showToast('Please enter an exercise name (e.g. Push-ups, Pull-ups)');
        nameInput.focus();
        return;
      }
      if (!state.pillarForge.strengthExercises) {
        state.pillarForge.strengthExercises = [];
      }
      state.pillarForge.strengthExercises.push({
        id: 'se_' + Date.now(),
        name: name,
        sets: Math.max(1, sets),
        done: false
      });
      nameInput.value = '';
      setsInput.value = 3;
      audio.playClick();
      saveState(state);
      renderStrengthExercisesList();
    };

    addExBtn.addEventListener('click', handleAdd);
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleAdd();
    });
    setsInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleAdd();
    });
  }

  // Quick Preset Chips for Strength Training
  const presetChips = document.querySelectorAll('.quick-presets-group .preset-chip, .quick-strength-presets .preset-chip');
  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      audio.playClick();
      const name = chip.getAttribute('data-name');
      const sets = chip.getAttribute('data-sets') || '3';
      if (nameInput) nameInput.value = name;
      if (setsInput) setsInput.value = sets;
      nameInput?.focus();
    });
  });

  // Save Strength Session Button
  const saveStrengthBtn = document.getElementById('btn-save-strength-session');
  if (saveStrengthBtn) {
    saveStrengthBtn.addEventListener('click', () => {
      audio.playQuestComplete();
      state.stats.str += 2;
      addXp(50, 'Saved Strength Session');
      saveState(state);
      renderHud();
      showToast('STRENGTH SESSION SAVED! +50 XP, +2 STR');
    });
  }
}

// ==========================================================================
// DAILY ROUTINE (HUNTER'S FORM)
// ==========================================================================
function renderPillarHunter() {
  const dawnContainer = document.getElementById('dawn-checklist-container');
  const nightContainer = document.getElementById('night-checklist-container');

  const dawnTasks = state.pillarHunter.dawnTasks || [];
  const nightTasks = state.pillarHunter.nightTasks || [];

  const dawnDone = dawnTasks.filter(t => t.done).length;
  const nightDone = nightTasks.filter(t => t.done).length;

  const dawnStatus = document.getElementById('dawn-completion-status');
  if (dawnStatus) dawnStatus.innerText = `${dawnDone} / ${dawnTasks.length}`;

  const nightStatus = document.getElementById('night-completion-status');
  if (nightStatus) nightStatus.innerText = `${nightDone} / ${nightTasks.length}`;

  // Skin Glow calculation based on 5 AM, 3L water, Ice pack, 120g protein, 8h sleep, and No Junk
  const proteinGrams = state.pillarHunter.proteinGrams || 0;
  const proteinBonus = Math.min((proteinGrams / 120) * 15, 15);
  const junkBonus = state.pillarHunter.antiJunkClaimed ? 10 : 0;
  const dawnGlow = (dawnDone / Math.max(dawnTasks.length, 1)) * 40;
  const nightGlow = (nightDone / Math.max(nightTasks.length, 1)) * 35;
  const glowPct = Math.min(Math.round(dawnGlow + nightGlow + proteinBonus + junkBonus), 100);
  state.pillarHunter.skinGlow = glowPct;

  const glowNum = document.getElementById('skin-glow-percentage');
  if (glowNum) glowNum.innerText = `${glowPct}%`;
  const glowFill = document.getElementById('skin-glow-fill');
  if (glowFill) glowFill.style.width = `${glowPct}%`;

  // Render Morning Routine
  if (dawnContainer) {
    dawnContainer.innerHTML = dawnTasks.map((t, idx) => `
      <div class="quest-item ${t.done ? 'completed' : ''}" data-dawn-idx="${idx}">
        <div class="quest-left">
          <div class="quest-checkbox">${t.done ? '✓' : ''}</div>
          <span class="quest-title">${t.text}</span>
        </div>
        <span class="quest-xp-reward">+${t.xp} XP</span>
      </div>
    `).join('');

    dawnContainer.querySelectorAll('.quest-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.getAttribute('data-dawn-idx'), 10);
        const t = dawnTasks[idx];
        t.done = !t.done;
        if (t.done) {
          audio.playQuestComplete();
          state.stats.cha += 1;
          addXp(t.xp, t.text);
        } else {
          audio.playClick();
          state.stats.cha = Math.max(10, state.stats.cha - 1);
          reverseXp(t.xp, t.text);
          showToast(`Unticked: -${t.xp} XP reversed`);
        }
        saveState(state);
        renderPillarHunter();
        renderHud();
      });
    });
  }

  // Render Evening Routine
  if (nightContainer) {
    nightContainer.innerHTML = nightTasks.map((t, idx) => `
      <div class="quest-item ${t.done ? 'completed' : ''}" data-night-idx="${idx}">
        <div class="quest-left">
          <div class="quest-checkbox">${t.done ? '✓' : ''}</div>
          <span class="quest-title">${t.text}</span>
        </div>
        <span class="quest-xp-reward">+${t.xp} XP</span>
      </div>
    `).join('');

    nightContainer.querySelectorAll('.quest-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.getAttribute('data-night-idx'), 10);
        const t = nightTasks[idx];
        t.done = !t.done;
        if (t.done) {
          audio.playQuestComplete();
          state.stats.vit += 1;
          addXp(t.xp, t.text);
        } else {
          audio.playClick();
          state.stats.vit = Math.max(10, state.stats.vit - 1);
          reverseXp(t.xp, t.text);
          showToast(`Unticked: -${t.xp} XP reversed`);
        }
        saveState(state);
        renderPillarHunter();
        renderHud();
      });
    });
  }

  // Render Clean Fuel Shield status
  const claimJunkBtn = document.getElementById('btn-claim-anti-junk');
  if (claimJunkBtn) {
    if (state.pillarHunter.antiJunkClaimed) {
      claimJunkBtn.innerText = '✓ Clean Fuel Shield Active (+50 XP Claimed)';
      claimJunkBtn.style.background = 'rgba(16, 185, 129, 0.2)';
      claimJunkBtn.style.borderColor = 'var(--neon-green)';
      claimJunkBtn.style.color = 'var(--neon-green)';
    } else {
      claimJunkBtn.innerText = 'Claim Clean Fuel (+50 XP, +30 Gold)';
      claimJunkBtn.style.background = '';
      claimJunkBtn.style.borderColor = '';
      claimJunkBtn.style.color = '';
    }
  }

  // Render Protein Tracker
  renderProteinTracker();

  // Render Anterior Pelvic Tilt Drills
  renderAptDrills();
}

function renderProteinTracker() {
  const proteinGrams = state.pillarHunter.proteinGrams || 0;
  const target = state.pillarHunter.proteinTarget || 120;
  const pct = Math.min(Math.round((proteinGrams / target) * 100), 100);

  const curDisplay = document.getElementById('protein-current-display');
  if (curDisplay) curDisplay.innerText = `${proteinGrams} / ${target} gm`;

  const pctDisplay = document.getElementById('protein-percent-display');
  if (pctDisplay) {
    pctDisplay.innerText = `${Math.round((proteinGrams / target) * 100)}%`;
    if (proteinGrams >= target) {
      pctDisplay.style.color = 'var(--neon-green)';
    } else {
      pctDisplay.style.color = 'var(--neon-amber)';
    }
  }

  const fill = document.getElementById('protein-progress-fill');
  if (fill) {
    fill.style.width = `${pct}%`;
    if (proteinGrams >= target) {
      fill.style.background = 'linear-gradient(90deg, #10b981, #00f0ff)';
      fill.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.6)';
    } else {
      fill.style.background = 'linear-gradient(90deg, #f59e0b, #10b981)';
      fill.style.boxShadow = 'none';
    }
  }

  const inputEl = document.getElementById('input-protein-grams');
  if (inputEl && !inputEl.matches(':focus')) {
    inputEl.value = proteinGrams > 0 ? proteinGrams : '';
  }
}

function renderAptDrills() {
  const container = document.getElementById('apt-drills-container');
  if (!container) return;

  const drills = state.pillarHunter.aptChecklist || [];
  container.innerHTML = drills.map((d, idx) => `
    <div class="apt-drill-item ${d.done ? 'completed' : ''}" data-apt-idx="${idx}">
      <input type="checkbox" class="apt-check" data-apt-idx="${idx}" ${d.done ? 'checked' : ''} />
      <span class="apt-text">${escapeHtml(d.text)}</span>
    </div>
  `).join('');

  container.querySelectorAll('.apt-drill-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const idx = parseInt(item.getAttribute('data-apt-idx'), 10);
      if (drills[idx]) {
        drills[idx].done = !drills[idx].done;
        if (drills[idx].done) {
          audio.playQuestComplete();
          state.stats.str += 1;
          addXp(15, `Pelvic Drill: ${drills[idx].text.split('(')[0]}`);
        } else {
          audio.playClick();
          state.stats.str = Math.max(10, state.stats.str - 1);
          reverseXp(15, `Pelvic Drill: ${drills[idx].text.split('(')[0]}`);
          showToast('Unticked drill: -15 XP reversed');
        }
        saveState(state);
        renderAptDrills();
        renderHud();
      }
    });
  });
}

function setupRoutinesModule() {
  // Claim Clean Fuel (No Junk) Shield
  const claimJunkBtn = document.getElementById('btn-claim-anti-junk');
  if (claimJunkBtn) {
    claimJunkBtn.addEventListener('click', () => {
      if (state.pillarHunter.antiJunkClaimed) {
        alert('You have already claimed your clean fuel token for today!');
        return;
      }
      audio.playQuestComplete();
      state.pillarHunter.antiJunkClaimed = true;
      state.stats.vit += 2;
      state.stats.cha += 1;
      state.player.gold += 30;
      addXp(50, 'Clean Food Shield (No Junk)');
      saveState(state);
      renderAll();
      alert('CLEAN FUEL SHIELD CLAIMED! Zero junk food today. +50 XP, +30 Gold, +2 Vitality.');
    });
  }

  // Save Protein Button
  const saveProteinBtn = document.getElementById('btn-save-protein');
  const proteinInput = document.getElementById('input-protein-grams');
  if (saveProteinBtn && proteinInput) {
    const handleSaveProtein = () => {
      const grams = parseInt(proteinInput.value, 10) || 0;
      state.pillarHunter.proteinGrams = grams;
      audio.playQuestComplete();
      state.stats.str += 1;
      state.stats.vit += 1;
      addXp(40, `Logged ${grams}g Protein`);
      saveState(state);
      renderPillarHunter();
      renderHud();
      alert(`PROTEIN SAVED! Logged ${grams}g / 120g target. Muscle fibers and brain power fueled.`);
    };

    saveProteinBtn.addEventListener('click', handleSaveProtein);
    proteinInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSaveProtein();
    });
  }

  // Quick Protein Chips
  const qpChips = document.querySelectorAll('.quick-protein-chips .qp-chip');
  qpChips.forEach(chip => {
    chip.addEventListener('click', () => {
      audio.playClick();
      const addGrams = parseInt(chip.getAttribute('data-grams'), 10) || 0;
      if (proteinInput) {
        const current = parseInt(proteinInput.value, 10) || 0;
        proteinInput.value = current + addGrams;
        state.pillarHunter.proteinGrams = current + addGrams;
        saveState(state);
        renderProteinTracker();
      }
    });
  });

  // Complete Full APT Session Button
  const completeAptBtn = document.getElementById('btn-complete-apt-session');
  if (completeAptBtn) {
    completeAptBtn.addEventListener('click', () => {
      audio.playQuestComplete();
      if (state.pillarHunter.aptChecklist) {
        state.pillarHunter.aptChecklist.forEach(d => d.done = true);
      }
      state.stats.str += 1;
      state.stats.aura += 1;
      addXp(35, 'Completed Anterior Pelvic Tilt Correction Session');
      saveState(state);
      renderAptDrills();
      renderHud();
      alert('PELVIC ROUTINE COMPLETED! Glutes fired, hip flexors lengthened, pelvis repositioned. +35 XP, +1 STR.');
    });
  }
}

// ==========================================================================
// CHARACTER & MINDSET
// ==========================================================================
function renderPillarAura() {
  const container = document.getElementById('aura-tasks-container');
  if (!container) return;

  const tasks = state.pillarAura.auraTasks;
  container.innerHTML = tasks.map((t, idx) => `
    <div class="quest-item ${t.done ? 'completed' : ''}" data-aura-idx="${idx}">
      <div class="quest-left">
        <div class="quest-checkbox">${t.done ? '✓' : ''}</div>
        <span class="quest-title">${t.text}</span>
      </div>
      <span class="quest-xp-reward">+${t.xp} XP</span>
    </div>
  `).join('');

  container.querySelectorAll('.quest-item').forEach(item => {
    item.addEventListener('click', () => {
      const idx = parseInt(item.getAttribute('data-aura-idx'), 10);
      const t = tasks[idx];
      t.done = !t.done;
      if (t.done) {
        audio.playQuestComplete();
        state.stats.aura += 2;
        addXp(t.xp, t.text);
      } else {
        audio.playClick();
        state.stats.aura = Math.max(10, state.stats.aura - 2);
        reverseXp(t.xp, t.text);
        showToast(`Unticked: -${t.xp} XP reversed`);
      }
      saveState(state);
      renderAll();
    });
  });

  const g1 = document.getElementById('gratitude-1');
  const g2 = document.getElementById('gratitude-2');
  const g3 = document.getElementById('gratitude-3');
  if (g1 && state.pillarAura.gratitudeEntries) {
    g1.value = state.pillarAura.gratitudeEntries[0] || '';
    g2.value = state.pillarAura.gratitudeEntries[1] || '';
    g3.value = state.pillarAura.gratitudeEntries[2] || '';
  }

  // Render Daily Mood Meter (1 to 10)
  const currentMood = state.pillarAura.dailyMoodScore || 8;
  const moodValEl = document.getElementById('aura-mood-val');
  if (moodValEl) moodValEl.innerText = currentMood;

  const moodStatusEl = document.getElementById('aura-mood-status');
  if (moodStatusEl) {
    const moodMap = {
      1: 'Severely Depleted • Disengage, rest, pray, and ground yourself',
      2: 'Low Frequency • Guard your energy, avoid triggers and mindless scroll',
      3: 'Unsettled & Distracted • Take 5 deep breaths, lower over-stimulation',
      4: 'Heavy Mental Load • Execute bare minimum, protect discipline',
      5: 'Neutral Baseline • Calm, observant, emotionally detached',
      6: 'Steady Momentum • Focused execution, quiet mind, controlled speech',
      7: 'High Clarity • Deep focus, calm confidence, moving with intent',
      8: 'Grounded & Focused • Calm Sovereign Presence, uncompromising standards',
      9: 'Apex Frequency • Magnetic aura, unbothered, zero need to prove anything',
      10: 'Absolute Sovereignty • Total mastery of mind, body, and spirit'
    };
    moodStatusEl.innerText = moodMap[currentMood] || moodMap[8];
  }

  const scaleContainer = document.getElementById('aura-mood-scale');
  if (scaleContainer) {
    scaleContainer.querySelectorAll('.mood-score-btn').forEach(btn => {
      const score = parseInt(btn.getAttribute('data-score'), 10);
      if (score === currentMood) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  const saveGratitudeBtn = document.getElementById('btn-save-gratitude');
  if (saveGratitudeBtn) {
    const today = new Date().toDateString();
    if (state.pillarAura.gratitudeSealedDate === today) {
      saveGratitudeBtn.innerText = '✓ Gratitude Sealed for Today (+75 XP Claimed)';
      saveGratitudeBtn.style.background = 'rgba(16, 185, 129, 0.2)';
      saveGratitudeBtn.style.borderColor = 'var(--neon-green)';
      saveGratitudeBtn.style.color = 'var(--neon-green)';
    } else {
      saveGratitudeBtn.innerText = "Seal Today's Gratitude (+75 XP)";
      saveGratitudeBtn.style.background = '';
      saveGratitudeBtn.style.borderColor = '';
      saveGratitudeBtn.style.color = '';
    }
  }
}

function setupAuraModule() {
  // Setup Daily Mood Meter click handlers (1 to 10)
  const scaleContainer = document.getElementById('aura-mood-scale');
  if (scaleContainer) {
    scaleContainer.querySelectorAll('.mood-score-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const score = parseInt(btn.getAttribute('data-score'), 10);
        if (score >= 1 && score <= 10) {
          audio.playClick();
          const today = new Date().toDateString();
          const alreadyRated = (state.pillarAura.dailyMoodDate === today);

          state.pillarAura.dailyMoodScore = score;
          state.pillarAura.dailyMoodDate = today;

          if (!alreadyRated) {
            audio.playQuestComplete();
            addXp(25, `Logged Daily Mood Frequency: ${score}/10`);
            showToast(`Daily Mood Frequency calibrated (${score}/10): +25 XP`);
          } else {
            showToast(`Daily Mood updated: ${score}/10`);
          }

          saveState(state);
          renderPillarAura();
          renderHud();
        }
      });
    });
  }

  const saveGratitudeBtn = document.getElementById('btn-save-gratitude');
  if (saveGratitudeBtn) {
    saveGratitudeBtn.addEventListener('click', () => {
      const g1 = document.getElementById('gratitude-1').value.trim();
      const g2 = document.getElementById('gratitude-2').value.trim();
      const g3 = document.getElementById('gratitude-3').value.trim();

      if (!g1 || !g2 || !g3) {
        showToast('Please fill in all 3 gratitude points.');
        return;
      }

      state.pillarAura.gratitudeEntries = [g1, g2, g3];
      state.pillarAura.gratitudeSealedDate = new Date().toDateString();
      audio.playQuestComplete();
      state.stats.aura += 3;
      addXp(75, 'Divine Gratitude to God');
      saveState(state);
      renderAll();
      showToast('GRATITUDE SEALED! Your heart is anchored. +75 XP, +3 Mindset/Aura');
    });
  }
}

// ==========================================================================
// CAREER ENGINE (INTERACTIVE TRACKS)
// ==========================================================================
function renderPillarApex() {
  const container = document.getElementById('career-tracks-grid');
  if (!container) return;

  const tracks = state.pillarApex?.tracks || [];
  container.innerHTML = tracks.map((t, idx) => `
    <div class="glass-panel career-track-card ${t.done ? 'completed' : ''}" data-track-idx="${idx}">
      <div class="ct-header">
        <span class="panel-tag">TRACK ${t.trackNum}</span>
        <span class="quest-xp-reward">+${t.xp} XP</span>
      </div>
      <div class="ct-body">
        <div class="quest-checkbox">${t.done ? '✓' : ''}</div>
        <h3 class="ct-title">${t.title}</h3>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.career-track-card').forEach(card => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.getAttribute('data-track-idx'), 10);
      const t = tracks[idx];
      if (!t) return;

      t.done = !t.done;
      if (t.done) {
        audio.playQuestComplete();
        state.stats.int += 1;
        addXp(t.xp, t.title);
        showToast(`${t.title} completed: +${t.xp} XP (+1 INT)`);
      } else {
        audio.playClick();
        state.stats.int = Math.max(10, state.stats.int - 1);
        reverseXp(t.xp, t.title);
        showToast(`Unticked ${t.title}: -${t.xp} XP reversed`);
      }
      saveState(state);
      renderAll();
    });
  });
}

function setupApexCareerModule() {
  // Career Engine module initialized with direct card click toggles
}

// ==========================================================================
// ALL QUESTS ARCHIVE
// ==========================================================================
function renderQuestLog() {
  const container = document.getElementById('quest-cards-display');
  if (!container) return;

  const sampleQuests = [
    { type: 'DAILY', title: 'Clean Lungs Test', desc: 'Go the entire day without lighting a single cigarette.', xp: 120, gold: 50 },
    { type: 'DAILY', title: 'Purity Shield', desc: 'No pornography, adult apps, or mindless lust indulgence today.', xp: 150, gold: 60 },
    { type: 'SIDE', title: 'FMCG Demand Forecasting Project', desc: 'Build and commit a retail sales forecasting pipeline to GitHub.', xp: 250, gold: 100 },
    { type: 'SIDE', title: 'Quiet Day Challenge', desc: 'Speak only when necessary. Zero self-deprecating jokes.', xp: 180, gold: 80 },
    { type: 'GOAL', title: '15+ LPA FMCG Offer Gate', desc: 'Complete 3 retail machine learning portfolio projects and apply to 10 top FMCG/retail brands.', xp: 1000, gold: 500 }
  ];

  container.innerHTML = sampleQuests.map(q => `
    <div class="quest-card">
      <div class="quest-card-top">
        <span class="qc-type-badge ${q.type === 'GOAL' ? 'badge-gold' : q.type === 'DAILY' ? 'badge-cyan' : 'badge-amber'}">[${q.type}]</span>
        <h3 class="qc-title">${q.title}</h3>
        <p class="qc-desc">${q.desc}</p>
      </div>
      <div class="quest-card-footer">
        <div class="qc-rewards">
          <span class="qc-xp">+${q.xp} XP</span>
          <span class="qc-gold">+${q.gold} GOLD</span>
        </div>
      </div>
    </div>
  `).join('');
}

// ==========================================================================
// REWARDS SHOP
// ==========================================================================
function renderShop() {
  const goldDisplay = document.getElementById('shop-gold-display');
  if (goldDisplay) {
    goldDisplay.innerText = `${state.player.gold} GOLD`;
  }

  const container = document.getElementById('shop-items-container');
  if (!container) return;

  container.innerHTML = state.rewardsShop.map((item, idx) => `
    <div class="shop-item-card">
      <div class="item-top">
        <span class="item-icon font-hud">${item.icon || ''}</span>
        <div class="item-info">
          <h4>${item.title}</h4>
          <p>${item.desc || 'Guilt-free personal reward.'}</p>
        </div>
      </div>
      <div class="item-bottom">
        <span class="item-price">${item.cost} Gold</span>
        <button class="action-btn btn-cyan-glow btn-buy-reward" data-idx="${idx}">
          Claim Reward
        </button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.btn-buy-reward').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-idx'), 10);
      const item = state.rewardsShop[idx];

      if (state.player.gold < item.cost) {
        alert(`Insufficient Gold! You need ${item.cost - state.player.gold} more gold.`);
        return;
      }

      if (confirm(`Spend ${item.cost} Gold on "${item.title}"?`)) {
        state.player.gold -= item.cost;
        audio.playGold();
        saveState(state);
        renderAll();
        alert(`REWARD CLAIMED: Enjoy "${item.title}" with 100% guilt-free peace of mind! You earned it.`);
      }
    });
  });
}

function setupShopModule() {
  const addBtn = document.getElementById('btn-add-custom-reward');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const title = document.getElementById('input-new-reward-title').value.trim();
      const cost = parseInt(document.getElementById('input-new-reward-cost').value, 10);

      if (!title || isNaN(cost) || cost <= 0) {
        alert('Please enter a valid title and gold cost.');
        return;
      }

      state.rewardsShop.push({
        id: `rw_custom_${Date.now()}`,
        title,
        desc: 'Custom personal reward.',
        cost,
        icon: '⭐'
      });

      document.getElementById('input-new-reward-title').value = '';
      document.getElementById('input-new-reward-cost').value = '';

      audio.playQuestComplete();
      saveState(state);
      renderAll();
      alert(`"${title}" added to your reward store!`);
    });
  }
}

// ==========================================================================
// SETTINGS
// ==========================================================================
function setupSettingsModule() {
  const nameInput = document.getElementById('setting-player-name');
  if (nameInput) nameInput.value = state.player.name || 'Player One';
  const titleInput = document.getElementById('setting-player-title');
  if (titleInput) titleInput.value = state.player.title || 'Rising Novice';
  const cigsInput = document.getElementById('setting-cigs-per-day');
  if (cigsInput) cigsInput.value = state.settings.cigsPerDay || 2;
  const costInput = document.getElementById('setting-cost-per-cig');
  if (costInput) costInput.value = state.settings.costPerCig || 25;

  const saveBtn = document.getElementById('btn-save-settings');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      state.player.name = document.getElementById('setting-player-name').value.trim() || state.player.name;
      state.player.title = document.getElementById('setting-player-title').value.trim() || state.player.title;
      state.settings.cigsPerDay = parseInt(document.getElementById('setting-cigs-per-day').value, 10) || 2;
      const costEl = document.getElementById('setting-cost-per-cig');
      state.settings.costPerCig = costEl ? parseInt(costEl.value, 10) || 25 : 25;

      audio.playQuestComplete();
      saveState(state);
      renderAll();
      alert('Settings updated successfully.');
    });
  }

  // Export
  const exportBtn = document.getElementById('btn-export-data');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      audio.playClick();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `life_os_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });
  }

  // Import
  const importTrigger = document.getElementById('btn-import-trigger');
  const importInput = document.getElementById('file-import-input');
  if (importTrigger && importInput) {
    importTrigger.addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (imported.player && imported.stats) {
            state = imported;
            saveState(state);
            renderAll();
            audio.playChime();
            alert('Backup restored successfully!');
          } else {
            alert('Invalid backup file.');
          }
        } catch (err) {
          alert('Failed to parse JSON backup.');
        }
      };
      reader.readAsText(file);
    });
  }

  // Factory Reset
  const resetBtn = document.getElementById('btn-factory-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all progress to zero?')) {
        localStorage.clear();
        state = loadState();
        renderAll();
        audio.playEmergency();
        alert('All progress reset.');
      }
    });
  }
}


// ==========================================================================
// ==========================================================================
// ==========================================================================
// CAMPAIGN STATUS & 1-CLICK FREEZE TODAY ENGINE
// ==========================================================================

function getLocalDateString(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function calculateTargetEndDate() {
  const baseEnd = new Date('2027-04-01T00:00:00');
  const extensions = state.extendedDaysCount || 0;
  baseEnd.setDate(baseEnd.getDate() + extensions);
  return baseEnd;
}

export function isSystemInStasisToday() {
  const todayStr = getLocalDateString();
  return Boolean(state.frozenDates && state.frozenDates[todayStr]);
}

function updateFreezeStatusAndBanner() {
  const banner = document.getElementById('global-stasis-banner');
  const reasonEl = document.getElementById('stasis-banner-reason');
  const menuStatusPill = document.getElementById('menu-campaign-status-pill');
  const targetEndEl = document.getElementById('cal-target-end-date');
  const frozenCountEl = document.getElementById('cal-frozen-count');
  const extensionCountEl = document.getElementById('cal-extension-count');
  const windowDisplayEl = document.getElementById('cal-window-display');
  const freezeBtn = document.getElementById('btn-toggle-freeze');

  const todayStr = getLocalDateString();
  const isTodayFrozen = isSystemInStasisToday();
  const totalFrozen = Object.keys(state.frozenDates || {}).length;

  const effectiveEnd = calculateTargetEndDate();
  const effectiveEndStr = effectiveEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (targetEndEl) targetEndEl.innerText = effectiveEndStr;
  if (frozenCountEl) frozenCountEl.innerText = `${totalFrozen} Day${totalFrozen === 1 ? '' : 's'}`;
  if (extensionCountEl) extensionCountEl.innerText = `+${state.extendedDaysCount || 0} Day${state.extendedDaysCount === 1 ? '' : 's'}`;
  if (windowDisplayEl) {
    windowDisplayEl.innerHTML = `Oct 5, 2026 ➔ <span id="cal-target-end-date" class="neon-cyan font-mono">${effectiveEndStr}</span>`;
  }

  // Update top bar timeline box & menu indicators
  const hudEnd = document.getElementById('hud-timeline-end');
  if (hudEnd) hudEnd.innerText = effectiveEndStr;
  const hudDiscipline = document.getElementById('hud-discipline-days');
  if (hudDiscipline) hudDiscipline.innerText = `${178 + (state.extendedDaysCount || 0)} Days`;
  const hudFrozen = document.getElementById('hud-frozen-days');
  if (hudFrozen) hudFrozen.innerText = `${totalFrozen} Day${totalFrozen === 1 ? '' : 's'}`;
  const hudExt = document.getElementById('hud-extension-days');
  if (hudExt) hudExt.innerText = `+${state.extendedDaysCount || 0} Day${state.extendedDaysCount === 1 ? '' : 's'}`;

  const calDiscipline = document.getElementById('cal-discipline-count');
  if (calDiscipline) calDiscipline.innerText = `${178 + (state.extendedDaysCount || 0)} Days`;
  const menuDiscipline = document.getElementById('menu-discipline-badge');
  if (menuDiscipline) menuDiscipline.innerText = `${178 + (state.extendedDaysCount || 0)} DAYS`;

  // Toggle body stasis class so nothing down below can be operated!
  document.body.classList.toggle('system-stasis-active', isTodayFrozen);

  if (isTodayFrozen) {
    const activeNav = document.querySelector('.sidebar-menu .nav-item.active');
    if (activeNav && activeNav.getAttribute('data-tab') !== 'rules') {
      switchTab('rules');
    }
    if (banner) {
      banner.style.display = 'flex';
      if (reasonEl) reasonEl.innerText = 'Rest & Recovery Stasis (Tasks Locked)';
    }
    if (menuStatusPill) {
      menuStatusPill.innerHTML = '<span class="status-indicator status-frozen">●</span> STASIS ACTIVE: FROZEN TODAY';
      menuStatusPill.className = 'campaign-status-pill status-frozen-pill';
    }
    if (freezeBtn) {
      freezeBtn.innerText = 'Unfreeze Today';
      freezeBtn.className = 'btn-instant-freeze stasis-active-btn';
      freezeBtn.title = 'Click to unfreeze today and resume active campaign';
    }
  } else {
    if (banner) banner.style.display = 'none';
    if (freezeBtn) {
      freezeBtn.innerText = 'Freeze Today';
      freezeBtn.className = 'btn-instant-freeze';
      freezeBtn.title = 'Freeze Today (Stasis Mode)';
    }
    if (menuStatusPill) {
      if (todayStr < state.campaignStartDate) {
        menuStatusPill.innerHTML = '<span class="status-indicator">●</span> PRE-DEPLOYMENT: STARTS OCT 5, 2026';
        menuStatusPill.className = 'campaign-status-pill';
      } else {
        menuStatusPill.innerHTML = '<span class="status-indicator neon-green">●</span> CAMPAIGN OPERATIONAL';
        menuStatusPill.className = 'campaign-status-pill';
      }
    }
  }
}

function openFreezeConfirmModal() {
  const modal = document.getElementById('modal-freeze-confirm');
  if (modal) modal.classList.add('active');
}

function closeFreezeConfirmModal() {
  const modal = document.getElementById('modal-freeze-confirm');
  if (modal) modal.classList.remove('active');
}

function executeFreezeToday() {
  const todayStr = getLocalDateString();
  if (!state.frozenDates) state.frozenDates = {};
  state.frozenDates[todayStr] = {
    type: 'stasis',
    reason: 'Stasis Active',
    timestamp: Date.now()
  };
  state.extendedDaysCount = Object.keys(state.frozenDates).length;
  saveState(state);
  updateFreezeStatusAndBanner();
  switchTab('rules');
  renderAll();
  showToast('Freeze Today Active: System in Stasis (+1 Day Campaign Extension). Down pages locked.');
}

function executeUnfreezeToday() {
  const todayStr = getLocalDateString();
  delete state.frozenDates[todayStr];
  state.extendedDaysCount = Object.keys(state.frozenDates).length;
  saveState(state);
  updateFreezeStatusAndBanner();
  renderAll();
  showToast('Stasis lifted: Active day resumed.');
}

function initFreezeEventListeners() {
  const freezeBtn = document.getElementById('btn-toggle-freeze');
  if (freezeBtn) {
    freezeBtn.addEventListener('click', () => {
      audio.playClick();
      if (isSystemInStasisToday()) {
        executeUnfreezeToday();
      } else {
        openFreezeConfirmModal();
      }
    });
  }

  // Banner unfreeze button
  const unfreezeTodayBtn = document.getElementById('btn-unfreeze-today');
  if (unfreezeTodayBtn) {
    unfreezeTodayBtn.addEventListener('click', () => {
      audio.playClick();
      executeUnfreezeToday();
    });
  }

  // Modal confirm button
  const confirmBtn = document.getElementById('btn-confirm-freeze-action');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      audio.playQuestComplete();
      closeFreezeConfirmModal();
      executeFreezeToday();
    });
  }

  // Modal cancel button & backdrop
  const cancelBtn = document.getElementById('btn-cancel-freeze-action');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      audio.playClick();
      closeFreezeConfirmModal();
    });
  }
  const backdrop = document.getElementById('modal-freeze-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', closeFreezeConfirmModal);
  }
}

// ==========================================================
// CLOUD DATABASE SYNC CONTROLLER (Supabase & Firebase)
// ==========================================================
function setupCloudSync() {
  const openBtn = document.getElementById('btn-open-cloud-sync');
  const closeBtn = document.getElementById('btn-close-cloud-sync');
  const modal = document.getElementById('modal-cloud-sync');
  const backdrop = document.getElementById('modal-cloud-backdrop');

  const hudDot = document.getElementById('hud-cloud-dot');
  const hudLabel = document.getElementById('hud-cloud-label');
  const modalDot = document.getElementById('cloud-modal-dot');
  const modalStatusText = document.getElementById('cloud-modal-status-text');
  const modalTimestamp = document.getElementById('cloud-modal-timestamp');

  const tabSupabase = document.getElementById('tab-provider-supabase');
  const tabFirebase = document.getElementById('tab-provider-firebase');
  const groupSupabase = document.getElementById('fields-supabase-group');
  const groupFirebase = document.getElementById('fields-firebase-group');

  const inputSupabaseUrl = document.getElementById('input-supabase-url');
  const inputSupabaseKey = document.getElementById('input-supabase-key');
  const inputFirebaseProj = document.getElementById('input-firebase-project-id');
  const inputFirebaseKey = document.getElementById('input-firebase-api-key');
  const inputSyncUserId = document.getElementById('input-sync-user-id');
  const checkAutoSync = document.getElementById('check-cloud-auto-sync');

  const btnSave = document.getElementById('btn-save-cloud-config');
  const btnPull = document.getElementById('btn-cloud-pull-now');
  const btnPush = document.getElementById('btn-cloud-push-now');
  const btnDisconnect = document.getElementById('btn-cloud-disconnect');

  let currentProvider = 'supabase';

  function updateUIStatus(status, message = '', timestamp = null) {
    const statusMap = {
      'offline': { dotClass: 'dot-offline', label: 'Cloud: Local', text: 'Status: Offline (Local Storage Only)' },
      'unconfigured': { dotClass: 'dot-offline', label: 'Cloud: Local', text: 'Status: Offline (Not Configured)' },
      'syncing': { dotClass: 'dot-syncing', label: 'Syncing...', text: message || 'Status: Syncing with Cloud...' },
      'synced': { dotClass: 'dot-synced', label: 'Cloud Synced', text: message || 'Status: Connected & Synchronized' },
      'ready': { dotClass: 'dot-synced', label: 'Cloud Ready', text: message || 'Status: Ready to Sync' },
      'error': { dotClass: 'dot-error', label: 'Sync Error', text: message || 'Status: Sync Error' }
    };

    const s = statusMap[status] || statusMap.offline;

    if (hudDot) hudDot.className = `cloud-status-dot ${s.dotClass}`;
    if (hudLabel) hudLabel.innerText = s.label;
    if (modalDot) modalDot.className = `csc-indicator ${s.dotClass}`;
    if (modalStatusText) modalStatusText.innerText = s.text;

    if (modalTimestamp && timestamp) {
      const d = new Date(timestamp);
      modalTimestamp.innerText = `Last synced: ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    }
  }

  // Subscribe to status changes from sync engine
  onSyncStatusChange(({ status, message, timestamp }) => {
    updateUIStatus(status, message, timestamp);
  });

  // Populate inputs from existing config
  function populateFields() {
    const cfg = getCloudConfig();
    currentProvider = cfg.provider || 'supabase';

    if (inputSupabaseUrl) inputSupabaseUrl.value = cfg.supabaseUrl || '';
    if (inputSupabaseKey) inputSupabaseKey.value = cfg.supabaseAnonKey || '';
    if (inputFirebaseProj) inputFirebaseProj.value = cfg.firebaseProjectId || '';
    if (inputFirebaseKey) inputFirebaseKey.value = cfg.firebaseApiKey || '';
    if (inputSyncUserId) inputSyncUserId.value = cfg.syncUserId || 'suhas_s';
    if (checkAutoSync) checkAutoSync.checked = cfg.autoSync !== false;

    if (currentProvider === 'supabase') {
      tabSupabase?.classList.add('active');
      tabFirebase?.classList.remove('active');
      if (groupSupabase) groupSupabase.style.display = 'block';
      if (groupFirebase) groupFirebase.style.display = 'none';
    } else {
      tabFirebase?.classList.add('active');
      tabSupabase?.classList.remove('active');
      if (groupFirebase) groupFirebase.style.display = 'block';
      if (groupSupabase) groupSupabase.style.display = 'none';
    }

    if (isCloudConfigured()) {
      updateUIStatus('ready', 'Configured: Ready to Sync', cfg.lastSyncedAt);
    } else {
      updateUIStatus('offline', 'Status: Offline (Local Storage Only)');
    }
  }

  populateFields();

  // Provider Tab Switching
  if (tabSupabase) {
    tabSupabase.addEventListener('click', () => {
      audio.playClick();
      currentProvider = 'supabase';
      tabSupabase.classList.add('active');
      tabFirebase?.classList.remove('active');
      if (groupSupabase) groupSupabase.style.display = 'block';
      if (groupFirebase) groupFirebase.style.display = 'none';
    });
  }

  if (tabFirebase) {
    tabFirebase.addEventListener('click', () => {
      audio.playClick();
      currentProvider = 'firebase';
      tabFirebase.classList.add('active');
      tabSupabase?.classList.remove('active');
      if (groupFirebase) groupFirebase.style.display = 'block';
      if (groupSupabase) groupSupabase.style.display = 'none';
    });
  }

  // Open & Close Modal
  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      audio.playClick();
      populateFields();
      modal.classList.add('active');
    });
  }

  const closeModal = () => {
    audio.playClick();
    modal?.classList.remove('active');
  };

  closeBtn?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', closeModal);

  // Save & Connect Button
  btnSave?.addEventListener('click', async () => {
    audio.playClick();
    const config = {
      provider: currentProvider,
      supabaseUrl: inputSupabaseUrl ? inputSupabaseUrl.value.trim() : '',
      supabaseAnonKey: inputSupabaseKey ? inputSupabaseKey.value.trim() : '',
      firebaseProjectId: inputFirebaseProj ? inputFirebaseProj.value.trim() : '',
      firebaseApiKey: inputFirebaseKey ? inputFirebaseKey.value.trim() : '',
      syncUserId: inputSyncUserId ? inputSyncUserId.value.trim() || 'suhas_s' : 'suhas_s',
      autoSync: checkAutoSync ? checkAutoSync.checked : true,
      lastSyncedAt: null
    };

    saveCloudConfig(config);

    const testRes = await testCloudConnection(config);
    if (testRes.success) {
      audio.playQuestComplete();
      showToast('Cloud connection verified! Backing up local state...');
      await pushStateToCloud(state);
    } else {
      audio.playClick();
      showToast(`Connection failed: ${testRes.error}`);
    }
  });

  // Pull from Cloud Button
  btnPull?.addEventListener('click', async () => {
    audio.playClick();
    if (!isCloudConfigured()) {
      showToast('Please enter and save your Cloud credentials first.');
      return;
    }
    const remote = await pullStateFromCloud();
    if (remote) {
      state = remote;
      saveState(state);
      renderAll();
      audio.playQuestComplete();
      showToast('SUCCESS: Loaded latest data from cloud! UI refreshed.');
    } else {
      showToast('Cloud is connected, but no remote data was found for this User ID.');
    }
  });

  // Push to Cloud Button
  btnPush?.addEventListener('click', async () => {
    audio.playClick();
    if (!isCloudConfigured()) {
      showToast('Please enter and save your Cloud credentials first.');
      return;
    }
    const res = await pushStateToCloud(state);
    if (res.success) {
      audio.playQuestComplete();
      showToast('SUCCESS: Local progress uploaded to Cloud!');
    } else {
      showToast(`Push failed: ${res.error}`);
    }
  });

  // Disconnect Button
  btnDisconnect?.addEventListener('click', () => {
    audio.playClick();
    if (confirm('Disconnect from cloud? (Your local data will remain safe)')) {
      saveCloudConfig({
        provider: 'supabase',
        supabaseUrl: '',
        supabaseAnonKey: '',
        firebaseProjectId: '',
        firebaseApiKey: '',
        syncUserId: 'suhas_s',
        autoSync: true,
        lastSyncedAt: null
      });
      populateFields();
      updateUIStatus('offline', 'Status: Disconnected');
      showToast('Cloud disconnected. Running in 100% offline local mode.');
    }
  });

  // Initial auto-sync check on app launch if configured
  if (isCloudConfigured()) {
    setTimeout(async () => {
      try {
        const remote = await pullStateFromCloud();
        if (remote && remote.player) {
          state = remote;
          saveState(state);
          renderAll();
        }
      } catch (e) {
        console.warn('Initial cloud sync check skipped:', e);
      }
    }, 1200);
  }
}
