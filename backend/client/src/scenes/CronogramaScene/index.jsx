import React from "react";
import NavBar from "../../components/NavBar";
import ProfileModal from "../../components/ProfileModal";
import "./index.css";

export default function CronogramaScene({
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
  ReportScreenComponent,
  reportScreenProps,
}) {
  return (
    <div className="cronograma-scene">
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
        <ReportScreenComponent {...reportScreenProps} />
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
