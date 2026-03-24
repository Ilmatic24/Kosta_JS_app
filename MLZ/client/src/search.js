const SEARCH_FIELD_LABELS = {
  fullName: "Name",
  email: "E-Mail",
  notes: "Notizen",
  companyName: "Firma"
};

const HTML_ESCAPE_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};

const escapeRegularExpression = (value) => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const normalizeSearchText = (value) => String(value ?? "").toLocaleLowerCase("de");

const getFieldValue = (contact, fieldName, companiesById) => {
  if (fieldName === "companyName") {
    return companiesById[contact.companyId]?.name ?? "";
  }

  return String(contact[fieldName] ?? "");
};

export const escapeHtml = (value) => {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    return HTML_ESCAPE_MAP[character];
  });
};

export const highlightText = (text, query) => {
  const rawText = String(text ?? "");
  const trimmedQuery = String(query ?? "").trim();

  if (!trimmedQuery) {
    return escapeHtml(rawText);
  }

  const expression = new RegExp(escapeRegularExpression(trimmedQuery), "ig");
  let highlightedText = "";
  let currentIndex = 0;

  for (const match of rawText.matchAll(expression)) {
    const matchIndex = match.index ?? 0;

    highlightedText += escapeHtml(rawText.slice(currentIndex, matchIndex));
    highlightedText += `<mark>${escapeHtml(match[0])}</mark>`;
    currentIndex = matchIndex + match[0].length;
  }

  highlightedText += escapeHtml(rawText.slice(currentIndex));

  return highlightedText;
};

export const buildSearchResults = ({
  contacts,
  companiesById,
  query,
  fields
}) => {
  const trimmedQuery = String(query ?? "").trim();
  const normalizedQuery = normalizeSearchText(trimmedQuery);
  const activeFields =
    fields.length > 0 ? fields : ["fullName", "email", "notes", "companyName"];

  return contacts
    .map((contact) => {
      const snippets = activeFields
        .filter((fieldName) => {
          if (!trimmedQuery) {
            return false;
          }

          return normalizeSearchText(
            getFieldValue(contact, fieldName, companiesById)
          ).includes(normalizedQuery);
        })
        .slice(0, 2)
        .map((fieldName) => {
          return {
            fieldName,
            label: SEARCH_FIELD_LABELS[fieldName],
            html: highlightText(
              getFieldValue(contact, fieldName, companiesById),
              trimmedQuery
            )
          };
        });

      if (trimmedQuery && snippets.length === 0) {
        return null;
      }

      const companyName = companiesById[contact.companyId]?.name ?? "Keine Firma";
      const normalizedName = normalizeSearchText(contact.fullName);
      const score = trimmedQuery
        ? snippets.length + Number(normalizedName.includes(normalizedQuery))
        : 0;

      return {
        contact,
        companyName,
        score,
        snippets
      };
    })
    .filter(Boolean)
    .sort((leftResult, rightResult) => {
      if (trimmedQuery && leftResult.score !== rightResult.score) {
        return rightResult.score - leftResult.score;
      }

      return leftResult.contact.fullName.localeCompare(
        rightResult.contact.fullName,
        "de"
      );
    });
};
