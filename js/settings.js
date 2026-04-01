window.ButterflyDiarySettings = {
  createSettingsController({
    settingsPageWrapper,
    notebookFrontWrapper,
    closeGlobalPageMenu,
    animationDuration,
    getCurrentView,
    setCurrentView,
    isAnimatingRef,
  }) {
    function showSettingsPage() {
      if (isAnimatingRef.value || getCurrentView() !== 'cover') {
        return false;
      }

      closeGlobalPageMenu?.();
      setCurrentView('settings');
      isAnimatingRef.value = true;
      settingsPageWrapper.classList.add('active');
      notebookFrontWrapper.classList.add('open');

      window.setTimeout(() => {
        isAnimatingRef.value = false;
      }, animationDuration);

      return true;
    }

    function hideSettingsPage() {
      if (isAnimatingRef.value || getCurrentView() !== 'settings') {
        return false;
      }

      closeGlobalPageMenu?.();
      setCurrentView('cover');
      isAnimatingRef.value = true;
      notebookFrontWrapper.classList.add('pre-return');

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          notebookFrontWrapper.classList.remove('pre-return');
          notebookFrontWrapper.classList.remove('open');
        });
      });

      window.setTimeout(() => {
        settingsPageWrapper.classList.remove('active');
        isAnimatingRef.value = false;
      }, animationDuration);

      return true;
    }

    return {
      showSettingsPage,
      hideSettingsPage,
    };
  },
};
