import React, { useEffect, useState } from "react";
import { ClipboardList, Filter, FolderOpen, LogOut, Menu, UserCog, Users, X } from "lucide-react";
import "./index.css";

export default function NavBar({ currentScreen, onGoToPortfolio, onGoToProjects, onGoToCronograma, setCurrentScreen, user, logout, onOpenProfile }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [currentScreen]);

  const navButtonStyle = (active) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 16px",
    background: active ? "rgba(255,255,255,0.2)" : "transparent",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s",
    width: "100%",
    textAlign: "left",
    whiteSpace: "nowrap",
  });

  return (
    <div className="top-nav">
      <div className="top-nav-left">
        <div className="top-nav-title">Status Semanal · Hapvida</div>
        <div className="top-nav-links">
          <button
            onClick={onGoToPortfolio}
            style={navButtonStyle(currentScreen === "portfolio")}
          >
            <FolderOpen size={16} />
            Portfólio
          </button>
          <button
            onClick={onGoToProjects}
            style={navButtonStyle(currentScreen === "projects")}
          >
            <Filter size={16} />
            Projetos
          </button>
          <button
            onClick={onGoToCronograma}
            style={navButtonStyle(currentScreen === "cronograma")}
          >
            <ClipboardList size={16} />
            Cronograma
          </button>
          {user.isAdmin && (
            <button
              onClick={() => setCurrentScreen("users")}
              style={navButtonStyle(currentScreen === "users")}
            >
              <Users size={16} />
              Usuários
            </button>
          )}
        </div>
      </div>
      <div className="top-nav-user">
        <span style={{ fontSize: 13, opacity: 0.9 }}>{user.name}</span>
        <button
          className="top-nav-profile-trigger"
          onClick={onOpenProfile}
          title="Editar perfil"
          aria-label="Editar perfil"
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
        >
          <UserCog size={16} />
        </button>
        <button
          onClick={logout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            background: "rgba(255,255,255,0.15)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
      <button
        className={`top-nav-menu-toggle${menuOpen ? " open" : ""}`}
        onClick={() => setMenuOpen((open) => !open)}
        aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
        aria-expanded={menuOpen}
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      {menuOpen && (
        <div className="top-nav-mobile-panel">
          <div className="top-nav-links open">
            <button
              onClick={onGoToPortfolio}
              className="top-nav-mobile-option"
              style={navButtonStyle(currentScreen === "portfolio")}
            >
              <FolderOpen size={16} />
              Portfólio
            </button>
            <button
              onClick={onGoToProjects}
              className="top-nav-mobile-option"
              style={navButtonStyle(currentScreen === "projects")}
            >
              <Filter size={16} />
              Projetos
            </button>
            <button
              onClick={onGoToCronograma}
              className="top-nav-mobile-option"
              style={navButtonStyle(currentScreen === "cronograma")}
            >
              <ClipboardList size={16} />
              Cronograma
            </button>
            {user.isAdmin && (
              <button
                onClick={() => setCurrentScreen("users")}
                className="top-nav-mobile-option"
                style={navButtonStyle(currentScreen === "users")}
              >
                <Users size={16} />
                Usuários
              </button>
            )}
          </div>
          <div className="top-nav-user open">
            <span className="top-nav-user-name">{user.name}</span>
            <button
              className="top-nav-mobile-profile-trigger"
              onClick={onOpenProfile}
            >
              <UserCog size={16} />
              Editar perfil
            </button>
            <button
              className="top-nav-mobile-logout"
              onClick={logout}
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
