document.documentElement.classList.add("auth-check-pending");

function unlockPageAfterAuthCheck() {
   document.documentElement.classList.remove("auth-check-pending");
}

function hasFilledValue(value) {
   return value !== null && value !== undefined && String(value).trim() !== "";
}

function needsBiometrics(user) {
   const biometrics = user?.biometrics || {};

   const age = user?.age ?? biometrics.age;
   const weight = user?.weight ?? biometrics.weight;
   const height = user?.height ?? biometrics.height;
   const experienceLevel = user?.experience_level ?? biometrics.experience_level;

   return !(
      hasFilledValue(age) &&
      hasFilledValue(weight) &&
      hasFilledValue(height) &&
      hasFilledValue(experienceLevel)
   );
}

function getPostAuthRedirect(user, fallbackRedirect = "/dashboard.html") {
   if (needsBiometrics(user)) {
      return "/biometric.html";
   }

   return fallbackRedirect;
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
         window.location.replace(getPostAuthRedirect(user, redirectTo));
         return user;
      }

      unlockPageAfterAuthCheck();
      return null;
   } catch (error) {
      console.error("Redirect auth check error:", error);
      unlockPageAfterAuthCheck();
      return null;
   }
}