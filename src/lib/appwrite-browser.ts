"use client";

import { Account, Client } from "appwrite";

const appwriteBrowserClient = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!);

const appwriteBrowserAccount = new Account(appwriteBrowserClient);

/**
 * Keep a browser-side Appwrite session available for Realtime.
 * The application continues to use the existing HttpOnly SSR session for API routes.
 */
export async function ensureBrowserAppwriteSession(
  email: string,
  password: string
) {
  try {
    const currentUser = await appwriteBrowserAccount.get();

    if (currentUser.email === email) {
      return;
    }

    await appwriteBrowserAccount.deleteSession("current");
  } catch {
    // No browser-side session exists yet. That is expected for existing users.
  }

  await appwriteBrowserAccount.createEmailPasswordSession(email, password);
}

export async function deleteBrowserAppwriteSession() {
  try {
    await appwriteBrowserAccount.deleteSession("current");
  } catch {
    // Logging out should still succeed if the optional browser session is absent.
  }
}

export { appwriteBrowserAccount, appwriteBrowserClient };
