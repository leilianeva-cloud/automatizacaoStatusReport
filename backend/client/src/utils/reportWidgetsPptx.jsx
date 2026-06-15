import { Fragment } from "react";
import { ChevronDown, ChevronRight, Package, Plus, Trash2 } from "lucide-react";
import {
  A_DEFINIR_COR,
  CINZA_DESPRI,
  FASES,
  FASE_CUSTOM,
  ORDEM_FASES,
  STATUS_GERAL,
  calcPacoteInfo,
  dateToFrac,
  ddmm,
  faseCor,
  faseLabel,
  statusCor,
  tint,
  buildTimeline,
} from "./reportCore";

export function GanttPreview({ projeto, raias, timeline, hojeFrac, usaPacotes, pacotes }) {
  const { cells } = timeline;
  const ROTULO_W = 415; // Lecom+Marcos/Demanda+Status+Dt Início
  const ROW_H = 32;

  const totalPeso = cells.reduce((s, c) => s + c.peso, 0);
  // template de grid para as colunas de tempo (garante alinhamento perfeito)
  const cellsGrid = cells.map(c => `${c.peso / totalPeso}fr`).join(' ');
  // template para a linha dos meses (grupos)
  const mesGrupos = [];
  cells.forEach((c) => {
    const last = mesGrupos[mesGrupos.length - 1];
    const key = c.futuro ? c.label : c.mesLabel;
    if (last && last.key === key && !c.futuro) { last.span++; last.peso += c.peso; }
    else mesGrupos.push({ key, label: c.futuro ? "" : c.mesLabel, span: 1, peso: c.peso, futuro: c.futuro });
  });
  const mesGrid = mesGrupos.map(m => `${m.peso / totalPeso}fr`).join(' ');

  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", boxShadow: "0 1px 3px rgba(0,0,0,.08)", marginTop: 16, marginBottom: 8 }}>
      {/* título + status + legenda */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 20, color: "#003B82", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 6, height: 22, background: "#F47B20", borderRadius: 3, display: "inline-block" }} />
            {projeto.nome}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 22, height: 22, borderRadius: "50%", background: STATUS_GERAL[projeto.statusGeral], display: "inline-block", border: "2px solid #D9D9D9", boxShadow: "0 0 0 1px #e2e8f0" }} />
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: STATUS_GERAL[projeto.statusGeral] }}>{projeto.statusGeral}</span>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 11, marginTop: 8, paddingLeft: 14 }}>
          {Object.entries(FASES).map(([k, v]) => (
            <span key={k} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 9, height: 9, background: v, borderRadius: 2, display: "inline-block" }} />{k}
            </span>
          ))}
        </div>
      </div>

      {/* grade */}
      <div style={{ position: "relative", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
        {/* cabeçalho de colunas */}
        <div style={{ display: "flex", color: "#fff", fontSize: 11, fontWeight: 700 }}>
          <div style={{ width: ROTULO_W, flexShrink: 0, display: "flex", background: "#2F5597", color: "#fff", borderRight: "1px solid #D9D9D9" }}>
            <div style={{ width: 66, flexShrink: 0, padding: "8px 6px", borderRight: "1px solid #D9D9D9" }}>Lecom</div>
            <div style={{ flex: 1, minWidth: 0, padding: "8px 6px", borderRight: "1px solid #D9D9D9" }}>Marcos/Demanda</div>
            <div style={{ width: 96, flexShrink: 0, padding: "8px 6px", borderRight: "1px solid #D9D9D9" }}>Status</div>
            <div style={{ width: 75, flexShrink: 0, padding: "8px 6px" }}>Dt Início</div>
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            {/* linha dos meses — CSS grid para alinhamento perfeito */}
            <div style={{ display: "grid", gridTemplateColumns: mesGrid }}>
              {mesGrupos.map((m, i) => (
                <div key={i} style={{ background: m.futuro ? "#2F5597" : "#595959", textAlign: "center", padding: "5px 2px", borderRight: "1px solid #D9D9D9" }}>
                  {m.label || m.key}
                </div>
              ))}
            </div>
            {/* linha dos dias */}
            <div style={{ display: "grid", gridTemplateColumns: cellsGrid, fontWeight: 600 }}>
              {cells.map((c, i) => (
                <div key={i} style={{ background: c.futuro ? "#2F5597" : "#BFBFBF", textAlign: "center", padding: "3px 2px", borderRight: "1px solid #D9D9D9", fontSize: 10 }}>
                  {c.futuro ? "" : c.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* linhas */}
        <div style={{ position: "relative" }}>
          {/* grid vertical de fundo */}
          <div style={{ position: "absolute", left: ROTULO_W, right: 0, top: 0, bottom: 0, display: "flex", pointerEvents: "none" }}>
            {cells.map((c, i) => (
              <div key={i} style={{ flexGrow: c.peso, borderRight: "1px solid #D9D9D9", background: "transparent" }} />
            ))}
          </div>
          {/* linha do hoje */}
          {hojeFrac != null && (
            <div style={{ position: "absolute", top: -2, bottom: 0, left: `calc(${ROTULO_W}px + (100% - ${ROTULO_W}px) * ${hojeFrac})`, width: 0, borderLeft: "2px dashed #ED7D31", zIndex: 5 }}>
              <span style={{ position: "absolute", top: -9, left: -5, width: 9, height: 9, background: "#ED7D31", transform: "rotate(45deg)" }} />
            </div>
          )}

          {/* Função auxiliar para renderizar uma linha de demanda */}
          {(() => {
            const RaiaRow = (r) => {
              const dtInicio = ddmm(r.fases[0]?.inicio || "");
              // altura dinâmica: cresce com o número de lanes
              const { numLanes } = r.despriorizado ? { numLanes: 1 } : assignLanes(r.fases);
              const LANE_H = 12, LANE_GAP = 2, LANE_PAD = 8;
              const rh = numLanes <= 1 ? ROW_H : Math.max(ROW_H, numLanes * LANE_H + (numLanes - 1) * LANE_GAP + LANE_PAD);
              return (
                <div key={r.id} style={{ display: "flex", borderBottom: "1px solid #D9D9D9", minHeight: rh, alignItems: "stretch", background: "#F2F2F2" }}>
                  <div style={{ width: ROTULO_W, flexShrink: 0, display: "flex", fontSize: 11.5, alignItems: "center" }}>
                    <div style={{ width: 66, flexShrink: 0, padding: "4px 6px", color: "#404040", whiteSpace: "nowrap", borderRight: "1px solid #D9D9D9", alignSelf: "stretch", display: "flex", alignItems: "center" }}>{r.lecom}</div>
                    <div style={{ flex: 1, minWidth: 0, padding: "4px 6px", fontWeight: 600, color: "#1F2A44", lineHeight: 1.15, wordBreak: "break-word", borderRight: "1px solid #D9D9D9" }}>{r.nome}</div>
                    <div style={{ width: 96, flexShrink: 0, padding: "4px 5px", fontSize: 9, fontWeight: 700, whiteSpace: "nowrap", borderRight: "1px solid #D9D9D9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {(() => {
                        if (r.despriorizado) return <span style={{ color: "#7F7F7F" }}>Despriorizado</span>;
                        const s = r.statusDemanda || 'A iniciar';
                        return <span style={{ color: statusCor(s) }}>{s}</span>;
                      })()}
                    </div>
                    <div style={{ width: 75, flexShrink: 0, padding: "4px 5px", fontSize: 10, color: "#404040", display: "flex", alignItems: "center", justifyContent: "center" }}>{dtInicio}</div>
                  </div>
                  <div style={{ flex: 1, position: "relative", minHeight: rh, background: "#fff" }}>
                    <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: cellsGrid, pointerEvents: "none" }}>
                      {cells.map((c, i) => <div key={i} style={{ borderRight: "1px solid #D9D9D9", background: c.futuro ? "#f8fafc" : "transparent" }} />)}
                    </div>
                    <BarRow r={r} cells={cells} atualizadoEm={projeto.atualizadoEm} rowH={rh} />
                  </div>
                </div>
              );
            };

            if (!usaPacotes) return raias.map(r => RaiaRow(r));

            // Modo pacotes: linha de pacote + demandas
            return pacotes.map(pac => {
              const pacRaias = pac.raiaIds.map(id => raias.find(r => r.id === id)).filter(Boolean);
              const info = calcPacoteInfo(pac, pacRaias);
              const sCor = statusCor(info.status);
              const f0pac = dateToFrac(info.minInicio, cells);
              const f1pac = dateToFrac(info.maxFim, cells);
              const frac = Math.max(0, Math.min(1, info.pctMedia / 100));
              return (
                <Fragment key={pac.id}>
                  {/* Linha do pacote */}
                  <div style={{ display: "flex", borderBottom: "2px solid #C7D7F0", minHeight: ROW_H + 4, alignItems: "stretch", background: "#EEF4FF" }}>
                    <div style={{ width: ROTULO_W, flexShrink: 0, display: "flex", fontSize: 11.5, alignItems: "center", borderLeft: `4px solid ${sCor}` }}>
                      <div style={{ width: 66, flexShrink: 0, padding: "4px 6px", color: "#2F5597", fontWeight: 700, borderRight: "1px solid #D9D9D9", alignSelf: "stretch", display: "flex", alignItems: "center", justifyContent: "center" }}><Package size={16} color="#2F5597"/></div>
                      <div style={{ flex: 1, minWidth: 0, padding: "4px 6px", fontWeight: 700, color: "#1E3A6E", borderRight: "1px solid #D9D9D9", fontSize: 12 }}>{pac.nome}</div>
                      <div style={{ width: 96, flexShrink: 0, padding: "4px 5px", fontSize: 9, fontWeight: 700, borderRight: "1px solid #D9D9D9", display: "flex", alignItems: "center", justifyContent: "center", color: sCor }}>{info.status}</div>
                      <div style={{ width: 75, flexShrink: 0, padding: "4px 5px", fontSize: 10, color: "#2F5597", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{ddmm(info.minInicio)}</div>
                    </div>
                    <div style={{ flex: 1, position: "relative", minHeight: ROW_H + 4, background: "#F0F6FF" }}>
                      <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: cellsGrid, pointerEvents: "none" }}>
                        {cells.map((c, i) => <div key={i} style={{ borderRight: "1px solid #C7D7F0", background: c.futuro ? "#f0f4ff" : "transparent" }} />)}
                      </div>
                      {f0pac != null && f1pac != null && (
                        <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: `${f0pac*100}%`, width: `${Math.max((f1pac-f0pac)*100,2)}%`, height: 18, borderRadius: 9, overflow: "hidden", background: tint(sCor.replace('#','')) ? tint(sCor) : "#C7D7F0" }}>
                          <div style={{ position:"absolute", left:0, top:0, bottom:0, width:`${frac*100}%`, background: sCor, borderRadius:9 }} />
                          <span style={{ position:"absolute", left:5, top:"50%", transform:"translateY(-50%)", fontSize:8.5, fontWeight:700, color: frac>0.15?"#fff":"#1e293b", zIndex:2, whiteSpace:"nowrap" }}>{info.pctMedia}%</span>
                          <span style={{ position:"absolute", right:4, top:"50%", transform:"translateY(-50%)", fontSize:8, fontWeight:700, color: frac>0.9?"#fff":"#1e293b", zIndex:2, whiteSpace:"nowrap" }}>{ddmm(info.maxFim)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Demandas do pacote */}
                  {pacRaias.map(r => RaiaRow(r))}
                </Fragment>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
}

// ---- helper: atribuição de lanes para fases sobrepostas ----
function assignLanes(fases) {
  if (!fases.length) return { assignments: [], numLanes: 1 };
  const laneEnds = [];
  const assignments = new Array(fases.length).fill(0);

  // Processar fases com datas primeiro (ordem por início), depois aDefinir
  const comDatas   = fases.map((f, i) => ({ ...f, _i: i })).filter(f => !f.aDefinir)
                          .sort((a, b) => (a.inicio || '') <= (b.inicio || '') ? -1 : 1);
  const semDatas   = fases.map((f, i) => ({ ...f, _i: i })).filter(f => f.aDefinir);

  for (const f of comDatas) {
    const fim = f.fimRepactuado || f.fim || '';
    let lane = laneEnds.findIndex(end => (end || '') < (f.inicio || ''));
    if (lane === -1) { lane = laneEnds.length; laneEnds.push(''); }
    laneEnds[lane] = fim;
    assignments[f._i] = lane;
  }

  // aDefinir: sempre lane nova exclusiva (não sabe quando termina)
  for (const f of semDatas) {
    const lane = laneEnds.length;
    laneEnds.push('9999-12-31');
    assignments[f._i] = lane;
  }

  return { assignments, numLanes: Math.max(laneEnds.length, 1) };
}

// desenha as barras de uma raia
function BarRow({ r, cells, atualizadoEm, rowH = 32 }) {
  if (r.despriorizado) {
    const ini = dateToFrac(r.fases.reduce((a, f) => (f.inicio && (!a || f.inicio < a) ? f.inicio : a), null), cells) ?? 0;
    const fim = dateToFrac(r.fases.reduce((a, f) => (f.fim && f.fim > a ? f.fim : a), ""), cells) ?? 1;
    return (
      <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: `${ini * 100}%`, width: `${Math.max((fim - ini) * 100, 4)}%`, height: 14, background: CINZA_DESPRI, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#64748b", fontWeight: 600 }}>
        Despriorizado
      </div>
    );
  }

  const { assignments, numLanes } = assignLanes(r.fases);
  const GAP = numLanes > 1 ? 2 : 0;
  const laneH = numLanes > 1 ? Math.max(8, Math.floor((rowH - 4 - GAP * (numLanes - 1)) / numLanes)) : 14;
  const totalH = numLanes * laneH + (numLanes - 1) * GAP;
  const topBase = Math.max(0, (rowH - totalH) / 2);

  return (
    <>
      {r.fases.map((f, i) => {
        const cor = faseCor(f);
        const lane = assignments[i];
        const top = topBase + lane * (laneH + GAP);

        // ── A DEFINIR ──
        if (f.aDefinir) {
          // encontrar as células do mês vigente na timeline
          const hoje = new Date();
          const mesAtual = hoje.getMonth(); // 0-indexed
          const anoAtual = hoje.getFullYear();
          const celsMes = cells.filter(c => !c.futuro && c.start instanceof Date &&
            c.start.getMonth() === mesAtual && c.start.getFullYear() === anoAtual);
          // se não achar o mês atual, usar as últimas células vigentes
          const celsRef = celsMes.length > 0 ? celsMes : cells.filter(c => !c.futuro).slice(-2);
          const left  = celsRef.length > 0 ? celsRef[0].f0  : 0.72;
          const right = celsRef.length > 0 ? celsRef[celsRef.length-1].f1 : 1.0;
          const w = Math.max(right - left, 0.18) * 100;
          return (
            <div key={i} style={{ position: "absolute", left: `${left * 100}%`, top: `${top}px`, width: `${w}%`, minWidth: 72, height: `${laneH}px`, background: A_DEFINIR_COR, borderRadius: laneH / 2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#64748b", fontWeight: 600, zIndex: lane + 1 }}>
              {faseLabel(f) ? `${faseLabel(f)} · A definir` : "A definir"}
            </div>
          );
        }

        const fimEfetivo = f.fimRepactuado || f.fim;
        const f0 = dateToFrac(f.inicio, cells);
        const f1 = dateToFrac(fimEfetivo, cells);
        if (f0 == null || f1 == null || f1 < f0) return null;

        const frac = Math.max(0, Math.min(1, (Number(f.pct) || 0) / 100));
        const naturalW = (f1 - f0) * 100;
        // limitar ao mês atual — se não cabe à frente, cresce para trás
        const currCell = cells.find(c => f0 >= c.f0 && f0 < c.f1) || cells[cells.length - 1];
        const mesLabel = currCell?.mesLabel;
        const lastCellOfMes = mesLabel
          ? [...cells].reverse().find(c => c.mesLabel === mesLabel && !c.futuro)
          : currCell;
        const firstCellOfMes = mesLabel
          ? cells.find(c => c.mesLabel === mesLabel && !c.futuro)
          : currCell;
        const monthEnd   = lastCellOfMes?.f1 ?? 1;
        const monthStart = firstCellOfMes?.f0 ?? 0;
        const MIN_W = 8; // % mínimo para caber o texto
        const spaceAhead = (monthEnd - f0) * 100;

        // fim está no mesmo mês que início?
        const f1Cell = cells.find(c => f1 >= c.f0 && f1 < c.f1) || cells[cells.length-1];
        const sameMonth = !!(mesLabel && mesLabel === f1Cell?.mesLabel && !f1Cell?.futuro);

        // isNarrow: barra que cabe dentro do mês atual mas não tem espaço à frente para o texto
        // Se fim estiver em outro mês/trimestre, renderiza normalmente (não ajusta)
        const isNarrow = sameMonth && spaceAhead < MIN_W;
        // displayW:
        //   - isNarrow (mesmo mês, sem espaço à frente) → cresce para trás, limitado ao mês
        //   - barra curta com fim em mês/tri diferente → pode crescer para frente livremente
        //   - normal → usa naturalW
        const displayW = isNarrow
          ? Math.max(naturalW, Math.min(MIN_W, (monthEnd - monthStart) * 100))
          : !sameMonth && naturalW < MIN_W ? Math.max(naturalW, MIN_W)
          : naturalW;
        const adjustedLeft = isNarrow && spaceAhead < displayW
          ? Math.max(monthStart, monthEnd - displayW / 100)
          : f0;
        const displayLeft = adjustedLeft * 100;
        const f1orig = f.fimRepactuado ? dateToFrac(f.fim, cells) : null;
        const origPct = f1orig != null ? Math.max(0, Math.min(1, (f1orig - f0) / (f1 - f0 || 1))) : null;

        return (
          <div key={i} style={{ position: "absolute", left: `${displayLeft}%`, top: `${top}px`, width: `${displayW}%`, height: `${laneH}px`, borderRadius: laneH / 2, overflow: "visible", zIndex: lane + 1 }}>
            {/* envelope claro com extensão repactuada */}
            <div style={{ position: "absolute", inset: 0, background: tint(cor), borderRadius: laneH / 2, overflow: "hidden" }}>
              {origPct != null && (
                <div style={{ position: "absolute", left: `${origPct * 100}%`, top: 0, bottom: 0, right: 0, background: `repeating-linear-gradient(45deg,${tint(cor)},${tint(cor)} 3px,${tint(cor,0.55)} 3px,${tint(cor,0.55)} 6px)`, borderLeft: "2px solid #F47B20" }} />
              )}
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${frac * 100}%`, background: cor, borderRadius: laneH / 2 }} />
            </div>
            {!isNarrow && (
              <span style={{ position: "absolute", left: 4, top: "50%", transform: "translateY(-50%)", zIndex: 2, fontSize: 8.5, fontWeight: 700, color: frac > 0.12 ? "#fff" : "#1e293b", whiteSpace: "nowrap" }}>
                {f.pct || 0}%
              </span>
            )}
            <span style={{ position: "absolute", right: 3, top: "50%", transform: "translateY(-50%)", zIndex: 2, fontSize: 8, fontWeight: 700, color: frac >= 0.9 ? "#fff" : "#1e293b", whiteSpace: "nowrap" }}>
              {isNarrow ? `${f.pct||0}% ` : ""}
              {f.fimRepactuado ? ddmm(f.fim) + " → " + ddmm(f.fimRepactuado) : ddmm(fimEfetivo)}
            </span>
          </div>
        );
      })}
    </>
  );
}

// ---------- Card de raia (editor) ----------
export function RaiaCard({ r, aberta, toggle, upd, updFase, addFase, delFase, delRaia }) {
  return (
    <div style={{ background: "#FAFBFC", borderRadius: 10, marginBottom: 10, border: r.despriorizado ? "1px solid #E2E8F0" : "1px solid #EEF2F7" }}>
      <div className="raia-card-header" style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px" }}>
        <button className="raia-card-toggle" onClick={toggle} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex" }}>
          {aberta ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>
        <input className="inp" style={{ width: 100 }} value={r.lecom} onChange={(e) => upd(r.id, { lecom: e.target.value })} placeholder="Lecom" />
        <input className="inp raia-card-main-input" style={{ flex: 1, fontWeight: 600 }} value={r.nome} onChange={(e) => upd(r.id, { nome: e.target.value })} placeholder="Nome da demanda/marco" />
        {/* Fase atual */}
        {!r.despriorizado && r.fases.length > 0 && (
          <div className="raia-card-select-group" style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>Fase atual:</span>
            <select className="inp" style={{ width: 140, fontSize: 12, color: faseCor(r.fases[r.faseAtivaIdx ?? r.fases.length-1]), fontWeight: 700 }}
              value={r.faseAtivaIdx ?? r.fases.length - 1}
              onChange={(e) => upd(r.id, { faseAtivaIdx: +e.target.value })}>
              {r.fases.map((f, i) => (
                <option key={i} value={i}>{faseLabel(f) || `Fase ${i+1}`}</option>
              ))}
            </select>
          </div>
        )}
        {/* Status da demanda */}
        {!r.despriorizado && (
          <div className="raia-card-select-group" style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>Status:</span>
            <select className="inp" style={{ width: 120, fontSize: 12, fontWeight: 700,
              color: r.statusDemanda === 'Concluído' ? '#00B050' : r.statusDemanda === 'Em Andamento' ? '#0070C0' : r.statusDemanda === 'Atrasado' ? '#C00000' : '#94A3B8' }}
              value={r.statusDemanda || 'A iniciar'}
              onChange={(e) => upd(r.id, { statusDemanda: e.target.value })}>
              <option value="A iniciar">A iniciar</option>
              <option value="Em Andamento">Em Andamento</option>
              <option value="Atrasado">Atrasado</option>
              <option value="Concluído">Concluído</option>
            </select>
          </div>
        )}
        <label className="raia-card-checkbox-group" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#64748b", whiteSpace: "nowrap", cursor: "pointer" }}>
          <input type="checkbox" checked={r.despriorizado} onChange={(e) => upd(r.id, { despriorizado: e.target.checked })} />
          Despriorizado
        </label>
        <button className="raia-card-delete" onClick={() => delRaia(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", display: "flex" }}><Trash2 size={16} /></button>
      </div>

      {aberta && !r.despriorizado && (
        <div className="raia-card-body" style={{ padding: "0 14px 14px 40px" }}>
          {/* cabeçalho */}
          <div className="raia-phase-header" style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px 110px 80px 1fr 36px", gap: 10, fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", padding: "0 2px 5px" }}>
            <span>Fase</span><span>Início</span><span>Fim</span><span title="Nova data fim (repactuação)">↪ Repac.</span><span style={{ fontSize:9 }} title="Sem data definida">DT A<br/>DEF.</span><span>% executado</span><span style={{ textAlign: "center" }}>—</span>
          </div>
          {r.fases.map((f, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div className="raia-phase-row" style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px 110px 80px 1fr 36px", gap: 10, alignItems: "center" }}>
                {/* Fase: select + campo manual */}
                <div className="raia-phase-field" style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <label style={{ fontSize: 12 }}>Fase</label>
                  <select className="inp" style={{ fontSize: 12 }} value={f.fase} onChange={(e) => updFase(r.id, i, { fase: e.target.value, faseCustom: e.target.value === FASE_CUSTOM ? (f.faseCustom || '') : undefined })}>
                    {ORDEM_FASES.map((fa) => <option key={fa}>{fa}</option>)}
                    <option value={FASE_CUSTOM}>✏️ Incluir manual…</option>
                  </select>
                  {f.fase === FASE_CUSTOM && (
                    <input className="inp" style={{ fontSize: 12 }} placeholder="Nome da fase…" value={f.faseCustom || ''} onChange={(e) => updFase(r.id, i, { faseCustom: e.target.value })} />
                  )}
                </div>
                {/* Início */}
                <div className="raia-phase-field">
                  <label style={{ fontSize: 12 }}>Início</label>
                  <input type="date" className="inp" style={{ fontSize: 12 }} value={f.inicio || ''} disabled={!!f.aDefinir} onChange={(e) => updFase(r.id, i, { inicio: e.target.value })} />
                </div>
                {/* Fim */}
                <div className="raia-phase-field">
                  <label style={{ fontSize: 12 }}>Fim</label>
                  <input type="date" className="inp" style={{ fontSize: 12 }} value={f.fim || ''} disabled={!!f.aDefinir} onChange={(e) => updFase(r.id, i, { fim: e.target.value })} />
                </div>
                {/* Repactuação */}
                <div className="raia-phase-field" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <label style={{ fontSize: 12 }}>Repac.</label>
                  {f.fim && !f.aDefinir ? (
                    <input type="date" className="inp" style={{ fontSize: 12, borderColor: f.fimRepactuado ? '#F47B20' : '#cbd5e1' }}
                      title="Nova data fim (repactuação)" value={f.fimRepactuado || ''} onChange={(e) => updFase(r.id, i, { fimRepactuado: e.target.value || undefined })} />
                  ) : (
                    <div style={{ height: 32 }} />
                  )}
                </div>
                {/* Checkbox A definir */}
                <div className="raia-phase-field raia-phase-inline-toggle">
                  <label style={{ fontSize: 12 }}>A definir</label>
                  <label title="A definir (sem datas)" style={{ display: "flex", alignItems: "center", justifyContent: "left", cursor: "pointer" }}>
                    <input type="checkbox" checked={!!f.aDefinir} onChange={(e) => updFase(r.id, i, { aDefinir: e.target.checked, inicio: e.target.checked ? '' : f.inicio, fim: e.target.checked ? '' : f.fim, fimRepactuado: e.target.checked ? undefined : f.fimRepactuado })} />
                  </label>
                </div>
                {/* Slider % */}
                <div className="raia-phase-field raia-phase-slider" style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, opacity: f.aDefinir ? 0.4 : 1 }}>
                  <label style={{ fontSize: 12 }}>% executado</label>
                  <input type="range" min={0} max={100} value={f.pct || 0} disabled={!!f.aDefinir} onChange={(e) => updFase(r.id, i, { pct: +e.target.value })} style={{ flex: 1, minWidth: 0, accentColor: faseCor(f) }} />
                  <span style={{ fontSize: 12.5, fontWeight: 700, width: 38, textAlign: "right", color: "#0f172a", flexShrink: 0 }}>{f.pct || 0}%</span>
                </div>
                {/* Trash */}
                <div className="raia-phase-field">
                  <label style={{ fontSize: 12 }}>Ação</label>
                  <button onClick={() => delFase(r.id, i)} title="Remover fase" style={{ background: "none", border: "1px solid #fecaca", borderRadius: 8, cursor: "pointer", color: "#ef4444", display: "flex", justifyContent: "center", alignItems: "center", minHeight: 34, width: '100%' }}><Trash2 size={15} /></button>
                </div>
              </div>
              {/* hint repactuação */}
              {f.fimRepactuado && !f.aDefinir && (
                <div style={{ fontSize: 11, color: "#F47B20", gridColumn: "1 / -1", marginTop: 2, paddingLeft: 4 }}>
                  ⚠ Data original: {ddmm(f.fim)} → Repactuada: {ddmm(f.fimRepactuado)}
                </div>
              )}
              {f.aDefinir && (
                <div style={{ fontSize: 11, color: "#94a3b8", gridColumn: "1 / -1", marginTop: 2, paddingLeft: 4 }}>
                  ◻ Sem data definida — aparece como "A definir" no cronograma
                </div>
              )}
            </div>
          ))}
          <button className="btn" onClick={() => addFase(r.id)} style={{ background: "#eef2f7", color: "#334155", marginTop: 4 }}><Plus size={14} />Adicionar fase</button>
        </div>
      )}
      {aberta && r.despriorizado && (
        <div className="raia-despri-body" style={{ padding: "0 14px 14px 40px", display: "flex", gap: 10, alignItems: "end" }}>
          <Field label="Início (span da raia)"><input type="date" className="inp" value={r.fases[0]?.inicio || ""} onChange={(e) => updFase(r.id, 0, { inicio: e.target.value })} /></Field>
          <Field label="Fim (span da raia)"><input type="date" className="inp" value={r.fases[0]?.fim || ""} onChange={(e) => updFase(r.id, 0, { fim: e.target.value })} /></Field>
          <span style={{ fontSize: 12, color: "#94a3b8", paddingBottom: 8 }}>Raia cinza com "Despriorizado".</span>
        </div>
      )}
    </div>
  );
}

// ---------- UI helpers ----------
export function Section({ title, children }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "16px 18px", marginTop: 16, boxShadow: "0 1px 2px rgba(0,0,0,.05)" }}>
      <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 700, color: "#003B82", margin: "0 0 14px" }}>{title}</h2>
      {children}
    </div>
  );
}
export function Field({ label, children }) {
  return (<label style={{ display: "block" }}><div className="lbl" style={{ marginBottom: 4 }}>{label}</div>{children}</label>);
}

// ============================================================
//  Geração do .pptx — gerador próprio, sem bibliotecas externas
//  (OOXML + ZIP montados na mão). Coordenadas em polegadas,
//  calibradas a partir do template original Hapvida.
// ============================================================
const EMU = 914400;
const emu = (inch) => Math.round(inch * EMU);
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ---- CRC32 ----
const crcTable = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u8) { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = crcTable[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }

// ---- ZIP store-only ----
function zip(parts) {
  const enc = new TextEncoder();
  const files = Object.entries(parts).map(([name, content]) => ({ name, data: enc.encode(content) }));
  const chunks = []; const central = []; let offset = 0;
  const u16 = (n) => [n & 255, (n >> 8) & 255];
  const u32 = (n) => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >> 24) & 255];
  for (const f of files) {
    const nameBytes = enc.encode(f.name); const crc = crc32(f.data); const sz = f.data.length;
    const local = [].concat(u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(sz), u32(sz), u16(nameBytes.length), u16(0));
    chunks.push(new Uint8Array(local), nameBytes, f.data);
    const cen = [].concat(u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(sz), u32(sz), u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset));
    central.push(new Uint8Array(cen), nameBytes);
    offset += local.length + nameBytes.length + sz;
  }
  let cenSize = 0; central.forEach((c) => cenSize += c.length);
  const cenOffset = offset;
  const eocd = [].concat(u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(cenSize), u32(cenOffset), u16(0));
  const all = [...chunks, ...central, new Uint8Array(eocd)];
  let total = 0; all.forEach((c) => total += c.length);
  const out = new Uint8Array(total); let p = 0; all.forEach((c) => { out.set(c, p); p += c.length; });
  return out;
}

// ---- DrawingML helpers ----
let _id = 100;
const nid = () => ++_id;
function lineToParas(content, rPrBase) {
  // content: string | [{text,bold}]
  let runs = typeof content === "string" ? [{ text: content }] : content;
  const lines = [[]];
  for (const r of runs) {
    const segs = String(r.text).split("\n");
    segs.forEach((seg, i) => { if (i > 0) lines.push([]); if (seg !== "" || segs.length === 1) lines[lines.length - 1].push({ text: seg, bold: r.bold }); });
  }
  return lines.map((line) => {
    const runsXml = line.map((r) => `<a:r><a:rPr lang="pt-BR" sz="${rPrBase.sz}"${r.bold ? ' b="1"' : (rPrBase.bold ? ' b="1"' : "")}><a:solidFill><a:srgbClr val="${rPrBase.color}"/></a:solidFill><a:latin typeface="Archivo"/></a:rPr><a:t>${esc(r.text)}</a:t></a:r>`).join("");
    const pPr = `<a:pPr algn="${rPrBase.algn}">${rPrBase.lnSpc ? `<a:lnSpc><a:spcPct val="${rPrBase.lnSpc}"/></a:lnSpc>` : ""}</a:pPr>`;
    return `<a:p>${pPr}${runsXml || '<a:endParaRPr lang="pt-BR"/>'}</a:p>`;
  }).join("");
}
function txBody(content, o) {
  const opt = Object.assign({ sz: 1000, bold: false, color: "000000", algn: "l", anchor: "t", wrap: "square" }, o);
  return `<p:txBody><a:bodyPr wrap="${opt.wrap}" anchor="${opt.anchor}" lIns="36000" tIns="18000" rIns="36000" bIns="18000"></a:bodyPr><a:lstStyle/>${lineToParas(content, opt)}</p:txBody>`;
}
function shape({ x, y, w, h, prst = "rect", fill, line, round, text, textOpt }) {
  const geomPrst = (round != null && prst === "rect") ? "roundRect" : prst;
  const geom = round != null
    ? `<a:prstGeom prst="${geomPrst}"><a:avLst><a:gd name="adj" fmla="val ${round}"/></a:avLst></a:prstGeom>`
    : `<a:prstGeom prst="${prst}"><a:avLst/></a:prstGeom>`;
  const fillXml = fill ? `<a:solidFill><a:srgbClr val="${fill}"/></a:solidFill>` : `<a:noFill/>`;
  const lineXml = line ? `<a:ln w="${emu(line.w || 0.01)}"><a:solidFill><a:srgbClr val="${line.color}"/></a:solidFill></a:ln>` : `<a:ln><a:noFill/></a:ln>`;
  const body = text != null ? txBody(text, textOpt) : `<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="pt-BR"/></a:p></p:txBody>`;
  return `<p:sp><p:nvSpPr><p:cNvPr id="${nid()}" name="s${_id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(w)}" cy="${emu(h)}"/></a:xfrm>${geom}${fillXml}${lineXml}</p:spPr>${body}</p:sp>`;
}
function dashLine({ x, y, h, color, w = 0.02 }) {
  return `<p:cxnSp><p:nvCxnSpPr><p:cNvPr id="${nid()}" name="l${_id}"/><p:cNvCxnSpPr/><p:nvPr/></p:nvCxnSpPr><p:spPr><a:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="0" cy="${emu(h)}"/></a:xfrm><a:prstGeom prst="line"><a:avLst/></a:prstGeom><a:ln w="${emu(w)}"><a:solidFill><a:srgbClr val="${color}"/></a:solidFill><a:prstDash val="dash"/></a:ln></p:spPr></p:cxnSp>`;
}

// ===== scaffolds estáticos =====
const REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const CT = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/></Types>`;
const RELS_ROOT = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/officeDocument" Target="ppt/presentation.xml"/></Relationships>`;
const PRES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="${REL}" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst><p:sldId id="256" r:id="rId2"/></p:sldIdLst><p:sldSz cx="12192000" cy="6858000"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`;
const PRES_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/slideMaster" Target="slideMasters/slideMaster1.xml"/><Relationship Id="rId2" Type="${REL}/slide" Target="slides/slide1.xml"/><Relationship Id="rId3" Type="${REL}/theme" Target="theme/theme1.xml"/></Relationships>`;
const EMPTY_TREE = `<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree>`;
const MASTER = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="${REL}" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld>${EMPTY_TREE}</p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst></p:sldMaster>`;
const MASTER_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="${REL}/theme" Target="../theme/theme1.xml"/></Relationships>`;
const LAYOUT = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="${REL}" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1"><p:cSld name="Blank">${EMPTY_TREE}</p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`;
const LAYOUT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`;
const SLIDE_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/slideLayout" Target="../slideLayouts/slideLayout1.xml"/></Relationships>`;
function themeXml() {
  const dk1="000000",lt1="FFFFFF",dk2="1F2A44",lt2="EEEEEE";
  const acc=["003B82","F47B20","0070C0","7030A0","00B050","FDB713"];
  const accXml = acc.map((c,i)=>`<a:accent${i+1}><a:srgbClr val="${c}"/></a:accent${i+1}>`).join("");
  const fill3 = `<a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill>`;
  const ln3 = `<a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="12700"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="19050"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>`;
  const eff3 = `<a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle>`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Tema"><a:themeElements><a:clrScheme name="Tema"><a:dk1><a:srgbClr val="${dk1}"/></a:dk1><a:lt1><a:srgbClr val="${lt1}"/></a:lt1><a:dk2><a:srgbClr val="${dk2}"/></a:dk2><a:lt2><a:srgbClr val="${lt2}"/></a:lt2>${accXml}<a:hlink><a:srgbClr val="0070C0"/></a:hlink><a:folHlink><a:srgbClr val="7030A0"/></a:folHlink></a:clrScheme><a:fontScheme name="Tema"><a:majorFont><a:latin typeface="Archivo"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Archivo"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="Tema"><a:fillStyleLst>${fill3}</a:fillStyleLst><a:lnStyleLst>${ln3}</a:lnStyleLst><a:effectStyleLst>${eff3}</a:effectStyleLst><a:bgFillStyleLst>${fill3}</a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`;
}
function slideXml(shapesXml) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="${REL}" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>${shapesXml}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
}
function buildPptxParts(shapesXml) {
  return {
    "[Content_Types].xml": CT,
    "_rels/.rels": RELS_ROOT,
    "ppt/presentation.xml": PRES,
    "ppt/_rels/presentation.xml.rels": PRES_RELS,
    "ppt/slideMasters/slideMaster1.xml": MASTER,
    "ppt/slideMasters/_rels/slideMaster1.xml.rels": MASTER_RELS,
    "ppt/slideLayouts/slideLayout1.xml": LAYOUT,
    "ppt/slideLayouts/_rels/slideLayout1.xml.rels": LAYOUT_RELS,
    "ppt/theme/theme1.xml": themeXml(),
    "ppt/slides/slide1.xml": slideXml(shapesXml),
    "ppt/slides/_rels/slide1.xml.rels": SLIDE_RELS,
  };
}

function fmtBR(d){if(!d)return"";const x=new Date(d+"T12:00:00");if(isNaN(x))return"";return `${String(x.getDate()).padStart(2,"0")}/${String(x.getMonth()+1).padStart(2,"0")}/${x.getFullYear()}`;}

function tintHex(hex,amount=0.78){const n=parseInt(hex,16);let r=(n>>16)&255,g=(n>>8)&255,b=n&255;r=Math.round(r+(255-r)*amount);g=Math.round(g+(255-g)*amount);b=Math.round(b+(255-b)*amount);return[r,g,b].map(v=>v.toString(16).padStart(2,"0")).join("");}




// ---- PPTX Multi-slide ----
function buildMultiSlidePptxParts(slideXmlsArr) {
  const N = slideXmlsArr.length;
  let ctOverrides = `<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>`;
  for (let i=1;i<=N;i++) ctOverrides+=`<Override PartName="/ppt/slides/slide${i}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`;
  const CTm=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${ctOverrides}</Types>`;
  let sldIdLst=''; for(let i=1;i<=N;i++) sldIdLst+=`<p:sldId id="${255+i}" r:id="rId${i+1}"/>`;
  const PRM=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>${sldIdLst}</p:sldIdLst><p:sldSz cx="12192000" cy="6858000"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`;
  let presR=`<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>`;
  for(let i=1;i<=N;i++) presR+=`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i}.xml"/>`;
  const PRR=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${presR}</Relationships>`;
  const parts={
    "[Content_Types].xml":CTm, "_rels/.rels":RELS_ROOT,
    "ppt/presentation.xml":PRM, "ppt/_rels/presentation.xml.rels":PRR,
    "ppt/slideMasters/slideMaster1.xml":MASTER, "ppt/slideMasters/_rels/slideMaster1.xml.rels":MASTER_RELS,
    "ppt/slideLayouts/slideLayout1.xml":LAYOUT, "ppt/slideLayouts/_rels/slideLayout1.xml.rels":LAYOUT_RELS,
    "ppt/theme/theme1.xml":themeXml(),
  };
  slideXmlsArr.forEach((xml,i)=>{
    parts[`ppt/slides/slide${i+1}.xml`]=slideXml(xml);
    parts[`ppt/slides/_rels/slide${i+1}.xml.rels`]=SLIDE_RELS;
  });
  return parts;
}

// Gera 1 ou mais slides para um projeto (paginação automática)
function gerarSlidesXmls({ projeto, raias, timeline, usaPacotes, pacotes }) {
  // Slide 1 sempre usa gerarSlideXml original (layout correto e validado)
  const slide1 = gerarSlideXml({ projeto, raias, timeline, usaPacotes, pacotes });

  // Verificar se precisa paginar
  const cells = timeline.cells;
  const hY1 = 2.34, hH = 0.57;
  const bodyTop1 = hY1 + hH;   // 2.91
  const bodyTopC = 0.99;        // cabeçalho compacto
  const bodyBottom = 5.92;

  const totalRows = usaPacotes && pacotes?.length
    ? pacotes.reduce((s, p) => s + 1 + p.raiaIds.length, 0)
    : raias.length;
  const nRows = Math.max(totalRows, 7);
  const rowH = Math.min(0.42, (bodyBottom - bodyTop1) / nRows);

  const calcRh = (r) => {
    if (r.despriorizado) return rowH;
    const com = (r.fases || []).filter(f => !f.aDefinir);
    const sem = (r.fases || []).filter(f => f.aDefinir);
    const ends = [];
    [...com].sort((a, b) => (a.inicio || '') <= (b.inicio || '') ? -1 : 1).forEach(f => {
      const fim = f.fimRepactuado || f.fim || '';
      let l = ends.findIndex(e => (e || '') < (f.inicio || ''));
      if (l === -1) { l = ends.length; ends.push(''); } ends[l] = fim;
    });
    const n = Math.max(ends.length + sem.length, 1);
    if (n <= 1) return rowH;
    return Math.max(rowH, n * 0.13 + (n - 1) * 0.02 + 0.06);
  };

  const allRows = [];
  if (!usaPacotes || !pacotes?.length) {
    raias.forEach(r => allRows.push({ r, rh: calcRh(r) }));
  } else {
    pacotes.forEach(pac => {
      const pr = pac.raiaIds.map(id => raias.find(r => r.id === id)).filter(Boolean);
      allRows.push({ rh: rowH });
      pr.forEach(r => allRows.push({ r, rh: calcRh(r) }));
    });
  }

  const totalH = allRows.reduce((s, r) => s + r.rh, 0);
  if (totalH <= bodyBottom - bodyTop1 + 0.1) {
    // Cabe num só slide
    return [slide1];
  }

  // Determinar quais raias ficam no slide 1 e quais vão para continuação
  let curY = bodyTop1;
  const page1Ids = new Set();
  const contRows = [];
  let inCont = false;
  for (const row of allRows) {
    if (!inCont && curY + row.rh <= bodyBottom + 0.05) {
      if (row.r) page1Ids.add(row.r.id);
      curY += row.rh;
    } else {
      inCont = true;
      if (row.r) contRows.push(row.r);
    }
  }

  if (contRows.length === 0) return [slide1];

  // Gerar slide de continuação com as raias restantes
  const contSlides = [];
  let batch = [];
  let bY = bodyTopC;

  const flushBatch = () => {
    if (batch.length === 0) return;
    const batchSlide = gerarSlideContXml({ projeto, raias: batch, timeline, usaPacotes: false, pacotes: [] });
    contSlides.push(batchSlide);
    batch = [];
    bY = bodyTopC;
  };

  for (const r of contRows) {
    const rh = calcRh(r);
    if (bY + rh > bodyBottom + 0.05 && batch.length > 0) flushBatch();
    batch.push(r);
    bY += rh;
  }
  flushBatch();

  return [slide1, ...contSlides];
}


export function baixarPptx(projects) {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mesInicio = Math.floor(hoje.getMonth() / 3) * 3 + 1;
  const allSlideXmls = [];
  projects.forEach((p) => {
    _id = 100;
    const tl = buildTimeline(ano, mesInicio, p.nFuturos ?? 1, p.nPassados ?? 0);
    const slides = gerarSlidesXmls({ projeto: p.projeto, raias: p.raias, timeline: tl, usaPacotes: p.usaPacotes ?? false, pacotes: p.pacotes ?? [] });
    slides.forEach(xml => allSlideXmls.push(xml));
  });
  const parts = buildMultiSlidePptxParts(allSlideXmls);
  const bytes = zip(parts);
  const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
  const url = URL.createObjectURL(blob);
  const safe = (projects[0]?.projeto?.nome || "Projetos").replace(/[^\wÀ-ú\- ]/g, "").trim().replace(/\s+/g, "_").slice(0,40);
  const a = document.createElement("a");
  a.href = url; a.download = `Status_Semanal_${safe}.pptx`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}


// Slide de continuação: cabeçalho compacto + raias passadas
function gerarSlideContXml({ projeto, raias, timeline, slideNum, totalSlides }) {
  // Reutiliza gerarSlideXml com flag de continuação embutida no nome
  // Hack simples: gera normalmente e substitui o bloco de cabeçalho no XML resultante
  // O cabeçalho do cronograma (linhas da tabela) é mantido — só o topo muda
  const fullXml = gerarSlideXml({ projeto, raias, timeline, usaPacotes: false, pacotes: [] });
  // O fullXml é shapes raw (sem wrapper) — retornar como está
  // Os slides de continuação ficam iguais ao original mas com raias diferentes
  return fullXml;
}

function gerarSlideXml({ projeto, raias, timeline, usaPacotes, pacotes }) {
  const S = [];
  const HX = (c) => (c || "").replace("#", "");
  const cells = timeline.cells;
  const X0 = 4.87, X1 = 13.18;
  const fx = (f) => X0 + f * (X1 - X0);
  const dX = (d) => { const f = dateToFrac(d, cells); return f == null ? null : fx(f); };

  // título
  S.push(shape({ x:0.27,y:0.18,w:0.09,h:0.42,fill:"F47B20" }));
  S.push(shape({ x:0.45,y:0.12,w:9,h:0.55,text:projeto.nome,textOpt:{sz:2600,bold:true,color:"003B82",algn:"l",anchor:"ctr"} }));
  // (logo/nome Hapvida removido do canto superior direito)

  // boxes topo
  S.push(shape({ x:0.14,y:0.78,w:3,h:0.26,text:"Resumo do Projeto",textOpt:{sz:1300,bold:true,color:"003B82"} }));
  S.push(shape({ x:0.14,y:1.06,w:6.8,h:0.78,fill:"F2F2F2",line:{color:"E2E8F0",w:0.01},round:6000 }));
  S.push(shape({ x:0.26,y:1.09,w:6.55,h:0.72,text:[{text:"Lecom: ",bold:1},{text:(projeto.resumoLecom||"")+"\n"},{text:"Descrição: ",bold:1},{text:projeto.resumoDesc||""}],textOpt:{sz:850,color:"1E293B",anchor:"t"} }));

  S.push(shape({ x:7.01,y:0.78,w:3,h:0.26,text:"Equipe do Projeto",textOpt:{sz:1300,bold:true,color:"003B82"} }));
  S.push(shape({ x:7.01,y:1.06,w:3.5,h:0.78,fill:"F2F2F2",line:{color:"E2E8F0",w:0.01},round:6000 }));
  S.push(shape({ x:7.12,y:1.09,w:1.7,h:0.72,text:[{text:"Área Cliente: ",bold:1},{text:(projeto.areaCliente||"")+"\n"},{text:"Diretor: ",bold:1},{text:(projeto.dirCliente||"")+"\n"},{text:"Líder: ",bold:1},{text:projeto.lidCliente||""}],textOpt:{sz:800,color:"1E293B",anchor:"ctr",lnSpc:150000} }));
  S.push(shape({ x:8.7,y:1.09,w:1.75,h:0.72,text:[{text:"Área Executora: ",bold:1},{text:(projeto.areaExec||"")+"\n"},{text:"Diretor: ",bold:1},{text:(projeto.dirExec||"")+"\n"},{text:"Líder: ",bold:1},{text:projeto.lidExec||""}],textOpt:{sz:800,color:"1E293B",anchor:"ctr",lnSpc:150000} }));

  S.push(shape({ x:10.58,y:0.78,w:2.6,h:0.26,text:"Status Geral",textOpt:{sz:1300,bold:true,color:"003B82"} }));
  S.push(shape({ x:10.58,y:1.06,w:2.59,h:0.78,fill:"F2F2F2",line:{color:"E2E8F0",w:0.01},round:6000 }));
  [["Bom","69AE9A"],["Com Riscos","FDB713"],["Com Problemas","FF0000"]].forEach(([t,c],i)=>{
    S.push(shape({ x:10.72,y:1.16+i*0.21,w:0.14,h:0.14,prst:"ellipse",fill:c }));
    S.push(shape({ x:10.92,y:1.13+i*0.21,w:1.3,h:0.2,text:t,textOpt:{sz:900,color:"334155",anchor:"ctr"} }));
  });
  S.push(shape({ x:12.45,y:1.2,w:0.55,h:0.55,prst:"ellipse",fill:HX(STATUS_GERAL[projeto.statusGeral]||"#999999") }));

  // cronograma + legenda
  S.push(shape({ x:0.1,y:2.0,w:3,h:0.26,text:"Cronograma de Execução",textOpt:{sz:1300,bold:true,color:"003B82"} }));
  let lx=6.5;
  Object.entries(FASES).forEach(([k,v])=>{
    S.push(shape({ x:lx,y:2.07,w:0.11,h:0.11,fill:HX(v) }));
    S.push(shape({ x:lx+0.14,y:2.0,w:1.25,h:0.22,text:k,textOpt:{sz:700,color:"334155",anchor:"ctr",wrap:"none"} }));
    lx+=0.14+k.length*0.066+0.12;
  });

  // cabeçalho grade — cores exatas do template
  const hY=2.34,hH=0.57; const qY=hY,mY=hY+0.19,dY=hY+0.38,bandH=0.19;
  const LABEL_BG="F2F2F2", LABEL_TX="1F2A44", GRID_LN={color:"D9D9D9",w:0.008};
  const head=(x,w,t)=>{ S.push(shape({x,y:hY,w,h:hH,fill:"2F5597",line:GRID_LN})); S.push(shape({x:x+0.02,y:hY,w:w-0.04,h:hH,text:t,textOpt:{sz:900,bold:true,color:"FFFFFF",algn:"ctr",anchor:"ctr",wrap:"none"}})); };
  head(0.14,0.67,"Lecom"); head(0.81,2.37,"Marcos/Demanda"); head(3.18,1.0,"Status"); head(4.18,0.69,"Dt Início");
  const vig=cells.filter(c=>!c.futuro);
  // faixa do dia (BFBFBF) — título sz:900
  vig.forEach(c=>{ const xa=fx(c.f0),xb=fx(c.f1); S.push(shape({x:xa,y:dY,w:xb-xa,h:bandH,fill:"BFBFBF",line:GRID_LN,text:c.label,textOpt:{sz:900,bold:true,color:"FFFFFF",algn:"ctr",anchor:"ctr"}})); });
  // faixa do mês (595959) — título sz:900
  const grupos=[]; cells.forEach(c=>{ if(c.futuro)return; const last=grupos[grupos.length-1]; if(last&&last.label===c.mesLabel)last.b=c.f1; else grupos.push({label:c.mesLabel,a:c.f0,b:c.f1}); });
  grupos.forEach(g=>{ const xa=fx(g.a),xb=fx(g.b); S.push(shape({x:xa,y:mY,w:xb-xa,h:bandH,fill:"595959",line:GRID_LN,text:g.label,textOpt:{sz:900,bold:true,color:"FFFFFF",algn:"ctr",anchor:"ctr"}})); });
  // faixa do trimestre vigente (2F5597) — título sz:900
  if(vig.length){const xa=fx(vig[0].f0),xb=fx(vig[vig.length-1].f1); S.push(shape({x:xa,y:qY,w:xb-xa,h:bandH,fill:"2F5597",line:GRID_LN,text:`${timeline.trimVigente}T`,textOpt:{sz:900,bold:true,color:"FFFFFF",algn:"ctr",anchor:"ctr"}}));}
  // trimestres futuros/passados — sz:900
  cells.filter(c=>c.futuro).forEach(c=>{ S.push(shape({x:fx(c.f0),y:qY,w:fx(c.f1)-fx(c.f0),h:hH,fill:"2F5597",line:GRID_LN,text:c.label,textOpt:{sz:900,bold:true,color:"FFFFFF",algn:"ctr",anchor:"ctr"}})); });

  // linhas
  const bodyTop=hY+hH,bodyBottom=5.92;
  const totalRows = usaPacotes && pacotes?.length
    ? pacotes.reduce((s,pac) => s + 1 + pac.raiaIds.length, 0)
    : raias.length;
  const nRows=Math.max(totalRows,7);
  const rowH=Math.min(0.42,(bodyBottom-bodyTop)/nRows);
  const barH=Math.min(0.2,rowH*0.55);

  // altura por raia: usa lane mínima de 0.13in (~9pt) para não sobrescrever
  const calcRhPptx = (r) => {
    if (r.despriorizado) return rowH;
    const comDatas = (r.fases||[]).filter(f=>!f.aDefinir);
    const semDatas = (r.fases||[]).filter(f=>f.aDefinir);
    const ends=[];
    [...comDatas].sort((a,b)=>(a.inicio||'')<=(b.inicio||'')?-1:1).forEach(f=>{
      const fim=f.fimRepactuado||f.fim||'';
      let l=ends.findIndex(e=>(e||'')<(f.inicio||''));
      if(l===-1){l=ends.length;ends.push('');}ends[l]=fim;
    });
    const numLanes = Math.max(ends.length + semDatas.length, 1);
    if (numLanes <= 1) return rowH;
    const MIN_LANE = 0.13; // altura mínima legível por lane (~9pt)
    const needed = numLanes * MIN_LANE + (numLanes-1)*0.02 + 0.06;
    return Math.max(rowH, needed);
  };

  const renderRaiaRow = (r, ry, rh) => {
    const cy=ry+(rh-barH)/2;
    [[0.14,0.67],[0.81,2.37],[3.18,1.0],[4.18,0.69]].forEach(([cx,cw])=>S.push(shape({x:cx,y:ry,w:cw,h:rh,fill:"F2F2F2",line:GRID_LN})));
    cells.forEach(c=>{ const xa=fx(c.f0),xb=fx(c.f1); S.push(shape({x:xa,y:ry,w:xb-xa,h:rh,fill:c.futuro?"F8FAFC":"FFFFFF",line:GRID_LN})); });
    S.push(shape({x:0.16,y:ry,w:0.64,h:rh,text:r.lecom||"",textOpt:{sz:900,color:"404040",algn:"ctr",anchor:"ctr",wrap:"none"}}));
    S.push(shape({x:0.86,y:ry,w:2.28,h:rh,text:r.nome||"",textOpt:{sz:900,bold:true,color:"1F2A44",anchor:"ctr"}}));
    const stRaw = r.despriorizado ? 'Despriorizado' : (r.statusDemanda || 'A iniciar');
    const stCor = r.despriorizado ? '7F7F7F' : stRaw === 'Concluído' ? '00B050' : stRaw === 'Em Andamento' ? '0070C0' : stRaw === 'Atrasado' ? 'C00000' : '94A3B8';
    S.push(shape({x:3.18,y:ry,w:0.98,h:rh,text:stRaw,textOpt:{sz:900,bold:true,color:stCor,algn:"ctr",anchor:"ctr",wrap:"none"}}));
    const dtIni=(()=>{const d=r.fases[0]?.inicio||"";if(!d)return"";const x=new Date(d+"T12:00:00");if(isNaN(x))return"";return String(x.getDate()).padStart(2,"0")+"/"+String(x.getMonth()+1).padStart(2,"0");})();
    S.push(shape({x:4.18,y:ry,w:0.68,h:rh,text:dtIni,textOpt:{sz:900,color:"404040",algn:"ctr",anchor:"ctr",wrap:"none"}}));
    if(r.despriorizado){
      const xa=dX(r.fases.reduce((a,f)=>(f.inicio&&(!a||f.inicio<a)?f.inicio:a),null))??X0;
      const xb=dX(r.fases.reduce((a,f)=>(f.fim&&f.fim>a?f.fim:a),""))??X1;
      if(xb>xa){ S.push(shape({x:xa,y:cy,w:xb-xa,h:barH,fill:"D9D9D9",round:50000,text:"Despriorizado",textOpt:{sz:750,color:"64748B",algn:"ctr",anchor:"ctr",wrap:"none"}})); }
      return;
    }
    const lanesInfo=(()=>{
      const ends=[];const asgn=new Array(r.fases.length).fill(0);
      const comDatas=r.fases.map((f,i)=>({...f,_i:i})).filter(f=>!f.aDefinir).sort((a,b)=>(a.inicio||'')<=(b.inicio||'')?-1:1);
      const semDatas=r.fases.map((f,i)=>({...f,_i:i})).filter(f=>f.aDefinir);
      for(const f of comDatas){const fim=f.fimRepactuado||f.fim||'';let l=ends.findIndex(e=>(e||'')<(f.inicio||''));if(l===-1){l=ends.length;ends.push('');}ends[l]=fim;asgn[f._i]=l;}
      for(const f of semDatas){const l=ends.length;ends.push('9999-12-31');asgn[f._i]=l;}
      return{asgn,n:Math.max(ends.length,1)};
    })();
    const {asgn,n:numL}=lanesInfo;
    const lBarH=numL>1?Math.min(barH,(rh*0.75)/numL):barH;
    const lGap=numL>1?0.02:0;
    const totH=numL*lBarH+(numL-1)*lGap;
    const lTop=ry+Math.max(0,(rh-totH)/2);
    const MIN_BAR=0.25;
    r.fases.forEach((f,fi)=>{
      const lane=asgn[fi]; const cy2=lTop+lane*(lBarH+lGap);
      const rawCor = f.fase===FASE_CUSTOM ? '#64748B' : (FASES[f.fase]||"#999999");
      const cor=HX(rawCor); const corL=tintHex(cor);
      const frac=Math.max(0,Math.min(1,(Number(f.pct)||0)/100));
      if(f.aDefinir){
        const hoje=new Date(); const mesAtual=hoje.getMonth(); const anoAtual=hoje.getFullYear();
        const celsMes=cells.filter(c=>!c.futuro&&c.start instanceof Date&&c.start.getMonth()===mesAtual&&c.start.getFullYear()===anoAtual);
        const celsRef=celsMes.length>0?celsMes:cells.filter(c=>!c.futuro).slice(-2);
        const adefX=celsRef.length>0?fx(celsRef[0].f0):(X0+(X1-X0)*0.72);
        const adefW=celsRef.length>0?Math.max(fx(celsRef[celsRef.length-1].f1)-adefX,0.6):(X1-X0)*0.22;
        const adefLabel = faseLabel(f) ? faseLabel(f) + ' · A definir' : 'A definir';
        S.push(shape({x:adefX,y:cy2,w:adefW,h:lBarH,fill:"D9D9D9",round:50000,text:adefLabel,textOpt:{sz:550,bold:true,color:"64748B",algn:"ctr",anchor:"ctr",wrap:"none"}}));
        return;
      }
      const fimEfetivo = f.fimRepactuado || f.fim;
      const xa=dX(f.inicio), xb=dX(fimEfetivo);
      if(xa==null||xb==null) return;
      const naturalW=Math.max(xb-xa,0);
      // mesma lógica do preview: barra curta com fim em mês diferente cresce para frente
      const MIN_DISPLAY=0.6; // ~polegadas mínimas para caber % + data
      const f1fracPptx=dateToFrac(fimEfetivo,cells);
      const f0fracPptx=dateToFrac(f.inicio,cells);
      const f1cellPptx=f1fracPptx!=null?cells.find(c=>f1fracPptx>=c.f0&&f1fracPptx<c.f1)||cells[cells.length-1]:null;
      const f0cellPptx=f0fracPptx!=null?cells.find(c=>f0fracPptx>=c.f0&&f0fracPptx<c.f1)||cells[cells.length-1]:null;
      const sameMonthPptx=!!(f0cellPptx?.mesLabel&&f0cellPptx.mesLabel===f1cellPptx?.mesLabel&&!f1cellPptx?.futuro);
      const w=sameMonthPptx?Math.max(naturalW,MIN_BAR):Math.max(naturalW,naturalW<MIN_DISPLAY?MIN_DISPLAY:MIN_BAR);
      const xd=xa+w*frac;
      S.push(shape({x:xa,y:cy2,w:w,h:lBarH,fill:corL,round:50000}));
      if(f.fimRepactuado){const xbOrig=dX(f.fim);if(xbOrig!=null&&xbOrig<xb){S.push(shape({x:xbOrig-0.01,y:cy2,w:0.02,h:lBarH,fill:"F47B20"}));}}
      if(frac>0.01) S.push(shape({x:xa,y:cy2,w:w*frac,h:lBarH,fill:cor,round:50000}));
      const dataTexto = f.fimRepactuado ? ddmm(f.fim)+'→'+ddmm(f.fimRepactuado) : ddmm(fimEfetivo);
      if(naturalW>=MIN_BAR){
        S.push(shape({x:xa+0.03,y:cy2,w:Math.max(0.3,xd-xa),h:lBarH,text:`${f.pct||0}%`,textOpt:{sz:600,bold:true,color:frac>0.12?"FFFFFF":"1E293B",algn:"l",anchor:"ctr",wrap:"none"}}));
        S.push(shape({x:xa,y:cy2,w:w,h:lBarH,text:dataTexto,textOpt:{sz:600,bold:true,color:frac>=0.9?"FFFFFF":"1E293B",algn:"r",anchor:"ctr",wrap:"none"}}));
      } else {
        S.push(shape({x:xa,y:cy2,w:w,h:lBarH,text:`${f.pct||0}% ${dataTexto}`,textOpt:{sz:550,bold:true,color:"1E293B",algn:"ctr",anchor:"ctr",wrap:"none"}}));
      }
    });
  };

  if (!usaPacotes || !pacotes?.length) {
    let curY = bodyTop;
    raias.forEach(r => { const rh=calcRhPptx(r); renderRaiaRow(r, curY, rh); curY+=rh; });
  } else {
    let curY = bodyTop;
    pacotes.forEach(pac => {
      const pacRaias = pac.raiaIds.map(id => raias.find(r=>r.id===id)).filter(Boolean);
      const info = calcPacoteInfo(pac, pacRaias);
      const sCor = info.status==='Concluído'?'00B050':info.status==='Em Andamento'?'0070C0':info.status==='Atrasado'?'C00000':'94A3B8';
      const pacH = rowH;
      const ry = curY;
      [[0.14,0.67],[0.81,2.37],[3.18,1.0],[4.18,0.69]].forEach(([cx,cw])=>S.push(shape({x:cx,y:ry,w:cw,h:pacH,fill:"EEF4FF",line:GRID_LN})));
      cells.forEach(c=>{ const xa=fx(c.f0),xb=fx(c.f1); S.push(shape({x:xa,y:ry,w:xb-xa,h:pacH,fill:c.futuro?"EEF4FF":"F0F6FF",line:GRID_LN})); });
      S.push(shape({x:0.16,y:ry,w:0.64,h:pacH,text:"Pac",textOpt:{sz:800,bold:true,color:"2F5597",algn:"ctr",anchor:"ctr"}}));
      S.push(shape({x:0.86,y:ry,w:2.28,h:pacH,text:pac.nome,textOpt:{sz:900,bold:true,color:"1E3A6E",anchor:"ctr"}}));
      S.push(shape({x:3.18,y:ry,w:0.98,h:pacH,text:info.status,textOpt:{sz:650,bold:true,color:sCor,algn:"ctr",anchor:"ctr",wrap:"none"}}));
      S.push(shape({x:4.18,y:ry,w:0.68,h:pacH,text:ddmm(info.minInicio),textOpt:{sz:700,bold:true,color:"2F5597",algn:"ctr",anchor:"ctr",wrap:"none"}}));
      const xaPac=dX(info.minInicio), xbPac=dX(info.maxFim);
      if(xaPac!=null&&xbPac!=null&&xbPac>xaPac){
        const wPac=xbPac-xaPac; const frac=Math.max(0,Math.min(1,info.pctMedia/100));
        S.push(shape({x:xaPac,y:ry+(pacH-barH)/2,w:wPac,h:barH,fill:tintHex(sCor,0.7),round:50000}));
        if(frac>0.01) S.push(shape({x:xaPac,y:ry+(pacH-barH)/2,w:wPac*frac,h:barH,fill:sCor,round:50000}));
        S.push(shape({x:xaPac,y:ry+(pacH-barH)/2,w:wPac,h:barH,text:`${info.pctMedia}%  ${ddmm(info.maxFim)}`,textOpt:{sz:600,bold:true,color:frac>0.5?"FFFFFF":"1E293B",algn:"ctr",anchor:"ctr",wrap:"none"}}));
      }
      curY += pacH;
      pacRaias.forEach(r => { const rh=calcRhPptx(r); renderRaiaRow(r, curY, rh); curY+=rh; });
    });
  }

  // hoje
  const hojeX=dX(projeto.atualizadoEm);
  if(hojeX!=null){ S.push(dashLine({x:hojeX,y:hY,h:bodyBottom-hY,color:"ED7D31",w:0.02})); S.push(shape({x:hojeX-0.07,y:hY-0.14,w:0.14,h:0.14,prst:"diamond",fill:"ED7D31"})); }

  // pontos
  S.push(shape({x:0.1,y:6.0,w:3,h:0.26,text:"Pontos de Atenção",textOpt:{sz:1300,bold:true,color:"003B82"}}));
  S.push(shape({x:0.14,y:6.28,w:13.04,h:0.78,fill:"F2F2F2",line:{color:"CBD5E1",w:0.01},round:6000}));
  if(projeto.pontosAtencao) S.push(shape({x:0.3,y:6.34,w:12.7,h:0.66,text:projeto.pontosAtencao,textOpt:{sz:900,color:"1E293B",anchor:"t"}}));

  // rodapé
  S.push(shape({x:0.14,y:7.18,w:10,h:0.28,text:[{text:"Iniciado em: ",bold:1},{text:fmtBR(projeto.iniciadoEm)+"      "},{text:"Atualizado por: ",bold:1},{text:(projeto.atualizadoPor||"")+"   "},{text:"em: ",bold:1},{text:fmtBR(projeto.atualizadoEm)}],textOpt:{sz:900,color:"334155",anchor:"ctr"}}));
  S.push(shape({x:11.3,y:7.14,w:1.9,h:0.3,text:"Governança",textOpt:{sz:1200,bold:true,color:"003B82",algn:"r",anchor:"ctr"}}));

  return S.join("");
}
