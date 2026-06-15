import React from "react";
import NavBar from "../../components/NavBar";
import ProfileModal from "../../components/ProfileModal";
import ProjectsScreen from "../../components/ProjectsScreen";
import "./index.css";

export default function ProjectsScene({
  currentScreen,
  onGoToPortfolio,
  onGoToProjects,
  onGoToCronograma,
  setCurrentScreen,
  user,
  logout,
  onOpenProfile,
  showProfileModal,
  onCloseProfile,
  onSubmitProfile,
  savingProfile,
  projects,
  setProjects,
  saved,
  salvarManual,
  onOpenProject,
}) {
  return (
    <div className="projects-scene">
      <NavBar
        currentScreen={currentScreen}
        onGoToPortfolio={onGoToPortfolio}
        onGoToProjects={onGoToProjects}
        onGoToCronograma={onGoToCronograma}
        setCurrentScreen={setCurrentScreen}
        user={user}
        logout={logout}
        onOpenProfile={onOpenProfile}
      />
      <div className="scene-content-shell">
        <ProjectsScreen
          projects={projects}
          setProjects={setProjects}
          saved={saved}
          salvarManual={salvarManual}
          onOpenProject={onOpenProject}
        />
      </div>
      {showProfileModal && (
        <ProfileModal
          user={user}
          onClose={onCloseProfile}
          onSubmit={onSubmitProfile}
          saving={savingProfile}
        />
      )}
    </div>
  );
}
