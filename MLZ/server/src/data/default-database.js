export const createDefaultDatabase = () => ({
  users: [
    {
      id: "user-alice",
      username: "alice",
      password: "alice123",
      displayName: "Alice Adler"
    },
    {
      id: "user-bob",
      username: "bob",
      password: "bob123",
      displayName: "Bob Berger"
    }
  ],
  companies: [
    {
      id: "company-hfu",
      name: "HFU Innovation Lab",
      country: "Germany"
    },
    {
      id: "company-alpine",
      name: "Alpine Systems",
      country: "Switzerland"
    },
    {
      id: "company-aurora",
      name: "Aurora Works",
      country: "Austria"
    }
  ],
  contacts: [
    {
      id: "contact-alice-1",
      ownerId: "user-alice",
      fullName: "Mara Klein",
      email: "mara.klein@example.com",
      birthDate: "1994-06-18",
      salaryExpectation: 62000,
      isActive: true,
      companyId: "company-hfu",
      notes:
        "Leitet aktuell ein kleines Frontend-Team und interessiert sich fuer Suchoberflaechen.",
      createdAt: "2026-03-24T00:00:00.000Z",
      updatedAt: "2026-03-24T00:00:00.000Z"
    },
    {
      id: "contact-bob-1",
      ownerId: "user-bob",
      fullName: "Jonas Meier",
      email: "jonas.meier@example.com",
      birthDate: "1991-02-12",
      salaryExpectation: 71000,
      isActive: false,
      companyId: "company-alpine",
      notes:
        "Hat Erfahrung in Prozessautomatisierung und testgetriebener Entwicklung.",
      createdAt: "2026-03-24T00:00:00.000Z",
      updatedAt: "2026-03-24T00:00:00.000Z"
    }
  ]
});
