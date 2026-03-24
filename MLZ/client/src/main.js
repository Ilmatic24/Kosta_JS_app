const appElement = document.querySelector("#app");

if (appElement) {
  appElement.insertAdjacentHTML(
    "beforeend",
    `<p data-testid="client-status">Client-Setup bereit.</p>`
  );
}
