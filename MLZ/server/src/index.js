import cors from "cors";
import express from "express";

import { getDatabaseFilePath, mutateDatabase, readDatabase } from "./data/database.js";
import { loginUser, logoutUser, requireAuth } from "./services/auth-service.js";
import {
  createContactForUser,
  deleteAllContactsForUser,
  deleteContactForUser,
  getContactForUser,
  listCompanies,
  listContactsForUser,
  seedContactsForUser,
  updateContactForUser
} from "./services/contact-service.js";
import { createApiError } from "./utils/api-error.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: true
  })
);
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    databaseFilePath: getDatabaseFilePath()
  });
});

app.post("/api/login", async (request, response, next) => {
  try {
    const session = await loginUser(request.body ?? {});
    const database = await readDatabase();

    response.json({
      token: session.token,
      user: session.user,
      contacts: listContactsForUser(database, session.user.id),
      companies: listCompanies(database)
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/logout", requireAuth, (request, response) => {
  logoutUser(request.authToken);
  response.status(204).end();
});

app.get("/api/bootstrap", requireAuth, async (request, response, next) => {
  try {
    const database = await readDatabase();

    response.json({
      user: request.user,
      contacts: listContactsForUser(database, request.user.id),
      companies: listCompanies(database)
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/companies", requireAuth, async (_request, response, next) => {
  try {
    const database = await readDatabase();

    response.json({
      companies: listCompanies(database)
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/contacts", requireAuth, async (request, response, next) => {
  try {
    const database = await readDatabase();

    response.json({
      contacts: listContactsForUser(database, request.user.id)
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/contacts/:contactId", requireAuth, async (request, response, next) => {
  try {
    const database = await readDatabase();
    const contact = getContactForUser(
      database,
      request.user.id,
      request.params.contactId
    );

    response.json({ contact });
  } catch (error) {
    next(error);
  }
});

app.post("/api/contacts", requireAuth, async (request, response, next) => {
  try {
    const contact = await mutateDatabase((database) => {
      return createContactForUser(database, request.user.id, request.body ?? {});
    });

    response.status(201).json({ contact });
  } catch (error) {
    next(error);
  }
});

app.put("/api/contacts/:contactId", requireAuth, async (request, response, next) => {
  try {
    const contact = await mutateDatabase((database) => {
      return updateContactForUser(
        database,
        request.user.id,
        request.params.contactId,
        request.body ?? {}
      );
    });

    response.json({ contact });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/contacts/:contactId", requireAuth, async (request, response, next) => {
  try {
    const deletedContact = await mutateDatabase((database) => {
      return deleteContactForUser(database, request.user.id, request.params.contactId);
    });

    response.json({ contact: deletedContact });
  } catch (error) {
    next(error);
  }
});

app.post("/api/contacts/seed", requireAuth, async (request, response, next) => {
  try {
    const contacts = await mutateDatabase((database) => {
      return seedContactsForUser(database, request.user);
    });

    response.json({ contacts });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/contacts", requireAuth, async (request, response, next) => {
  try {
    const deletedCount = await mutateDatabase((database) => {
      return deleteAllContactsForUser(database, request.user.id);
    });

    response.json({ deletedCount });
  } catch (error) {
    next(error);
  }
});

app.use((_request, _response, next) => {
  next(createApiError(404, "Die angeforderte Route wurde nicht gefunden."));
});

app.use((error, _request, response, _next) => {
  const status = error.status ?? 500;
  const message = error.message ?? "Ein unbekannter Serverfehler ist aufgetreten.";

  response.status(status).json({
    message,
    details: error.details ?? null
  });
});

app.listen(port, () => {
  console.log(`MLZ server listening on port ${port}`);
});
