import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { HttpsError, onCall } from "firebase-functions/v2/https";

initializeApp();

/**
 * Looks up which sign-in providers (password, google.com, apple.com, ...)
 * are attached to a given email, using the Admin SDK — which, unlike the
 * client SDK's fetchSignInMethodsForEmail, isn't neutered by Email
 * Enumeration Protection. Only meant to be called from the client *after*
 * an email/password sign-in has already failed with auth/invalid-credential,
 * so this doesn't become its own account-enumeration oracle.
 */
export const getSignInMethods = onCall<{ email: unknown }>(async (request) => {
  const email = request.data.email;
  if (typeof email !== "string" || !email.includes("@")) {
    throw new HttpsError("invalid-argument", "A valid email is required.");
  }

  try {
    const user = await getAuth().getUserByEmail(email.trim().toLowerCase());
    return { providers: user.providerData.map((p) => p.providerId) };
  } catch {
    // Includes auth/user-not-found — deliberately indistinguishable from a
    // real lookup failure on the client, so this doesn't reveal whether the
    // email is registered.
    return { providers: [] };
  }
});
