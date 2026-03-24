document.addEventListener("DOMContentLoaded", initResetPasswordPage);

function initResetPasswordPage() {
   const form = document.getElementById("resetPasswordForm");

   if (!form) return;

   form.addEventListener("submit", handleResetPasswordSubmit);
}

async function handleResetPasswordSubmit(event) {
   event.preventDefault();

   const form = event.currentTarget;
   const submitButton = form.querySelector('button[type="submit"]');

   clearFormMessage("resetPasswordMessage");
   setButtonLoading(submitButton, true, "Resetting...");

   const params = new URLSearchParams(window.location.search);
   const token = params.get("token");
   const email = params.get("email");

   const payload = {
      token,
      email,
      password: form.elements["password"]?.value,
      password_confirmation: form.elements["password_confirmation"]?.value
   };

   try {
      if (!token || !email) {
         showFormMessage("resetPasswordMessage", "Invalid reset link.");
         return;
      }

      await resetPassword(payload);

      showFormMessage(
         "resetPasswordMessage",
         "Your password has been reset. Redirecting to login...",
         "success"
      );

      setTimeout(() => {
         window.location.href = "/login.html";
      }, 1200);

   } catch (error) {
      console.error("Reset password error:", error);

      if (error.status === 422) {
         showFormMessage(
            "resetPasswordMessage",
            "Please check your password and reset link."
         );
      } else {
         showFormMessage(
            "resetPasswordMessage",
            "Something went wrong. Please try again."
         );
      }
   } finally {
      setButtonLoading(submitButton, false, "Reset Password");
   }
}

function showFormMessage(elementId, message, type = "error") {
   const messageElement = document.getElementById(elementId);

   if (!messageElement) return;

   messageElement.textContent = message;
   messageElement.classList.remove("reset-password-card__message--success");

   if (type === "success") {
      messageElement.classList.add("reset-password-card__message--success");
   }
}

function clearFormMessage(elementId) {
   const messageElement = document.getElementById(elementId);

   if (!messageElement) return;

   messageElement.textContent = "";
   messageElement.classList.remove("reset-password-card__message--success");
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
   button.textContent = button.dataset.defaultText || "Reset Password";
}