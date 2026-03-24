import { buildSearchResults, highlightText } from "../src/search.js";

test("hebt Suchbegriffe in gefundenen Texten hervor", () => {
  const highlightedText = highlightText("HFU Innovation Lab", "lab");

  expect(highlightedText).toContain("<mark>Lab</mark>");
});

test("filtert Kontakte nach ausgewaehlten Suchfeldern", () => {
  const contacts = [
    {
      id: "contact-1",
      fullName: "Mara Klein",
      email: "mara@example.com",
      notes: "Liebt Suchoberflaechen",
      companyId: "company-1"
    },
    {
      id: "contact-2",
      fullName: "Jonas Meier",
      email: "jonas@example.com",
      notes: "Arbeitet im Backend",
      companyId: "company-2"
    }
  ];
  const companiesById = {
    "company-1": { id: "company-1", name: "HFU Innovation Lab" },
    "company-2": { id: "company-2", name: "Alpine Systems" }
  };

  const results = buildSearchResults({
    contacts,
    companiesById,
    query: "HFU",
    fields: ["companyName"]
  });

  expect(results).toHaveLength(1);
  expect(results[0].contact.id).toBe("contact-1");
  expect(results[0].snippets[0].html).toContain("<mark>HFU</mark>");
});
