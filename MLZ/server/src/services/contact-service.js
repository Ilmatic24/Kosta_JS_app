import crypto from "node:crypto";

import { createApiError } from "../utils/api-error.js";

const MAX_FULL_NAME_LENGTH = 80;
const MAX_NOTES_LENGTH = 240;

const normalizeText = (value) => String(value ?? "").trim();

const normalizeNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsedNumber = Number(value);

  return Number.isFinite(parsedNumber) ? parsedNumber : Number.NaN;
};

const getTodayAsIsoDate = () => new Date().toISOString().slice(0, 10);

const ensureCompanyExists = (database, companyId) => {
  return database.companies.some((company) => company.id === companyId);
};

const sanitizeContactPayload = (database, payload) => {
  const errors = {};
  const fullName = normalizeText(payload.fullName);
  const email = normalizeText(payload.email);
  const birthDate = normalizeText(payload.birthDate);
  const companyId = normalizeText(payload.companyId);
  const notes = normalizeText(payload.notes);
  const salaryExpectation = normalizeNumber(payload.salaryExpectation);
  const isActive = Boolean(payload.isActive);

  if (!fullName) {
    errors.fullName = "Der Name ist ein Pflichtfeld.";
  } else if (fullName.length > MAX_FULL_NAME_LENGTH) {
    errors.fullName = `Der Name darf hoechstens ${MAX_FULL_NAME_LENGTH} Zeichen haben.`;
  }

  if (!email) {
    errors.email = "Die E-Mail-Adresse ist ein Pflichtfeld.";
  } else {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      errors.email = "Die E-Mail-Adresse ist nicht gueltig.";
    }
  }

  if (birthDate && birthDate > getTodayAsIsoDate()) {
    errors.birthDate = "Das Geburtsdatum darf nicht in der Zukunft liegen.";
  }

  if (Number.isNaN(salaryExpectation)) {
    errors.salaryExpectation = "Die Gehaltserwartung muss eine Zahl sein.";
  } else if (salaryExpectation !== null && salaryExpectation < 0) {
    errors.salaryExpectation = "Die Gehaltserwartung darf nicht negativ sein.";
  }

  if (!companyId) {
    errors.companyId = "Bitte waehle eine Firma aus.";
  } else if (!ensureCompanyExists(database, companyId)) {
    errors.companyId = "Die ausgewaehlte Firma wurde nicht gefunden.";
  }

  if (notes.length > MAX_NOTES_LENGTH) {
    errors.notes = `Die Notizen duerfen hoechstens ${MAX_NOTES_LENGTH} Zeichen haben.`;
  }

  if (Object.keys(errors).length > 0) {
    throw createApiError(400, "Die Formulardaten sind ungueltig.", errors);
  }

  return {
    fullName,
    email,
    birthDate,
    salaryExpectation,
    isActive,
    companyId,
    notes
  };
};

export const listCompanies = (database) => {
  return [...database.companies].sort((leftCompany, rightCompany) => {
    return leftCompany.name.localeCompare(rightCompany.name, "de");
  });
};

export const listContactsForUser = (database, userId) => {
  return database.contacts
    .filter((contact) => contact.ownerId === userId)
    .sort((leftContact, rightContact) => {
      return leftContact.fullName.localeCompare(rightContact.fullName, "de");
    });
};

export const getContactForUser = (database, userId, contactId) => {
  const matchingContact = database.contacts.find((contact) => {
    return contact.ownerId === userId && contact.id === contactId;
  });

  if (!matchingContact) {
    throw createApiError(404, "Der angeforderte Datensatz wurde nicht gefunden.");
  }

  return matchingContact;
};

export const createContactForUser = (database, userId, payload) => {
  const sanitizedPayload = sanitizeContactPayload(database, payload);
  const timestamp = new Date().toISOString();
  const nextContact = {
    id: crypto.randomUUID(),
    ownerId: userId,
    ...sanitizedPayload,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  database.contacts.push(nextContact);

  return nextContact;
};

export const updateContactForUser = (database, userId, contactId, payload) => {
  const contactIndex = database.contacts.findIndex((contact) => {
    return contact.ownerId === userId && contact.id === contactId;
  });

  if (contactIndex < 0) {
    throw createApiError(404, "Der Datensatz zum Aktualisieren wurde nicht gefunden.");
  }

  const sanitizedPayload = sanitizeContactPayload(database, payload);
  const existingContact = database.contacts[contactIndex];
  const nextContact = {
    ...existingContact,
    ...sanitizedPayload,
    updatedAt: new Date().toISOString()
  };

  database.contacts[contactIndex] = nextContact;

  return nextContact;
};

export const deleteContactForUser = (database, userId, contactId) => {
  const contactIndex = database.contacts.findIndex((contact) => {
    return contact.ownerId === userId && contact.id === contactId;
  });

  if (contactIndex < 0) {
    throw createApiError(404, "Der Datensatz zum Loeschen wurde nicht gefunden.");
  }

  const [deletedContact] = database.contacts.splice(contactIndex, 1);

  return deletedContact;
};

export const deleteAllContactsForUser = (database, userId) => {
  const remainingContacts = database.contacts.filter((contact) => {
    return contact.ownerId !== userId;
  });
  const deletedCount = database.contacts.length - remainingContacts.length;

  database.contacts = remainingContacts;

  return deletedCount;
};

export const seedContactsForUser = (database, user) => {
  const timestamp = new Date().toISOString();
  const seedContacts = [
    {
      id: crypto.randomUUID(),
      ownerId: user.id,
      fullName: `${user.displayName} Demo Eins`,
      email: `${user.username}.eins@example.com`,
      birthDate: "1993-04-11",
      salaryExpectation: 58000,
      isActive: true,
      companyId: database.companies[0].id,
      notes: "Ist als Beispielkontakt fuer Formular- und Suchtests gedacht.",
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: crypto.randomUUID(),
      ownerId: user.id,
      fullName: `${user.displayName} Demo Zwei`,
      email: `${user.username}.zwei@example.com`,
      birthDate: "1989-09-27",
      salaryExpectation: 76000,
      isActive: false,
      companyId: database.companies[1].id,
      notes: "Enthaelt genug Text, damit Highlighting und Suchausschnitte pruefbar werden.",
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ];

  const contactsWithoutExistingSeeds = database.contacts.filter((contact) => {
    return !(contact.ownerId === user.id && contact.email.endsWith("@example.com"));
  });

  database.contacts = contactsWithoutExistingSeeds.concat(seedContacts);

  return listContactsForUser(database, user.id);
};
