const FASES = {
  Planejamento: "#7030A0",
  Desenvolvimento: "#0070C0",
  Homologação: "#ED7D31",
  Entrega: "#00B050",
  "Op. Assistida": "#00B050",
};

const ORDEM_FASES = Object.keys(FASES);
const FASE_CUSTOM = "__manual__";
const FASE_CUSTOM_COR = "#64748B";
const A_DEFINIR_COR = "#D9D9D9";

function faseCor(f) {
  if (!f) return "#999";
  if (f.fase === FASE_CUSTOM) return FASE_CUSTOM_COR;
  return FASES[f.fase] || "#999";
}

function faseLabel(f) {
  if (!f) return "";
  if (f.fase === FASE_CUSTOM) return f.faseCustom || "Manual";
  return f.fase || "";
}

function calcPctRaia(r) {
  const fases = (r.fases || []).filter((f) => !f.aDefinir);
  if (!fases.length) return 0;
  return fases.reduce((s, f) => s + (Number(f.pct) || 0), 0) / fases.length;
}

function calcPacoteInfo(pac, pacRaias) {
  const allInicio = pacRaias
    .flatMap((r) => r.fases.filter((f) => f.inicio && !f.aDefinir).map((f) => f.inicio))
    .filter(Boolean)
    .sort();
  const allFim = pacRaias
    .flatMap((r) => r.fases.filter((f) => !f.aDefinir).map((f) => f.fimRepactuado || f.fim))
    .filter(Boolean)
    .sort();
  const minInicio = allInicio[0] || "";
  const maxFim = allFim[allFim.length - 1] || "";
  const pcts = pacRaias.map(calcPctRaia);
  const pctMedia = pcts.length ? Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length) : 0;
  const statuses = pacRaias.map((r) => r.statusDemanda || "A iniciar");
  const status = statuses.includes("Atrasado")
    ? "Atrasado"
    : statuses.includes("Em Andamento")
      ? "Em Andamento"
      : statuses.length && statuses.every((s) => s === "Concluído")
        ? "Concluído"
        : "A iniciar";
  return { minInicio, maxFim, pctMedia, status };
}

function statusCor(s) {
  return s === "Concluído"
    ? "#00B050"
    : s === "Em Andamento"
      ? "#0070C0"
      : s === "Atrasado"
        ? "#C00000"
        : "#94A3B8";
}

const STATUS_GERAL = {
  Bom: "#69AE9A",
  "Com Riscos": "#FDB713",
  "Com Problemas": "#FF0000",
};

const CINZA_DESPRI = "#D9D9D9";

function tint(hex, amount = 0.78) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  r = Math.round(r + (255 - r) * amount);
  g = Math.round(g + (255 - g) * amount);
  b = Math.round(b + (255 - b) * amount);
  return `rgb(${r},${g},${b})`;
}

const MESES = ["JAN", "FEV", "MAR", "ABRIL", "MAIO", "JUNHO", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

function ddmm(d) {
  if (!d) return "";
  const x = new Date(d + "T12:00:00");
  if (isNaN(x)) return "";
  return `${String(x.getDate()).padStart(2, "0")}/${String(x.getMonth() + 1).padStart(2, "0")}`;
}

function buildTimeline(ano, mesInicio, nFuturos, nPassados = 0) {
  const cells = [];
  const trimVigente = Math.floor((mesInicio - 1) / 3) + 1;
  const currentAbs = ano * 4 + (trimVigente - 1);

  for (let q = nPassados; q >= 1; q--) {
    const abs = currentAbs - q;
    const yQ = Math.floor(abs / 4);
    const qIdx = ((abs % 4) + 4) % 4;
    const mStart = qIdx * 3;
    cells.push({
      label: `${qIdx + 1}T`,
      mesLabel: "",
      peso: 0.55,
      futuro: true,
      start: new Date(yQ, mStart, 1),
      end: new Date(yQ, mStart + 3, 0, 23, 59),
    });
  }

  for (let i = 0; i < 3; i++) {
    const m = mesInicio - 1 + i;
    const y = ano + Math.floor(m / 12);
    const mm = ((m % 12) + 12) % 12;
    const ultimoDia = new Date(y, mm + 1, 0).getDate();
    cells.push({
      label: "15",
      mesLabel: MESES[mm],
      peso: 1,
      start: new Date(y, mm, 1),
      end: new Date(y, mm, 15, 23, 59),
    });
    cells.push({
      label: String(ultimoDia),
      mesLabel: MESES[mm],
      peso: 1,
      start: new Date(y, mm, 16),
      end: new Date(y, mm, ultimoDia, 23, 59),
    });
  }

  for (let q = 1; q <= nFuturos; q++) {
    const abs = currentAbs + q;
    const yQ = Math.floor(abs / 4);
    const qIdx = ((abs % 4) + 4) % 4;
    const mStart = qIdx * 3;
    cells.push({
      label: `${qIdx + 1}T`,
      mesLabel: "",
      peso: 0.55,
      futuro: true,
      start: new Date(yQ, mStart, 1),
      end: new Date(yQ, mStart + 3, 0, 23, 59),
    });
  }

  const total = cells.reduce((s, c) => s + c.peso, 0);
  let acc = 0;
  cells.forEach((c) => {
    c.f0 = acc / total;
    acc += c.peso;
    c.f1 = acc / total;
  });

  return { cells, trimVigente, ano };
}

function dateToFrac(date, cells) {
  if (!date) return null;
  const d = new Date(date + "T12:00:00");
  if (isNaN(d)) return null;
  if (d <= cells[0].start) return 0;
  const last = cells[cells.length - 1];
  if (d >= last.end) return 1;
  for (const c of cells) {
    if (d >= c.start && d <= c.end) {
      const span = c.end - c.start || 1;
      const fr = (d - c.start) / span;
      return c.f0 + fr * (c.f1 - c.f0);
    }
  }
  return null;
}

const COL = {
  ID: 0,
  NOME: 2,
  DESC: 3,
  AREA_EXEC: 7,
  LIDER_EXEC: 8,
  DIR_EXEC: 9,
  SM: 12,
  AREA_CLI: 14,
  LIDER_CLI: 15,
  DIR_CLI: 16,
  STATUS: 20,
  DT_INICIO: 21,
  TRIMESTRE: 57,
  COMPROMISSO: 58,
  DESPRI: 59,
};

function fmtDateISO(val) {
  if (!val) return "";
  const d = val instanceof Date ? val : new Date(val);
  if (isNaN(d)) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function makeProjetoFromRow(row) {
  const hoje = new Date();
  return {
    nome: String(row[COL.NOME] || "").trim(),
    smPmo: String(row[COL.SM] || "").trim(),
    resumoLecom: String(row[COL.ID] || ""),
    resumoDesc: String(row[COL.DESC] || "").trim().slice(0, 300),
    areaCliente: String(row[COL.AREA_CLI] || "").trim(),
    dirCliente: String(row[COL.DIR_CLI] || "").trim(),
    lidCliente: String(row[COL.LIDER_CLI] || "").trim(),
    areaExec: String(row[COL.AREA_EXEC] || "").trim(),
    dirExec: String(row[COL.DIR_EXEC] || "").trim(),
    lidExec: String(row[COL.LIDER_EXEC] || "").trim(),
    iniciadoEm: fmtDateISO(row[COL.DT_INICIO]),
    statusGeral: "Bom",
    atualizadoPor: "",
    atualizadoEm: `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`,
    pontosAtencao: "",
  };
}

function defaultProjeto() {
  const hoje = new Date();
  return {
    nome: "",
    smPmo: "",
    resumoLecom: "",
    resumoDesc: "",
    areaCliente: "",
    dirCliente: "",
    lidCliente: "",
    areaExec: "",
    dirExec: "",
    lidExec: "",
    statusGeral: "Bom",
    atualizadoPor: "",
    iniciadoEm: "",
    atualizadoEm: `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`,
    pontosAtencao: "",
  };
}

export {
  FASES,
  ORDEM_FASES,
  FASE_CUSTOM,
  FASE_CUSTOM_COR,
  A_DEFINIR_COR,
  faseCor,
  faseLabel,
  calcPctRaia,
  calcPacoteInfo,
  statusCor,
  STATUS_GERAL,
  CINZA_DESPRI,
  tint,
  ddmm,
  buildTimeline,
  dateToFrac,
  COL,
  fmtDateISO,
  makeProjetoFromRow,
  defaultProjeto,
};
