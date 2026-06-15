import React, { useEffect, useMemo, useState } from "react";
import { ExternalLink, FileDown, Plus, Search, Trash2 } from "lucide-react";
import api from "../services/api";
import { STATUS_GERAL, defaultProjeto, ddmm } from "../utils/reportCore";
import "./projects-screen.css";

export default function ProjectsScreen({
  projects,
  setProjects,
  saved,
  salvarManual,
  onOpenProject,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [areaFilter, setAreaFilter] = useState("Todos");
  const [smPmoFilter, setSmPmoFilter] = useState("Todos");
  const [selectedId, setSelectedId] = useState(projects[0]?.id || null);

  const uniqueAreas = useMemo(() => {
    const values = new Set(projects.map((p) => p.projeto?.areaCliente || "").filter(Boolean));
    return ["Todos", ...Array.from(values).sort()];
  }, [projects]);

  const uniqueSmPmo = useMemo(() => {
    const values = new Set(projects.map((p) => p.projeto?.smPmo || "").filter(Boolean));
    return ["Todos", ...Array.from(values).sort()];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const term = search.trim().toLowerCase();
    return projects.filter((project) => {
      const nome = project.projeto?.nome || "";
      const status = project.projeto?.statusGeral || "";
      const area = project.projeto?.areaCliente || "";
      const sm = project.projeto?.smPmo || "";

      if (term && ![nome, status, area, sm].some((value) => value.toLowerCase().includes(term))) {
        return false;
      }

      if (statusFilter !== "Todos" && status !== statusFilter) return false;
      if (areaFilter !== "Todos" && area !== areaFilter) return false;
      if (smPmoFilter !== "Todos" && sm !== smPmoFilter) return false;
      return true;
    });
  }, [projects, search, statusFilter, areaFilter, smPmoFilter]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedId) || filteredProjects[0] || null,
    [projects, selectedId, filteredProjects],
  );

  useEffect(() => {
    if (!selectedProject && filteredProjects.length) {
      setSelectedId(filteredProjects[0].id);
    }
  }, [filteredProjects, selectedProject]);

  const updatedLastWeekCount = useMemo(() => {
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    return projects.filter((project) => {
      const date = project.projeto?.atualizadoEm;
      if (!date) return false;
      const parsed = new Date(date + "T12:00:00");
      return !Number.isNaN(parsed.getTime()) && Date.now() - parsed.getTime() <= weekMs;
    }).length;
  }, [projects]);

  const packageCount = useMemo(() => projects.filter((project) => project.usaPacotes).length, [projects]);

  const handleCreateProject = () => {
    const id = `p-${Date.now()}`;
    const projeto = {
      ...defaultProjeto(),
      nome: "Projeto novo",
      atualizadoEm: new Date().toISOString().slice(0, 10),
      iniciadoEm: new Date().toISOString().slice(0, 10),
    };
    const novoProjeto = {
      id,
      nFuturos: 1,
      nPassados: 0,
      projeto,
      raias: [],
      usaPacotes: false,
      pacotes: [],
    };
    setProjects((prev) => [novoProjeto, ...prev]);
    setSelectedId(id);
  };

  const handleDeleteProject = (id) => {
    if (!window.confirm("Tem certeza de que deseja remover este projeto?")) return;
    setProjects((prev) => prev.filter((project) => project.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleUpdateSelected = (patch) => {
    if (!selectedProject) return;
    setProjects((prev) =>
      prev.map((project) =>
        project.id === selectedProject.id
          ? { ...project, projeto: { ...project.projeto, ...patch } }
          : project,
      ),
    );
  };

  const handleOpenProject = () => {
    if (!selectedProject) return;
    onOpenProject(selectedProject.id);
  };

  return (
    <div className="projects-screen" style={{ fontFamily: "'Archivo', sans-serif", background: "rgb(241, 245, 249)", minHeight: "100vh", color: "#0f172a" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,700&display=swap');
        input,select,textarea{font-family:'Archivo',sans-serif;}
        .inp{width:100%;padding:7px 9px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;background:#fff;outline:none;}
        .inp:focus{border-color:#2F5597;box-shadow:0 0 0 3px rgba(47,85,151,.12);}
        .btn{display:inline-flex;align-items:center;gap:6px;border:none;border-radius:9px;padding:8px 13px;font-size:13px;font-weight:600;cursor:pointer;}
        .lbl{font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.04em;}
      `}</style>

      {/* Header principal */}
      <div className="projects-header" style={{
        background: "linear-gradient(128deg, #003B82 0%, #1D4E89 62%, #2F5597 100%)",
        color: "#fff",
        padding: "18px 22px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
        borderRadius: "14px 14px 0 0",
        boxShadow: "0 10px 30px rgba(0,59,130,.22)",
      }}>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700 }}>Projetos</div>
          <div style={{ fontSize: 14, opacity: 0.8, marginTop: 4 }}>Gerencie sua carteira de projetos</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 11.5, color: "#fff", opacity: saved ? 1 : 0.4, transition: "opacity .3s", display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: saved ? "#4ade80" : "rgba(255,255,255,.5)" }} />
            {saved ? "Salvo ✓" : "auto-save ativo"}
          </span>
          <button className="btn" onClick={handleCreateProject} style={{ background: "#E36C15", color: "#fff" }}>
            <Plus size={14} /> Novo
          </button>
          <button className="btn" onClick={salvarManual} style={{ background: "#fff", color: "#003B82" }}>
            <FileDown size={14} /> Salvar
          </button>
        </div>
      </div>

      {/* Barra secundária */}
      <div className="projects-toolbar" style={{
        background: "linear-gradient(128deg, #003B82 0%, #1D4E89 62%, #2F5597 100%)",
        color: "#fff",
        padding: "0 18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 14,
        borderRadius: "0 0 14px 14px",
        borderTop: "1px solid rgba(255,255,255,.15)",
        marginBottom: "16px",
        height: "44px",
      }}>
        <span style={{ fontSize: 11.5, opacity: 0.7 }}>{filteredProjects.length} projeto(s)</span>
      </div>

      {/* Seção de filtros */}
      <div style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        padding: "14px 16px",
        marginBottom: "16px",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Buscar</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Search size={14} style={{ color: "#94a3b8" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nome, status, área..."
                style={{
                  background: "#fff",
                  border: "1px solid #cbd5e1",
                  color: "#0f172a",
                  borderRadius: "8px",
                  padding: "8px 10px",
                  fontSize: "13px",
                  width: "100%",
                  flex: 1,
                }}
              />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                background: "#fff",
                border: "1px solid #cbd5e1",
                color: "#0f172a",
                borderRadius: "8px",
                padding: "8px 10px",
                fontSize: "13px",
              }}>
              {['Todos', ...Object.keys(STATUS_GERAL)].map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Área Cliente</label>
            <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}
              style={{
                background: "#fff",
                border: "1px solid #cbd5e1",
                color: "#0f172a",
                borderRadius: "8px",
                padding: "8px 10px",
                fontSize: "13px",
              }}>
              {uniqueAreas.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>SM / PMO</label>
            <select value={smPmoFilter} onChange={(e) => setSmPmoFilter(e.target.value)}
              style={{
                background: "#fff",
                border: "1px solid #cbd5e1",
                color: "#0f172a",
                borderRadius: "8px",
                padding: "8px 10px",
                fontSize: "13px",
              }}>
              {uniqueSmPmo.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="projects-summary-grid">
        <div className="summary-card">
          <div className="summary-value">{projects.length}</div>
          <div className="summary-label">Projetos</div>
        </div>
        <div className="summary-card">
          <div className="summary-value">{updatedLastWeekCount}</div>
          <div className="summary-label">Atualizados 7 dias</div>
        </div>
        <div className="summary-card">
          <div className="summary-value">{packageCount}</div>
          <div className="summary-label">Com pacotes</div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="projects-grid">
        <div className="projects-list">
          <div className="projects-list-head">
            <div>Nome</div>
            <div>Status</div>
            <div>SM / PMO</div>
            <div>Área</div>
            <div style={{textAlign: "center"}}>Ações</div>
          </div>
          {filteredProjects.length === 0 && (
            <div className="empty-row">Nenhum projeto encontrado com os filtros atuais.</div>
          )}
          {filteredProjects.map((project) => {
            const isSelected = selectedProject?.id === project.id;
            return (
              <div
                key={project.id}
                className={`project-row${isSelected ? ' selected' : ''}`}
                onClick={() => setSelectedId(project.id)}
              >
                <div className="cell-name">{project.projeto?.nome || '(sem nome)'}</div>
                <div className="cell-status">
                  <span className="status-pill" style={{ background: STATUS_GERAL[project.projeto?.statusGeral] || '#CBD5E1' }}>
                    {project.projeto?.statusGeral || 'Não def.'}
                  </span>
                </div>
                <div className="cell-sm">{project.projeto?.smPmo || '—'}</div>
                <div className="cell-area">{project.projeto?.areaCliente || '—'}</div>
                <div className="project-row-actions">
                  <button
                    className="icon-btn"
                    onClick={(e) => { e.stopPropagation(); onOpenProject(project.id); }}
                    title="Abrir cronograma"
                  >
                    <ExternalLink size={14} />
                  </button>
                  <button
                    className="icon-btn danger"
                    onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }}
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="projects-detail-panel">
          <div className="detail-header">
            <div>
              <div className="detail-title">Detalhes</div>
              <div className="detail-subtitle">Edite os dados rápidos do projeto</div>
            </div>
            <button className="btn" onClick={handleOpenProject} disabled={!selectedProject} style={{ background: "#003B82", color: "#fff" }}>
              <ExternalLink size={14} /> Abrir
            </button>
          </div>

          {!selectedProject ? (
            <div className="detail-empty">Selecione um projeto para ver detalhes.</div>
          ) : (
            <div className="detail-form">
              <label className="lbl">Nome do projeto</label>
              <input
                value={selectedProject.projeto?.nome || ''}
                onChange={(e) => handleUpdateSelected({ nome: e.target.value })}
                className="inp"
              />
              <label className="lbl" style={{ marginTop: 12 }}>Status geral</label>
              <select
                value={selectedProject.projeto?.statusGeral || 'Bom'}
                onChange={(e) => handleUpdateSelected({ statusGeral: e.target.value })}
                className="inp"
              >
                {Object.keys(STATUS_GERAL).map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <label className="lbl" style={{ marginTop: 12 }}>SM / PMO</label>
              <input
                value={selectedProject.projeto?.smPmo || ''}
                onChange={(e) => handleUpdateSelected({ smPmo: e.target.value })}
                className="inp"
              />
              <label className="lbl" style={{ marginTop: 12 }}>Área Cliente</label>
              <input
                value={selectedProject.projeto?.areaCliente || ''}
                onChange={(e) => handleUpdateSelected({ areaCliente: e.target.value })}
                className="inp"
              />
              <label className="lbl" style={{ marginTop: 12 }}>Iniciado em</label>
              <input
                type="date"
                value={selectedProject.projeto?.iniciadoEm || ''}
                onChange={(e) => handleUpdateSelected({ iniciadoEm: e.target.value })}
                className="inp"
              />
              <label className="lbl" style={{ marginTop: 12 }}>Atualizado em</label>
              <input
                type="date"
                value={selectedProject.projeto?.atualizadoEm || ''}
                onChange={(e) => handleUpdateSelected({ atualizadoEm: e.target.value })}
                className="inp"
              />
              <label className="lbl" style={{ marginTop: 12 }}>Resumo Lecom</label>
              <textarea
                value={selectedProject.projeto?.resumoLecom || ''}
                rows={3}
                onChange={(e) => handleUpdateSelected({ resumoLecom: e.target.value })}
                className="inp"
                style={{ minHeight: 70 }}
              />
              <label className="lbl" style={{ marginTop: 12 }}>Descrição</label>
              <textarea
                value={selectedProject.projeto?.resumoDesc || ''}
                rows={3}
                onChange={(e) => handleUpdateSelected({ resumoDesc: e.target.value })}
                className="inp"
                style={{ minHeight: 70, fontSize: 14 }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
