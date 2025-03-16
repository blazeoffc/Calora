document.addEventListener("DOMContentLoaded", async function () {
  const wrapper = document.querySelector(".wrapper");
  const loginLink = document.querySelector(".login-link");
  const registerLink = document.querySelector(".register-link");
  const btnPopup = document.querySelector(".btnLogin-popup");
  const logoutButton = document.querySelector(".btn-logout");
  const iconClose = document.querySelector(".icon-close");
  const mainContent = document.querySelector("main");
  const loginButton = document.getElementById("loginBtn");
  const overlay = document.getElementById("overlay");
  const outputDiv = document.getElementById("output");

  
  if (registerLink && loginLink) {
    registerLink.addEventListener("click", () => wrapper.classList.add("active"));
    loginLink.addEventListener("click", () => wrapper.classList.remove("active"));
  }

  if (btnPopup && iconClose) {
    btnPopup.addEventListener("click", () => {
      wrapper.classList.add("active-popup");
      overlay.style.display = "block";
      mainContent?.classList.add("hidden");
    });

    iconClose.addEventListener("click", () => {
      wrapper.classList.remove("active-popup");
      overlay.style.display = "none";
      mainContent?.classList.remove("hidden");
    });

    overlay.addEventListener("click", () => {
      wrapper.classList.remove("active-popup");
      overlay.style.display = "none";
      mainContent?.classList.remove("hidden");
    });
  }

  let firebaseConfig;

  try {
    console.log("Fetching Firebase config...");

    const response = await fetch("/firebase-config.json");
    if (!response.ok) throw new Error("Failed to load Firebase config");

    const firebaseConfig = await response.json();
    console.log("✅ Firebase config loaded successfully.");

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
      console.log("✅ Firebase initialized successfully.");
    } else {
      console.log("⚠️ Firebase already initialized. Skipping re-initialization.");
    }

  } catch (error) {
    console.error("❌ Firebase initialization error:", error);
  }

  const auth = firebase.auth();
  const db = firebase.firestore();

  function checkAuthStatus() {
    const userId = localStorage.getItem("userId");

    if (userId) {
      if (loginButton) loginButton.style.display = "none";
      if (logoutButton) logoutButton.style.display = "block";
    } else {
      if (loginButton) {
        loginButton.style.display = "block";
        loginButton.textContent = "Login";
        loginButton.classList.remove("disabled");
        loginButton.style.pointerEvents = "auto";
      }
      if (logoutButton) logoutButton.style.display = "none";
    }
  }
  checkAuthStatus();

  if (logoutButton) {
    logoutButton.addEventListener("click", function () {
      localStorage.removeItem("userId");
      alert("You have been logged out.");
      checkAuthStatus();
      window.location.href = "index.html";
    });
    
  }

  const calorieTracker = document.getElementById("calorie-tracker");
  if (calorieTracker) {
    calorieTracker.addEventListener("submit", async (e) => {
      e.preventDefault();
      const userId = localStorage.getItem("userId");

      if (!userId) {
        alert("You must be logged in to track calories.");
        return;
      }

      const calorieLimit = parseInt(document.getElementById("limit")?.value || "0", 10);
      const breakfastCalories = getCaloriesFromInputs("#breakfast");
      const lunchCalories = getCaloriesFromInputs("#lunch");
      const dinnerCalories = getCaloriesFromInputs("#dinner");
      const snackCalories = getCaloriesFromInputs("#snacks");
      const exerciseCalories = getCaloriesFromInputs("#exercise");

      const totalCaloriesConsumed = breakfastCalories + lunchCalories + dinnerCalories + snackCalories;
      const netCalories = totalCaloriesConsumed - exerciseCalories;
      const remainingCalories = calorieLimit - netCalories;

      let statusMessage = "";
      if (remainingCalories > 0) {
        statusMessage = `<span style="color:#06E3AB; font-weight:bold;">Calorie Deficit (Good for Weight Loss)</span>`;
      } else if (remainingCalories < 0) {
        statusMessage = `<span style="color:red; font-weight:bold;">Calorie Surplus (Good for Weight Gain)</span>`;
      } else {
        statusMessage = `<span style="color:#f5f6f7; font-weight:bold;">Maintenance (Balanced Diet)</span>`;
      }

      displayCalorieResults(calorieLimit, totalCaloriesConsumed, exerciseCalories, remainingCalories, statusMessage);
    });
  }

  function getCaloriesFromInputs(fieldsetId) {
    return Array.from(document.querySelectorAll(`${fieldsetId} input[type='number']`))
      .map(input => parseInt(input.value.trim() || "0", 10))
      .filter(val => !isNaN(val))
      .reduce((sum, val) => sum + val, 0);
  }

  function displayCalorieResults(limit, consumed, burned, remaining, status) {
    outputDiv.classList.remove("hide");
    outputDiv.innerHTML = `
      <p><strong>Calorie Limit:</strong> ${limit}</p>
      <p><strong>Total Calories Consumed:</strong> ${consumed}</p>
      <p><strong>Calories Burned (Exercise):</strong> ${burned}</p>
      <p><strong>Calories Remaining:</strong> ${remaining}</p>
      <p><strong>Status:</strong> ${status}</p>
    `;
  }

  const entryDropdown = document.getElementById("entry-dropdown");
  const addEntryButton = document.getElementById("add-entry");

  if (addEntryButton && entryDropdown) {
    addEntryButton.addEventListener("click", function () {
      const selectedCategory = entryDropdown.value;
      if (!selectedCategory) {
        alert("Please select a category.");
        return;
      }

      const targetInputContainer = document.querySelector(`#${selectedCategory} .input-container`);
      if (!targetInputContainer) {
        console.error(`Target input container not found for ${selectedCategory}`);
        return;
      }

      const entryNumber = targetInputContainer.querySelectorAll('input[type="text"]').length + 1;
      targetInputContainer.insertAdjacentHTML(
        "beforeend",
        `
          <label>Entry ${entryNumber} Name</label>
          <input type="text" placeholder="Name" />
          <label>Entry ${entryNumber} Calories</label>
          <input type="number" min="0" placeholder="Calories" />
        `
      );
    });
  }

  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;

      if (!email || !password) {
        alert("Please enter both email and password.");
        return;
      }

      firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
          console.log("✅ Login successful", userCredential.user);
          localStorage.setItem("userId", userCredential.user.uid);
          checkAuthStatus();
          window.location.href = "index.html";
        })
        .catch((error) => {
          console.error("❌ Login error:", error.message);
          alert("Login failed: " + error.message);
        });
    });
  }

  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const email = document.getElementById("register-email").value;
      const password = document.getElementById("register-password").value;

      if (!email || !password) {
        alert("Please enter both email and password.");
        return;
      }

      firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          console.log("✅ Registration successful", userCredential.user);
          localStorage.setItem("userId", userCredential.user.uid);
          checkAuthStatus();
          window.location.href = "index.html";
        })
        .catch((error) => {
          console.error("❌ Registration error:", error.message);
          alert("Registration failed: " + error.message);
        });
    });
  }
});

