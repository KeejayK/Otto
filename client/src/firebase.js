import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';


const firebaseConfig = {
  apiKey: "AIzaSyBPDfrgBIFubXszgKNG2giyn4OUQt-WkuM",
  authDomain: "otto-458919.firebaseapp.com",
  projectId: "otto-458919",
  storageBucket: "otto-458919.appspot.com",
  messagingSenderId: "857985750780",
  appId: "1:857985750780:web:821a6e3454dbfb1276a979",
  measurementId: "G-KE9G47R5YT"
};

// const app = initializeApp(firebaseConfig);
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Request calendar access scopes
provider.addScope('https://www.googleapis.com/auth/calendar');
provider.addScope('https://www.googleapis.com/auth/calendar.events');

export { auth, provider };
