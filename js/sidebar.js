document.addEventListener("DOMContentLoaded", loadSidebarUser);

async function loadSidebarUser() {
   try {
      const overview = await getSharedDashboardOverview();

      renderSidebarUser(overview?.user);
   } catch (error) {
      console.error("Sidebar loading error:", error);
   }
}

function renderSidebarUser(user) {
   if (!user) return;

   const nameElement = document.getElementById("profileName");
   const metaElement = document.getElementById("profileMeta");
   const heightElement = document.getElementById("profileHeight");
   const weightElement = document.getElementById("profileWeight");
   const avatarWrapper = document.querySelector(".profile-card__avatar");

   const biometrics = user.biometrics || {};

   const name = user.name || "User";
   const age = biometrics.age ?? "--";
   const height = biometrics.height ?? "--";
   const weight = biometrics.weight ?? "--";
   const experienceLevel = biometrics.experience_level ?? user.role ?? "--";
   const avatarUrl = user.avatar_url || "";
   const initial = String(name).trim().charAt(0).toUpperCase() || "U";

   if (nameElement) {
      nameElement.textContent = name;
   }

   if (metaElement) {
      metaElement.textContent = `${age} years, ${experienceLevel}`;
   }

   if (heightElement) {
      heightElement.textContent = height;
   }

   if (weightElement) {
      weightElement.textContent = weight;
   }

   if (!avatarWrapper) return;

   renderSidebarAvatar(avatarWrapper, avatarUrl, name, initial);
}

function renderSidebarAvatar(avatarWrapper, avatarUrl, name, initial) {
   avatarWrapper.innerHTML = "";

   if (!avatarUrl) {
      avatarWrapper.classList.add("profile-card__avatar--fallback");

      const fallbackElement = document.createElement("span");
      fallbackElement.className = "profile-card__avatar-fallback";
      fallbackElement.textContent = initial;

      avatarWrapper.appendChild(fallbackElement);
      return;
   }

   avatarWrapper.classList.remove("profile-card__avatar--fallback");

   const avatarImage = document.createElement("img");
   avatarImage.id = "profileAvatar";
   avatarImage.src = avatarUrl;
   avatarImage.alt = name;

   avatarImage.addEventListener("error", function () {
      avatarWrapper.innerHTML = "";
      avatarWrapper.classList.add("profile-card__avatar--fallback");

      const fallbackElement = document.createElement("span");
      fallbackElement.className = "profile-card__avatar-fallback";
      fallbackElement.textContent = initial;

      avatarWrapper.appendChild(fallbackElement);
   });

   avatarWrapper.appendChild(avatarImage);
}