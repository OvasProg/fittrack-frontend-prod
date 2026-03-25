document.addEventListener("DOMContentLoaded", initLoginPage);

async function initLoginPage() {
   const authenticatedUser = await redirectIfAuthenticated("/dashboard.html");
   if (authenticatedUser) return;

   const form = document.getElementById("loginForm");
   const googleButton = document.getElementById("googleLoginButton");

   if (form) {
      form.addEventListener("submit", handleLoginSubmit);
   }

   if (googleButton) {
      googleButton.addEventListener("click", handleGoogleLogin);
   }
}

async function handleLoginSubmit(event) {
   event.preventDefault();

   const form = event.currentTarget;
   const submitButton = form.querySelector('button[type="submit"]');

   clearFormMessage("loginMessage");
   setButtonLoading(submitButton, true, "Signing in...");

   const payload = {
      email: form.elements["email"]?.value.trim(),
      password: form.elements["password"]?.value,
      remember: Boolean(form.elements["remember"]?.checked)
   };

   try {
      await loginUser(payload);

      const redirectTo = await getPostAuthRedirectPath("/dashboard.html");
      window.location.href = redirectTo || "/dashboard.html";
   } catch (error) {
      console.error("Login error:", error);

      if (error.status === 422 || error.status === 401) {
         showFormMessage("loginMessage", "Incorrect email or password.");
      } else {
         showFormMessage("loginMessage", "Something went wrong. Please try again.");
      }
   } finally {
      setButtonLoading(submitButton, false, "Sign In");
   }
}

async function handleGoogleLogin(event) {
   const button = event.currentTarget;

   clearFormMessage("loginMessage");
   setButtonLoading(button, true, "Redirecting...");

   try {
      sessionStorage.setItem("googleAuthIntent", "login");

      const response = await getGoogleAuthUrl();
      const url = response?.url;

      if (!url) {
         throw new Error("Google auth URL was not returned.");
      }

      window.location.href = url;
   } catch (error) {
      console.error("Google login error:", error);
      showFormMessage("loginMessage", "Failed to start Google authentication.");
      setButtonLoading(button, false, "Continue with Google");
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
   button.textContent = button.dataset.defaultText || "Sign In";
}