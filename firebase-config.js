const firebaseConfig = {
  apiKey: "AIzaSyDRd_45x26nsBO6xbuqCRPuu7HGLj1FZik",
  authDomain: "baanpaimai.firebaseapp.com",
  projectId: "baanpaimai",
  storageBucket: "baanpaimai.firebasestorage.app",
  messagingSenderId: "721924052112",
  appId: "1:721924052112:web:1db049242836f1a9c5b415",
  measurementId: "G-YR97PPNFFG",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();