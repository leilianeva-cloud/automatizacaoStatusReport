import React, { useMemo, useRef, useState } from "react";
import { ChevronRight, ClipboardList, Download, Edit2, FolderOpen, Plus, Search, Upload, Zap } from "lucide-react";
import api from "../../services/api";
import { COL, defaultProjeto, makeProjetoFromRow } from "../../utils/reportCore";
import "./index.css";

export default function ImportScreen({ portfolioRows, onImport, existingProjects, onStart, onContinue, onGenerate, onRemoveProjects, importedAt }) {
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [expanded, setExpanded] = useState(null); // 'selecionar' | 'manual' | 'gerar' | 'atualizar'
  const [filters, setFilters] = useState({ sm:'', trimestre:'', compromisso:'', tipo:'todos' }); // tipo: 'todos'|'importados'|'manuais'
  const [selected, setSelected] = useState(new Set());
  // projetos manuais (fora do portfólio)
  const [manualProjects, setManualProjects] = useState([]);
  const [manualForm, setManualForm] = useState({ nome:'', smPmo:'', resumoLecom:'', areaCliente:'', areaExec:'' });
  // seleção para Gerar Report
  const [gerarSelected, setGerarSelected] = useState(new Set());
  // seleção para Atualizar Report
  const [atualizarSelected, setAtualizarSelected] = useState(new Set());

  const handleFile = (e) => { const f = e.target.files?.[0]; if (!f) return; processFile(f); };
  const processFile = async (f) => {
    setLoading(true);
    try {
      // Envia o arquivo para o server parsear
      const formData = new FormData();
      formData.append('file', f);
      const rows = await api.uploadPortfolio(formData);
      const now = new Date();
      const importedAt = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
      onImport(rows, importedAt);
      // Persiste o portfólio no DB
      api.savePortfolio(rows, importedAt).catch(err => console.warn('savePortfolio:', err));
    } catch (err) {
      alert('Erro ao processar o arquivo: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };
  const onDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) processFile(f);
  };

  const isValid = (r) => {
    if (!r[COL.NOME]) return false;
    const st = String(r[COL.STATUS]||'').toLowerCase();
    if (st.includes('cancelado') || st.includes('suspenso')) return false;
    if (r[COL.DESPRI] && String(r[COL.DESPRI]).trim() !== '') return false;
    return true;
  };
  const validRows  = useMemo(() => portfolioRows.filter(isValid), [portfolioRows]);
  const smOpts     = useMemo(() => [...new Set(validRows.map(r=>String(r[COL.SM]||'').trim()).filter(Boolean))].sort(), [validRows]);
  const trOpts     = useMemo(() => [...new Set(validRows.map(r=>String(r[COL.TRIMESTRE]||'').trim()).filter(Boolean))].sort(), [validRows]);
  const coOpts     = useMemo(() => [...new Set(validRows.map(r=>String(r[COL.COMPROMISSO]||'').trim()).filter(Boolean))].sort(), [validRows]);
  const filtered   = useMemo(() => validRows.filter(r => {
    if (filters.sm && String(r[COL.SM]||'').trim() !== filters.sm) return false;
    if (filters.trimestre && String(r[COL.TRIMESTRE]||'').trim() !== filters.trimestre) return false;
    if (filters.compromisso && String(r[COL.COMPROMISSO]||'').trim() !== filters.compromisso) return false;
    return true;
  }), [validRows, filters]);
  const rKey      = (r, i) => `${r[COL.ID]||''}:${i}`;
  const manualKey = (m) => `manual:${m.id}`;

  // lista combinada: portfólio filtrado + projetos manuais, com filtro de tipo
  const allSelectable = useMemo(() => {
    const portfolio = filtered.map((r,i) => ({ type:'portfolio', key:rKey(r,i), nome:String(r[COL.NOME]||'').trim(), id:r[COL.ID]||'', trimestre:String(r[COL.TRIMESTRE]||''), compromisso:String(r[COL.COMPROMISSO]||''), row:r }));
    const manuais   = manualProjects.map(m => ({ type:'manual', key:manualKey(m), nome:m.nome, id:m.id, trimestre:'—', compromisso:'Manual', manual:m }));
    if (filters.tipo === 'importados') return portfolio;
    if (filters.tipo === 'manuais')    return manuais;
    return [...portfolio, ...manuais];
  }, [filtered, manualProjects, filters.tipo]);

  const toggleAll = () => { if (selected.size===allSelectable.length) setSelected(new Set()); else setSelected(new Set(allSelectable.map(x=>x.key))); };
  const toggle    = (k) => setSelected(s=>{ const ns=new Set(s); ns.has(k)?ns.delete(k):ns.add(k); return ns; });

  // helpers para Atualizar Report
  const toggleAtualizar    = (id) => setAtualizarSelected(s=>{ const ns=new Set(s); ns.has(id)?ns.delete(id):ns.add(id); return ns; });
  const toggleAtualizarAll = () => { if (atualizarSelected.size===existingProjects.length) setAtualizarSelected(new Set()); else setAtualizarSelected(new Set(existingProjects.map(p=>p.id))); };
  const handleAtualizarDoPainel = () => {
    if (!atualizarSelected.size) return;
    onContinue([...atualizarSelected]);
  };

  const handleRemoverSelecionados = async () => {
    if (!atualizarSelected.size) return;
    if (!window.confirm(`Remover ${atualizarSelected.size} projeto(s) da lista?`)) return;
    try {
      await onRemoveProjects?.([...atualizarSelected]);
      setAtualizarSelected(new Set());
    } catch (err) {
      alert('Erro ao remover projetos: ' + (err.response?.data?.error || err.message));
    }
  };

  // salvar projeto manual
  const saveManual = () => {
    if (!manualForm.nome.trim()) return;
    setManualProjects(ms => [...ms, { ...manualForm, id:`m-${Date.now()}` }]);
    setManualForm({ nome:'', smPmo:'', resumoLecom:'', areaCliente:'', areaExec:'' });
  };
  const removeManual = (id) => setManualProjects(ms => ms.filter(m=>m.id!==id));

  // "Selecionar para atualizar": salva projetos sem navegar
  const handleSelecionarParaAtualizar = () => {
    const selItems = allSelectable.filter(x=>selected.has(x.key));
    if (!selItems.length) return;
    const existing = Object.fromEntries(existingProjects.map(p=>[p.id,p]));
    const novos = selItems.map(x => {
      if (x.type === 'manual') {
        const id = x.key;
        return { id, nFuturos:existing[id]?.nFuturos??1, nPassados:existing[id]?.nPassados??0,
          projeto:{ ...defaultProjeto(), nome:x.manual.nome, smPmo:x.manual.smPmo||'', resumoLecom:x.manual.resumoLecom||'', areaCliente:x.manual.areaCliente||'', areaExec:x.manual.areaExec||'' },
          raias: existing[id]?.raias||[] };
      }
      const id = rKey(x.row, filtered.indexOf(x.row));
      return { id, nFuturos:existing[id]?.nFuturos??1, nPassados:existing[id]?.nPassados??0,
        projeto:makeProjetoFromRow(x.row), raias:existing[id]?.raias||[] };
    });
    const novosIds = new Set(novos.map(p=>p.id));
    const mantidos = existingProjects.filter(p=>!novosIds.has(p.id));
    onStart([...mantidos, ...novos], false); // false = não navegar
  };

  // "Atualizar agora": salva e navega para tela 2 mostrando apenas os selecionados
  const handleAtualizarAgora = () => {
    const selItems = allSelectable.filter(x=>selected.has(x.key));
    if (!selItems.length) return;
    const existing = Object.fromEntries(existingProjects.map(p=>[p.id,p]));
    const novos = selItems.map(x => {
      if (x.type === 'manual') {
        const id = x.key;
        return { id, nFuturos:existing[id]?.nFuturos??1, nPassados:existing[id]?.nPassados??0,
          projeto:{ ...defaultProjeto(), nome:x.manual.nome, smPmo:x.manual.smPmo||'', resumoLecom:x.manual.resumoLecom||'', areaCliente:x.manual.areaCliente||'', areaExec:x.manual.areaExec||'' },
          raias: existing[id]?.raias||[] };
      }
      const id = rKey(x.row, filtered.indexOf(x.row));
      return { id, nFuturos:existing[id]?.nFuturos??1, nPassados:existing[id]?.nPassados??0,
        projeto:makeProjetoFromRow(x.row), raias:existing[id]?.raias||[] };
    });
    const novosIds = new Set(novos.map(p=>p.id));
    const mantidos = existingProjects.filter(p=>!novosIds.has(p.id));
    const merged = [...mantidos, ...novos];
    onStart(merged, false); // salva sem navegar
    onContinue(novos.map(p=>p.id)); // navega mostrando só os recém-selecionados
  };

  // seleção para Gerar Report
  const toggleGerar = (id) => setGerarSelected(s=>{ const ns=new Set(s); ns.has(id)?ns.delete(id):ns.add(id); return ns; });
  const toggleGerarAll = () => { if (gerarSelected.size===existingProjects.length) setGerarSelected(new Set()); else setGerarSelected(new Set(existingProjects.map(p=>p.id))); };
  const handleGerar = () => {
    const toGen = existingProjects.filter(p=>gerarSelected.has(p.id));
    if (!toGen.length) return;
    onGenerate(toGen);
    setExpanded(null);
  };

  const hasPortfolio = portfolioRows.length > 0;
  const hasProjects  = existingProjects.length > 0;

  // ---- ícone Excel mini ----
  const ExcelIcon = ({size=28, op=1}) => (
    <svg width={size} height={size} viewBox="0 0 30 30" fill="none">
      <rect width="30" height="30" rx="5" fill={`rgba(29,111,66,${op})`}/>
      <text x="15" y="21" textAnchor="middle" fill="#fff" fontFamily="Arial" fontWeight="bold" fontSize="15">X</text>
    </svg>
  );

  return (
    <div className="import-screen" style={{ fontFamily:"'Archivo',sans-serif", background:"rgb(241, 245, 249)", minHeight:"100vh", color:"#0f172a", fontSize:"125%" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,700&display=swap');
        input,select{font-family:'Archivo',sans-serif;}
        .inp{width:100%;padding:7px 9px;border:1px solid #cbd5e1;border-radius:8px;font-size:12px;background:#fff;outline:none;}
        .inp:focus{border-color:#2F5597;box-shadow:0 0 0 3px rgba(47,85,151,.12);}
        .btn{display:inline-flex;align-items:center;gap:6px;border:none;border-radius:9px;padding:8px 13px;font-size:12px;font-weight:600;cursor:pointer;}
        .lbl{font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px;}
        .acard{transition:transform .14s,box-shadow .14s;}
        .acard:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.11)!important;}
        @media (max-width: 760px){
          .import-header{padding:14px 12px !important;flex-direction:column;align-items:flex-start !important;}
          .import-content{padding:16px 12px !important;}
          .import-top-row{flex-direction:column;}
          .import-upload-card{flex:1 1 auto !important;width:100%;}
          .import-actions-grid{flex-direction:column;flex-wrap:nowrap !important;}
          .import-actions-grid > *{flex:none !important;min-width:0 !important;width:100%;}
          .acard{padding:16px !important;}
          .manual-form-grid{grid-template-columns:1fr !important;}
          .manual-full-span{grid-column:auto !important;}
          .panel-toolbar{flex-direction:column;align-items:stretch !important;}
          .panel-toolbar-actions{width:100%;justify-content:stretch;}
          .panel-toolbar-actions > *{flex:1;justify-content:center;}
        }
      `}</style>

      {/* Header */}
      <div className="import-header" style={{
        background:"linear-gradient(128deg, #003B82 0%, #1D4E89 62%, #2F5597 100%)",
        color:"#fff",
        padding:"18px 24px",
        display:"flex",
        alignItems:"center",
        justifyContent:"space-between",
        gap:12,
        borderRadius:"14px 14px 16px 16px",
        boxShadow:"0 10px 30px rgba(0,59,130,.22)",
        position:"relative",
        overflow:"hidden"
      }}>
        <div>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:700 }}>Portfólio</div>
          <div style={{ fontSize:15, opacity:.72, marginTop:2 }}>Otimização do fluxo de atualização do Status Report</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {hasProjects && (
            <div style={{ display:'flex', alignItems:'center', gap:7, background:'rgba(255,255,255,.13)', borderRadius:8, padding:'6px 14px', fontSize:15.625 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:'#4ade80', flexShrink:0 }} />
              {existingProjects.length} projeto{existingProjects.length!==1?'s':''} salvos
            </div>
          )}
        </div>
      </div>

      <div className="import-content" style={{
        zoom: 1.1,
        padding:"24px 22px 22px",
        marginTop:"8px",
        background:"rgba(255,255,255,.58)",
        border:"1px solid #d7e3f3",
        borderRadius:"16px",
        backdropFilter:"blur(3px)"
      }}>

        {/* ── Row: Box 1 + Box 2 lado a lado ── */}
        <div className="import-top-row" style={{ display:"flex", gap:12, marginBottom:12, alignItems:"stretch" }}>

          {/* Box 1: Importar Portfólio */}
          <div className="import-upload-card" style={{ flex:"0 0 420px", background:"#fff", borderRadius:14, padding:"20px 24px", boxShadow:"0 1px 4px rgba(0,0,0,.08)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:9, borderBottom:"1px solid #E2E8F0", paddingBottom:13, marginBottom:16 }}>
            <Upload size={16} color="#2F5597" />
            <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:15, fontWeight:700, color:"#1E293B", margin:0 }}>Importar Portfólio</h2>
          </div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} style={{ display:"none" }} />
          {!hasPortfolio ? (
            <div onClick={()=>fileRef.current?.click()}
              onDragOver={e=>{e.preventDefault();setDragging(true);}}
              onDragLeave={()=>setDragging(false)} onDrop={onDrop}
              style={{ border:`2px dashed ${dragging?"#2F5597":"#CBD5E1"}`, borderRadius:12,
                background:dragging?"#EFF6FF":"#F8FAFC", padding:"34px 20px",
                display:"flex", flexDirection:"column", alignItems:"center", gap:7,
                cursor:"pointer", transition:"all .18s" }}>
              <div style={{ width:50, height:50, borderRadius:"50%", background:"#fff", boxShadow:"0 2px 8px rgba(0,0,0,.10)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:2 }}>
                <ExcelIcon size={27} />
              </div>
              <div style={{ fontSize:14, fontWeight:700, color:"#1E293B" }}>{loading?"Carregando…":"Arraste seu arquivo aqui"}</div>
              <div style={{ fontSize:12, color:"#64748B", textAlign:"center" }}>ou clique para selecionar um arquivo Excel (.xlsx, .xls)</div>
              <button className="btn" style={{ marginTop:3, background:"#2F5597", color:"#fff", fontSize:13, padding:"8px 20px", pointerEvents:"none" }}>
                <Upload size={14} />Selecionar Arquivo
              </button>
            </div>
          ) : (
            <div style={{ display:"flex", alignItems:"center", gap:12, background:"#F0FDF4", border:"1px solid #86EFAC", borderRadius:10, padding:"11px 16px" }}>
              <div style={{ width:36, height:36, borderRadius:8, background:"#16A34A", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <ExcelIcon size={20} op={0.3} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12.5, fontWeight:700, color:"#15803D" }}>✓ Portfólio carregado</div>
                <div style={{ fontSize:11.5, color:"#16A34A", marginTop:1 }}>{portfolioRows.length} linhas importadas</div>
              </div>
              <button onClick={e=>{e.stopPropagation();fileRef.current?.click();}} className="btn"
                style={{ background:"#fff", color:"#15803D", border:"1px solid #86EFAC", fontSize:12, padding:"5px 12px" }}>
                Trocar arquivo
              </button>
            </div>
          )}
          </div>

          {/* Box 2: Portfólio Ativo */}
          <div style={{ flex:1, background:hasPortfolio?"#fff":"#F8FAFC", borderRadius:14, padding:"20px 24px",
            border:hasPortfolio?"1px solid #E2E8F0":"1px dashed #CBD5E1",
            boxShadow:hasPortfolio?"0 1px 4px rgba(0,0,0,.07)":"none",
            display:"flex", flexDirection:"column", justifyContent:"center", gap:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:hasPortfolio?"#EFF6FF":"#F1F5F9", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              {hasPortfolio ? <ClipboardList size={20} color="#2F5597"/> : <FolderOpen size={20} color="#94A3B8"/>}
            </div>
            <div>
              <div style={{ fontSize:10.5, fontWeight:600, color:"#94A3B8", textTransform:"uppercase", letterSpacing:".05em", marginBottom:1 }}>Portfólio Ativo</div>
              <div style={{ fontSize:14, fontWeight:700, color:hasPortfolio?"#1E293B":"#94A3B8" }}>
                {hasPortfolio?`${validRows.length} projeto${validRows.length!==1?'s':''} prontos para seleção`:"Nenhum portfólio importado"}
              </div>
            </div>
          </div>
          {hasPortfolio && (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[
                { label:"Disponíveis para report", value:validRows.length, unit:"projetos", color:"#2F5597" },
                ...(importedAt?[{ label:"Importado em", value:importedAt, unit:"", color:"#64748B" }]:[]),
                ...(hasProjects?[{ label:"No report atual", value:existingProjects.length, unit:"projetos", color:"#F47B20" }]:[]),
              ].map((s,i)=>(
                <div key={s.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", background:"#F8FAFC", borderRadius:8, border:"1px solid #F1F5F9" }}>
                  <span style={{ fontSize:12, color:"#64748B" }}>{s.label}</span>
                  <span style={{ fontSize:14, fontWeight:800, color:s.color }}>{s.value}{s.unit&&<span style={{ fontSize:11, fontWeight:500, color:"#94A3B8", marginLeft:4 }}>{s.unit}</span>}</span>
                </div>
              ))}
            </div>
          )}
          </div>

        </div>{/* fim row */}

        {/* ── Box 3: Ações ── */}
        <div style={{ background:"#fff", borderRadius:14, padding:"20px 24px", boxShadow:"0 1px 4px rgba(0,0,0,.08)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:9, borderBottom:"1px solid #E2E8F0", paddingBottom:13, marginBottom:18 }}>
            <Zap size={15} color="#F47B20"/>
            <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:15, fontWeight:700, color:"#1E293B", margin:0 }}>Ações</h2>
          </div>

          <div className="import-actions-grid" style={{ display:"flex", gap:12, flexWrap:"wrap" }}>

            {/* Selecionar Projetos */}
            {[
              { key:'selecionar', icon:'🔍', cor:'#2F5597', bg:'#EFF6FF',
                titulo:'Selecionar Projetos',
                desc:'Filtre por SM, trimestre ou compromisso e escolha os projetos para o report',
                badge: selected.size>0 ? `${selected.size} selecionado${selected.size!==1?'s':''}` : (hasPortfolio||manualProjects.length>0?`${allSelectable.length} disponíveis`:null),
                badgeCor: selected.size>0?'#EFF6FF':'#F1F5F9', textCor: selected.size>0?'#2F5597':'#64748B',
                disabled: !hasPortfolio && manualProjects.length===0,
                onClick: ()=>setExpanded(e=>e==='selecionar'?null:'selecionar'),
                active: expanded==='selecionar' },
              { key:'manual', icon:'➕', cor:'#7030A0', bg:'#F5F0FF',
                titulo:'Incluir Projeto Manual',
                desc:'Adicione projetos que não estão no portfólio importado — 100% manual',
                badge: manualProjects.length>0?`${manualProjects.length} adicionado${manualProjects.length!==1?'s':''}`:null,
                badgeCor:'#F5F0FF', textCor:'#7030A0',
                disabled: false,
                onClick: ()=>setExpanded(e=>e==='manual'?null:'manual'),
                active: expanded==='manual' },
              { key:'atualizar', icon:'✏️', cor:'#F47B20', bg:'#FFF7ED',
                titulo:'Atualizar Report',
                desc:'Edite marcos, cronogramas e pontos de atenção de cada projeto selecionado',
                badge: hasProjects?`${existingProjects.length} projeto${existingProjects.length!==1?'s':''}`:null,
                badgeCor:'#FFF7ED', textCor:'#F47B20',
                disabled: !hasProjects,
                onClick: hasProjects?()=>{ setAtualizarSelected(new Set(existingProjects.map(p=>p.id))); setExpanded(e=>e==='atualizar'?null:'atualizar'); }:undefined,
                active: expanded==='atualizar' },
              { key:'gerar', icon:'📥', cor:'#16A34A', bg:'#F0FDF4',
                titulo:'Gerar Report',
                desc:'Selecione e baixe o PPTX dos projetos salvos em slides separados',
                badge: hasProjects?`${existingProjects.length} slide${existingProjects.length!==1?'s':''}`:null,
                badgeCor:'#F0FDF4', textCor:'#16A34A',
                disabled: !hasProjects,
                onClick: hasProjects?()=>{ setGerarSelected(new Set(existingProjects.map(p=>p.id))); setExpanded(e=>e==='gerar'?null:'gerar'); }:undefined,
                active: expanded==='gerar' },
            ].map(a=>(
              <div key={a.key} className="acard" onClick={a.disabled?undefined:a.onClick}
                style={{ flex:1, minWidth:190, background:'#fff', borderRadius:12, padding:'18px 18px 16px',
                  border:`2px solid ${a.active?a.cor:'#E2E8F0'}`,
                  boxShadow:a.active?`0 0 0 3px ${a.cor}22`:'0 1px 2px rgba(0,0,0,.06)',
                  cursor:a.disabled?'not-allowed':'pointer', opacity:a.disabled?.42:1,
                  display:'flex', flexDirection:'column', gap:9 }}>
                <div style={{ width:42, height:42, borderRadius:11, background:a.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {a.key==='selecionar'?<Search size={20} color={a.cor}/>:a.key==='manual'?<Plus size={20} color={a.cor}/>:a.key==='atualizar'?<Edit2 size={20} color={a.cor}/>:a.key==='gerar'?<Download size={20} color={a.cor}/>:<span style={{fontSize:20}}>{a.icon}</span>}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:13.5, color:'#1E293B', marginBottom:3 }}>{a.titulo}</div>
                  <div style={{ fontSize:12, color:'#64748B', lineHeight:1.45 }}>{a.desc}</div>
                </div>
                {a.badge && (
                  <div style={{ marginTop:'auto', display:'inline-flex', alignItems:'center', background:a.badgeCor, borderRadius:20, padding:'3px 10px', fontSize:11.5, fontWeight:700, color:a.textCor, alignSelf:'flex-start' }}>
                    {a.badge}
                  </div>
                )}
                {/* {a.key==='selecionar' && (
                  <div style={{ fontSize:11, fontWeight:600, color:a.cor }}>{a.active?'▲ fechar filtros':'▼ abrir filtros'}</div>
                )} */}
              </div>
            ))}
          </div>

          {/* Painel: Selecionar Projetos */}
          {expanded==='selecionar' && (hasPortfolio || manualProjects.length>0) && (
            <div style={{ marginTop:18, borderTop:'1px solid #E2E8F0', paddingTop:18 }}>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:12, fontWeight:700, color:"#1E293B", marginBottom:11 }}>Filtros</div>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:8 }}>
                {/* filtro tipo */}
                <div style={{ minWidth:140 }}>
                  <div className="lbl">Tipo</div>
                  <select className="inp" value={filters.tipo} onChange={e=>setFilters(f=>({...f,tipo:e.target.value}))}>
                    <option value="todos">Todos</option>
                    <option value="importados">Importados</option>
                    <option value="manuais">Manuais</option>
                  </select>
                </div>
                {/* filtros de portfólio só aparecem quando relevante */}
                {filters.tipo !== 'manuais' && hasPortfolio && [['SM/PMO','sm',smOpts],['Trimestre','trimestre',trOpts],['Compromisso','compromisso',coOpts]].map(([lbl,key,opts])=>(
                  <div key={key} style={{ flex:1, minWidth:140 }}>
                    <div className="lbl">{lbl}</div>
                    <select className="inp" value={filters[key]} onChange={e=>{setFilters(f=>({...f,[key]:e.target.value}));setSelected(new Set());}}>
                      <option value="">Todos</option>
                      {opts.map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div style={{ fontSize:12, color:"#64748b", marginBottom:12 }}>
                {allSelectable.length} projeto{allSelectable.length!==1?'s':''} disponíveis
                {(filters.sm||filters.trimestre||filters.compromisso)&&filters.tipo!=='manuais'?' (com filtros aplicados)':''}
              </div>
              {allSelectable.length > 0 && (
                <>
                  <div className="panel-toolbar" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8, gap:8 }}>
                    <div style={{ fontFamily:"'Fraunces',serif", fontSize:14, fontWeight:700, color:"#1E293B" }}>Projetos disponíveis</div>
                    <div className="panel-toolbar-actions" style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      <button className="btn" onClick={toggleAll} style={{ background:"#F1F5F9", color:"#334155", fontSize:12 }}>
                        {selected.size===allSelectable.length?"Desmarcar todos":"Selecionar todos"}
                      </button>
                      <button className="btn" onClick={handleSelecionarParaAtualizar} disabled={selected.size===0}
                        style={{ background:"#2F5597", color:"#fff", border:"none", opacity:selected.size===0?.45:1, fontSize:12 }}>
                        ✔ Selecionar para atualizar ({selected.size})
                      </button>
                      <button className="btn" onClick={handleAtualizarAgora} disabled={selected.size===0}
                        style={{ background:"#F47B20", color:"#fff", opacity:selected.size===0?.45:1, fontSize:12 }}>
                        <ChevronRight size={13} />Atualizar agora ({selected.size})
                      </button>
                    </div>
                  </div>
                  <div style={{ maxHeight:340, overflowY:"auto" }}>
                    {allSelectable.map(x=>{
                      const isSaved=existingProjects.some(p=>p.id===x.key);
                      return(
                        <div key={x.key} onClick={()=>toggle(x.key)} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 11px", borderRadius:8, marginBottom:4, cursor:"pointer",
                          background:selected.has(x.key)?"#EEF4FF":"#FAFBFC", border:`1px solid ${selected.has(x.key)?"#2F5597":"#E2E8F0"}`, transition:"all .12s" }}>
                          <input type="checkbox" checked={selected.has(x.key)} onChange={()=>toggle(x.key)} onClick={e=>e.stopPropagation()} />
                          <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:2 }}>
                            <span style={{ fontWeight:600, color:"#1E293B", fontSize:12.5 }}>{x.nome}</span>
                            <div style={{ display:"flex", flexWrap:"wrap", gap:"4px 8px", fontSize:11, color:"#64748b" }}>
                              <span>{x.id || '—'}</span>
                              <span>{x.trimestre}</span>
                              <span>{x.compromisso}</span>
                            </div>
                          </div>
                          {x.type==='manual'&&<span style={{ fontSize:10, background:"#F5F0FF", color:"#7030A0", borderRadius:6, padding:"2px 6px", fontWeight:700 }}>MANUAL</span>}
                          {isSaved&&<span style={{ fontSize:10, background:"#d1fae5", color:"#065f46", borderRadius:6, padding:"2px 6px", fontWeight:700 }}>SALVO</span>}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Painel: Incluir Projeto Manual */}
          {expanded==='manual' && (
            <div style={{ marginTop:18, borderTop:'1px solid #E2E8F0', paddingTop:18 }}>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:14, fontWeight:700, color:"#1E293B", marginBottom:14 }}>Novo projeto manual</div>
              <div className="manual-form-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:12 }}>
                <div className="manual-full-span" style={{ gridColumn:"1 / -1" }}>
                  <div className="lbl">Nome do projeto *</div>
                  <input className="inp" placeholder="Nome do projeto" value={manualForm.nome} onChange={e=>setManualForm(f=>({...f,nome:e.target.value}))} />
                </div>
                <div><div className="lbl">SM/PMO</div><input className="inp" placeholder="Responsável" value={manualForm.smPmo} onChange={e=>setManualForm(f=>({...f,smPmo:e.target.value}))} /></div>
                <div><div className="lbl">Lecom</div><input className="inp" placeholder="ID Lecom" value={manualForm.resumoLecom} onChange={e=>setManualForm(f=>({...f,resumoLecom:e.target.value}))} /></div>
                <div><div className="lbl">Área Cliente</div><input className="inp" placeholder="Área" value={manualForm.areaCliente} onChange={e=>setManualForm(f=>({...f,areaCliente:e.target.value}))} /></div>
                <div className="manual-full-span" style={{ gridColumn:"1 / span 2" }}><div className="lbl">Área Executora</div><input className="inp" placeholder="Área executora" value={manualForm.areaExec} onChange={e=>setManualForm(f=>({...f,areaExec:e.target.value}))} /></div>
              </div>
              <button className="btn" onClick={saveManual} disabled={!manualForm.nome.trim()}
                style={{ background:"#7030A0", color:"#fff", opacity:manualForm.nome.trim()?1:.5 }}>
                ➕ Salvar projeto
              </button>
              {manualProjects.length > 0 && (
                <div style={{ marginTop:16 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#64748B", marginBottom:8 }}>Projetos manuais adicionados</div>
                  {manualProjects.map(m=>(
                    <div key={m.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 11px", borderRadius:8, marginBottom:4, background:"#F5F0FF", border:"1px solid #D8B4FE" }}>
                      <span style={{ fontWeight:600, color:"#1E293B", flex:1, fontSize:12.5 }}>{m.nome}</span>
                      {m.smPmo&&<span style={{ fontSize:11, color:"#7030A0" }}>{m.smPmo}</span>}
                      {m.resumoLecom&&<span style={{ fontSize:11, color:"#64748b" }}>{m.resumoLecom}</span>}
                      <button onClick={()=>removeManual(m.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"#ef4444", fontSize:14, padding:"0 4px" }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Painel: Atualizar Report — seleção de projetos */}
          {expanded==='atualizar' && hasProjects && (
            <div style={{ marginTop:18, borderTop:'1px solid #E2E8F0', paddingTop:18 }}>
              <div className="panel-toolbar" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, gap:8 }}>
                <div style={{ fontFamily:"'Fraunces',serif", fontSize:14, fontWeight:700, color:"#1E293B" }}>
                  Selecione os projetos para editar ({atualizarSelected.size} de {existingProjects.length})
                </div>
                <div className="panel-toolbar-actions" style={{ display:"flex", gap:8, flexWrap:'wrap' }}>
                  <button className="btn" onClick={toggleAtualizarAll} style={{ background:"#F1F5F9", color:"#334155", fontSize:12 }}>
                    {atualizarSelected.size===existingProjects.length?"Desmarcar todos":"Selecionar todos"}
                  </button>
                  <button className="btn" onClick={handleRemoverSelecionados} disabled={atualizarSelected.size===0}
                    style={{ background:"#DC2626", color:"#fff", opacity:atualizarSelected.size===0?.45:1, fontSize:12 }}>
                    Remover selecionados ({atualizarSelected.size})
                  </button>
                  <button className="btn" onClick={handleAtualizarDoPainel} disabled={atualizarSelected.size===0}
                    style={{ background:"#F47B20", color:"#fff", opacity:atualizarSelected.size===0?.45:1, fontSize:12 }}>
                    ✏️ Atualizar agora ({atualizarSelected.size})
                  </button>
                </div>
              </div>
              <div style={{ maxHeight:320, overflowY:"auto" }}>
                {existingProjects.map(p=>(
                  <div key={p.id} onClick={()=>toggleAtualizar(p.id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 11px", borderRadius:8, marginBottom:4, cursor:"pointer",
                    background:atualizarSelected.has(p.id)?"#FFF7ED":"#FAFBFC", border:`1px solid ${atualizarSelected.has(p.id)?"#F47B20":"#E2E8F0"}`, transition:"all .12s" }}>
                    <input type="checkbox" checked={atualizarSelected.has(p.id)} onChange={()=>toggleAtualizar(p.id)} onClick={e=>e.stopPropagation()} />
                    <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:2 }}>
                      <span style={{ fontWeight:600, color:"#1E293B", fontSize:12.5 }}>{p.projeto?.nome||'(sem nome)'}</span>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:"4px 8px", fontSize:11, color:"#64748b" }}>
                        {p.projeto?.smPmo&&<span>{p.projeto.smPmo}</span>}
                        <span>{p.raias?.length||0} raia{p.raias?.length!==1?'s':''}</span>
                      </div>
                    </div>
                    {p.id?.startsWith('manual:')&&<span style={{ fontSize:10, background:"#F5F0FF", color:"#7030A0", borderRadius:6, padding:"2px 6px", fontWeight:700 }}>MANUAL</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Painel: Gerar Report — seleção de projetos */}
          {expanded==='gerar' && hasProjects && (
            <div style={{ marginTop:18, borderTop:'1px solid #E2E8F0', paddingTop:18 }}>
              <div className="panel-toolbar" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, gap:8 }}>
                <div style={{ fontFamily:"'Fraunces',serif", fontSize:14, fontWeight:700, color:"#1E293B" }}>
                  Selecione os projetos para gerar ({gerarSelected.size} de {existingProjects.length})
                </div>
                <div className="panel-toolbar-actions" style={{ display:"flex", gap:8, flexWrap:'wrap' }}>
                  <button className="btn" onClick={toggleGerarAll} style={{ background:"#F1F5F9", color:"#334155", fontSize:12 }}>
                    {gerarSelected.size===existingProjects.length?"Desmarcar todos":"Selecionar todos"}
                  </button>
                  <button className="btn" onClick={handleGerar} disabled={gerarSelected.size===0}
                    style={{ background:"#16A34A", color:"#fff", opacity:gerarSelected.size===0?.45:1, fontSize:12 }}>
                    📥 Gerar PPTX ({gerarSelected.size} slide{gerarSelected.size!==1?'s':''})
                  </button>
                </div>
              </div>
              <div style={{ maxHeight:320, overflowY:"auto" }}>
                {existingProjects.map(p=>(
                  <div key={p.id} onClick={()=>toggleGerar(p.id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 11px", borderRadius:8, marginBottom:4, cursor:"pointer",
                    background:gerarSelected.has(p.id)?"#F0FDF4":"#FAFBFC", border:`1px solid ${gerarSelected.has(p.id)?"#16A34A":"#E2E8F0"}`, transition:"all .12s" }}>
                    <input type="checkbox" checked={gerarSelected.has(p.id)} onChange={()=>toggleGerar(p.id)} onClick={e=>e.stopPropagation()} />
                    <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:2 }}>
                      <span style={{ fontWeight:600, color:"#1E293B", fontSize:12.5 }}>{p.projeto?.nome||'(sem nome)'}</span>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:"4px 8px", fontSize:11, color:"#64748b" }}>
                        {p.projeto?.smPmo&&<span>{p.projeto.smPmo}</span>}
                        <span>{p.raias?.length||0} raia{p.raias?.length!==1?'s':''}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
