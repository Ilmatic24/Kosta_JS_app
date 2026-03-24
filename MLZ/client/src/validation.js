export const CONTACT_FIELD_NAMES = [
  "fullName",
  "email",
  "birthDate",
  "salaryExpectation",
  "companyId",
  "notes"
];

export const EMPTY_CONTACT_VALUES = {
  id: "",
  fullName: "",
  email: "",
  birthDate: "",
  salaryExpectation: "",
  isActive: true,
  companyId: "",
  notes: ""
};

const MAX_FULL_NAME_LENGTH = 80;
const MAX_NOTES_LENGTH = 240;

const normalizeTextValue = (value) => String(value ?? "").trim();

export const normalizeContactValues = (values = {}) => {
  return {
    id: String(values.id ?? ""),
    fullName: normalizeTextValue(values.fullName),
    email: normalizeTextValue(values.email),
    birthDate: normalizeTextValue(values.birthDate),
    salaryExpectation:
      values.salaryExpectation === null ||
      values.salaryExpectation === undefined ||
      values.salaryExpectation === ""
        ? ""
        : String(values.salaryExpectation),
    isActive: Boolean(values.isActive),
    companyId: normalizeTextValue(values.companyId),
    notes: normalizeTextValue(values.notes)
  };
};

const getInputMap = (formElement) => ({
  fullName: formElement.elements.namedItem("fullName"),
  email: formElement.elements.namedItem("email"),
  birthDate: formElement.elements.namedItem("birthDate"),
  salaryExpectation: formElement.elements.namedItem("salaryExpectation"),
  isActive: formElement.elements.namedItem("isActive"),
  companyId: formElement.elements.namedItem("companyId"),
  notes: formElement.elements.namedItem("notes")
});

const clearCustomMessages = (inputMap) => {
  Object.values(inputMap).forEach((inputElement) => {
    if (inputElement) {
      inputElement.setCustomValidity("");
    }
  });
};

export const readContactFormValues = (formElement) => {
  return normalizeContactValues({
    id: formElement.elements.namedItem("contactId")?.value ?? "",
    fullName: formElement.elements.namedItem("fullName")?.value ?? "",
    email: formElement.elements.namedItem("email")?.value ?? "",
    birthDate: formElement.elements.namedItem("birthDate")?.value ?? "",
    salaryExpectation:
      formElement.elements.namedItem("salaryExpectation")?.value ?? "",
    isActive: Boolean(formElement.elements.namedItem("isActive")?.checked),
    companyId: formElement.elements.namedItem("companyId")?.value ?? "",
    notes: formElement.elements.namedItem("notes")?.value ?? ""
  });
};

const applyCustomValidationMessages = (inputMap, values) => {
  clearCustomMessages(inputMap);

  if (!values.fullName) {
    inputMap.fullName?.setCustomValidity("Bitte gib einen Namen ein.");
  } else if (values.fullName.length > MAX_FULL_NAME_LENGTH) {
    inputMap.fullName?.setCustomValidity(
      `Der Name darf hoechstens ${MAX_FULL_NAME_LENGTH} Zeichen haben.`
    );
  }

  if (!values.email) {
    inputMap.email?.setCustomValidity("Bitte gib eine E-Mail-Adresse ein.");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    inputMap.email?.setCustomValidity("Bitte gib eine gueltige E-Mail-Adresse ein.");
  }

  if (values.birthDate && values.birthDate > new Date().toISOString().slice(0, 10)) {
    inputMap.birthDate?.setCustomValidity(
      "Das Geburtsdatum darf nicht in der Zukunft liegen."
    );
  }

  if (values.salaryExpectation !== "") {
    const salaryExpectation = Number(values.salaryExpectation);

    if (!Number.isFinite(salaryExpectation)) {
      inputMap.salaryExpectation?.setCustomValidity(
        "Bitte gib eine Zahl fuer die Gehaltserwartung ein."
      );
    } else if (salaryExpectation < 0) {
      inputMap.salaryExpectation?.setCustomValidity(
        "Die Gehaltserwartung darf nicht negativ sein."
      );
    }
  }

  if (!values.companyId) {
    inputMap.companyId?.setCustomValidity("Bitte waehle eine Firma aus.");
  }

  if (values.notes.length > MAX_NOTES_LENGTH) {
    inputMap.notes?.setCustomValidity(
      `Die Notizen duerfen hoechstens ${MAX_NOTES_LENGTH} Zeichen haben.`
    );
  }
};

export const validateContactForm = (formElement) => {
  const values = readContactFormValues(formElement);
  const inputMap = getInputMap(formElement);

  applyCustomValidationMessages(inputMap, values);

  const errors = CONTACT_FIELD_NAMES.reduce((collectedErrors, fieldName) => {
    const inputElement = inputMap[fieldName];

    if (inputElement && !inputElement.checkValidity()) {
      return {
        ...collectedErrors,
        [fieldName]: inputElement.validationMessage
      };
    }

    return collectedErrors;
  }, {});

  return {
    isValid: formElement.checkValidity(),
    errors,
    values: {
      ...values,
      salaryExpectation:
        values.salaryExpectation === "" ? null : Number(values.salaryExpectation)
    }
  };
};

export const createDraftFromValues = (values) => {
  const normalizedValues = normalizeContactValues(values);

  return {
    fullName: normalizedValues.fullName,
    email: normalizedValues.email,
    companyId: normalizedValues.companyId,
    notes: normalizedValues.notes
  };
};
