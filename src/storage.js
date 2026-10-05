/**
 * State Management & Persistent Storage for THE SYSTEM
 * Grounded, practical real-life gamification with Dear Diary support
 */

const STORAGE_KEY = 'the_system_monarch_state_v2';
import { queueCloudSync } from './sync.js';

export function getDefaultState() {
  const now = Date.now();

  return {
    player: {
      name: "Suhas S",
      rank: "E",
      level: 1,
      xp: 0,
      xpRequired: 100,
      gold: 0,
      unallocatedStatPoints: 0,
      title: "Rank E",
      class: "Data Scientist & Strategist",
      hp: 100,
      maxHp: 100,
      mp: 100,
      maxMp: 100
    },
    stats: {
      pur: 10,
      vit: 10,
      str: 10,
      cha: 10,
      aura: 10,
      int: 10
    },
    settings: {
      cigsPerDay: 2,
      costPerCig: 25
    },
    campaignStartDate: '2026-10-05',
    campaignBaseEndDate: '2027-04-01',
    extendedDaysCount: 0,
    frozenDates: {}, // Format: { 'YYYY-MM-DD': { type: 'travel'|'sick', reason: string, timestamp: number } }
    dailyHistory: {},
    diaryEntries: [],
    pillarPurity: {
      streakDays: 0,
      lastRelapseTimestamp: new Date('2026-10-05T00:00:00').getTime(),
      breachHistory: []
    },
    pillarEngine: {
      smokeFreeStartTimestamp: new Date('2026-10-05T00:00:00').getTime(),
      cigsAvoidedCount: 0,
      moneySaved: 0,
      cravingSurfedCount: 0
    },
    pillarForge: {
      workoutsDone: 0,
      currentStreak: 0,
      lastWorkoutDate: null,
      weeklySchedule: {
        1: { day: 'Monday', split: 'Legs & Abs', done: false },
        2: { day: 'Tuesday', split: 'Pull (Back & Biceps)', done: false },
        3: { day: 'Wednesday', split: 'Push (Chest & Triceps)', done: false },
        4: { day: 'Thursday', split: 'Legs & Abs', done: false },
        5: { day: 'Friday', split: 'Pull (Back & Biceps)', done: false },
        6: { day: 'Saturday', split: 'Push (Chest & Triceps)', done: false },
        0: { day: 'Sunday', split: 'Holiday', done: false }
      },
      strengthExercises: [
        { id: 'se_1', name: 'Incline / Wall Push-ups', sets: 3, done: false },
        { id: 'se_2', name: 'Active Bar Dead Hangs', sets: 3, done: false }
      ]
    },
    pillarHunter: {
      dawnTasks: [
        { id: 'wake_5am', text: 'Wake up at 5:00 AM (Early discipline & high energy)', done: false, xp: 25 },
        { id: 'water_3l', text: 'Drink water (Hydrate body & hit 3 Liters daily goal)', done: false, xp: 20 },
        { id: 'skincare_am', text: 'Morning skincare (Ice pack, Cleanser + Moisturizer + Sunscreen)', done: false, xp: 25 },
        { id: 'pelvic_tilt', text: 'Pelvic exercise (Glute bridges & stretches for Anterior Pelvic Tilt)', done: false, xp: 25 }
      ],
      nightTasks: [
        { id: 'screens_off', text: 'Put phone away 45 mins before sleep', done: false, xp: 25 },
        { id: 'skincare_pm', text: 'Night skincare (Face wash + Moisturizer)', done: false, xp: 25 },
        { id: 'gratitude_check', text: 'Say a prayer of thanks to God for today', done: false, xp: 20 },
        { id: 'sleep_8h', text: 'In bed on time for 8 hours deep restorative sleep', done: false, xp: 30 }
      ],
      antiJunkClaimed: false,
      proteinGrams: 0,
      proteinTarget: 120,
      aptChecklist: [
        { id: 'apt_bridge', text: 'Glute Bridges (2 sets x 15 reps - tuck tailbone, squeeze glutes)', done: false },
        { id: 'apt_stretch', text: 'Kneeling Hip Flexor Stretch (1 min/side - open tight psoas)', done: false },
        { id: 'apt_deadbug', text: 'Posterior Pelvic Tilts / Deadbugs (2 sets x 12 reps - flatten lower back)', done: false }
      ],
      skinGlow: 0
    },
    pillarAura: {
      auraTasks: [
        { id: 'speak_less', text: 'Speak less (Talk with intention, calm voice, eliminate useless chatter)', done: false, xp: 35 },
        { id: 'slow_movements', text: 'Slow your movements (Walk steadily, move with calm, grounded authority)', done: false, xp: 30 },
        { id: 'lower_reactivity', text: 'Lower your emotional reactivity (Respond, don\'t react; stay calm under pressure)', done: false, xp: 35 },
        { id: 'seeking_validation', text: 'Stop seeking validation (Never fish for compliments or people-please)', done: false, xp: 35 },
        { id: 'standards', text: 'Uphold high standards (Uncompromising self-respect, boundaries & discipline)', done: false, xp: 40 },
        { id: 'dont_overshare', text: 'Don\'t overshare (Keep private life, future ambitions & finances guarded)', done: false, xp: 30 },
        { id: 'ego_hurt', text: 'Master ego hurt (Zero defensiveness or pettiness when pride is tested)', done: false, xp: 35 }
      ],
      gratitudeEntries: ["", "", ""],
      gratitudeSealedDate: null,
      dailyMoodScore: 8,
      dailyMoodDate: null
    },
    pillarApex: {
      tracks: [
        { id: 'sns', trackNum: '01', title: 'SNS Work', xp: 40, done: false },
        { id: 'consumo', trackNum: '02', title: 'Consumo Progress', xp: 50, done: false },
        { id: 'apply', trackNum: '03', title: 'Apply to Companies', xp: 50, done: false },
        { id: 'excel', trackNum: '04', title: 'Excel Skill', xp: 40, done: false },
        { id: 'mlops', trackNum: '05', title: 'MLOps Skill', xp: 45, done: false }
      ]
    },
    dailyChecklist: [
      { id: 'core_pur', title: 'Purity: Zero Indulgence & High Retention', pillar: 'Self-Control', xp: 60, gold: 25, done: false },
      { id: 'core_smoke', title: 'Smoke-Free: Clean Lungs All Day', pillar: 'Health', xp: 60, gold: 25, done: false },
      { id: 'core_gym', title: 'Gym Training Session OR Active Recovery', pillar: 'Fitness', xp: 80, gold: 30, done: false },
      { id: 'core_dawn', title: 'Morning Routine & Clean Healthy Food', pillar: 'Habits', xp: 50, gold: 20, done: false },
      { id: 'core_aura', title: 'Character: Speak Less, Zero Clowning & Gratitude', pillar: 'Mindset', xp: 50, gold: 20, done: false },
      { id: 'core_career', title: 'Career Engine: SNS, Consumo, Applications & MLOps', pillar: 'Career', xp: 80, gold: 35, done: false }
    ],
    rewardsShop: [
      { id: 'rw_game', title: '1 Hour Guilt-Free Gaming', desc: 'Relax and play games with zero guilt.', cost: 120, icon: 'GAME' },
      { id: 'rw_movie', title: 'Movie Night', desc: 'Unwind with a great film.', cost: 250, icon: 'FILM' },
      { id: 'rw_cheat_clean', title: 'Favorite Restaurant Dinner', desc: 'Celebrate a week of hard work.', cost: 400, icon: 'MEAL' },
      { id: 'rw_clothes', title: 'New Gym or Streetwear Outfit', desc: 'Upgrade your personal style.', cost: 1200, icon: 'STYLE' },
      { id: 'rw_perfume', title: 'Quality Signature Cologne', desc: 'Enhance your daily presence.', cost: 2500, icon: 'AROMA' },
      { id: 'rw_headphones', title: 'Noise-Cancelling Headphones', desc: 'Deep work & study armor.', cost: 6000, icon: 'TECH' }
    ],
    lastResetDate: new Date().toDateString(),
    dailyHistory: {}
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    const parsed = JSON.parse(raw);
    const defaultState = getDefaultState();

    const today = new Date().toDateString();
    if (parsed.lastResetDate !== today) {
      if (!parsed.dailyHistory) parsed.dailyHistory = {};
      parsed.dailyHistory[parsed.lastResetDate] = {
        date: parsed.lastResetDate,
        purityStreak: parsed.pillarPurity?.streakDays || 0,
        cigsAvoided: parsed.pillarEngine?.cigsAvoidedCount || 0,
        workoutsDone: parsed.pillarForge?.workoutsDone || 0,
        completedQuests: (parsed.dailyChecklist || []).filter(q => q.done).map(q => q.title),
        savedCash: parsed.pillarEngine?.moneySaved || 0,
        proteinGrams: parsed.pillarHunter?.proteinGrams || 0,
        careerTracksDone: (parsed.pillarApex?.tracks || []).filter(t => t.done).map(t => t.title),
        dailyMoodScore: parsed.pillarAura?.dailyMoodScore || 8,
        antiJunkClaimed: parsed.pillarHunter?.antiJunkClaimed || false,
        gratitudeSealed: Boolean(parsed.pillarAura?.gratitudeSealedDate)
      };

      parsed.lastResetDate = today;
      if (parsed.dailyChecklist) {
        parsed.dailyChecklist.forEach(q => q.done = false);
      }
      if (parsed.pillarHunter) {
        parsed.pillarHunter.dawnTasks.forEach(t => t.done = false);
        parsed.pillarHunter.nightTasks.forEach(t => t.done = false);
        parsed.pillarHunter.antiJunkClaimed = false;
        parsed.pillarHunter.proteinGrams = 0;
      }
      if (parsed.pillarAura) {
        parsed.pillarAura.auraTasks.forEach(t => t.done = false);
      }
      if (parsed.pillarApex && parsed.pillarApex.tracks) {
        parsed.pillarApex.tracks.forEach(t => t.done = false);
      }
    }

    if (!parsed.frozenDates) parsed.frozenDates = {};
    parsed.extendedDaysCount = Object.keys(parsed.frozenDates).length;

    // Reset baseline to 0 for official launch starting Oct 5, 2026
    if (!parsed.officialOct5BlankSlateApplied) {
      parsed.officialOct5BlankSlateApplied = true;
      parsed.statsResetForOct5Launch = true;
      parsed.dailyHistory = {};
      parsed.diaryEntries = [];
      if (parsed.player) {
        parsed.player.xp = 0;
        parsed.player.gold = 0;
        parsed.player.level = 1;
        parsed.player.xpRequired = 100;
      }
      if (parsed.pillarPurity) {
        parsed.pillarPurity.streakDays = 0;
        parsed.pillarPurity.breachHistory = [];
      }
      if (parsed.pillarEngine) {
        parsed.pillarEngine.cigsAvoidedCount = 0;
        parsed.pillarEngine.moneySaved = 0;
        parsed.pillarEngine.cravingSurfedCount = 0;
        parsed.pillarEngine.smokeFreeStartTimestamp = Date.now();
      }
      if (parsed.pillarForge) {
        parsed.pillarForge.workoutsDone = 0;
        parsed.pillarForge.currentStreak = 0;
        if (parsed.pillarForge.weeklySchedule) {
          Object.values(parsed.pillarForge.weeklySchedule).forEach(s => s.done = false);
        }
        if (parsed.pillarForge.strengthExercises) {
          parsed.pillarForge.strengthExercises.forEach(e => e.done = false);
        }
      }
      if (parsed.pillarHunter) {
        parsed.pillarHunter.proteinGrams = 0;
        parsed.pillarHunter.skinGlow = 0;
        parsed.pillarHunter.antiJunkClaimed = false;
        if (parsed.pillarHunter.dawnTasks) parsed.pillarHunter.dawnTasks.forEach(t => t.done = false);
        if (parsed.pillarHunter.nightTasks) parsed.pillarHunter.nightTasks.forEach(t => t.done = false);
      }
      if (parsed.pillarApex) {
        parsed.pillarApex.applicationsSent = 0;
        parsed.pillarApex.analyticsLeadersReached = 0;
        parsed.pillarApex.bossHp = 100;
        if (parsed.pillarApex.tracks) parsed.pillarApex.tracks.forEach(t => t.done = false);
      }
      if (parsed.pillarAura) {
        if (parsed.pillarAura.auraTasks) parsed.pillarAura.auraTasks.forEach(t => t.done = false);
        parsed.pillarAura.dailyMoodScore = 0;
        parsed.pillarAura.gratitudeEntries = ["", "", ""];
        parsed.pillarAura.gratitudeSealedDate = null;
      }
      if (parsed.dailyChecklist) {
        parsed.dailyChecklist.forEach(q => q.done = false);
      }
      saveState(parsed);
    }

    if (parsed.settings) {
      if (parsed.settings.cigsPerDay === 8 || !parsed.settings.cigsPerDay) parsed.settings.cigsPerDay = 2;
      if (!parsed.settings.costPerCig) parsed.settings.costPerCig = 25;
      delete parsed.settings.packCost;
      delete parsed.settings.spaCost;
    }

    if (parsed.pillarForge) {
      if (!parsed.pillarForge.weeklySchedule) {
        parsed.pillarForge.weeklySchedule = defaultState.pillarForge.weeklySchedule;
      }
      if (!parsed.pillarForge.strengthExercises) {
        parsed.pillarForge.strengthExercises = defaultState.pillarForge.strengthExercises;
      }
    }

    if (parsed.pillarHunter) {
      const defaultDawn = defaultState.pillarHunter.dawnTasks;
      if (!parsed.pillarHunter.dawnTasks || parsed.pillarHunter.dawnTasks.length !== defaultDawn.length || !parsed.pillarHunter.dawnTasks.some(t => t.id === 'wake_5am')) {
        parsed.pillarHunter.dawnTasks = defaultDawn;
      }
      const defaultNight = defaultState.pillarHunter.nightTasks;
      if (!parsed.pillarHunter.nightTasks || !parsed.pillarHunter.nightTasks.some(t => t.id === 'sleep_8h')) {
        parsed.pillarHunter.nightTasks = defaultNight;
      }
      if (parsed.pillarHunter.proteinGrams === undefined) {
        parsed.pillarHunter.proteinGrams = 0;
      }
      if (!parsed.pillarHunter.proteinTarget) {
        parsed.pillarHunter.proteinTarget = 120;
      }
      if (!parsed.pillarHunter.aptChecklist) {
        parsed.pillarHunter.aptChecklist = defaultState.pillarHunter.aptChecklist;
      }
    }

    if (parsed.pillarAura) {
      const defaultAura = defaultState.pillarAura.auraTasks;
      if (!parsed.pillarAura.auraTasks || parsed.pillarAura.auraTasks.length !== defaultAura.length || !parsed.pillarAura.auraTasks.some(t => t.id === 'slow_movements')) {
        parsed.pillarAura.auraTasks = defaultAura;
      }
      if (!parsed.pillarAura.gratitudeEntries) {
        parsed.pillarAura.gratitudeEntries = ["", "", ""];
      }
      if (typeof parsed.pillarAura.dailyMoodScore === 'undefined') {
        parsed.pillarAura.dailyMoodScore = 8;
      }
    }

    if (!parsed.pillarApex || !Array.isArray(parsed.pillarApex.tracks) || parsed.pillarApex.tracks.length !== 5) {
      if (!parsed.pillarApex) parsed.pillarApex = {};
      parsed.pillarApex.tracks = defaultState.pillarApex.tracks;
    }

    if (parsed.player) {
      parsed.player.name = "Suhas S";
      const rankInfo = calculateRank(parsed.player.level || 1);
      parsed.player.rank = rankInfo.rank;
      parsed.player.title = rankInfo.title;
    }

    // Anchor smoke-free and purity timestamps to campaign launch (Oct 5, 2026, 00:00:00)
    // so continuous clean time is measured accurately from midnight when the game officially started
    const campaignStart = new Date('2026-10-05T00:00:00').getTime();
    if (Date.now() >= campaignStart) {
      if (parsed.pillarEngine && (!parsed.pillarEngine.smokeFreeStartTimestamp || parsed.pillarEngine.smokeFreeStartTimestamp > campaignStart)) {
        parsed.pillarEngine.smokeFreeStartTimestamp = campaignStart;
      }
      if (parsed.pillarPurity && (!parsed.pillarPurity.lastRelapseTimestamp || (parsed.pillarPurity.lastRelapseTimestamp > campaignStart && (!parsed.pillarPurity.breachHistory || parsed.pillarPurity.breachHistory.length === 0)))) {
        parsed.pillarPurity.lastRelapseTimestamp = campaignStart;
      }
    }

    return { ...defaultState, ...parsed };
  } catch (e) {
    console.error('Failed to load state from localStorage:', e);
    return getDefaultState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    queueCloudSync(state);
  } catch (e) {
    console.error('Failed to save state to localStorage:', e);
  }
}

export function calculateRank(level) {
  if (level >= 86) return { rank: "S", title: "Rank S" };
  if (level >= 71) return { rank: "A", title: "Rank A" };
  if (level >= 51) return { rank: "B", title: "Rank B" };
  if (level >= 31) return { rank: "C", title: "Rank C" };
  if (level >= 16) return { rank: "D", title: "Rank D" };
  return { rank: "E", title: "Rank E" };
}

/**
 * Aggregates a historical timeline array of N days combining saved dailyHistory and today's live state.
 */
export function getHistoricalTimeline(state, numDays = 7) {
  const history = state?.dailyHistory || {};
  const timeline = [];
  const today = new Date();

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toDateString();
    const dayName = dayNames[d.getDay()];
    const shortDate = `${monthNames[d.getMonth()]} ${d.getDate()}`;
    const isToday = (i === 0);
    const campaignStart = new Date('2026-10-05T00:00:00');
    const isBeforeLaunch = d < campaignStart;

    if (isToday) {
      const dawnDone = (state?.pillarHunter?.dawnTasks || []).filter(t => t.done).length;
      const nightDone = (state?.pillarHunter?.nightTasks || []).filter(t => t.done).length;
      const strengthDone = (state?.pillarForge?.strengthExercises || []).filter(e => e.done).length;
      const careerDone = (state?.pillarApex?.tracks || []).filter(t => t.done).length;
      const gymCompleted = Boolean(
        (state?.dailyChecklist || []).find(q => q.id === 'core_gym')?.done ||
        state?.pillarForge?.weeklySchedule?.[d.getDay()]?.done ||
        strengthDone > 0
      );

      const hasActivity = Boolean((state?.player?.xp || 0) > 0 || gymCompleted || dawnDone > 0 || careerDone > 0);

      timeline.push({
        date: dateStr,
        shortDate,
        day: dayName,
        isToday: true,
        xp: isBeforeLaunch && !hasActivity ? 0 : (state?.player?.xp || 0),
        workoutsDone: isBeforeLaunch && !hasActivity ? 0 : (state?.pillarForge?.workoutsDone || 0),
        workoutCompleted: isBeforeLaunch && !hasActivity ? false : gymCompleted,
        strengthSets: isBeforeLaunch && !hasActivity ? 0 : strengthDone,
        proteinGrams: isBeforeLaunch && !hasActivity ? 0 : (state?.pillarHunter?.proteinGrams || 0),
        proteinTarget: 120,
        dailyMoodScore: isBeforeLaunch && !hasActivity ? 0 : (state?.pillarAura?.dailyMoodScore || 0),
        careerTracksDoneCount: isBeforeLaunch && !hasActivity ? 0 : careerDone,
        purityStreak: isBeforeLaunch && !hasActivity ? 0 : (state?.pillarPurity?.streakDays || 0),
        savedCash: isBeforeLaunch && !hasActivity ? 0 : (state?.pillarEngine?.moneySaved || 0),
        cigsAvoided: isBeforeLaunch && !hasActivity ? 0 : (state?.pillarEngine?.cigsAvoidedCount || 0),
        dawnDone: isBeforeLaunch && !hasActivity ? 0 : dawnDone,
        nightDone: isBeforeLaunch && !hasActivity ? 0 : nightDone,
        auraHabitsDone: isBeforeLaunch && !hasActivity ? 0 : (state?.pillarAura?.auraTasks || []).filter(t => t.done).length,
        antiJunkClaimed: isBeforeLaunch && !hasActivity ? false : Boolean(state?.pillarHunter?.antiJunkClaimed),
        stasisFrozen: Boolean(state?.frozenDates && state?.frozenDates[dateStr]),
        hasRecord: hasActivity && !isBeforeLaunch
      });
    } else if (history[dateStr]) {
      const rec = history[dateStr];
      timeline.push({
        date: dateStr,
        shortDate,
        day: dayName,
        isToday: false,
        xp: rec.xpEarned || 0,
        workoutsDone: rec.workoutsDone || 0,
        workoutCompleted: Boolean(rec.workoutCompleted || (rec.workoutsDone && rec.workoutsDone > 0)),
        strengthSets: rec.strengthSets || 0,
        proteinGrams: rec.proteinGrams || 0,
        proteinTarget: 120,
        dailyMoodScore: rec.dailyMoodScore || 0,
        careerTracksDoneCount: Array.isArray(rec.careerTracksDone) ? rec.careerTracksDone.length : (rec.careerTracksDoneCount || 0),
        purityStreak: rec.purityStreak || 0,
        savedCash: rec.savedCash || 0,
        cigsAvoided: rec.cigsAvoided || 0,
        dawnDone: rec.dawnDone || 0,
        nightDone: rec.nightDone || 0,
        auraHabitsDone: rec.auraHabitsDone || 0,
        antiJunkClaimed: Boolean(rec.antiJunkClaimed),
        stasisFrozen: Boolean(state?.frozenDates && state?.frozenDates[dateStr]),
        hasRecord: true
      });
    } else {
      // Historical baseline days (clean 0 no history)
      timeline.push({
        date: dateStr,
        shortDate,
        day: dayName,
        isToday: false,
        xp: 0,
        workoutsDone: 0,
        workoutCompleted: false,
        strengthSets: 0,
        proteinGrams: 0,
        proteinTarget: 120,
        dailyMoodScore: 0,
        careerTracksDoneCount: 0,
        purityStreak: 0,
        savedCash: 0,
        cigsAvoided: 0,
        dawnDone: 0,
        nightDone: 0,
        auraHabitsDone: 0,
        antiJunkClaimed: false,
        stasisFrozen: false,
        hasRecord: false
      });
    }
  }

  return timeline;
}
