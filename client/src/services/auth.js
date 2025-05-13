import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';


export async function loginWithGoogle() {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/calendar');
  provider.addScope('https://www.googleapis.com/auth/calendar.events');

  const result = await signInWithPopup(auth, provider);

  const user = result.user;
  const idToken = await user.getIdToken();

  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (!credential || !credential.accessToken) {
    throw new Error('Google OAuth credential not found');
  }
  const accessToken = credential.accessToken;

  return { idToken, accessToken, user };
}
