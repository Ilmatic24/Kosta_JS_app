test("zeigt den App-Container an", () => {
  document.body.innerHTML = `<div id="app"></div>`;

  const appElement = document.querySelector("#app");

  expect(appElement).not.toBeNull();
});
