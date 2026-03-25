document.addEventListener("DOMContentLoaded", initBiometricPage);

async function initBiometricPage() {
   const authUser = await requireAuth("/login.html");
   if (!authUser) return;

   const user = await getAuthorizedUserProfile();

   if (user && !needsBiometrics(user)) {
      window.location.replace("/dashboard.html");
      return;
   }

   const form = document.getElementById("setupForm");

   if (!form) return;

   const steps = Array.from(form.querySelectorAll(".form-step"));
   const indicators = Array.from(form.querySelectorAll("[data-step-indicator]"));
   const nextButtons = Array.from(form.querySelectorAll('[data-action="next-step"]'));
   const prevButtons = Array.from(document.querySelectorAll('[data-action="prev-step"]'));

   let currentStep = 1;
   const totalSteps = steps.length;

   function getStepElement(stepNumber) {
      return form.querySelector(`.form-step[data-step="${stepNumber}"]`);
   }

   function showSetupMessage(message, type = "error") {
      const messageElement = document.getElementById("setupMessage");
      if (!messageElement) return;

      messageElement.textContent = message;
      messageElement.className = "setup-form__message";

      if (type === "success") {
         messageElement.classList.add("setup-form__message--success");
      }
   }

   function clearSetupMessage() {
      const messageElement = document.getElementById("setupMessage");
      if (!messageElement) return;

      messageElement.textContent = "";
      messageElement.className = "setup-form__message";
   }

   function updateStepsView() {
      steps.forEach((step) => {
         const stepNumber = Number(step.dataset.step);
         step.classList.toggle("form-step--active", stepNumber === currentStep);
      });

      indicators.forEach((indicator) => {
         const stepNumber = Number(indicator.dataset.stepIndicator);

         indicator.classList.remove("steps__item--active", "steps__item--done");

         if (stepNumber < currentStep) {
            indicator.classList.add("steps__item--done");
         } else if (stepNumber === currentStep) {
            indicator.classList.add("steps__item--active");
         }
      });

      const headerBackButton = document.querySelector('.header__back[data-action="prev-step"]');

      if (headerBackButton) {
         headerBackButton.style.visibility = currentStep === 1 ? "hidden" : "visible";
      }

      window.scrollTo({
         top: 0,
         behavior: "smooth"
      });
   }

   function validateStep(stepNumber) {
      const currentStepElement = getStepElement(stepNumber);
      if (!currentStepElement) return true;

      if (stepNumber === 1) {
         const age = currentStepElement.querySelector("#age");
         const gender = currentStepElement.querySelector("#gender");
         const weight = currentStepElement.querySelector("#weight");
         const height = currentStepElement.querySelector("#height");

         if (!age?.value.trim()) {
            showSetupMessage("Please enter your age.");
            age.focus();
            return false;
         }

         if (!gender?.value) {
            showSetupMessage("Please select your gender.");
            gender.focus();
            return false;
         }

         if (!weight?.value.trim()) {
            showSetupMessage("Please enter your weight.");
            weight.focus();
            return false;
         }

         if (!height?.value.trim()) {
            showSetupMessage("Please enter your height.");
            height.focus();
            return false;
         }

         return true;
      }

      if (stepNumber === 2) {
         const checkedExperience = currentStepElement.querySelector('input[name="experience"]:checked');

         if (!checkedExperience) {
            showSetupMessage("Please choose your experience level.");
            return false;
         }

         return true;
      }

      if (stepNumber === 3) {
         const checkedDays = currentStepElement.querySelectorAll('input[name="trainingDays"]:checked');

         if (!checkedDays.length) {
            showSetupMessage("Please choose at least one training day.");
            return false;
         }

         return true;
      }

      return true;
   }

   function goToStep(stepNumber) {
      if (stepNumber < 1 || stepNumber > totalSteps) return;

      currentStep = stepNumber;
      clearSetupMessage();
      updateStepsView();
   }

   function nextStep() {
      clearSetupMessage();

      const isValid = validateStep(currentStep);

      if (!isValid) return;

      if (currentStep < totalSteps) {
         goToStep(currentStep + 1);
      }
   }

   function prevStep() {
      clearSetupMessage();

      if (currentStep > 1) {
         goToStep(currentStep - 1);
      }
   }

   function mapTrainingDays(days) {
      const dayMap = {
         mon: "Monday",
         tue: "Tuesday",
         wed: "Wednesday",
         thu: "Thursday",
         fri: "Friday",
         sat: "Saturday",
         sun: "Sunday"
      };

      return days.map((day) => dayMap[day]).filter(Boolean);
   }

   function mapExperienceLevel(value) {
      const map = {
         beginner: "Beginner",
         intermediate: "Intermediate",
         advanced: "Advanced"
      };

      return map[value] || value;
   }

   nextButtons.forEach((button) => {
      button.addEventListener("click", nextStep);
   });

   prevButtons.forEach((button) => {
      button.addEventListener("click", prevStep);
   });

   indicators.forEach((indicator) => {
      indicator.addEventListener("click", () => {
         const targetStep = Number(indicator.dataset.stepIndicator);

         if (targetStep <= currentStep) {
            goToStep(targetStep);
         }
      });

      indicator.style.cursor = "pointer";
   });

   form.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearSetupMessage();

      const isValid = validateStep(currentStep);

      if (!isValid) return;

      const submitButton = form.querySelector('button[type="submit"]');

      if (submitButton) {
         submitButton.disabled = true;
         submitButton.dataset.defaultText = submitButton.textContent.trim();
         submitButton.textContent = "Saving...";
      }

      const formData = new FormData(form);

      const payload = {
         age: Number(formData.get("age")),
         weight: Number(formData.get("weight")),
         height: Number(formData.get("height")),
         experience_level: mapExperienceLevel(formData.get("experience")),
         training_days: mapTrainingDays(formData.getAll("trainingDays"))
      };

      try {
         const response = await submitOnboarding(payload);

         console.log("Onboarding response:", response);

         showSetupMessage(
            response?.message || "Onboarding complete!",
            "success"
         );

         setTimeout(() => {
            window.location.href = "/dashboard.html";
         }, 1000);
      } catch (error) {
         console.error("Onboarding error:", error);

         if (error.status === 422) {
            showSetupMessage("Please check the entered data.");
         } else {
            showSetupMessage("Something went wrong. Please try again.");
         }
      } finally {
         if (submitButton) {
            submitButton.disabled = false;
            buttonTextRestore(submitButton, "Save");
         }
      }
   });

   updateStepsView();
}

function buttonTextRestore(button, fallbackText) {
   if (!button) return;
   button.textContent = button.dataset.defaultText || fallbackText;
}