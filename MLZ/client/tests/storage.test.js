import {
  clearSession,
  loadDraft,
  loadSearchState,
  loadSession,
  saveDraft,
  saveSearchState,
  saveSession
} from "../src/storage.js";

beforeEach(() => {
  localStorage.clear();
});

test("persistiert und laedt Sitzungen ueber localStorage", () => {
  const session = {
    token: "token-1",
    user: { id: "user-1", displayName: "Alice Adler" }
  };

  saveSession(session);

  expect(loadSession()).toEqual(session);

  clearSession();

  expect(loadSession()).toBeNull();
});

test("merkt sich Draft- und Suchdaten", () => {
  const draft = {
    fullName: "Mara Klein",
    email: "mara@example.com",
    companyId: "company-1",
    notes: "Entwurf"
  };
  const searchState = {
    query: "Mara",
    fields: ["fullName", "email"]
  };

  saveDraft(draft);
  saveSearchState(searchState);

  expect(loadDraft()).toEqual(draft);
  expect(loadSearchState()).toEqual(searchState);
});
