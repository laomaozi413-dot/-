window.ButterflyDiarySettings = {
  createSettingsController({
    settingsPageWrapper,
    notebookFrontWrapper,
    settingsPageContent,
    settingsMainChatContent,
    settingsPresetContent,
    settingsWorldBookContent,
    settingsAutoTriggerContent,
    closeGlobalPageMenu,
    animationDuration,
    getCurrentView,
    setCurrentView,
    isAnimatingRef,
  }) {
    const STORAGE_KEY = 'butterflyDiary.aiSettings';

    function clampAiNumberSetting(value, min, max) {
      if (value === '' || value == null) return '';
      const nextValue = Number(value);
      if (!Number.isFinite(nextValue)) return '';
      return String(Math.min(max, Math.max(min, nextValue)));
    }

    function clampAiIntegerSetting(value, min, max, fallback = '') {
      if (value === '' || value == null) return fallback;
      const nextValue = Number.parseInt(String(value).trim(), 10);
      if (!Number.isFinite(nextValue)) return fallback;
      return String(Math.min(max, Math.max(min, nextValue)));
    }

    function normalizeAiMainChatRules(rules) {
      if (!Array.isArray(rules)) return [];
      return rules
        .map((rule) => ({
          tag: typeof rule?.tag === 'string' ? rule.tag.trim() : '',
          mode: rule?.mode === 'exclude' ? 'exclude' : 'recent',
          n: rule?.n === '' || rule?.n == null ? '' : clampAiIntegerSetting(rule.n, 0, 99, ''),
        }))
        .slice(0, 20);
    }

    function createDefaultProfile(index = 0, profile = {}) {
      return {
        id: typeof profile.id === 'string' && profile.id.trim() ? profile.id.trim() : `ai_api_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`,
        name: typeof profile.name === 'string' && profile.name.trim() ? profile.name.trim() : (index === 0 ? '默认API' : `API ${index + 1}`),
        url: normalizeAiEndpoint(profile.url),
        key: typeof profile.key === 'string' ? profile.key.trim() : '',
        model: typeof profile.model === 'string' ? profile.model.trim() : '',
        temperature: clampAiNumberSetting(profile.temperature, 0, 2),
        topP: clampAiNumberSetting(profile.topP, 0, 1),
        modelCache: normalizeAiModelCache(profile.modelCache),
      };
    }

    function normalizeAiEndpoint(endpoint) {
      const normalizedEndpoint = String(endpoint || '').trim().replace(/\/+$/, '');
      if (!normalizedEndpoint) return '';
      if (/\/chat\/completions$/i.test(normalizedEndpoint)) return normalizedEndpoint;
      return `${normalizedEndpoint}/chat/completions`;
    }

    function getAiModelsEndpoint(endpoint) {
      const normalizedEndpoint = normalizeAiEndpoint(endpoint);
      if (!normalizedEndpoint) return '';
      return normalizedEndpoint.replace(/\/chat\/completions$/i, '/models');
    }

    function normalizeAiModelCache(modelCache) {
      return Array.isArray(modelCache)
        ? modelCache.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 200)
        : [];
    }

    function isAiApiProfileMeaningful(profile) {
      if (!profile || typeof profile !== 'object') return false;
      return Boolean(
        String(profile.url || '').trim()
        || String(profile.key || '').trim()
        || String(profile.model || '').trim()
        || (Array.isArray(profile.modelCache) && profile.modelCache.length)
      );
    }

    function normalizeAiApiProfiles(profiles) {
      if (!Array.isArray(profiles)) return [];
      return profiles
        .map((profile, index) => createDefaultProfile(index, profile))
        .filter((profile) => isAiApiProfileMeaningful(profile))
        .slice(0, 20);
    }

    function normalizeAiPresetInfoRole(role = 'system') {
      const normalizedRole = typeof role === 'string' ? role.trim() : '';
      return ['system', 'user', 'assistant'].includes(normalizedRole) ? normalizedRole : 'system';
    }

    function normalizeAiPresetBlock(block, index = 0) {
      const rawRole = typeof block?.role === 'string' ? block.role.trim() : '';
      const role = ['system', 'user', 'assistant', '_context', '_info'].includes(rawRole) ? rawRole : 'user';
      return {
        id: typeof block?.id === 'string' && block.id.trim() ? block.id.trim() : `ai_preset_block_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`,
        role,
        name: typeof block?.name === 'string' ? block.name.trim().slice(0, 32) : '',
        text: ['_context', '_info'].includes(role) ? '' : String(block?.text || ''),
        infoSourceId: role === '_info' && typeof block?.infoSourceId === 'string' ? block.infoSourceId.trim() : '',
        infoRole: role === '_info' ? normalizeAiPresetInfoRole(block?.infoRole) : '',
      };
    }

    function normalizeAiPresetBlocks(blocks) {
      if (!Array.isArray(blocks)) return [];
      return blocks
        .map((block, index) => normalizeAiPresetBlock(block, index))
        .slice(0, 60);
    }

    function createAiWorldBookSelectionId(index = 0) {
      return `worldbook_selection_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`;
    }

    function createAiWorldBookInfoBindingId(index = 0) {
      return `worldbook_info_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`;
    }

    function normalizeAiWorldBookInfoBindings(bindings) {
      if (!Array.isArray(bindings)) return [];
      return bindings
        .map((binding, index) => ({
          id: typeof binding?.id === 'string' && binding.id.trim() ? binding.id.trim() : createAiWorldBookInfoBindingId(index),
          sourceId: typeof binding?.sourceId === 'string' ? binding.sourceId.trim() : '',
          sourceName: typeof binding?.sourceName === 'string' ? binding.sourceName.trim() : '',
          sourceScope: typeof binding?.sourceScope === 'string' ? binding.sourceScope.trim() : '',
        }))
        .filter((binding) => binding.sourceId || binding.sourceName)
        .slice(0, 50);
    }

    function normalizeAiWorldBookEntries(entries) {
      if (!Array.isArray(entries)) return [];
      return entries
        .map((entry, index) => ({
          id: typeof entry?.id === 'string' && entry.id.trim() ? entry.id.trim() : createAiWorldBookSelectionId(index),
          sourceId: typeof entry?.sourceId === 'string' && entry.sourceId.trim()
            ? entry.sourceId.trim()
            : `${typeof entry?.scope === 'string' && entry.scope.trim() ? entry.scope.trim() : 'global'}:${typeof entry?.ownerId === 'string' ? entry.ownerId.trim() : ''}:${typeof entry?.name === 'string' ? entry.name.trim() : ''}`,
          name: typeof entry?.name === 'string' ? entry.name.trim() : '',
          scope: typeof entry?.scope === 'string' && entry.scope.trim() ? entry.scope.trim() : 'global',
          ownerId: typeof entry?.ownerId === 'string' ? entry.ownerId.trim() : '',
          mainChatContextN: entry?.mainChatContextN === '' || entry?.mainChatContextN == null ? '10' : clampAiIntegerSetting(entry.mainChatContextN, 0, 99, '10'),
          mainChatUserN: entry?.mainChatUserN === '' || entry?.mainChatUserN == null ? '' : clampAiIntegerSetting(entry.mainChatUserN, 0, 99, ''),
          mainChatXmlRules: normalizeAiMainChatRules(entry?.mainChatXmlRules),
          infoSourceBindings: normalizeAiWorldBookInfoBindings(entry?.infoSourceBindings),
        }))
        .filter((entry) => entry.name)
        .slice(0, 100);
    }

    function normalizeAiSettings(settings) {
      const nextSettings = settings && typeof settings === 'object' ? settings : {};
      const apiProfiles = normalizeAiApiProfiles(nextSettings.apiProfiles);
      const selectedApiProfileId = resolveSelectedAiApiProfileId(nextSettings.selectedApiProfileId, apiProfiles);
      const selectedProfile = apiProfiles.find((profile) => profile.id === selectedApiProfileId) || null;
      return {
        apiProfiles,
        selectedApiProfileId,
        url: selectedProfile?.url || '',
        key: selectedProfile?.key || '',
        model: selectedProfile?.model || '',
        temperature: selectedProfile?.temperature || '',
        topP: selectedProfile?.topP || '',
        mainChatContextN: nextSettings.mainChatContextN === ''
          ? ''
          : (nextSettings.mainChatContextN == null ? '10' : clampAiIntegerSetting(nextSettings.mainChatContextN, 0, 99, '10')),
        mainChatUserN: nextSettings.mainChatUserN === '' || nextSettings.mainChatUserN == null
          ? ''
          : clampAiIntegerSetting(nextSettings.mainChatUserN, 0, 99, ''),
        mainChatXmlRules: normalizeAiMainChatRules(nextSettings.mainChatXmlRules),
        presetBlocks: normalizeAiPresetBlocks(nextSettings.presetBlocks),
        worldBookEntries: normalizeAiWorldBookEntries(nextSettings.worldBookEntries),
        journalAutoTriggerEnabled: Boolean(nextSettings.journalAutoTriggerEnabled),
        journalAutoTriggerRole: ['assistant', 'user'].includes(String(nextSettings.journalAutoTriggerRole || '').trim())
          ? String(nextSettings.journalAutoTriggerRole).trim()
          : 'assistant',
        journalAutoTriggerInterval: clampAiIntegerSetting(nextSettings.journalAutoTriggerInterval, 1, 99, '1'),
        journalAutoTriggerWriteMode: ['append', 'replace'].includes(String(nextSettings.journalAutoTriggerWriteMode || '').trim())
          ? String(nextSettings.journalAutoTriggerWriteMode).trim()
          : 'append',
        manualGenerateLatestMode: ['latest_only', 'latest_and_history'].includes(String(nextSettings.manualGenerateLatestMode || '').trim())
          ? String(nextSettings.manualGenerateLatestMode).trim()
          : 'latest_only',
        manualGenerateHistoryMode: ['append', 'replace'].includes(String(nextSettings.manualGenerateHistoryMode || '').trim())
          ? String(nextSettings.manualGenerateHistoryMode).trim()
          : 'append',
      };
    }

    function resolveSelectedAiApiProfileId(profileId, profiles) {
      const targetId = typeof profileId === 'string' ? profileId.trim() : '';
      if (targetId && profiles.some((profile) => profile.id === targetId)) {
        return targetId;
      }
      return profiles[0]?.id || '';
    }

    function getAiProfileById(profileId, settingsSource) {
      const settings = normalizeAiSettings(settingsSource);
      const targetId = typeof profileId === 'string' ? profileId.trim() : '';
      if (!targetId) return null;
      return settings.apiProfiles.find((profile) => profile.id === targetId) || null;
    }

    function getSelectedAiApiProfile(settingsSource = aiSettings) {
      const settings = normalizeAiSettings(settingsSource);
      return getAiProfileById(settings.selectedApiProfileId, settings);
    }

    function getAiApiHostLabel(endpoint) {
      try {
        const url = new URL(normalizeAiEndpoint(endpoint));
        return String(url.host || '').replace(/^api\./i, '').trim();
      } catch (error) {
        return '';
      }
    }

    function escapeHtml(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function escapeRegExp(text) {
      return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function extractTagContentWithTag(text, tagName) {
      const normalizedTag = String(tagName || '').trim();
      if (!normalizedTag) return '';
      const regex = new RegExp(`(<${escapeRegExp(normalizedTag)}>[\\s\\S]*?<\/${escapeRegExp(normalizedTag)}>)`, 'gi');
      const matches = [];
      let match;
      while ((match = regex.exec(String(text || ''))) !== null) {
        matches.push(String(match[1] || '').trim());
      }
      return matches.join('\n\n');
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

    function getTextFromSTMessage(message) {
      if (!message) return '';
      if (typeof message.content === 'string') return message.content.trim();
      if (Array.isArray(message.content)) {
        return message.content.map((part) => typeof part === 'string' ? part : part?.text || '').join('').trim();
      }
      if (Array.isArray(message.parts)) {
        return message.parts.map((part) => part?.text || '').join('').trim();
      }
      if (typeof message.mes === 'string') return message.mes.trim();
      return '';
    }

    function normalizeSTMainChatMessages(rawMessages) {
      if (!Array.isArray(rawMessages)) return [];
      return rawMessages
        .map((message) => {
          const rawRole = String(message?.role || '').trim().toLowerCase();
          const isUserMessage = rawRole === 'user' || message?.is_user === true;
          const isAssistantMessage = rawRole === 'assistant' || rawRole === 'model' || message?.is_user === false;
          const role = isUserMessage ? 'user' : (isAssistantMessage ? 'assistant' : '');
          return {
            role,
            content: getTextFromSTMessage(message),
          };
        })
        .filter((message) => (message.role === 'user' || message.role === 'assistant') && message.content);
    }

    async function getSTMainChatMessages() {
      const stApi = getSTAPI();
      if (stApi?.chatHistory?.list) {
        try {
          const result = await stApi.chatHistory.list({ format: 'openai' });
          return normalizeSTMainChatMessages(result?.messages || []);
        } catch (error) {
          console.warn('[Butterfly Diary][主聊天] ST_API.chatHistory.list 读取失败，改用 SillyTavern.getContext().chat', error);
        }
      }
      const ctx = getSillyTavernContext();
      return normalizeSTMainChatMessages(ctx?.chat || []);
    }

    function getAiMainChatSummaryLabel(settingsSource = aiSettings) {
      const settings = normalizeAiSettings(settingsSource);
      const isDefault = settings.mainChatContextN === '10'
        && settings.mainChatUserN === ''
        && !normalizeAiMainChatRules(settings.mainChatXmlRules).some((rule) => String(rule?.tag || '').trim() || String(rule?.n || '').trim());
      return isDefault ? '默认' : '已设';
    }

    function getAiPresetBlockDisplayName(block, index = 0) {
      const role = String(block?.role || '').trim();
      if (role === '_context') return '主聊天';
      if (role === '_info') return block?.name || '信息块';
      if (block?.name) return block.name;
      return `消息块 ${index + 1}`;
    }

    function getAiPresetBlockSubtitle(block) {
      const role = String(block?.role || '').trim();
      if (role === 'system') return 'system';
      if (role === 'assistant') return 'assistant';
      if (role === 'user') return 'user';
      if (role === '_context') return '上下文槽';
      if (role === '_info') return `信息块 · ${normalizeAiPresetInfoRole(block?.infoRole)}`;
      return '';
    }

    function getAiPresetSummaryLabel(blocksSource = pendingAiPresetBlocks) {
      const blocks = normalizeAiPresetBlocks(blocksSource);
      return blocks.length ? `${blocks.length} 块` : '空';
    }

    let aiSettings = normalizeAiSettings(loadSettings());

    let pendingAiApiProfileId = '';
    let pendingAiApiName = '';
    let pendingAiUrl = '';
    let pendingAiKey = '';
    let pendingAiModel = '';
    let pendingAiTemperature = '';
    let pendingAiTopP = '';
    let aiConfigConnectionState = 'idle';
    let aiConfigStatusMessage = '';
    let aiConfigSubView = 'list';
    let selectedAiModelIndex = -1;

    let pendingAiMainChatContextN = '10';
    let pendingAiMainChatUserN = '';
    let pendingAiMainChatXmlRules = [];
    let aiMainChatStatusMessage = '';
    let aiMainChatSubView = 'main';
    let aiMainChatPreviewText = '';
    let aiMainChatPreviewStatus = '';
    let aiMainChatModeFlashIndex = -1;
    let aiMainChatModeFlashTimer = null;

    let pendingAiPresetBlocks = [];
    let selectedAiPresetBlockIndex = -1;
    let editingAiPresetBlockIndex = -1;
    let pendingAiPresetBlockDraft = null;
    let aiPresetStatusMessage = '';
    let aiPresetSubView = 'list';
    let aiPresetPreviewTitle = '';
    let aiPresetPreviewText = '';
    let aiPresetPreviewStatus = '';
    let aiPresetPreviewReturnView = 'list';
    let aiPresetGenerating = false;
    let aiPresetImportExportText = '';
    let pendingAiPresetInfoRole = 'system';
    let aiPresetInfoSourcePickerTargetIndex = -1;


    let pendingWorldBookEntries = [];
    let worldBookStatusMessage = '';
    let worldBookSubView = 'list';
    let editingWorldBookIndex = -1;
    let worldBookPickerEntries = [];
    let worldBookPickerStatus = '';
    let pendingWorldBookMainChatContextN = '10';
    let pendingWorldBookMainChatUserN = '';
    let pendingWorldBookMainChatXmlRules = [];
    let worldBookMainChatPreviewText = '';
    let worldBookMainChatPreviewStatus = '';
    let worldBookTriggeredPreviewText = '';
    let worldBookTriggeredPreviewStatus = '';
    let worldBookContentPreviewText = '';
    let worldBookContentPreviewStatus = '';
    let worldBookMainChatModeFlashIndex = -1;
    let worldBookMainChatModeFlashTimer = null;

    let journalAutoTriggerStatusMessage = '';
    let journalAutoTriggerLastHandledKeys = { assistant: '', user: '' };
    let journalAutoTriggerEventsBound = false;
    let pendingJournalAutoTriggerEnabled = false;
    let pendingJournalAutoTriggerRole = 'assistant';
    let pendingJournalAutoTriggerInterval = '1';
    let pendingJournalAutoTriggerWriteMode = 'append';
    let pendingManualGenerateLatestMode = 'latest_only';
    let pendingManualGenerateHistoryMode = 'append';

    function loadSettings() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      } catch (error) {
        return {};
      }
    }

    function persistAiSettings() {
      aiSettings = normalizeAiSettings(aiSettings);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(aiSettings));
      } catch (error) {
        console.warn('[Butterfly Diary] AI 设置写入 localStorage 失败', error);
      }
    }

    function setPendingAiApiSettings(settings = aiSettings) {
      const nextSettings = normalizeAiSettings(settings);
      const selectedProfile = getAiProfileById(nextSettings.selectedApiProfileId, nextSettings);
      pendingAiApiProfileId = selectedProfile?.id || '';
      pendingAiApiName = selectedProfile?.name || (nextSettings.apiProfiles.length ? `API ${nextSettings.apiProfiles.length + 1}` : '默认');
      pendingAiUrl = selectedProfile?.url || '';
      pendingAiKey = selectedProfile?.key || '';
      pendingAiModel = selectedProfile?.model || '';
      pendingAiTemperature = selectedProfile?.temperature || '';
      pendingAiTopP = selectedProfile?.topP || '';
    }

    function setPendingAiMainChatSettings(settings = aiSettings) {
      const nextSettings = normalizeAiSettings(settings);
      pendingAiMainChatContextN = nextSettings.mainChatContextN === '' || nextSettings.mainChatContextN == null
        ? ''
        : String(nextSettings.mainChatContextN);
      pendingAiMainChatUserN = nextSettings.mainChatUserN === '' || nextSettings.mainChatUserN == null
        ? ''
        : String(nextSettings.mainChatUserN);
      pendingAiMainChatXmlRules = normalizeAiMainChatRules(nextSettings.mainChatXmlRules);
    }

    function setPendingAiPresetSettings(settings = aiSettings) {
      pendingAiPresetBlocks = normalizeAiPresetBlocks(normalizeAiSettings(settings).presetBlocks);
      selectedAiPresetBlockIndex = pendingAiPresetBlocks.length ? Math.min(Math.max(selectedAiPresetBlockIndex, 0), pendingAiPresetBlocks.length - 1) : -1;
    }

    function setPendingWorldBookSettings(settings = aiSettings) {
      pendingWorldBookEntries = normalizeAiWorldBookEntries(normalizeAiSettings(settings).worldBookEntries);
      if (editingWorldBookIndex >= pendingWorldBookEntries.length) {
        editingWorldBookIndex = pendingWorldBookEntries.length - 1;
      }
    }
    function setPendingJournalAutoTriggerSettings(settings = aiSettings) {
      const nextSettings = normalizeAiSettings(settings);
      pendingJournalAutoTriggerEnabled = Boolean(nextSettings.journalAutoTriggerEnabled);
      pendingJournalAutoTriggerRole = nextSettings.journalAutoTriggerRole === 'user' ? 'user' : 'assistant';
      pendingJournalAutoTriggerInterval = String(nextSettings.journalAutoTriggerInterval || '1');
      pendingJournalAutoTriggerWriteMode = nextSettings.journalAutoTriggerWriteMode === 'replace' ? 'replace' : 'append';
      pendingManualGenerateLatestMode = nextSettings.manualGenerateLatestMode === 'latest_and_history' ? 'latest_and_history' : 'latest_only';
      pendingManualGenerateHistoryMode = nextSettings.manualGenerateHistoryMode === 'replace' ? 'replace' : 'append';
    }



    function getWorldBookEntries(source = pendingWorldBookEntries) {
      return Array.isArray(source) ? source : [];
    }

    function getEditingWorldBookEntry() {
      const entries = getWorldBookEntries();
      if (editingWorldBookIndex < 0 || editingWorldBookIndex >= entries.length) return null;
      return entries[editingWorldBookIndex] || null;
    }

    function getWorldBookScopeLabel(scope = '') {
      const normalizedScope = String(scope || '').trim();
      if (normalizedScope === 'character') return '角色绑定';
      if (normalizedScope === 'chat') return '聊天绑定';
      return '全局世界书';
    }

    function getWorldBookSummaryLabel(entriesSource = pendingWorldBookEntries) {
      const entries = getWorldBookEntries(entriesSource);
      return entries.length ? `${entries.length}本` : '空';
    }

    function getWorldBookEntryMainChatSummary(entry = null) {
      const targetEntry = entry || getEditingWorldBookEntry();
      if (!targetEntry) return '默认';
      const isDefault = String(targetEntry.mainChatContextN ?? '10') === '10'
        && String(targetEntry.mainChatUserN ?? '') === ''
        && !normalizeAiMainChatRules(targetEntry.mainChatXmlRules).some((rule) => String(rule?.tag || '').trim() || String(rule?.n || '').trim());
      return isDefault ? '默认' : '已设';
    }

    function getWorldBookInfoBindingsSummary(entry = null) {
      const targetEntry = entry || getEditingWorldBookEntry();
      const bindings = Array.isArray(targetEntry?.infoSourceBindings) ? targetEntry.infoSourceBindings : [];
      return bindings.length ? `${bindings.length}项` : '空';
    }

    function syncPendingWorldBookMainChatSettings(entry = null) {
      const targetEntry = entry || getEditingWorldBookEntry();
      pendingWorldBookMainChatContextN = targetEntry?.mainChatContextN === '' || targetEntry?.mainChatContextN == null ? '10' : String(targetEntry.mainChatContextN);
      pendingWorldBookMainChatUserN = targetEntry?.mainChatUserN === '' || targetEntry?.mainChatUserN == null ? '' : String(targetEntry.mainChatUserN);
      pendingWorldBookMainChatXmlRules = normalizeAiMainChatRules(targetEntry?.mainChatXmlRules);
    }

    function buildPendingWorldBookMainChatSettingsSource(entry = getEditingWorldBookEntry()) {
      return normalizeAiSettings({
        ...normalizeAiSettings(aiSettings),
        mainChatContextN: pendingWorldBookMainChatContextN,
        mainChatUserN: pendingWorldBookMainChatUserN,
        mainChatXmlRules: pendingWorldBookMainChatXmlRules,
      });
    }

    function getCurrentSTChatId() {
      const ctx = getSillyTavernContext();
      if (typeof ctx?.getCurrentChatId === 'function') {
        return String(ctx.getCurrentChatId() || '').trim();
      }
      return String(ctx?.chatId || '').trim();
    }

    function getJournalAutoTriggerRoleLabel(role = 'assistant') {
      return String(role || '').trim() === 'user' ? '用户消息后' : 'AI消息后';
    }

    function getJournalAutoTriggerWriteModeLabel(mode = 'append') {
      return String(mode || '').trim() === 'replace' ? '覆盖变量' : '追加到变量';
    }

    function getManualGenerateLatestModeLabel(mode = 'latest_only') {
      return String(mode || '').trim() === 'latest_and_history' ? '最新+历史' : '仅最新';
    }

    function getManualGenerateHistoryModeLabel(mode = 'append') {
      return String(mode || '').trim() === 'replace' ? '覆盖历史' : '追加历史';
    }

    function getJournalAutoTriggerSummaryLabel(settingsSource = aiSettings) {
      const settings = normalizeAiSettings(settingsSource);
      if (!settings.journalAutoTriggerEnabled) return '关闭';
      return `${getJournalAutoTriggerRoleLabel(settings.journalAutoTriggerRole)} · 每${settings.journalAutoTriggerInterval || '1'}楼 · ${getJournalAutoTriggerWriteModeLabel(settings.journalAutoTriggerWriteMode)}`;
    }

    function getJournalAutoTriggerRuntimeSettings(settingsSource = aiSettings) {
      const settings = normalizeAiSettings(settingsSource);
      const interval = Number.parseInt(String(settings.journalAutoTriggerInterval || '1'), 10);
      return {
        enabled: Boolean(settings.journalAutoTriggerEnabled),
        role: settings.journalAutoTriggerRole === 'user' ? 'user' : 'assistant',
        interval: Number.isFinite(interval) && interval > 0 ? interval : 1,
        writeMode: settings.journalAutoTriggerWriteMode === 'replace' ? 'replace' : 'append',
      };
    }

    function updateJournalAutoTriggerSettings(patch = {}) {
      aiSettings = normalizeAiSettings({
        ...normalizeAiSettings(aiSettings),
        ...(patch || {}),
      });
      setPendingJournalAutoTriggerSettings(aiSettings);
      persistAiSettings();
      renderAutoTriggerContent();
      return aiSettings;
    }

    function resetJournalAutoTriggerHandledKeys() {
      journalAutoTriggerLastHandledKeys = { assistant: '', user: '' };
    }

    function buildJournalAutoTriggerHandledKey(triggerRole, chatId, floorCount, content = '') {
      return [
        String(chatId || '').trim(),
        String(triggerRole || '').trim(),
        String(floorCount || 0),
        String(content || '').trim().slice(0, 240),
      ].join('::');
    }

    function getPendingJournalAutoTriggerSummaryLabel() {
      if (!pendingJournalAutoTriggerEnabled) return '关闭';
      return `${getJournalAutoTriggerRoleLabel(pendingJournalAutoTriggerRole)} · 每${pendingJournalAutoTriggerInterval || '1'}楼 · ${getJournalAutoTriggerWriteModeLabel(pendingJournalAutoTriggerWriteMode)}`;
    }

    function saveJournalAutoTriggerSettings() {
      const nextInterval = clampAiIntegerSetting(pendingJournalAutoTriggerInterval, 1, 99, '1');
      resetJournalAutoTriggerHandledKeys();
      updateJournalAutoTriggerSettings({
        journalAutoTriggerEnabled: pendingJournalAutoTriggerEnabled,
        journalAutoTriggerRole: pendingJournalAutoTriggerRole === 'user' ? 'user' : 'assistant',
        journalAutoTriggerInterval: nextInterval,
        journalAutoTriggerWriteMode: pendingJournalAutoTriggerWriteMode === 'replace' ? 'replace' : 'append',
        manualGenerateLatestMode: pendingManualGenerateLatestMode === 'latest_and_history' ? 'latest_and_history' : 'latest_only',
        manualGenerateHistoryMode: pendingManualGenerateHistoryMode === 'replace' ? 'replace' : 'append',
      });
      journalAutoTriggerStatusMessage = '已保存自动触发与手动生成策略';
      renderAutoTriggerContent();
      return aiSettings;
    }

    function syncAiConfigConnectionState() {
      const selectedProfile = getSelectedAiApiProfile(aiSettings);
      aiConfigConnectionState = Array.isArray(selectedProfile?.modelCache) && selectedProfile.modelCache.length ? 'success' : 'idle';
    }

    function buildPendingAiMainChatSettingsSource(baseSettings = aiSettings) {
      return normalizeAiSettings({
        ...normalizeAiSettings(baseSettings),
        mainChatContextN: pendingAiMainChatContextN,
        mainChatUserN: pendingAiMainChatUserN,
        mainChatXmlRules: pendingAiMainChatXmlRules,
      });
    }

    function saveAiApiSettings(overrides = {}) {
      const currentSettings = normalizeAiSettings(aiSettings);
      const editingProfileId = typeof (overrides.id ?? pendingAiApiProfileId ?? currentSettings.selectedApiProfileId) === 'string'
        ? (overrides.id ?? pendingAiApiProfileId ?? currentSettings.selectedApiProfileId).trim()
        : '';
      const currentProfile = getAiProfileById(editingProfileId, currentSettings);
      const nextProfile = createDefaultProfile(currentSettings.apiProfiles.length, {
        ...currentProfile,
        ...overrides,
        id: overrides.id ?? pendingAiApiProfileId ?? currentProfile?.id,
        name: overrides.name ?? pendingAiApiName,
        url: overrides.url ?? pendingAiUrl,
        key: overrides.key ?? pendingAiKey,
        model: overrides.model ?? pendingAiModel,
        temperature: overrides.temperature ?? pendingAiTemperature,
        topP: overrides.topP ?? pendingAiTopP,
        modelCache: overrides.modelCache ?? currentProfile?.modelCache ?? [],
      });

      const nextProfiles = currentSettings.apiProfiles.filter((profile) => profile.id !== currentProfile?.id);
      if (isAiApiProfileMeaningful(nextProfile)) {
        nextProfiles.push(nextProfile);
      }

      aiSettings = normalizeAiSettings({
        ...currentSettings,
        apiProfiles: nextProfiles,
        selectedApiProfileId: isAiApiProfileMeaningful(nextProfile)
          ? nextProfile.id
          : currentSettings.selectedApiProfileId,
      });

      setPendingAiApiSettings(aiSettings);
      persistAiSettings();
      return aiSettings;
    }

    function saveAiMainChatSettings() {
      aiSettings = normalizeAiSettings({
        ...normalizeAiSettings(aiSettings),
        mainChatContextN: pendingAiMainChatContextN,
        mainChatUserN: pendingAiMainChatUserN,
        mainChatXmlRules: pendingAiMainChatXmlRules,
      });
      setPendingAiMainChatSettings(aiSettings);
      persistAiSettings();
      return aiSettings;
    }

    function saveAiPresetSettings() {
      aiSettings = normalizeAiSettings({
        ...normalizeAiSettings(aiSettings),
        presetBlocks: pendingAiPresetBlocks,
      });
      setPendingAiPresetSettings(aiSettings);
      persistAiSettings();
      return aiSettings;
    }

    function exportAiPresetPayload() {
      return {
        type: 'butterfly-diary-preset',
        version: 1,
        presetBlocks: normalizeAiPresetBlocks(pendingAiPresetBlocks),
      };
    }

    function openAiPresetImportExport() {
      aiPresetImportExportText = JSON.stringify(exportAiPresetPayload(), null, 2);
      aiPresetStatusMessage = '';
      aiPresetSubView = 'importExport';
      renderAiPresetContent();
    }

    function closeAiPresetImportExport() {
      aiPresetSubView = 'list';
      renderAiPresetContent();
    }

    function importAiPresetFromText(rawText = '') {
      const normalizedText = String(rawText || '').trim();
      if (!normalizedText) {
        aiPresetStatusMessage = '导入失败(内容为空)';
        renderAiPresetContent();
        return false;
      }

      try {
        const parsed = JSON.parse(normalizedText);
        const sourceBlocks = Array.isArray(parsed)
          ? parsed
          : (Array.isArray(parsed?.presetBlocks) ? parsed.presetBlocks : []);
        const normalizedBlocks = normalizeAiPresetBlocks(sourceBlocks);
        if (!normalizedBlocks.length) {
          throw new Error('无可导入块');
        }
        pendingAiPresetBlocks = normalizedBlocks;
        selectedAiPresetBlockIndex = 0;
        aiPresetStatusMessage = `已导入 ${normalizedBlocks.length} 块`;
        aiPresetSubView = 'list';
        renderAiPresetContent();
        return true;
      } catch (error) {
        aiPresetStatusMessage = '导入失败(JSON无效)';
        console.error('[Butterfly Diary][预设] 导入失败', error);
        renderAiPresetContent();
        return false;
      }
    }

    function saveWorldBookEntries(entries = pendingWorldBookEntries) {
      aiSettings = normalizeAiSettings({
        ...normalizeAiSettings(aiSettings),
        worldBookEntries: normalizeAiWorldBookEntries(entries),
      });
      setPendingWorldBookSettings(aiSettings);
      persistAiSettings();
      return aiSettings;
    }

    function updateEditingWorldBookEntry(patch = {}) {
      const entries = getWorldBookEntries();
      if (editingWorldBookIndex < 0 || editingWorldBookIndex >= entries.length) return null;
      const nextEntries = entries.slice();
      nextEntries[editingWorldBookIndex] = {
        ...nextEntries[editingWorldBookIndex],
        ...(patch || {}),
      };
      saveWorldBookEntries(nextEntries);
      return getEditingWorldBookEntry();
    }

    function saveEditingWorldBookMainChatSettings() {
      updateEditingWorldBookEntry({
        mainChatContextN: pendingWorldBookMainChatContextN,
        mainChatUserN: pendingWorldBookMainChatUserN,
        mainChatXmlRules: pendingWorldBookMainChatXmlRules,
      });
      worldBookStatusMessage = '已保存世界书主聊天';
      worldBookSubView = 'entry';
      renderWorldBookContent();
    }

    function deleteAiApiProfile(profileId) {
      const currentSettings = normalizeAiSettings(aiSettings);
      const nextProfiles = currentSettings.apiProfiles.filter((profile) => profile.id !== profileId);
      aiSettings = normalizeAiSettings({
        ...currentSettings,
        apiProfiles: nextProfiles,
        selectedApiProfileId: currentSettings.selectedApiProfileId === profileId ? '' : currentSettings.selectedApiProfileId,
      });
      setPendingAiApiSettings(aiSettings);
      syncAiConfigConnectionState();
      aiConfigStatusMessage = nextProfiles.length ? '已删除API' : 'API列表已清空';
      persistAiSettings();
      renderAiConfigContent();
    }

    function openNewAiApiProfileDraft() {
      pendingAiApiProfileId = '';
      pendingAiApiName = '';
      pendingAiUrl = '';
      pendingAiKey = '';
      pendingAiModel = '';
      pendingAiTemperature = '';
      pendingAiTopP = '';
      aiConfigConnectionState = 'idle';
      aiConfigStatusMessage = '新建API';
      aiConfigSubView = 'editor';
      renderAiConfigContent();
    }

    function selectAiApiProfile(profileId, { openEditor = false, persist = true } = {}) {
      const currentSettings = normalizeAiSettings(aiSettings);
      const selectedProfile = getAiProfileById(profileId, currentSettings);
      if (!selectedProfile) return;
      aiSettings = normalizeAiSettings({
        ...currentSettings,
        selectedApiProfileId: selectedProfile.id,
      });
      setPendingAiApiSettings(aiSettings);
      syncAiConfigConnectionState();
      if (openEditor) {
        aiConfigSubView = 'editor';
        aiConfigStatusMessage = `${selectedProfile.name || '默认'}`;
      } else if (persist) {
        aiConfigStatusMessage = `已选中 ${selectedProfile.name || '默认'}`;
      }
      if (persist) {
        persistAiSettings();
      }
      renderAiConfigContent();
    }

    function openAiConfig() {
      setPendingAiApiSettings(aiSettings);
      syncAiConfigConnectionState();
      aiConfigStatusMessage = '';
      aiConfigSubView = 'list';
      renderAiConfigContent();
    }

    function getSelectedAiModel() {
      const modelCache = Array.isArray(getSelectedAiApiProfile(aiSettings)?.modelCache) ? getSelectedAiApiProfile(aiSettings).modelCache : [];
      if (!modelCache.length) return '';
      return modelCache[selectedAiModelIndex] || '';
    }

    function openAiModelList() {
      if (!hasFetchedAiModels()) {
        aiConfigStatusMessage = '请先连接获取模型';
        renderAiConfigContent();
        return;
      }
      const selectedProfile = getSelectedAiApiProfile(aiSettings);
      const modelCache = Array.isArray(selectedProfile?.modelCache) ? selectedProfile.modelCache : [];
      const currentModel = pendingAiModel || selectedProfile?.model || '';
      selectedAiModelIndex = modelCache.length
        ? Math.max(0, modelCache.indexOf(currentModel) >= 0 ? modelCache.indexOf(currentModel) : 0)
        : -1;
      aiConfigSubView = 'modelList';
      renderAiConfigContent();
    }

    function closeAiModelList() {
      aiConfigSubView = 'editor';
      renderAiConfigContent();
    }

    function openAiParamConfig() {
      aiConfigSubView = 'paramConfig';
      renderAiConfigContent();
    }

    function closeAiParamConfig() {
      aiConfigSubView = 'editor';
      renderAiConfigContent();
    }

    function openAiMainChatConfig() {
      setPendingAiMainChatSettings(aiSettings);
      aiMainChatStatusMessage = '';
      aiMainChatSubView = 'main';
      renderAiMainChatContent();
    }

    function openAiMainChatRules() {
      aiMainChatStatusMessage = '';
      aiMainChatSubView = 'rules';
      renderAiMainChatContent();
    }

    function closeAiMainChatRules() {
      aiMainChatSubView = 'main';
      renderAiMainChatContent();
    }

    function openAiMainChatPreview() {
      aiMainChatStatusMessage = '';
      aiMainChatSubView = 'preview';
      aiMainChatPreviewStatus = '读取中…';
      aiMainChatPreviewText = '';
      renderAiMainChatContent();
      refreshAiMainChatPreview();
    }

    function closeAiMainChatPreview() {
      aiMainChatSubView = 'main';
      renderAiMainChatContent();
    }

    function flashAiMainChatRuleMode(index) {
      aiMainChatModeFlashIndex = index;
      if (aiMainChatModeFlashTimer) {
        clearTimeout(aiMainChatModeFlashTimer);
      }
      renderAiMainChatContent();
      aiMainChatModeFlashTimer = window.setTimeout(() => {
        aiMainChatModeFlashIndex = -1;
        aiMainChatModeFlashTimer = null;
        if (aiMainChatSubView === 'rules') {
          renderAiMainChatContent();
        }
      }, 180);
    }

    async function buildAiMainChatHistoryMessages(settingsSource = aiSettings) {
      const historyMessages = await getSTMainChatMessages();
      if (!historyMessages.length) return [];

      const settings = normalizeAiSettings(settingsSource);
      const validRules = normalizeAiMainChatRules(settings.mainChatXmlRules).filter((rule) => rule.tag);
      const userNStr = settings.mainChatUserN;
      const assistantMessages = historyMessages.map((message, index) => ({ index, message })).filter((item) => item.message.role !== 'user');
      const userMessages = historyMessages.map((message, index) => ({ index, message })).filter((item) => item.message.role === 'user');
      const assistantInRange = {};
      const userInRange = {};

      if (validRules.length) {
        for (const rule of validRules) {
          const nStr = String(rule.n || '').trim();
          if (nStr === '0') continue;

          let startIndex = 0;
          let endIndex = assistantMessages.length;
          if (nStr !== '') {
            const n = Number.parseInt(nStr, 10) || 0;
            if (n <= 0) continue;
            if (rule.mode === 'exclude') {
              startIndex = 0;
              endIndex = Math.max(0, assistantMessages.length - n);
            } else {
              startIndex = Math.max(0, assistantMessages.length - n);
              endIndex = assistantMessages.length;
            }
          }

          for (let i = startIndex; i < endIndex; i += 1) {
            const item = assistantMessages[i];
            if (!assistantInRange[item.index]) assistantInRange[item.index] = [];
            assistantInRange[item.index].push(rule.tag);
          }
        }
      } else {
        const aiRangeStr = settings.mainChatContextN;
        let startIndex = 0;
        let endIndex = assistantMessages.length;
        if (aiRangeStr === '0') {
          startIndex = 0;
          endIndex = 0;
        } else if (aiRangeStr !== '') {
          const n = Number.parseInt(aiRangeStr, 10) || 0;
          startIndex = Math.max(0, assistantMessages.length - n);
          endIndex = assistantMessages.length;
        }
        for (let i = startIndex; i < endIndex; i += 1) {
          const item = assistantMessages[i];
          assistantInRange[item.index] = ['__full__'];
        }
      }

      if (userNStr !== '0') {
        let startIndex = 0;
        let endIndex = userMessages.length;
        if (userNStr !== '') {
          const n = Number.parseInt(userNStr, 10) || 0;
          if (n > 0) {
            startIndex = Math.max(0, userMessages.length - n);
            endIndex = userMessages.length;
          }
        }
        for (let i = startIndex; i < endIndex; i += 1) {
          userInRange[userMessages[i].index] = true;
        }
      }

      const result = [];
      for (let i = 0; i < historyMessages.length; i += 1) {
        const message = historyMessages[i];
        if (message.role === 'user') {
          if (userInRange[i]) {
            result.push({ role: 'user', content: message.content });
          }
          continue;
        }

        if (!assistantInRange[i]) continue;
        const parts = assistantInRange[i]
          .map((tag) => tag === '__full__' ? message.content : extractTagContentWithTag(message.content, tag))
          .filter(Boolean);
        if (parts.length) {
          result.push({ role: 'assistant', content: parts.join('\n\n') });
        }
      }

      return result;
    }

    async function refreshAiMainChatPreview() {
      aiMainChatPreviewStatus = '读取中…';
      aiMainChatPreviewText = '';
      if (aiMainChatSubView === 'preview') {
        renderAiMainChatContent();
      }
      try {
        const messages = await buildAiMainChatHistoryMessages(buildPendingAiMainChatSettingsSource(aiSettings));
        aiMainChatPreviewText = messages.map((message) => `${message.role === 'user' ? '用户' : 'AI'}：${message.content}`).join('\n\n');
        aiMainChatPreviewStatus = `已读取 ${messages.length} 条`;
      } catch (error) {
        aiMainChatPreviewText = '';
        aiMainChatPreviewStatus = '读取失败';
        console.error('[Butterfly Diary][主聊天] 读取失败', error);
      }
      if (aiMainChatSubView === 'preview') {
        renderAiMainChatContent();
      }
    }

    function resetAiPresetDraftState() {
      editingAiPresetBlockIndex = -1;
      pendingAiPresetBlockDraft = null;
    }

    function getAiPresetDraft(defaultRole = 'user') {
      if (!pendingAiPresetBlockDraft) {
        pendingAiPresetBlockDraft = normalizeAiPresetBlock({ role: defaultRole }, pendingAiPresetBlocks.length);
      }
      return pendingAiPresetBlockDraft;
    }

    function createAiPresetBlock(role = 'user') {
      return normalizeAiPresetBlock({ role }, pendingAiPresetBlocks.length);
    }

    function getAiPresetInfoSources() {
      return [
        {
          id: 'diary_latest_entries',
          name: '最新的日记内容',
          subtitle: `读取最新变量 ${String(window.ButterflyDiaryData?.DIARY_VARIABLE_NAME || 'butterfly_journal_latest')} 的日记正文`,
        },
        {
          id: 'diary_history_summary',
          name: '历史日记的总结部分',
          subtitle: `读取历史变量 ${String(window.ButterflyDiaryData?.DIARY_HISTORY_VARIABLE_NAME || 'butterfly_journal_history')} 的 summary / <diary_summary>`,
        },
        {
          id: 'world_book_triggered',
          name: '世界块',
          subtitle: '读取当前已配置世界书的触发结果预览',
        },
      ];
    }

    async function getAiPresetInfoSourceText(sourceId = '') {
      const normalizedSourceId = String(sourceId || '').trim();
      if (!normalizedSourceId) return '';

      if (normalizedSourceId === 'diary_latest_entries') {
        const stApi = getSTAPI();
        if (typeof stApi?.variables?.get === 'function') {
          try {
            const result = await stApi.variables.get({
              name: String(window.ButterflyDiaryData?.DIARY_VARIABLE_NAME || 'butterfly_journal_latest'),
              scope: 'local',
            });
            const rawValue = result?.value;
            if (typeof window.ButterflyDiaryData?.parseDiaryVariableValue === 'function') {
              const entries = window.ButterflyDiaryData.parseDiaryVariableValue(rawValue);
              const latestText = entries
                .map((entry) => {
                  const title = String(entry?.title || '').trim();
                  const content = String(entry?.content || '').trim();
                  return [title, content].filter(Boolean).join('：');
                })
                .filter(Boolean)
                .join('\n\n');
              if (latestText) {
                return latestText;
              }
            }
          } catch (error) {
            console.warn('[Butterfly Diary][预设信息块] 读取最新日记内容失败', error);
          }
        }

        const diarySource = typeof window.ButterflyDiaryData?.getDiaryEntries === 'function'
          ? window.ButterflyDiaryData.getDiaryEntries()
          : (Array.isArray(window.ButterflyDiaryData?.diaryEntries) ? window.ButterflyDiaryData.diaryEntries : []);
        return diarySource
          .map((entry) => {
            const title = String(entry?.title || '').trim();
            const content = String(entry?.content || '').trim();
            return [title, content].filter(Boolean).join('：');
          })
          .filter(Boolean)
          .join('\n\n');
      }

      if (normalizedSourceId === 'diary_history_summary') {
        const stApi = getSTAPI();
        if (typeof stApi?.variables?.get === 'function') {
          try {
            const result = await stApi.variables.get({
              name: String(window.ButterflyDiaryData?.DIARY_HISTORY_VARIABLE_NAME || 'butterfly_journal_history'),
              scope: 'local',
            });
            const rawValue = result?.value;
            const parsedObject = typeof rawValue === 'string'
              ? JSON.parse(rawValue)
              : rawValue;
            const directSummary = String(parsedObject?.summary || '').trim();
            if (directSummary) {
              return directSummary;
            }
          } catch (error) {
            console.warn('[Butterfly Diary][预设信息块] 读取历史日记总结失败', error);
          }
        }

        return typeof window.ButterflyDiaryData?.getDiarySummary === 'function'
          ? window.ButterflyDiaryData.getDiarySummary()
          : '';
      }

      if (normalizedSourceId === 'world_book_triggered') {
        const entry = getEditingWorldBookEntry() || getWorldBookEntries()[0] || null;
        return entry ? await buildWorldBookTriggeredPreviewMessage(entry) : '';
      }

      return '';
    }

    function selectAiPresetBlock(index) {
      if (!pendingAiPresetBlocks.length) {
        selectedAiPresetBlockIndex = -1;
      } else {
        selectedAiPresetBlockIndex = Math.min(Math.max(Number(index) || 0, 0), pendingAiPresetBlocks.length - 1);
      }
    }

    function openAiPresetEditor(index = -1, role = 'user') {
      const targetIndex = Number(index);
      if (Number.isFinite(targetIndex) && targetIndex >= 0 && targetIndex < pendingAiPresetBlocks.length) {
        selectAiPresetBlock(targetIndex);
        editingAiPresetBlockIndex = targetIndex;
        pendingAiPresetBlockDraft = normalizeAiPresetBlock(pendingAiPresetBlocks[targetIndex], targetIndex);
      } else {
        editingAiPresetBlockIndex = -1;
        pendingAiPresetBlockDraft = createAiPresetBlock(role);
      }
      aiPresetStatusMessage = '';
      aiPresetSubView = 'editor';
      renderAiPresetContent();
    }

    function closeAiPresetEditor() {
      resetAiPresetDraftState();
      aiPresetSubView = 'list';
      renderAiPresetContent();
    }

    function cycleAiPresetDraftRole(step = 1) {
      const roleOptions = ['system', 'user', 'assistant'];
      const draft = getAiPresetDraft('user');
      const currentIndex = Math.max(0, roleOptions.indexOf(String(draft.role || 'user')));
      const nextIndex = (currentIndex + step + roleOptions.length) % roleOptions.length;
      pendingAiPresetBlockDraft = normalizeAiPresetBlock({
        ...draft,
        role: roleOptions[nextIndex],
      }, editingAiPresetBlockIndex >= 0 ? editingAiPresetBlockIndex : pendingAiPresetBlocks.length);
      renderAiPresetContent();
    }

    function saveAiPresetBlockDraft() {
      const targetIndex = editingAiPresetBlockIndex;
      const draft = normalizeAiPresetBlock(getAiPresetDraft('user'), targetIndex >= 0 ? targetIndex : pendingAiPresetBlocks.length);
      const nextBlocks = normalizeAiPresetBlocks(pendingAiPresetBlocks);

      if (targetIndex >= 0 && targetIndex < nextBlocks.length) {
        nextBlocks[targetIndex] = draft;
        selectedAiPresetBlockIndex = targetIndex;
      } else {
        nextBlocks.push(draft);
        selectedAiPresetBlockIndex = nextBlocks.length - 1;
      }

      pendingAiPresetBlocks = nextBlocks;
      aiPresetStatusMessage = '已保存块';
      resetAiPresetDraftState();
      aiPresetSubView = 'list';
      renderAiPresetContent();
    }

    function addAiPresetContextBlock() {
      pendingAiPresetBlocks = [...normalizeAiPresetBlocks(pendingAiPresetBlocks), normalizeAiPresetBlock({ role: '_context', name: '主聊天' }, pendingAiPresetBlocks.length)];
      selectedAiPresetBlockIndex = pendingAiPresetBlocks.length - 1;
      aiPresetStatusMessage = '已添加主聊天槽';
      aiPresetSubView = 'list';
      renderAiPresetContent();
    }

    function addAiPresetInfoBlock(sourceId = '', sourceName = '', infoRole = pendingAiPresetInfoRole) {
      const sources = getAiPresetInfoSources();
      const matchedSource = sources.find((source) => String(source?.id || '').trim() === String(sourceId || '').trim()) || null;
      const source = matchedSource || sources[0] || null;
      if (!source) return false;
      pendingAiPresetBlocks = [
        ...normalizeAiPresetBlocks(pendingAiPresetBlocks),
        normalizeAiPresetBlock({
          role: '_info',
          name: String(sourceName || source.name || '信息块').trim() || '信息块',
          infoSourceId: String(sourceId || source.id || '').trim(),
          infoRole: normalizeAiPresetInfoRole(infoRole),
        }, pendingAiPresetBlocks.length),
      ];
      selectedAiPresetBlockIndex = pendingAiPresetBlocks.length - 1;
      aiPresetStatusMessage = '已添加信息块';
      aiPresetSubView = 'list';
      renderAiPresetContent();
      return true;
    }

    function cycleAiPresetInfoRole(step = 1) {
      const roleOptions = ['system', 'user', 'assistant'];
      const currentIndex = Math.max(0, roleOptions.indexOf(normalizeAiPresetInfoRole(pendingAiPresetInfoRole)));
      const nextIndex = (currentIndex + step + roleOptions.length) % roleOptions.length;
      pendingAiPresetInfoRole = roleOptions[nextIndex];
      renderAiPresetContent();
      return pendingAiPresetInfoRole;
    }

    function openAiPresetInfoBlockCreatePage() {
      pendingAiPresetInfoRole = 'system';
      aiPresetInfoSourcePickerTargetIndex = -1;
      aiPresetStatusMessage = '选择信息块来源';
      aiPresetSubView = 'infoCreate';
      renderAiPresetContent();
    }

    function moveAiPresetBlock(index, step) {
      const sourceIndex = Number(index);
      const offset = Number(step);
      if (!Number.isFinite(sourceIndex) || !Number.isFinite(offset)) return false;
      const blocks = normalizeAiPresetBlocks(pendingAiPresetBlocks);
      const targetIndex = sourceIndex + offset;
      if (sourceIndex < 0 || sourceIndex >= blocks.length || targetIndex < 0 || targetIndex >= blocks.length) {
        return false;
      }
      const [movedBlock] = blocks.splice(sourceIndex, 1);
      blocks.splice(targetIndex, 0, movedBlock);
      pendingAiPresetBlocks = blocks;
      selectedAiPresetBlockIndex = targetIndex;
      aiPresetStatusMessage = '';
      renderAiPresetContent();
      return true;
    }

    function deleteAiPresetBlock(index) {
      const targetIndex = Number(index);
      if (!Number.isFinite(targetIndex)) return false;
      const blocks = normalizeAiPresetBlocks(pendingAiPresetBlocks);
      if (targetIndex < 0 || targetIndex >= blocks.length) return false;
      blocks.splice(targetIndex, 1);
      pendingAiPresetBlocks = blocks;
      selectedAiPresetBlockIndex = blocks.length ? Math.min(targetIndex, blocks.length - 1) : -1;
      aiPresetStatusMessage = '已删除块';
      renderAiPresetContent();
      return true;
    }

    async function buildAiMessagesFromPreset(blocksSource = pendingAiPresetBlocks) {
      const blocks = normalizeAiPresetBlocks(blocksSource);
      const messages = [];
      const mainChatSettings = buildPendingAiMainChatSettingsSource(aiSettings);

      for (const block of blocks) {
        const role = String(block?.role || '').trim();
        if (role === '_context') {
          const contextMessages = await buildAiMainChatHistoryMessages(mainChatSettings);
          if (contextMessages.length) {
            messages.push(...contextMessages);
          }
          continue;
        }

        if (role === '_info') {
          const infoText = await getAiPresetInfoSourceText(block?.infoSourceId);
          if (infoText) {
            messages.push({
              role: normalizeAiPresetInfoRole(block?.infoRole),
              content: `${String(block?.name || '信息块').trim() || '信息块'}：\n${infoText}`,
            });
          }
          continue;
        }

        const content = String(block?.text || '').trim();
        if (!content) continue;
        messages.push({ role, content });
      }

      return messages;
    }

    function buildDiaryJsonGenerationInstruction() {
      return [
        '你现在要输出“蝴蝶日记 JSON”。',
        '你可以在 JSON 数组前额外输出一个 <diary_summary>总结正文</diary_summary> 标签。',
        '除这个 <diary_summary> 标签外，不要返回解释、前后缀、Markdown、代码块或额外说明。',
        '根节点必须是数组。',
        '数组中的每个对象都必须且只能包含以下 8 个字符串字段：日期、天气、心情、配图文本、日记内容、拍摄日期、拍摄地点、简略说明。',
        '字段说明：',
        '1. 日期：建议使用 YYYY-MM-DD。',
        '2. 天气：简短天气描述。',
        '3. 心情：简短心情描述。',
        '4. 配图文本：可直接用于配图/插画生成的画面描述。',
        '5. 日记内容：完整的日记正文。',
        '6. 拍摄日期：用于插图页拍立得下方的照片日期，建议与日期一致或相近。',
        '7. 拍摄地点：用于插图页拍立得下方的地点说明。',
        '8. 简略说明：用于插图页拍立得下方的简短备注。',
        '如果只生成一篇，也必须返回只有 1 项的 JSON 数组。',
        '如果需要输出总结，必须固定使用 <diary_summary> 标签，不要使用其他标签名。',
        '示例：',
        '<diary_summary>今天整体情绪从紧张转为轻松，重点是校园傍晚与日常细节。</diary_summary>\n[{"日期":"2026-04-01","天气":"晴","心情":"轻松","配图文本":"校园黄昏，窗边课桌，暖色夕阳，书本与蝴蝶元素","日记内容":"今天放学前的夕阳很好看……","拍摄日期":"2026-04-01","拍摄地点":"校园窗边课桌","简略说明":"黄昏下被记住的一瞬。"}]'
      ].join('\n');
    }

    async function buildDiaryGenerationMessagesFromPreset() {
      const messages = await buildAiMessagesFromPreset(pendingAiPresetBlocks);
      if (!messages.length) {
        return [];
      }
      return [
        {
          role: 'system',
          content: buildDiaryJsonGenerationInstruction(),
        },
        ...messages,
      ];
    }

    function getAiGenerationResponseText(data = {}) {
      const choice = Array.isArray(data?.choices) ? data.choices[0] || null : null;
      const rawContent = choice?.message?.content ?? choice?.text ?? data?.text ?? data?.content ?? '';
      if (Array.isArray(rawContent)) {
        return rawContent
          .map((part) => {
            if (typeof part === 'string') return part;
            if (typeof part?.text === 'string') return part.text;
            if (typeof part?.content === 'string') return part.content;
            return '';
          })
          .join('')
          .trim();
      }
      if (typeof rawContent === 'string') {
        return rawContent.trim();
      }
      if (typeof rawContent?.text === 'string') {
        return rawContent.text.trim();
      }
      return String(rawContent || '').trim();
    }

    function extractDiarySummaryFromGenerationText(text = '') {
      const normalizedText = String(text || '').trim();
      if (!normalizedText) return '';
      return extractTagContentWithTag(normalizedText, 'diary_summary');
    }

    async function requestDiaryJsonGeneration({
      source = 'preset_generate',
      writeMode = 'append',
      updateLatest = true,
      updateHistory = true,
      historyWriteMode = '',
    } = {}) {
      const selectedProfile = getSelectedAiApiProfile(aiSettings);
      if (!selectedProfile?.url) {
        throw new Error('请先配置端点');
      }
      if (!selectedProfile?.key) {
        throw new Error('请先配置 API Key');
      }
      if (!selectedProfile?.model) {
        throw new Error('请先选择模型');
      }

      const messages = await buildDiaryGenerationMessagesFromPreset();
      if (!messages.length) {
        throw new Error('预设内容为空');
      }

      const requestBody = {
        model: selectedProfile.model,
        messages,
        stream: false,
      };
      const temperature = Number(selectedProfile.temperature);
      const topP = Number(selectedProfile.topP);
      if (selectedProfile.temperature !== '' && Number.isFinite(temperature)) {
        requestBody.temperature = temperature;
      }
      if (selectedProfile.topP !== '' && Number.isFinite(topP)) {
        requestBody.top_p = topP;
      }

      const response = await fetch(selectedProfile.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${selectedProfile.key}`,
        },
        body: JSON.stringify(requestBody),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error?.message || `请求失败 (${response.status})`);
      }

      const generatedText = getAiGenerationResponseText(data);
      if (!generatedText) {
        throw new Error('返回内容为空');
      }
      const generatedSummary = extractDiarySummaryFromGenerationText(generatedText);

      const diaryDataApi = window.ButterflyDiaryData;
      const latestDiaryVariableName = String(diaryDataApi?.DIARY_VARIABLE_NAME || 'butterfly_journal_latest').trim();
      const historyDiaryVariableName = String(diaryDataApi?.DIARY_HISTORY_VARIABLE_NAME || 'butterfly_journal_history').trim();
      const normalizedDiaryJsonResult = typeof diaryDataApi?.normalizeGeneratedDiaryJsonValue === 'function'
        ? diaryDataApi.normalizeGeneratedDiaryJsonValue(generatedText)
        : null;
      if (!normalizedDiaryJsonResult?.entries?.length || !normalizedDiaryJsonResult?.rawValue) {
        throw new Error('模型未返回有效的日记 JSON');
      }
      if (typeof diaryDataApi?.saveDiaryValueToChatVariable !== 'function') {
        throw new Error('日记变量写入接口不可用');
      }

      const normalizedHistoryWriteMode = String(historyWriteMode || writeMode || '').trim() === 'replace' ? 'replace' : 'append';
      const saveResult = await diaryDataApi.saveDiaryValueToChatVariable(normalizedDiaryJsonResult.rawValue, {
        source,
        mergeMode: normalizedHistoryWriteMode,
        updateLatest,
        updateHistory,
        historyMergeMode: normalizedHistoryWriteMode,
        summary: generatedSummary,
      });

      return {
        latestDiaryVariableName,
        historyDiaryVariableName,
        saveResult,
        generatedEntries: normalizedDiaryJsonResult.entries,
        rawValue: normalizedDiaryJsonResult.rawValue,
      };
    }

    async function generateDiaryFromPreset() {
      if (aiPresetGenerating) return false;

      aiPresetGenerating = true;
      aiPresetStatusMessage = '生成中…';
      renderAiPresetContent();

      try {
        const updateHistory = pendingManualGenerateLatestMode === 'latest_and_history';
        const result = await requestDiaryJsonGeneration({
          source: 'preset_generate',
          writeMode: pendingManualGenerateHistoryMode,
          updateLatest: true,
          updateHistory,
          historyWriteMode: pendingManualGenerateHistoryMode,
        });
        aiPresetStatusMessage = result.saveResult?.persisted
          ? (updateHistory
            ? `已写入最新变量「${result.latestDiaryVariableName}」并${getManualGenerateHistoryModeLabel(pendingManualGenerateHistoryMode)}到历史变量「${result.historyDiaryVariableName}」`
            : `已写入最新变量「${result.latestDiaryVariableName}」`)
          : '已更新日记 JSON，但未写入聊天变量';
        renderAiPresetContent();
        return true;
      } catch (error) {
        const errorMessage = String(error?.message || '').trim();
        aiPresetStatusMessage = errorMessage === '请先配置端点'
          ? '生成失败(请先配置端点)'
          : errorMessage === '请先配置 API Key'
            ? '生成失败(请先配置 API Key)'
            : errorMessage === '请先选择模型'
              ? '生成失败(请先选择模型)'
              : (errorMessage.includes('日记 JSON') ? '生成失败(JSON格式无效)' : '生成失败(查看控制台)');
        console.error('[Butterfly Diary][预设] 生成日记失败', error);
        renderAiPresetContent();
        return false;
      } finally {
        aiPresetGenerating = false;
        if (aiPresetSubView === 'list') {
          renderAiPresetContent();
        }
      }
    }

    function getWorldBookInfoSources() {
      return [
        {
          id: 'preset_blocks',
          name: '预设消息块',
          subtitle: '当前单预设中的 system / user / assistant 消息块',
          scope: 'preset',
        },
        {
          id: 'preset_overview',
          name: '预设总览',
          subtitle: '当前单预设展开后的完整消息列表',
          scope: 'preset',
        },
        {
          id: 'page2_main_chat',
          name: '设置主聊天',
          subtitle: '第2页主聊天配置读取结果',
          scope: 'mainChat',
        },
        {
          id: 'diary_entries',
          name: '日记内容',
          subtitle: `优先读取历史变量 ${String(window.ButterflyDiaryData?.DIARY_HISTORY_VARIABLE_NAME || 'butterfly_journal_history')}，其次读取最新变量 ${String(window.ButterflyDiaryData?.DIARY_VARIABLE_NAME || 'butterfly_journal_latest')}，无变量时回退默认日记`,
          scope: 'diary',
        },
      ];
    }

    async function getWorldBookInfoBindingText(binding = null) {
      const sourceId = String(binding?.sourceId || '').trim();
      if (!sourceId) return '';

      if (sourceId === 'preset_blocks') {
        const blocks = normalizeAiPresetBlocks(pendingAiPresetBlocks);
        return blocks
          .filter((block) => ['system', 'user', 'assistant'].includes(String(block?.role || '').trim()))
          .map((block, index) => {
            const title = getAiPresetBlockDisplayName(block, index);
            const content = String(block?.text || '').trim();
            return content ? `${title}：${content}` : '';
          })
          .filter(Boolean)
          .join('\n\n');
      }

      if (sourceId === 'preset_overview') {
        const messages = await buildAiMessagesFromPreset(pendingAiPresetBlocks);
        return messages
          .map((message) => `${message.role === 'user' ? '用户' : message.role === 'assistant' ? 'AI' : '系统'}：${message.content}`)
          .join('\n\n')
          .trim();
      }

      if (sourceId === 'page2_main_chat') {
        const messages = await buildAiMainChatHistoryMessages(buildPendingAiMainChatSettingsSource(aiSettings));
        return messages
          .map((message) => `${message.role === 'user' ? '用户' : 'AI'}：${message.content}`)
          .join('\n\n')
          .trim();
      }

      if (sourceId === 'diary_entries') {
        const diaryText = typeof window.ButterflyDiaryData?.getDiaryTextForPrompt === 'function'
          ? window.ButterflyDiaryData.getDiaryTextForPrompt()
          : '';
        if (diaryText) {
          return diaryText;
        }
        const diarySource = typeof window.ButterflyDiaryData?.getDiaryEntries === 'function'
          ? window.ButterflyDiaryData.getDiaryEntries()
          : (Array.isArray(window.ButterflyDiaryData?.diaryEntries) ? window.ButterflyDiaryData.diaryEntries : []);
        return diarySource
          .map((entry) => {
            const title = String(entry?.title || '').trim();
            const content = String(entry?.content || '').trim();
            return [title, content].filter(Boolean).join('：');
          })
          .filter(Boolean)
          .join('\n\n');
      }

      return '';
    }

    function getAiWorldBookEntryKeywords(worldBookEntry) {
      return [
        ...(Array.isArray(worldBookEntry?.key) ? worldBookEntry.key : []),
        ...(Array.isArray(worldBookEntry?.secondaryKey) ? worldBookEntry.secondaryKey : []),
      ]
        .map((keyword) => String(keyword || '').trim().toLowerCase())
        .filter(Boolean);
    }

    function isAiWorldBookKeywordMatched(contextText = '', keyword = '') {
      const normalizedContext = String(contextText || '').trim().toLowerCase();
      const normalizedKeyword = String(keyword || '').trim().toLowerCase();
      if (!normalizedContext || !normalizedKeyword) return false;
      return normalizedContext.includes(normalizedKeyword);
    }

    async function buildWorldBookTriggeredPreviewMessage(entry = null) {
      if (!entry?.name) return '';

      const contextParts = [];
      try {
        const mainChatMessages = await buildAiMainChatHistoryMessages(buildPendingWorldBookMainChatSettingsSource(entry));
        if (mainChatMessages.length) {
          contextParts.push(mainChatMessages.map((message) => String(message?.content || '').trim()).filter(Boolean).join('\n\n'));
        }
      } catch (error) {
        console.warn('[Butterfly Diary][世界书触发] 读取主聊天上下文失败', error);
      }

      const infoBindings = Array.isArray(entry?.infoSourceBindings) ? entry.infoSourceBindings : [];
      for (const binding of infoBindings) {
        const content = await getWorldBookInfoBindingText(binding);
        if (content) {
          contextParts.push(content);
        }
      }

      const contextText = contextParts.filter(Boolean).join('\n\n').trim();
      if (!contextText) return '';

      try {
        const stApi = getSTAPI();
        if (typeof stApi?.worldBook?.get !== 'function') {
          throw new Error('当前环境不支持 ST_API.worldBook.get');
        }
        const result = await stApi.worldBook.get({
          name: String(entry.name || '').trim(),
          scope: String(entry.scope || '').trim() || undefined,
        });
        const worldBookEntries = Array.isArray(result?.worldBook?.entries) ? result.worldBook.entries : [];
        const matchedEntries = worldBookEntries
          .filter((worldBookEntry) => worldBookEntry?.enabled !== false && String(worldBookEntry?.content || '').trim())
          .filter((worldBookEntry) => getAiWorldBookEntryKeywords(worldBookEntry).some((keyword) => isAiWorldBookKeywordMatched(contextText, keyword)))
          .slice(0, 20);
        if (!matchedEntries.length) return '';
        return [
          `世界书触发：${result?.worldBook?.name || entry.name}`,
          ...matchedEntries.map((worldBookEntry) => {
            const entryName = String(worldBookEntry?.name || '').trim();
            const entryContent = String(worldBookEntry?.content || '').trim();
            return entryName ? `${entryName}：${entryContent}` : entryContent;
          }),
        ].filter(Boolean).join('\n');
      } catch (error) {
        console.warn('[Butterfly Diary][世界书触发] 读取世界书失败', error);
        return '';
      }
    }

    async function openAiPresetTotalPreview() {
      aiPresetPreviewTitle = '预设总览';
      aiPresetPreviewStatus = '读取中…';
      aiPresetPreviewText = '';
      aiPresetPreviewReturnView = 'list';
      aiPresetSubView = 'preview';
      renderAiPresetContent();

      try {
        const messages = await buildAiMessagesFromPreset(pendingAiPresetBlocks);
        aiPresetPreviewText = messages.length ? JSON.stringify(messages, null, 2) : '[]';
        aiPresetPreviewStatus = messages.length ? `共 ${messages.length} 条消息` : '暂无内容';
      } catch (error) {
        aiPresetPreviewText = '';
        aiPresetPreviewStatus = '读取失败';
        console.warn('[Butterfly Diary][预设] 总览预览读取失败', error);
      }

      if (aiPresetSubView === 'preview') {
        renderAiPresetContent();
      }
    }

    async function openAiPresetContextBlockPreview(index = selectedAiPresetBlockIndex) {
      const targetIndex = Number(index);
      const blocks = normalizeAiPresetBlocks(pendingAiPresetBlocks);
      if (!Number.isFinite(targetIndex) || targetIndex < 0 || targetIndex >= blocks.length) return false;
      const targetBlock = blocks[targetIndex];
      if (String(targetBlock?.role || '').trim() !== '_context') return false;

      aiPresetPreviewTitle = getAiPresetBlockDisplayName(targetBlock, targetIndex) || '主聊天';
      aiPresetPreviewStatus = '读取中…';
      aiPresetPreviewText = '';
      aiPresetPreviewReturnView = 'list';
      aiPresetSubView = 'preview';
      renderAiPresetContent();

      try {
        const contextMessages = await buildAiMainChatHistoryMessages(buildPendingAiMainChatSettingsSource(aiSettings));
        aiPresetPreviewText = contextMessages.map((message) => `${message.role === 'user' ? '用户' : 'AI'}：${message.content}`).join('\n\n') || '暂无内容';
        aiPresetPreviewStatus = contextMessages.length ? `共 ${contextMessages.length} 条` : '暂无内容';
      } catch (error) {
        aiPresetPreviewText = '';
        aiPresetPreviewStatus = '读取失败';
        console.warn('[Butterfly Diary][预设] 主聊天槽预览读取失败', error);
      }

      if (aiPresetSubView === 'preview') {
        renderAiPresetContent();
      }
      return true;
    }

    async function openAiPresetInfoBlockPreview(index = selectedAiPresetBlockIndex) {
      const targetIndex = Number(index);
      const blocks = normalizeAiPresetBlocks(pendingAiPresetBlocks);
      if (!Number.isFinite(targetIndex) || targetIndex < 0 || targetIndex >= blocks.length) return false;
      const targetBlock = blocks[targetIndex];
      if (String(targetBlock?.role || '').trim() !== '_info') return false;

      aiPresetPreviewTitle = getAiPresetBlockDisplayName(targetBlock, targetIndex) || '信息块';
      aiPresetPreviewStatus = '读取中…';
      aiPresetPreviewText = '';
      aiPresetPreviewReturnView = 'list';
      aiPresetSubView = 'preview';
      renderAiPresetContent();

      try {
        const infoText = await getAiPresetInfoSourceText(targetBlock?.infoSourceId);
        aiPresetPreviewText = infoText || '暂无内容';
        aiPresetPreviewStatus = infoText ? '信息块预览' : '暂无内容';
      } catch (error) {
        aiPresetPreviewText = '';
        aiPresetPreviewStatus = '读取失败';
        console.warn('[Butterfly Diary][预设] 信息块预览读取失败', error);
      }

      if (aiPresetSubView === 'preview') {
        renderAiPresetContent();
      }
      return true;
    }

    function closeAiPresetPreview() {
      aiPresetSubView = aiPresetPreviewReturnView || 'list';
      renderAiPresetContent();
    }

    function openAiPresetItem(index) {
      const targetIndex = Number(index);
      const blocks = normalizeAiPresetBlocks(pendingAiPresetBlocks);
      if (!Number.isFinite(targetIndex) || targetIndex < 0 || targetIndex >= blocks.length) return;
      selectAiPresetBlock(targetIndex);
      const targetBlock = blocks[targetIndex];
      if (String(targetBlock?.role || '').trim() === '_context') {
        openAiPresetContextBlockPreview(targetIndex);
        return;
      }
      if (String(targetBlock?.role || '').trim() === '_info') {
        openAiPresetInfoBlockPreview(targetIndex);
        return;
      }
      openAiPresetEditor(targetIndex);
    }

    function openAiPresetInfoSourcePicker(index = selectedAiPresetBlockIndex) {
      const targetIndex = Number(index);
      const blocks = normalizeAiPresetBlocks(pendingAiPresetBlocks);
      if (!Number.isFinite(targetIndex) || targetIndex < 0 || targetIndex >= blocks.length) return false;
      const targetBlock = blocks[targetIndex];
      if (String(targetBlock?.role || '').trim() !== '_info') return false;
      selectedAiPresetBlockIndex = targetIndex;
      aiPresetInfoSourcePickerTargetIndex = targetIndex;
      pendingAiPresetInfoRole = normalizeAiPresetInfoRole(targetBlock?.infoRole);
      aiPresetSubView = 'infoSourcePicker';
      aiPresetStatusMessage = '切换信息块来源';
      renderAiPresetContent();
      return true;
    }

    function applyAiPresetInfoSourceSelection(sourceId = '', sourceName = '') {
      const normalizedSourceId = String(sourceId || '').trim();
      const normalizedSourceName = String(sourceName || '').trim();
      if (!normalizedSourceId) return false;
      const targetIndex = Number(aiPresetInfoSourcePickerTargetIndex);
      if (Number.isFinite(targetIndex) && targetIndex >= 0) {
        const blocks = normalizeAiPresetBlocks(pendingAiPresetBlocks);
        if (targetIndex < 0 || targetIndex >= blocks.length) return false;
        const targetBlock = blocks[targetIndex];
        if (String(targetBlock?.role || '').trim() !== '_info') return false;
        blocks[targetIndex] = normalizeAiPresetBlock({
          ...targetBlock,
          name: normalizedSourceName || targetBlock.name || '信息块',
          infoSourceId: normalizedSourceId,
          infoRole: normalizeAiPresetInfoRole(pendingAiPresetInfoRole),
        }, targetIndex);
        pendingAiPresetBlocks = blocks;
        selectedAiPresetBlockIndex = targetIndex;
        aiPresetStatusMessage = '已更新信息块';
      } else {
        addAiPresetInfoBlock(normalizedSourceId, normalizedSourceName, pendingAiPresetInfoRole);
        return true;
      }
      aiPresetSubView = 'list';
      renderAiPresetContent();
      return true;
    }

    function normalizeWorldBookPickerEntries(worldBooks) {
      if (!Array.isArray(worldBooks)) return [];
      const seen = new Set();
      return worldBooks
        .map((book, index) => {
          const name = typeof book?.name === 'string' ? book.name.trim() : '';
          const scope = typeof book?.scope === 'string' && book.scope.trim() ? book.scope.trim() : 'global';
          const ownerId = typeof book?.ownerId === 'string' ? book.ownerId.trim() : '';
          return {
            id: `worldbook_picker_${scope}_${ownerId}_${index}`,
            sourceId: `${scope}:${ownerId}:${name}`,
            name,
            scope,
            ownerId,
          };
        })
        .filter((book) => {
          if (!book.name) return false;
          if (seen.has(book.sourceId)) return false;
          seen.add(book.sourceId);
          return true;
        })
        .sort((a, b) => {
          const orderMap = { global: 0, character: 1, chat: 2 };
          const scopeDiff = (orderMap[a.scope] ?? 9) - (orderMap[b.scope] ?? 9);
          if (scopeDiff !== 0) return scopeDiff;
          return a.name.localeCompare(b.name, 'zh-CN');
        });
    }

    async function loadWorldBookPickerEntries() {
      worldBookPickerStatus = '读取中…';
      worldBookPickerEntries = [];
      if (worldBookSubView === 'picker') {
        renderWorldBookContent();
      }

      try {
        const stApi = getSTAPI();
        if (typeof stApi?.worldBook?.list !== 'function') {
          throw new Error('当前环境不支持 ST_API.worldBook.list');
        }
        const result = await stApi.worldBook.list();
        const entries = normalizeWorldBookPickerEntries(result?.worldBooks || []);
        worldBookPickerEntries = entries;
        worldBookPickerStatus = entries.length ? `可选 ${entries.length} 本` : '当前环境暂无世界书';
      } catch (error) {
        worldBookPickerEntries = [];
        worldBookPickerStatus = '读取失败';
        console.error('[Butterfly Diary][世界书] 读取列表失败', error);
      }

      if (worldBookSubView === 'picker') {
        renderWorldBookContent();
      }
    }

    function openWorldBookSettings() {
      worldBookStatusMessage = '';
      worldBookSubView = 'list';
      editingWorldBookIndex = -1;
      renderWorldBookContent();
    }

    function openWorldBookPicker() {
      worldBookSubView = 'picker';
      worldBookPickerStatus = '';
      worldBookPickerEntries = [];
      renderWorldBookContent();
      loadWorldBookPickerEntries();
    }

    function closeWorldBookPicker() {
      worldBookSubView = 'list';
      renderWorldBookContent();
    }

    function addSelectedWorldBookEntry(sourceId) {
      const targetSourceId = String(sourceId || '').trim();
      const source = worldBookPickerEntries.find((entry) => entry.sourceId === targetSourceId) || null;
      if (!source) return false;

      const currentEntries = getWorldBookEntries();
      if (currentEntries.some((entry) => entry.sourceId === source.sourceId)) {
        worldBookStatusMessage = '世界书已存在';
        worldBookSubView = 'list';
        renderWorldBookContent();
        return false;
      }

      const nextEntries = currentEntries.concat({
        id: createAiWorldBookSelectionId(currentEntries.length),
        sourceId: source.sourceId,
        name: source.name,
        scope: source.scope,
        ownerId: source.ownerId,
        mainChatContextN: '10',
        mainChatUserN: '',
        mainChatXmlRules: [],
        infoSourceBindings: [],
      });
      saveWorldBookEntries(nextEntries);
      worldBookStatusMessage = '已添加世界书';
      worldBookSubView = 'list';
      renderWorldBookContent();
      return true;
    }

    function deleteWorldBookEntry(index) {
      const targetIndex = Number(index);
      const currentEntries = getWorldBookEntries();
      if (!Number.isFinite(targetIndex) || targetIndex < 0 || targetIndex >= currentEntries.length) return false;
      const nextEntries = currentEntries.slice();
      nextEntries.splice(targetIndex, 1);
      if (editingWorldBookIndex === targetIndex) {
        editingWorldBookIndex = -1;
      } else if (editingWorldBookIndex > targetIndex) {
        editingWorldBookIndex -= 1;
      }
      saveWorldBookEntries(nextEntries);
      worldBookStatusMessage = nextEntries.length ? '已删除世界书' : '世界书列表已清空';
      worldBookSubView = 'list';
      renderWorldBookContent();
      return true;
    }

    function openWorldBookEntry(index) {
      const targetIndex = Number(index);
      const entries = getWorldBookEntries();
      if (!Number.isFinite(targetIndex) || targetIndex < 0 || targetIndex >= entries.length) return false;
      editingWorldBookIndex = targetIndex;
      worldBookStatusMessage = '';
      worldBookSubView = 'entry';
      renderWorldBookContent();
      return true;
    }

    function closeWorldBookEntry() {
      worldBookSubView = 'list';
      renderWorldBookContent();
    }

    function openWorldBookMainChatSettings() {
      syncPendingWorldBookMainChatSettings();
      worldBookSubView = 'mainChat';
      renderWorldBookContent();
    }

    function closeWorldBookMainChatSettings() {
      worldBookSubView = 'entry';
      renderWorldBookContent();
    }

    function openWorldBookMainChatRules() {
      worldBookSubView = 'mainChatRules';
      renderWorldBookContent();
    }

    function closeWorldBookMainChatRules() {
      worldBookSubView = 'mainChat';
      renderWorldBookContent();
    }

    function flashWorldBookMainChatRuleMode(index) {
      worldBookMainChatModeFlashIndex = index;
      if (worldBookMainChatModeFlashTimer) {
        clearTimeout(worldBookMainChatModeFlashTimer);
      }
      renderWorldBookContent();
      worldBookMainChatModeFlashTimer = window.setTimeout(() => {
        worldBookMainChatModeFlashIndex = -1;
        worldBookMainChatModeFlashTimer = null;
        if (worldBookSubView === 'mainChatRules') {
          renderWorldBookContent();
        }
      }, 180);
    }

    async function refreshWorldBookMainChatPreview() {
      worldBookMainChatPreviewStatus = '读取中…';
      worldBookMainChatPreviewText = '';
      if (worldBookSubView === 'mainChatPreview') {
        renderWorldBookContent();
      }
      try {
        const messages = await buildAiMainChatHistoryMessages(buildPendingWorldBookMainChatSettingsSource());
        worldBookMainChatPreviewText = messages.map((message) => `${message.role === 'user' ? '用户' : 'AI'}：${message.content}`).join('\n\n');
        worldBookMainChatPreviewStatus = `已读取 ${messages.length} 条`;
      } catch (error) {
        worldBookMainChatPreviewText = '';
        worldBookMainChatPreviewStatus = '读取失败';
        console.error('[Butterfly Diary][世界书主聊天] 读取失败', error);
      }
      if (worldBookSubView === 'mainChatPreview') {
        renderWorldBookContent();
      }
    }

    function openWorldBookMainChatPreview() {
      worldBookSubView = 'mainChatPreview';
      worldBookMainChatPreviewStatus = '';
      worldBookMainChatPreviewText = '';
      renderWorldBookContent();
      refreshWorldBookMainChatPreview();
    }

    function closeWorldBookMainChatPreview() {
      worldBookSubView = 'mainChat';
      renderWorldBookContent();
    }

    function openWorldBookInfoBindings() {
      worldBookSubView = 'infoBindings';
      renderWorldBookContent();
    }

    function closeWorldBookInfoBindings() {
      worldBookSubView = 'entry';
      renderWorldBookContent();
    }

    function openWorldBookInfoSourcePicker() {
      worldBookSubView = 'infoSourcePicker';
      renderWorldBookContent();
    }

    function closeWorldBookInfoSourcePicker() {
      worldBookSubView = 'infoBindings';
      renderWorldBookContent();
    }

    function addSelectedWorldBookInfoSourceBinding(sourceId) {
      const targetSourceId = String(sourceId || '').trim();
      const source = getWorldBookInfoSources().find((item) => item.id === targetSourceId) || null;
      const entry = getEditingWorldBookEntry();
      if (!entry || !source) return false;
      const currentBindings = Array.isArray(entry.infoSourceBindings) ? entry.infoSourceBindings : [];
      const alreadyExists = currentBindings.some((binding) => String(binding?.sourceId || '').trim() === source.id);
      if (alreadyExists) {
        closeWorldBookInfoSourcePicker();
        return false;
      }
      updateEditingWorldBookEntry({
        infoSourceBindings: currentBindings.concat({
          id: createAiWorldBookInfoBindingId(currentBindings.length),
          sourceId: source.id,
          sourceName: source.name,
          sourceScope: source.scope,
        }),
      });
      closeWorldBookInfoSourcePicker();
      return true;
    }

    function deleteWorldBookInfoSourceBinding(index) {
      const targetIndex = Number(index);
      const entry = getEditingWorldBookEntry();
      const currentBindings = Array.isArray(entry?.infoSourceBindings) ? entry.infoSourceBindings : [];
      if (!Number.isFinite(targetIndex) || targetIndex < 0 || targetIndex >= currentBindings.length) return false;
      const nextBindings = currentBindings.slice();
      nextBindings.splice(targetIndex, 1);
      updateEditingWorldBookEntry({ infoSourceBindings: nextBindings });
      renderWorldBookContent();
      return true;
    }

    async function refreshWorldBookTriggeredPreview() {
      worldBookTriggeredPreviewStatus = '读取中…';
      worldBookTriggeredPreviewText = '';
      if (worldBookSubView === 'triggeredPreview') {
        renderWorldBookContent();
      }

      try {
        const entry = getEditingWorldBookEntry();
        const content = entry ? await buildWorldBookTriggeredPreviewMessage(entry) : '';
        worldBookTriggeredPreviewText = content || '暂无触发内容';
        worldBookTriggeredPreviewStatus = content ? '已触发世界书内容' : '暂无触发内容';
      } catch (error) {
        worldBookTriggeredPreviewText = '';
        worldBookTriggeredPreviewStatus = '读取失败';
        console.error('[Butterfly Diary][世界书触发预览] 读取失败', error);
      }

      if (worldBookSubView === 'triggeredPreview') {
        renderWorldBookContent();
      }
    }

    function openWorldBookTriggeredPreview() {
      worldBookSubView = 'triggeredPreview';
      worldBookTriggeredPreviewText = '';
      worldBookTriggeredPreviewStatus = '';
      renderWorldBookContent();
      refreshWorldBookTriggeredPreview();
    }

    function closeWorldBookTriggeredPreview() {
      worldBookSubView = 'entry';
      renderWorldBookContent();
    }

    async function refreshWorldBookContentPreview() {
      worldBookContentPreviewStatus = '读取中…';
      worldBookContentPreviewText = '';
      if (worldBookSubView === 'contentPreview') {
        renderWorldBookContent();
      }

      try {
        const entry = getEditingWorldBookEntry();
        const stApi = getSTAPI();
        if (!entry || typeof stApi?.worldBook?.get !== 'function') {
          throw new Error('当前环境不支持 ST_API.worldBook.get');
        }

        const result = await stApi.worldBook.get({
          name: entry.name,
          scope: entry.scope,
        });
        const worldBook = result?.worldBook || {};
        const previewEntries = Array.isArray(worldBook.entries) ? worldBook.entries : [];
        const previewText = previewEntries.length
          ? previewEntries.map((item, index) => {
              const name = String(item?.name || `条目 ${index + 1}`).trim();
              const keywords = Array.isArray(item?.key) ? item.key.filter(Boolean).join(' / ') : '';
              const content = String(item?.content || '').trim();
              return [
                `【${name}】`,
                keywords ? `关键词：${keywords}` : '',
                content,
              ].filter(Boolean).join('\n');
            }).join('\n\n')
          : '暂无条目';
        worldBookContentPreviewText = previewText;
        worldBookContentPreviewStatus = previewEntries.length ? `已读取 ${previewEntries.length} 条条目` : '暂无条目';
      } catch (error) {
        worldBookContentPreviewText = '';
        worldBookContentPreviewStatus = '读取失败';
        console.error('[Butterfly Diary][世界书] 内容预览读取失败', error);
      }

      if (worldBookSubView === 'contentPreview') {
        renderWorldBookContent();
      }
    }

    function openWorldBookContentPreview() {
      worldBookSubView = 'contentPreview';
      worldBookContentPreviewStatus = '';
      worldBookContentPreviewText = '';
      renderWorldBookContent();
      refreshWorldBookContentPreview();
    }

    function closeWorldBookContentPreview() {
      worldBookSubView = 'entry';
      renderWorldBookContent();
    }

    async function runJournalAutoTriggerNow() {
      if (aiPresetGenerating) return false;

      const manualUpdateHistory = pendingManualGenerateLatestMode === 'latest_and_history';
      aiPresetGenerating = true;
      journalAutoTriggerStatusMessage = '手动写入中…';
      renderAutoTriggerContent();

      try {
        const result = await requestDiaryJsonGeneration({
          source: 'manual_generate',
          writeMode: pendingManualGenerateHistoryMode,
          updateLatest: true,
          updateHistory: manualUpdateHistory,
          historyWriteMode: pendingManualGenerateHistoryMode,
        });
        journalAutoTriggerStatusMessage = result.saveResult?.persisted
          ? (manualUpdateHistory
            ? `已立即执行 · ${result.generatedEntries.length} 篇 · ${getManualGenerateHistoryModeLabel(pendingManualGenerateHistoryMode)}`
            : `已立即执行 · ${result.generatedEntries.length} 篇 · 仅刷新最新`)
          : '已生成日记 JSON，但未写入聊天变量';
        renderAutoTriggerContent();
        return true;
      } catch (error) {
        journalAutoTriggerStatusMessage = String(error?.message || '').includes('日记 JSON')
          ? '自动执行失败(JSON格式无效)'
          : `自动执行失败：${String(error?.message || '未知错误').trim() || '未知错误'}`;
        console.error('[Butterfly Diary][自动触发] 立即执行失败', error);
        renderAutoTriggerContent();
        return false;
      } finally {
        aiPresetGenerating = false;
        if (aiPresetSubView === 'list') {
          renderAiPresetContent();
        }
        renderAutoTriggerContent();
      }
    }

    async function handleJournalAutoTriggerChatEvent(triggerRole = 'assistant') {
      const normalizedTriggerRole = String(triggerRole || '').trim() === 'user' ? 'user' : 'assistant';
      const runtimeSettings = getJournalAutoTriggerRuntimeSettings(aiSettings);
      if (!runtimeSettings.enabled || runtimeSettings.role !== normalizedTriggerRole || aiPresetGenerating) {
        return false;
      }

      const activeChatId = getCurrentSTChatId();
      if (!activeChatId) {
        return false;
      }

      const chatMessages = await getSTMainChatMessages();
      if (!chatMessages.length) {
        return false;
      }

      const targetMessages = chatMessages.filter((message) => message.role === normalizedTriggerRole && String(message.content || '').trim());
      const floorCount = targetMessages.length;
      if (!floorCount || floorCount % runtimeSettings.interval !== 0) {
        return false;
      }

      const latestMessage = targetMessages[targetMessages.length - 1] || null;
      const handledKey = buildJournalAutoTriggerHandledKey(normalizedTriggerRole, activeChatId, floorCount, latestMessage?.content || '');
      if (journalAutoTriggerLastHandledKeys[normalizedTriggerRole] === handledKey) {
        return false;
      }
      journalAutoTriggerLastHandledKeys[normalizedTriggerRole] = handledKey;

      aiPresetGenerating = true;
      journalAutoTriggerStatusMessage = `已命中自动触发 · ${getJournalAutoTriggerRoleLabel(normalizedTriggerRole)} · 第 ${floorCount} 楼`;
      if (getCurrentView() === 'settings') {
        renderAutoTriggerContent();
      }

      try {
        const result = await requestDiaryJsonGeneration({
          source: 'auto_trigger_background',
          writeMode: 'append',
          updateLatest: true,
          updateHistory: true,
          historyWriteMode: 'append',
        });
        journalAutoTriggerStatusMessage = result.saveResult?.persisted
          ? `自动写入成功 · ${result.generatedEntries.length} 篇 · 最新覆盖 / 历史追加`
          : '自动生成完成，但未写入聊天变量';
        if (getCurrentView() === 'settings') {
          renderAutoTriggerContent();
        }
        return true;
      } catch (error) {
        journalAutoTriggerStatusMessage = String(error?.message || '').includes('日记 JSON')
          ? '自动触发失败(JSON格式无效)'
          : `自动触发失败：${String(error?.message || '未知错误').trim() || '未知错误'}`;
        console.error(`[Butterfly Diary][自动触发] ${normalizedTriggerRole === 'user' ? '用户' : 'AI'}消息触发失败`, error);
        if (getCurrentView() === 'settings') {
          renderAutoTriggerContent();
        }
        return false;
      } finally {
        aiPresetGenerating = false;
        if (aiPresetSubView === 'list' && getCurrentView() === 'settings') {
          renderAiPresetContent();
        }
        if (getCurrentView() === 'settings') {
          renderAutoTriggerContent();
        }
      }
    }

    function bindJournalAutoTriggerEvents() {
      if (journalAutoTriggerEventsBound) return true;
      const ctx = getSillyTavernContext();
      if (typeof ctx?.eventSource?.on !== 'function') return false;

      const messageReceivedEvent = ctx?.eventTypes?.MESSAGE_RECEIVED || 'message_received';
      const messageSentEvent = ctx?.eventTypes?.MESSAGE_SENT || 'message_sent';
      const chatChangedEvent = ctx?.eventTypes?.CHAT_CHANGED || 'chat_id_changed';
      const handleAssistantMessage = () => {
        Promise.resolve().then(() => handleJournalAutoTriggerChatEvent('assistant')).catch((error) => {
          console.error('[Butterfly Diary][自动触发] AI消息事件处理失败', error);
        });
      };
      const handleUserMessage = () => {
        Promise.resolve().then(() => handleJournalAutoTriggerChatEvent('user')).catch((error) => {
          console.error('[Butterfly Diary][自动触发] 用户消息事件处理失败', error);
        });
      };
      const handleChatChanged = () => {
        resetJournalAutoTriggerHandledKeys();
      };

      ctx.eventSource.on(messageReceivedEvent, handleAssistantMessage);
      ctx.eventSource.on(messageSentEvent, handleUserMessage);
      ctx.eventSource.on(chatChangedEvent, handleChatChanged);
      if (ctx?.eventTypes?.CHAT_LOADED) {
        ctx.eventSource.on(ctx.eventTypes.CHAT_LOADED, handleChatChanged);
      }
      journalAutoTriggerEventsBound = true;
      return true;
    }

    function handleTopRightReturn(pageIndex = 0) {
      const normalizedPageIndex = Number.isFinite(Number(pageIndex)) ? Number(pageIndex) : 0;

      if (normalizedPageIndex === 0) {
        if (aiConfigSubView === 'modelList') {
          closeAiModelList();
          return true;
        }
        if (aiConfigSubView === 'paramConfig') {
          closeAiParamConfig();
          return true;
        }
        if (aiConfigSubView === 'editor') {
          openAiConfig();
          return true;
        }
        return false;
      }

      if (normalizedPageIndex === 1) {
        if (aiMainChatSubView === 'preview') {
          closeAiMainChatPreview();
          return true;
        }
        if (aiMainChatSubView === 'rules') {
          closeAiMainChatRules();
          return true;
        }
        return false;
      }

      if (normalizedPageIndex === 2) {
        if (aiPresetSubView === 'preview') {
          closeAiPresetPreview();
          return true;
        }
        if (aiPresetSubView === 'editor') {
          closeAiPresetEditor();
          return true;
        }
        if (aiPresetSubView === 'importExport') {
          closeAiPresetImportExport();
          return true;
        }
        if (aiPresetSubView === 'infoSourcePicker' || aiPresetSubView === 'infoCreate') {
          aiPresetSubView = 'list';
          renderAiPresetContent();
          return true;
        }
        return false;
      }

      if (normalizedPageIndex === 3) {
        if (worldBookSubView === 'picker') {
          closeWorldBookPicker();
          return true;
        }
        if (worldBookSubView === 'infoSourcePicker') {
          closeWorldBookInfoSourcePicker();
          return true;
        }
        if (worldBookSubView === 'infoBindings') {
          closeWorldBookInfoBindings();
          return true;
        }
        if (worldBookSubView === 'triggeredPreview') {
          closeWorldBookTriggeredPreview();
          return true;
        }
        if (worldBookSubView === 'contentPreview') {
          closeWorldBookContentPreview();
          return true;
        }
        if (worldBookSubView === 'mainChatPreview') {
          closeWorldBookMainChatPreview();
          return true;
        }
        if (worldBookSubView === 'mainChatRules') {
          closeWorldBookMainChatRules();
          return true;
        }
        if (worldBookSubView === 'mainChat') {
          closeWorldBookMainChatSettings();
          return true;
        }
        if (worldBookSubView === 'entry') {
          closeWorldBookEntry();
          return true;
        }
        return false;
      }

      return false;
    }

    function hasFetchedAiModels() {
      return aiConfigConnectionState === 'success' && Array.isArray(getSelectedAiApiProfile(aiSettings)?.modelCache) && getSelectedAiApiProfile(aiSettings).modelCache.length > 0;
    }

    async function fetchAiModels() {
      const modelsEndpoint = getAiModelsEndpoint(pendingAiUrl);
      const apiKey = pendingAiKey.trim();
      if (!modelsEndpoint) {
        aiConfigConnectionState = 'error';
        aiConfigStatusMessage = '连接失败(请先填写端点)';
        renderAiConfigContent();
        return false;
      }
      if (!apiKey) {
        aiConfigConnectionState = 'error';
        aiConfigStatusMessage = '连接失败(请先填写 API Key)';
        renderAiConfigContent();
        return false;
      }

      aiConfigConnectionState = 'idle';
      aiConfigStatusMessage = '正在拉取模型…';
      renderAiConfigContent();

      try {
        const response = await fetch(modelsEndpoint, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.error?.message || `拉取失败 (${response.status})`);
        }
        const models = Array.isArray(data?.data)
          ? data.data.map((item) => String(item?.id || '').trim()).filter(Boolean)
          : [];
        if (!models.length) {
          throw new Error('未获取到模型列表');
        }
        const nextModel = pendingAiModel && models.includes(pendingAiModel) ? pendingAiModel : models[0];
        saveAiApiSettings({
          model: nextModel,
          modelCache: models,
        });
        aiConfigConnectionState = 'success';
        aiConfigStatusMessage = '连接成功';
        renderAiConfigContent();
        return true;
      } catch (error) {
        aiConfigConnectionState = 'error';
        aiConfigStatusMessage = '连接失败(查看控制台)';
        console.error('[Butterfly Diary][AI配置] 模型拉取失败', error);
        renderAiConfigContent();
        return false;
      }
    }

    function handleSettingsInput(event) {
      if (event.target.id === 'ai-settings-name-input') {
        pendingAiApiName = event.target.value;
      }
      if (event.target.id === 'ai-settings-url-input') {
        pendingAiUrl = event.target.value;
        aiConfigConnectionState = 'idle';
      }
      if (event.target.id === 'ai-settings-key-input') {
        pendingAiKey = event.target.value;
        aiConfigConnectionState = 'idle';
      }
      if (event.target.id === 'ai-params-temperature-input') {
        pendingAiTemperature = event.target.value;
      }
      if (event.target.id === 'ai-params-top-p-input') {
        pendingAiTopP = event.target.value;
      }
      if (event.target.id === 'ai-mainchat-context-n-input') {
        pendingAiMainChatContextN = event.target.value;
        aiMainChatStatusMessage = '';
      }
      if (event.target.id === 'ai-mainchat-user-n-input') {
        pendingAiMainChatUserN = event.target.value;
        aiMainChatStatusMessage = '';
      }

      const aiMainChatRuleTagInput = event.target.closest('[data-ai-mainchat-rule-tag-index]');
      if (aiMainChatRuleTagInput) {
        const ruleIndex = Number(aiMainChatRuleTagInput.dataset.aiMainchatRuleTagIndex);
        if (pendingAiMainChatXmlRules[ruleIndex]) {
          pendingAiMainChatXmlRules[ruleIndex].tag = aiMainChatRuleTagInput.value;
          aiMainChatStatusMessage = '';
        }
      }

      const aiMainChatRuleNInput = event.target.closest('[data-ai-mainchat-rule-n-index]');
      if (aiMainChatRuleNInput) {
        const ruleIndex = Number(aiMainChatRuleNInput.dataset.aiMainchatRuleNIndex);
        if (pendingAiMainChatXmlRules[ruleIndex]) {
          pendingAiMainChatXmlRules[ruleIndex].n = aiMainChatRuleNInput.value;
          aiMainChatStatusMessage = '';
        }
      }

      if (event.target.id === 'worldbook-mainchat-context-n-input') {
        pendingWorldBookMainChatContextN = event.target.value;
        worldBookStatusMessage = '';
      }
      if (event.target.id === 'worldbook-mainchat-user-n-input') {
        pendingWorldBookMainChatUserN = event.target.value;
        worldBookStatusMessage = '';
      }

      const worldBookMainChatRuleTagInput = event.target.closest('[data-worldbook-mainchat-rule-tag-index]');
      if (worldBookMainChatRuleTagInput) {
        const ruleIndex = Number(worldBookMainChatRuleTagInput.dataset.worldbookMainchatRuleTagIndex);
        if (pendingWorldBookMainChatXmlRules[ruleIndex]) {
          pendingWorldBookMainChatXmlRules[ruleIndex].tag = worldBookMainChatRuleTagInput.value;
          worldBookStatusMessage = '';
        }
      }

      const worldBookMainChatRuleNInput = event.target.closest('[data-worldbook-mainchat-rule-n-index]');
      if (worldBookMainChatRuleNInput) {
        const ruleIndex = Number(worldBookMainChatRuleNInput.dataset.worldbookMainchatRuleNIndex);
        if (pendingWorldBookMainChatXmlRules[ruleIndex]) {
          pendingWorldBookMainChatXmlRules[ruleIndex].n = worldBookMainChatRuleNInput.value;
          worldBookStatusMessage = '';
        }
      }

      if (event.target.id === 'journal-auto-trigger-interval-input') {
        pendingJournalAutoTriggerInterval = event.target.value;
      }

      if (event.target.id === 'ai-preset-import-export-text') {
        aiPresetImportExportText = event.target.value;
      }

      if (event.target.id === 'ai-preset-block-name-input') {
        const draft = getAiPresetDraft('user');
        pendingAiPresetBlockDraft = normalizeAiPresetBlock({
          ...draft,
          name: event.target.value,
        }, editingAiPresetBlockIndex >= 0 ? editingAiPresetBlockIndex : pendingAiPresetBlocks.length);
      }
      if (event.target.id === 'ai-preset-block-text-input') {
        const draft = getAiPresetDraft('user');
        pendingAiPresetBlockDraft = normalizeAiPresetBlock({
          ...draft,
          text: event.target.value,
        }, editingAiPresetBlockIndex >= 0 ? editingAiPresetBlockIndex : pendingAiPresetBlocks.length);
      }
    }

    function handleSettingsClick(event) {
      const createButton = event.target.closest('#ai-api-create');
      if (createButton) {
        openNewAiApiProfileDraft();
        return;
      }

      const deleteButton = event.target.closest('[data-ai-api-delete-id]');
      if (deleteButton) {
        deleteAiApiProfile(deleteButton.dataset.aiApiDeleteId || '');
        return;
      }

      const profileItem = event.target.closest('[data-ai-api-profile-id]');
      if (profileItem) {
        selectAiApiProfile(profileItem.dataset.aiApiProfileId || '', { openEditor: true });
        return;
      }

      const aiModelItem = event.target.closest('[data-ai-model-index]');
      if (aiModelItem && aiConfigSubView === 'modelList') {
        selectedAiModelIndex = Number(aiModelItem.dataset.aiModelIndex);
        const selectedModel = getSelectedAiModel();
        if (selectedModel) {
          pendingAiModel = selectedModel;
          saveAiApiSettings({ model: selectedModel });
          aiConfigStatusMessage = '已选择模型';
        }
        closeAiModelList();
        return;
      }

      if (event.target.closest('#ai-model-open')) {
        if (hasFetchedAiModels()) {
          openAiModelList();
        } else {
          fetchAiModels();
        }
        return;
      }

      if (event.target.closest('#ai-model-back')) {
        closeAiModelList();
        return;
      }

      if (event.target.closest('#ai-params-open')) {
        openAiParamConfig();
        return;
      }

      if (event.target.closest('#ai-params-save')) {
        saveAiApiSettings({
          temperature: pendingAiTemperature,
          topP: pendingAiTopP,
        });
        aiConfigStatusMessage = '已保存';
        closeAiParamConfig();
        return;
      }

      if (event.target.closest('#ai-params-cancel')) {
        closeAiParamConfig();
        return;
      }

      if (event.target.closest('#ai-settings-save')) {
        saveAiApiSettings();
        aiConfigStatusMessage = '已保存API';
        aiConfigSubView = 'list';
        renderAiConfigContent();
        return;
      }

      if (event.target.closest('#ai-mainchat-rules-open')) {
        openAiMainChatRules();
        return;
      }

      if (event.target.closest('#ai-mainchat-preview-open')) {
        openAiMainChatPreview();
        return;
      }

      if (event.target.closest('#ai-mainchat-save')) {
        saveAiMainChatSettings();
        aiMainChatStatusMessage = '已保存主聊天';
        aiMainChatSubView = 'main';
        renderAiMainChatContent();
        return;
      }

      if (event.target.closest('#ai-mainchat-rule-add')) {
        pendingAiMainChatXmlRules.push({ tag: '', mode: 'recent', n: '' });
        aiMainChatStatusMessage = '';
        renderAiMainChatContent();
        return;
      }

      const aiMainChatRuleDeleteButton = event.target.closest('[data-ai-mainchat-rule-delete-index]');
      if (aiMainChatRuleDeleteButton && aiMainChatSubView === 'rules') {
        pendingAiMainChatXmlRules.splice(Number(aiMainChatRuleDeleteButton.dataset.aiMainchatRuleDeleteIndex), 1);
        aiMainChatStatusMessage = '';
        renderAiMainChatContent();
        return;
      }

      const aiMainChatRuleModeToggleButton = event.target.closest('[data-ai-mainchat-rule-mode-toggle-index]');
      if (aiMainChatRuleModeToggleButton && aiMainChatSubView === 'rules') {
        const ruleIndex = Number(aiMainChatRuleModeToggleButton.dataset.aiMainchatRuleModeToggleIndex);
        if (pendingAiMainChatXmlRules[ruleIndex]) {
          pendingAiMainChatXmlRules[ruleIndex].mode = pendingAiMainChatXmlRules[ruleIndex].mode === 'exclude' ? 'recent' : 'exclude';
          aiMainChatStatusMessage = '';
          flashAiMainChatRuleMode(ruleIndex);
        }
        return;
      }

      if (event.target.closest('#ai-mainchat-preview-refresh')) {
        refreshAiMainChatPreview();
        return;
      }

      if (event.target.closest('#worldbook-open-picker')) {
        openWorldBookPicker();
        return;
      }

      if (event.target.closest('#worldbook-picker-refresh')) {
        loadWorldBookPickerEntries();
        return;
      }

      const worldBookPickerItem = event.target.closest('[data-worldbook-picker-source-id]');
      if (worldBookPickerItem && worldBookSubView === 'picker') {
        addSelectedWorldBookEntry(worldBookPickerItem.dataset.worldbookPickerSourceId || '');
        return;
      }

      const worldBookDeleteButton = event.target.closest('[data-worldbook-entry-delete-index]');
      if (worldBookDeleteButton && worldBookSubView === 'list') {
        deleteWorldBookEntry(worldBookDeleteButton.dataset.worldbookEntryDeleteIndex);
        return;
      }

      const worldBookEntryItem = event.target.closest('[data-worldbook-entry-index]');
      if (worldBookEntryItem && worldBookSubView === 'list') {
        openWorldBookEntry(worldBookEntryItem.dataset.worldbookEntryIndex);
        return;
      }

      if (event.target.closest('#worldbook-mainchat-open')) {
        openWorldBookMainChatSettings();
        return;
      }

      if (event.target.closest('#worldbook-content-preview-open')) {
        openWorldBookContentPreview();
        return;
      }

      if (event.target.closest('#worldbook-mainchat-rules-open')) {
        openWorldBookMainChatRules();
        return;
      }

      if (event.target.closest('#worldbook-mainchat-preview-open')) {
        openWorldBookMainChatPreview();
        return;
      }

      if (event.target.closest('#worldbook-mainchat-save')) {
        saveEditingWorldBookMainChatSettings();
        return;
      }

      if (event.target.closest('#worldbook-mainchat-rule-add')) {
        pendingWorldBookMainChatXmlRules.push({ tag: '', mode: 'recent', n: '' });
        worldBookStatusMessage = '';
        renderWorldBookContent();
        return;
      }

      const worldBookMainChatRuleDeleteButton = event.target.closest('[data-worldbook-mainchat-rule-delete-index]');
      if (worldBookMainChatRuleDeleteButton && worldBookSubView === 'mainChatRules') {
        pendingWorldBookMainChatXmlRules.splice(Number(worldBookMainChatRuleDeleteButton.dataset.worldbookMainchatRuleDeleteIndex), 1);
        worldBookStatusMessage = '';
        renderWorldBookContent();
        return;
      }

      const worldBookMainChatRuleModeToggleButton = event.target.closest('[data-worldbook-mainchat-rule-mode-toggle-index]');
      if (worldBookMainChatRuleModeToggleButton && worldBookSubView === 'mainChatRules') {
        const ruleIndex = Number(worldBookMainChatRuleModeToggleButton.dataset.worldbookMainchatRuleModeToggleIndex);
        if (pendingWorldBookMainChatXmlRules[ruleIndex]) {
          pendingWorldBookMainChatXmlRules[ruleIndex].mode = pendingWorldBookMainChatXmlRules[ruleIndex].mode === 'exclude' ? 'recent' : 'exclude';
          worldBookStatusMessage = '';
          flashWorldBookMainChatRuleMode(ruleIndex);
        }
        return;
      }

      if (event.target.closest('#worldbook-mainchat-preview-refresh')) {
        refreshWorldBookMainChatPreview();
        return;
      }

      if (event.target.closest('#worldbook-content-preview-refresh')) {
        refreshWorldBookContentPreview();
        return;
      }

      if (event.target.closest('#worldbook-info-bindings-open')) {
        openWorldBookInfoBindings();
        return;
      }

      if (event.target.closest('#worldbook-triggered-preview-open')) {
        openWorldBookTriggeredPreview();
        return;
      }

      if (event.target.closest('#worldbook-info-binding-add')) {
        openWorldBookInfoSourcePicker();
        return;
      }

      const worldBookInfoBindingDeleteButton = event.target.closest('[data-worldbook-info-binding-delete-index]');
      if (worldBookInfoBindingDeleteButton && worldBookSubView === 'infoBindings') {
        deleteWorldBookInfoSourceBinding(worldBookInfoBindingDeleteButton.dataset.worldbookInfoBindingDeleteIndex);
        return;
      }

      const worldBookInfoSourceItem = event.target.closest('[data-worldbook-info-source-id]');
      if (worldBookInfoSourceItem && worldBookSubView === 'infoSourcePicker') {
        addSelectedWorldBookInfoSourceBinding(worldBookInfoSourceItem.dataset.worldbookInfoSourceId || '');
        return;
      }

      if (event.target.closest('#worldbook-triggered-preview-refresh')) {
        refreshWorldBookTriggeredPreview();
        return;
      }

      const aiPresetMoveButton = event.target.closest('[data-ai-preset-move-index]');
      if (aiPresetMoveButton && aiPresetSubView === 'list') {
        moveAiPresetBlock(aiPresetMoveButton.dataset.aiPresetMoveIndex, aiPresetMoveButton.dataset.aiPresetMoveDirection);
        return;
      }

      const aiPresetDeleteButton = event.target.closest('[data-ai-preset-delete-index]');
      if (aiPresetDeleteButton && aiPresetSubView === 'list') {
        deleteAiPresetBlock(aiPresetDeleteButton.dataset.aiPresetDeleteIndex);
        return;
      }

      if (event.target.closest('#ai-preset-add-message')) {
        openAiPresetEditor(-1, 'user');
        return;
      }

      if (event.target.closest('#ai-preset-add-context')) {
        addAiPresetContextBlock();
        return;
      }

      if (event.target.closest('#ai-preset-add-info')) {
        openAiPresetInfoBlockCreatePage();
        return;
      }

      if (event.target.closest('#ai-preset-info-role-toggle')) {
        cycleAiPresetInfoRole();
        return;
      }

      const aiPresetCreateSourceItem = event.target.closest('[data-ai-preset-create-source-id]');
      if (aiPresetCreateSourceItem && (aiPresetSubView === 'infoCreate' || aiPresetSubView === 'infoSourcePicker')) {
        applyAiPresetInfoSourceSelection(
          aiPresetCreateSourceItem.dataset.aiPresetCreateSourceId || '',
          aiPresetCreateSourceItem.dataset.aiPresetCreateSourceName || ''
        );
        return;
      }

      if (event.target.closest('#ai-preset-import-only')) {
        openAiPresetImportExport();
        aiPresetStatusMessage = '导入模式';
        renderAiPresetContent();
        return;
      }

      if (event.target.closest('#ai-preset-export-only')) {
        openAiPresetImportExport();
        aiPresetStatusMessage = '导出模式';
        renderAiPresetContent();
        return;
      }

      if (event.target.closest('#ai-preset-import-apply')) {
        importAiPresetFromText(aiPresetImportExportText);
        return;
      }

      if (event.target.closest('#ai-preset-export-refresh')) {
        aiPresetImportExportText = JSON.stringify(exportAiPresetPayload(), null, 2);
        renderAiPresetContent();
        return;
      }

      if (event.target.closest('#ai-preset-generate')) {
        generateDiaryFromPreset();
        return;
      }

      if (event.target.closest('#ai-preset-preview-open')) {
        openAiPresetTotalPreview();
        return;
      }

      if (event.target.closest('#ai-preset-save')) {
        saveAiPresetSettings();
        aiPresetStatusMessage = '已保存预设';
        aiPresetSubView = 'list';
        renderAiPresetContent();
        return;
      }

      if (event.target.closest('#journal-auto-trigger-enabled-toggle')) {
        pendingJournalAutoTriggerEnabled = !pendingJournalAutoTriggerEnabled;
        renderAutoTriggerContent();
        return;
      }

      if (event.target.closest('#journal-auto-trigger-role-toggle')) {
        pendingJournalAutoTriggerRole = pendingJournalAutoTriggerRole === 'user' ? 'assistant' : 'user';
        renderAutoTriggerContent();
        return;
      }

      if (event.target.closest('#journal-auto-trigger-write-mode-toggle')) {
        renderAutoTriggerContent();
        return;
      }

      if (event.target.closest('#manual-generate-latest-mode-toggle')) {
        pendingManualGenerateLatestMode = pendingManualGenerateLatestMode === 'latest_and_history' ? 'latest_only' : 'latest_and_history';
        renderAutoTriggerContent();
        return;
      }

      if (event.target.closest('#manual-generate-history-mode-toggle')) {
        pendingManualGenerateHistoryMode = pendingManualGenerateHistoryMode === 'replace' ? 'append' : 'replace';
        renderAutoTriggerContent();
        return;
      }

      if (event.target.closest('#journal-auto-trigger-save')) {
        saveJournalAutoTriggerSettings();
        return;
      }

      if (event.target.closest('#journal-auto-trigger-run-now')) {
        runJournalAutoTriggerNow();
        return;
      }

      if (event.target.closest('#ai-preset-block-role-toggle')) {
        cycleAiPresetDraftRole(1);
        return;
      }

      if (event.target.closest('#ai-preset-block-save')) {
        saveAiPresetBlockDraft();
        return;
      }

      const aiPresetBlockItem = event.target.closest('[data-ai-preset-block-index]');
      if (aiPresetBlockItem && aiPresetSubView === 'list') {
        openAiPresetItem(aiPresetBlockItem.dataset.aiPresetBlockIndex);
        return;
      }
    }

    function renderAiConfigList() {
      const savedProfiles = Array.isArray(aiSettings?.apiProfiles) ? aiSettings.apiProfiles : [];
      const selectedProfileId = aiSettings?.selectedApiProfileId || '';
      const profileListHtml = savedProfiles.length
        ? savedProfiles.map((profile) => {
            const subtitle = [profile.model || '未设模型', getAiApiHostLabel(profile.url) || profile.url || '未设端点']
              .filter(Boolean)
              .join(' · ');
            return `
              <div class="screensaver-saved-item ai-api-profile-item ${selectedProfileId === profile.id ? 'is-selected' : ''}" data-ai-api-profile-id="${profile.id}">
                <div class="screensaver-saved-main">
                  <div class="ai-api-profile-head">
                    <span class="screensaver-saved-name">${escapeHtml(profile.name || '默认')}</span>
                  </div>
                  <span class="screensaver-saved-url">${escapeHtml(subtitle)}</span>
                </div>
                <button class="screensaver-delete-button" data-ai-api-delete-id="${profile.id}" type="button">×</button>
              </div>
            `;
          }).join('')
        : '<div class="app-subline ai-api-empty">暂无已保存 API，可先新增一个。</div>';

      return `
        <div class="app-mainline">${escapeHtml(aiConfigStatusMessage || 'API 列表')}</div>
        <div class="settings-list">
          <button class="setting-row" id="ai-api-create" type="button">
            <span class="setting-row-label">新增API连接</span>
            <span class="setting-row-value-wrap">
              <span class="setting-row-value">新建</span>
              <span class="setting-row-arrow">＋</span>
            </span>
          </button>
        </div>
        <div class="screensaver-saved-list ai-api-profile-list" id="ai-api-profile-list">${profileListHtml}</div>
      `;
    }

    function renderAiConfigEditor() {
      const modelRowStateClass = aiConfigConnectionState === 'success'
        ? 'is-ready'
        : aiConfigConnectionState === 'error'
          ? 'is-error'
          : '';

      return `
        <div class="app-mainline">${escapeHtml(aiConfigStatusMessage || ((pendingAiApiName || '').trim() || '默认'))}</div>
        <div class="settings-editor">
          <input class="settings-editor-field ai-config-field" id="ai-settings-name-input" type="text" maxlength="32" spellcheck="false" value="${escapeHtml(pendingAiApiName)}" placeholder="默认">
          <input class="settings-editor-field ai-config-field" id="ai-settings-url-input" type="text" spellcheck="false" value="${escapeHtml(pendingAiUrl)}" placeholder="自定义端点">
          <input class="settings-editor-field ai-config-field" id="ai-settings-key-input" type="password" spellcheck="false" value="${escapeHtml(pendingAiKey)}" placeholder="API Key">
        </div>
        <div class="settings-list">
          <button class="setting-row ${modelRowStateClass}" id="ai-model-open" type="button">
            <span class="setting-row-label">模型</span>
            <span class="setting-row-value-wrap">
              <span class="setting-row-value">${escapeHtml(String(pendingAiModel || '').trim() || '未设')}</span>
              <span class="setting-row-arrow">›</span>
            </span>
          </button>
          <button class="setting-row" id="ai-params-open" type="button">
            <span class="setting-row-label">参数配置</span>
            <span class="setting-row-value-wrap">
              <span class="setting-row-value">已设</span>
              <span class="setting-row-arrow">›</span>
            </span>
          </button>
          <button class="setting-row" id="ai-settings-save" type="button">
            <span class="setting-row-label">保存当前API</span>
            <span class="setting-row-value-wrap">
              <span class="setting-row-value">保存</span>
              <span class="setting-row-arrow">✓</span>
            </span>
          </button>
        </div>
      `;
    }

    function renderAiParamConfig() {
      return `
        <div class="app-mainline">参数配置</div>
        <div class="settings-editor">
          <div class="app-subline">仅支持 Temperature / Top P</div>
          <input class="settings-editor-field" id="ai-params-temperature-input" type="number" min="0" max="2" step="0.1" inputmode="decimal" spellcheck="false" value="${escapeHtml(pendingAiTemperature)}" placeholder="温度 0-2">
          <input class="settings-editor-field" id="ai-params-top-p-input" type="number" min="0" max="1" step="0.1" inputmode="decimal" spellcheck="false" value="${escapeHtml(pendingAiTopP)}" placeholder="Top P 0-1">
        </div>
        <div class="settings-list">
          <button class="setting-row" id="ai-params-save" type="button">
            <span class="setting-row-label">保存参数</span>
            <span class="setting-row-value-wrap">
              <span class="setting-row-value">保存</span>
              <span class="setting-row-arrow">✓</span>
            </span>
          </button>
          <button class="setting-row" id="ai-params-cancel" type="button">
            <span class="setting-row-label">返回上一级</span>
            <span class="setting-row-value-wrap">
              <span class="setting-row-value">返回</span>
              <span class="setting-row-arrow">‹</span>
            </span>
          </button>
        </div>
      `;
    }

    function renderAiModelList() {
      const modelCache = Array.isArray(getSelectedAiApiProfile(aiSettings)?.modelCache) ? getSelectedAiApiProfile(aiSettings).modelCache : [];
      const modelListHtml = modelCache.map((model, index) => {
        const modelText = String(model || '').trim();
        return `
          <div class="screensaver-saved-item ${selectedAiModelIndex === index ? 'is-selected' : ''}" data-ai-model-index="${index}">
            <div class="screensaver-saved-main">
              <span class="screensaver-saved-name">${escapeHtml(modelText)}</span>
            </div>
          </div>
        `;
      }).join('');

      return modelCache.length
        ? `
          <div class="app-mainline">模型列表</div>
          <div class="app-subline">点击一项即可切换当前模型</div>
          <div class="screensaver-saved-list" id="ai-model-list">${modelListHtml}</div>
          <div class="settings-list">
            <button class="setting-row" id="ai-model-back" type="button">
              <span class="setting-row-label">返回编辑页</span>
              <span class="setting-row-value-wrap">
                <span class="setting-row-value">返回</span>
                <span class="setting-row-arrow">‹</span>
              </span>
            </button>
          </div>
        `
        : `
          <div class="app-mainline">暂无模型</div>
          <div class="app-subline">请先连接，或返回编辑页。</div>
          <div class="settings-list">
            <button class="setting-row" id="ai-model-back" type="button">
              <span class="setting-row-label">返回编辑页</span>
              <span class="setting-row-value-wrap">
                <span class="setting-row-value">返回</span>
                <span class="setting-row-arrow">‹</span>
              </span>
            </button>
          </div>
        `;
    }

    function renderAiMainChatConfig() {
      return `
        <div class="app-mainline">${escapeHtml(aiMainChatStatusMessage || '主聊天')}</div>
        <div class="settings-editor">
          <div class="app-subline">最近AI消息范围</div>
          <input class="settings-editor-field" id="ai-mainchat-context-n-input" type="number" min="0" max="99" step="1" inputmode="numeric" spellcheck="false" value="${escapeHtml(pendingAiMainChatContextN)}" placeholder="最近AI消息范围">
          <div class="app-microline">空=全部，0=不读取，数字=最近N条AI消息</div>
          <div class="app-subline">最近用户消息范围</div>
          <input class="settings-editor-field" id="ai-mainchat-user-n-input" type="number" min="0" max="99" step="1" inputmode="numeric" spellcheck="false" value="${escapeHtml(pendingAiMainChatUserN)}" placeholder="最近用户消息范围">
          <div class="app-microline">空=全部，0=不发送，数字=最近N条用户消息</div>
        </div>
        <div class="settings-list">
          <button class="setting-row" id="ai-mainchat-rules-open" type="button">
            <span class="setting-row-label">XML规则</span>
            <span class="setting-row-value-wrap">
              <span class="setting-row-value">${pendingAiMainChatXmlRules.length ? `${pendingAiMainChatXmlRules.length}项` : '空'}</span>
              <span class="setting-row-arrow">›</span>
            </span>
          </button>
          <button class="setting-row" id="ai-mainchat-preview-open" type="button">
            <span class="setting-row-label">预览上下文</span>
            <span class="setting-row-value-wrap">
              <span class="setting-row-value">查看</span>
              <span class="setting-row-arrow">›</span>
            </span>
          </button>
          <button class="setting-row" id="ai-mainchat-save" type="button">
            <span class="setting-row-label">保存主聊天</span>
            <span class="setting-row-value-wrap">
              <span class="setting-row-value">${escapeHtml(getAiMainChatSummaryLabel(buildPendingAiMainChatSettingsSource(aiSettings)))}</span>
              <span class="setting-row-arrow">✓</span>
            </span>
          </button>
        </div>
      `;
    }

    function renderAiMainChatRules() {
      const rulesHtml = pendingAiMainChatXmlRules.length
        ? pendingAiMainChatXmlRules.map((rule, index) => `
            <div class="ai-mainchat-rule">
              <div class="ai-mainchat-rule-top">
                <input class="settings-editor-field ai-mainchat-rule-tag" data-ai-mainchat-rule-tag-index="${index}" type="text" maxlength="24" spellcheck="false" value="${escapeHtml(rule.tag)}" placeholder="标签名">
                <button class="screensaver-delete-button ai-mainchat-rule-delete" data-ai-mainchat-rule-delete-index="${index}" type="button">×</button>
              </div>
              <div class="ai-mainchat-rule-bottom">
                <button class="ai-mainchat-rule-mode-button ${aiMainChatModeFlashIndex === index ? 'is-flash' : ''}" data-ai-mainchat-rule-mode-toggle-index="${index}" type="button">${rule.mode === 'exclude' ? '排除最近N楼' : '最近N楼'}</button>
                <input class="settings-editor-field ai-mainchat-rule-n" data-ai-mainchat-rule-n-index="${index}" type="number" min="0" max="99" step="1" inputmode="numeric" spellcheck="false" value="${escapeHtml(rule.n)}" placeholder="N">
              </div>
            </div>
          `).join('')
        : '<div class="app-subline">无规则，AI消息将按原文读取</div>';

      return `
        <div class="app-mainline">XML规则</div>
        <div class="ai-mainchat-rules" id="ai-mainchat-rules">${rulesHtml}</div>
        <div class="settings-list">
          <button class="setting-row" id="ai-mainchat-rule-add" type="button">
            <span class="setting-row-label">新增XML规则</span>
            <span class="setting-row-value-wrap">
              <span class="setting-row-value">新增</span>
              <span class="setting-row-arrow">＋</span>
            </span>
          </button>
        </div>
      `;
    }

    function renderAiMainChatPreviewView() {
      return `
        <div class="app-mainline">主聊天预览</div>
        <div class="ai-mainchat-preview-layout">
          <div class="settings-editor ai-mainchat-preview-stage">
            <div class="ai-mainchat-preview" id="ai-mainchat-preview-output">${escapeHtml(aiMainChatPreviewText || '')}</div>
            <div class="app-microline ai-mainchat-preview-status">${escapeHtml(aiMainChatPreviewStatus || '仅读取酒馆主聊天中的 AI / 用户消息')}</div>
          </div>
          <div class="ai-mainchat-preview-actions">
            <button class="setting-row ai-preset-side-button" id="ai-mainchat-preview-refresh" type="button">
              <span class="setting-row-label">刷新</span>
            </button>
          </div>
        </div>
      `;
    }

    function renderAiPresetListView() {
      const blocks = normalizeAiPresetBlocks(pendingAiPresetBlocks);
      const blocksHtml = blocks.length
        ? blocks.map((block, index) => {
            const canMoveUp = index > 0;
            const canMoveDown = index < blocks.length - 1;
            const subtitle = getAiPresetBlockSubtitle(block);
            return `
              <div class="screensaver-saved-item ai-preset-block-item ${selectedAiPresetBlockIndex === index ? 'is-selected' : ''} ${String(block.role || '').trim() === '_context' ? 'is-slot' : ''}" data-ai-preset-block-index="${index}">
                <div class="screensaver-saved-main ai-preset-block-main">
                  <span class="screensaver-saved-name">${escapeHtml(getAiPresetBlockDisplayName(block, index))}</span>
                  ${subtitle ? `<span class="screensaver-saved-url ai-preset-block-role">${escapeHtml(subtitle)}</span>` : ''}
                </div>
                <div class="ai-preset-block-actions">
                  <button class="ai-preset-block-move-button" data-ai-preset-move-index="${index}" data-ai-preset-move-direction="-1" type="button" ${canMoveUp ? '' : 'disabled'}>↑</button>
                  <button class="ai-preset-block-move-button" data-ai-preset-move-index="${index}" data-ai-preset-move-direction="1" type="button" ${canMoveDown ? '' : 'disabled'}>↓</button>
                  <button class="screensaver-delete-button" data-ai-preset-delete-index="${index}" type="button">×</button>
                </div>
              </div>
            `;
          }).join('')
        : '';

      return `
        <div class="app-mainline">${escapeHtml(aiPresetStatusMessage || '预设')}</div>
        <div class="ai-preset-layout">
          <div class="ai-preset-block-stage ${blocks.length ? '' : 'is-empty'}">
            ${blocks.length
              ? `<div class="screensaver-saved-list ai-preset-block-list" id="ai-preset-block-list">${blocksHtml}</div>`
              : '<div class="ai-preset-block-stage-empty" aria-hidden="true"></div>'}
          </div>
          <div class="ai-preset-side-actions">
            <button class="setting-row ai-preset-side-button" id="ai-preset-add-message" type="button" title="新增消息块">
              <span class="setting-row-label">消息块</span>
            </button>
            <button class="setting-row ai-preset-side-button" id="ai-preset-add-context" type="button" title="新增主聊天槽">
              <span class="setting-row-label">主聊天</span>
            </button>
            <button class="setting-row ai-preset-side-button" id="ai-preset-add-info" type="button" title="新增信息块">
              <span class="setting-row-label">信息块</span>
            </button>
            <button class="setting-row ai-preset-side-button" id="ai-preset-import-only" type="button" title="导入预设 JSON">
              <span class="setting-row-label">导入</span>
            </button>
            <button class="setting-row ai-preset-side-button" id="ai-preset-export-only" type="button" title="导出预设 JSON">
              <span class="setting-row-label">导出</span>
            </button>
            <button class="setting-row ai-preset-side-button" id="ai-preset-preview-open" type="button" title="预设总览">
              <span class="setting-row-label">总览</span>
            </button>
            <button class="setting-row ai-preset-side-button" id="ai-preset-save" type="button" title="保存预设">
              <span class="setting-row-label">保存</span>
            </button>
          </div>
        </div>
      `;
    }

    function renderAiPresetMessageEditor() {
      const draft = normalizeAiPresetBlock(getAiPresetDraft('user'), editingAiPresetBlockIndex >= 0 ? editingAiPresetBlockIndex : pendingAiPresetBlocks.length);
      const title = editingAiPresetBlockIndex >= 0 ? '编辑消息块' : '新增消息块';
      return `
        <div class="app-mainline">${escapeHtml(title)}</div>
        <div class="ai-preset-editor">
          <div class="settings-editor ai-preset-message-editor">
            <input class="settings-editor-field" id="ai-preset-block-name-input" type="text" maxlength="32" spellcheck="false" value="${escapeHtml(draft.name || '')}" placeholder="块名称">
            <button class="setting-row" id="ai-preset-block-role-toggle" type="button">
              <span class="setting-row-label">角色</span>
              <span class="setting-row-value-wrap">
                <span class="setting-row-value">${escapeHtml(draft.role)}</span>
                <span class="setting-row-arrow">⇆</span>
              </span>
            </button>
            <textarea class="settings-editor-input ai-preset-message-textarea" id="ai-preset-block-text-input" spellcheck="false" placeholder="内容">${escapeHtml(draft.text || '')}</textarea>
          </div>
          <div class="settings-list">
            <button class="setting-row" id="ai-preset-block-save" type="button">
              <span class="setting-row-label">保存当前块</span>
              <span class="setting-row-value-wrap">
                <span class="setting-row-value">保存</span>
                <span class="setting-row-arrow">✓</span>
              </span>
            </button>
          </div>
        </div>
      `;
    }

    function renderAiPresetInfoSourcePickerView() {
      const sources = getAiPresetInfoSources();
      const roleLabel = normalizeAiPresetInfoRole(pendingAiPresetInfoRole);
      const sourceHtml = sources.length
        ? sources.map((source) => `
            <button class="screensaver-saved-item" data-ai-preset-create-source-id="${escapeHtml(source.id)}" data-ai-preset-create-source-name="${escapeHtml(source.name)}" type="button">
              <div class="screensaver-saved-main">
                <span class="screensaver-saved-name">${escapeHtml(source.name)}</span>
                <span class="screensaver-saved-url">${escapeHtml(source.subtitle || '')}</span>
              </div>
            </button>
          `).join('')
        : '<div class="app-subline ai-api-empty">暂无信息来源</div>';
      return `
        <div class="app-mainline">${escapeHtml(aiPresetStatusMessage || '选择信息块来源')}</div>
        <div class="settings-list">
          <button class="setting-row" id="ai-preset-info-role-toggle" type="button">
            <span class="setting-row-label">信息块角色</span>
            <span class="setting-row-value-wrap">
              <span class="setting-row-value">${escapeHtml(roleLabel)}</span>
              <span class="setting-row-arrow">⇆</span>
            </span>
          </button>
        </div>
        <div class="screensaver-saved-list">${sourceHtml}</div>
      `;
    }

    function renderAiPresetImportExportView() {
      return `
        <div class="app-mainline">${escapeHtml(aiPresetStatusMessage || '预设导入导出')}</div>
        <div class="settings-editor ai-preset-message-editor">
          <textarea class="settings-editor-input ai-preset-message-textarea" id="ai-preset-import-export-text" spellcheck="false" placeholder="粘贴预设 JSON，或复制当前导出内容">${escapeHtml(aiPresetImportExportText || '')}</textarea>
        </div>
        <div class="settings-list">
          <button class="setting-row" id="ai-preset-import-apply" type="button">
            <span class="setting-row-label">导入到当前预设</span>
            <span class="setting-row-value-wrap">
              <span class="setting-row-value">导入</span>
              <span class="setting-row-arrow">↓</span>
            </span>
          </button>
          <button class="setting-row" id="ai-preset-export-refresh" type="button">
            <span class="setting-row-label">刷新导出内容</span>
            <span class="setting-row-value-wrap">
              <span class="setting-row-value">导出</span>
              <span class="setting-row-arrow">↑</span>
            </span>
          </button>
        </div>
      `;
    }

    function renderAiPresetPreviewView() {
      return `
        <div class="app-mainline">${escapeHtml(aiPresetPreviewTitle || '预设预览')}</div>
        <div class="settings-editor">
          <div class="ai-mainchat-preview">${escapeHtml(aiPresetPreviewText || '')}</div>
        </div>
        <div class="app-microline ai-mainchat-preview-status">${escapeHtml(aiPresetPreviewStatus || '')}</div>
      `;
    }

    function renderWorldBookListView() {
      const entries = getWorldBookEntries();
      const listHtml = entries.length
        ? entries.map((entry, index) => `
            <div class="screensaver-saved-item ${editingWorldBookIndex === index ? 'is-selected' : ''}" data-worldbook-entry-index="${index}">
              <div class="screensaver-saved-main">
                <span class="screensaver-saved-name">${escapeHtml(entry.name)}</span>
                <span class="screensaver-saved-url">${escapeHtml(getWorldBookScopeLabel(entry.scope))}</span>
              </div>
              <button class="screensaver-delete-button" data-worldbook-entry-delete-index="${index}" type="button">×</button>
            </div>
          `).join('')
        : '<div class="app-subline ai-api-empty">暂无已选世界书，可先添加一本。</div>';

      return `
        <div class="app-mainline">${escapeHtml(worldBookStatusMessage || '世界书')}</div>
        <div class="settings-list">
          <button class="setting-row" id="worldbook-open-picker" type="button">
            <span class="setting-row-label">添加世界书</span>
            <span class="setting-row-value-wrap">
              <span class="setting-row-value">${escapeHtml(getWorldBookSummaryLabel(entries))}</span>
              <span class="setting-row-arrow">＋</span>
            </span>
          </button>
        </div>
        <div class="screensaver-saved-list">${listHtml}</div>
      `;
    }

    function renderWorldBookPickerView() {
      const listHtml = worldBookPickerEntries.length
        ? worldBookPickerEntries.map((entry) => `
            <div class="screensaver-saved-item" data-worldbook-picker-source-id="${escapeHtml(entry.sourceId)}">
              <div class="screensaver-saved-main">
                <span class="screensaver-saved-name">${escapeHtml(entry.name)}</span>
                <span class="screensaver-saved-url">${escapeHtml(getWorldBookScopeLabel(entry.scope))}</span>
              </div>
            </div>
          `).join('')
        : `<div class="app-subline ai-api-empty">${escapeHtml(worldBookPickerStatus || '暂无可添加世界书')}</div>`;

      return `
        <div class="app-mainline">添加世界书</div>
        <div class="settings-list">
          <button class="setting-row" id="worldbook-picker-refresh" type="button">
            <span class="setting-row-label">刷新列表</span>
            <span class="setting-row-value-wrap">
              <span class="setting-row-value">${escapeHtml(worldBookPickerStatus || '刷新')}</span>
              <span class="setting-row-arrow">↻</span>
            </span>
          </button>
        </div>
        <div class="screensaver-saved-list">${listHtml}</div>
      `;
    }

    function renderWorldBookEntryView() {
      const entry = getEditingWorldBookEntry();
      if (!entry) {
        return '<div class="app-subline ai-api-empty">暂无世界书</div>';
      }

      return `
        <div class="app-mainline">${escapeHtml(entry.name)}</div>
        <div class="app-subline">${escapeHtml(getWorldBookScopeLabel(entry.scope))}</div>
        <div class="settings-list">
          <button class="setting-row" id="worldbook-mainchat-open" type="button">
            <span class="setting-row-label">主聊天上下文</span>
            <span class="setting-row-value-wrap">
              <span class="setting-row-value">${escapeHtml(getWorldBookEntryMainChatSummary(entry))}</span>
              <span class="setting-row-arrow">›</span>
            </span>
          </button>
          <button class="setting-row" id="worldbook-info-bindings-open" type="button">
            <span class="setting-row-label">信息块</span>
            <span class="setting-row-value-wrap">
              <span class="setting-row-value">${escapeHtml(getWorldBookInfoBindingsSummary(entry))}</span>
              <span class="setting-row-arrow">›</span>
            </span>
          </button>
          <button class="setting-row" id="worldbook-triggered-preview-open" type="button">
            <span class="setting-row-label">已触发预览</span>
            <span class="setting-row-value-wrap">
              <span class="setting-row-value">查看</span>
              <span class="setting-row-arrow">›</span>
            </span>
          </button>
          <button class="setting-row" id="worldbook-content-preview-open" type="button">
            <span class="setting-row-label">世界书内容</span>
            <span class="setting-row-value-wrap">
              <span class="setting-row-value">查看</span>
              <span class="setting-row-arrow">›</span>
            </span>
          </button>
        </div>
      `;
    }

    function renderWorldBookMainChatConfig() {
      const entry = getEditingWorldBookEntry();
      return `
        <div class="app-mainline">${escapeHtml(entry?.name || '世界书主聊天')}</div>
        <div class="settings-editor">
          <div class="app-subline">最近AI消息范围</div>
          <input class="settings-editor-field" id="worldbook-mainchat-context-n-input" type="number" min="0" max="99" step="1" inputmode="numeric" spellcheck="false" value="${escapeHtml(pendingWorldBookMainChatContextN)}" placeholder="最近AI消息范围">
          <div class="app-microline">空=全部，0=不读取，数字=最近N条AI消息</div>
          <div class="app-subline">最近用户消息范围</div>
          <input class="settings-editor-field" id="worldbook-mainchat-user-n-input" type="number" min="0" max="99" step="1" inputmode="numeric" spellcheck="false" value="${escapeHtml(pendingWorldBookMainChatUserN)}" placeholder="最近用户消息范围">
          <div class="app-microline">空=全部，0=不发送，数字=最近N条用户消息</div>
        </div>
        <div class="settings-list">
          <button class="setting-row" id="worldbook-mainchat-rules-open" type="button">
            <span class="setting-row-label">XML规则</span>
            <span class="setting-row-value-wrap">
              <span class="setting-row-value">${pendingWorldBookMainChatXmlRules.length ? `${pendingWorldBookMainChatXmlRules.length}项` : '空'}</span>
              <span class="setting-row-arrow">›</span>
            </span>
          </button>
          <button class="setting-row" id="worldbook-mainchat-preview-open" type="button">
            <span class="setting-row-label">预览上下文</span>
            <span class="setting-row-value-wrap">
              <span class="setting-row-value">查看</span>
              <span class="setting-row-arrow">›</span>
            </span>
          </button>
          <button class="setting-row" id="worldbook-mainchat-save" type="button">
            <span class="setting-row-label">保存世界书主聊天</span>
            <span class="setting-row-value-wrap">
              <span class="setting-row-value">${escapeHtml(getWorldBookEntryMainChatSummary({
                ...(entry || {}),
                mainChatContextN: pendingWorldBookMainChatContextN,
                mainChatUserN: pendingWorldBookMainChatUserN,
                mainChatXmlRules: pendingWorldBookMainChatXmlRules,
              }))}</span>
              <span class="setting-row-arrow">✓</span>
            </span>
          </button>
        </div>
      `;
    }

    function renderWorldBookMainChatRules() {
      const rulesHtml = pendingWorldBookMainChatXmlRules.length
        ? pendingWorldBookMainChatXmlRules.map((rule, index) => `
            <div class="ai-mainchat-rule">
              <div class="ai-mainchat-rule-top">
                <input class="settings-editor-field ai-mainchat-rule-tag" data-worldbook-mainchat-rule-tag-index="${index}" type="text" maxlength="24" spellcheck="false" value="${escapeHtml(rule.tag)}" placeholder="标签名">
                <button class="screensaver-delete-button ai-mainchat-rule-delete" data-worldbook-mainchat-rule-delete-index="${index}" type="button">×</button>
              </div>
              <div class="ai-mainchat-rule-bottom">
                <button class="ai-mainchat-rule-mode-button ${worldBookMainChatModeFlashIndex === index ? 'is-flash' : ''}" data-worldbook-mainchat-rule-mode-toggle-index="${index}" type="button">${rule.mode === 'exclude' ? '排除最近N楼' : '最近N楼'}</button>
                <input class="settings-editor-field ai-mainchat-rule-n" data-worldbook-mainchat-rule-n-index="${index}" type="number" min="0" max="99" step="1" inputmode="numeric" spellcheck="false" value="${escapeHtml(rule.n)}" placeholder="N">
              </div>
            </div>
          `).join('')
        : '<div class="app-subline">无规则，AI消息将按原文读取</div>';

      return `
        <div class="app-mainline">世界书 XML 规则</div>
        <div class="ai-mainchat-rules">${rulesHtml}</div>
        <div class="settings-list">
          <button class="setting-row" id="worldbook-mainchat-rule-add" type="button">
            <span class="setting-row-label">新增XML规则</span>
            <span class="setting-row-value-wrap">
              <span class="setting-row-value">新增</span>
              <span class="setting-row-arrow">＋</span>
            </span>
          </button>
        </div>
      `;
    }

    function renderWorldBookMainChatPreviewView() {
      return `
        <div class="app-mainline">世界书主聊天预览</div>
        <div class="settings-editor">
          <div class="ai-mainchat-preview">${escapeHtml(worldBookMainChatPreviewText || '')}</div>
        </div>
        <div class="app-microline ai-mainchat-preview-status">${escapeHtml(worldBookMainChatPreviewStatus || '')}</div>
        <div class="settings-list">
          <button class="setting-row" id="worldbook-mainchat-preview-refresh" type="button">
            <span class="setting-row-label">刷新预览</span>
            <span class="setting-row-value-wrap">
              <span class="setting-row-value">刷新</span>
              <span class="setting-row-arrow">↻</span>
            </span>
          </button>
        </div>
      `;
    }

    function renderWorldBookInfoBindingsView() {
      const entry = getEditingWorldBookEntry();
      const bindings = Array.isArray(entry?.infoSourceBindings) ? entry.infoSourceBindings : [];
      const bindingsHtml = bindings.length
        ? bindings.map((binding, index) => `
            <div class="screensaver-saved-item" data-worldbook-info-binding-index="${index}">
              <div class="screensaver-saved-main">
                <span class="screensaver-saved-name">${escapeHtml(binding.sourceName || binding.sourceId)}</span>
                <span class="screensaver-saved-url">${escapeHtml(binding.sourceScope || '信息块')}</span>
              </div>
              <button class="screensaver-delete-button" data-worldbook-info-binding-delete-index="${index}" type="button">×</button>
            </div>
          `).join('')
        : '<div class="app-subline ai-api-empty">暂无信息块，可先添加一项。</div>';

      return `
        <div class="app-mainline">信息块</div>
        <div class="settings-list">
          <button class="setting-row" id="worldbook-info-binding-add" type="button">
            <span class="setting-row-label">添加信息块</span>
            <span class="setting-row-value-wrap">
              <span class="setting-row-value">${escapeHtml(getWorldBookInfoBindingsSummary(entry))}</span>
              <span class="setting-row-arrow">＋</span>
            </span>
          </button>
        </div>
        <div class="screensaver-saved-list">${bindingsHtml}</div>
      `;
    }

    function renderWorldBookInfoSourcePickerView() {
      const sources = getWorldBookInfoSources();
      const sourceHtml = sources.length
        ? sources.map((source) => `
            <div class="screensaver-saved-item" data-worldbook-info-source-id="${escapeHtml(source.id)}">
              <div class="screensaver-saved-main">
                <span class="screensaver-saved-name">${escapeHtml(source.name)}</span>
                <span class="screensaver-saved-url">${escapeHtml(source.subtitle || '')}</span>
              </div>
            </div>
          `).join('')
        : '<div class="app-subline ai-api-empty">暂无信息来源</div>';

      return `
        <div class="app-mainline">选择信息来源</div>
        <div class="screensaver-saved-list">${sourceHtml}</div>
      `;
    }

    function renderWorldBookTriggeredPreviewView() {
      return `
        <div class="app-mainline">已触发预览</div>
        <div class="settings-editor">
          <div class="ai-mainchat-preview">${escapeHtml(worldBookTriggeredPreviewText || '')}</div>
        </div>
        <div class="app-microline ai-mainchat-preview-status">${escapeHtml(worldBookTriggeredPreviewStatus || '')}</div>
        <div class="settings-list">
          <button class="setting-row" id="worldbook-triggered-preview-refresh" type="button">
            <span class="setting-row-label">刷新预览</span>
            <span class="setting-row-value-wrap">
              <span class="setting-row-value">刷新</span>
              <span class="setting-row-arrow">↻</span>
            </span>
          </button>
        </div>
      `;
    }

    function renderWorldBookContentPreviewView() {
      const entry = getEditingWorldBookEntry();
      return `
        <div class="app-mainline">${escapeHtml(entry?.name || '世界书内容')}</div>
        <div class="settings-editor">
          <div class="ai-mainchat-preview">${escapeHtml(worldBookContentPreviewText || '')}</div>
        </div>
        <div class="app-microline ai-mainchat-preview-status">${escapeHtml(worldBookContentPreviewStatus || '')}</div>
        <div class="settings-list">
          <button class="setting-row" id="worldbook-content-preview-refresh" type="button">
            <span class="setting-row-label">刷新内容</span>
            <span class="setting-row-value-wrap">
              <span class="setting-row-value">刷新</span>
              <span class="setting-row-arrow">↻</span>
            </span>
          </button>
        </div>
      `;
    }

    function renderWorldBookContent() {
      if (!settingsWorldBookContent) return;

      let contentHtml = '';
      if (worldBookSubView === 'picker') {
        contentHtml = renderWorldBookPickerView();
      } else if (worldBookSubView === 'entry') {
        contentHtml = renderWorldBookEntryView();
      } else if (worldBookSubView === 'mainChat') {
        contentHtml = renderWorldBookMainChatConfig();
      } else if (worldBookSubView === 'mainChatRules') {
        contentHtml = renderWorldBookMainChatRules();
      } else if (worldBookSubView === 'mainChatPreview') {
        contentHtml = renderWorldBookMainChatPreviewView();
      } else if (worldBookSubView === 'infoBindings') {
        contentHtml = renderWorldBookInfoBindingsView();
      } else if (worldBookSubView === 'infoSourcePicker') {
        contentHtml = renderWorldBookInfoSourcePickerView();
      } else if (worldBookSubView === 'triggeredPreview') {
        contentHtml = renderWorldBookTriggeredPreviewView();
      } else if (worldBookSubView === 'contentPreview') {
        contentHtml = renderWorldBookContentPreviewView();
      } else {
        contentHtml = renderWorldBookListView();
      }

      settingsWorldBookContent.innerHTML = `
        <div class="diary-settings-shell">
          ${contentHtml}
        </div>
      `;
    }

    function renderAiConfigContent() {
      if (!settingsPageContent) return;

      let contentHtml = '';
      if (aiConfigSubView === 'editor') {
        contentHtml = renderAiConfigEditor();
      } else if (aiConfigSubView === 'paramConfig') {
        contentHtml = renderAiParamConfig();
      } else if (aiConfigSubView === 'modelList') {
        contentHtml = renderAiModelList();
      } else {
        contentHtml = renderAiConfigList();
      }

      settingsPageContent.innerHTML = `
        <div class="diary-settings-shell">
          ${contentHtml}
        </div>
      `;
    }

    function renderAiMainChatContent() {
      if (!settingsMainChatContent) return;

      let contentHtml = '';
      if (aiMainChatSubView === 'rules') {
        contentHtml = renderAiMainChatRules();
      } else if (aiMainChatSubView === 'preview') {
        contentHtml = renderAiMainChatPreviewView();
      } else {
        contentHtml = renderAiMainChatConfig();
      }

      const shellClassName = aiMainChatSubView === 'preview'
        ? 'diary-settings-shell diary-settings-shell--preview'
        : 'diary-settings-shell';

      settingsMainChatContent.innerHTML = `
        <div class="${shellClassName}">
          ${contentHtml}
        </div>
      `;
    }

    function renderAiPresetContent() {
      if (!settingsPresetContent) return;

      let contentHtml = '';
      if (aiPresetSubView === 'editor') {
        contentHtml = renderAiPresetMessageEditor();
      } else if (aiPresetSubView === 'preview') {
        contentHtml = renderAiPresetPreviewView();
      } else if (aiPresetSubView === 'infoSourcePicker' || aiPresetSubView === 'infoCreate') {
        contentHtml = renderAiPresetInfoSourcePickerView();
      } else if (aiPresetSubView === 'importExport') {
        contentHtml = renderAiPresetImportExportView();
      } else {
        contentHtml = renderAiPresetListView();
      }

      settingsPresetContent.innerHTML = `
        <div class="diary-settings-shell">
          ${contentHtml}
        </div>
      `;
    }

    function renderAutoTriggerContent() {
      if (!settingsAutoTriggerContent) return;

      const runNowLabel = aiPresetGenerating ? '执行中' : '立即执行';

      settingsAutoTriggerContent.innerHTML = `
        <div class="diary-settings-shell">
          <div class="app-mainline">${escapeHtml(journalAutoTriggerStatusMessage || '自动触发')}</div>
          <div class="settings-list">
            <button class="setting-row" id="journal-auto-trigger-enabled-toggle" type="button">
              <span class="setting-row-label">功能开关</span>
              <span class="setting-row-value-wrap">
                <span class="setting-row-value">${escapeHtml(pendingJournalAutoTriggerEnabled ? '开启' : '关闭')}</span>
                <span class="setting-row-arrow">⇆</span>
              </span>
            </button>
            <button class="setting-row" id="journal-auto-trigger-role-toggle" type="button">
              <span class="setting-row-label">触发时机</span>
              <span class="setting-row-value-wrap">
                <span class="setting-row-value">${escapeHtml(getJournalAutoTriggerRoleLabel(pendingJournalAutoTriggerRole))}</span>
                <span class="setting-row-arrow">⇆</span>
              </span>
            </button>
            <button class="setting-row" id="journal-auto-trigger-write-mode-toggle" type="button">
              <span class="setting-row-label">自动触发历史写入</span>
              <span class="setting-row-value-wrap">
                <span class="setting-row-value">固定追加</span>
                <span class="setting-row-arrow">✓</span>
              </span>
            </button>
          </div>
          <div class="settings-editor journal-auto-trigger-editor">
            <div class="app-subline">楼层间隔</div>
            <input class="settings-editor-field" id="journal-auto-trigger-interval-input" type="number" min="1" max="99" step="1" inputmode="numeric" spellcheck="false" value="${escapeHtml(pendingJournalAutoTriggerInterval)}" placeholder="1-99">
            <div class="app-microline">自动触发固定：latest 覆盖、history 追加。</div>
          </div>
          <div class="settings-list">
            <button class="setting-row" id="manual-generate-latest-mode-toggle" type="button">
              <span class="setting-row-label">手动生成范围</span>
              <span class="setting-row-value-wrap">
                <span class="setting-row-value">${escapeHtml(getManualGenerateLatestModeLabel(pendingManualGenerateLatestMode))}</span>
                <span class="setting-row-arrow">⇆</span>
              </span>
            </button>
            <button class="setting-row" id="manual-generate-history-mode-toggle" type="button">
              <span class="setting-row-label">手动历史写入</span>
              <span class="setting-row-value-wrap">
                <span class="setting-row-value">${escapeHtml(getManualGenerateHistoryModeLabel(pendingManualGenerateHistoryMode))}</span>
                <span class="setting-row-arrow">⇆</span>
              </span>
            </button>
          </div>
          <div class="settings-list">
            <button class="setting-row" id="journal-auto-trigger-save" type="button">
              <span class="setting-row-label">保存自动/手动策略</span>
              <span class="setting-row-value-wrap">
                <span class="setting-row-value">保存</span>
                <span class="setting-row-arrow">✓</span>
              </span>
            </button>
            <button class="setting-row" id="journal-auto-trigger-run-now" type="button" ${aiPresetGenerating ? 'disabled' : ''}>
              <span class="setting-row-label">立即执行一次</span>
              <span class="setting-row-value-wrap">
                <span class="setting-row-value">${escapeHtml(runNowLabel)}</span>
                <span class="setting-row-arrow">⚡</span>
              </span>
            </button>
          </div>
        </div>
      `;
    }

    function renderAllSettingsContent() {
      renderAiConfigContent();
      renderAiMainChatContent();
      renderAiPresetContent();
      renderWorldBookContent();
      renderAutoTriggerContent();
    }

    settingsPageContent?.addEventListener('input', handleSettingsInput);
    settingsPageContent?.addEventListener('click', handleSettingsClick);
    settingsMainChatContent?.addEventListener('input', handleSettingsInput);
    settingsMainChatContent?.addEventListener('click', handleSettingsClick);
    settingsPresetContent?.addEventListener('input', handleSettingsInput);
    settingsPresetContent?.addEventListener('click', handleSettingsClick);
    settingsWorldBookContent?.addEventListener('input', handleSettingsInput);
    settingsWorldBookContent?.addEventListener('click', handleSettingsClick);
    settingsAutoTriggerContent?.addEventListener('input', handleSettingsInput);
    settingsAutoTriggerContent?.addEventListener('click', handleSettingsClick);
    window.addEventListener('butterflyDiary:entriesChanged', () => {
      if (getCurrentView() === 'settings') {
        renderAllSettingsContent();
      }
    });



    setPendingAiApiSettings(aiSettings);
    setPendingAiMainChatSettings(aiSettings);
    setPendingAiPresetSettings(aiSettings);
    setPendingWorldBookSettings(aiSettings);
    setPendingJournalAutoTriggerSettings(aiSettings);
    syncAiConfigConnectionState();
    bindJournalAutoTriggerEvents();
    renderAllSettingsContent();

    function showSettingsPage() {
      if (isAnimatingRef.value || getCurrentView() !== 'cover') {
        return false;
      }

      closeGlobalPageMenu?.();
      setCurrentView('settings');
      isAnimatingRef.value = true;
      settingsPageWrapper.classList.add('active');
      notebookFrontWrapper.classList.add('open');
      renderAllSettingsContent();

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

    function refresh() {
      aiSettings = normalizeAiSettings(loadSettings());

      aiConfigStatusMessage = '';
      aiConfigSubView = 'list';
      selectedAiModelIndex = -1;

      aiMainChatStatusMessage = '';
      aiMainChatSubView = 'main';
      aiMainChatPreviewText = '';
      aiMainChatPreviewStatus = '';
      aiMainChatModeFlashIndex = -1;
      if (aiMainChatModeFlashTimer) {
        clearTimeout(aiMainChatModeFlashTimer);
        aiMainChatModeFlashTimer = null;
      }

      aiPresetStatusMessage = '';
      aiPresetSubView = 'list';
      aiPresetPreviewTitle = '';
      aiPresetPreviewText = '';
      aiPresetPreviewStatus = '';
      aiPresetPreviewReturnView = 'list';
      aiPresetGenerating = false;
      pendingAiPresetInfoRole = 'system';
      aiPresetInfoSourcePickerTargetIndex = -1;

      resetAiPresetDraftState();
      selectedAiPresetBlockIndex = -1;

      worldBookStatusMessage = '';
      worldBookSubView = 'list';
      editingWorldBookIndex = -1;
      worldBookPickerEntries = [];
      worldBookPickerStatus = '';
      pendingWorldBookMainChatContextN = '10';
      pendingWorldBookMainChatUserN = '';
      pendingWorldBookMainChatXmlRules = [];
      worldBookMainChatPreviewText = '';
      worldBookMainChatPreviewStatus = '';
      worldBookTriggeredPreviewText = '';
      worldBookTriggeredPreviewStatus = '';
      worldBookContentPreviewText = '';
      worldBookContentPreviewStatus = '';
      worldBookMainChatModeFlashIndex = -1;
      if (worldBookMainChatModeFlashTimer) {
        clearTimeout(worldBookMainChatModeFlashTimer);
        worldBookMainChatModeFlashTimer = null;
      }

      setPendingAiApiSettings(aiSettings);
      setPendingAiMainChatSettings(aiSettings);
      setPendingAiPresetSettings(aiSettings);
      setPendingWorldBookSettings(aiSettings);
      setPendingJournalAutoTriggerSettings(aiSettings);
      syncAiConfigConnectionState();
      bindJournalAutoTriggerEvents();

      renderAllSettingsContent();
    }

    return {
      showSettingsPage,
      hideSettingsPage,
      refresh,
      handleTopRightReturn,
    };
  },
};
