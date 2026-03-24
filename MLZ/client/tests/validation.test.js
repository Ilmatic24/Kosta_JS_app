import { validateContactForm } from "../src/validation.js";

const createForm = () => {
  document.body.innerHTML = `
    <form id="contact-form" novalidate>
      <input type="hidden" name="contactId" value="" />
      <input name="fullName" type="text" required maxlength="80" />
      <input name="email" type="email" required />
      <input name="birthDate" type="date" />
      <input name="salaryExpectation" type="number" min="0" step="1000" />
      <select name="companyId" required>
        <option value="">Bitte Firma waehlen</option>
        <option value="company-1">HFU Innovation Lab</option>
      </select>
      <textarea name="notes" maxlength="240"></textarea>
      <input name="isActive" type="checkbox" checked />
    </form>
  `;

  return document.querySelector("#contact-form");
};

test("meldet Pflichtfeld- und Datumsfehler", () => {
  const formElement = createForm();

  formElement.elements.namedItem("birthDate").value = "2999-01-01";

  const validationResult = validateContactForm(formElement);

  expect(validationResult.isValid).toBe(false);
  expect(validationResult.errors.fullName).toBe("Bitte gib einen Namen ein.");
  expect(validationResult.errors.email).toBe("Bitte gib eine E-Mail-Adresse ein.");
  expect(validationResult.errors.companyId).toBe("Bitte waehle eine Firma aus.");
  expect(validationResult.errors.birthDate).toBe(
    "Das Geburtsdatum darf nicht in der Zukunft liegen."
  );
});

test("normalisiert gueltige Formularwerte fuer die API", () => {
  const formElement = createForm();

  formElement.elements.namedItem("fullName").value = "Mara Klein";
  formElement.elements.namedItem("email").value = "mara@example.com";
  formElement.elements.namedItem("birthDate").value = "1994-06-18";
  formElement.elements.namedItem("salaryExpectation").value = "62000";
  formElement.elements.namedItem("companyId").value = "company-1";
  formElement.elements.namedItem("notes").value = "Hat Erfahrung mit Suchoberflaechen.";

  const validationResult = validateContactForm(formElement);

  expect(validationResult.isValid).toBe(true);
  expect(validationResult.values).toEqual({
    id: "",
    fullName: "Mara Klein",
    email: "mara@example.com",
    birthDate: "1994-06-18",
    salaryExpectation: 62000,
    isActive: true,
    companyId: "company-1",
    notes: "Hat Erfahrung mit Suchoberflaechen."
  });
});
