window.ButterflyDiaryData = (() => {
  const DIARY_VARIABLE_NAME = 'butterfly_journal_latest';
  const DIARY_HISTORY_VARIABLE_NAME = 'butterfly_journal_history';
  const LEGACY_DIARY_VARIABLE_NAMES = ['butterfly_journal', '日记'];
  const DIARY_SUMMARY_TAG_NAME = 'diary_summary';

  const defaultDiaryEntries = [
    {
      title: '第一则校园日记',
      content: '今天是周一，早上升旗的时候阳光特别亮，照得操场像铺了一层金色的薄纱。第一节是语文课，老师讲《背影》，读到父亲翻越月台那一段时，教室里突然安静下来，我也想起爸爸每天早起送我上学的样子。课间我和同桌去小卖部买了牛奶面包，回来的路上看见花坛边停着一只白色的小蝴蝶，扑闪扑闪地绕着灌木飞，像在偷偷听我们讲话。',
    },
    {
      title: '第二则校园日记',
      content: '今天数学小测有一道题我一开始完全没有思路，手心都紧张得有点出汗。后来我深呼吸，把老师昨天讲过的辅助线方法重新想了一遍，竟然真的做出来了。中午在食堂吃了番茄鸡蛋和土豆丝，味道比平时好很多。午休时窗外一直有风，吹得窗帘轻轻晃动，连写作业的心情也变得安静下来。原来校园里最舒服的时候，不一定是下课疯跑，而是这样平平淡淡的一小段时光。',
    },
    {
      title: '第三则校园日记',
      content: '下午的体育课我们练习接力跑，刚开始大家总是掉棒，后来一遍一遍磨合，终于跑得顺了起来。轮到我冲刺的时候，耳边全是同学们的加油声，虽然最后只拿了第二名，但那一瞬间真的觉得自己跑得像风一样快。放学前，班主任发下了上周的周记本，她在我的那一页旁边写了“观察很细腻，要继续保持”，看到这句话的时候，我偷偷开心了很久。',
    },
    {
      title: '第四则校园日记',
      content: '今天下了一场短短的阵雨，教学楼前的地面被洗得发亮，树叶颜色也比平时更深。晚自习前的天空居然出现了一点淡淡的晚霞，透过走廊玻璃看过去很好看。英语课上我鼓起勇气举手回答问题，虽然有个单词念得不太准，但老师还是朝我点了点头。以前总怕自己说错，现在慢慢觉得，愿意开口本身就已经是一种进步了。也许成长就是一次次不太完美地向前走。',
    },
    {
      title: '第五则校园日记',
      content: '这一周过得很快，转眼就到了周五。最后一节班会课，老师让我们写下最近最感谢的一件小事。我写的是：感谢前桌借给我修正带，感谢朋友在我心情不好的时候陪我去操场走了一圈，也感谢傍晚教室里那束刚好落在课桌上的夕阳。回家的路上，我背着书包经过校门，突然觉得校园日常虽然普通，却藏着很多会发光的小瞬间。以后我要把这些时刻都认真记下来。',
    },
    {
      title: '第六则校园日记',
      content: '周末早晨醒得特别早，看到阳光透过窗帘缝隙洒进来，心情意外地好。本来想接着睡，但还是起来把书桌整理了一遍。我发现上周用完的笔芯居然有五六根，原来不知不觉间写了这么多字。下午去了趟图书馆，在自习室靠窗的位置看了一下午书，中间抬头发呆时，看到一只小鸟停在外面的树枝上梳理羽毛，感觉整个世界都很安静。',
    },
    {
      title: '第七则校园日记',
      content: '今天是新的一周，大家似乎都有点没睡醒，早读课的声音比平时小很多。不过英语老师一进来，那干练的脚步声瞬间就把大家叫醒了。上午发了期中考的成绩单，虽然不是特别拔尖，但比上次进步了十几名，尤其是我最头疼的物理居然及格了！下课后我去办公室问问题，老师笑着拍了拍我的肩膀，那一刻我觉得以前的努力都没有白费。',
    },
    {
      title: '第八则校园日记',
      content: '天阴沉沉的，下午第一节课的时候突然下起了暴雨，豆大的雨点砸在玻璃上劈里啪啦响。教室里因为光线太暗提前开了灯。这种天气坐在明亮的教室里上课，反而有一种很特别的安全感。放学时雨还没停，我和朋友撑着伞在水坑里小心翼翼地走，结果一辆自行车飞快过去溅了我们一身水，我们没生气，反而看着对方狼狈的样子笑了一路。',
    },
    {
      title: '第九则校园日记',
      content: '今天轮到我值日，放学后留在教室扫地擦黑板。看着原本杂乱的教室一点点变得整洁，感觉心里也跟着变得敞亮起来。等我做完值日准备回家时，教学楼里已经没多少人了。走廊的尽头是被夕阳染红的天空，空气里有一种好闻的粉笔灰和雨后泥土混合的味道。我突然觉得，能在这样平静的日子里长大，其实是一件很幸运的事。',
    },
    {
      title: '第十则校园日记',
      content: '最近在听一首老歌，旋律非常舒缓，今天一整天都在脑海里单曲循环。中午吃完饭，和同桌在操场看了一会儿学长们打篮球。后来我们聊起了以后的梦想，她说想当个插画师，我说我还没想好，但希望能做一件让自己觉得开心和有意义的事。其实未来到底什么样谁也不知道，但只要每天都比昨天更好一点点，总会走到想去的地方吧。',
    },
  ];

  function padNumber(value) {
    return String(value).padStart(2, '0');
  }

  function createGeneratedDiaryTitle(date = new Date()) {
    const year = date.getFullYear();
    const month = padNumber(date.getMonth() + 1);
    const day = padNumber(date.getDate());
    const hours = padNumber(date.getHours());
    const minutes = padNumber(date.getMinutes());
    return `最新日记 ${year}-${month}-${day} ${hours}:${minutes}`;
  }

  function createGeneratedDiaryDateValue(date = new Date()) {
    const year = date.getFullYear();
    const month = padNumber(date.getMonth() + 1);
    const day = padNumber(date.getDate());
    return `${year}-${month}-${day}`;
  }

  function pickFirstNonEmptyString(values = []) {
    const matchedValue = (Array.isArray(values) ? values : []).find((value) => typeof value === 'string' && value.trim());
    return matchedValue ? matchedValue.trim() : '';
  }

  function escapeRegExp(text) {
    return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function hasStructuredDiaryFields(entry) {
    if (!entry || typeof entry !== 'object') return false;
    return [
      '日期',
      '天气',
      '心情',
      '配图文本',
      '日记内容',
      'date',
      'weather',
      'mood',
      'imageText',
      'image_text',
      'imagePrompt',
      'image_prompt',
      'diaryContent',
      'diary_content',
      'diaryText',
    ].some((key) => typeof entry?.[key] === 'string' && entry[key].trim());
  }

  function normalizeStructuredDiaryPayloadEntry(entry, index = 0) {
    if (!entry || typeof entry !== 'object' || !hasStructuredDiaryFields(entry)) {
      return null;
    }

    const normalizedEntry = {
      日期: pickFirstNonEmptyString([entry['日期'], entry.date, entry.day, entry.createdAt]) || createGeneratedDiaryDateValue(),
      天气: pickFirstNonEmptyString([entry['天气'], entry.weather, entry.climate]),
      心情: pickFirstNonEmptyString([entry['心情'], entry.mood, entry.feeling, entry.emotion]),
      配图文本: pickFirstNonEmptyString([entry['配图文本'], entry.imageText, entry.image_text, entry.imagePrompt, entry.image_prompt, entry.caption]),
      日记内容: pickFirstNonEmptyString([entry['日记内容'], entry.diaryContent, entry.diary_content, entry.diaryText, entry.content, entry.text, entry.message, entry.body]),
    };

    const hasMeaningfulBody = [normalizedEntry.天气, normalizedEntry.心情, normalizedEntry.配图文本, normalizedEntry.日记内容]
      .some((value) => String(value || '').trim());
    if (!hasMeaningfulBody) {
      return null;
    }

    return normalizedEntry;
  }

  function createDisplayDiaryEntryFromStructuredPayload(entry, index = 0, { fallbackTitlePrefix = '日记' } = {}) {
    const structuredPayload = normalizeStructuredDiaryPayloadEntry(entry, index);
    if (!structuredPayload) return null;

    return {
      title: pickFirstNonEmptyString([entry?.title, entry?.name, entry?.heading, structuredPayload['日期']])
        || (index === 0 && fallbackTitlePrefix === '最新日记' ? createGeneratedDiaryTitle() : `${fallbackTitlePrefix} ${index + 1}`),
      content: [
        `天气：${structuredPayload['天气']}`,
        `心情：${structuredPayload['心情']}`,
        `配图文本：${structuredPayload['配图文本']}`,
        `日记内容：${structuredPayload['日记内容']}`,
      ].join('\n'),
      structuredData: structuredPayload,
    };
  }

  function convertDiaryEntryToStructuredPayload(entry, index = 0) {
    const structuredPayload = normalizeStructuredDiaryPayloadEntry(entry, index)
      || normalizeStructuredDiaryPayloadEntry(entry?.structuredData, index);
    if (structuredPayload) {
      return structuredPayload;
    }

    if (typeof entry === 'string') {
      const normalizedText = entry.trim();
      if (!normalizedText) return null;
      return {
        日期: createGeneratedDiaryDateValue(),
        天气: '',
        心情: '',
        配图文本: '',
        日记内容: normalizedText,
      };
    }

    if (!entry || typeof entry !== 'object') {
      return null;
    }

    const title = pickFirstNonEmptyString([entry.title, entry.name, entry.heading]);
    const content = pickFirstNonEmptyString([entry.content, entry.text, entry.message, entry.body]);
    if (!title && !content) {
      return null;
    }

    return {
      日期: /^\d{4}-\d{2}-\d{2}/.test(title) ? title : createGeneratedDiaryDateValue(),
      天气: '',
      心情: '',
      配图文本: '',
      日记内容: content || title,
    };
  }

  function normalizeStructuredDiaryPayloadEntries(entries) {
    if (!Array.isArray(entries)) return [];
    return entries
      .map((entry, index) => convertDiaryEntryToStructuredPayload(entry, index))
      .filter(Boolean)
      .slice(0, 200);
  }

  function serializeStructuredDiaryPayloadEntries(entries) {
    return JSON.stringify(normalizeStructuredDiaryPayloadEntries(entries), null, 2);
  }

  function removeDiarySummaryTagFromText(rawText = '') {
    const normalizedText = unwrapCodeFence(rawText);
    if (!normalizedText) return '';
    return normalizedText
      .replace(new RegExp(`<${escapeRegExp(DIARY_SUMMARY_TAG_NAME)}>[\\s\\S]*?<\/${escapeRegExp(DIARY_SUMMARY_TAG_NAME)}>`, 'gi'), '')
      .trim();
  }

  function normalizeGeneratedDiaryJsonValue(rawValue) {
    let nextValue = rawValue;
    if (typeof nextValue === 'string') {
      const normalizedText = removeDiarySummaryTagFromText(nextValue);
      if (!normalizedText) return null;
      try {
        nextValue = JSON.parse(normalizedText);
      } catch (error) {
        return null;
      }
    }

    const sourceEntries = Array.isArray(nextValue)
      ? nextValue
      : (Array.isArray(nextValue?.entries)
        ? nextValue.entries
        : (nextValue && typeof nextValue === 'object' ? [nextValue] : []));

    const entries = sourceEntries
      .map((entry, index) => normalizeStructuredDiaryPayloadEntry(entry, index))
      .filter(Boolean)
      .slice(0, 200);

    if (!entries.length) {
      return null;
    }

    return {
      entries,
      rawValue: JSON.stringify(entries, null, 2),
    };
  }

  function unwrapCodeFence(text = '') {
    const normalizedText = String(text || '').trim();
    const matched = normalizedText.match(/^```(?:json|txt|text|markdown)?\s*([\s\S]*?)\s*```$/i);
    return matched ? String(matched[1] || '').trim() : normalizedText;
  }

  function extractTagContentWithTag(text, tagName) {
    const normalizedTag = String(tagName || '').trim();
    if (!normalizedTag) return '';
    const regex = new RegExp(`(<${escapeRegExp(normalizedTag)}>([\\s\\S]*?)<\/${escapeRegExp(normalizedTag)}>)`, 'gi');
    const matches = [];
    let match;
    while ((match = regex.exec(String(text || ''))) !== null) {
      matches.push(String(match[2] || '').trim());
    }
    return matches.join('\n\n').trim();
  }

  function extractDiarySummaryFromText(rawText = '') {
    const normalizedText = unwrapCodeFence(rawText);
    if (!normalizedText) return '';
    return extractTagContentWithTag(normalizedText, DIARY_SUMMARY_TAG_NAME);
  }

  function extractDiarySummaryFromRawValue(rawValue) {
    if (rawValue == null) return '';
    if (typeof rawValue === 'string') {
      return extractDiarySummaryFromText(rawValue);
    }
    if (rawValue && typeof rawValue === 'object') {
      return pickFirstNonEmptyString([
        rawValue.summary,
        rawValue['总结'],
        rawValue.summaryText,
        rawValue.summary_text,
        rawValue.diarySummary,
        rawValue.diary_summary,
      ]);
    }
    return '';
  }

  function normalizeDiaryVariablePayload(rawValue, fallbackEntries = []) {
    const summary = extractDiarySummaryFromRawValue(rawValue);
    const structuredEntries = normalizeStructuredDiaryPayloadEntries(fallbackEntries);
    return {
      summary,
      entries: structuredEntries,
    };
  }

  function serializeDiaryVariablePayload({ summary = '', entries = [] } = {}) {
    return JSON.stringify({
      summary: String(summary || '').trim(),
      entries: normalizeStructuredDiaryPayloadEntries(entries),
    }, null, 2);
  }

  function normalizeDiaryEntry(entry, index = 0, { fallbackTitlePrefix = '日记' } = {}) {
    if (typeof entry === 'string') {
      const content = entry.trim();
      if (!content) return null;
      return {
        title: index === 0 && fallbackTitlePrefix === '最新日记' ? createGeneratedDiaryTitle() : `${fallbackTitlePrefix} ${index + 1}`,
        content,
      };
    }

    if (!entry || typeof entry !== 'object') {
      return null;
    }

    const structuredDiaryEntry = createDisplayDiaryEntryFromStructuredPayload(entry, index, { fallbackTitlePrefix });
    if (structuredDiaryEntry) {
      return structuredDiaryEntry;
    }

    const title = pickFirstNonEmptyString([entry.title, entry.name, entry.date, entry.heading]);
    const content = pickFirstNonEmptyString([entry.content, entry.text, entry.message, entry.body]);

    if (!title && !content) {
      return null;
    }

    return {
      title: title || (index === 0 && fallbackTitlePrefix === '最新日记' ? createGeneratedDiaryTitle() : `${fallbackTitlePrefix} ${index + 1}`),
      content,
    };
  }

  function normalizeDiaryEntries(entries, options = {}) {
    if (!Array.isArray(entries)) return [];
    return entries
      .map((entry, index) => normalizeDiaryEntry(entry, index, options))
      .filter(Boolean)
      .slice(0, 200);
  }

  function diaryEntriesToText(entriesSource = runtimeDiaryEntries) {
    const entries = normalizeDiaryEntries(entriesSource, { fallbackTitlePrefix: '日记' });
    return entries
      .map((entry) => `${String(entry.title || '').trim()}：${String(entry.content || '').trim()}`.trim())
      .filter(Boolean)
      .join('\n\n')
      .trim();
  }

  function parseDiaryBlocksFromTaggedText(rawText = '') {
    const normalizedText = unwrapCodeFence(rawText);
    if (!normalizedText) return [];

    const regex = /(?:^|\n{2,})(?:标题|title)\s*[:：]\s*(.+?)\n(?:内容|content)\s*[:：]\s*([\s\S]*?)(?=(?:\n{2,}(?:标题|title)\s*[:：])|$)/gi;
    const matches = [];
    let match;
    while ((match = regex.exec(normalizedText)) !== null) {
      matches.push({
        title: String(match[1] || '').trim(),
        content: String(match[2] || '').trim(),
      });
    }
    return normalizeDiaryEntries(matches, { fallbackTitlePrefix: '日记' });
  }

  function parseDiaryVariableValue(rawValue) {
    if (Array.isArray(rawValue)) {
      return normalizeDiaryEntries(rawValue, { fallbackTitlePrefix: '日记' });
    }

    if (rawValue && typeof rawValue === 'object') {
      if (Array.isArray(rawValue.entries)) {
        return normalizeDiaryEntries(rawValue.entries, { fallbackTitlePrefix: '日记' });
      }
      const singleEntry = normalizeDiaryEntry(rawValue, 0, { fallbackTitlePrefix: '日记' });
      return singleEntry ? [singleEntry] : [];
    }

    const normalizedText = unwrapCodeFence(typeof rawValue === 'string' ? rawValue : String(rawValue ?? ''));
    if (!normalizedText) {
      return [];
    }

    try {
      const parsed = JSON.parse(normalizedText);
      const parsedEntries = parseDiaryVariableValue(parsed);
      if (parsedEntries.length) {
        return parsedEntries;
      }
    } catch (error) {}

    const taggedEntries = parseDiaryBlocksFromTaggedText(normalizedText);
    if (taggedEntries.length) {
      return taggedEntries;
    }

    return normalizeDiaryEntries([
      {
        title: createGeneratedDiaryTitle(),
        content: normalizedText,
      },
    ], { fallbackTitlePrefix: '最新日记' });
  }

  function getSTAPI() {
    try {
      if (window.ST_API) return window.ST_API;
    } catch (error) {}
    try {
      if (window.parent && window.parent !== window && window.parent.ST_API) return window.parent.ST_API;
    } catch (error) {}
    try {
      if (window.top && window.top !== window && window.top.ST_API) return window.top.ST_API;
    } catch (error) {}
    return null;
  }

  function getSillyTavernContext() {
    try {
      if (window.SillyTavern?.getContext) return window.SillyTavern.getContext();
    } catch (error) {}
    try {
      if (window.parent && window.parent !== window && window.parent.SillyTavern?.getContext) return window.parent.SillyTavern.getContext();
    } catch (error) {}
    try {
      if (window.top && window.top !== window && window.top.SillyTavern?.getContext) return window.top.SillyTavern.getContext();
    } catch (error) {}
    return null;
  }

  function getCurrentChatId() {
    const ctx = getSillyTavernContext();
    if (typeof ctx?.getCurrentChatId === 'function') {
      return String(ctx.getCurrentChatId() || '').trim();
    }
    return String(ctx?.chatId || '').trim();
  }

  let runtimeDiaryEntries = normalizeDiaryEntries(defaultDiaryEntries, { fallbackTitlePrefix: '校园日记' });
  let runtimeDiaryRawValue = '';
  let runtimeDiarySummary = '';
  let runtimeDiarySource = 'default';

  function getDiaryEntries() {
    return runtimeDiaryEntries.slice();
  }

  function getDiaryRawValue() {
    return String(runtimeDiaryRawValue || '').trim() || diaryEntriesToText(runtimeDiaryEntries);
  }

  function getDiarySummary() {
    return String(runtimeDiarySummary || '').trim();
  }

  function getDiaryTextForPrompt() {
    const rawValue = String(runtimeDiaryRawValue || '').trim();
    if (!rawValue) {
      return diaryEntriesToText(runtimeDiaryEntries);
    }

    const normalizedRawValue = unwrapCodeFence(rawValue);
    if (/^[\[{]/.test(normalizedRawValue) || /(?:^|\n)(?:标题|title)\s*[:：]/i.test(normalizedRawValue)) {
      return diaryEntriesToText(runtimeDiaryEntries);
    }

    return normalizedRawValue;
  }

  function dispatchDiaryEntriesChanged() {
    try {
      window.dispatchEvent(new CustomEvent('butterflyDiary:entriesChanged', {
        detail: {
          entries: getDiaryEntries(),
          rawValue: getDiaryRawValue(),
          summary: getDiarySummary(),
          source: runtimeDiarySource,
        },
      }));
    } catch (error) {}
  }

  function setRuntimeDiaryEntries(entries, { rawValue = '', summary = '', source = 'runtime', dispatch = true } = {}) {
    runtimeDiaryEntries = normalizeDiaryEntries(entries, { fallbackTitlePrefix: '日记' });
    runtimeDiaryRawValue = typeof rawValue === 'string' ? rawValue : String(rawValue ?? '');
    runtimeDiarySummary = String(summary || '').trim();
    runtimeDiarySource = String(source || 'runtime').trim() || 'runtime';

    api.diaryEntries = getDiaryEntries();
    api.rawDiaryValue = runtimeDiaryRawValue;
    api.summary = runtimeDiarySummary;
    api.source = runtimeDiarySource;

    if (dispatch) {
      dispatchDiaryEntriesChanged();
    }

    return getDiaryEntries();
  }

  async function tryLoadDiaryVariableValue(stApi, variableName) {
    try {
      const result = await stApi.variables.get({
        name: variableName,
        scope: 'local',
      });
      const rawValue = result?.value;
      const serializedRawValue = typeof rawValue === 'string'
        ? rawValue
        : (rawValue == null ? '' : JSON.stringify(rawValue, null, 2));
      const parsedEntries = parseDiaryVariableValue(rawValue);
      const summary = extractDiarySummaryFromRawValue(rawValue);
      if (!serializedRawValue && !parsedEntries.length && !summary) {
        return null;
      }
      return {
        variableName,
        rawValue,
        serializedRawValue,
        parsedEntries,
        summary,
      };
    } catch (error) {
      console.warn(`[Butterfly Diary] 读取聊天变量「${variableName}」失败`, error);
      return null;
    }
  }

  async function loadDiaryEntriesFromChatVariable({ expectedChatId = '' } = {}) {
    const stApi = getSTAPI();
    const currentChatId = getCurrentChatId();
    if (!currentChatId || (expectedChatId && currentChatId !== expectedChatId) || typeof stApi?.variables?.get !== 'function') {
      setRuntimeDiaryEntries(defaultDiaryEntries, { rawValue: '', summary: '', source: 'default', dispatch: true });
      return {
        ok: false,
        persisted: false,
        entries: getDiaryEntries(),
        rawValue: getDiaryRawValue(),
        source: runtimeDiarySource,
      };
    }

    const prioritizedVariableNames = [
      DIARY_HISTORY_VARIABLE_NAME,
      DIARY_VARIABLE_NAME,
      ...LEGACY_DIARY_VARIABLE_NAMES,
    ];

    for (const variableName of prioritizedVariableNames) {
      const loadedValue = await tryLoadDiaryVariableValue(stApi, variableName);
      if (!loadedValue) {
        continue;
      }

      if (loadedValue.parsedEntries.length) {
        const nextSource = variableName === DIARY_HISTORY_VARIABLE_NAME
          ? 'chat_history_variable'
          : (variableName === DIARY_VARIABLE_NAME ? 'chat_latest_variable' : 'legacy_chat_variable');
        setRuntimeDiaryEntries(loadedValue.parsedEntries, {
          rawValue: loadedValue.serializedRawValue,
          summary: loadedValue.summary,
          source: nextSource,
          dispatch: true,
        });
      } else {
        setRuntimeDiaryEntries(defaultDiaryEntries, { rawValue: '', summary: '', source: 'default', dispatch: true });
      }

      return {
        ok: true,
        persisted: variableName === DIARY_HISTORY_VARIABLE_NAME || variableName === DIARY_VARIABLE_NAME,
        variableName,
        entries: getDiaryEntries(),
        rawValue: getDiaryRawValue(),
        source: runtimeDiarySource,
      };
    }

    setRuntimeDiaryEntries(defaultDiaryEntries, { rawValue: '', summary: '', source: 'default', dispatch: true });
    return {
      ok: true,
      persisted: false,
      entries: getDiaryEntries(),
      rawValue: getDiaryRawValue(),
      source: runtimeDiarySource,
    };
  }

  async function saveDiaryValueToChatVariable(rawValue, {
    expectedChatId = '',
    source = 'chat_variable',
    mergeMode = 'append',
    updateLatest = true,
    updateHistory = true,
    historyMergeMode = '',
    summary = '',
  } = {}) {
    const serializedRawValue = typeof rawValue === 'string'
      ? rawValue
      : JSON.stringify(rawValue ?? '', null, 2);
    const parsedEntries = parseDiaryVariableValue(serializedRawValue);
    const latestEntries = parsedEntries.length
      ? parsedEntries
      : normalizeDiaryEntries([
        {
          title: createGeneratedDiaryTitle(),
          content: String(serializedRawValue || '').trim(),
        },
      ], { fallbackTitlePrefix: '最新日记' });

    const latestStructuredEntries = normalizeStructuredDiaryPayloadEntries(latestEntries);
    const resolvedSummary = pickFirstNonEmptyString([summary, extractDiarySummaryFromRawValue(rawValue)]);
    const latestRawValue = serializeDiaryVariablePayload({
      summary: resolvedSummary,
      entries: latestStructuredEntries.length ? latestStructuredEntries : latestEntries,
    });
    const latestDisplayEntries = normalizeDiaryEntries(latestStructuredEntries.length ? latestStructuredEntries : latestEntries, { fallbackTitlePrefix: '最新日记' });

    const shouldUpdateLatest = updateLatest !== false;
    const shouldUpdateHistory = updateHistory !== false;
    const normalizedHistoryMergeMode = String(historyMergeMode || mergeMode || '').trim() === 'replace' ? 'replace' : 'append';

    let persistedLatest = false;
    let persistedHistory = false;
    let historyStructuredEntries = [];
    let baseHistoryStructuredEntries = normalizeStructuredDiaryPayloadEntries(runtimeDiaryEntries);
    const stApi = getSTAPI();
    const currentChatId = getCurrentChatId();

    if (currentChatId && (!expectedChatId || currentChatId === expectedChatId) && typeof stApi?.variables?.set === 'function') {
      try {
        const historyBaseLoaded = await tryLoadDiaryVariableValue(stApi, DIARY_HISTORY_VARIABLE_NAME);
        const legacyBaseLoaded = historyBaseLoaded ? null : await tryLoadDiaryVariableValue(stApi, 'butterfly_journal');
        const baseHistoryEntries = historyBaseLoaded?.parsedEntries?.length
          ? historyBaseLoaded.parsedEntries
          : (legacyBaseLoaded?.parsedEntries?.length ? legacyBaseLoaded.parsedEntries : runtimeDiaryEntries);
        baseHistoryStructuredEntries = normalizeStructuredDiaryPayloadEntries(baseHistoryEntries);
      } catch (error) {}

      if (shouldUpdateLatest) {
        try {
          const latestResult = await stApi.variables.set({
            name: DIARY_VARIABLE_NAME,
            scope: 'local',
            value: latestRawValue,
          });
          persistedLatest = latestResult?.ok !== false;
        } catch (error) {
          console.warn(`[Butterfly Diary] 写入聊天变量「${DIARY_VARIABLE_NAME}」失败`, error);
        }
      }

      if (shouldUpdateHistory) {
        try {
          historyStructuredEntries = normalizedHistoryMergeMode === 'replace'
            ? latestStructuredEntries.slice(0, 200)
            : baseHistoryStructuredEntries.concat(latestStructuredEntries).slice(-200);
          const historyRawValue = serializeDiaryVariablePayload({
            summary: resolvedSummary,
            entries: historyStructuredEntries.length ? historyStructuredEntries : latestStructuredEntries,
          });

          const historyResult = await stApi.variables.set({
            name: DIARY_HISTORY_VARIABLE_NAME,
            scope: 'local',
            value: historyRawValue,
          });
          persistedHistory = historyResult?.ok !== false;

          if (persistedHistory && typeof stApi?.variables?.delete === 'function') {
            for (const legacyVariableName of LEGACY_DIARY_VARIABLE_NAMES) {
              try {
                await stApi.variables.delete({
                  name: legacyVariableName,
                  scope: 'local',
                });
              } catch (error) {}
            }
          }
        } catch (error) {
          console.warn(`[Butterfly Diary] 写入聊天变量「${DIARY_HISTORY_VARIABLE_NAME}」失败`, error);
        }
      }
    }

    const effectiveStructuredEntries = shouldUpdateHistory
      ? historyStructuredEntries
      : (baseHistoryStructuredEntries.length ? baseHistoryStructuredEntries : latestStructuredEntries);
    const runtimeEntries = normalizeDiaryEntries(
      effectiveStructuredEntries.length ? effectiveStructuredEntries : latestDisplayEntries,
      { fallbackTitlePrefix: '日记' }
    );
    const runtimeRawValue = serializeDiaryVariablePayload({
      summary: resolvedSummary,
      entries: effectiveStructuredEntries.length ? effectiveStructuredEntries : latestStructuredEntries,
    });

    setRuntimeDiaryEntries(runtimeEntries, {
      rawValue: runtimeRawValue,
      summary: resolvedSummary,
      source: shouldUpdateHistory
        ? (persistedHistory ? `${source}_history` : `${source}_runtime`)
        : (persistedLatest ? `${source}_latest_only` : `${source}_runtime`),
      dispatch: true,
    });

    return {
      ok: true,
      persisted: persistedLatest || persistedHistory,
      persistedLatest,
      persistedHistory,
      latestVariableName: DIARY_VARIABLE_NAME,
      historyVariableName: DIARY_HISTORY_VARIABLE_NAME,
      updateLatest: shouldUpdateLatest,
      updateHistory: shouldUpdateHistory,
      historyMergeMode: normalizedHistoryMergeMode,
      summary: getDiarySummary(),
      entries: getDiaryEntries(),
      rawValue: getDiaryRawValue(),
      source: runtimeDiarySource,
      mergeMode: normalizedHistoryMergeMode,
    };
  }

  const api = {
    DIARY_VARIABLE_NAME,
    DIARY_HISTORY_VARIABLE_NAME,
    DIARY_SUMMARY_TAG_NAME,
    LEGACY_DIARY_VARIABLE_NAMES,
    normalizeGeneratedDiaryJsonValue,
    normalizeStructuredDiaryPayloadEntries,
    serializeStructuredDiaryPayloadEntries,
    defaultDiaryEntries: normalizeDiaryEntries(defaultDiaryEntries, { fallbackTitlePrefix: '校园日记' }),
    diaryEntries: getDiaryEntries(),
    rawDiaryValue: runtimeDiaryRawValue,
    summary: runtimeDiarySummary,
    source: runtimeDiarySource,
    getDiaryEntries,
    getDiaryRawValue,
    getDiarySummary,
    getDiaryTextForPrompt,
    diaryEntriesToText,
    normalizeDiaryEntries,
    parseDiaryVariableValue,
    loadDiaryEntriesFromChatVariable,
    saveDiaryValueToChatVariable,
  };

  return api;
})();
