window.ButterflyDiaryPagination = {
  createTextLayout({ lineCount, lineHeight, pageWidth, blockedRects, defaultBlockedRects = blockedRects }) {
    function intersectsLine(rect, top, height) {
      const bottom = top + height;
      return rect.y < bottom && rect.y + rect.height > top;
    }

    function getLineLayoutForBlockedRects(index, activeBlockedRects = blockedRects) {
      const top = index * lineHeight;
      let leftInset = 0;
      let rightInset = 0;

      (Array.isArray(activeBlockedRects) ? activeBlockedRects : []).forEach((rect) => {
        if (!intersectsLine(rect, top, lineHeight)) {
          return;
        }

        const rectLeft = Math.max(0, rect.x);
        const rectRight = Math.min(pageWidth, rect.x + rect.width);
        if (rectRight <= 0 || rectLeft >= pageWidth) {
          return;
        }

        if (rectLeft <= pageWidth / 2) {
          leftInset = Math.max(leftInset, rectRight);
        } else {
          rightInset = Math.max(rightInset, pageWidth - rectLeft);
        }
      });

      return {
        left: leftInset,
        width: Math.max(0, pageWidth - leftInset - rightInset),
      };
    }

    function getLineLayout(index) {
      return getLineLayoutForBlockedRects(index, blockedRects);
    }

    function getPlainText(el) {
      return (el.textContent || '').replace(/\n/g, '');
    }

    function setPlainText(el, text) {
      el.textContent = text;
    }

    function fits(line) {
      return line.scrollWidth <= line.clientWidth + 1;
    }

    function splitToFit(line, text) {
      if (!text) {
        return ['', ''];
      }

      const normalizedText = String(text || '');
      const newlineIndex = normalizedText.indexOf('\n');
      if (newlineIndex === 0) {
        return ['', normalizedText.slice(1)];
      }

      const measureText = newlineIndex > 0 ? normalizedText.slice(0, newlineIndex) : normalizedText;
      setPlainText(line, measureText);
      if (fits(line) && newlineIndex > 0) {
        return [measureText, normalizedText.slice(newlineIndex + 1)];
      }
      if (fits(line) && newlineIndex < 0) {
        return [normalizedText, ''];
      }

      let low = 0;
      let high = measureText.length;
      let best = '';

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const candidate = measureText.slice(0, mid);
        setPlainText(line, candidate);

        if (fits(line)) {
          best = candidate;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      if (!best && measureText.length) {
        best = measureText.charAt(0);
      }

      return [best, normalizedText.slice(best.length)];
    }

    function splitIntoNotebookParagraphs(text = '') {
      return String(text || '')
        .replace(/\r\n?/g, '\n')
        .split(/\n+/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
        .map((paragraph) => `　　${paragraph}`);
    }

    function fillLinesFromParagraphs(lines, paragraphs = []) {
      const pageLineTexts = [];
      let paragraphIndex = 0;
      let paragraphRemaining = paragraphs[0] || '';

      for (const line of lines) {
        if (line.dataset.writeable !== 'true') {
          pageLineTexts.push('');
          continue;
        }

        while (!paragraphRemaining && paragraphIndex < paragraphs.length - 1) {
          paragraphIndex += 1;
          paragraphRemaining = paragraphs[paragraphIndex] || '';
        }

        if (!paragraphRemaining) {
          pageLineTexts.push('');
          setPlainText(line, '');
          continue;
        }

        const [fitText, overflow] = splitToFit(line, paragraphRemaining);
        pageLineTexts.push(fitText);
        paragraphRemaining = overflow;

        if (!paragraphRemaining) {
          paragraphIndex += 1;
          paragraphRemaining = paragraphs[paragraphIndex] || '';
        }
      }

      return {
        pageText: pageLineTexts.join('\n'),
        remainingParagraphs: paragraphRemaining
          ? [paragraphRemaining, ...paragraphs.slice(paragraphIndex + 1)]
          : paragraphs.slice(paragraphIndex),
      };
    }


    function findNearestWritable(lines, index, direction) {
      let i = index + direction;
      while (i >= 0 && i < lines.length) {
        if (lines[i].dataset.writeable === 'true') {
          return lines[i];
        }
        i += direction;
      }
      return null;
    }

    function createTempWritingArea(customBlockedRects = defaultBlockedRects) {
      const tempWritingArea = document.createElement('div');
      tempWritingArea.className = 'writing-area';
      tempWritingArea.style.left = '-9999px';
      tempWritingArea.style.top = '0';
      tempWritingArea.style.visibility = 'hidden';
      tempWritingArea.style.pointerEvents = 'none';

      const tempLines = [];
      for (let i = 0; i < lineCount; i++) {
        const layout = getLineLayoutForBlockedRects(i, customBlockedRects);
        const line = document.createElement('div');
        line.className = 'writing-line';
        line.dataset.writeable = layout.width > 24 ? 'true' : 'false';
        line.style.top = `${i * lineHeight}px`;
        line.style.left = `${layout.left}px`;
        line.style.width = `${layout.width}px`;
        tempWritingArea.appendChild(line);
        tempLines.push(line);
      }

      return { tempWritingArea, tempLines };
    }

    function paginateEntries(entries, { infoBlockedRects = [] } = {}) {
      const contentPages = [];
      const normalizedInfoBlockedRects = Array.isArray(infoBlockedRects) ? infoBlockedRects : [];

      entries.forEach((entry, entryIndex) => {
        const structuredData = entry?.structuredData && typeof entry.structuredData === 'object'
          ? entry.structuredData
          : null;
        const fullText = `${entry?.title || ''}：${entry?.content || ''}`.trim();
        const bodyParagraphs = structuredData && typeof structuredData['日记内容'] === 'string' && structuredData['日记内容'].trim()
          ? splitIntoNotebookParagraphs(structuredData['日记内容'])
          : splitIntoNotebookParagraphs(fullText);
        const shouldShowInfoPanel = !!(structuredData && [
          structuredData['日期'],
          structuredData['天气'],
          structuredData['心情'],
        ].some((value) => typeof value === 'string' && value.trim()));
        const hasIllustration = !!(structuredData && typeof structuredData['配图文本'] === 'string' && structuredData['配图文本'].trim());

        let remainingParagraphs = bodyParagraphs.length ? bodyParagraphs.slice() : (fullText ? [`　　${fullText}`] : []);
        let isFirstPageOfEntry = true;

        while (remainingParagraphs.length) {
          const activeBlockedRects = shouldShowInfoPanel && isFirstPageOfEntry
            ? defaultBlockedRects.concat(normalizedInfoBlockedRects)
            : defaultBlockedRects;
          const { tempWritingArea, tempLines } = createTempWritingArea(activeBlockedRects);
          document.body.appendChild(tempWritingArea);

          const { pageText, remainingParagraphs: nextRemainingParagraphs } = fillLinesFromParagraphs(tempLines, remainingParagraphs);

          document.body.removeChild(tempWritingArea);
          contentPages.push({
            text: pageText,
            entry,
            entryIndex,
            showInfoPanel: shouldShowInfoPanel && isFirstPageOfEntry,
            showIllustrationPanel: false,
          });
          remainingParagraphs = nextRemainingParagraphs;
          isFirstPageOfEntry = false;
        }

        if (hasIllustration) {
          contentPages.push({
            text: '',
            entry,
            entryIndex,
            showInfoPanel: false,
            showIllustrationPanel: true,
          });
        }
      });

      return contentPages.length
        ? contentPages
        : [{ text: '', entry: null, entryIndex: -1, showInfoPanel: false, showIllustrationPanel: false }];
    }

    function applyPageLineLayout(page, activeBlockedRects = blockedRects) {
      const lines = Array.isArray(page?.lines) ? page.lines : [];
      lines.forEach((line, index) => {
        const layout = getLineLayoutForBlockedRects(index, activeBlockedRects);
        line.dataset.writeable = layout.width > 24 ? 'true' : 'false';
        line.style.top = `${index * lineHeight}px`;
        line.style.left = `${layout.left}px`;
        line.style.width = `${layout.width}px`;
        line.classList.toggle('blocked', layout.width <= 24);
        if (layout.width <= 24) {
          setPlainText(line, '');
        }
      });
    }

    function normalizePage(page, startIndex = 0) {
      const { lines } = page;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i];
        if (line.dataset.writeable !== 'true') {
          continue;
        }

        const [fitText, overflow] = splitToFit(line, getPlainText(line));
        setPlainText(line, fitText);

        if (overflow) {
          const next = findNearestWritable(lines, i, 1);
          if (!next) {
            break;
          }
          setPlainText(next, overflow + getPlainText(next));
        }
      }

    }

    function distributeText(page, fullText) {
      let remainingText = fullText;
      page.lines.forEach((line) => {
        if (line.dataset.writeable !== 'true') {
          setPlainText(line, '');
          return;
        }

        if (!remainingText) {
          setPlainText(line, '');
          return;
        }

        const [fitText, overflow] = splitToFit(line, remainingText);
        setPlainText(line, fitText);
        remainingText = overflow;
      });
    }

    return {
      getLineLayout,
      getLineLayoutForBlockedRects,
      applyPageLineLayout,
      paginateEntries,
      normalizePage,
      distributeText,
    };
  },
};
