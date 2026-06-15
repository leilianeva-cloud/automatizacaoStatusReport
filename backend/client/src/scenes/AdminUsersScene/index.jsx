import React from "react";
import UsersScreen from "../../components/UsersScreen";
import NavBar from "../../components/NavBar";
import ProfileModal from "../../components/ProfileModal";
import "./index.css";

export default function AdminUsersScene({
  currentScreen,
  onGoToPortfolio,
  onGoToProjects,
  onGoToCronograma,
  setCurrentScreen,
  user,
  logout,
  onOpenProfile,
  onBack,
  showProfileModal,
  onCloseProfile,
  onSubmitProfile,
  savingProfile,
}) {
  return (
    <div className="admin-users-scene">
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
        <UsersScreen onBack={onBack} />
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
