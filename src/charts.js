/**
 * LIFE OS // PROGRESS CHARTS & HISTORICAL ANALYTICS ENGINE
 * Renders multi-day historical trends, workout volume bars, protein tracking,
 * mood frequency curves, career sprint progress, and GitHub-style campaign heatmaps.
 * Zero-baseline architecture for official launch starting Oct 5, 2026.
 */

// Helper to set up responsive canvas with High-DPI support
function setupCanvas(canvasId, fallbackWidth = 400, fallbackHeight = 150) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || fallbackWidth;
  const height = canvas.clientHeight || fallbackHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  return { canvas, ctx, width, height };
}

// ==========================================================================
// 1. OVERALL WEEKLY MOMENTUM & GROWTH TREND CURVE
// ==========================================================================
export function renderWeeklyTrendChart(canvasId, activityData) {
  const c = setupCanvas(canvasId, 500, 240);
  if (!c) return;
  const { ctx, width, height } = c;

  let days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  let values = [0, 0, 0, 0, 0, 0, 0];

  if (Array.isArray(activityData) && activityData.length > 0) {
    if (typeof activityData[0] === 'object' && activityData[0] !== null) {
      days = activityData.map(d => d.day || 'Day');
      values = activityData.map(d => Number(d.xp) || 0);
    } else {
      values = activityData.map(v => Number(v) || 0);
    }
  }

  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const isAllZero = values.every(v => v === 0);
  const maxVal = isAllZero ? 100 : Math.max(...values, 120);

  // Horizontal Grid Lines
  const gridLines = 4;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#64748b';
  ctx.font = '500 10px Rajdhani, monospace';
  ctx.textAlign = 'right';

  for (let i = 0; i <= gridLines; i++) {
    const y = paddingTop + (chartHeight / gridLines) * i;
    const val = Math.round(maxVal - (maxVal / gridLines) * i);
    ctx.beginPath();
    ctx.moveTo(paddingLeft, y);
    ctx.lineTo(width - paddingRight, y);
    ctx.stroke();
    ctx.fillText(val, paddingLeft - 8, y + 3);
  }

  // Calculate points
  const points = values.map((val, idx) => {
    const x = paddingLeft + (chartWidth / Math.max(days.length - 1, 1)) * idx;
    const y = paddingTop + chartHeight - (val / Math.max(maxVal, 1)) * chartHeight;
    return { x, y, val, day: days[idx] };
  });

  if (isAllZero) {
    // Clean zero-baseline state for campaign launch
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, paddingTop + chartHeight);
    ctx.lineTo(width - paddingRight, paddingTop + chartHeight);
    ctx.stroke();

    // Subtle notice in chart center
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 11px Rajdhani, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CAMPAIGN LAUNCHES OCT 5 (12:00 AM) • 0 XP LOGGED', width / 2, paddingTop + chartHeight / 2 - 8);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 10px Outfit, sans-serif';
    ctx.fillText('Protocol momentum curve starts recording tomorrow officially', width / 2, paddingTop + chartHeight / 2 + 10);

    // Draw day ticks along bottom
    points.forEach((pt) => {
      ctx.beginPath();
      ctx.arc(pt.x, paddingTop + chartHeight, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.fill();

      ctx.fillStyle = '#64748b';
      ctx.font = '500 10px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pt.day, pt.x, height - 10);
    });

    return;
  }

  // Area gradient fill for active curve
  if (points.length > 1) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const midX = (p0.x + p1.x) / 2;
      const midY = (p0.y + p1.y) / 2;
      ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
    }
    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.lineTo(last.x, paddingTop + chartHeight);
    ctx.lineTo(points[0].x, paddingTop + chartHeight);
    ctx.closePath();

    const areaGrad = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + chartHeight);
    areaGrad.addColorStop(0, 'rgba(0, 240, 255, 0.35)');
    areaGrad.addColorStop(0.6, 'rgba(168, 85, 247, 0.15)');
    areaGrad.addColorStop(1, 'rgba(0, 240, 255, 0.0)');
    ctx.fillStyle = areaGrad;
    ctx.fill();

    // Line stroke
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const midX = (p0.x + p1.x) / 2;
      const midY = (p0.y + p1.y) / 2;
      ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
    }
    ctx.lineTo(last.x, last.y);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Draw points and labels
  points.forEach((pt) => {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 10px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(pt.day, pt.x, height - 10);

    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#00f0ff';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px Rajdhani, monospace';
    ctx.fillText(`${pt.val} XP`, pt.x, pt.y - 8);
  });
}

// ==========================================================================
// 2. MULTI-DAY WORKOUT & TRAINING FREQUENCY BAR CHART
// ==========================================================================
export function renderWorkoutHistoryChart(canvasId, timeline) {
  const c = setupCanvas(canvasId, 380, 140);
  if (!c) return;
  const { ctx, width, height } = c;

  const defaultTimeline = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
    day,
    workoutCompleted: false,
    strengthSets: 0,
    isToday: false
  }));
  const data = Array.isArray(timeline) && timeline.length > 0 ? timeline : defaultTimeline;

  const paddingLeft = 32;
  const paddingRight = 16;
  const paddingTop = 20;
  const paddingBottom = 26;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const totalDays = data.length;
  const colWidth = chartWidth / totalDays;
  const barWidth = Math.min(Math.max(colWidth * 0.55, 14), 28);

  // Grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#64748b';
  ctx.font = '500 9px Rajdhani, monospace';
  ctx.textAlign = 'right';

  [0, 3, 6].forEach((val) => {
    const y = paddingTop + chartHeight - (val / 6) * chartHeight;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, y);
    ctx.lineTo(width - paddingRight, y);
    ctx.stroke();
    ctx.fillText(`${val}s`, paddingLeft - 5, y + 3);
  });

  data.forEach((d, idx) => {
    const centerX = paddingLeft + colWidth * idx + colWidth / 2;
    const isDone = Boolean(d.workoutCompleted && (d.strengthSets || 0) > 0);
    const sets = Number(d.strengthSets) || 0;
    const barHeight = isDone ? Math.max((sets / 6) * chartHeight, 16) : 4;
    const barY = paddingTop + chartHeight - barHeight;

    ctx.beginPath();
    ctx.roundRect(centerX - barWidth / 2, barY, barWidth, barHeight, [4, 4, 0, 0]);

    if (isDone) {
      const grad = ctx.createLinearGradient(0, barY, 0, barY + barHeight);
      grad.addColorStop(0, '#f59e0b');
      grad.addColorStop(1, '#b45309');
      ctx.fillStyle = grad;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#fef3c7';
      ctx.font = 'bold 9px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`✓ ${sets}s`, centerX, barY - 4);
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fill();

      ctx.fillStyle = '#475569';
      ctx.font = '8px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('REST', centerX, barY - 4);
    }

    // Day label
    ctx.fillStyle = d.isToday ? '#00f0ff' : '#94a3b8';
    ctx.font = d.isToday ? 'bold 10px Outfit, sans-serif' : '500 10px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.day, centerX, height - 8);
  });
}

// ==========================================================================
// 3. DAILY PROTEIN INTAKE TREND VS 120G BENCHMARK LINE
// ==========================================================================
export function renderProteinHistoryChart(canvasId, timeline) {
  const c = setupCanvas(canvasId, 380, 140);
  if (!c) return;
  const { ctx, width, height } = c;

  const defaultTimeline = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
    day,
    proteinGrams: 0,
    isToday: false
  }));
  const data = Array.isArray(timeline) && timeline.length > 0 ? timeline : defaultTimeline;

  const paddingLeft = 36;
  const paddingRight = 16;
  const paddingTop = 20;
  const paddingBottom = 26;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const maxGrams = 150;
  const targetGrams = 120;

  // 120g Benchmark Target Line (Dashed Neon Gold)
  const targetY = paddingTop + chartHeight - (targetGrams / maxGrams) * chartHeight;
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(paddingLeft, targetY);
  ctx.lineTo(width - paddingRight, targetY);
  ctx.stroke();
  ctx.restore();

  // Target Label
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 9px Rajdhani, monospace';
  ctx.textAlign = 'left';
  ctx.fillText('TARGET: 120g', paddingLeft + 4, targetY - 4);

  // Y-axis grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#64748b';
  ctx.font = '500 9px Rajdhani, monospace';
  ctx.textAlign = 'right';

  [0, 60, 120, 150].forEach((val) => {
    const y = paddingTop + chartHeight - (val / maxGrams) * chartHeight;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, y);
    ctx.lineTo(width - paddingRight, y);
    ctx.stroke();
    ctx.fillText(`${val}g`, paddingLeft - 5, y + 3);
  });

  const isAllZero = data.every(d => (Number(d.proteinGrams) || 0) === 0);

  const points = data.map((d, idx) => {
    const grams = Number(d.proteinGrams) || 0;
    const x = paddingLeft + (chartWidth / Math.max(data.length - 1, 1)) * idx;
    const y = paddingTop + chartHeight - (grams / maxGrams) * chartHeight;
    return { x, y, grams, day: d.day, isToday: d.isToday };
  });

  if (isAllZero) {
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, paddingTop + chartHeight);
    ctx.lineTo(width - paddingRight, paddingTop + chartHeight);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '500 10px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Target: 120g Daily Benchmark • Tracking Starts Oct 5', width / 2, paddingTop + chartHeight / 2);

    points.forEach((pt) => {
      ctx.fillStyle = pt.isToday ? '#00f0ff' : '#94a3b8';
      ctx.font = pt.isToday ? 'bold 10px Outfit, sans-serif' : '500 10px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pt.day, pt.x, height - 8);

      ctx.beginPath();
      ctx.arc(pt.x, paddingTop + chartHeight, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.fill();
    });

    return;
  }

  // Draw active curve
  if (points.length > 1) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const midX = (p0.x + p1.x) / 2;
      const midY = (p0.y + p1.y) / 2;
      ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
    }
    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.lineTo(last.x, paddingTop + chartHeight);
    ctx.lineTo(points[0].x, paddingTop + chartHeight);
    ctx.closePath();

    const areaGrad = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + chartHeight);
    areaGrad.addColorStop(0, 'rgba(245, 158, 11, 0.35)');
    areaGrad.addColorStop(1, 'rgba(245, 158, 11, 0.0)');
    ctx.fillStyle = areaGrad;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const midX = (p0.x + p1.x) / 2;
      const midY = (p0.y + p1.y) / 2;
      ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
    }
    ctx.lineTo(last.x, last.y);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.2;
    ctx.stroke();
  }

  // Draw dots and day labels
  points.forEach((pt) => {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = pt.grams >= targetGrams ? '#10b981' : '#f59e0b';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = pt.grams >= targetGrams ? '#10b981' : '#fcd34d';
    ctx.font = 'bold 9px Rajdhani, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${pt.grams}g`, pt.x, pt.y - 7);

    ctx.fillStyle = pt.isToday ? '#00f0ff' : '#94a3b8';
    ctx.font = pt.isToday ? 'bold 10px Outfit, sans-serif' : '500 10px Outfit, sans-serif';
    ctx.fillText(pt.day, pt.x, height - 8);
  });
}

// ==========================================================================
// 4. STOIC MOOD & INTERNAL FREQUENCY CURVE (1 TO 10)
// ==========================================================================
export function renderMoodHistoryChart(canvasId, timeline) {
  const c = setupCanvas(canvasId, 380, 140);
  if (!c) return;
  const { ctx, width, height } = c;

  const defaultTimeline = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
    day,
    dailyMoodScore: 0,
    isToday: false
  }));
  const data = Array.isArray(timeline) && timeline.length > 0 ? timeline : defaultTimeline;

  const paddingLeft = 32;
  const paddingRight = 16;
  const paddingTop = 20;
  const paddingBottom = 26;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Sovereign Zone Threshold Line at 8
  const sovereignY = paddingTop + chartHeight - (8 / 10) * chartHeight;
  ctx.save();
  ctx.setLineDash([3, 3]);
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(paddingLeft, sovereignY);
  ctx.lineTo(width - paddingRight, sovereignY);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#00f0ff';
  ctx.font = 'bold 8px Rajdhani, monospace';
  ctx.textAlign = 'left';
  ctx.fillText('SOVEREIGN (8-10)', paddingLeft + 4, sovereignY - 3);

  // Y-axis ticks
  ctx.fillStyle = '#64748b';
  ctx.font = '500 9px Rajdhani, monospace';
  ctx.textAlign = 'right';
  [0, 5, 8, 10].forEach(val => {
    const y = paddingTop + chartHeight - (val / 10) * chartHeight;
    ctx.fillText(`${val}`, paddingLeft - 5, y + 3);
  });

  const isAllZero = data.every(d => (Number(d.dailyMoodScore) || 0) === 0);

  const points = data.map((d, idx) => {
    const score = Number(d.dailyMoodScore) || 0;
    const x = paddingLeft + (chartWidth / Math.max(data.length - 1, 1)) * idx;
    const y = paddingTop + chartHeight - (score / 10) * chartHeight;
    return { x, y, score, day: d.day, isToday: d.isToday };
  });

  if (isAllZero) {
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, paddingTop + chartHeight);
    ctx.lineTo(width - paddingRight, paddingTop + chartHeight);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '500 10px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Stoic Frequency (1-10) • Awaiting Day 1 Mindset Log', width / 2, paddingTop + chartHeight / 2);

    points.forEach((pt) => {
      ctx.fillStyle = pt.isToday ? '#00f0ff' : '#94a3b8';
      ctx.font = pt.isToday ? 'bold 10px Outfit, sans-serif' : '500 10px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pt.day, pt.x, height - 8);

      ctx.beginPath();
      ctx.arc(pt.x, paddingTop + chartHeight, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(168, 85, 247, 0.4)';
      ctx.fill();
    });

    return;
  }

  // Active Curve
  if (points.length > 1) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const midX = (p0.x + p1.x) / 2;
      const midY = (p0.y + p1.y) / 2;
      ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
    }
    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.lineTo(last.x, paddingTop + chartHeight);
    ctx.lineTo(points[0].x, paddingTop + chartHeight);
    ctx.closePath();

    const areaGrad = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + chartHeight);
    areaGrad.addColorStop(0, 'rgba(168, 85, 247, 0.3)');
    areaGrad.addColorStop(1, 'rgba(168, 85, 247, 0.0)');
    ctx.fillStyle = areaGrad;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const midX = (p0.x + p1.x) / 2;
      const midY = (p0.y + p1.y) / 2;
      ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
    }
    ctx.lineTo(last.x, last.y);
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2.2;
    ctx.stroke();
  }

  points.forEach((pt) => {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = pt.score >= 8 ? '#00f0ff' : '#a855f7';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px Rajdhani, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${pt.score}`, pt.x, pt.y - 7);

    ctx.fillStyle = pt.isToday ? '#00f0ff' : '#94a3b8';
    ctx.font = pt.isToday ? 'bold 10px Outfit, sans-serif' : '500 10px Outfit, sans-serif';
    ctx.fillText(pt.day, pt.x, height - 8);
  });
}

// ==========================================================================
// 5. CAREER ENGINE 5-TRACK EXECUTION MULTI-DAY SPRINT CHART
// ==========================================================================
export function renderCareerHistoryChart(canvasId, timeline) {
  const c = setupCanvas(canvasId, 380, 140);
  if (!c) return;
  const { ctx, width, height } = c;

  const defaultTimeline = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
    day,
    careerTracksDoneCount: 0,
    isToday: false
  }));
  const data = Array.isArray(timeline) && timeline.length > 0 ? timeline : defaultTimeline;

  const paddingLeft = 32;
  const paddingRight = 16;
  const paddingTop = 20;
  const paddingBottom = 26;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const colWidth = chartWidth / data.length;
  const barWidth = Math.min(Math.max(colWidth * 0.55, 14), 28);

  // Y-axis grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#64748b';
  ctx.font = '500 9px Rajdhani, monospace';
  ctx.textAlign = 'right';

  [0, 2, 4, 5].forEach((val) => {
    const y = paddingTop + chartHeight - (val / 5) * chartHeight;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, y);
    ctx.lineTo(width - paddingRight, y);
    ctx.stroke();
    ctx.fillText(`${val}`, paddingLeft - 5, y + 3);
  });

  data.forEach((d, idx) => {
    const count = Math.min(Math.max(Number(d.careerTracksDoneCount) || 0, 0), 5);
    const centerX = paddingLeft + colWidth * idx + colWidth / 2;
    const barHeight = count > 0 ? (count / 5) * chartHeight : 4;
    const barY = paddingTop + chartHeight - barHeight;

    ctx.beginPath();
    ctx.roundRect(centerX - barWidth / 2, barY, barWidth, barHeight, [4, 4, 0, 0]);

    if (count > 0) {
      const grad = ctx.createLinearGradient(0, barY, 0, barY + barHeight);
      grad.addColorStop(0, '#fbbf24');
      grad.addColorStop(1, '#b45309');
      ctx.fillStyle = grad;
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = count === 5 ? 10 : 4;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#fef3c7';
      ctx.font = 'bold 9px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${count}/5`, centerX, barY - 4);
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fill();

      ctx.fillStyle = '#475569';
      ctx.font = '8px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('0/5', centerX, barY - 4);
    }

    // Day label
    ctx.fillStyle = d.isToday ? '#00f0ff' : '#94a3b8';
    ctx.font = d.isToday ? 'bold 10px Outfit, sans-serif' : '500 10px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.day, centerX, height - 8);
  });
}

// ==========================================================================
// 6. GITHUB-STYLE CAMPAIGN DISCIPLINE & ACTIVITY HEATMAP
// ==========================================================================
export function renderCampaignHeatmap(containerId, state) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const history = state?.dailyHistory || {};
  const frozenDates = state?.frozenDates || {};
  const today = new Date();
  const todayStr = today.toDateString();

  // Campaign spans 26 weeks from Oct 5, 2026 to Apr 1, 2027
  const startDate = new Date('2026-10-05T00:00:00');

  // Build grid of 26 weeks x 7 days
  const weeks = 26;
  let html = '<div class="heatmap-weeks-container">';

  for (let w = 0; w < weeks; w++) {
    html += '<div class="heatmap-week-col">';
    for (let d = 0; d < 7; d++) {
      const currentCalDate = new Date(startDate);
      currentCalDate.setDate(startDate.getDate() + (w * 7) + d);
      const dateKey = currentCalDate.toDateString();
      const isPast = currentCalDate < today && dateKey !== todayStr;
      const isCurrentDay = dateKey === todayStr;
      const isFrozen = Boolean(frozenDates[dateKey]);

      let level = 0;
      let title = `${currentCalDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

      if (isFrozen) {
        level = 'frozen';
        title += ' • Stasis / Rest Day (+1 Day Extension)';
      } else if (isCurrentDay) {
        const gymDone = Boolean((state.dailyChecklist || []).find(q => q.id === 'core_gym')?.done);
        const smokeClean = (state.pillarEngine?.cigsAvoidedCount || 0) > 0;
        const purityClean = (state.pillarPurity?.streakDays || 0) > 0;
        const dawnDone = (state.pillarHunter?.dawnTasks || []).filter(t => t.done).length >= 2;
        const careerDone = (state.pillarApex?.tracks || []).filter(t => t.done).length >= 2;

        const count = [gymDone, smokeClean, purityClean, dawnDone, careerDone].filter(Boolean).length;
        level = count >= 4 ? 3 : count >= 2 ? 2 : count >= 1 ? 1 : 0;
        title += ` • Today (Active: ${count}/5 Protocols)`;
      } else if (history[dateKey]) {
        const rec = history[dateKey];
        const count = [
          rec.workoutsDone > 0 || rec.workoutCompleted,
          rec.purityStreak > 0,
          (rec.careerTracksDoneCount || 0) >= 2,
          rec.antiJunkClaimed,
          rec.proteinGrams >= 100
        ].filter(Boolean).length;

        level = count >= 4 ? 3 : count >= 2 ? 2 : count >= 1 ? 1 : 0;
        title += ` • Completed: ${count}/5 Protocols`;
      } else if (isPast) {
        level = 0;
        title += ' • Pre-Campaign Baseline';
      } else {
        level = 'future';
        title += ' • Scheduled Campaign Day';
      }

      const activeTodayClass = isCurrentDay ? 'today-cell pulse-cyan-border' : '';
      html += `<div class="heatmap-cell lvl-${level} ${activeTodayClass}" title="${title}"></div>`;
    }
    html += '</div>';
  }

  html += '</div>';
  container.innerHTML = html;
}
