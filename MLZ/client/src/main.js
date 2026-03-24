import { createApiClient } from "./api.js";
import { createUi } from "./ui.js";

const appElement = document.querySelector("#app");

if (appElement) {
  const apiClient = createApiClient();
  const ui = createUi({
    rootElement: appElement,
    apiClient
  });

  ui.initialize();
}
