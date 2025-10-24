// 1. Firebase SDK 초기화 + messaging 객체 생성

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBHNda0bxCoclqplF8PuM2Ck6-ayD_8PYg",
  authDomain: "bid-n-buy-9669a.firebaseapp.com",
  projectId: "bid-n-buy-9669a",
  storageBucket: "bid-n-buy-9669a.firebasestorage.app",
  messagingSenderId: "118154895167",
  appId: "1:118154895167:web:0c68602f7fcd7be4563d8a",
  measurementId: "G-J9FVLR1HXW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// FCM Messaging 가져오기
export const messaging = getMessaging(app);