import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-analytics.js";

(async function () {
  try {
    console.log("Fetching Firebase config...");
    
    const response = await fetch("/firebase-config.json");
    if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);
    
    const firebaseConfig = await response.json();
    console.log("✅ Firebase config loaded successfully.");

    if (!firebase.apps.length) {
      const app = initializeApp(firebaseConfig);
      console.log("✅ Firebase initialized successfully.");
      getAnalytics(app);
    } else {
      console.log("⚠️ Firebase already initialized.");
    }

  } catch (error) {
    console.error("❌ Failed to load Firebase config:", error);
  }
})();