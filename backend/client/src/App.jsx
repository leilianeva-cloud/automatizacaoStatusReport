import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from './contexts/AuthContext';
import LoginScreen from './components/LoginScreen';
import ChangePasswordModal from './components/ChangePasswordModal';
import AdminUsersScene from './scenes/AdminUsersScene';
import PortfolioScene from './scenes/PortfolioScene';
import CronogramaScene from './scenes/CronogramaScene';
import ProjectsScene from './scenes/ProjectsScene';
import ImportScreen from './scenes/ImportScreen';
import ReportScreen from './scenes/ReportScreen';
import api from './services/api';
import { baixarPptx } from './utils/reportWidgetsPptx';

// =====================================================================

// =====================================================================
//  APP (roteador de telas)
// =====================================================================
export default function App() {
  const { user, logout, changePassword, updateProfile } = useAuth();

  // Se não autenticado, mostra tela de login
  if (!user) return <LoginScreen />;

  // Se usuário precisa trocar senha, mostra modal obrigatório
  if (user.mustChangePassword) {
    return <ChangePasswordModal onSubmit={changePassword} />;
  }

  return <AppInner logout={logout} user={user} changePassword={changePassword} updateProfile={updateProfile} />;
}

function AppInner({ logout, user, changePassword, updateProfile }) {
  const [currentScreen, setCurrentScreen] = useState('portfolio'); // 'portfolio' | 'cronograma' | 'users'
  const [screen, setScreen] = useState('import');
  const [portfolioRows, setPortfolioRows] = useState([]);
  const [importedAt, setImportedAt] = useState('');
  const [projects, setProjects] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [activeProjectIds, setActiveProjectIds] = useState(null); // null = mostrar todos
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const goToPortfolio = useCallback(() => {
    setCurrentScreen('portfolio');
    setScreen('import');
    setActiveProjectIds(null);
    setCurrentIdx(0);
  }, []);

  const goToCronograma = useCallback(() => {
    setCurrentScreen('cronograma');
    setScreen('report');
  }, []);

  const goToProjects = useCallback(() => {
    setCurrentScreen('projects');
    setActiveProjectIds(null);
    setCurrentIdx(0);
  }, []);

  const openProjectInCronograma = useCallback((projectId) => {
    const idx = projects.findIndex((p) => p.id === projectId);
    if (idx === -1) return;
    setActiveProjectIds(new Set([projectId]));
    setCurrentIdx(idx);
    setCurrentScreen('cronograma');
    setScreen('report');
  }, [projects]);

  const handleProfileSave = async ({ name, currentPassword, newPassword, changePassword: shouldChangePassword }) => {
    try {
      setSavingProfile(true);

      if (name !== user.name) {
        await updateProfile(name);
      }

      if (shouldChangePassword) {
        await changePassword(currentPassword, newPassword);
      }

      setShowProfileModal(false);
      alert('Perfil atualizado com sucesso.');
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Erro ao atualizar perfil.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Carrega projetos e portfólio ao montar
  useEffect(() => {
    (async () => {
      try {
        const [projRes, portRes] = await Promise.all([
          api.getProjects(),
          api.getPortfolio(),
        ]);
        if (projRes?.length) {
          const ps = projRes.map(p => ({ nFuturos:1, nPassados:0, ...p }));
          setProjects(ps);
        }
        if (portRes?.rows?.length) {
          setPortfolioRows(portRes.rows);
          setImportedAt(portRes.importedAt || '');
        }
      } catch (err) {
        console.warn('Erro ao carregar dados:', err);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // Auto-save com debounce de 600ms
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(async () => {
      try {
        await api.saveProjects(projects);
        setSaved(true);
        setTimeout(() => setSaved(false), 1600);
      } catch (err) {
        console.warn('auto-save:', err);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [projects, loaded]);

  const salvarManual = async () => {
    try {
      await api.saveProjects(projects);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch (err) {
      console.warn('salvarManual:', err);
    }
  };

  // Renderiza a tela de usuários se selecionada
  if (currentScreen === 'users' && user.isAdmin) {
    return (
      <AdminUsersScene
        currentScreen={currentScreen}
        onGoToPortfolio={goToPortfolio}
        onGoToProjects={goToProjects}
        onGoToCronograma={goToCronograma}
        setCurrentScreen={setCurrentScreen}
        user={user}
        logout={logout}
        onOpenProfile={() => setShowProfileModal(true)}
        onBack={goToPortfolio}
        showProfileModal={showProfileModal}
        onCloseProfile={() => setShowProfileModal(false)}
        onSubmitProfile={handleProfileSave}
        savingProfile={savingProfile}
      />
    );
  }

  if (currentScreen === 'projects') {
    return (
      <ProjectsScene
        currentScreen={currentScreen}
        onGoToPortfolio={goToPortfolio}
        onGoToCronograma={goToCronograma}
        onGoToProjects={goToProjects}
        setCurrentScreen={setCurrentScreen}
        user={user}
        logout={logout}
        onOpenProfile={() => setShowProfileModal(true)}
        showProfileModal={showProfileModal}
        onCloseProfile={() => setShowProfileModal(false)}
        onSubmitProfile={handleProfileSave}
        savingProfile={savingProfile}
        projects={projects}
        setProjects={setProjects}
        saved={saved}
        salvarManual={salvarManual}
        onOpenProject={openProjectInCronograma}
      />
    );
  }

  // Renderiza o fluxo normal de portfólio/reports
  if (screen === 'import') {
    return (
      <PortfolioScene
        currentScreen={currentScreen}
        onGoToPortfolio={goToPortfolio}
        onGoToProjects={goToProjects}
        onGoToCronograma={goToCronograma}
        setCurrentScreen={setCurrentScreen}
        user={user}
        logout={logout}
        onOpenProfile={() => setShowProfileModal(true)}
        showProfileModal={showProfileModal}
        onCloseProfile={() => setShowProfileModal(false)}
        onSubmitProfile={handleProfileSave}
        savingProfile={savingProfile}
        ImportScreenComponent={ImportScreen}
        importScreenProps={{
          portfolioRows,
          onImport: (rows, importedAtStr) => {
            setPortfolioRows(rows);
            if (importedAtStr) setImportedAt(importedAtStr);
          },
          importedAt,
          onLogout: logout,
          user,
          existingProjects: projects,
          onStart: (merged, navegar = true) => {
            const existMap = Object.fromEntries(projects.map(p => [p.id, p]));
            setProjects(merged.map(p => ({
              nFuturos: existMap[p.id]?.nFuturos ?? p.nFuturos ?? 1,
              nPassados: existMap[p.id]?.nPassados ?? p.nPassados ?? 0,
              ...p,
              raias: existMap[p.id]?.raias ?? p.raias ?? [],
            })));
            setCurrentIdx(0);
            if (navegar) {
              setCurrentScreen('cronograma');
              setScreen('report');
            }
          },
          onContinue: (ids) => {
            if (ids && ids.length) {
              setActiveProjectIds(new Set(ids));
              const first = projects.findIndex(p => ids.includes(p.id));
              setCurrentIdx(Math.max(0, first));
            } else {
              setActiveProjectIds(null);
              setCurrentIdx(0);
            }
            setCurrentScreen('cronograma');
            setScreen('report');
          },
          onGenerate: (toGen) => {
            const list = toGen || projects;
            if (!list.length) return;
            try { baixarPptx(list); } catch (e) { alert('Erro ao gerar PPTX: ' + e.message); }
          },
          onRemoveProjects: async (ids) => {
            const removeSet = new Set(ids || []);
            const nextProjects = projects.filter(p => !removeSet.has(p.id));
            setProjects(nextProjects);
            setActiveProjectIds(prev => prev ? new Set([...prev].filter(id => !removeSet.has(id))) : prev);
            setCurrentIdx(0);
            await api.saveProjects(nextProjects);
          },
        }}
      />
  );
  }

  return (
    <CronogramaScene
      currentScreen={currentScreen}
      onGoToPortfolio={goToPortfolio}
      onGoToProjects={goToProjects}
      onGoToCronograma={goToCronograma}
      setCurrentScreen={setCurrentScreen}
      user={user}
      logout={logout}
      onOpenProfile={() => setShowProfileModal(true)}
      showProfileModal={showProfileModal}
      onCloseProfile={() => setShowProfileModal(false)}
      onSubmitProfile={handleProfileSave}
      savingProfile={savingProfile}
      ReportScreenComponent={ReportScreen}
      reportScreenProps={{
        projects,
        setProjects,
        currentIdx,
        setCurrentIdx,
        activeProjectIds,
        setActiveProjectIds,
        saved,
        gerando,
        setGerando,
        onBack: () => { setActiveProjectIds(null); setCurrentScreen('portfolio'); setScreen('import'); },
        salvarManual,
      }}
    />
    
  );
}
