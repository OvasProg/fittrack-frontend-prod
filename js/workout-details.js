document.addEventListener("DOMContentLoaded", initWorkoutDetailsPage);

const workoutPageState = {
   training: null,
   sessionId: null,
   scheduledWorkoutId: null,
   isStarted: false,
   sets: []
};

async function initWorkoutDetailsPage() {
   const user = await requireAuth("/login.html");
   if (!user) return;

   await loadWorkoutDetails();
}

async function loadWorkoutDetails() {
   const container = document.getElementById("workoutDetails");
   if (!container) return;

   try {
      const trainingId = getTrainingIdFromUrl();
      const scheduledWorkoutId = getScheduledWorkoutIdFromUrl();

      workoutPageState.scheduledWorkoutId = scheduledWorkoutId;

      if (!trainingId) {
         renderWorkoutDetailsError("Workout id not found.");
         return;
      }

      const data = await getTrainingDetails(trainingId);
      const training = data?.training;

      if (!training) {
         renderWorkoutDetailsError("Workout not found.");
         return;
      }

      workoutPageState.training = training;
      workoutPageState.sets = buildInitialSets(training);

      renderWorkoutDetails(training);
      bindWorkoutDetailsEvents();

   } catch (error) {
      console.error("Workout details loading error:", error);
      renderWorkoutDetailsError("Failed to load workout.");
   }
}

function getTrainingIdFromUrl() {
   const params = new URLSearchParams(window.location.search);
   const id = params.get("id");
   return id ? Number(id) : null;
}

function getScheduledWorkoutIdFromUrl() {
   const params = new URLSearchParams(window.location.search);
   const id = params.get("scheduled_workout_id");
   return id ? Number(id) : null;
}

function buildInitialSets(training) {
   const exercises = Array.isArray(training?.exercises) ? training.exercises : [];

   return exercises.flatMap((exercise) => {
      const totalSets = getExerciseDefaultSets(exercise);
      const defaultReps = getExerciseDefaultReps(exercise);

      return Array.from({ length: totalSets }, (_, index) => ({
         exercise_id: exercise.id,
         exercise_name: exercise.name,
         set_number: index + 1,
         weight_used: 0,
         reps_completed: defaultReps
      }));
   });
}

function renderWorkoutDetails(training) {
   const container = document.getElementById("workoutDetails");
   if (!container) return;

   const exercises = Array.isArray(training.exercises) ? training.exercises : [];

   container.innerHTML = `
      <div class="workout-details">
         <div class="workout-details__header">
            <div class="workout-details__header-top">
               <div class="workout-details__header-info">
                  <h1 class="workout-details__title">${training.name}</h1>

                  <div class="workout-details__meta">
                     <span class="workout-details__meta-item">
                        <span class="workout-details__meta-label">Level:</span>
                        ${training.difficulty_level}
                     </span>

                     <span class="workout-details__meta-item">
                        <span class="workout-details__meta-label">Description:</span>
                        ${training.description || "No description"}
                     </span>
                  </div>
               </div>

               <div class="workout-details__header-actions">
                  <button
                     type="button"
                     class="workout-details__start button button--primary"
                     id="startWorkoutButton"
                  >
                     Start Workout
                  </button>
               </div>
            </div>
         </div>

         <div class="workout-details__list">
            ${exercises.map(createExerciseCard).join("")}
         </div>

         <div class="workout-details__footer">
            <button
               type="button"
               class="workout-details__finish button button--primary"
               id="finishWorkoutButton"
               disabled
            >
               Finish Workout
            </button>
         </div>
      </div>
   `;
}

function createExerciseCard(exercise, index) {
   const totalSets = getExerciseDefaultSets(exercise);
   const rows = Array.from({ length: totalSets }, (_, rowIndex) =>
      createSetRow(exercise, rowIndex + 1)
   ).join("");

   return `
      <article class="exercise-card">
         <div class="exercise-card__header">
            <div class="exercise-card__info">
               <h2 class="exercise-card__title">
                  ${index + 1}. ${exercise.name}
               </h2>

               <p class="exercise-card__target">
                  Target: ${exercise.target_muscle || "—"}
               </p>
            </div>

            <button
               class="exercise-card__info-btn"
               type="button"
               aria-label="Exercise info"
               title="${exercise.target_muscle || ""}"
            >
               i
            </button>
         </div>

         <div class="exercise-card__table">
            <div class="exercise-card__table-head">
               <span>Set</span>
               <span>Kg</span>
               <span>Reps</span>
            </div>

            <div class="exercise-card__table-body">
               ${rows}
            </div>
         </div>
      </article>
   `;
}

function createSetRow(exercise, setNumber) {
   const stateItem = getSetState(exercise.id, setNumber);

   return `
      <div class="exercise-card__row">
         <span class="exercise-card__cell exercise-card__cell--set">
            ${setNumber}
         </span>

         <div class="exercise-card__weight-field">
            <input
               type="number"
               min="0"
               step="0.1"
               inputmode="decimal"
               class="exercise-card__weight-input"
               data-role="weight-input"
               data-exercise-id="${exercise.id}"
               data-set-number="${setNumber}"
               value="${stateItem?.weight_used ?? 0}"
               placeholder="0"
            >
         </div>

         <div class="exercise-card__counter">
            <button
               type="button"
               class="exercise-card__counter-btn"
               data-action="decrease-reps"
               data-exercise-id="${exercise.id}"
               data-set-number="${setNumber}"
            >
               −
            </button>

            <span
               class="exercise-card__counter-value"
               data-role="reps-value"
               data-exercise-id="${exercise.id}"
               data-set-number="${setNumber}"
            >
               ${stateItem?.reps_completed ?? 0}
            </span>

            <button
               type="button"
               class="exercise-card__counter-btn"
               data-action="increase-reps"
               data-exercise-id="${exercise.id}"
               data-set-number="${setNumber}"
            >
               +
            </button>
         </div>
      </div>
   `;
}

function bindWorkoutDetailsEvents() {
   const container = document.getElementById("workoutDetails");
   if (!container || container.dataset.bound === "true") return;

   container.addEventListener("click", handleWorkoutPageClick);
   container.addEventListener("input", handleWorkoutPageInput);
   container.dataset.bound = "true";
}

async function handleWorkoutPageClick(event) {
   const startButton = event.target.closest("#startWorkoutButton");
   const finishButton = event.target.closest("#finishWorkoutButton");
   const actionButton = event.target.closest("[data-action]");

   if (startButton) {
      await handleStartWorkout(startButton);
      return;
   }

   if (finishButton) {
      await handleFinishWorkout(finishButton);
      return;
   }

   if (actionButton) {
      handleCounterAction(actionButton);
   }
}

function handleWorkoutPageInput(event) {
   const weightInput = event.target.closest('[data-role="weight-input"]');
   if (!weightInput) return;

   const exerciseId = Number(weightInput.dataset.exerciseId);
   const setNumber = Number(weightInput.dataset.setNumber);

   const stateItem = getSetState(exerciseId, setNumber);
   if (!stateItem) return;

   const value = parseFloat(weightInput.value);

   if (Number.isNaN(value) || value < 0) {
      stateItem.weight_used = 0;
      return;
   }

   stateItem.weight_used = value;
}

async function handleStartWorkout(button) {
   if (!workoutPageState.training || workoutPageState.isStarted) return;

   try {
      button.disabled = true;
      button.textContent = "Starting...";

      const payload = {
         training_id: workoutPageState.training.id
      };

      if (workoutPageState.scheduledWorkoutId) {
         payload.scheduled_workout_id = workoutPageState.scheduledWorkoutId;
      }

      const response = await startWorkout(payload);
      const sessionId = response?.session_id;

      if (!sessionId) {
         throw new Error("Session id was not returned.");
      }

      workoutPageState.sessionId = sessionId;
      workoutPageState.isStarted = true;

      button.disabled = true;
      button.textContent = "Workout Started";

      const finishButton = document.getElementById("finishWorkoutButton");
      if (finishButton) {
         finishButton.disabled = false;
      }

   } catch (error) {
      console.error("Start workout error:", error);
      button.disabled = false;
      button.textContent = "Start Workout";
      alert(error?.data?.message || error.message || "Failed to start workout.");
   }
}

async function handleFinishWorkout(button) {
   if (!workoutPageState.sessionId) {
      alert("Start the workout first.");
      return;
   }

   if (!Array.isArray(workoutPageState.sets) || !workoutPageState.sets.length) {
      alert("No workout sets found.");
      return;
   }

   try {
      button.disabled = true;
      button.textContent = "Finishing...";

      const payload = {
         sets: workoutPageState.sets.map((item) => ({
            exercise_id: item.exercise_id,
            set_number: item.set_number,
            weight_used: item.weight_used,
            reps_completed: item.reps_completed
         }))
      };

      if (workoutPageState.scheduledWorkoutId) {
         payload.scheduled_workout_id = workoutPageState.scheduledWorkoutId;
      }

      const response = await finishWorkout(workoutPageState.sessionId, payload);

      alert(
         response?.message
            ? `${response.message} Duration: ${Math.round(response.duration_minutes || 0)} min`
            : "Workout finished successfully!"
      );

      window.location.href = "./statistics.html";

   } catch (error) {
      console.error("Finish workout error:", error);
      button.disabled = false;
      button.textContent = "Finish Workout";
      alert(error?.data?.message || "Failed to finish workout.");
   }
}

function handleCounterAction(button) {
   const action = button.dataset.action;
   const exerciseId = Number(button.dataset.exerciseId);
   const setNumber = Number(button.dataset.setNumber);

   const stateItem = getSetState(exerciseId, setNumber);
   if (!stateItem) return;

   if (action === "increase-weight") {
      stateItem.weight_used += 1;
   }

   if (action === "decrease-weight") {
      stateItem.weight_used = Math.max(0, stateItem.weight_used - 1);
   }

   if (action === "increase-reps") {
      stateItem.reps_completed += 1;
   }

   if (action === "decrease-reps") {
      stateItem.reps_completed = Math.max(0, stateItem.reps_completed - 1);
   }

   updateSetRowUI(exerciseId, setNumber);
}

function getSetState(exerciseId, setNumber) {
   return workoutPageState.sets.find(
      (item) =>
         Number(item.exercise_id) === Number(exerciseId) &&
         Number(item.set_number) === Number(setNumber)
   );
}

function updateSetRowUI(exerciseId, setNumber) {
   const stateItem = getSetState(exerciseId, setNumber);
   if (!stateItem) return;

   const weightElement = document.querySelector(
      `[data-role="weight-value"][data-exercise-id="${exerciseId}"][data-set-number="${setNumber}"]`
   );

   const repsElement = document.querySelector(
      `[data-role="reps-value"][data-exercise-id="${exerciseId}"][data-set-number="${setNumber}"]`
   );

   if (weightElement) {
      weightElement.textContent = stateItem.weight_used;
   }

   if (repsElement) {
      repsElement.textContent = stateItem.reps_completed;
   }
}

function renderWorkoutDetailsError(message) {
   const container = document.getElementById("workoutDetails");
   if (!container) return;

   container.innerHTML = `
      <div class="workout-details-page__empty">
         <p class="workout-details-page__empty-text">${message}</p>
      </div>
   `;
}

function getExerciseDefaultSets(exercise) {
   return Number(exercise?.default_sets ?? exercise?.pivot?.default_sets ?? 0);
}

function getExerciseDefaultReps(exercise) {
   return Number(exercise?.default_reps ?? exercise?.pivot?.default_reps ?? 0);
}