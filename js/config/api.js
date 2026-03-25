function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    return parts.pop().split(";").shift();
  }

  return null;
}

function getCsrfToken() {
  const token = getCookie("XSRF-TOKEN");
  return token ? decodeURIComponent(token) : "";
}

async function request(url, options = {}) {
  const method = options.method ? options.method.toUpperCase() : "GET";
  const isWriteRequest = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  const headers = {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };

  if (isWriteRequest) {
    const csrfToken = getCsrfToken();

    if (csrfToken) {
      headers["X-XSRF-TOKEN"] = csrfToken;
    }
  }

  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData = null;

    try {
      errorData = await response.json();
    } catch (_) {
      errorData = null;
    }

    const error = new Error("Request failed: " + response.status);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function api(endpoint) {
  try {
    if (CONFIG.USE_MOCK) {
      console.log("Using MOCK API:", endpoint);

      const response = await fetch("./data" + endpoint + ".json");

      if (!response.ok) {
        throw new Error("Mock API error: " + response.status);
      }

      return await response.json();
    }

    return await request(CONFIG.API_URL + "/api" + endpoint);
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

async function getCsrfCookie() {
  return request(CONFIG.API_URL + "/sanctum/csrf-cookie");
}

async function registerUser(payload) {
  await getCsrfCookie();

  return request(CONFIG.API_URL + "/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function loginUser(payload) {
  await getCsrfCookie();

  return request(CONFIG.API_URL + "/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function logoutUser() {
  return request(CONFIG.API_URL + "/logout", {
    method: "POST",
  });
}

async function getCurrentUser() {
  return request(CONFIG.API_URL + "/api/user");
}
async function checkAuthUser() {
  try {
    const user = await getCurrentUser();
    return user;
  } catch (error) {
    if (error.status === 401) {
      return null;
    }

    throw error;
  }
}

async function forgotPassword(payload) {
  await getCsrfCookie();

  return request(CONFIG.API_URL + "/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function resetPassword(payload) {
  await getCsrfCookie();

  return request(CONFIG.API_URL + "/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function submitOnboarding(payload) {
  return request(CONFIG.API_URL + "/api/onboarding", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function getTrainingDetails(trainingId) {
  return api(`/trainings/${trainingId}`);
}

async function startWorkout(payload) {
  await getCsrfCookie();

  return request(CONFIG.API_URL + "/api/workouts/start", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function finishWorkout(sessionId, payload) {
  await getCsrfCookie();

  return request(CONFIG.API_URL + `/api/workouts/${sessionId}/finish`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function getDashboardOverview() {
  return api("/dashboard/overview");
}

async function getAnalyticsSummary() {
  return api("/analytics/summary");
}

async function getAnalyticsVolumeChart() {
  return api("/analytics/charts/volume");
}

async function getAnalyticsMuscleDistribution() {
  return api("/analytics/charts/muscle-distribution");
}

async function updateBiometrics(payload) {
  await getCsrfCookie();

  return request(CONFIG.API_URL + "/api/settings/biometrics", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

async function deleteAccount() {
  await getCsrfCookie();

  return request(CONFIG.API_URL + "/api/settings/account", {
    method: "DELETE",
  });
}

async function getAdminDashboard() {
  return api("/admin/dashboard");
}

async function getAdminUsers() {
  return api("/admin/users");
}

async function getDeletedAdminUsers() {
  return api("/admin/users/deleted");
}

async function updateUserRole(userId, payload) {
  await getCsrfCookie();

  return request(CONFIG.API_URL + `/api/admin/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

async function restoreAdminUser(userId) {
  await getCsrfCookie();

  return request(CONFIG.API_URL + `/api/admin/users/${userId}/restore`, {
    method: "POST",
  });
}

async function forceDeleteAdminUser(userId) {
  await getCsrfCookie();

  return request(CONFIG.API_URL + `/api/admin/users/${userId}/force`, {
    method: "DELETE",
  });
}

async function getAdminLogs() {
  return api("/admin/logs");
}

async function createAdminAnnouncement(payload) {
  await getCsrfCookie();

  return request(CONFIG.API_URL + "/api/admin/announcements", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function subscribeToPro() {
  await getCsrfCookie();

  return request(CONFIG.API_URL + "/api/subscribe", {
    method: "POST",
  });
}

async function getGoogleAuthUrl() {
  await getCsrfCookie();

  return request(CONFIG.API_URL + "/google/url");
}

async function completeGoogleAuth(code) {
  await getCsrfCookie();

  return request(CONFIG.API_URL + "/google/callback", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

let dashboardOverviewPromise = null;

function getSharedDashboardOverview() {
  if (!dashboardOverviewPromise) {
    dashboardOverviewPromise = api("/dashboard/overview");
  }

  return dashboardOverviewPromise;
}

function resetSharedDashboardOverview() {
  dashboardOverviewPromise = null;
}
