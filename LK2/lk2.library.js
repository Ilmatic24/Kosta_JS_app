class MyElement extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `<b>${this.getAttribute("title") || "Title"}</b>`;
  }

  static get observedAttributes() {
    return ["title"];
  }

  attributeChangedCallback() {
    this.innerHTML = `<b>${this.getAttribute("title") || "Title"}</b>`;
  }
}

customElements.define("my-element", MyElement);
