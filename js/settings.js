document.addEventListener("DOMContentLoaded", initSettingsPage);

async function initSettingsPage() {
   const user = await requireAuth("/login.html");
   if (!user) return;

   await loadSettingsData();
   bindSettingsEvents();
}

async function loadSettingsData() {
   try {
      const overview = await getDashboardOverview();
      const biometrics = overview?.user?.biometrics || {};

      const weightInput = document.getElementById("bodyWeight");
      const heightInput = document.getElementById("bodyHeight");
      const levelSelect = document.getElementById("experienceLevel");

      if (weightInput) {
         weightInput.value = biometrics.weight ?? "";
      }

      if (heightInput) {
         heightInput.value = biometrics.height ?? "";
      }

      if (levelSelect) {
         levelSelect.value = biometrics.experience_level ?? "Beginner";
      }
   } catch (error) {
      console.error("Failed to load settings data:", error);
   }
}

function bindSettingsEvents() {
   const biometricsForm = document.getElementById("biometricsForm");
   const deleteAccountButton = document.getElementById("deleteAccountButton");

   if (biometricsForm) {
      biometricsForm.addEventListener("submit", handleSaveBiometrics);
   }

   if (deleteAccountButton) {
      deleteAccountButton.addEventListener("click", handleDeleteAccount);
   }
}

async function handleSaveBiometrics(event) {
   event.preventDefault();

   const form = document.getElementById("biometricsForm");
   const saveButton = document.getElementById("saveBiometricsButton");
   const weightInput = document.getElementById("bodyWeight");
   const heightInput = document.getElementById("bodyHeight");
   const levelSelect = document.getElementById("experienceLevel");

   if (!form || !saveButton || !weightInput || !heightInput || !levelSelect) return;

   const payload = {};

   if (weightInput.value !== "") {
      payload.weight = Number(weightInput.value);
   }

   if (heightInput.value !== "") {
      payload.height = Number(heightInput.value);
   }

   if (levelSelect.value) {
      payload.experience_level = levelSelect.value;
   }

   if (!Object.keys(payload).length) {
      alert("Nothing to update.");
      return;
   }

   setBiometricsFormDisabled(true);
   saveButton.textContent = "Saving...";

   try {
      const response = await updateBiometrics(payload);

      alert(response?.message || "Biometric data updated successfully.");

      saveButton.textContent = "Save";
      setBiometricsFormDisabled(false);
   } catch (error) {
      console.error("Failed to update biometrics:", error);

      saveButton.textContent = "Save";
      setBiometricsFormDisabled(false);

      alert(error?.data?.message || "Failed to update settings.");
   }
}

function setBiometricsFormDisabled(isDisabled) {
   const weightInput = document.getElementById("bodyWeight");
   const heightInput = document.getElementById("bodyHeight");
   const levelSelect = document.getElementById("experienceLevel");
   const saveButton = document.getElementById("saveBiometricsButton");

   if (weightInput) weightInput.disabled = isDisabled;
   if (heightInput) heightInput.disabled = isDisabled;
   if (levelSelect) levelSelect.disabled = isDisabled;
   if (saveButton) saveButton.disabled = isDisabled;
}

async function handleDeleteAccount() {
   const deleteButton = document.getElementById("deleteAccountButton");
   if (!deleteButton) return;

   const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
   );

   if (!confirmed) return;

   deleteButton.disabled = true;
   deleteButton.textContent = "Deleting...";

   try {
      const response = await deleteAccount();

      alert(response?.message || "Account has been deleted.");
      window.location.href = "./login.html";
   } catch (error) {
      console.error("Delete account failed:", error);

      deleteButton.disabled = false;
      deleteButton.textContent = "Delete account";

      alert(error?.data?.message || "Failed to delete account.");
   }
}