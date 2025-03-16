require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");
const admin = require("firebase-admin");
const path = require("path");

const PORT = process.env.PORT || 5000;

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

app.use(express.static("public"));
app.use(cors({ origin: "http://localhost:5000" }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
  console.log("✅ Firebase Admin initialized successfully.");
} else {
  console.log("⚠️ Firebase Admin already initialized. Skipping re-initialization.");
}


const db = admin.firestore();
const auth = admin.auth();

app.post("/signup", async (req, res) => {
  const { email, password, username } = req.body;

  console.log("📩 Received signup request:", req.body);

  try {
    const userRecord = await auth.createUser({ email, password, displayName: username });

    console.log("✅ User created in Firebase Auth:", userRecord.uid);

    await db.collection("users").doc(userRecord.uid).set({
      email,
      username,
      calorieData: {},
    });

    console.log("✅ User saved in Firestore:", userRecord.uid);

    res.status(201).json({ message: "User created successfully!", userId: userRecord.uid });
  } catch (error) {
    console.error("❌ Error in signup:", error);
    res.status(400).json({ error: error.message });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  console.log("📩 Received login request:", req.body);

  try {
    const userRecord = await auth.getUserByEmail(email);
    const userDoc = await db.collection("users").doc(userRecord.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found in database." });
    }

    res.status(200).json({ userId: userRecord.uid, email: userRecord.email });
  } catch (error) {
    res.status(400).json({ error: "Invalid email or password." });
  }
});

app.post("/save-data", async (req, res) => {
  const { userId, calorieData } = req.body;

  console.log("📩 Received request at /save-data:", req.body);

  if (!userId) {
    return res.status(400).json({ error: "User ID is missing." });
  }

  try {
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.log("❌ User not found in Firestore.");
      return res.status(404).json({ error: "User not found. Please sign up again." });
    }

    console.log("✅ User found! Updating calorie data...");
    await userRef.set({ calorieData }, { merge: true });

    console.log("✅ Data saved successfully!");
    res.status(200).json({ message: "Calorie data saved successfully!" });
  } catch (error) {
    console.error("❌ Error saving data:", error);
    res.status(500).json({ error: "Internal server error. Please try again later." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
