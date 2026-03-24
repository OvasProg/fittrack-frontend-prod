document.documentElement.classList.add("auth-check-pending");

function unlockPageAfterAuthCheck() {
   document.documentElement.classList.remove("auth-check-pending");
}

async function requireAuth(redirectTo = "/registration.html") {
   try {
      const user = await checkAuthUser();

      if (!user) {
         window.location.replace(redirectTo);
         return null;
      }

      unlockPageAfterAuthCheck();
      return user;
   } catch (error) {
      console.error("Auth guard error:", error);
      window.location.replace(redirectTo);
      return null;
   }
}

async function redirectIfAuthenticated(redirectTo = "/dashboard.html") {
   try {
      const user = await checkAuthUser();

      if (user) {
         window.location.replace(redirectTo);
         return null;
      }

      unlockPageAfterAuthCheck();
      return null;
   } catch (error) {
      console.error("Redirect auth check error:", error);
      unlockPageAfterAuthCheck();
      return null;
   }
}