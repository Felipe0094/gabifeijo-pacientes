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

type BloodTest = {
  id: string;
  patient_id: string;
  test_date: string;
  laboratory?: string | null;
  // Hemograma
  hemoglobin?: number | null;
  hematocrit?: number | null;
  red_blood_cells?: number | null;
  white_blood_cells?: number | null;
  platelets?: number | null;
  // Hormônios
  testosterone_total?: number | null;
  testosterone_free?: number | null;
  shbg?: number | null;
  tsh?: number | null;
  t3?: number | null;
  t4?: number | null;
  // Lipidograma
  cholesterol_total?: number | null;
  hdl?: number | null;
  ldl?: number | null;
  triglycerides?: number | null;
  apolipoprotein_a?: number | null;
  apolipoprotein_b?: number | null;
  // Vitaminas e Metabolismo
  vitamin_d?: number | null;
  vitamin_b12?: number | null;
  homocysteine?: number | null;
  // Função Renal
  creatinine?: number | null;
  urea?: number | null;
  // Função Hepática
  tgo_ast?: number | null;
  tgp_alt?: number | null;
  total_protein?: number | null;
  albumin?: number | null;
  // Eletrólitos
  sodium?: number | null;
  potassium?: number | null;
  magnesium?: number | null;
  phosphorus?: number | null;
  // Glicemia
  fasting_glucose?: number | null;
  hba1c?: number | null;
  fasting_insulin?: number | null;
  // Campos antigos (compatibilidade)
  glucose?: number | null;
  notes?: string | null;
};

export async function generatePatientReport(options: {
  patient: Patient;
  latestScale?: Scale;
  latestManual?: Manual;
  history?: Array<{ date: string; weight?: number; bodyFat?: number; muscle?: number }>;
  scaleHistoryFull?: Array<Required<Pick<Scale, 'timestamp'>> & Scale>;
  manualHistoryFull?: Array<{ timestamp: string } & Manual & Partial<{ abdomen_cm: number; hip_cm: number; arm_right_cm: number; arm_left_cm: number; thigh_right_cm: number; thigh_left_cm: number; calf_right_cm: number; calf_left_cm: number; thorax_cm: number }>>;
  bloodTests?: BloodTest[];
}): Promise<void> {
  const jsPDF = await loadJsPDF();
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const page = { w: doc.internal.pageSize.getWidth(), h: doc.internal.pageSize.getHeight() };
  const margin = 40;
  let y = margin;

  // Header bar
  doc.setFillColor(38, 166, 91); // green
  doc.rect(0, 0, page.w, 50,'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text('Relatório de Evolução - Nutrição Gabriela Feijó', margin, 35);

  // Patient block
  y = 90;
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
  y += 50;

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
  y += 50;

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
  y += 50;


  // Chart of weight evolution (if any)
  if (options.history && options.history.length) {
    const chartUrl = await renderWeightChart(options.history);
    if (chartUrl) {
      doc.setFontSize(16);
      doc.text('Gráfico de Evolução (Peso, Gordura e Músculo)', margin, y);
      y += 14; doc.setDrawColor(220); doc.line(margin, y, page.w - margin, y); y += 16;
      const imgW = page.w - margin * 2; const imgH = 180;
      doc.addImage(chartUrl, 'PNG', margin, y, imgW, imgH);
      y += imgH + 24;
    }
  }

 

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

  // Blood tests history
  if (options.bloodTests && options.bloodTests.length) {
    y += 24; if (y > page.h - 120) { doc.addPage(); y = margin; }
    doc.setFontSize(16); doc.text('Histórico de Exames de Sangue', margin, y);
    y += 14; doc.setDrawColor(220); doc.line(margin, y, page.w - margin, y); y += 16;
    
    // Sort blood tests by date (most recent first)
    const sortedBloodTests = [...options.bloodTests].sort((a, b) => 
      new Date(b.test_date).getTime() - new Date(a.test_date).getTime()
    );
    
    for (const test of sortedBloodTests) {
      if (y > page.h - 100) { doc.addPage(); y = margin; }
      
      // Test header with date and laboratory
      doc.setFontSize(14); doc.setFont(undefined, 'bold');
      doc.text(`Exame de ${formatDateBR(test.test_date)}`, margin, y);
      if (test.laboratory) {
        doc.setFontSize(12); doc.setFont(undefined, 'normal');
        doc.text(`Laboratório: ${test.laboratory}`, margin + 200, y);
      }
      y += 18;
      
      // Organize fields by category
      const categories = [
        {
          title: 'Hemograma',
          fields: [
            { key: 'hemoglobin', label: 'Hemoglobina', unit: 'g/dL' },
            { key: 'hematocrit', label: 'Hematócrito', unit: '%' },
            { key: 'red_blood_cells', label: 'Hemácias', unit: 'milhões/μL' },
            { key: 'white_blood_cells', label: 'Leucócitos', unit: '/μL' },
            { key: 'platelets', label: 'Plaquetas', unit: '/μL' }
          ]
        },
        {
          title: 'Hormônios',
          fields: [
            { key: 'testosterone_total', label: 'Testosterona Total', unit: 'ng/dL' },
            { key: 'testosterone_free', label: 'Testosterona Livre', unit: 'pg/mL' },
            { key: 'shbg', label: 'SHBG', unit: 'nmol/L' },
            { key: 'tsh', label: 'TSH', unit: 'μUI/mL' },
            { key: 't3', label: 'T3', unit: 'ng/dL' },
            { key: 't4', label: 'T4', unit: 'μg/dL' }
          ]
        },
        {
          title: 'Lipidograma',
          fields: [
            { key: 'cholesterol_total', label: 'Colesterol Total', unit: 'mg/dL' },
            { key: 'hdl', label: 'HDL', unit: 'mg/dL' },
            { key: 'ldl', label: 'LDL', unit: 'mg/dL' },
            { key: 'triglycerides', label: 'Triglicerídeos', unit: 'mg/dL' },
            { key: 'apolipoprotein_a', label: 'Apolipoproteína A', unit: 'mg/dL' },
            { key: 'apolipoprotein_b', label: 'Apolipoproteína B', unit: 'mg/dL' }
          ]
        },
        {
          title: 'Vitaminas',
          fields: [
            { key: 'vitamin_d', label: 'Vitamina D', unit: 'ng/mL' },
            { key: 'vitamin_b12', label: 'Vitamina B12', unit: 'pg/mL' },
            { key: 'homocysteine', label: 'Homocisteína', unit: 'μmol/L' }
          ]
        },
        {
          title: 'Função Renal',
          fields: [
            { key: 'creatinine', label: 'Creatinina', unit: 'mg/dL' },
            { key: 'urea', label: 'Ureia', unit: 'mg/dL' }
          ]
        },
        {
          title: 'Função Hepática',
          fields: [
            { key: 'tgo_ast', label: 'TGO/AST', unit: 'U/L' },
            { key: 'tgp_alt', label: 'TGP/ALT', unit: 'U/L' },
            { key: 'total_protein', label: 'Proteínas Totais', unit: 'g/dL' },
            { key: 'albumin', label: 'Albumina', unit: 'g/dL' }
          ]
        },
        {
          title: 'Eletrólitos',
          fields: [
            { key: 'sodium', label: 'Sódio', unit: 'mEq/L' },
            { key: 'potassium', label: 'Potássio', unit: 'mEq/L' },
            { key: 'magnesium', label: 'Magnésio', unit: 'mg/dL' },
            { key: 'phosphorus', label: 'Fósforo', unit: 'mg/dL' }
          ]
        },
        {
          title: 'Glicemia',
          fields: [
            { key: 'fasting_glucose', label: 'Glicose em Jejum', unit: 'mg/dL' },
            { key: 'glucose', label: 'Glicose', unit: 'mg/dL' },
            { key: 'hba1c', label: 'HbA1c', unit: '%' },
            { key: 'fasting_insulin', label: 'Insulina em Jejum', unit: 'μU/mL' }
          ]
        }
      ];
      
      for (const category of categories) {
        const fieldsWithValues = category.fields.filter(field => 
          test[field.key as keyof BloodTest] != null
        );
        
        if (fieldsWithValues.length > 0) {
          if (y > page.h - 80) { doc.addPage(); y = margin; }
          
          // Category title
          doc.setFontSize(12); doc.setFont(undefined, 'bold');
          doc.text(category.title, margin, y);
          y += 14;
          
          // Fields in columns (2 per row)
          doc.setFontSize(10); doc.setFont(undefined, 'normal');
          fieldsWithValues.forEach((field, index) => {
            const value = test[field.key as keyof BloodTest];
            const col = index % 2;
            const colX = margin + (col * 280);
            
            if (col === 0 && index > 0) y += 12;
            
            doc.setFont(undefined, 'bold');
            doc.text(`${field.label}:`, colX, y);
            doc.setFont(undefined, 'normal');
            doc.text(`${value} ${field.unit}`, colX + 120, y);
          });
          
          y += 18;
        }
      }
      
      // Notes if available
      if (test.notes) {
        if (y > page.h - 60) { doc.addPage(); y = margin; }
        doc.setFontSize(10); doc.setFont(undefined, 'bold');
        doc.text('Observações:', margin, y);
        y += 12;
        doc.setFont(undefined, 'normal');
        const lines = doc.splitTextToSize(test.notes, page.w - margin * 2);
        doc.text(lines, margin, y);
        y += lines.length * 12;
      }
      
      // Separator line between tests
      y += 10;
      doc.setDrawColor(200);
      doc.line(margin, y, page.w - margin, y);
      y += 20;
    }
  }

  const fileName = `relatorio_${(p.name || 'paciente').replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(fileName);
}

// Helpers

async function renderWeightChart(history: Array<{ date: string; weight?: number; bodyFat?: number; muscle?: number }>): Promise<string | null> {
  try {
    const canvas = document.createElement('canvas');
    const width = 900; const height = 320; canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d'); if (!ctx) return null;
    
    // Background
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, width, height);
    
    // Padding
    const pad = 60; const w = width - pad * 2; const h = height - pad * 2 - 40; // Extra space for legend
    
    // Filter points with at least one valid metric
    const points = history.filter(d => 
      typeof d.weight === 'number' || 
      typeof d.bodyFat === 'number' || 
      typeof d.muscle === 'number'
    );
    
    if (points.length < 2) return canvas.toDataURL('image/png');
    
    // Prepare data for each metric
    const metrics = [
      { 
        key: 'weight', 
        label: 'Peso (kg)', 
        color: '#10b981', 
        data: points.map(p => p.weight).filter(v => typeof v === 'number') as number[]
      },
      { 
        key: 'bodyFat', 
        label: 'Gordura (%)', 
        color: '#f59e0b', 
        data: points.map(p => p.bodyFat).filter(v => typeof v === 'number') as number[]
      },
      { 
        key: 'muscle', 
        label: 'Músculo (%)', 
        color: '#3b82f6', 
        data: points.map(p => p.muscle).filter(v => typeof v === 'number') as number[]
      }
    ];
    
    // Calculate global min/max for normalization
    const allValues = metrics.flatMap(m => m.data);
    if (allValues.length === 0) return canvas.toDataURL('image/png');
    
    const globalMin = Math.min(...allValues) - 2;
    const globalMax = Math.max(...allValues) + 2;
    const xStep = w / (points.length - 1);
    
    // Draw axes
    ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad, height - pad - 40); ctx.lineTo(width - pad, height - pad - 40); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, height - pad - 40); ctx.stroke();
    
    // Draw grid
    ctx.strokeStyle = '#f3f4f6'; ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = pad + (h * i) / 4;
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(width - pad, y); ctx.stroke();
    }
    
    // Draw lines for each metric
    metrics.forEach(metric => {
      const metricPoints = points.map((p, i) => ({
        x: pad + xStep * i,
        y: pad + (1 - ((p[metric.key as keyof typeof p] as number || 0) - globalMin) / (globalMax - globalMin)) * h,
        value: p[metric.key as keyof typeof p] as number,
        hasValue: typeof p[metric.key as keyof typeof p] === 'number'
      })).filter(p => p.hasValue);
      
      if (metricPoints.length < 2) return;
      
      // Draw line
      ctx.strokeStyle = metric.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      metricPoints.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
      
      // Draw dots
      ctx.fillStyle = metric.color;
      metricPoints.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    });
    
    // Draw legend
    const legendY = height - 30;
    let legendX = pad;
    
    ctx.font = '12px Arial';
    metrics.forEach((metric, i) => {
      // Color indicator
      ctx.fillStyle = metric.color;
      ctx.fillRect(legendX, legendY - 6, 12, 12);
      
      // Label
      ctx.fillStyle = '#374151';
      ctx.fillText(metric.label, legendX + 18, legendY + 4);
      
      legendX += ctx.measureText(metric.label).width + 50;
    });
    
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}