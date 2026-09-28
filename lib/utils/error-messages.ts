/**
 * Maps Firebase Auth, Firestore, and application errors into user-friendly,
 * non-technical error messages so internal Firebase details are never leaked.
 */
export function getFriendlyErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (!error) return fallback;

  if (typeof error === "string") {
    return error;
  }

  const errObj = error as { code?: string; message?: string };
  const code = errObj.code || "";
  const msg = errObj.message || "";

  // Custom application domain messages passed via Error("...")
  const knownDomainMessages = [
    "Unable to save expense. Please try again.",
    "You are not a member of this mess.",
    "This month is already closed.",
    "You don't have permission to perform this action.",
    "The invitation code is invalid or expired.",
    "You are already a member of this mess.",
    "Cannot remove the mess owner.",
  ];
  for (const known of knownDomainMessages) {
    if (msg.includes(known)) return known;
  }

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email or password. Please check your credentials and try again.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Please sign in instead.";
    case "auth/weak-password":
      return "Password is too weak. Please use at least 6 characters.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/popup-closed-by-user":
      return "Google sign-in was cancelled before completion.";
    case "auth/cancelled-popup-request":
      return "Another sign-in popup is already open. Please complete or close it and try again.";
    case "auth/popup-blocked":
      return "Sign-in popup was blocked by your browser. Please allow popups for this site and try again.";
    case "auth/unauthorized-domain": {
      const host =
        typeof window !== "undefined" && window.location?.hostname
          ? window.location.hostname
          : "mess-meal-cost.vercel.app";
      return `Domain "${host}" is not authorized in Firebase yet. Go to Firebase Console → Authentication → Settings → Authorized domains and add "${host}".`;
    }
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled yet. Enable Google & Email/Password in Firebase Console → Authentication → Sign-in method.";
    case "auth/configuration-not-found":
      return "Firebase Authentication is not initialized in your Firebase Console yet. Open Firebase Console → Authentication → Get Started.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment before trying again.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";
    case "permission-denied":
      return "You don't have permission to perform this action.";
    case "not-found":
      return "The requested record could not be found.";
    case "unavailable":
      return "Service is temporarily unavailable. Please check your connection and try again.";
    case "storage/unauthorized":
      return "You don't have permission to upload or view this receipt.";
    case "storage/canceled":
      return "Receipt upload was cancelled.";
    case "storage/quota-exceeded":
      return "Storage quota reached. Receipt was saved using compressed local fallback.";
    default:
      if (msg && !msg.includes("Firebase:") && !msg.includes("firestore/")) {
        return msg;
      }
      return fallback;
  }
}
