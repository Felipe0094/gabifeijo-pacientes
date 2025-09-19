// Lightweight PDF generator using jsPDF loaded from CDN at runtime
// Avoids adding a bundler dependency while enabling client-side export

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadJsPDF(): Promise<any> {
  // @ts-ignore
  const w: any = typeof window !== 'undefined' ? window : {};
  if (w.jspdf && w.jspdf.jsPDF) return w.jspdf.jsPDF;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Falha ao carregar jsPDF'));
    document.head.appendChild(script);
  });
  // @ts-ignore
  const ww: any = window as any;
  if (!ww.jspdf || !ww.jspdf.jsPDF) throw new Error('jsPDF não disponível');
  return ww.jspdf.jsPDF;
}

function formatDateBR(d: string | Date | undefined): string {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR');
}

type Patient = {
  id: string;
  name: string;
  birth_date?: string;
  gender?: number;
  height_cm?: number;
  email?: string;
  athlete_mode?: boolean;
};

type Scale = Partial<{
  timestamp: string;
  weight: number;
  bmi: number;
  body_fat_percent: number;
  water_percent: number;
  muscle_mass_percent_total: number;
  visceral_fat_rating: number;
  bone_mass_kg: number;
}>;

type Manual = Partial<{
  waist_cm: number;
  abdomen_cm: number;
  hip_cm: number;
}>;

export async function generatePatientReport(options: {
  patient: Patient;
  latestScale?: Scale;
  latestManual?: Manual;
  history?: Array<{ date: string; weight?: number; bodyFat?: number; muscle?: number }>;
  scaleHistoryFull?: Array<Required<Pick<Scale, 'timestamp'>> & Scale>;
  manualHistoryFull?: Array<{ timestamp: string } & Manual & Partial<{ abdomen_cm: number; hip_cm: number; arm_right_cm: number; arm_left_cm: number; thigh_right_cm: number; thigh_left_cm: number; calf_right_cm: number; calf_left_cm: number; thorax_cm: number }>>;
}): Promise<void> {
  const jsPDF = await loadJsPDF();
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const page = { w: doc.internal.pageSize.getWidth(), h: doc.internal.pageSize.getHeight() };
  const margin = 40;
  let y = margin;

  // Header bar
  doc.setFillColor(38, 166, 91); // green
  doc.rect(0, 0, page.w, 80, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text('Relatório de Evolução - Nutrição Gabriela Feijó', margin, 50);

  // Patient block
  y = 110;
  doc.setTextColor(33, 33, 33);
  doc.setFontSize(16);
  doc.text('Dados do Paciente', margin, y);
  y += 14;
  doc.setDrawColor(220);
  doc.line(margin, y, page.w - margin, y);
  y += 16;

  const p = options.patient;
  const pairs: Array<[string, string]> = [
    ['Nome', p.name || '-'],
    ['Nascimento', formatDateBR(p.birth_date) || '-'],
    ['Gênero', p.gender === 1 ? 'Masculino' : 'Feminino'],
    ['Altura', p.height_cm ? `${p.height_cm} cm` : '-'],
    ['E-mail', p.email || '-'],
    ['Modo Atleta', p.athlete_mode ? 'Sim' : 'Não'],
  ];

  doc.setFontSize(12);
  pairs.forEach(([label, value], i) => {
    const colX = i % 2 === 0 ? margin : page.w / 2;
    if (i % 2 === 0 && i > 0) y += 22;
    doc.setFont(undefined, 'bold');
    doc.text(`${label}:`, colX, y);
    doc.setFont(undefined, 'normal');
    doc.text(String(value), colX + 70, y);
  });
  y += 30;

  // Latest measurements
  doc.setFontSize(16);
  doc.text('Última Medição (Balança)', margin, y);
  y += 14;
  doc.setDrawColor(220); doc.line(margin, y, page.w - margin, y); y += 16;
  doc.setFontSize(12);
  const s = options.latestScale || {};
  const lastScalePairs: Array<[string, string]> = [
    ['Data', formatDateBR(s.timestamp) || '-'],
    ['Peso', s.weight != null ? `${s.weight.toFixed(1)} kg` : '-'],
    ['IMC', s.bmi != null ? `${s.bmi.toFixed(1)}` : '-'],
    ['Gordura', s.body_fat_percent != null ? `${s.body_fat_percent.toFixed(1)} %` : '-'],
    ['Músculo', s.muscle_mass_percent_total != null ? `${s.muscle_mass_percent_total.toFixed(1)} %` : '-'],
    ['Água', s.water_percent != null ? `${s.water_percent.toFixed(1)} %` : '-'],
    ['G. Visceral', s.visceral_fat_rating != null ? `${s.visceral_fat_rating}` : '-'],
    ['Massa Óssea', s.bone_mass_kg != null ? `${s.bone_mass_kg.toFixed(1)} kg` : '-'],
  ];
  lastScalePairs.forEach(([label, value], i) => {
    const colX = i % 3 === 0 ? margin : (i % 3 === 1 ? margin + (page.w - 2 * margin) / 3 : margin + 2 * (page.w - 2 * margin) / 3);
    if (i % 3 === 0 && i > 0) y += 18;
    doc.setFont(undefined, 'bold'); doc.text(`${label}:`, colX, y);
    doc.setFont(undefined, 'normal'); doc.text(String(value), colX + 80, y);
  });
  y += 30;

  // Chart of weight evolution (if any)
  if (options.history && options.history.length) {
    const chartUrl = await renderWeightChart(options.history);
    if (chartUrl) {
      doc.setFontSize(16);
      doc.text('Gráfico de Evolução do Peso', margin, y);
      y += 14; doc.setDrawColor(220); doc.line(margin, y, page.w - margin, y); y += 16;
      const imgW = page.w - margin * 2; const imgH = 160;
      doc.addImage(chartUrl, 'PNG', margin, y, imgW, imgH);
      y += imgH + 24;
    }
  }

  // Manual measurements (latest summary)
  doc.setFontSize(16);
  doc.text('Última Medição (Fita Métrica)', margin, y);
  y += 14; doc.setDrawColor(220); doc.line(margin, y, page.w - margin, y); y += 16;
  doc.setFontSize(12);
  const m = options.latestManual || {};
  const manPairs: Array<[string, string]> = [
    ['Cintura', m.waist_cm != null ? `${m.waist_cm} cm` : '-'],
    ['Abdômen', m.abdomen_cm != null ? `${m.abdomen_cm} cm` : '-'],
    ['Quadril', m.hip_cm != null ? `${m.hip_cm} cm` : '-'],
  ];
  manPairs.forEach(([label, value], i) => {
    const colX = i % 3 === 0 ? margin : (i % 3 === 1 ? margin + (page.w - 2 * margin) / 3 : margin + 2 * (page.w - 2 * margin) / 3);
    if (i % 3 === 0 && i > 0) y += 18;
    doc.setFont(undefined, 'bold'); doc.text(`${label}:`, colX, y);
    doc.setFont(undefined, 'normal'); doc.text(String(value), colX + 80, y);
  });
  y += 30;

  // Simple evolution table (last up to 8 points)
  const history = (options.history || []).slice(-8);
  if (history.length) {
    doc.setFontSize(16); doc.text('Evolução Recente', margin, y);
    y += 14; doc.setDrawColor(220); doc.line(margin, y, page.w - margin, y); y += 16;
    doc.setFontSize(12);
    // Header
    doc.setFont(undefined, 'bold');
    doc.text('Data', margin, y);
    doc.text('Peso (kg)', margin + 140, y);
    doc.text('% Gordura', margin + 240, y);
    doc.text('% Músculo', margin + 340, y);
    doc.setFont(undefined, 'normal');
    y += 14;
    history.forEach(row => {
      doc.text(formatDateBR(row.date) || '-', margin, y);
      doc.text(row.weight != null ? String(row.weight.toFixed(1)) : '-', margin + 140, y);
      doc.text(row.bodyFat != null ? String(row.bodyFat.toFixed(1)) : '-', margin + 240, y);
      doc.text(row.muscle != null ? String(row.muscle.toFixed(1)) : '-', margin + 340, y);
      y += 16;
    });
  }

  // Full histories if provided
  if (options.scaleHistoryFull && options.scaleHistoryFull.length) {
    y += 24; if (y > page.h - 120) { doc.addPage(); y = margin; }
    doc.setFontSize(16); doc.text('Histórico Completo - Balança', margin, y);
    y += 14; doc.setDrawColor(220); doc.line(margin, y, page.w - margin, y); y += 16;
    doc.setFontSize(10);
    const headers = ['Data', 'Peso', 'IMC', '%Gordura', '%Músculo', '%Água', 'G.Visc', 'Osso'];
    const colsX = [0, 90, 150, 210, 290, 370, 430, 490].map(dx => margin + dx);
    doc.setFont(undefined, 'bold'); headers.forEach((h, i) => doc.text(h, colsX[i], y)); doc.setFont(undefined, 'normal'); y += 12;
    for (const row of options.scaleHistoryFull) {
      if (y > page.h - 60) { doc.addPage(); y = margin; }
      doc.text(formatDateBR(row.timestamp) || '-', colsX[0], y);
      doc.text(row.weight != null ? String((row.weight as number).toFixed(1)) : '-', colsX[1], y);
      doc.text(row.bmi != null ? String((row.bmi as number).toFixed(1)) : '-', colsX[2], y);
      doc.text(row.body_fat_percent != null ? String((row.body_fat_percent as number).toFixed(1)) : '-', colsX[3], y);
      doc.text(row.muscle_mass_percent_total != null ? String((row.muscle_mass_percent_total as number).toFixed(1)) : '-', colsX[4], y);
      doc.text(row.water_percent != null ? String((row.water_percent as number).toFixed(1)) : '-', colsX[5], y);
      doc.text(row.visceral_fat_rating != null ? String(row.visceral_fat_rating) : '-', colsX[6], y);
      doc.text(row.bone_mass_kg != null ? String((row.bone_mass_kg as number).toFixed(1)) : '-', colsX[7], y);
      y += 12;
    }
  }

  if (options.manualHistoryFull && options.manualHistoryFull.length) {
    y += 24; if (y > page.h - 120) { doc.addPage(); y = margin; }
    doc.setFontSize(16); doc.text('Histórico Completo - Fita Métrica', margin, y);
    y += 14; doc.setDrawColor(220); doc.line(margin, y, page.w - margin, y); y += 16;
    doc.setFontSize(10);
    const headers = ['Data', 'Cintura', 'Abdômen', 'Quadril'];
    const colsX2 = [0, 90, 170, 260].map(dx => margin + dx);
    doc.setFont(undefined, 'bold'); headers.forEach((h, i) => doc.text(h, colsX2[i], y)); doc.setFont(undefined, 'normal'); y += 12;
    for (const row of options.manualHistoryFull) {
      if (y > page.h - 60) { doc.addPage(); y = margin; }
      doc.text(formatDateBR(row.timestamp) || '-', colsX2[0], y);
      doc.text(row.waist_cm != null ? `${row.waist_cm}` : '-', colsX2[1], y);
      doc.text(row.abdomen_cm != null ? `${row.abdomen_cm}` : '-', colsX2[2], y);
      doc.text(row.hip_cm != null ? `${row.hip_cm}` : '-', colsX2[3], y);
      y += 12;
    }
  }

  const fileName = `relatorio_${(p.name || 'paciente').replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(fileName);
}

// Helpers

async function renderWeightChart(history: Array<{ date: string; weight?: number }>): Promise<string | null> {
  try {
    const canvas = document.createElement('canvas');
    const width = 900; const height = 280; canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d'); if (!ctx) return null;
    // Background
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, width, height);
    // Padding
    const pad = 40; const w = width - pad * 2; const h = height - pad * 2;
    // Axes
    ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad, height - pad); ctx.lineTo(width - pad, height - pad); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, height - pad); ctx.stroke();
    // Data
    const points = history.filter(d => typeof d.weight === 'number');
    if (points.length < 2) return canvas.toDataURL('image/png');
    const weights = points.map(p => p.weight as number);
    const min = Math.min(...weights) - 1; const max = Math.max(...weights) + 1;
    const xStep = w / (points.length - 1);
    // Grid
    ctx.strokeStyle = '#f3f4f6';
    for (let i = 0; i <= 4; i++) {
      const y = pad + (h * i) / 4; ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(width - pad, y); ctx.stroke();
    }
    // Line
    ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2; ctx.beginPath();
    points.forEach((p, i) => {
      const x = pad + xStep * i;
      const y = pad + (1 - ((p.weight as number) - min) / (max - min)) * h;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    // Dots
    ctx.fillStyle = '#059669';
    points.forEach((p, i) => {
      const x = pad + xStep * i;
      const y = pad + (1 - ((p.weight as number) - min) / (max - min)) * h;
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    });
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}


