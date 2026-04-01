window.ButterflyDiaryPagination = {
  createTextLayout({ lineCount, lineHeight, pageWidth, blockedRects }) {
    function intersectsLine(rect, top, height) {
      const bottom = top + height;
      return rect.y < bottom && rect.y + rect.height > top;
    }

    function getLineLayout(index) {
      const top = index * lineHeight;
      let leftInset = 0;
      let rightInset = 0;

      blockedRects.forEach((rect) => {
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

      setPlainText(line, text);
      if (fits(line)) {
        return [text, ''];
      }

      let low = 0;
      let high = text.length;
      let best = '';

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const candidate = text.slice(0, mid);
        setPlainText(line, candidate);

        if (fits(line)) {
          best = candidate;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      if (!best && text.length) {
        best = text.charAt(0);
      }

      return [best, text.slice(best.length)];
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

    function paginateEntries(entries) {
      const tempWritingArea = document.createElement('div');
      tempWritingArea.className = 'writing-area';
      tempWritingArea.style.left = '-9999px';
      tempWritingArea.style.top = '0';
      tempWritingArea.style.visibility = 'hidden';
      tempWritingArea.style.pointerEvents = 'none';

      const tempLines = [];
      for (let i = 0; i < lineCount; i++) {
        const layout = getLineLayout(i);
        const line = document.createElement('div');
        line.className = 'writing-line';
        line.dataset.writeable = layout.width > 24 ? 'true' : 'false';
        line.style.top = `${i * lineHeight}px`;
        line.style.left = `${layout.left}px`;
        line.style.width = `${layout.width}px`;
        tempWritingArea.appendChild(line);
        tempLines.push(line);
      }

      document.body.appendChild(tempWritingArea);
      const contentPages = [];

      entries.forEach((entry) => {
        const fullText = `${entry.title}：${entry.content}`;
        let remainingText = fullText.trim();

        while (remainingText) {
          let pageText = '';
          for (const line of tempLines) {
            if (line.dataset.writeable !== 'true') {
              continue;
            }

            const [fitText, overflow] = splitToFit(line, remainingText);
            pageText += fitText;
            remainingText = overflow;
            if (!remainingText) {
              break;
            }
          }
          contentPages.push(pageText);
        }
      });

      document.body.removeChild(tempWritingArea);
      return contentPages.length ? contentPages : [''];
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

      for (let i = 0; i < lines.length - 1; i++) {
        const current = lines[i];
        if (current.dataset.writeable !== 'true') {
          continue;
        }

        const next = findNearestWritable(lines, i, 1);
        if (!next) {
          break;
        }

        let currentText = getPlainText(current);
        let nextText = getPlainText(next);
        if (!nextText) {
          continue;
        }

        while (nextText) {
          const attempt = currentText + nextText.charAt(0);
          setPlainText(current, attempt);
          if (fits(current)) {
            currentText = attempt;
            nextText = nextText.slice(1);
            setPlainText(next, nextText);
          } else {
            setPlainText(current, currentText);
            break;
          }
        }
      }
    }

    function distributeText(page, fullText) {
      let remainingText = fullText;
      page.lines.forEach((line) => {
        if (line.dataset.writeable !== 'true') {
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
      paginateEntries,
      normalizePage,
      distributeText,
    };
  },
};
