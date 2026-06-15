import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ClipboardList, FileDown, Package, Plus, Save, Search } from "lucide-react";
import { ORDEM_FASES, STATUS_GERAL, buildTimeline, calcPacoteInfo, dateToFrac, defaultProjeto, statusCor } from "../../utils/reportCore";
import { GanttPreview, RaiaCard, Section, Field, baixarPptx } from "../../utils/reportWidgetsPptx";
import "./index.css";

export default function ReportScreen({
  projects,
  setProjects,
  currentIdx,
  setCurrentIdx,
  activeProjectIds,
  setActiveProjectIds,
  saved,
  gerando,
  setGerando,
  onBack,
  salvarManual,
}) {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mesInicio = Math.floor(hoje.getMonth() / 3) * 3 + 1;
  const trimVigente = Math.floor(hoje.getMonth() / 3) + 1;
  const qLabel = (offset) => {
    const abs = ano * 4 + (trimVigente - 1) + offset;
    const y = Math.floor(abs / 4), qi = ((abs % 4) + 4) % 4;
    return `${qi + 1}T/${y}`;
  };

  // projetos visíveis na tela 2 (filtrados se vier de "Atualizar agora" com seleção)
  const visibleProjects = useMemo(() =>
    activeProjectIds ? projects.filter(p => activeProjectIds.has(p.id)) : projects,
  [projects, activeProjectIds]);

  // currentIdx aponta dentro de visibleProjects; para editar, mapeia para índice real em projects
  const realIdx = useMemo(() => {
    const vp = visibleProjects[currentIdx];
    if (!vp) return 0;
    return projects.findIndex(p => p.id === vp.id);
  }, [visibleProjects, currentIdx, projects]);

  const [aberta, setAberta] = useState({});
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  useEffect(() => setAberta({}), [currentIdx]);

  useEffect(() => {
    if (!showProjectPicker) return;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setShowProjectPicker(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showProjectPicker]);

  const proj = projects[realIdx];
  const projeto = proj?.projeto || defaultProjeto();
  const raias = proj?.raias || [];
  const nFuturos = proj?.nFuturos ?? 1;
  const nPassados = proj?.nPassados ?? 0;
  const setNFuturos = (v) => setProjects(ps => ps.map((p,i) => i===realIdx ? {...p, nFuturos: typeof v==='function'?v(p.nFuturos??1):v} : p));
  const setNPassados = (v) => setProjects(ps => ps.map((p,i) => i===realIdx ? {...p, nPassados: typeof v==='function'?v(p.nPassados??0):v} : p));

  const setProjeto = (p) => setProjects(ps => ps.map((x, i) => i === realIdx ? { ...x, projeto: p } : x));
  const setRaias = (updater) => setProjects(ps => ps.map((x, i) => i === realIdx ? { ...x, raias: typeof updater === 'function' ? updater(x.raias) : updater } : x));
  const usaPacotes = proj?.usaPacotes ?? false;
  const pacotes    = proj?.pacotes ?? [];
  const setPacotes = (upd) => setProjects(ps => ps.map((p,i) => i===realIdx ? {...p, pacotes: typeof upd==='function'?upd(p.pacotes??[]):upd} : p));

  const togglePacotes = () => {
    if (usaPacotes) {
      setProjects(ps => ps.map((p,i) => i===realIdx ? {...p, usaPacotes:false} : p));
    } else {
      const pid = `pac-${Date.now()}`;
      setProjects(ps => ps.map((p,i) => i===realIdx ? {...p, usaPacotes:true, pacotes:[{id:pid, nome:'Pacote 1', raiaIds:raias.map(r=>r.id)}]} : p));
    }
  };
  const addPacote = () => {
    const pid = `pac-${Date.now()}`;
    setPacotes(ps => [...ps, {id:pid, nome:`Pacote ${ps.length+1}`, raiaIds:[]}]);
  };
  const delPacote = (pid) => setPacotes(ps => ps.filter(p => p.id !== pid));
  const renomearPacote = (pid, nome) => setPacotes(ps => ps.map(p => p.id===pid ? {...p,nome} : p));

  const upd = (id, patch) => setRaias(rs => rs.map(r => r.id === id ? { ...r, ...patch } : r));
  const updFase = (id, fi, patch) => setRaias(rs => rs.map(r => r.id === id ? { ...r, fases: r.fases.map((f, i) => i === fi ? { ...f, ...patch } : f) } : r));
  const addRaia = () => {
    const id = Date.now();
    setRaias(rs => [...rs, { id, lecom: '', nome: 'NOVA DEMANDA', despriorizado: false, faseAtivaIdx: 0, fases: [{ fase: ORDEM_FASES[0], inicio: '', fim: '', pct: 0 }] }]);
    setAberta(a => ({ ...a, [id]: true }));
  };
  const addRaiaToPacote = (pid) => {
    const id = Date.now();
    setRaias(rs => [...rs, { id, lecom:'', nome:'NOVA DEMANDA', despriorizado:false, faseAtivaIdx:0, fases:[{fase:ORDEM_FASES[0],inicio:'',fim:'',pct:0}] }]);
    setPacotes(ps => ps.map(p => p.id===pid ? {...p, raiaIds:[...p.raiaIds, id]} : p));
    setAberta(a => ({ ...a, [id]: true }));
  };
  const delRaia = (id) => {
    setRaias(rs => rs.filter(r => r.id !== id));
    setPacotes(ps => ps.map(p => ({...p, raiaIds: p.raiaIds.filter(rid => rid !== id)})));
  };
  const addFase = (id) => setRaias(rs => rs.map(r => r.id === id ? { ...r, fases: [...r.fases, { fase: ORDEM_FASES[Math.min(r.fases.length, ORDEM_FASES.length - 1)], inicio: '', fim: '', pct: 0 }] } : r));
  const delFase = (id, fi) => setRaias(rs => rs.map(r => r.id === id ? { ...r, fases: r.fases.filter((_, i) => i !== fi) } : r));

  const timeline = useMemo(() => buildTimeline(ano, mesInicio, nFuturos, nPassados), [ano, mesInicio, nFuturos, nPassados]);
  const hojeFrac = dateToFrac(projeto.atualizadoEm, timeline.cells);

  const meses = [];
  timeline.cells.forEach((c) => {
    const last = meses[meses.length - 1];
    const key = c.futuro ? c.label : c.mesLabel;
    if (last && last.key === key && !c.futuro) last.span += 1;
    else meses.push({ key, label: c.futuro ? "" : c.mesLabel, span: 1, futuro: c.futuro });
  });

  const gerarPptx = async () => {
    setGerando(true);
    try {
      await new Promise(r => setTimeout(r, 20));
      baixarPptx(visibleProjects);
    } catch (e) { console.error(e); alert("Erro ao gerar o PPTX: " + e.message); }
    setGerando(false);
  };

  return (
    <div className="report-screen" style={{ fontFamily: "'Archivo', sans-serif", background: "rgb(241, 245, 249)", minHeight: "100vh", color: "#0f172a" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,700&display=swap');
        input,select,textarea{font-family:'Archivo',sans-serif;}
        .inp{width:100%;padding:7px 9px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;background:#fff;outline:none;}
        .inp:focus{border-color:#2F5597;box-shadow:0 0 0 3px rgba(47,85,151,.12);}
        .btn{display:inline-flex;align-items:center;gap:6px;border:none;border-radius:9px;padding:8px 13px;font-size:13px;font-weight:600;cursor:pointer;}
        .lbl{font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.04em;}
        @media (max-width: 760px){
          .report-header{padding:12px !important;flex-direction:column;align-items:flex-start !important;}
          .report-header-actions{width:100%;flex-wrap:wrap;}
          .report-header-actions > *{flex:1 1 auto;justify-content:center;}
          .report-nav{padding:10px 12px !important;flex-wrap:wrap;}
          .report-project-label{flex-basis:100%;order:3;}
          .report-content{padding:16px 12px !important;}
          .project-header-grid{grid-template-columns:1fr !important;}
          .timeline-controls{gap:12px !important;}
          .raias-header{flex-direction:column;align-items:stretch !important;}
          .raias-header-actions{width:100%;flex-wrap:wrap;}
          .raias-header-actions > *{flex:1 1 auto;justify-content:center;}
          .package-header{flex-wrap:wrap;}
          .package-header-actions{width:100%;flex-wrap:wrap;}
          .package-header-actions > *{flex:1 1 auto;justify-content:center;}
          .gantt-scroll{overflow-x:auto;padding-bottom:4px;}
          .gantt-scroll > *{min-width:980px;}
          .raia-card-header{flex-direction:column;align-items:stretch !important;padding:12px !important;}
          .raia-card-toggle{align-self:flex-start;}
          .raia-card-main-input,
          .raia-card-header .inp{width:100% !important;}
          .raia-card-select-group,
          .raia-card-checkbox-group{width:100%;justify-content:space-between;}
          .raia-card-delete{align-self:flex-end;}
          .raia-card-body{padding:0 12px 12px !important;}
          .raia-phase-header{display:none !important;}
          .raia-phase-row{display:flex !important;flex-direction:column;gap:8px !important;padding:10px;border:1px solid #E2E8F0;border-radius:10px;background:#fff;}
          .raia-phase-field{width:100%;}
          .raia-phase-field label{display:block !important;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px;}
          .raia-phase-inline-toggle{justify-content:flex-start !important;}
          .raia-phase-slider{width:100%;}
          .raia-despri-body{padding:0 12px 12px !important;flex-direction:column;align-items:stretch !important;}
        }
      `}</style>

      {/* Header */}
      <div className="report-header" style={{
        background: "linear-gradient(128deg, #003B82 0%, #1D4E89 62%, #2F5597 100%)",
        color: "#fff",
        padding: "16px 22px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 10,
        borderRadius: "14px 14px 0 0",
        boxShadow: "0 10px 30px rgba(0,59,130,.22)",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* <span style={{ position:"absolute", width:170, height:170, borderRadius:"50%", background:"rgba(255,255,255,.08)", top:-100, right:-50, pointerEvents:"none" }} />
        <span style={{ position:"absolute", width:110, height:110, borderRadius:"50%", background:"rgba(255,255,255,.12)", bottom:-65, right:120, pointerEvents:"none" }} /> */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* <button className="btn" onClick={onBack} style={{ background: "rgba(255,255,255,.15)", color: "#fff", padding:"6px 12px" }}><ChevronLeft size={15} />Portfólio</button> */}
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700 }}>Marcos e Cronogramas</div>
        </div>
        <div className="report-header-actions" style={{ display: "flex", gap: 9, alignItems: "center" }}>
          <span style={{ fontSize: 11.5, color: "#fff", opacity: saved ? 1 : 0.4, transition: "opacity .3s", display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: saved ? "#4ade80" : "rgba(255,255,255,.5)" }} />
            {saved ? "Salvo ✓" : "auto-save ativo"}
          </span>
          <button className="btn" onClick={salvarManual} style={{ background: "#fff", color: "#003B82" }}><Save size={15} />Salvar</button>
          <button className="btn" onClick={gerarPptx} disabled={gerando} style={{ background: "#F47B20", color: "#fff", opacity: gerando ? .65 : 1 }}>
            <FileDown size={15} />{gerando ? "Gerando…" : `Gerar PPTX (${visibleProjects.length} slide${visibleProjects.length>1?'s':''})`}
          </button>
        </div>
      </div>

      {/* Navegação entre projetos */}
      {visibleProjects.length > 0 && (
        <div className="report-nav" style={{
          background: "linear-gradient(128deg, #003B82 0%, #1D4E89 62%, #2F5597 100%)",
          color: "#fff",
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginTop: "0",
          borderRadius: "0 0 14px 14px",
          border: "1px solid rgba(255,255,255,.22)",
          borderTop: "1px solid rgba(255,255,255,.12)",
          boxShadow: "0 8px 24px rgba(47,85,151,.25)",
          position: "relative",
          zIndex: 2,
        }}>
          <button className="btn" onClick={() => setCurrentIdx(i => Math.max(0,i-1))} disabled={currentIdx===0}
            style={{ background:"rgba(255,255,255,.2)", color:"#fff", opacity:currentIdx===0?.4:1, padding:"5px 10px" }}><ChevronLeft size={15}/></button>
          <span className="report-project-label" style={{ flex:1, fontWeight:600, fontSize:13 }}>
            Projeto {currentIdx+1} de {visibleProjects.length} — {projeto.nome || '(sem nome)'}
            {activeProjectIds && <span style={{ marginLeft:10, fontSize:11, background:"rgba(255,255,255,.2)", borderRadius:8, padding:"2px 8px" }}><ClipboardList size={12} style={{marginRight:3}}/>{visibleProjects.length} selecionado{visibleProjects.length!==1?'s':''} • <button onClick={()=>setActiveProjectIds(null)} style={{ background:"none", border:"none", color:"#fff", cursor:"pointer", fontSize:11, textDecoration:"underline", padding:0 }}>ver todos ({projects.length})</button></span>}
          </span>
          <button
            className="btn"
            onClick={() => setShowProjectPicker(true)}
            style={{ background: "rgba(255,255,255,.2)", color: "#fff", padding: "5px 10px", whiteSpace: "nowrap" }}
          >
            <Search size={14} />
            Selecionar projeto
          </button>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {visibleProjects.map((_,i) => (
              <button key={i} onClick={()=>setCurrentIdx(i)} style={{ border:"none", borderRadius:6, padding:"3px 9px", fontSize:12, fontWeight:700, cursor:"pointer", background: i===currentIdx?"#fff":"rgba(255,255,255,.25)", color: i===currentIdx?"#2F5597":"#fff" }}>{i+1}</button>
            ))}
          </div>
          <button className="btn" onClick={() => setCurrentIdx(i => Math.min(visibleProjects.length-1,i+1))} disabled={currentIdx===visibleProjects.length-1}
            style={{ background:"rgba(255,255,255,.2)", color:"#fff", opacity:currentIdx===visibleProjects.length-1?.4:1, padding:"5px 10px" }}><ChevronRight size={15}/></button>
        </div>
      )}

      {showProjectPicker && (
        <div
          onClick={() => setShowProjectPicker(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(560px, 100%)",
              maxHeight: "80vh",
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 20px 45px rgba(15,23,42,.25)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1E293B" }}>Selecionar projeto</div>
              <button
                onClick={() => setShowProjectPicker(false)}
                style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 20, lineHeight: 1 }}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <div style={{ padding: 12, overflowY: "auto" }}>
              {visibleProjects.map((p, i) => (
                <button
                  key={p.id || i}
                  onClick={() => {
                    setCurrentIdx(i);
                    setShowProjectPicker(false);
                  }}
                  style={{
                    width: "100%",
                    border: i === currentIdx ? "1px solid #2F5597" : "1px solid #E2E8F0",
                    background: i === currentIdx ? "#EFF6FF" : "#fff",
                    borderRadius: 8,
                    padding: "10px 12px",
                    marginBottom: 8,
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span style={{ minWidth: 26, fontSize: 12, fontWeight: 700, color: "#475569" }}>{i + 1}.</span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A", flex: 1 }}>{p.projeto?.nome || '(sem nome)'}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="report-content" style={{
        zoom: 1.1,
        padding: "24px 20px 20px",
        marginTop: "8px",
        background: "rgba(255,255,255,.58)",
        border: "1px solid #d7e3f3",
        borderRadius: "16px",
        backdropFilter: "blur(3px)",
      }}>

        {/* ---------- CABEÇALHO DO PROJETO ---------- */}
        <Section title="Cabeçalho do projeto">
          <div className="project-header-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
            <Field label="Nome do projeto"><input className="inp" value={projeto.nome} onChange={(e) => setProjeto({ ...projeto, nome: e.target.value })} /></Field>
            <Field label="SM/PMO"><input className="inp" value={projeto.smPmo||''} onChange={(e) => setProjeto({ ...projeto, smPmo: e.target.value })} /></Field>
            <Field label="Status geral">
              <select className="inp" value={projeto.statusGeral} onChange={(e) => setProjeto({ ...projeto, statusGeral: e.target.value })}>
                {Object.keys(STATUS_GERAL).map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Atualizado por"><input className="inp" value={projeto.atualizadoPor} onChange={(e) => setProjeto({ ...projeto, atualizadoPor: e.target.value })} /></Field>
            <Field label="Iniciado em"><input type="date" className="inp" value={projeto.iniciadoEm} onChange={(e) => setProjeto({ ...projeto, iniciadoEm: e.target.value })} /></Field>
            <Field label="Atualizado em"><input type="date" className="inp" value={projeto.atualizadoEm} onChange={(e) => setProjeto({ ...projeto, atualizadoEm: e.target.value })} /></Field>
            <Field label="Lecom"><input className="inp" value={projeto.resumoLecom} onChange={(e) => setProjeto({ ...projeto, resumoLecom: e.target.value })} /></Field>
            <Field label="Descrição (resumo)"><input className="inp" value={projeto.resumoDesc} onChange={(e) => setProjeto({ ...projeto, resumoDesc: e.target.value })} /></Field>
            <Field label="Área Cliente"><input className="inp" value={projeto.areaCliente} onChange={(e) => setProjeto({ ...projeto, areaCliente: e.target.value })} /></Field>
            <Field label="Diretor (cliente)"><input className="inp" value={projeto.dirCliente} onChange={(e) => setProjeto({ ...projeto, dirCliente: e.target.value })} /></Field>
            <Field label="Líder (cliente)"><input className="inp" value={projeto.lidCliente} onChange={(e) => setProjeto({ ...projeto, lidCliente: e.target.value })} /></Field>
            <div />
            <Field label="Área Executora"><input className="inp" value={projeto.areaExec} onChange={(e) => setProjeto({ ...projeto, areaExec: e.target.value })} /></Field>
            <Field label="Diretor (executor)"><input className="inp" value={projeto.dirExec} onChange={(e) => setProjeto({ ...projeto, dirExec: e.target.value })} /></Field>
            <Field label="Líder (executor)"><input className="inp" value={projeto.lidExec} onChange={(e) => setProjeto({ ...projeto, lidExec: e.target.value })} /></Field>
          </div>
        </Section>

        {/* ---------- PREVIEW ---------- */}
        <div className="gantt-scroll">
          <GanttPreview projeto={projeto} raias={raias} timeline={timeline} hojeFrac={hojeFrac} usaPacotes={usaPacotes} pacotes={pacotes} />
        </div>

        {/* ---------- TIMELINE CONFIG ---------- */}
        <Section title="Linha do tempo">
          <p style={{ fontSize: 12.5, color: "#475569", margin: "0 0 12px" }}>
            O trimestre vigente é definido automaticamente pelo calendário. Escolha quantos trimestres anteriores e futuros incluir.
          </p>
          <div className="timeline-controls" style={{ display: "flex", gap: 16, alignItems: "end", flexWrap: "wrap" }}>
            <div>
              <div className="lbl" style={{ marginBottom: 4 }}>Trimestre vigente (automático)</div>
              <div style={{ padding: "7px 12px", background: "#2F5597", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 700, display: "inline-block" }}>{qLabel(0)}</div>
            </div>
            <Field label="Trimestres anteriores">
              <select className="inp" style={{ width: 80 }} value={nPassados} onChange={(e) => setNPassados(+e.target.value)}>
                {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
            <Field label="Trimestres futuros">
              <select className="inp" style={{ width: 80 }} value={nFuturos} onChange={(e) => setNFuturos(+e.target.value)}>
                {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ marginTop: 12, fontSize: 12.5, color: "#334155" }}>
            <span style={{ fontWeight: 600 }}>Aparecerão: </span>
            {(() => {
              const v = [];
              for (let i = nPassados; i >= 1; i--) v.push(qLabel(-i));
              v.push(qLabel(0) + " (vigente)");
              for (let i = 1; i <= nFuturos; i++) v.push(qLabel(i));
              return v.join("  ·  ");
            })()}
          </div>
        </Section>

        {/* ---------- PONTOS DE ATENÇÃO (logo após a Linha do tempo) ---------- */}
        <Section title="Pontos de atenção">
          <textarea className="inp" rows={3} value={projeto.pontosAtencao} onChange={(e) => setProjeto({ ...projeto, pontosAtencao: e.target.value })} placeholder="Riscos, bloqueios, decisões pendentes…" />
        </Section>

        {/* ---------- RAIAS ---------- */}
        <div style={{ background: "#fff", borderRadius: 12, padding: "16px 18px", marginTop: 16, boxShadow: "0 1px 2px rgba(0,0,0,.05)" }}>
          <div className="raias-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 8 }}>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: "#003B82", margin: 0 }}>Demandas / Marcos ({raias.length})</h2>
            <div className="raias-header-actions" style={{ display:"flex", gap:8, flexWrap:'wrap' }}>
              <button className="btn" onClick={togglePacotes}
                style={{ background: usaPacotes ? "#7030A0" : "#F1F5F9", color: usaPacotes ? "#fff" : "#334155", border: usaPacotes ? "none" : "1px solid #CBD5E1" }}>
                {usaPacotes ? <><Package size={14}/> Remover pacotes</> : <><Package size={14}/> Quebrar em pacotes</>}
              </button>
              {!usaPacotes && <button className="btn" onClick={addRaia} style={{ background: "#003B82", color: "#fff" }}><Plus size={15} />Adicionar demanda</button>}
              {usaPacotes  && <button className="btn" onClick={addPacote} style={{ background: "#003B82", color: "#fff" }}><Plus size={15} />Adicionar pacote</button>}
            </div>
          </div>

          {/* ── Modo flat (sem pacotes) ── */}
          {!usaPacotes && raias.map((r) => (
            <RaiaCard key={r.id} r={r} aberta={!!aberta[r.id]}
              toggle={() => setAberta((a) => ({ ...a, [r.id]: !a[r.id] }))}
              upd={upd} updFase={updFase} addFase={addFase} delFase={delFase} delRaia={delRaia} />
          ))}

          {/* ── Modo pacotes ── */}
          {usaPacotes && pacotes.map((pac, pi) => {
            const pacRaias = pac.raiaIds.map(id => raias.find(r => r.id === id)).filter(Boolean);
            const info = calcPacoteInfo(pac, pacRaias);
            const sCor = statusCor(info.status);
            return (
              <div key={pac.id} style={{ marginBottom: 16, border: "1.5px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
                {/* cabeçalho do pacote */}
                <div className="package-header" style={{ background: "#F8FAFF", borderBottom: "1.5px solid #E2E8F0", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <Package size={18} color="#2F5597"/>
                  <input className="inp" style={{ flex:1, fontWeight:700, fontSize:14, background:"transparent", border:"none", boxShadow:"none", padding:"2px 4px" }}
                    value={pac.nome} onChange={e => renomearPacote(pac.id, e.target.value)} />
                  <div className="package-header-actions" style={{ display:"flex", gap:10, alignItems:"center", flexShrink:0 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:sCor }}>{info.status}</span>
                    <span style={{ fontSize:12, color:"#64748B" }}>{info.pctMedia}% concluído</span>
                    <span style={{ fontSize:11, color:"#94A3B8" }}>{pacRaias.length} demanda{pacRaias.length!==1?'s':''}</span>
                    <button className="btn" onClick={() => addRaiaToPacote(pac.id)} style={{ background:"#003B82", color:"#fff", fontSize:12, padding:"5px 10px" }}><Plus size={13}/>Demanda</button>
                    <button onClick={() => delPacote(pac.id)} title="Remover pacote" style={{ background:"none", border:"none", cursor:"pointer", color:"#ef4444", fontSize:16 }}>✕</button>
                  </div>
                </div>
                {/* demandas do pacote */}
                <div style={{ padding:"8px 8px 4px" }}>
                  {pacRaias.length === 0 && (
                    <div style={{ textAlign:"center", padding:"18px 0", fontSize:13, color:"#94A3B8" }}>Nenhuma demanda neste pacote</div>
                  )}
                  {pacRaias.map(r => (
                    <RaiaCard key={r.id} r={r} aberta={!!aberta[r.id]}
                      toggle={() => setAberta(a => ({...a, [r.id]: !a[r.id]}))}
                      upd={upd} updFase={updFase} addFase={addFase} delFase={delFase} delRaia={delRaia} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
