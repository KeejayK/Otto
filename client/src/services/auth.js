import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

/**
 * Initiates Google sign-in using Firebase Authentication and requests
 * access to Google Calendar scopes.
 * @returns {idToken: string, accessToken: string, user: object}
 *   An object containing the ID token, Google access token, and user information.
 * @throws {Error} If the Google OAuth credential is not found.
 */
export async function loginWithGoogle() {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  
  // Add profile and email scopes
  provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
  provider.addScope('https://www.googleapis.com/auth/userinfo.email');
  
  // Add calendar scopes
  provider.addScope('https://www.googleapis.com/auth/calendar');
  provider.addScope('https://www.googleapis.com/auth/calendar.events');

  // Open a popup for Google sign-in
  const result = await signInWithPopup(auth, provider);

  const user = result.user; // Firebase user object
  const idToken = await user.getIdToken(); // Firebase ID token
  
  // Extract the Google OAuth credential from the result
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (!credential || !credential.accessToken) {
    throw new Error('Google OAuth credential not found');
  }
  const accessToken = credential.accessToken; // Google access token

  // Return the tokens and user information
  return { idToken, accessToken, user };
}
