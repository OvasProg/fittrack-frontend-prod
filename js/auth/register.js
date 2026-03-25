document.addEventListener("DOMContentLoaded", initRegisterPage);

async function initRegisterPage() {
   const authenticatedUser = await redirectIfAuthenticated("/dashboard.html");
   if (authenticatedUser) return;

   const form = document.getElementById("registerForm");
   const googleButton = document.getElementById("googleRegisterButton");

   if (form) {
      form.addEventListener("submit", handleRegisterSubmit);
   }

   if (googleButton) {
      googleButton.addEventListener("click", handleGoogleRegister);
   }
}

async function handleRegisterSubmit(event) {
   event.preventDefault();

   const form = event.currentTarget;
   const submitButton = form.querySelector('button[type="submit"]');

   clearFormMessage("registerMessage");
   setButtonLoading(submitButton, true, "Creating account...");

   const payload = {
      name: form.elements["name"]?.value.trim(),
      email: form.elements["email"]?.value.trim(),
      password: form.elements["password"]?.value,
      password_confirmation: form.elements["password_confirmation"]?.value
   };

   try {
      await registerUser(payload);

      await loginUser({
         email: payload.email,
         password: payload.password,
         remember: true
      });

      const redirectTo = await getPostAuthRedirectPath("/dashboard.html");
      window.location.href = redirectTo || "/biometric.html";
   } catch (error) {
      console.error("Registration error:", error);

      if (error.status === 422) {
         showFormMessage("registerMessage", "An account with this email already exists.");
      } else {
         showFormMessage("registerMessage", "Something went wrong. Please try again.");
      }
   } finally {
      setButtonLoading(submitButton, false, "Create Account");
   }
}

async function handleGoogleRegister(event) {
   const button = event.currentTarget;

   clearFormMessage("registerMessage");
   setButtonLoading(button, true, "Redirecting...");

   try {
      sessionStorage.setItem("googleAuthIntent", "register");

      const response = await getGoogleAuthUrl();
      const url = response?.url;

      if (!url) {
         throw new Error("Google auth URL was not returned.");
      }

      window.location.href = url;
   } catch (error) {
      console.error("Google register error:", error);
      showFormMessage("registerMessage", "Failed to start Google authentication.");
      setButtonLoading(button, false, "Sign up with Google");
   }
}

function showFormMessage(elementId, message, type = "error") {
   const messageElement = document.getElementById(elementId);

   if (!messageElement) return;

   messageElement.textContent = message;
   messageElement.classList.remove("auth-form__message--success");

   if (type === "success") {
      messageElement.classList.add("auth-form__message--success");
   }
}

function clearFormMessage(elementId) {
   const messageElement = document.getElementById(elementId);

   if (!messageElement) return;

   messageElement.textContent = "";
   messageElement.classList.remove("auth-form__message--success");
}

function setButtonLoading(button, isLoading, loadingText) {
   if (!button) return;

   if (isLoading) {
      button.disabled = true;
      button.dataset.defaultText = button.textContent.trim();
      button.textContent = loadingText;
      return;
   }

   button.disabled = false;
   button.textContent = button.dataset.defaultText || "Create Account";
}