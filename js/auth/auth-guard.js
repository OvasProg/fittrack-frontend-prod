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

function sleep(ms) {
   return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForAuthenticatedUser(attempts = 8, delay = 250) {
   for (let i = 0; i < attempts; i += 1) {
      try {
         const user = await checkAuthUser();

         if (user) {
            return user;
         }
      } catch (error) {
         console.warn("waitForAuthenticatedUser attempt failed:", error);
      }

      if (i < attempts - 1) {
         await sleep(delay);
      }
   }

   return null;
}

async function getAuthorizedUserProfile() {
   const authUser = await waitForAuthenticatedUser();

   if (!authUser) {
      return null;
   }

   try {
      const overview = await getDashboardOverview();
      return overview?.user || authUser;
   } catch (error) {
      console.warn("Failed to load dashboard overview for profile completeness check:", error);
      return authUser;
   }
}

async function getPostAuthRedirectPath(fallbackRedirect = "/dashboard.html") {
   const user = await getAuthorizedUserProfile();

   if (!user) {
      return null;
   }

   return needsBiometrics(user) ? "/biometric.html" : fallbackRedirect;
}

async function requireAuth(redirectTo = "/registration.html") {
   try {
      const user = await waitForAuthenticatedUser();

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
      const authUser = await checkAuthUser();

      if (!authUser) {
         unlockPageAfterAuthCheck();
         return null;
      }

      const redirectPath = await getPostAuthRedirectPath(redirectTo);

      window.location.replace(redirectPath || redirectTo);
      return authUser;
   } catch (error) {
      console.error("Redirect auth check error:", error);
      unlockPageAfterAuthCheck();
      return null;
   }
}