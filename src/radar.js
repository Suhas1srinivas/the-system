/**
 * Hexagonal Attribute Radar Chart
 * Renders the 6 Core Life Attributes onto an HTML5 Canvas
 */

export function renderRadarChart(canvasId, stats) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || 340;
  const height = canvas.clientHeight || 300;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2 + 5;
  const radius = Math.min(centerX, centerY) - 48;
  const attributes = [
    { key: 'pur', label: 'PURITY', val: stats.pur || 10 },
    { key: 'vit', label: 'HEALTH', val: stats.vit || 10 },
    { key: 'str', label: 'STRENGTH', val: stats.str || 10 },
    { key: 'cha', label: 'GROOMING', val: stats.cha || 10 },
    { key: 'aura', label: 'MINDSET', val: stats.aura || 10 },
    { key: 'int', label: 'CAREER', val: stats.int || 10 }
  ];

  const totalPoints = attributes.length;
  const angleStep = (Math.PI * 2) / totalPoints;

  // Max scale calculation
  const maxStatVal = Math.max(...attributes.map(a => a.val), 50);
  const scaleMax = Math.ceil(maxStatVal / 10) * 10;

  // 1. Draw Concentric Grid Rings
  const levels = 4;
  for (let l = 1; l <= levels; l++) {
    const levelRadius = (radius / levels) * l;
    ctx.beginPath();
    for (let i = 0; i < totalPoints; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * levelRadius;
      const y = centerY + Math.sin(angle) * levelRadius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = l === levels ? 'rgba(0, 240, 255, 0.4)' : 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = l === levels ? 1.5 : 1;
    ctx.stroke();
  }

  // 2. Draw Axis Spokes
  for (let i = 0; i < totalPoints; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw Labels
    const labelDistance = radius + 20;
    const lx = centerX + Math.cos(angle) * labelDistance;
    const ly = centerY + Math.sin(angle) * labelDistance;

    ctx.font = '600 11px Outfit, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(attributes[i].label, lx, ly);
  }

  // 3. Draw Stat Data Polygon
  ctx.beginPath();
  const dataCoords = [];
  for (let i = 0; i < totalPoints; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const ratio = Math.min(attributes[i].val / scaleMax, 1);
    const pointRadius = Math.max(ratio * radius, 12);
    const px = centerX + Math.cos(angle) * pointRadius;
    const py = centerY + Math.sin(angle) * pointRadius;
    dataCoords.push({ x: px, y: py });

    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  // Polygon Fill & Glow
  const gradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, radius);
  gradient.addColorStop(0, 'rgba(0, 240, 255, 0.4)');
  gradient.addColorStop(1, 'rgba(168, 85, 247, 0.15)');
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 4. Draw Glowing Dots at Vertices
  dataCoords.forEach((pt) => {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}
