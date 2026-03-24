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
