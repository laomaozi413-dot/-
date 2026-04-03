window.ButterflyDiaryPageFactory = {
  buildPage({
    pageNumber,
    lineCount,
    lineHeight,
    getLineLayout,
    onFlipForward,
    onFlipBackward,
    onToggleMenu,
  }) {
    const wrapper = document.createElement('div');
    wrapper.className = 'notebook-inner-page-wrapper';
    wrapper.dataset.pageNumber = String(pageNumber);

    wrapper.innerHTML = `
      <div class="notebook-inner-page-back"></div>
      <div class="notebook-inner-page">
        <div class="turn-page-hotspot" title="翻到下一页"></div>
        <div class="turn-back-hotspot" title="翻回上一页"></div>
        <div class="menu-trigger-hotspot" title="页面导航"></div>

        <div class="butterfly-container inner-page-butterflies">
          <img class="butterfly butterfly-turn-next" src="assets/butterfly14.png" style="left: 263px; top: 399px; width: 118px; height: 123px;" alt="">
          <img class="butterfly butterfly-menu-trigger" src="assets/butterfly15.png" style="left: 8px; top: 253px; width: 42px; height: 40px;" alt="">
          <img class="butterfly butterfly-turn-prev" src="assets/butterfly16.png" style="left: 334px; top: 38px; width: 42px; height: 44px;" alt="">
        </div>
        <div class="diary-entry-info-panel" hidden>
          <div class="diary-entry-info-line"></div>
        </div>
        <div class="diary-entry-illustration-panel" hidden>
          <div class="diary-entry-polaroid-frame">
            <div class="diary-entry-polaroid-screen">
              <div class="diary-entry-polaroid-screen-text"></div>
            </div>
            <div class="diary-entry-polaroid-body">
              <div class="diary-entry-polaroid-meta-line diary-entry-polaroid-meta"></div>
              <div class="diary-entry-polaroid-meta-line diary-entry-polaroid-summary"></div>
            </div>
          </div>
        </div>
        <div class="writing-area"></div>
      </div>
    `;

    const innerPage = wrapper.querySelector('.notebook-inner-page');
    const writingArea = wrapper.querySelector('.writing-area');
    const lines = [];

    for (let i = 0; i < lineCount; i++) {
      const layout = getLineLayout(i);
      const line = document.createElement('div');
      line.className = 'writing-line';
      line.dataset.writeable = layout.width > 24 ? 'true' : 'false';
      line.dataset.index = String(i);
      line.style.top = `${i * lineHeight}px`;
      line.style.left = `${layout.left}px`;
      line.style.width = `${layout.width}px`;
      if (layout.width <= 24) {
        line.classList.add('blocked');
      }
      writingArea.appendChild(line);
      lines.push(line);
    }

    const page = {
      pageNumber,
      wrapper,
      innerPage,
      writingArea,
      lines,
      entryInfoPanel: wrapper.querySelector('.diary-entry-info-panel'),
      entryInfoLine: wrapper.querySelector('.diary-entry-info-line'),
      entryIllustrationPanel: wrapper.querySelector('.diary-entry-illustration-panel'),
      entryIllustrationScreen: wrapper.querySelector('.diary-entry-polaroid-screen'),
      entryIllustrationScreenText: wrapper.querySelector('.diary-entry-polaroid-screen-text'),
      entryIllustrationMeta: wrapper.querySelector('.diary-entry-polaroid-meta'),
      entryIllustrationSummary: wrapper.querySelector('.diary-entry-polaroid-summary'),
      nextHotspot: wrapper.querySelector('.turn-page-hotspot'),
      prevHotspot: wrapper.querySelector('.turn-back-hotspot'),
      menuTrigger: wrapper.querySelector('.menu-trigger-hotspot'),
    };

    page.nextHotspot.addEventListener('click', (event) => {
      event.stopPropagation();
      onFlipForward?.(page, event);
    });

    page.prevHotspot.addEventListener('click', (event) => {
      event.stopPropagation();
      onFlipBackward?.(page, event);
    });

    page.menuTrigger.addEventListener('click', (event) => {
      event.stopPropagation();
      onToggleMenu?.(page, event);
    });

    return page;
  },
};
