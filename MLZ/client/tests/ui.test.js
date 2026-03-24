import { jest } from "@jest/globals";

import { createUi } from "../src/ui.js";

const flushPromises = async () => {
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
};

beforeEach(() => {
  document.body.innerHTML = `<div id="app"></div>`;
  localStorage.clear();
});

test("delegierter Login-Submit verwendet das eigentliche Formular", async () => {
  const rootElement = document.querySelector("#app");
  const apiClient = {
    setSession: jest.fn(),
    login: jest.fn().mockResolvedValue({
      token: "token-1",
      user: {
        id: "user-alice",
        displayName: "Alice Adler"
      },
      contacts: [],
      companies: []
    }),
    getBootstrap: jest.fn(),
    logout: jest.fn(),
    saveContact: jest.fn(),
    deleteContact: jest.fn(),
    seedContacts: jest.fn(),
    deleteAllContacts: jest.fn()
  };
  const ui = createUi({
    rootElement,
    apiClient
  });

  await ui.initialize();

  rootElement.querySelector("#username").value = "alice";
  rootElement.querySelector("#password").value = "alice123";
  rootElement
    .querySelector("#login-form")
    .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

  await flushPromises();

  expect(apiClient.login).toHaveBeenCalledWith({
    username: "alice",
    password: "alice123"
  });
  expect(rootElement.textContent).toContain("Kontakte pro Benutzer verwalten");
  expect(rootElement.textContent).toContain("Alice Adler");
});

test("zeigt beim fehlgeschlagenen Speichern eines Kontakts eine Rueckmeldung", async () => {
  const rootElement = document.querySelector("#app");
  const apiClient = {
    setSession: jest.fn(),
    login: jest.fn(),
    getBootstrap: jest.fn().mockResolvedValue({
      user: {
        id: "user-alice",
        displayName: "Alice Adler"
      },
      contacts: [],
      companies: [
        {
          id: "company-hfu",
          name: "HFU Innovation Lab"
        }
      ]
    }),
    logout: jest.fn(),
    saveContact: jest
      .fn()
      .mockRejectedValue(new Error("Der Kontakt konnte nicht gespeichert werden.")),
    deleteContact: jest.fn(),
    seedContacts: jest.fn(),
    deleteAllContacts: jest.fn()
  };

  localStorage.setItem(
    "mlz.session",
    JSON.stringify({
      token: "token-1",
      user: {
        id: "user-alice",
        displayName: "Alice Adler"
      }
    })
  );

  const ui = createUi({
    rootElement,
    apiClient
  });

  await ui.initialize();

  rootElement.querySelector('[data-action="new-contact"]').click();
  rootElement.querySelector('[name="fullName"]').value = "Neuer Kontakt";
  rootElement.querySelector('[name="email"]').value = "neu@example.com";
  rootElement.querySelector('[name="companyId"]').value = "company-hfu";
  rootElement
    .querySelector("#contact-form")
    .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

  await flushPromises();

  expect(apiClient.saveContact).toHaveBeenCalled();
  expect(rootElement.textContent).toContain(
    "Der Kontakt konnte nicht gespeichert werden."
  );
});

test("legt einen neuen Kontakt an und zeigt ihn direkt in der UI", async () => {
  const rootElement = document.querySelector("#app");
  const savedContact = {
    id: "contact-new-1",
    fullName: "Neuer Kontakt",
    email: "neu@example.com",
    birthDate: "1990-01-01",
    salaryExpectation: 55000,
    isActive: true,
    companyId: "company-hfu",
    notes: "Neu angelegt."
  };
  const apiClient = {
    setSession: jest.fn(),
    login: jest.fn(),
    getBootstrap: jest.fn().mockResolvedValue({
      user: {
        id: "user-alice",
        displayName: "Alice Adler"
      },
      contacts: [],
      companies: [
        {
          id: "company-hfu",
          name: "HFU Innovation Lab"
        }
      ]
    }),
    logout: jest.fn(),
    saveContact: jest.fn().mockResolvedValue({
      contact: savedContact
    }),
    deleteContact: jest.fn(),
    seedContacts: jest.fn(),
    deleteAllContacts: jest.fn()
  };

  localStorage.setItem(
    "mlz.session",
    JSON.stringify({
      token: "token-1",
      user: {
        id: "user-alice",
        displayName: "Alice Adler"
      }
    })
  );

  const ui = createUi({
    rootElement,
    apiClient
  });

  await ui.initialize();

  rootElement.querySelector('[data-action="new-contact"]').click();
  rootElement.querySelector('[name="fullName"]').value = savedContact.fullName;
  rootElement.querySelector('[name="email"]').value = savedContact.email;
  rootElement.querySelector('[name="birthDate"]').value = savedContact.birthDate;
  rootElement.querySelector('[name="salaryExpectation"]').value = "55000";
  rootElement.querySelector('[name="companyId"]').value = savedContact.companyId;
  rootElement.querySelector('[name="notes"]').value = savedContact.notes;
  rootElement
    .querySelector("#contact-form")
    .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

  await flushPromises();

  expect(apiClient.saveContact).toHaveBeenCalledWith({
    id: "",
    fullName: savedContact.fullName,
    email: savedContact.email,
    birthDate: savedContact.birthDate,
    salaryExpectation: savedContact.salaryExpectation,
    isActive: true,
    companyId: savedContact.companyId,
    notes: savedContact.notes
  });
  expect(rootElement.textContent).toContain("Der Kontakt wurde gespeichert.");
  expect(rootElement.textContent).toContain(savedContact.fullName);
});

test("behaelt den Fokus im Suchfeld waehrend der Freitextsuche", async () => {
  const rootElement = document.querySelector("#app");
  const apiClient = {
    setSession: jest.fn(),
    login: jest.fn(),
    getBootstrap: jest.fn().mockResolvedValue({
      user: {
        id: "user-alice",
        displayName: "Alice Adler"
      },
      contacts: [
        {
          id: "contact-1",
          fullName: "Alice Muster",
          email: "alice@example.com",
          birthDate: "1990-01-01",
          salaryExpectation: 50000,
          isActive: true,
          companyId: "company-hfu",
          notes: "Frontend"
        }
      ],
      companies: [
        {
          id: "company-hfu",
          name: "HFU Innovation Lab"
        }
      ]
    }),
    logout: jest.fn(),
    saveContact: jest.fn(),
    deleteContact: jest.fn(),
    seedContacts: jest.fn(),
    deleteAllContacts: jest.fn()
  };

  localStorage.setItem(
    "mlz.session",
    JSON.stringify({
      token: "token-1",
      user: {
        id: "user-alice",
        displayName: "Alice Adler"
      }
    })
  );

  const ui = createUi({
    rootElement,
    apiClient
  });

  await ui.initialize();

  const initialSearchInput = rootElement.querySelector("#search-query");
  initialSearchInput.focus();
  initialSearchInput.value = "A";
  initialSearchInput.setSelectionRange(1, 1);
  initialSearchInput.dispatchEvent(
    new Event("input", { bubbles: true, cancelable: true })
  );

  const rerenderedSearchInput = rootElement.querySelector("#search-query");

  expect(document.activeElement).toBe(rerenderedSearchInput);
  expect(rerenderedSearchInput.value).toBe("A");

  rerenderedSearchInput.value = "Al";
  rerenderedSearchInput.setSelectionRange(2, 2);
  rerenderedSearchInput.dispatchEvent(
    new Event("input", { bubbles: true, cancelable: true })
  );

  const finalSearchInput = rootElement.querySelector("#search-query");

  expect(document.activeElement).toBe(finalSearchInput);
  expect(finalSearchInput.value).toBe("Al");
});
