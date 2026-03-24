import crypto from "node:crypto";

import { readDatabase } from "../data/database.js";
import { createApiError } from "../utils/api-error.js";

const sessionsByToken = new Map();

const toPublicUser = (user) => ({
  id: user.id,
  username: user.username,
  displayName: user.displayName
});

const extractBearerToken = (authorizationHeader) => {
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.slice("Bearer ".length).trim();
};

export const loginUser = async ({ username, password }) => {
  const database = await readDatabase();
  const normalizedUsername = String(username ?? "").trim().toLowerCase();
  const normalizedPassword = String(password ?? "");
  const matchingUser = database.users.find((user) => {
    return (
      user.username.toLowerCase() === normalizedUsername &&
      user.password === normalizedPassword
    );
  });

  if (!matchingUser) {
    throw createApiError(401, "Login fehlgeschlagen. Bitte pruefe Benutzername und Passwort.");
  }

  const token = crypto.randomUUID();

  sessionsByToken.set(token, matchingUser.id);

  return {
    token,
    user: toPublicUser(matchingUser)
  };
};

export const logoutUser = (token) => {
  if (!token) {
    return;
  }

  sessionsByToken.delete(token);
};

export const requireAuth = async (request, _response, next) => {
  try {
    const token = extractBearerToken(request.get("Authorization"));

    if (!token) {
      throw createApiError(401, "Es ist keine gueltige Sitzung vorhanden.");
    }

    const userId = sessionsByToken.get(token);

    if (!userId) {
      throw createApiError(401, "Die Sitzung ist abgelaufen. Bitte erneut anmelden.");
    }

    const database = await readDatabase();
    const matchingUser = database.users.find((user) => user.id === userId);

    if (!matchingUser) {
      sessionsByToken.delete(token);
      throw createApiError(401, "Der Benutzer zur Sitzung wurde nicht gefunden.");
    }

    request.authToken = token;
    request.user = toPublicUser(matchingUser);

    next();
  } catch (error) {
    next(error);
  }
};
