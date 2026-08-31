"use client";

import { Account, Client } from "appwrite";

const appwriteBrowserClient = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!);

const appwriteBrowserAccount = new Account(appwriteBrowserClient);

/**
 * Creates the browser-side Appwrite session used by Realtime.
 *
 * The normal Next.js API authentication still uses the HttpOnly SSR session.
 * This browser session exists only so Appwrite Realtime can authenticate.
 */
export async function ensureBrowserAppwriteSession(
  email: string,
  password: string
) {
  await appwriteBrowserAccount.createEmailPasswordSession(email, password);
}

/**
 * Remove the optional browser-side Realtime session on logout.
 */
export async function deleteBrowserAppwriteSession() {
  try {
    await appwriteBrowserAccount.deleteSession("current");
  } catch {
    // Ignore if no browser-side session exists.
  }
}

export { appwriteBrowserAccount, appwriteBrowserClient };