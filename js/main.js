(() => {
  const butterflyDiaryData = window.ButterflyDiaryData;
  const createTextLayout = window.ButterflyDiaryPagination?.createTextLayout;
  const buildPage = window.ButterflyDiaryPageFactory?.buildPage;
  const createSettingsController = window.ButterflyDiarySettings?.createSettingsController;

  if (!butterflyDiaryData || !createTextLayout || !buildPage || !createSettingsController) {
    console.error('[Butterfly Diary] 依赖模块未正确加载。');
    return;
  }

  const innerPagesHost = document.getElementById('innerPagesHost');
  const notebookFrontWrapper = document.getElementById('notebookFrontWrapper');
  const settingsPageWrapper = document.getElementById('settingsPageWrapper');
  const settingsPagesHost = document.getElementById('settingsPagesHost');
  const settingsPageContent = document.getElementById('settingsPageContent');
  const settingsMainChatContent = document.getElementById('settingsMainChatContent');
  const settingsPresetContent = document.getElementById('settingsPresetContent');
  const settingsWorldBookContent = document.getElementById('settingsWorldBookContent');
  const settingsAutoTriggerContent = document.getElementById('settingsAutoTriggerContent');
  const coverSettingsTrigger = document.getElementById('coverSettingsTrigger');

  if (!innerPagesHost || !notebookFrontWrapper || !settingsPageWrapper || !settingsPagesHost || !settingsPageContent || !settingsMainChatContent || !settingsPresetContent || !settingsWorldBookContent || !settingsAutoTriggerContent || !coverSettingsTrigger) {
    return;
  }

  const lineCount = 18;
  const lineHeight = 26;
  const pageWidth = 336;
  const safety = 6;
  const animationDuration = 800;

  const blockedRects = [
    { x: 263 - 30 - safety, y: 399 - 40 - safety, width: 118 + safety * 2, height: 123 + safety * 2 },
    { x: 8 - 30 - safety, y: 253 - 40 - safety, width: 42 + safety * 2, height: 40 + safety * 2 },
    { x: 334 - 30 - safety, y: 38 - 40 - safety, width: 42 + safety * 2, height: 44 + safety * 2 },
  ];
  const diaryInfoPanelBlockedRects = [
    { x: 0, y: 0, width: 336, height: 26 },
  ];

  const { getLineLayout, applyPageLineLayout, paginateEntries, normalizePage, distributeText } = createTextLayout({
    lineCount,
    lineHeight,
    pageWidth,
    blockedRects,
    defaultBlockedRects: blockedRects,
  });

  let totalPageCount = 0;
  let backCoverPageIndex = 0;
  let pageContents = [];

  const pages = [];
  let currentPageIndex = 0;
  let currentView = 'cover';
  const animationState = { value: false };
  const backCoverReturnHotspot = document.getElementById('backCoverReturnHotspot');
  const backCoverReturnHint = document.getElementById('backCoverReturnHint');
  const pageNavHost = document.getElementById('pageNavHost');
  const pageJumpMenu = document.getElementById('pageJumpMenu');
  const pageJumpCustomBtn = document.getElementById('pageJumpCustomBtn');
  const pageJumpInputWrapper = document.getElementById('pageJumpInputWrapper');
  const pageJumpInput = document.getElementById('pageJumpInput');
  const pageJumpConfirm = document.getElementById('pageJumpConfirm');
  let menuOpenPageIndex = -1;

  const settingsPages = Array.from(settingsPagesHost.querySelectorAll('.settings-sheet')).map((wrapper, index) => ({
    pageNumber: index + 1,
    wrapper,
    nextHotspot: wrapper.querySelector('.settings-next-hotspot'),
    prevHotspot: wrapper.querySelector('.settings-return-hotspot'),
  }));
  let currentSettingsPageIndex = 0;

  if (!settingsPages.length || settingsPages.some((page) => !page.nextHotspot || !page.prevHotspot)) {
    console.error('[Butterfly Diary] 设置页结构未正确加载。');
    return;
  }

  function getDiaryEntries() {
    if (typeof butterflyDiaryData?.getDiaryEntries === 'function') {
      return butterflyDiaryData.getDiaryEntries();
    }
    return Array.isArray(butterflyDiaryData?.diaryEntries) ? butterflyDiaryData.diaryEntries : [];
  }

  function createPageContent(pageNumber) {
    return pageContents[pageNumber - 1] || { text: '', entry: null, showInfoPanel: false, showIllustrationPanel: false };
  }

  function getChineseWeekdayLabel(dateText = '') {
    const normalized = String(dateText || '').trim();
    const matched = normalized.match(/^(\d{4})[-年](\d{1,2})[-月](\d{1,2})/);
    if (!matched) return '';
    const year = Number(matched[1]);
    const month = Number(matched[2]);
    const day = Number(matched[3]);
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return '';
    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) return '';
    const labels = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return labels[date.getDay()] || '';
  }

  function formatDiaryHeaderDateLine(dateText = '', weatherText = '') {
    const normalizedDate = String(dateText || '').trim();
    const normalizedWeather = String(weatherText || '').trim();
    const dateParts = normalizedDate.match(/^(\d{4})[-年](\d{1,2})[-月](\d{1,2})/);
    const formattedDate = dateParts
      ? `${Number(dateParts[1])}年${Number(dateParts[2])}月${Number(dateParts[3])}日`
      : normalizedDate;
    const weekdayLabel = getChineseWeekdayLabel(normalizedDate);
    return [formattedDate, weekdayLabel, normalizedWeather].filter(Boolean).join('，');
  }

  function formatPolaroidCompactDate(dateText = '') {
    const normalizedDate = String(dateText || '').trim();
    const dateParts = normalizedDate.match(/^(\d{4})[-年](\d{1,2})[-月](\d{1,2})/);
    return dateParts
      ? `${Number(dateParts[1])}.${Number(dateParts[2])}.${Number(dateParts[3])}`
      : normalizedDate;
  }

  function formatPolaroidMetaLine(dateText = '', locationText = '') {
    const compactDate = formatPolaroidCompactDate(dateText);
    const normalizedLocation = String(locationText || '').trim();
    return [compactDate, normalizedLocation].filter(Boolean).join(' ');
  }

  function formatPolaroidSummaryLine(summaryText = '') {
    return String(summaryText || '').trim();
  }

  function applyPolaroidMetaAutoFit(page) {
    const metaEl = page?.entryIllustrationMeta;
    if (!metaEl) return;
    metaEl.classList.remove('is-small', 'is-smaller');
    const text = String(metaEl.textContent || '').trim();
    if (!text) return;
    if (metaEl.scrollWidth > metaEl.clientWidth + 1) {
      metaEl.classList.add('is-small');
    }
    if (metaEl.scrollWidth > metaEl.clientWidth + 1) {
      metaEl.classList.add('is-smaller');
    }
  }

  function updatePolaroidScrollMaskState(page) {
    const screen = page?.entryIllustrationScreen;
    const content = page?.entryIllustrationScreenText;
    if (!screen || !content) return;
    const canScroll = content.scrollHeight > content.clientHeight + 2;
    const atTop = content.scrollTop <= 2;
    const atBottom = content.scrollTop + content.clientHeight >= content.scrollHeight - 2;
    screen.classList.toggle('is-scrollable', canScroll);
    screen.classList.toggle('is-at-top', atTop);
    screen.classList.toggle('is-at-bottom', atBottom);
  }

  function bindPolaroidScrollInteractions(page) {
    const screen = page?.entryIllustrationScreen;
    const content = page?.entryIllustrationScreenText;
    if (!screen || !content || content.dataset.scrollBound === 'true') return;
    content.dataset.scrollBound = 'true';

    let isDragging = false;
    let startY = 0;
    let startScrollTop = 0;

    const stopDrag = () => {
      if (!isDragging) return;
      isDragging = false;
      content.classList.remove('is-dragging');
    };

    content.addEventListener('scroll', () => {
      updatePolaroidScrollMaskState(page);
    }, { passive: true });

    content.addEventListener('mousedown', (event) => {
      if (event.button !== 0) return;
      isDragging = true;
      startY = event.clientY;
      startScrollTop = content.scrollTop;
      content.classList.add('is-dragging');
      event.preventDefault();
    });

    window.addEventListener('mousemove', (event) => {
      if (!isDragging) return;
      const deltaY = event.clientY - startY;
      content.scrollTop = startScrollTop - deltaY;
      updatePolaroidScrollMaskState(page);
      event.preventDefault();
    });

    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('mouseleave', stopDrag);

    content.addEventListener('touchstart', (event) => {
      const touch = event.touches?.[0];
      if (!touch) return;
      isDragging = true;
      startY = touch.clientY;
      startScrollTop = content.scrollTop;
      content.classList.add('is-dragging');
    }, { passive: true });

    content.addEventListener('touchmove', (event) => {
      if (!isDragging) return;
      const touch = event.touches?.[0];
      if (!touch) return;
      const deltaY = touch.clientY - startY;
      content.scrollTop = startScrollTop - deltaY;
      updatePolaroidScrollMaskState(page);
    }, { passive: true });

    content.addEventListener('touchend', stopDrag, { passive: true });
    content.addEventListener('touchcancel', stopDrag, { passive: true });
  }

  function applyPageEntryDecorations(page, pageContent = {}) {
    if (!page?.entryInfoPanel) return;
    const entry = pageContent?.entry;
    const structuredData = entry?.structuredData && typeof entry.structuredData === 'object'
      ? entry.structuredData
      : null;
    const shouldShowInfoPanel = !!(pageContent?.showInfoPanel && structuredData);
    const shouldShowIllustrationPanel = !!(pageContent?.showIllustrationPanel && structuredData);
    const activeBlockedRects = shouldShowInfoPanel
      ? blockedRects.concat(diaryInfoPanelBlockedRects)
      : blockedRects;

    applyPageLineLayout?.(page, activeBlockedRects);

    page.innerPage?.classList.toggle('has-entry-info-panel', shouldShowInfoPanel);
    page.innerPage?.classList.toggle('has-illustration-panel', shouldShowIllustrationPanel);

    page.entryInfoPanel.hidden = !shouldShowInfoPanel;
    if (page.entryIllustrationPanel) {
      page.entryIllustrationPanel.hidden = !shouldShowIllustrationPanel;
    }

    if (shouldShowInfoPanel) {
      if (page.entryInfoLine) {
        page.entryInfoLine.textContent = formatDiaryHeaderDateLine(
          structuredData['日期'] || entry?.title || '',
          structuredData['天气'] || ''
        );
      }
    } else {
      if (page.entryInfoLine) page.entryInfoLine.textContent = '';
    }

    if (shouldShowIllustrationPanel) {
      if (page.entryIllustrationScreenText) {
        page.entryIllustrationScreenText.textContent = String(structuredData['配图文本'] || '').trim() || '暂无配图描述';
        page.entryIllustrationScreenText.scrollTop = 0;
      }
      if (page.entryIllustrationMeta) {
        page.entryIllustrationMeta.textContent = formatPolaroidMetaLine(
          structuredData['拍摄日期'] || structuredData['日期'] || '',
          structuredData['拍摄地点'] || ''
        );
      }
      if (page.entryIllustrationSummary) {
        page.entryIllustrationSummary.textContent = formatPolaroidSummaryLine(structuredData['简略说明'] || '');
      }
      applyPolaroidMetaAutoFit(page);
      bindPolaroidScrollInteractions(page);
      requestAnimationFrame(() => updatePolaroidScrollMaskState(page));
    } else {
      if (page.entryIllustrationScreenText) {
        page.entryIllustrationScreenText.textContent = '';
        page.entryIllustrationScreenText.scrollTop = 0;
      }
      if (page.entryIllustrationMeta) {
        page.entryIllustrationMeta.textContent = '';
        page.entryIllustrationMeta.classList.remove('is-small', 'is-smaller');
      }
      if (page.entryIllustrationSummary) {
        page.entryIllustrationSummary.textContent = '';
      }
      requestAnimationFrame(() => updatePolaroidScrollMaskState(page));
    }
  }

  function rebuildDiaryPages(entriesSource = getDiaryEntries()) {
    const nextEntries = Array.isArray(entriesSource) ? entriesSource : [];
    pageContents = paginateEntries(nextEntries, { infoBlockedRects: diaryInfoPanelBlockedRects });
    totalPageCount = pageContents.length;
    backCoverPageIndex = totalPageCount;

    for (let i = 0; i < totalPageCount; i++) {
      const page = ensurePage(i);
      if (page) {
        page.wrapper.style.display = '';
      }
    }

    pages.forEach((page, index) => {
      const hasContentPage = index < totalPageCount;
      const pageContent = hasContentPage ? createPageContent(index + 1) : { text: '', entry: null, showInfoPanel: false, showIllustrationPanel: false };
      page.wrapper.style.display = hasContentPage ? '' : 'none';
      applyPageEntryDecorations(page, pageContent);
      distributeText(page, pageContent.text || '');
      normalizePage(page, 0);
      if (!hasContentPage) {
        page.wrapper.classList.remove('active', 'behind-page', 'flipped', 'unflipping', 'pre-return');
      }
    });

    if (currentPageIndex > backCoverPageIndex) {
      currentPageIndex = backCoverPageIndex;
    }

    refreshPageStates();
  }


  function positionGlobalPageMenu(page) {
    if (!pageNavHost || !page || !page.menuTrigger) {
      return;
    }

    const wrapperRect = page.wrapper.getBoundingClientRect();
    const triggerRect = page.menuTrigger.getBoundingClientRect();
    const hostLeft = triggerRect.left - wrapperRect.left - 66;
    const hostTop = triggerRect.top - wrapperRect.top + triggerRect.height / 2;
    pageNavHost.style.left = `${hostLeft}px`;
    pageNavHost.style.top = `${hostTop}px`;
  }

  function closeGlobalPageMenu() {
    if (!pageNavHost) {
      return;
    }

    pageNavHost.classList.remove('open');
    pageJumpInputWrapper?.classList.remove('open');
    menuOpenPageIndex = -1;
  }

  const settingsController = createSettingsController({
    settingsPageWrapper,
    notebookFrontWrapper,
    settingsPageContent,
    settingsMainChatContent,
    settingsPresetContent,
    settingsWorldBookContent,
    settingsAutoTriggerContent,
    closeGlobalPageMenu,
    animationDuration,
    getCurrentView: () => currentView,
    setCurrentView: (view) => {
      currentView = view;
    },
    isAnimatingRef: animationState,
  });

  function resetSettingsPages() {
    currentSettingsPageIndex = 0;
    settingsPages.forEach((page, index) => {
      page.wrapper.classList.remove('flipped', 'pre-return', 'unflipping', 'active', 'behind-page');
      page.wrapper.style.zIndex = '';
      page.wrapper.classList.toggle('is-first', index === 0);
      page.wrapper.classList.toggle('is-last', index === settingsPages.length - 1);
    });
  }

  function refreshSettingsPageStates() {
    settingsPages.forEach((page, index) => {
      const isSettingsActive = currentView === 'settings' && index === currentSettingsPageIndex;
      page.wrapper.classList.toggle('active', isSettingsActive);
      page.wrapper.classList.toggle('behind-page', currentView === 'settings' && index > currentSettingsPageIndex);
      page.wrapper.style.zIndex = String(70 + (settingsPages.length - index));
    });
  }

  function showSettingsSection() {
    if (animationState.value || currentView !== 'cover') {
      return;
    }

    resetSettingsPages();
    settingsController.refresh();

    if (settingsController.showSettingsPage()) {
      refreshPageStates();
      refreshSettingsPageStates();
    }
  }

  function hideSettingsToCover() {
    if (animationState.value || currentView !== 'settings') {
      return;
    }

    if (!settingsController.hideSettingsPage()) {
      return;
    }

    refreshPageStates();
    refreshSettingsPageStates();

    window.setTimeout(() => {
      resetSettingsPages();
      settingsController.refresh();
      refreshSettingsPageStates();
    }, animationDuration);
  }

  function flipSettingsForward() {
    if (animationState.value || currentView !== 'settings' || currentSettingsPageIndex >= settingsPages.length - 1) {
      return;
    }

    const currentSettingsPage = settingsPages[currentSettingsPageIndex];
    if (!currentSettingsPage) {
      return;
    }

    animationState.value = true;
    currentSettingsPage.wrapper.classList.add('flipped');
    currentSettingsPage.wrapper.classList.remove('active');
    currentSettingsPageIndex += 1;
    refreshSettingsPageStates();

    window.setTimeout(() => {
      animationState.value = false;
    }, animationDuration);
  }

  function flipSettingsBackward() {
    if (animationState.value || currentView !== 'settings') {
      return;
    }

    if (currentSettingsPageIndex === 0) {
      hideSettingsToCover();
      return;
    }

    const targetIndex = currentSettingsPageIndex - 1;
    const targetPage = settingsPages[targetIndex];
    if (!targetPage) {
      return;
    }

    animationState.value = true;
    targetPage.wrapper.classList.add('pre-return', 'unflipping');
    targetPage.wrapper.classList.remove('active');
    targetPage.wrapper.style.zIndex = String(900 + targetIndex);

    currentSettingsPageIndex = targetIndex;
    refreshSettingsPageStates();
    targetPage.wrapper.classList.add('pre-return', 'unflipping');
    targetPage.wrapper.style.zIndex = String(900 + targetIndex);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        targetPage.wrapper.classList.remove('pre-return');
        targetPage.wrapper.classList.remove('flipped');
      });
    });

    window.setTimeout(() => {
      targetPage.wrapper.classList.remove('unflipping');
      targetPage.wrapper.style.zIndex = '';
      refreshSettingsPageStates();
      animationState.value = false;
    }, animationDuration);
  }

  settingsPages.forEach((page) => {
    page.prevHotspot.addEventListener('click', (event) => {
      event.stopPropagation();
      const handledBySettingsSubview = settingsController.handleTopRightReturn?.(currentSettingsPageIndex) === true;
      if (handledBySettingsSubview) {
        return;
      }
      if (currentSettingsPageIndex === 0) {
        hideSettingsToCover();
        return;
      }
      flipSettingsBackward();
    });

    page.nextHotspot.addEventListener('click', (event) => {
      event.stopPropagation();
      flipSettingsForward();
    });
  });

  function renderJumpMenu(page) {
    if (!pageJumpMenu) {
      return;
    }

    pageJumpMenu.innerHTML = '';
    for (let i = 1; i <= totalPageCount; i++) {
      const item = document.createElement('div');
      item.className = 'page-jump-item';
      item.textContent = i;

      if (i === page.pageNumber) {
        item.classList.add('current');
      }

      item.addEventListener('click', (event) => {
        event.stopPropagation();
        pageJumpInputWrapper?.classList.remove('open');
        jumpToPage(i - 1, { keepMenuOpen: true });
      });

      pageJumpMenu.appendChild(item);
    }
  }

  function toggleGlobalPageMenu(page) {
    if (!pageNavHost || !page) {
      return;
    }

    const samePage = menuOpenPageIndex === currentPageIndex && pageNavHost.classList.contains('open');
    if (samePage) {
      closeGlobalPageMenu();
      return;
    }

    menuOpenPageIndex = currentPageIndex;
    positionGlobalPageMenu(page);
    renderJumpMenu(page);
    pageNavHost.classList.add('open');
    pageJumpInputWrapper?.classList.remove('open');
  }

  function jumpToPage(targetIndex, options = {}) {
    if (animationState.value || currentView !== 'diary' || targetIndex === currentPageIndex) {
      return;
    }

    if (targetIndex < 0 || targetIndex >= totalPageCount) {
      return;
    }

    const keepMenuOpen = options.keepMenuOpen === true;
    ensurePage(targetIndex);
    animationState.value = true;

    function syncMenusAfterJump() {
      if (!keepMenuOpen) {
        closeGlobalPageMenu();
        return;
      }

      menuOpenPageIndex = targetIndex;
      renderJumpMenu({ pageNumber: targetIndex + 1 });
      pageNavHost?.classList.add('open');
      pageJumpInputWrapper?.classList.remove('open');
    }

    if (keepMenuOpen) {
      menuOpenPageIndex = targetIndex;
      renderJumpMenu({ pageNumber: targetIndex + 1 });
      pageNavHost?.classList.add('open');
      pageJumpInputWrapper?.classList.remove('open');
    }

    if (targetIndex > currentPageIndex) {
      const animatedPage = pages[currentPageIndex];
      if (!animatedPage) {
        animationState.value = false;
        return;
      }

      for (let i = currentPageIndex + 1; i < targetIndex; i++) {
        const page = ensurePage(i);
        if (!page) {
          continue;
        }
        page.wrapper.classList.add('flipped');
        page.wrapper.classList.remove('pre-return', 'unflipping', 'active');
        page.wrapper.style.zIndex = '';
      }

      animatedPage.wrapper.classList.add('flipped');
      animatedPage.wrapper.classList.remove('active');
      currentPageIndex = targetIndex;
      refreshPageStates();

      window.setTimeout(() => {
        syncMenusAfterJump();
        animationState.value = false;
      }, animationDuration);
      return;
    }

    const targetPage = ensurePage(targetIndex);
    if (!targetPage) {
      animationState.value = false;
      return;
    }

    for (let i = targetIndex + 1; i < currentPageIndex; i++) {
      const page = ensurePage(i);
      if (!page) {
        continue;
      }
      page.wrapper.classList.remove('flipped', 'pre-return', 'unflipping', 'active');
      page.wrapper.style.zIndex = '';
    }

    targetPage.wrapper.classList.add('pre-return', 'unflipping');
    targetPage.wrapper.classList.remove('active');
    targetPage.wrapper.style.zIndex = String(1000 + targetIndex);

    currentPageIndex = targetIndex;
    refreshPageStates();
    targetPage.wrapper.classList.add('pre-return', 'unflipping');
    targetPage.wrapper.style.zIndex = String(1000 + targetIndex);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        targetPage.wrapper.classList.remove('pre-return');
        targetPage.wrapper.classList.remove('flipped');
      });
    });

    window.setTimeout(() => {
      targetPage.wrapper.classList.remove('unflipping');
      targetPage.wrapper.style.zIndex = '';
      refreshPageStates();
      syncMenusAfterJump();
      animationState.value = false;
    }, animationDuration);
  }

  function ensurePage(index) {
    if (index < 0 || index >= totalPageCount) {
      return null;
    }

    while (pages.length <= index) {
      const page = buildPage({
        pageNumber: pages.length + 1,
        lineCount,
        lineHeight,
        getLineLayout,
        onFlipForward: flipForward,
        onFlipBackward: flipBackward,
        onToggleMenu: toggleGlobalPageMenu,
      });

      pages.push(page);
      innerPagesHost.appendChild(page.wrapper);
      const pageContent = createPageContent(page.pageNumber);
      applyPageEntryDecorations(page, pageContent);
      distributeText(page, pageContent.text || '');
      normalizePage(page, 0);
    }

    return pages[index];
  }

  function refreshPageStates() {
    pages.forEach((page, index) => {
      const hasContentPage = index < totalPageCount;
      page.wrapper.style.display = hasContentPage ? '' : 'none';
      if (!hasContentPage) {
        page.wrapper.classList.remove('active', 'behind-page');
        page.wrapper.style.zIndex = String(100 + (pages.length - index));
        return;
      }

      const isDiaryActive = currentView === 'diary' && currentPageIndex < totalPageCount && index === currentPageIndex;
      page.wrapper.classList.toggle('active', isDiaryActive);
      page.wrapper.classList.toggle('behind-page', currentView === 'diary' && index > currentPageIndex && currentPageIndex < totalPageCount);
      page.wrapper.style.zIndex = String(100 + (pages.length - index));
    });

    if (backCoverReturnHint) {
      backCoverReturnHint.classList.toggle('active', currentView === 'diary' && currentPageIndex === backCoverPageIndex);
    }
  }

  function openDiaryFromCover() {
    if (animationState.value || currentView !== 'cover') {
      return;
    }

    closeGlobalPageMenu();
    currentView = 'diary';
    notebookFrontWrapper.classList.add('open');
    refreshPageStates();
    refreshSettingsPageStates();
  }

  function flipForward() {
    if (animationState.value || currentView !== 'diary' || currentPageIndex >= backCoverPageIndex) {
      return;
    }

    const currentPage = pages[currentPageIndex];
    if (!currentPage) {
      return;
    }

    if (currentPageIndex < totalPageCount - 1) {
      ensurePage(currentPageIndex + 1);
    }

    animationState.value = true;
    currentPage.wrapper.classList.add('flipped');
    currentPage.wrapper.classList.remove('active');
    currentPageIndex += 1;
    refreshPageStates();

    window.setTimeout(() => {
      animationState.value = false;
    }, animationDuration);
  }

  function closeFrontCover() {
    if (animationState.value) {
      return;
    }

    closeGlobalPageMenu();
    currentView = 'cover';
    animationState.value = true;
    notebookFrontWrapper.classList.add('pre-return');
    refreshPageStates();
    refreshSettingsPageStates();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        notebookFrontWrapper.classList.remove('pre-return');
        notebookFrontWrapper.classList.remove('open');
      });
    });

    window.setTimeout(() => {
      animationState.value = false;
    }, animationDuration);
  }

  function flipBackward() {
    if (animationState.value || currentView !== 'diary') {
      return;
    }

    if (currentPageIndex === 0) {
      closeFrontCover();
      return;
    }

    const targetIndex = currentPageIndex === backCoverPageIndex ? totalPageCount - 1 : currentPageIndex - 1;
    const targetPage = pages[targetIndex];
    if (!targetPage) {
      return;
    }

    animationState.value = true;
    targetPage.wrapper.classList.add('pre-return', 'unflipping');
    targetPage.wrapper.classList.remove('active');
    targetPage.wrapper.style.zIndex = String(1000 + targetIndex);

    currentPageIndex = targetIndex;
    refreshPageStates();
    targetPage.wrapper.classList.add('pre-return', 'unflipping');
    targetPage.wrapper.style.zIndex = String(1000 + targetIndex);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        targetPage.wrapper.classList.remove('pre-return');
        targetPage.wrapper.classList.remove('flipped');
      });
    });

    window.setTimeout(() => {
      targetPage.wrapper.classList.remove('unflipping');
      targetPage.wrapper.style.zIndex = '';
      refreshPageStates();
      animationState.value = false;
    }, animationDuration);
  }

  if (pageJumpCustomBtn && pageJumpInputWrapper && pageJumpInput && pageJumpConfirm) {
    pageJumpCustomBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      pageJumpInputWrapper.classList.toggle('open');
      if (pageJumpInputWrapper.classList.contains('open')) {
        pageJumpInput.focus();
      }
    });

    pageJumpInputWrapper.addEventListener('click', (event) => {
      event.stopPropagation();
    });

    const performGlobalCustomJump = () => {
      let value = Number.parseInt(pageJumpInput.value, 10);
      if (Number.isNaN(value) || value < 1) {
        value = 1;
      }
      if (value > totalPageCount) {
        value = totalPageCount;
      }

      pageJumpInput.value = '';
      pageJumpInputWrapper.classList.remove('open');
      jumpToPage(value - 1, { keepMenuOpen: true });
    };

    pageJumpConfirm.addEventListener('click', (event) => {
      event.stopPropagation();
      performGlobalCustomJump();
    });

    pageJumpInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        performGlobalCustomJump();
      }
    });
  }

  rebuildDiaryPages();

  window.addEventListener('butterflyDiary:entriesChanged', (event) => {
    rebuildDiaryPages(event?.detail?.entries || getDiaryEntries());
  });

  Promise.resolve(butterflyDiaryData.loadDiaryEntriesFromChatVariable?.())
    .catch((error) => {
      console.warn(`[Butterfly Diary] 读取日记聊天变量失败（历史：${String(butterflyDiaryData?.DIARY_HISTORY_VARIABLE_NAME || 'butterfly_journal_history')} / 最新：${String(butterflyDiaryData?.DIARY_VARIABLE_NAME || 'butterfly_journal_latest')}），已回退为默认日记。`, error);
    });

  resetSettingsPages();
  settingsController.refresh();

  notebookFrontWrapper.addEventListener('click', () => {
    openDiaryFromCover();
  });

  coverSettingsTrigger.addEventListener('click', (event) => {
    event.stopPropagation();
    showSettingsSection();
  });

  if (backCoverReturnHotspot) {
    backCoverReturnHotspot.addEventListener('click', (event) => {
      event.stopPropagation();
      if (currentPageIndex === backCoverPageIndex) {
        flipBackward();
      }
    });
  }

  function fitNotebookToViewport() {
    const notebookEl = document.querySelector('.notebook-container');
    if (!notebookEl || !document.documentElement) return;

    document.documentElement.style.setProperty('--embedded-notebook-scale', '1');

    const bodyStyle = window.getComputedStyle(document.body);
    const paddingX = (parseFloat(bodyStyle.paddingLeft) || 0) + (parseFloat(bodyStyle.paddingRight) || 0);
    const paddingY = (parseFloat(bodyStyle.paddingTop) || 0) + (parseFloat(bodyStyle.paddingBottom) || 0);
    const margin = 4;
    const rect = notebookEl.getBoundingClientRect();
    const availableWidth = Math.max(1, window.innerWidth - paddingX - margin * 2);
    const availableHeight = Math.max(1, window.innerHeight - paddingY - margin * 2);
    const scale = Math.min(availableWidth / rect.width, availableHeight / rect.height);

    document.documentElement.style.setProperty('--embedded-notebook-scale', String(scale));
    window.scrollTo(0, 0);
  }

  window.addEventListener('resize', fitNotebookToViewport);
  refreshPageStates();
  refreshSettingsPageStates();
  fitNotebookToViewport();
})();


