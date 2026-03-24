import { buildSearchResults, escapeHtml, highlightText } from "./search.js";
import {
  clearSession,
  DEFAULT_SEARCH_STATE,
  loadDraft,
  loadSearchState,
  loadSession,
  saveDraft,
  saveSearchState,
  saveSession
} from "./storage.js";
import {
  CONTACT_FIELD_NAMES,
  EMPTY_CONTACT_VALUES,
  createDraftFromValues,
  normalizeContactValues,
  validateContactForm
} from "./validation.js";

const SEARCH_FIELD_OPTIONS = [
  { value: "fullName", label: "Name" },
  { value: "email", label: "E-Mail" },
  { value: "notes", label: "Notizen" },
  { value: "companyName", label: "Firma" }
];

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Nicht angegeben";
  }

  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(Number(value));
};

const formatDate = (value) => {
  if (!value) {
    return "Nicht angegeben";
  }

  return new Intl.DateTimeFormat("de-DE").format(new Date(value));
};

const createDefaultFormValues = () => {
  return normalizeContactValues({
    ...EMPTY_CONTACT_VALUES,
    ...loadDraft()
  });
};

const createInitialState = () => ({
  session: loadSession(),
  contacts: [],
  companies: [],
  selectedContactId: null,
  formValues: createDefaultFormValues(),
  searchState: loadSearchState(),
  banner: null,
  serverFieldErrors: {}
});

const buildCompaniesById = (companies) => {
  return companies.reduce((companiesById, company) => {
    return {
      ...companiesById,
      [company.id]: company
    };
  }, {});
};

const createStatusBannerMarkup = (banner) => {
  if (!banner) {
    return "";
  }

  return `
    <div class="status-banner status-banner--${banner.type}">
      ${escapeHtml(banner.message)}
    </div>
  `;
};

const createDetailMarkup = (contact, companiesById) => {
  if (!contact) {
    return `
      <div class="empty-state">
        Noch kein Datensatz ausgewaehlt. Waehle links einen Kontakt oder lege einen neuen an.
      </div>
    `;
  }

  const companyName = companiesById[contact.companyId]?.name ?? "Keine Firma";
  const activeLabel = contact.isActive ? "Aktiv" : "Inaktiv";

  return `
    <div class="detail-card__header">
      <div>
        <h2>${escapeHtml(contact.fullName)}</h2>
        <p class="meta-text">${escapeHtml(companyName)}</p>
      </div>
      <span class="badge">${escapeHtml(activeLabel)}</span>
    </div>
    <div class="detail-list">
      <div>
        <strong>E-Mail</strong>
        <span>${escapeHtml(contact.email)}</span>
      </div>
      <div>
        <strong>Geburtsdatum</strong>
        <span>${escapeHtml(formatDate(contact.birthDate))}</span>
      </div>
      <div>
        <strong>Gehaltserwartung</strong>
        <span>${escapeHtml(formatCurrency(contact.salaryExpectation))}</span>
      </div>
      <div>
        <strong>Notizen</strong>
        <span>${escapeHtml(contact.notes || "Keine Notizen hinterlegt.")}</span>
      </div>
      <div>
        <strong>Zuletzt aktualisiert</strong>
        <span>${escapeHtml(formatDate(contact.updatedAt))}</span>
      </div>
    </div>
  `;
};

const createSearchResultMarkup = (result, query, selectedContactId) => {
  const isSelected = result.contact.id === selectedContactId;
  const titleMarkup = query
    ? highlightText(result.contact.fullName, query)
    : escapeHtml(result.contact.fullName);
  const snippetsMarkup =
    result.snippets.length > 0
      ? `
        <ul class="snippet-list">
          ${result.snippets
            .map((snippet) => {
              return `<li><strong>${escapeHtml(snippet.label)}:</strong> <span>${snippet.html}</span></li>`;
            })
            .join("")}
        </ul>
      `
      : "";

  return `
    <button
      class="contact-list__item${isSelected ? " is-active" : ""}"
      type="button"
      data-action="select-contact"
      data-contact-id="${escapeHtml(result.contact.id)}"
    >
      <span class="contact-list__title">${titleMarkup}</span>
      <p class="contact-list__meta">${escapeHtml(result.companyName)}</p>
      ${snippetsMarkup}
    </button>
  `;
};

const createCompanyOptionsMarkup = (companies, selectedCompanyId) => {
  const emptyOption = `<option value="">Bitte Firma waehlen</option>`;
  const companyOptions = companies
    .map((company) => {
      const isSelected = company.id === selectedCompanyId ? " selected" : "";

      return `<option value="${escapeHtml(company.id)}"${isSelected}>${escapeHtml(company.name)}</option>`;
    })
    .join("");

  return `${emptyOption}${companyOptions}`;
};

const createSearchFiltersMarkup = (searchState) => {
  return SEARCH_FIELD_OPTIONS.map((option) => {
    const isChecked = searchState.fields.includes(option.value) ? " checked" : "";

    return `
      <label class="field-toggle">
        <input
          type="checkbox"
          value="${escapeHtml(option.value)}"
          data-search-field="true"
          ${isChecked}
        />
        ${escapeHtml(option.label)}
      </label>
    `;
  }).join("");
};

const createAuthenticatedMarkup = (state) => {
  const companiesById = buildCompaniesById(state.companies);
  const selectedContact = state.contacts.find(
    (contact) => contact.id === state.selectedContactId
  );
  const searchResults = buildSearchResults({
    contacts: state.contacts,
    companiesById,
    query: state.searchState.query,
    fields: state.searchState.fields
  });
  const resultsMarkup =
    searchResults.length > 0
      ? searchResults
          .map((result) => {
            return createSearchResultMarkup(
              result,
              state.searchState.query,
              state.selectedContactId
            );
          })
          .join("")
      : `<div class="empty-state">Keine Kontakte fuer die aktuellen Suchkriterien gefunden.</div>`;
  const formValues = state.formValues;
  const isEditingExistingContact = Boolean(formValues.id);

  return `
    <div class="shell">
      <section class="hero">
        <div class="hero__header">
          <div>
            <p class="badge">MLZ Kontakte</p>
            <h1 class="hero__title">Kontakte pro Benutzer verwalten</h1>
            <p class="hero__subtitle">
              Eingeloggt als ${escapeHtml(state.session.user.displayName)}.
            </p>
          </div>
          <button class="button" type="button" data-action="logout">Abmelden</button>
        </div>
      </section>

      ${createStatusBannerMarkup(state.banner)}

      <section class="card search-panel">
        <div class="search-panel__header">
          <div>
            <h2>Suche</h2>
            <p class="section-copy">
              Filtere nach Namen, E-Mail, Notizen oder Firma und hebe Treffer direkt hervor.
            </p>
          </div>
          <p class="meta-text">${searchResults.length} Ergebnis(se)</p>
        </div>
        <div class="field">
          <label for="search-query">Freitextsuche</label>
          <input
            id="search-query"
            name="searchQuery"
            type="search"
            value="${escapeHtml(state.searchState.query)}"
            placeholder="z. B. Frontend, Mara oder HFU"
          />
        </div>
        <div class="search-panel__filters">
          ${createSearchFiltersMarkup(state.searchState)}
        </div>
      </section>

      <div class="toolbar">
        <div class="toolbar__group">
          <button class="button button--primary" type="button" data-action="new-contact">
            Neuer Kontakt
          </button>
          <button class="button" type="button" data-action="seed-contacts">
            Testdaten erstellen
          </button>
          <button class="button button--danger" type="button" data-action="clear-contacts">
            Eigene Daten loeschen
          </button>
        </div>
      </div>

      <div class="grid">
        <section class="card">
          <h2>Kontaktliste</h2>
          <p class="list-panel__meta">
            Angezeigt werden nur Kontakte aus dem aktuellen Benutzerkonto.
          </p>
          <div class="contact-list">${resultsMarkup}</div>
        </section>

        <section class="card detail-card">
          <div class="detail-card__header">
            <div>
              <h2>Details</h2>
              <p class="section-copy">Liste und Detailansicht greifen auf denselben Datensatz zu.</p>
            </div>
            ${
              selectedContact
                ? `<button class="button button--danger" type="button" data-action="delete-contact">Datensatz loeschen</button>`
                : ""
            }
          </div>
          ${createDetailMarkup(selectedContact, companiesById)}
        </section>

        <section class="card form-card">
          <div class="form-card__header">
            <div>
              <h2>${isEditingExistingContact ? "Kontakt bearbeiten" : "Kontakt anlegen"}</h2>
              <p class="section-copy">
                HTML5-Validierung und JavaScript arbeiten zusammen. Fehler erscheinen direkt am Feld.
              </p>
            </div>
            <span class="badge">${isEditingExistingContact ? "Bearbeiten" : "Neu"}</span>
          </div>
          <form id="contact-form" novalidate>
            <input type="hidden" name="contactId" value="${escapeHtml(formValues.id)}" />

            <div class="form-grid form-grid--double">
              <div class="field">
                <label for="full-name">Name</label>
                <input id="full-name" name="fullName" type="text" required maxlength="80" value="${escapeHtml(formValues.fullName)}" />
                <p class="field-error" data-field-error="fullName"></p>
              </div>
              <div class="field">
                <label for="email">E-Mail</label>
                <input id="email" name="email" type="email" required value="${escapeHtml(formValues.email)}" />
                <p class="field-error" data-field-error="email"></p>
              </div>
            </div>

            <div class="form-grid form-grid--double">
              <div class="field">
                <label for="birth-date">Geburtsdatum</label>
                <input id="birth-date" name="birthDate" type="date" value="${escapeHtml(formValues.birthDate)}" />
                <p class="field-error" data-field-error="birthDate"></p>
              </div>
              <div class="field">
                <label for="salary-expectation">Gehaltserwartung</label>
                <input
                  id="salary-expectation"
                  name="salaryExpectation"
                  type="number"
                  min="0"
                  step="1000"
                  value="${escapeHtml(formValues.salaryExpectation)}"
                />
                <p class="field-error" data-field-error="salaryExpectation"></p>
              </div>
            </div>

            <div class="form-grid form-grid--double">
              <div class="field">
                <label for="company-id">Firma</label>
                <select id="company-id" name="companyId" required>
                  ${createCompanyOptionsMarkup(state.companies, formValues.companyId)}
                </select>
                <p class="field-error" data-field-error="companyId"></p>
              </div>
              <div class="field">
                <label for="is-active">Status</label>
                <label class="field-toggle">
                  <input
                    id="is-active"
                    name="isActive"
                    type="checkbox"
                    ${formValues.isActive ? "checked" : ""}
                  />
                  Kontakt ist aktiv
                </label>
              </div>
            </div>

            <div class="field">
              <label for="notes">Notizen</label>
              <textarea id="notes" name="notes" maxlength="240">${escapeHtml(formValues.notes)}</textarea>
              <p class="field-error" data-field-error="notes"></p>
            </div>

            <div class="form-card__footer">
              <div>
                <p class="form-summary" data-form-summary></p>
                <p class="meta-text">
                  Die Felder Name, E-Mail, Firma und Notizen werden lokal vorbefuellt.
                </p>
              </div>
              <button class="button button--primary" type="submit">
                ${isEditingExistingContact ? "Aenderungen speichern" : "Kontakt speichern"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  `;
};

const createLoginMarkup = (banner) => {
  return `
    <div class="login-shell">
      <section class="login-card">
        <p class="badge">MLZ Kontakte</p>
        <h1>Anmeldung</h1>
        <p class="section-copy">
          Melde dich an, um nur deine eigenen Kontakte zu sehen und zu bearbeiten.
        </p>

        ${createStatusBannerMarkup(banner)}

        <form id="login-form" novalidate>
          <div class="field">
            <label for="username">Benutzername</label>
            <input id="username" name="username" type="text" required />
          </div>
          <div class="field">
            <label for="password">Passwort</label>
            <input id="password" name="password" type="password" required />
          </div>
          <button class="button button--primary" type="submit">Anmelden</button>
        </form>

        <div class="login-demo">
          <strong>Demo-Zugaenge</strong>
          <div>
            Alice Adler
            <br />
            <code>alice / alice123</code>
          </div>
          <div>
            Bob Berger
            <br />
            <code>bob / bob123</code>
          </div>
        </div>
      </section>
    </div>
  `;
};

export const createUi = ({ rootElement, apiClient }) => {
  const state = createInitialState();

  const setBanner = (type, message) => {
    state.banner = { type, message };
  };

  const applySession = (session) => {
    state.session = session;
    apiClient.setSession(session);

    if (session) {
      saveSession(session);
      return;
    }

    clearSession();
  };

  const applyAuthenticatedPayload = (payload) => {
    const nextSession = {
      token: payload.token ?? state.session?.token ?? "",
      user: payload.user
    };

    applySession(nextSession);
    state.contacts = payload.contacts;
    state.companies = payload.companies;

    if (state.formValues.id) {
      const matchingContact = state.contacts.find(
        (contact) => contact.id === state.formValues.id
      );

      if (matchingContact) {
        state.selectedContactId = matchingContact.id;
        state.formValues = normalizeContactValues(matchingContact);
        return;
      }
    }

    if (state.selectedContactId) {
      const selectedContact = state.contacts.find(
        (contact) => contact.id === state.selectedContactId
      );

      if (selectedContact) {
        state.formValues = normalizeContactValues(selectedContact);
        return;
      }
    }

    if (state.contacts.length > 0) {
      state.selectedContactId = state.contacts[0].id;
      state.formValues = normalizeContactValues(state.contacts[0]);
      return;
    }

    state.selectedContactId = null;
    state.formValues = createDefaultFormValues();
  };

  const render = () => {
    rootElement.innerHTML = state.session
      ? createAuthenticatedMarkup(state)
      : createLoginMarkup(state.banner);

    const contactForm = rootElement.querySelector("#contact-form");

    if (contactForm) {
      refreshContactFormState(contactForm);
    }
  };

  const refreshContactFormState = (formElement) => {
    const validationResult = validateContactForm(formElement);
    const mergedErrors = {
      ...validationResult.errors,
      ...state.serverFieldErrors
    };

    CONTACT_FIELD_NAMES.forEach((fieldName) => {
      const fieldElement = formElement.elements.namedItem(fieldName);
      const errorElement = formElement.querySelector(
        `[data-field-error="${fieldName}"]`
      );
      const errorMessage = mergedErrors[fieldName] ?? "";

      if (fieldElement) {
        fieldElement.classList.toggle("is-invalid", Boolean(errorMessage));
      }

      if (errorElement) {
        errorElement.textContent = errorMessage;
      }
    });

    const summaryElement = formElement.querySelector("[data-form-summary]");

    if (summaryElement) {
      summaryElement.textContent =
        Object.keys(mergedErrors).length > 0
          ? "Bitte korrigiere die markierten Felder."
          : "";
    }

    const submitButton = formElement.querySelector('button[type="submit"]');

    if (submitButton) {
      submitButton.disabled =
        !validationResult.isValid || Object.keys(state.serverFieldErrors).length > 0;
    }

    state.formValues = normalizeContactValues(validationResult.values);
    saveDraft(createDraftFromValues(validationResult.values));

    return validationResult;
  };

  const readSearchStateFromDom = () => {
    const queryInput = rootElement.querySelector("#search-query");
    const checkedFieldInputs = Array.from(
      rootElement.querySelectorAll('[data-search-field="true"]:checked')
    );
    const fields = checkedFieldInputs.map((inputElement) => inputElement.value);

    return {
      query: queryInput?.value ?? "",
      fields: fields.length > 0 ? fields : DEFAULT_SEARCH_STATE.fields
    };
  };

  const resetToCreateMode = () => {
    state.selectedContactId = null;
    state.serverFieldErrors = {};
    state.formValues = createDefaultFormValues();
    render();
  };

  const selectContact = (contactId) => {
    const matchingContact = state.contacts.find((contact) => contact.id === contactId);

    if (!matchingContact) {
      return;
    }

    state.selectedContactId = matchingContact.id;
    state.serverFieldErrors = {};
    state.formValues = normalizeContactValues(matchingContact);
    render();
  };

  const upsertContact = (contact) => {
    const existingContactIndex = state.contacts.findIndex(
      (currentContact) => currentContact.id === contact.id
    );

    if (existingContactIndex >= 0) {
      state.contacts[existingContactIndex] = contact;
    } else {
      state.contacts.push(contact);
    }

    state.contacts.sort((leftContact, rightContact) => {
      return leftContact.fullName.localeCompare(rightContact.fullName, "de");
    });
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();

    const formElement = event.target;

    if (!(formElement instanceof HTMLFormElement)) {
      return;
    }

    const formData = new FormData(formElement);
    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      const payload = await apiClient.login({ username, password });

      state.banner = null;
      state.serverFieldErrors = {};
      applyAuthenticatedPayload(payload);
      render();
    } catch (error) {
      setBanner("error", error.message);
      render();
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient.logout();
    } catch {
      // Ignorieren, da die lokale Sitzung trotzdem beendet werden soll.
    }

    applySession(null);
    state.contacts = [];
    state.companies = [];
    state.selectedContactId = null;
    state.formValues = createDefaultFormValues();
    state.serverFieldErrors = {};
    setBanner("success", "Die Sitzung wurde beendet.");
    render();
  };

  const handleContactSubmit = async (event) => {
    event.preventDefault();

    state.serverFieldErrors = {};

    const formElement = event.target;

    if (!(formElement instanceof HTMLFormElement)) {
      return;
    }

    const validationResult = refreshContactFormState(formElement);

    if (!validationResult.isValid) {
      return;
    }

    try {
      const payload = await apiClient.saveContact(validationResult.values);

      upsertContact(payload.contact);
      state.selectedContactId = payload.contact.id;
      state.formValues = normalizeContactValues(payload.contact);
      setBanner(
        "success",
        validationResult.values.id
          ? "Der Kontakt wurde aktualisiert."
          : "Der Kontakt wurde gespeichert."
      );
      render();
    } catch (error) {
      state.serverFieldErrors = error.details ?? {};
      setBanner("error", error.message);
      refreshContactFormState(formElement);
    }
  };

  const handleDeleteContact = async () => {
    if (!state.selectedContactId) {
      return;
    }

    try {
      await apiClient.deleteContact(state.selectedContactId);

      state.contacts = state.contacts.filter((contact) => {
        return contact.id !== state.selectedContactId;
      });
      state.serverFieldErrors = {};

      if (state.contacts.length > 0) {
        state.selectedContactId = state.contacts[0].id;
        state.formValues = normalizeContactValues(state.contacts[0]);
      } else {
        state.selectedContactId = null;
        state.formValues = createDefaultFormValues();
      }

      setBanner("success", "Der Kontakt wurde geloescht.");
      render();
    } catch (error) {
      setBanner("error", error.message);
      render();
    }
  };

  const handleSeedContacts = async () => {
    try {
      const payload = await apiClient.seedContacts();

      state.contacts = payload.contacts;

      if (state.contacts.length > 0) {
        state.selectedContactId = state.contacts[0].id;
        state.formValues = normalizeContactValues(state.contacts[0]);
      }

      setBanner("success", "Fuer deinen Benutzer wurden frische Testdaten erstellt.");
      render();
    } catch (error) {
      setBanner("error", error.message);
      render();
    }
  };

  const handleClearContacts = async () => {
    try {
      await apiClient.deleteAllContacts();

      state.contacts = [];
      state.selectedContactId = null;
      state.formValues = createDefaultFormValues();
      state.serverFieldErrors = {};
      setBanner("success", "Alle eigenen Kontakte wurden geloescht.");
      render();
    } catch (error) {
      setBanner("error", error.message);
      render();
    }
  };

  const handleFormInput = (event) => {
    const formElement = event.target.closest("#contact-form");

    if (!formElement) {
      return;
    }

    if (event.target.name) {
      delete state.serverFieldErrors[event.target.name];
    }

    refreshContactFormState(formElement);
  };

  const handleSearchChange = () => {
    const formElement = rootElement.querySelector("#contact-form");

    if (formElement) {
      refreshContactFormState(formElement);
    }

    state.searchState = readSearchStateFromDom();
    saveSearchState(state.searchState);
    render();
  };

  rootElement.addEventListener("submit", async (event) => {
    if (event.target.matches("#login-form")) {
      await handleLoginSubmit(event);
      return;
    }

    if (event.target.matches("#contact-form")) {
      await handleContactSubmit(event);
    }
  });

  rootElement.addEventListener("click", async (event) => {
    const actionElement = event.target.closest("[data-action]");

    if (!actionElement) {
      return;
    }

    const action = actionElement.dataset.action;

    if (action === "logout") {
      await handleLogout();
      return;
    }

    if (action === "new-contact") {
      resetToCreateMode();
      return;
    }

    if (action === "select-contact") {
      selectContact(actionElement.dataset.contactId);
      return;
    }

    if (action === "delete-contact") {
      await handleDeleteContact();
      return;
    }

    if (action === "seed-contacts") {
      await handleSeedContacts();
      return;
    }

    if (action === "clear-contacts") {
      await handleClearContacts();
    }
  });

  rootElement.addEventListener("input", (event) => {
    if (event.target.closest("#contact-form")) {
      handleFormInput(event);
      return;
    }

    if (event.target.id === "search-query" || event.target.dataset.searchField === "true") {
      handleSearchChange();
    }
  });

  rootElement.addEventListener("change", (event) => {
    if (event.target.closest("#contact-form")) {
      handleFormInput(event);
      return;
    }

    if (event.target.dataset.searchField === "true") {
      handleSearchChange();
    }
  });

  return {
    async initialize() {
      render();

      if (!state.session) {
        return;
      }

      try {
        const payload = await apiClient.getBootstrap();

        applyAuthenticatedPayload(payload);
        state.banner = null;
        render();
      } catch {
        applySession(null);
        state.contacts = [];
        state.companies = [];
        state.selectedContactId = null;
        state.formValues = createDefaultFormValues();
        setBanner(
          "warning",
          "Die gespeicherte Sitzung konnte nicht wiederhergestellt werden. Bitte melde dich erneut an."
        );
        render();
      }
    }
  };
};
