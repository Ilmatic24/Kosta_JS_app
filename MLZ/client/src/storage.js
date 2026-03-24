const SESSION_STORAGE_KEY = "mlz.session";
const SEARCH_STORAGE_KEY = "mlz.search";
const DRAFT_STORAGE_KEY = "mlz.contactDraft";

export const DEFAULT_SEARCH_STATE = {
  query: "",
  fields: ["fullName", "email", "notes", "companyName"]
};

const hasStorage = () => typeof globalThis.localStorage !== "undefined";

const readJson = (storageKey, fallbackValue) => {
  if (!hasStorage()) {
    return fallbackValue;
  }

  try {
    const rawValue = globalThis.localStorage.getItem(storageKey);

    return rawValue ? JSON.parse(rawValue) : fallbackValue;
  } catch {
    return fallbackValue;
  }
};

const writeJson = (storageKey, value) => {
  if (!hasStorage()) {
    return;
  }

  globalThis.localStorage.setItem(storageKey, JSON.stringify(value));
};

export const loadSession = () => readJson(SESSION_STORAGE_KEY, null);

export const saveSession = (session) => writeJson(SESSION_STORAGE_KEY, session);

export const clearSession = () => {
  if (!hasStorage()) {
    return;
  }

  globalThis.localStorage.removeItem(SESSION_STORAGE_KEY);
};

export const loadSearchState = () =>
  readJson(SEARCH_STORAGE_KEY, DEFAULT_SEARCH_STATE);

export const saveSearchState = (searchState) => {
  writeJson(SEARCH_STORAGE_KEY, searchState);
};

export const loadDraft = () =>
  readJson(DRAFT_STORAGE_KEY, {
    fullName: "",
    email: "",
    companyId: "",
    notes: ""
  });

export const saveDraft = (draftValues) => {
  writeJson(DRAFT_STORAGE_KEY, draftValues);
};
