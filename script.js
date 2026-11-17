(() => {
  "use strict";

  /*
   * BACKEND SETUP
   * 1. Deploy your Google Apps Script as a Web App.
   * 2. Paste its deployed /exec URL below.
   * 3. The endpoint must accept JSON { name, rollNumber } and return
   *    JSON { success: true }. Any other response is treated as a failure.
   * Leave empty until the endpoint is deployed. In that case the form
   * intentionally does NOT show a false success/registration message.
   */

const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw_q97bewHhqkWTuKpUujZN9p3RLTUTAeV0wfny7Vu2h2-_9z-gXNng0AvE3-5cnL-i8w/exec";

  const screens = {
    welcome: document.getElementById("screen-welcome"),
    journey: document.getElementById("screen-journey"),
    reveal: document.getElementById("screen-reveal")
  };

  const stages = {
    form: document.getElementById("stage-form"),
    success: document.getElementById("stage-success"),
    suspense: document.getElementById("stage-suspense")
  };

  const startButton = document.getElementById("start-button");
  const unlockButton = document.getElementById("unlock-button");
  const form = document.getElementById("student-form");
  const nameInput = document.getElementById("student-name");
  const rollInput = document.getElementById("roll-number");
  const nameError = document.getElementById("name-error");
  const rollError = document.getElementById("roll-error");
  const formStatus = document.getElementById("form-status");
  const submitButton = document.getElementById("submit-button");
  const firstNameOutput = document.getElementById("first-name");

  let currentScreen = "welcome";
  let currentStage = "form";
  let isSubmitting = false;
  let hasSubmitted = false;

  function showScreen(screenName) {
    if (!screens[screenName] || currentScreen === screenName) return;
    Object.entries(screens).forEach(([name, element]) => {
      const active = name === screenName;
      element.hidden = !active;
      element.classList.toggle("is-active", active);
      if (active) {
        element.classList.remove("screen-enter");
        void element.offsetWidth;
        element.classList.add("screen-enter");
      }
    });
    currentScreen = screenName;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showStage(stageName) {
    if (!stages[stageName]) return;
    Object.entries(stages).forEach(([name, element]) => {
      const active = name === stageName;
      element.hidden = !active;
      element.classList.toggle("is-current", active);
      if (active) {
        element.classList.remove("journey-stage");
        void element.offsetWidth;
        element.classList.add("journey-stage");
      }
    });
    currentStage = stageName;
  }

  function setFieldError(input, errorElement, message) {
    errorElement.textContent = message;
    input.setAttribute("aria-invalid", message ? "true" : "false");
    if (message) input.setAttribute("aria-describedby", errorElement.id);
    else input.removeAttribute("aria-describedby");
  }

  function validateForm() {
    const name = nameInput.value.trim().replace(/\s+/g, " ");
    const rollNumber = rollInput.value.trim();
    nameInput.value = name;
    rollInput.value = rollNumber;

    const nameMessage = name ? "" : "Please enter your name.";
    const rollMessage = rollNumber ? "" : "Please enter your roll number.";
    setFieldError(nameInput, nameError, nameMessage);
    setFieldError(rollInput, rollError, rollMessage);

    if (!nameMessage && !rollMessage) return { name, rollNumber };
    formStatus.textContent = "Please complete the highlighted field(s) to continue.";
    (!name ? nameInput : rollInput).focus();
    return null;
  }

  async function submitStudentDetails(details) {
    if (!GOOGLE_APPS_SCRIPT_URL) {
      throw new Error("Student registration is not connected yet. Please try again later.");
    }

    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(details),
      redirect: "follow"
    });

    if (!response.ok) {
      throw new Error("We couldn't submit your details right now. Please try again.");
    }

    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error("The registration service returned an unreadable response. Please try again.");
    }

    if (!result || result.success !== true) {
      throw new Error(result && result.message
        ? result.message
        : "Your details could not be confirmed. Please try again.");
    }
    return result;
  }

  function setSubmitting(submitting) {
    isSubmitting = submitting;
    submitButton.disabled = submitting;
    submitButton.querySelector(".button-label").textContent = submitting
      ? "SUBMITTING..."
      : "SUBMIT & CONTINUE";
    form.setAttribute("aria-busy", submitting ? "true" : "false");
  }

  startButton.addEventListener("click", () => showScreen("journey"));

  nameInput.addEventListener("input", () => {
    if (nameInput.value.trim()) setFieldError(nameInput, nameError, "");
    if (formStatus.textContent) formStatus.textContent = "";
  });
  rollInput.addEventListener("input", () => {
    if (rollInput.value.trim()) setFieldError(rollInput, rollError, "");
    if (formStatus.textContent) formStatus.textContent = "";
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isSubmitting || hasSubmitted) return;

    const details = validateForm();
    if (!details) return;

    formStatus.textContent = "";
    setSubmitting(true);
    try {
      await submitStudentDetails(details);
      hasSubmitted = true;
      firstNameOutput.textContent = details.name.split(/\s+/)[0].toUpperCase();
      showStage("success");

      // Success is shown only after the backend confirms the submission.
      window.setTimeout(() => {
        if (currentScreen === "journey" && currentStage === "success") {
          showStage("suspense");
        }
      }, 1900);
    } catch (error) {
      formStatus.textContent = error instanceof Error
        ? error.message
        : "Something went wrong. Please try again.";
      // Inputs are deliberately left untouched so the student can retry.
    } finally {
      setSubmitting(false);
    }
  });

  unlockButton.addEventListener("click", () => {
    if (!hasSubmitted || currentStage !== "suspense") return;
    showScreen("reveal");
  });

  // Start in a deterministic state: exactly one screen and one journey stage.
  Object.entries(screens).forEach(([name, element]) => {
    element.hidden = name !== "welcome";
  });
  Object.entries(stages).forEach(([name, element]) => {
    element.hidden = name !== "form";
  });
})();
