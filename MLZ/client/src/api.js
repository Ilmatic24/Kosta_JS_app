const API_BASE_URL =
  document
    .querySelector('meta[name="mlz-api-base-url"]')
    ?.getAttribute("content")
    ?.trim() || "http://localhost:3000/api";

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") ?? "";
  const isJsonResponse = contentType.includes("application/json");
  const payload = isJsonResponse ? await response.json() : null;

  if (!response.ok) {
    const error = new Error(payload?.message ?? "Die Anfrage ist fehlgeschlagen.");

    error.status = response.status;
    error.details = payload?.details ?? null;

    throw error;
  }

  return payload;
};

export const createApiClient = () => {
  let session = null;

  const request = async (path, { method = "GET", body = null } = {}) => {
    const headers = {};

    if (body !== null) {
      headers["Content-Type"] = "application/json";
    }

    if (session?.token) {
      headers.Authorization = `Bearer ${session.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === null ? null : JSON.stringify(body)
    });

    return parseResponse(response);
  };

  return {
    setSession(nextSession) {
      session = nextSession;
    },
    async login(credentials) {
      return request("/login", {
        method: "POST",
        body: credentials
      });
    },
    async logout() {
      await request("/logout", {
        method: "POST"
      });
    },
    async getBootstrap() {
      return request("/bootstrap");
    },
    async saveContact(contact) {
      if (contact.id) {
        return request(`/contacts/${contact.id}`, {
          method: "PUT",
          body: contact
        });
      }

      return request("/contacts", {
        method: "POST",
        body: contact
      });
    },
    async deleteContact(contactId) {
      return request(`/contacts/${contactId}`, {
        method: "DELETE"
      });
    },
    async seedContacts() {
      return request("/contacts/seed", {
        method: "POST"
      });
    },
    async deleteAllContacts() {
      return request("/contacts", {
        method: "DELETE"
      });
    }
  };
};
