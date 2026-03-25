document.addEventListener("DOMContentLoaded", initGoogleCallbackPage);

async function initGoogleCallbackPage() {
   const messageElement = document.getElementById("googleCallbackMessage");
   const params = new URLSearchParams(window.location.search);
   const code = params.get("code");

   if (!code) {
      if (messageElement) {
         messageElement.textContent = "Google authorization code not found.";
      }

      setTimeout(() => {
         window.location.href = "/login.html";
      }, 1500);

      return;
   }

   try {
      await completeGoogleAuth(code);

      const user = await getAuthorizedUserProfile();
      const intent = sessionStorage.getItem("googleAuthIntent");

      sessionStorage.removeItem("googleAuthIntent");

      if (!user) {
         throw new Error("Authenticated user was not returned.");
      }

      console.log("Google auth user:", user);
      console.log("Google auth intent:", intent);
      console.log("needsBiometrics:", needsBiometrics(user));

      if (intent === "register") {
         window.location.href = "/biometric.html";
         return;
      }

      const redirectTo = await getPostAuthRedirectPath("/dashboard.html");
      window.location.href = redirectTo || "/dashboard.html";
   } catch (error) {
      console.error("Google callback error:", error);

      if (messageElement) {
         messageElement.textContent =
            error?.data?.message || error.message || "Failed to complete Google authentication.";
      }

      setTimeout(() => {
         window.location.href = "/login.html";
      }, 2000);
   }
}