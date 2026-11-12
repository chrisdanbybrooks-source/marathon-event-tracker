// -----------------------------------------------------------------------------
// APP NAVIGATION, DIARY AND SHARED EVENT HELPERS
// -----------------------------------------------------------------------------
      function getRouteStorageKey() {
        const event = getCurrentEvent();

        if (!event?.id) {
          return null;
        }

        return `eventRoute_${event.id}`;
      }
      function setActiveNavButton(buttonId) {
        document.querySelectorAll("#navigationBar button").forEach((button) => {
          button.classList.remove("nav-active");
        });

        const activeButton = document.getElementById(buttonId);

        if (activeButton) {
          activeButton.classList.add("nav-active");
        }
      }

      const map = {
        diarySection: "navDiary",
        fitnessSection: "navFitness",
        routeSection: "navRoute",
        analyticsSection: "navAnalytics",
        historySection: "navActivities",
        trainingSection: "navTraining",
        raceSection: "navRace",
        reviewSection: "navReview",
        archiveSection: "navUtilities",
        eventSection: "navEvent",
      };

      document.querySelectorAll("details.collapsible").forEach((section) => {
        section.addEventListener("toggle", function () {
          if (!this.open) {
            return;
          }

          const buttonId = map[this.id];

          if (buttonId) {
            setActiveNavButton(buttonId);
          }
        });
      });
      function getDiaryEntries() {

    return (
        safeJsonParse(
            safeStorageGet(
                "diaryEntries"
            )
        ) || []
    );
}
      function escapeHtml(value = "") {
        return String(value)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }
      function saveDiaryEntries(entries) {
        localStorage.setItem("diaryEntries", JSON.stringify(entries));
      }
      function validateTrainingPhases() {

  clearPhaseErrors();

  const phaseIds = [
    "phase1",
    "phase2",
    "phase3",
    "phase4",
    "phase5",
    "raceWeek"
  ];

  const phases = [
    {
      name: "Base Building",
      start: document.getElementById("phase1Start").value,
      end: document.getElementById("phase1End").value,
    },
    {
      name: "Build",
      start: document.getElementById("phase2Start").value,
      end: document.getElementById("phase2End").value,
    },
    {
      name: "Peak Training",
      start: document.getElementById("phase3Start").value,
      end: document.getElementById("phase3End").value,
    },
    {
      name: "Race Specific",
      start: document.getElementById("phase4Start").value,
      end: document.getElementById("phase4End").value,
    },
    {
      name: "Taper",
      start: document.getElementById("phase5Start").value,
      end: document.getElementById("phase5End").value,
    },
    {
      name: "Race Week",
      start: document.getElementById("raceWeekStart").value,
      end: document.getElementById("raceWeekEnd").value,
    },
  ];

  let hasErrors = false;

  //
  // End before start validation
  //
  for (let index = 0; index < phases.length; index++) {

    const phase = phases[index];

    if (
      phase.start &&
      phase.end &&
      phase.start > phase.end
    ) {

      showPhaseError(
        phaseIds[index],
        "End date cannot be before start date."
      );

      hasErrors = true;
    }
  }

  //
  // Overlap validation
  //
  for (let i = 0; i < phases.length - 1; i++) {

    const current = phases[i];
    const next = phases[i + 1];

    if (!current.end || !next.start) {
      continue;
    }

    const currentEnd = parseLocalDate(current.end);
    const nextStart = parseLocalDate(next.start);

    const expectedNextStart = new Date(currentEnd);
    expectedNextStart.setDate(
      expectedNextStart.getDate() + 1
    );

    if (
    nextStart < expectedNextStart
) {

    showPhaseError(
        phaseIds[i + 1],
        `Starts before ${current.name} finishes.`
    );

    hasErrors = true;

}
else if (
    nextStart.getTime() !==
    expectedNextStart.getTime()
) {

    showPhaseError(
        phaseIds[i + 1],
        `Gap detected after ${current.name}.`
    );

    hasErrors = true;
}
  }

  return !hasErrors;
}
function calculatePhaseDuration(startDate, endDate) {
  if (!startDate || !endDate) {
    return "-";
  }

  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);

  const days =
    Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

  if (days < 1) {
    return "-";
  }

  const weeks = (days / 7).toFixed(1);

  return `${days} days (${weeks} weeks)`;
}
function updatePhaseDurations() {
  document.getElementById("phase1Duration").textContent =
    "Duration: " +
    calculatePhaseDuration(
      document.getElementById("phase1Start").value,
      document.getElementById("phase1End").value,
    );

  document.getElementById("phase2Duration").textContent =
    "Duration: " +
    calculatePhaseDuration(
      document.getElementById("phase2Start").value,
      document.getElementById("phase2End").value,
    );

  document.getElementById("phase3Duration").textContent =
    "Duration: " +
    calculatePhaseDuration(
      document.getElementById("phase3Start").value,
      document.getElementById("phase3End").value,
    );

  document.getElementById("phase4Duration").textContent =
    "Duration: " +
    calculatePhaseDuration(
      document.getElementById("phase4Start").value,
      document.getElementById("phase4End").value,
    );

  document.getElementById("phase5Duration").textContent =
    "Duration: " +
    calculatePhaseDuration(
      document.getElementById("phase5Start").value,
      document.getElementById("phase5End").value,
    );

  document.getElementById("raceWeekDuration").textContent =
    "Duration: " +
    calculatePhaseDuration(
      document.getElementById("raceWeekStart").value,
      document.getElementById("raceWeekEnd").value,
    );
}
// -----------------------------------------------------------------------------
// ROUTE STORAGE, BACKUPS, ARCHIVES AND RESTORE
// -----------------------------------------------------------------------------
      function saveEventRoute(routeData) {
  
        const key = getRouteStorageKey();

        if (!key || !routeData) {
          return;
        }

        try {
          const success = safeStorageSet(key, JSON.stringify(routeData));

          if (!success) {
            alert("Unable to save route.");
          }
        } catch (error) {
          console.error("Route save failed:", error);

          alert("Unable to save route.");
        }
      }
      function navigateToSection(buttonId, sectionId, expand = false) {
        setActiveNavButton(buttonId);

        const section = document.getElementById(sectionId);

        if (expand && section.tagName === "DETAILS") {
          section.open = true;
        }

        section.scrollIntoView({
          behavior: "smooth",
        });
      }
      function safeJsonParse(value) {
        if (!value) {
          return null;
        }

        try {
          return JSON.parse(value);
        } catch (error) {
          console.warn("Invalid JSON in localStorage:", error);

          return null;
        }
      }
      function loadEventRoute() {
        const key = getRouteStorageKey();

        if (!key) {
          return null;
        }

        // Current storage format
        let route = safeJsonParse(safeStorageGet(key));

        if (isValidRoute(route)) {
          return route;
        }

        // Legacy storage format
        const legacyRoute = safeJsonParse(safeStorageGet("eventRoute"));

        if (!isValidRoute(legacyRoute)) {
          return null;
        }

        try {
          const migrated = safeStorageSet(key, JSON.stringify(legacyRoute));

          if (migrated) {
            safeStorageRemove("eventRoute");

            console.log(`Route migrated to ${key}`);
          }
        } catch (error) {
          console.error("Route migration failed:", error);
        }

        return legacyRoute;
      }

      function deleteEventRoute() {
        const key = getRouteStorageKey();

        if (!key) {
          return;
        }

        try {
          safeStorageRemove(key);
        } catch (error) {
          console.error("Route delete failed:", error);
        }
      }
      const activityIcons = {
        "Cross Train": "🚴",
        "Easy Run": "🏃",
        "Long Run": "🏃",
        "PT Gym Session": "💪",
        "RACE DAY": "🏁",
        "Race Pace Run": "⚡",
        "Recovery Run": "🏃",
        Rest: "😴",
        "Tempo Run": "🔥",
        Walk: "🚶",
        "Walk/Recovery": "🚶",
      };
      function jumpToToday() {
        const history = document.getElementById("historySection");
        history.open = true;

        const todayActivity = document.querySelector('[data-today="true"]');

        if (todayActivity) {
          todayActivity.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        } else {
          history.scrollIntoView({
            behavior: "smooth",
          });

          alert("No activity exists for today.");
        }
      }
      function viewArchive(index) {
        const archive = safeJsonParse(
    safeStorageGet("eventArchive")
) || [];

        const item = archive[index];

        document.getElementById("archiveDetail").innerHTML = `

      <div class="card">
      <h3>
      ${escapeHtml(item.event?.eventName || "Unknown Event")}
      </h3>
      <p>
      <strong>Type:</strong>
      ${item.event?.marathonType || "-"}
      </p>
      <p>
      <strong>Date:</strong>
      ${item.event?.eventDate || "-"}
      </p>
      <p>
      <strong>Goal Time:</strong>
      ${item.event?.goalTime || "-"}
      </p>
      <p>
      <strong>Official Time:</strong>
      ${item.raceOutcome?.officialTime || "-"}
      </p>
      <p>
      <strong>Completed:</strong>
      ${escapeHtml(item.raceOutcome?.completed || "-")}
      </p>
      <hr>
      <h4>
      Route
      </h4>
      <p>
      ${escapeHtml(item.route?.gpxUrl || "None")}
      </p>
      <hr>
      <h4>
      Training Summary
      </h4>
      <p>
      Activities:
      ${item.activities?.length || 0}
      </p>
      <hr>
      <h4>
      What Went Well
      </h4>
      <p>
      ${escapeHtml(item.review?.whatWentWell || "")}
      </p>
      <h4>
      What Went Badly
      </h4>
      <p>
      ${escapeHtml(item.review?.whatWentBadly || "")}
      </p>
      <h4>
      Lessons Learned
      </h4>
      <p>
      ${escapeHtml(item.review?.lessonsLearned || "")}
      </p>
      <h4>
      Future Improvements
      </h4>
      <p>
      ${escapeHtml(item.review?.futureImprovements || "")}
      </p>
      </div>
      `;
      }
      function buildBackup() {

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,

    backupType: "CloudSync",

    backupDate: new Date().toISOString(),

    currentEvent:
      safeJsonParse(
        safeStorageGet("currentEvent")
      ),

    activities:
      safeJsonParse(
        safeStorageGet("activities")
      ) || [],

    raceOutcome:
      safeJsonParse(
        safeStorageGet("raceOutcome")
      ) || {},

    postRaceReview:
      safeJsonParse(
        safeStorageGet("postRaceReview")
      ) || {},

    eventArchive:
    safeJsonParse(
        safeStorageGet("eventArchive")
    ) || [],

fitnessMetrics:
    getFitnessMetrics(),

diaryEntries:
    getDiaryEntries(),

eventRoute:
    loadEventRoute()
  };
}
      function buildProgressRow(label, percentage) {
        return `
      <tr>
      <td style="
      width:140px;
      padding:6px 0;
      font-weight:600;
      color:#2563eb;
      ">
      ${label}
      </td>
      <td style="padding:0 12px;">
      <div style="
      width:100%;
      height:12px;
      background:#e5e7eb;
      border-radius:999px;
      overflow:hidden;
      ">
      <div style="
      width:${percentage}%;
      height:100%;
      background:#3b6ee3;
      border-radius:999px;
      transition:width .3s ease;
      "></div>
      </div>
      </td>
      <td style="
      width:60px;
      text-align:right;
      font-weight:600;
      color:#2563eb;
      white-space:nowrap;
      ">
      ${percentage}%
      </td>
      </tr>
      `;
      }
      function getReadinessLevel(score) {
        if (score >= 90) {
          return {
            label: "🟢 Race Ready",
            colour: "#22c55e",
          };
        }

        if (score >= 75) {
          return {
            label: "🟡 On Track",
            colour: "#facc15",
          };
        }

        if (score >= 60) {
          return {
            label: "🟠 Building Fitness",
            colour: "#f97316",
          };
        }

        return {
          label: "🔴 Behind Plan",
          colour: "#ef4444",
        };
      }
      function displayReadinessScore() {
        const readiness = calculateReadinessScore();
        const level = getReadinessLevel(readiness.overallScore);

        document.getElementById("readinessScoreCard").innerHTML = `
      <div style="
      max-width:900px;
      margin:0 auto;
      ">
      <div style="
      display:flex;
      justify-content:center;
      align-items:center;
      gap:12px;
      margin-bottom:24px;
      ">
      <span style="
      font-size:4rem;
      font-weight:700;
      color:${level.colour};
      line-height:1;
      ">
      ${readiness.overallScore}
      </span>
      <span style="
      font-size:1.6rem;
      font-weight:600;
      color:${level.colour};
      ">
      ${level.label}
      </span>
      </div>
      <table style="
      width:100%;
      border-collapse:separate;
      border-spacing:0 12px;
      ">
      ${buildProgressRow("Adherence", readiness.adherence.percentage)}
      ${buildProgressRow("Volume", readiness.volume.percentage)}
      ${buildProgressRow("Long Runs", readiness.longRuns.percentage)}
      ${buildProgressRow("Consistency", readiness.consistency.percentage)}
      </table>
      </div>
      `;
      }
      function createEmptyReadinessState(status) {
        return {
          overallScore: 0,

          status,

          adherence: {
            score: 0,
            maxScore: 30,
            percentage: 0,
          },

          volume: {
            score: 0,
            maxScore: 30,
            targetKm: 0,
            actualKm: 0,
            percentage: 0,
          },

          longRuns: {
            score: 0,
            maxScore: 25,
            planned: 0,
            completed: 0,
            percentage: 0,
          },

          consistency: {
            score: 0,
            maxScore: 15,
            activeWeeks: 0,
            totalWeeks: 0,
            percentage: 0,
          },
        };
      }
      function calculateGoalPace(goalTime, raceDistance = 42.195) {
        if (!goalTime) {
          return null;
        }

        const totalSeconds = timeToSeconds(goalTime);

        if (totalSeconds <= 0 || totalSeconds === Number.MAX_SAFE_INTEGER) {
          return null;
        }

        const KM_PER_MILE = 1.60934;

        const pacePerKm = totalSeconds / raceDistance;

        const pacePerMile = pacePerKm * KM_PER_MILE;

        const formatPace = (seconds) => {
          const mins = Math.floor(seconds / 60);

          const secs = Math.round(seconds % 60);

          return `${mins}:${String(secs).padStart(2, "0")}`;
        };

        const calculateSplit = (distanceKm) =>
          secondsToTime(pacePerKm * distanceKm);

        return {
          goalTime,

          paceKm: formatPace(pacePerKm),

          paceMile: formatPace(pacePerMile),

          split10k: calculateSplit(10),

          halfSplit: calculateSplit(21.0975),

          split30k: calculateSplit(30),

          split20mile: calculateSplit(32.1869),

          finishSplit: calculateSplit(raceDistance),

          split50: calculateSplit(50),

          split75: calculateSplit(75),

          split100: calculateSplit(100),
        };
      }
      function calculateReadinessScore() {
        const activities = getCurrentActivities();
        if (activities.length === 0) {
          return createEmptyReadinessState("No Training Data");
        }
        const runningTypes = [
          "Easy Run",
          "Long Run",
          "Race Pace Run",
          "Recovery Run",
          "Tempo Run",
          "RACE DAY",
        ];

        const pastActivities = activities.filter((activity) => {
          if (!activity.date) {
            return false;
          }

          return parseLocalDate(activity.date) <= new Date();
        });

        //
        // Adherence (30)
        //

        if (pastActivities.length === 0) {
          return createEmptyReadinessState("Training Not Started");
        }
        const done = pastActivities.filter(
          (a) => a.completed === "Done",
        ).length;

        const missed = pastActivities.filter(
          (a) => a.completed === "Missed",
        ).length;

        const adherencePercentage =
          done + missed > 0 ? Math.round((done / (done + missed)) * 100) : 0;

        const adherenceScore = Math.round((adherencePercentage / 100) * 30);

        //
        // Volume (30)
        //

        const runActivities = pastActivities.filter((activity) =>
          runningTypes.includes(activity.type),
        );

        const targetKm = runActivities.reduce(
          (total, activity) =>
            total + (parseFloat(activity.targetDistance) || 0),
          0,
        );

        const actualKm = runActivities.reduce(
          (total, activity) =>
            total + (parseFloat(activity.actualDistance) || 0),
          0,
        );

        const volumePercentage =
          targetKm > 0
            ? Math.min(100, Math.round((actualKm / targetKm) * 100))
            : 0;

        const volumeScore = Math.round((volumePercentage / 100) * 30);

        //
        // Long Runs (25)
        //

        const plannedLongRuns = pastActivities.filter(
          (activity) => activity.type === "Long Run",
        ).length;

        const completedLongRuns = pastActivities.filter(
          (activity) =>
            activity.type === "Long Run" && activity.completed === "Done",
        ).length;

        const longRunPercentage =
          plannedLongRuns > 0
            ? Math.round((completedLongRuns / plannedLongRuns) * 100)
            : 0;

        const longRunScore = Math.round((longRunPercentage / 100) * 25);

        //
        // Consistency (15)
        //

        const activeWeeks = new Set(
          pastActivities
            .filter((activity) => activity.completed === "Done")
            .map((activity) => {
              const date = parseLocalDate(activity.date);

              const week = new Date(date);

              const day = week.getDay();

              const daysFromMonday = day === 0 ? 6 : day - 1;

              week.setDate(week.getDate() - daysFromMonday);

              return week.toISOString().split("T")[0];
            }),
        ).size;

        const totalWeeks = new Set(
          pastActivities.map((activity) => {
            const date = parseLocalDate(activity.date);

            const week = new Date(date);

            const day = week.getDay();

            const daysFromMonday = day === 0 ? 6 : day - 1;

            week.setDate(week.getDate() - daysFromMonday);

            return week.toISOString().split("T")[0];
          }),
        ).size;

        const consistencyPercentage =
          totalWeeks > 0 ? Math.round((activeWeeks / totalWeeks) * 100) : 0;

        const consistencyScore = Math.round((consistencyPercentage / 100) * 15);

        //
        // Overall
        //

        const overallScore =
          adherenceScore + volumeScore + longRunScore + consistencyScore;

        let status = "Behind Plan";

        if (overallScore >= 90) {
          status = "Race Ready";
        } else if (overallScore >= 75) {
          status = "On Track";
        } else if (overallScore >= 60) {
          status = "Building Fitness";
        }

        return {
          overallScore,

          status,

          adherence: {
            score: adherenceScore,
            maxScore: 30,
            percentage: adherencePercentage,
          },

          volume: {
            score: volumeScore,
            maxScore: 30,
            targetKm,
            actualKm,
            percentage: volumePercentage,
          },

          longRuns: {
            score: longRunScore,
            maxScore: 25,
            planned: plannedLongRuns,
            completed: completedLongRuns,
            percentage: longRunPercentage,
          },

          consistency: {
            score: consistencyScore,
            maxScore: 15,
            activeWeeks,
            totalWeeks,
            percentage: consistencyPercentage,
          },
        };
      }
      function collapseAllSections() {

    document.querySelectorAll("details").forEach(section => {
        section.open = false;
    });

    document.querySelectorAll(
        "#navigationBar button"
    ).forEach(button => {
        button.classList.remove(
            "nav-active"
        );
    });

    document.getElementById("top")
        .scrollIntoView({
            behavior: "smooth"
        });
}
      const CURRENT_SCHEMA_VERSION = "4.5";

      function createEmptyBackup() {
        return {
          schemaVersion: CURRENT_SCHEMA_VERSION,
          backupType: "FullApplicationBackup",
          backupDate: new Date().toISOString(),

          currentEvent: null,
          eventRoute: null,

          activities: [],

          raceOutcome: {},

          postRaceReview: {},

          eventArchive: [],
          fitnessMetrics: {
            schemaVersion: "1.0",
            imports: [],
            observations: []
            },
          diaryEntries: [],
          settings: {
            createdBy: "Marathon Event Manager",
            applicationVersion: CURRENT_SCHEMA_VERSION,
          },
        };
      }
      function archiveCurrentEvent() {
        const event = JSON.parse(localStorage.getItem("currentEvent"));

        if (!event) {
          alert("Save Event Details first.");
          return;
        }

        let archive = JSON.parse(localStorage.getItem("eventArchive")) || [];

        // Duplicate archive protection
        const alreadyArchived = archive.some(
          (item) => item.event?.id === event.id,
        );

        if (alreadyArchived) {
          const confirmed = confirm(
            "This event has already been archived.\n\nCreate another archive snapshot?",
          );

          if (!confirmed) {
            return;
          }
        }

        const archiveItem = {
          archiveDate: new Date().toISOString(),

          event,

          route: loadEventRoute(),

          activities: (
            JSON.parse(localStorage.getItem("activities")) || []
          ).filter((activity) => activity.eventId === event.id),

          raceOutcome: JSON.parse(localStorage.getItem("raceOutcome")) || {},

          review: JSON.parse(localStorage.getItem("postRaceReview")) || {},
        };

        archive.push(archiveItem);

        localStorage.setItem("eventArchive", JSON.stringify(archive));

        document.getElementById("archiveDetail").innerHTML = "";

        alert("Event archived successfully.");
      }
      function migrateBackup(data) {
        if (!data || typeof data !== "object") {
          throw new Error("Invalid backup data");
        }

        const version = data.schemaVersion || "legacy";

        switch (version) {
          case "legacy":
            return migrateLegacyBackup(data);

          case "3.3":
          case "3.4":
          case "4.2":
          case "4.3":
          case "4.4":
          case "4.5":
          case "4.6":
          case "4.7":
          case "4.8":
          case "4.9":
          case "5.0":  
            return validateAndNormalise34(data);

          default:
            throw new Error(`Unsupported backup version: ${version}`);
        }
      }
      function deleteAllEventRoutes() {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith("eventRoute_")) {
        localStorage.removeItem(key);
      }
    });

    // Legacy route storage
    localStorage.removeItem("eventRoute");
  } catch (error) {
    console.error("Route cleanup failed:", error);
  }
}
      function migrateLegacyBackup(legacy) {
        const backup = createEmptyBackup();

        backup.backupType = "LegacyImportedEvent";

        backup.eventArchive = [
          {
            archiveDate: legacy.archiveDate || new Date().toISOString(),

            event: legacy.event || {},

            route: legacy.route || {},

            activities: legacy.activities || [],

            raceOutcome: legacy.raceOutcome || {},

            review: legacy.review || {},
          },
        ];

        return backup;
      }
      function validateAndNormalise34(data) {
        const backup = structuredClone(data);

        backup.currentEvent ??= null;
        backup.eventRoute ??= null;

        backup.activities ??= [];

        backup.raceOutcome ??= {};

        backup.postRaceReview ??= {};

        backup.eventArchive ??= [];
        backup.fitnessMetrics ??= {
    schemaVersion: "1.0",
    imports: [],
    observations: []
};
        backup.diaryEntries ??= [];

        backup.settings ??= {
          createdBy: "Marathon Event Manager",
          applicationVersion: CURRENT_SCHEMA_VERSION,
        };

        if (!Array.isArray(backup.activities)) {
          throw new Error("activities must be an array");
        }

        if (!Array.isArray(backup.eventArchive)) {
          throw new Error("eventArchive must be an array");
        }

        return backup;
      }
      function restoreBackup(rawBackup) {
        const backup = migrateBackup(rawBackup);

        localStorage.setItem(
          "currentEvent",
          JSON.stringify(backup.currentEvent),
        );

        localStorage.setItem("activities", JSON.stringify(backup.activities));

        localStorage.setItem("raceOutcome", JSON.stringify(backup.raceOutcome));

        localStorage.setItem(
          "postRaceReview",
          JSON.stringify(backup.postRaceReview),
        );
        localStorage.setItem(
    "diaryEntries",
    JSON.stringify(
        backup.diaryEntries || []
    )
);

        localStorage.setItem(
          "eventArchive",
          JSON.stringify(backup.eventArchive),
        );
        localStorage.setItem(
    "fitnessMetrics",
    JSON.stringify(
        backup.fitnessMetrics
    )
);

        // Remove all existing route storage and UI
clearRouteUI();
deleteAllEventRoutes();

        // Restore route if backup contains one
        if (backup.eventRoute) {
  saveEventRoute(backup.eventRoute);
  displayRoute();
}

        return backup;
      }
// -----------------------------------------------------------------------------
// ACTIVITY IMPORT, ROUTE HELPERS AND HISTORY VIEWS
// -----------------------------------------------------------------------------
       function importActivities() {
        const file = document.getElementById("activityImport").files[0];

        if (!file) {
          return;
        }

        const reader = new FileReader();

        reader.onload = function (e) {
          try {
            const csv = e.target.result.replace(/^\uFEFF/, "");

            const rows = parseCsv(csv);

            if (rows.length < 2) {
              alert("No activity data found.");

              return;
            }

            const headers = rows[0].map((h) => h.trim());

            const currentEvent = JSON.parse(
              localStorage.getItem("currentEvent"),
            );

            if (!currentEvent) {
              alert(
                "Please create and save an event before importing activities.",
              );

              return;
            }

            const importedActivities = rows
              .slice(1)
              .filter((row) => row.some((value) => value.trim()))
              .map((values) => {
                const activity = {};

                headers.forEach((header, index) => {
                  activity[header] = values[index] || "";
                });

                return {
                  id: crypto.randomUUID(),

                  eventId: currentEvent.id,

                  date: activity.date?.trim(),

                  type: activity.type?.trim(),

                  targetDistance: activity.targetDistance?.trim(),

                  completed: activity.completed?.trim(),

                  actualDistance: activity.actualDistance?.trim(),

                  comments: activity.comments?.trim(),

                  detail: activity.detail?.trim(),
                };
              });

            const existingActivities =
              JSON.parse(localStorage.getItem("activities")) || [];

            const newActivities = importedActivities.filter(
              (activity) => !isDuplicateActivity(existingActivities, activity),
            );

            const duplicateCount =
              importedActivities.length - newActivities.length;

            const allActivities = sortActivities([
              ...existingActivities,
              ...newActivities,
            ]);

            localStorage.setItem("activities", JSON.stringify(allActivities));

            displayActivities();
            displayWeeklyDashboard();
            displayAnalytics();
            displayCurrentEvent();

            document.getElementById("historySection").open = true;

            setTimeout(() => {
              const todayCard = document.querySelector('[data-today="true"]');

              if (todayCard) {
                todayCard.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }
            }, 100);

            alert(
              `${newActivities.length} activities imported successfully.\n` +
                `${duplicateCount} duplicates skipped.`,
            );
          } catch (error) {
            console.error("Import Error:", error);

            alert("Import failed. Please check the CSV format.");
          }
        };

        reader.readAsText(file);
      }
      function interpolatePoint(start, end, ratio) {
        return L.latLng(
          start.lat + (end.lat - start.lat) * ratio,
          start.lng + (end.lng - start.lng) * ratio,
        );
      }
      function addRouteMarker(map, point, label, colour, popupText) {
        const isStart = label.includes("START");
        const isFinish = label.includes("FINISH");
        const horizontalPadding = isStart || isFinish ? 36 : 28;
        const estimatedWidth = label.length * 9 + horizontalPadding;
        const markerWidth = Math.max(80, estimatedWidth);
        const markerHeight = isStart || isFinish ? 50 : 42;
        const marker = L.marker(point, {
          icon: L.divIcon({
            className: "distance-marker",
            iconSize: [markerWidth, markerHeight],
            iconAnchor: [markerWidth / 2, markerHeight],
            html: `
      <div style="
      display:flex;
      flex-direction:column;
      align-items:center;
      ">
      <div style="
      background:${colour};
      color:white;
      padding:${isStart || isFinish ? "8px 18px" : "6px 14px"};
      border-radius:999px;
      font-size:${isStart || isFinish ? "15px" : "14px"};
      font-weight:700;
      border:2px solid white;
      white-space:nowrap;
      position:relative;
      box-shadow:${
        isStart
          ? "0 0 0 3px rgba(5,150,105,.20), 0 4px 12px rgba(0,0,0,.25)"
          : isFinish
            ? "0 0 0 3px rgba(202,138,4,.20), 0 4px 12px rgba(0,0,0,.25)"
            : "0 2px 6px rgba(0,0,0,.25)"
      };
      ">
      ${label}
      <div style="
      position:absolute;
      left:50%;
      bottom:-10px;
      transform:translateX(-50%);
      width:0;
      height:0;
      border-left:8px solid transparent;
      border-right:8px solid transparent;
      border-top:10px solid ${colour};
      ">
      </div>
      </div>
      </div>
      `,
          }),
        }).addTo(map);
        if (popupText) {
          marker.bindPopup(popupText);
        }
        return marker;
      }
      function sortActivities(activities) {
        const activityOrder = {
          "Easy Run": 1,
          "Recovery Run": 2,
          "Tempo Run": 3,
          "Race Pace Run": 4,
          "Long Run": 5,
          "Cross Train": 6,
          "PT Gym Session": 7,
          Walk: 8,
          "Walk/Recovery": 9,
          Rest: 10,
          "RACE DAY": 11,
        };

        return activities.sort((a, b) => {
          const dateCompare = a.date.localeCompare(b.date);

          if (dateCompare !== 0) {
            return dateCompare;
          }

          return (
            (activityOrder[a.type] || 999) - (activityOrder[b.type] || 999)
          );
        });
      }
      function timeToSeconds(timeString) {
        if (!timeString) {
          return Number.MAX_SAFE_INTEGER;
        }

        const parts = timeString.trim().split(":").map(Number);

        // Support HH:MM from <input type="time">
        if (parts.length === 2) {
          parts.push(0);
        }

        if (parts.length !== 3 || parts.some(isNaN)) {
          return Number.MAX_SAFE_INTEGER;
        }

        const [hours, minutes, seconds] = parts;

        if (
          hours < 0 ||
          hours > 48 ||
          minutes < 0 ||
          minutes > 59 ||
          seconds < 0 ||
          seconds > 59
        ) {
          return Number.MAX_SAFE_INTEGER;
        }

        return hours * 3600 + minutes * 60 + seconds;
      }
      function secondsToTime(seconds) {
        const hours = Math.floor(seconds / 3600);

        const minutes = Math.floor((seconds % 3600) / 60);

        const secs = Math.round(seconds % 60);

        return (
          String(hours).padStart(2, "0") +
          ":" +
          String(minutes).padStart(2, "0") +
          ":" +
          String(secs).padStart(2, "0")
        );
      }
      function getPersonalBest(raceDistance) {
        const archive =
    safeJsonParse(
        safeStorageGet(
            "eventArchive"
        )
    ) || [];

        const completedEvents = archive.filter(
          (item) =>
            item.raceOutcome?.completed === "Yes" &&
            item.raceOutcome?.officialTime &&
            Number(item.event?.raceDistance) === Number(raceDistance),
        );

        if (completedEvents.length === 0) {
          return null;
        }

        let bestEvent = null;
        let bestSeconds = Number.MAX_SAFE_INTEGER;

        completedEvents.forEach((item) => {
          const seconds = timeToSeconds(item.raceOutcome.officialTime);

          if (seconds < bestSeconds) {
            bestSeconds = seconds;
            bestEvent = item;
          }
        });

        return bestEvent;
      }
      function buildReadinessBar(label, percentage) {
        const colour =
          percentage >= 90
            ? "#22c55e"
            : percentage >= 75
              ? "#2563eb"
              : percentage >= 60
                ? "#facc15"
                : "#f97316";

        return `
      <div style="
      margin-bottom:10px;
      ">
      <div style="
      display:flex;
      justify-content:space-between;
      align-items:center;
      margin-bottom:3px;
      font-size:0.85rem;
      font-weight:600;
      color:#334155;
      ">
      <span>${label}</span>
      <span>${percentage}%</span>
      </div>
      <div style="
      width:100%;
      height:8px;
      background:#e5e7eb;
      border-radius:999px;
      overflow:hidden;
      ">
      <div style="
      width:${percentage}%;
      height:100%;
      background:${colour};
      border-radius:999px;
      ">
      </div>
      </div>
      </div>
      `;
      }
      function displayArchive() {
        const archiveList =
        document.getElementById(
            "archiveList"
        );

    if (!archiveList) {
        return;
    }
        const currentEvent = JSON.parse(localStorage.getItem("currentEvent"));

        const archive = JSON.parse(localStorage.getItem("eventArchive")) || [];
        const completedEvents = archive.filter(
          (item) =>
            item.raceOutcome?.completed === "Yes" &&
            item.raceOutcome?.officialTime,
        );

        let personalBestTime = Number.MAX_SAFE_INTEGER;

        completedEvents.forEach((item) => {
          const seconds = timeToSeconds(item.raceOutcome.officialTime);

          if (seconds < personalBestTime) {
            personalBestTime = seconds;
          }
        });
        let html = "";

        archive.forEach((item, index) => {
          const completed = item.raceOutcome?.completed;

          let resultStatus = "⚪ Unknown";
          let resultColor = "#666";
          if (completed === "Yes") {
            resultStatus = "✅ Finished";
            resultColor = "green";
          } else if (completed === "No") {
            resultStatus = "❌ DNF";
            resultColor = "red";
          }
          const archiveRunningTypes = [
            "Easy Run",
            "Long Run",
            "Race Pace Run",
            "Recovery Run",
            "Tempo Run",
            "RACE DAY",
          ];

          const runCount = (item.activities || []).filter((a) =>
            archiveRunningTypes.includes(a.type),
          ).length;

          const crossTrainCount = (item.activities || []).filter(
            (a) => a.type === "Cross Train",
          ).length;

          const ptGymCount = (item.activities || []).filter(
            (a) => a.type === "PT Gym Session",
          ).length;
          const isPersonalBest =
            item.raceOutcome?.completed === "Yes" &&
            timeToSeconds(item.raceOutcome?.officialTime) === personalBestTime;
          const isActive = currentEvent && item.event?.id === currentEvent.id;
          html += `
      <div
      class="card"
      style="
      margin-bottom:15px;
      text-align:left;
      ${
        isPersonalBest
          ? `
      border:3px solid gold;
      background:#fffef8;
      box-shadow:
      0 0 12px rgba(255,215,0,0.35);
      `
          : ""
      }
      "
      >
      <h3>
      ${escapeHtml(item.event?.eventName || "Unknown Event")}
      </h3>
      ${
        isPersonalBest
          ? `
      <div
      style="
          flex:1;
          background:linear-gradient(
              135deg,
              #fffdf7,
              #ffffff
          );
      ">
      🏅 PERSONAL BEST
      </div>
      `
          : ""
      }
      <p>
      <strong>Type:</strong>
      ${escapeHtml(item.event?.marathonType || "-")}
      </p>
      <p>
      <strong>Date:</strong>
      ${item.event?.eventDate || "-"}
      </p>
      <p>
      <strong>Goal Time:</strong>
      ${escapeHtml(item.event?.goalTime || "-")}
      </p>
      <p>
      <strong>Official Time:</strong>
      ${escapeHtml(item.raceOutcome?.officialTime || "-")}
      </p>
      <p>
      <strong>Status:</strong>
      <span style="color:${resultColor};">
      ${resultStatus}
      </span>
      </p>
      <div
      class="dashboard"
      style="margin-top:10px;"
      >
      <div class="card">
      <div
      class="card-value"
      style="color:${resultColor};"
      >
      ${resultStatus}
      </div>
      <div class="card-label">
      Result
      </div>
      </div>
      <div class="card">
      <div class="card-value">
      ${runCount}
      </div>
      <div class="card-label">
      Runs
      </div>
      </div>
      <div class="card">
      <div class="card-value">
      ${crossTrainCount}
      </div>
      <div class="card-label">
      Cross Train
      </div>
      </div>
      <div class="card">
      <div class="card-value">
      ${ptGymCount}
      </div>
      <div class="card-label">
      PT Gym
      </div>
      </div>
      </div>
      <button
      onclick="viewArchive(${index})"
      >
      View Event
      </button>
      <button
      onclick="exportArchive(${index})"
      >
      Export Event
      </button>
      ${
        isActive
          ? `
      <button disabled>
      Active Event
      </button>
      `
          : `
      <button
      onclick="deleteArchive(${index})"
      style="
      background:#d83b01;
      margin-top:5px;
      "
      >
      Delete Event
      </button>
      `
      }
      </div>
      `;
        });
      archiveList.innerHTML = html;  
      }
      function displayReview() {
        const review =
    safeJsonParse(
        safeStorageGet(
            "postRaceReview"
        )
    );

        if (!review) {
          return;
        }

        document.getElementById("whatWentWell").value =
          review.whatWentWell || "";

        document.getElementById("whatWentBadly").value =
          review.whatWentBadly || "";

        document.getElementById("lessonsLearned").value =
          review.lessonsLearned || "";

        document.getElementById("futureImprovements").value =
          review.futureImprovements || "";

        document.getElementById("reviewSummary").innerHTML = `
      <div class="card">
      <div class="card-label">
      Post-race review completed
      </div>
      </div>
      `;
      }
      function clearActivities() {
        const confirmed = confirm("Delete all activities?");

        if (!confirmed) {
          return;
        }

        localStorage.removeItem("activities");

        displayActivities();
        displayWeeklyDashboard();
        displayAnalytics();
        displayCurrentEvent();
      }
      function saveReview() {
        const review = {
          whatWentWell: document.getElementById("whatWentWell").value,

          whatWentBadly: document.getElementById("whatWentBadly").value,

          lessonsLearned: document.getElementById("lessonsLearned").value,

          futureImprovements:
            document.getElementById("futureImprovements").value,
        };

        localStorage.setItem("postRaceReview", JSON.stringify(review));

        displayReview();

        alert("Review saved.");
      }
      function deleteActivity(id) {
        if (!confirm("Delete this activity?")) {
          return;
        }

        let activities = JSON.parse(localStorage.getItem("activities")) || [];

        activities = activities.filter((a) => a.id !== id);

        localStorage.setItem("activities", JSON.stringify(activities));

        displayActivities();
        displayWeeklyDashboard();
        displayAnalytics();
        displayCurrentEvent();
      }
      function saveRaceOutcome() {
        const raceOutcome = {
          completed: document.getElementById("raceCompleted").value,

          officialTime: document.getElementById("officialTime").value,

          position: document.getElementById("position").value,

          fieldSize: document.getElementById("fieldSize").value,

          raceNotes: document.getElementById("raceNotes").value,
        };

        localStorage.setItem("raceOutcome", JSON.stringify(raceOutcome));

        displayRaceOutcome();

        alert("Race outcome saved.");
      }
      function displayRaceOutcome() {
        const raceOutcome =
    safeJsonParse(
        safeStorageGet(
            "raceOutcome"
        )
    );

        if (!raceOutcome) {
          return;
        }

        document.getElementById("raceCompleted").value =
          raceOutcome.completed || "Planned";

        document.getElementById("officialTime").value =
          raceOutcome.officialTime || "";

        document.getElementById("position").value = raceOutcome.position || "";

        document.getElementById("fieldSize").value =
          raceOutcome.fieldSize || "";

        document.getElementById("raceNotes").value =
          raceOutcome.raceNotes || "";

        document.getElementById("raceSummary").innerHTML = `
      <div class="card">
      <div class="card-value">
      ${escapeHtml(raceOutcome.officialTime || "-")}
      </div>
      <div class="card-label">
      Official Time
      </div>

      Completed:
      ${escapeHtml(raceOutcome.completed || "-")}
      </div>
      `;
      }
      function isValidRoute(route) {
        return (
          route &&
          Array.isArray(route.points) &&
          route.points.length >= 2 &&
          route.points.every(
            (point) =>
              point &&
              typeof point.lat === "number" &&
              typeof point.lng === "number" &&
              Number.isFinite(point.lat) &&
              Number.isFinite(point.lng) &&
              point.lat >= -90 &&
              point.lat <= 90 &&
              point.lng >= -180 &&
              point.lng <= 180,
          )
        );
      }
      function safeStorageGet(key) {
        try {
          return localStorage.getItem(key);
        } catch (error) {
          console.error(`Failed to read ${key}:`, error);

          return null;
        }
      }

      function safeStorageSet(key, value) {
        try {
          localStorage.setItem(key, value);

          return true;
        } catch (error) {
          console.error(`Failed to save ${key}:`, error);

          return false;
        }
      }

      function safeStorageRemove(key) {
        try {
          localStorage.removeItem(key);

          return true;
        } catch (error) {
          console.error(`Failed to delete ${key}:`, error);

          return false;
        }
      }
// -----------------------------------------------------------------------------
// WEEKLY DASHBOARD AND TRAINING PHASE CALCULATIONS
// -----------------------------------------------------------------------------
      function displayWeeklyDashboard() {
        const currentEvent = JSON.parse(localStorage.getItem("currentEvent"));

        const activities = (
          JSON.parse(localStorage.getItem("activities")) || []
        ).filter((activity) => activity.eventId === currentEvent?.id);

        const runningTypes = [
          "Easy Run",
          "Long Run",
          "Race Pace Run",
          "Recovery Run",
          "Tempo Run",
          "RACE DAY",
        ];

        const now = new Date();

        const endDate = new Date(now);

        endDate.setDate(endDate.getDate() - 1);

        endDate.setHours(23, 59, 59, 999);

        const startDate = new Date(endDate);
        // Inclusive date range:
        // yesterday plus previous 9 days = 10 days total
        startDate.setDate(endDate.getDate() - 9);

        startDate.setHours(0, 0, 0, 0);

        const periodStartLabel = startDate.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        const periodEndLabel = endDate.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        const recentActivities = activities.filter((activity) => {
          const activityDate = parseLocalDate(activity.date);

          return activityDate >= startDate && activityDate <= endDate;
        });

        const runs = recentActivities.filter((a) =>
          runningTypes.includes(a.type),
        );

        const targetKm = runs.reduce(
          (total, run) => total + (parseFloat(run.targetDistance) || 0),
          0,
        );

        const actualKm = runs.reduce(
          (total, run) => total + (parseFloat(run.actualDistance) || 0),
          0,
        );

        const runDone = recentActivities.filter(
          (a) => runningTypes.includes(a.type) && a.completed === "Done",
        ).length;

        const runMissed = recentActivities.filter(
          (a) => runningTypes.includes(a.type) && a.completed === "Missed",
        ).length;

        const crossDone = recentActivities.filter(
          (a) => a.type === "Cross Train" && a.completed === "Done",
        ).length;

        const crossMissed = recentActivities.filter(
          (a) => a.type === "Cross Train" && a.completed === "Missed",
        ).length;

        const gymDone = recentActivities.filter(
          (a) => a.type === "PT Gym Session" && a.completed === "Done",
        ).length;

        const gymMissed = recentActivities.filter(
          (a) => a.type === "PT Gym Session" && a.completed === "Missed",
        ).length;

        const walkDone = recentActivities.filter(
          (a) =>
            (a.type === "Walk" || a.type === "Walk/Recovery") &&
            a.completed === "Done",
        ).length;

        const walkMissed = recentActivities.filter(
          (a) =>
            (a.type === "Walk" || a.type === "Walk/Recovery") &&
            a.completed === "Missed",
        ).length;

        document.getElementById("weeklyDashboard").innerHTML = `
      <div
      style="
      font-weight:600;
      margin-bottom:15px;
      color:#475569;
      "
      >
      ${periodStartLabel} to ${periodEndLabel}
      </div>
      <table
      style="
      width:100%;
      border-collapse:collapse;
      background:white;
      "
      >
      <thead>
      <tr>
      <th style="padding:8px;text-align:left;">
      Activity
      </th>
      <th style="padding:8px;text-align:center;">
      ✅ Done
      </th>
      <th style="padding:8px;text-align:center;">
      ❌ Missed
      </th>
      <th style="padding:8px;text-align:center;">
      🎯 Target km
      </th>
      <th style="padding:8px;text-align:center;">
      📏 Actual km
      </th>
      </tr>
      </thead>
      <tbody>
      <tr
      style="
      font-weight:bold;
      background:#f8fafc;
      "
      >
      <td style="padding:8px;">
      🏃 Running
      </td>
      <td style="text-align:center;">
      ${runDone}
      </td>
      <td style="text-align:center;">
      ${runMissed}
      </td>
      <td style="text-align:center;">
      ${targetKm.toFixed(1)}
      </td>
      <td style="text-align:center;">
      ${actualKm.toFixed(1)}
      </td>
      </tr>
      <tr>
      <td style="padding:8px;">
      🚴 Cross Train
      </td>
      <td style="text-align:center;">
      ${crossDone}
      </td>
      <td style="text-align:center;">
      ${crossMissed}
      </td>
      <td style="text-align:center;">
      -
      </td>
      <td style="text-align:center;">
      -
      </td>
      </tr>
      <tr>
      <td style="padding:8px;">
      💪 PT Gym
      </td>
      <td style="text-align:center;">
      ${gymDone}
      </td>
      <td style="text-align:center;">
      ${gymMissed}
      </td>
      <td style="text-align:center;">
      -
      </td>
      <td style="text-align:center;">
      -
      </td>
      </tr>
      <tr>
      <td style="padding:8px;">
      🚶 Walk
      </td>
      <td style="text-align:center;">
      ${walkDone}
      </td>
      <td style="text-align:center;">
      ${walkMissed}
      </td>
      <td style="text-align:center;">
      -
      </td>
      <td style="text-align:center;">
      -
      </td>
      </tr>
      </tbody>
      </table>
      `;
      }
      function renderCachedRoute(routeData) {
        if (!isValidRoute(routeData)) {
          console.warn("Invalid cached route data");
          return;
        }
        let distanceKm = routeData.distanceKm;

        if (distanceKm === undefined || distanceKm === null) {
          let totalDistance = 0;

          for (let i = 1; i < routeData.points.length; i++) {
            const start = routeData.points[i - 1];

            const end = routeData.points[i];

            totalDistance += L.latLng(start.lat, start.lng).distanceTo(
              L.latLng(end.lat, end.lng),
            );
          }

          distanceKm = Number((totalDistance / 1000).toFixed(1));
        }

        const pointCount = routeData.pointCount ?? routeData.points.length;

        let checkpointCount = routeData.checkpointCount;

        if (checkpointCount === undefined || checkpointCount === null) {
          const currentEvent = getCurrentEvent();

          const checkpointInterval =
            currentEvent?.marathonType === "Ultra Marathon" ? 10 : 5;

          checkpointCount = Math.floor(distanceKm / checkpointInterval);
        }
        document.getElementById("routePreview").innerHTML = `
      <div
      class="dashboard"
      style="margin-bottom:15px;"
      >

          <div class="card">
              <div class="card-value">
                  ${distanceKm}
              </div>
              <div class="card-label">
                  Distance (km)
              </div>
          </div>

          <div class="card">
              <div class="card-value">
                  ${pointCount}
              </div>
              <div class="card-label">
                  Route Points
              </div>
          </div>

          <div class="card">
              <div class="card-value">
                  ${checkpointCount}
              </div>
              <div class="card-label">
                  Checkpoints
              </div>
          </div>

      </div>
                  <div
      id="routeMap"
      style="
      height:400px;
      border:1px solid #ddd;
      border-radius:8px;
      overflow:hidden;
      "
      ></div>
      <div
      id="routeLegend"
      style="
      margin-top:8px;
      padding:10px;
      border-top:1px solid #e5e7eb;
      "
      ></div>
      `;

        const map = L.map("routeMap");

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);

        const points = routeData.points.map((p) => L.latLng(p.lat, p.lng));

        const routeLine = L.polyline(points, {
          color: "#0000ff",
          weight: 4,
        }).addTo(map);

        map.fitBounds(routeLine.getBounds());

        document.getElementById("routeLegend").innerHTML = `
      <div style="
      display:flex;
      flex-wrap:wrap;
      justify-content:center;
      gap:12px 20px;
      font-size:13px;
      font-weight:600;
      ">
      <span>🟢 START</span>
      <span>🔵 Distance checkpoint</span>
      <span>🟩 Major checkpoint</span>
      <span>🟡 FINISH</span>
      </div>
      `;

        addRouteMarker(map, points[0], "🚩 START", "#059669", "Start of route");

        const currentEvent = JSON.parse(localStorage.getItem("currentEvent"));

        const checkpointInterval =
          currentEvent?.marathonType === "Ultra Marathon" ? 10 : 5;

        let accumulated = 0;
        let nextCheckpoint = checkpointInterval * 1000;

        for (let i = 1; i < points.length; i++) {
          const segmentDistance = points[i - 1].distanceTo(points[i]);

          while (accumulated + segmentDistance >= nextCheckpoint) {
            const ratio = (nextCheckpoint - accumulated) / segmentDistance;

            const checkpointPoint = interpolatePoint(
              points[i - 1],
              points[i],
              ratio,
            );

            const checkpointKm = nextCheckpoint / 1000;

            let colour = "#2563eb";

            if (checkpointKm % 20 === 0) {
              colour = "#16a34a";
            }

            addRouteMarker(
              map,
              checkpointPoint,
              `${checkpointKm} km`,
              colour,
              `${checkpointKm} km checkpoint`,
            );

            nextCheckpoint += checkpointInterval * 1000;
          }

          accumulated += segmentDistance;
        }

        addRouteMarker(
          map,
          points[points.length - 1],
          "🏁 FINISH",
          "#ca8a04",
          "Finish of route",
        );

        setTimeout(() => map.invalidateSize(), 200);
      }
function getCurrentTrainingPhase(trainingPhases) {
  if (!trainingPhases?.length) {
    return null;
  }

  const today = getLocalDateString();

  let phase = trainingPhases.find(
    p => today >= p.start && today <= p.end
  );

  if (phase) {
    return phase;
  }

  // Before training starts
  if (today < trainingPhases[0].start) {
    return trainingPhases[0];
  }

  // After race week ends
  const lastPhase = trainingPhases[trainingPhases.length - 1];

  if (today > lastPhase.end) {
    return lastPhase;
  }

  // Gap between phases
  return (
    trainingPhases.find(p => p.start > today) ||
    trainingPhases[0]
  );
}
      function buildPhaseProgressTable(event, activities) {
        const currentPhase =
  getCurrentTrainingPhase(event.trainingPhases);
  if (!event?.trainingPhases?.length) {
    return "<p>No training phases found.</p>";
  }
  

const today = getLocalDateString();
  const activityTypes = [
    "Easy Run",
    "Recovery Run",
    "Tempo Run",
    "Race Pace Run",
    "Long Run",
    "Cross Train",
    "PT Gym Session",
    "Walk",
    "Walk/Recovery",
    "Rest",
    "RACE DAY"
  ];

  const runningTypes = [
    "Easy Run",
    "Recovery Run",
    "Tempo Run",
    "Race Pace Run",
    "Long Run",
    "RACE DAY"
  ];

  let html = "";

  event.trainingPhases.forEach((phase) => {
    const isCurrent =
  today >= phase.start &&
  today <= phase.end;

const isPast =
  phase.end < today;

const isFuture =
  phase.start > today;
  const phaseEndDate = parseLocalDate(phase.end);
  let phaseBadge = "";

if (isCurrent) {
  phaseBadge = `
    <span style="
      background:#dcfce7;
      color:#166534;
      padding:4px 10px;
      border-radius:999px;
      font-size:0.75rem;
      font-weight:700;
    ">
      CURRENT
    </span>
  `;
} else if (isPast) {
  phaseBadge = `
    <span style="
      background:#f1f5f9;
      color:#475569;
      padding:4px 10px;
      border-radius:999px;
      font-size:0.75rem;
      font-weight:700;
    ">
      COMPLETE
    </span>
  `;
} else {
  phaseBadge = `
    <span style="
      background:#eff6ff;
      color:#2563eb;
      padding:4px 10px;
      border-radius:999px;
      font-size:0.75rem;
      font-weight:700;
    ">
      UPCOMING
    </span>
  `;
}
  const phaseActivities = activities.filter(
      (activity) =>
        activity.date >= phase.start &&
        activity.date <= phase.end
    );

    const totalActivities = phaseActivities.length;

    html += `
<details
  ${phase.name === currentPhase?.name ? "open" : ""}
  style="
    margin-bottom:15px;
    border:1px solid #e5e7eb;
    border-radius:14px;
    overflow:hidden;
    background:white;
  "
>

<summary
  style="
    cursor:pointer;
    padding:16px 20px;
    font-weight:700;
    background:#f8fafc;
    display:flex;
    justify-content:space-between;
    align-items:center;
  "
>
  <span style="
  display:flex;
  align-items:center;
  gap:10px;
">
  ${phase.name}
  ${phaseBadge}
</span>

  <span style="
    color:#2563eb;
    font-size:0.9rem;
    display:flex;
    flex-direction:column;
    align-items:flex-end;
    gap:3px;
  ">
    ${totalActivities} activities
    ${isCurrent ? `<span style="color:#64748b;font-size:0.75rem;font-weight:600;">Ends ${formatTimelineDate(phase.end)}</span>` : ""}
  </span>
</summary>

<div style="padding:16px;">
<div style="overflow-x:auto;">
<table style="
  width:100%;
  border-collapse:collapse;
  font-size:0.9rem;
">
<thead>
            <tr style="
              background:#f8fafc;
              border-bottom:2px solid #e5e7eb;
            ">
              <th style="padding:8px;text-align:left;">Activity Type</th>
              <th style="padding:8px;text-align:center;">Planned</th>
              <th style="padding:8px;text-align:center;">Done</th>
              <th style="padding:8px;text-align:center;">Missed</th>
              <th style="padding:8px;text-align:center;">Target km</th>
              <th style="padding:8px;text-align:center;">Actual km</th>
              <th style="padding:8px;text-align:center;">Adherence</th>
            </tr>
          </thead>
          <tbody>
    `;

    let totalPlanned = 0;
    let totalDone = 0;
    let totalMissed = 0;
    let totalTarget = 0;
    let totalActual = 0;

    activityTypes.forEach((type) => {
      const rows = phaseActivities.filter(
        (activity) => activity.type === type
      );

      if (!rows.length) {
        return;
      }

      const planned = rows.filter(
        (activity) => activity.completed === "Planned"
      ).length;

      const done = rows.filter(
        (activity) => activity.completed === "Done"
      ).length;

      const missed = rows.filter(
        (activity) => activity.completed === "Missed"
      ).length;

      const targetKm = runningTypes.includes(type)
        ? rows.reduce(
            (total, activity) =>
              total + (parseFloat(activity.targetDistance) || 0),
            0
          )
        : 0;

      const actualKm = runningTypes.includes(type)
        ? rows.reduce(
            (total, activity) =>
              total + (parseFloat(activity.actualDistance) || 0),
            0
          )
        : 0;

      const adherence =
        done + missed > 0
          ? Math.round((done / (done + missed)) * 100)
          : 0;

      let adherenceColour = "#ef4444";

      if (adherence >= 90) {
        adherenceColour = "#16a34a";
      } else if (adherence >= 75) {
        adherenceColour = "#f59e0b";
      }

      totalPlanned += planned;
      totalDone += done;
      totalMissed += missed;
      totalTarget += targetKm;
      totalActual += actualKm;
      
      html += `
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:8px;font-weight:500;">
            ${type}
          </td>
          <td style="padding:8px;text-align:center;">
            ${planned}
          </td>
          <td style="padding:8px;text-align:center;">
            ${done}
          </td>
          <td style="padding:8px;text-align:center;">
            ${missed}
          </td>
          <td style="padding:8px;text-align:center;">
            ${targetKm > 0 ? targetKm.toFixed(1) : "-"}
          </td>
          <td style="padding:8px;text-align:center;">
            ${actualKm > 0 ? actualKm.toFixed(1) : "-"}
          </td>
          <td style="
            padding:8px;
            text-align:center;
            font-weight:700;
            color:${adherenceColour};
          ">
            ${adherence}%
          </td>
        </tr>
      `;
    });

    const totalAdherence =
      totalDone + totalMissed > 0
        ? Math.round(
            (totalDone / (totalDone + totalMissed)) * 100
          )
        : 0;

    let totalColour = "#ef4444";

    if (totalAdherence >= 90) {
      totalColour = "#16a34a";
    } else if (totalAdherence >= 75) {
      totalColour = "#f59e0b";
    }

    html += `
        <tr style="
          background:#eff6ff;
          border-top:2px solid #2563eb;
          font-weight:700;
        ">
          <td style="padding:10px;">
            TOTAL
          </td>
          <td style="padding:10px;text-align:center;">
            ${totalPlanned}
          </td>
          <td style="padding:10px;text-align:center;">
            ${totalDone}
          </td>
          <td style="padding:10px;text-align:center;">
            ${totalMissed}
          </td>
          <td style="padding:10px;text-align:center;">
            ${totalTarget.toFixed(1)}
          </td>
          <td style="padding:10px;text-align:center;">
            ${totalActual.toFixed(1)}
          </td>
          <td style="
            padding:10px;
            text-align:center;
            color:${totalColour};
          ">
            ${totalAdherence}%
          </td>
        </tr>
      </tbody>
      </table>
      </div>
      </div>
      </details>
    `;
  });

  return html;
}
// -----------------------------------------------------------------------------
// EVENT SETUP AND TRAINING PLAN UI
// -----------------------------------------------------------------------------
function formatTimelineDate(dateString) {
  const date = parseLocalDate(dateString);
  return date && Number.isFinite(date.getTime())
    ? date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "Date not set";
}

function renderEventTimeline(event) {
  const phases = (event?.trainingPhases || [])
    .filter(phase => phase.start && phase.end)
    .slice()
    .sort((a, b) => a.start.localeCompare(b.start));
  if (!phases.length) return "";

  const todayString = getLocalDateString();
  const today = parseLocalDate(todayString);
  const raceString = event?.eventDate || "";
  const raceDate = raceString ? parseLocalDate(raceString) : null;
  const trainingStart = phases[0].start;
  const startDate = parseLocalDate(trainingStart);
  const timelineEndString = raceDate ? raceString : phases[phases.length - 1].end;
  const timelineEnd = parseLocalDate(timelineEndString);
  const dayMs = 24 * 60 * 60 * 1000;
  const daysBetween = (a, b) => Math.max(0, Math.round((b - a) / dayMs));
  const totalSpanDays = startDate && timelineEnd
    ? Math.max(1, daysBetween(startDate, timelineEnd))
    : 1;
  const overallPercent = raceDate && startDate && today
    ? today >= raceDate
      ? 100
      : Math.min(100, Math.max(0, Math.round(daysBetween(startDate, today) / totalSpanDays * 100)))
    : null;

  const segments = [];
  let cursor = trainingStart;
  phases.forEach(phase => {
    if (raceString && phase.start > raceString) return;
    const clippedEnd = raceString && phase.end > raceString ? raceString : phase.end;
    if (phase.start > cursor) {
      const gapDays = Math.max(0, daysBetween(parseLocalDate(cursor), parseLocalDate(phase.start)) - 1);
      if (gapDays > 0) segments.push({ name: "Gap", status: "planned", days: gapDays });
    }
    const phaseStartDate = parseLocalDate(phase.start);
    const phaseEndDate = parseLocalDate(clippedEnd);
    const phaseDays = Math.max(1, daysBetween(phaseStartDate, phaseEndDate) + 1);
    let status = "planned";
    if (todayString > clippedEnd) status = "completed";
    else if (todayString >= phase.start && todayString <= clippedEnd) status = "current";
    segments.push({
      name: phase.name?.replace(/^Phase \d+:\s*/, "") || "Training phase",
      status,
      days: phaseDays,
      phase,
      clippedEnd
    });
    cursor = clippedEnd;
  });

  const lastVisibleEnd = segments.slice().reverse().find(segment => segment.phase)?.clippedEnd || trainingStart;
  if (raceDate && raceString > lastVisibleEnd) {
    const gapDays = Math.max(1, daysBetween(parseLocalDate(lastVisibleEnd), raceDate));
    segments.push({ name: "Race day", status: todayString > raceString ? "completed" : todayString === raceString ? "current" : "planned", days: gapDays, isRace: true });
  }
  const segmentHtml = segments.map(segment => {
    const title = escapeHtml(segment.name);
    let dateRange = "";
    if (segment.phase) {
      const phaseStartDate = parseLocalDate(segment.phase.start);
      const phaseEndDate = parseLocalDate(segment.clippedEnd);
      const phaseTotalDays = Math.max(1, daysBetween(phaseStartDate, phaseEndDate) + 1);
      const phaseDaysLeft = segment.status === "current" ? daysBetween(today, phaseEndDate) : null;
      if (segment.status === "current") {
        const elapsedPercent = Math.round(((phaseTotalDays - phaseDaysLeft) / phaseTotalDays) * 100);
        dateRange = `<div class="event-timeline-dates current-phase-dates">
          <div class="event-timeline-phase-progress" role="progressbar" aria-label="Current phase elapsed" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${elapsedPercent}"><div style="width:${elapsedPercent}%"></div></div>
          <div class="event-timeline-current-date-line">${formatTimelineDate(segment.phase.start)} to ${formatTimelineDate(segment.clippedEnd)}</div>
          <strong class="event-timeline-days-left">${phaseDaysLeft} of ${phaseTotalDays} days left</strong>
        </div>`;
      } else {
        dateRange = `<div class="event-timeline-dates"><span>${formatTimelineDate(segment.phase.start)}</span><span>${formatTimelineDate(segment.clippedEnd)}</span></div>`;
      }
    }
    const statusLabel = segment.status[0].toUpperCase() + segment.status.slice(1);
    return `<div class="event-timeline-segment status-${segment.status}${segment.isRace ? " race-segment" : ""}" style="flex:${segment.days} 1 0" title="${title} · ${statusLabel}">
      <div class="event-timeline-segment-title">${segment.isRace ? "🏁 " : ""}${title}</div>
      <div class="event-timeline-segment-status">${segment.isRace ? "Race" : statusLabel}</div>
      ${dateRange}
    </div>`;
  }).join("");

  const progressText = overallPercent == null
    ? "Set the event race date to calculate overall progress."
    : `Progress to Race Day: ${overallPercent}%`;
  const startLabel = `Training starts · ${formatTimelineDate(trainingStart)}`;
  const raceLabel = raceDate ? `Race day · ${formatTimelineDate(raceString)}` : "Race date not set";

  return `<section class="event-timeline" aria-label="Training timeline">
    <div class="event-timeline-heading"><h3>Training Timeline</h3><strong>${progressText}</strong></div>
    <div class="event-timeline-scroll" tabindex="0" aria-label="Scroll horizontally to view all training phases">
      <div class="event-timeline-start">● ${startLabel}</div>
      <div class="event-timeline-track" style="min-width:${Math.max(720, segments.length * 125)}px">${segmentHtml}</div>
    <div class="event-timeline-race"><div class="event-timeline-legend"><span><i class="legend-completed"></i>Completed</span><span><i class="legend-current"></i>Current</span><span><i class="legend-planned"></i>Planned</span></div><span class="event-timeline-race-label">🏁 ${raceLabel}</span></div>
    </div>
  </section>`;
}

      function displayCurrentEvent() {
        const event = JSON.parse(localStorage.getItem("currentEvent"));
  const currentPhase =
  getCurrentTrainingPhase(
    event?.trainingPhases || []
  );
const phaseTimelineHtml = renderEventTimeline(event);
        const personalBest = getPersonalBest(event?.raceDistance);
        const activities = (
          JSON.parse(localStorage.getItem("activities")) || []
        ).filter((activity) => activity.eventId === event?.id);
        const paceData = calculateGoalPace(
          event?.goalTime,
          event?.raceDistance || 42.195,
        );
        const isUltra = event?.marathonType === "Ultra Marathon";
        let paceDashboardHtml = "";
        const finishLabel =
          event?.raceDistance === 161
            ? "100 Mile Target"
            : `${event?.raceDistance}K Target`;
        if (paceData) {
          if (isUltra) {
            let ultraSplitCards = "";

            if (event?.raceDistance >= 50) {
              ultraSplitCards += `
          <div class="card">
              <div class="card-value"
              style="color:#7c3aed;">
                  ${paceData.split50}
              </div>
              <div class="card-label">
                  50K Target
              </div>
          </div>
          `;
            }

            if (event?.raceDistance >= 75) {
              ultraSplitCards += `
          <div class="card">
              <div class="card-value"
              style="color:#7c3aed;">
                  ${paceData.split75}
              </div>
              <div class="card-label">
                  75K Target
              </div>
          </div>
          `;
            }

            if (event?.raceDistance >= 100) {
              ultraSplitCards += `
          <div class="card">
              <div class="card-value"
              style="color:#7c3aed;">
                  ${paceData.split100}
              </div>
              <div class="card-label">
                  ${finishLabel}
              </div>
          </div>
          `;
            }
            paceDashboardHtml = `
              <div style="
              margin-top:18px;
              margin-bottom:16px;
              text-align:center;
              font-size:1rem;
              font-weight:700;
              color:#7c3aed;
              ">
                  🏔️ Ultra Pace Targets
              </div>
              <div class="current-event-metrics"
              style="
              display:flex;
      justify-content:center;
      gap:12px;
      margin-top:12px;
      flex-wrap:wrap;
              ">
                  <div class="card">
                      <div class="card-value">
                          ${paceData.paceKm}
                      </div>
                      <div class="card-label">
                          Goal Pace / km
                      </div>
                  </div>

                  <div class="card">
                      <div class="card-value">
                          ${paceData.paceMile}
                      </div>
                      <div class="card-label">
                          Goal Pace / mile
                      </div>
                  </div>

              </div>

              <div class="pace-row"
              style="
              display:flex;
              gap:12px;
              margin-top:12px;
              ">

                  ${ultraSplitCards}

      <div class="card">
          <div class="card-value"
          style="color:#16a34a;">
              ${paceData.finishSplit}
          </div>
          <div class="card-label">
              Finish Goal
          </div>
      </div>
              </div>
              `;
          } else {
            paceDashboardHtml = `
              <div style="
              margin-top:18px;
              margin-bottom:16px;
              text-align:center;
              font-size:1rem;
              font-weight:700;
              color:#2563eb;
              ">
                  🎯 Marathon Pace Targets
              </div>

              <div class="pace-row"
              style="
              display:flex;
              gap:12px;
              margin-top:12px;
              ">

                  <div class="card">
                  <div style="text-align:center;">
                      <div class="card-value">
                          ${paceData.paceKm}
                      </div>
                      <div class="card-label">
                          Goal Pace / km
                      </div>
                  </div>
                  </div>

                  <div class="card">
                      <div class="card-value">
                          ${paceData.paceMile}
                      </div>
                      <div class="card-label">
                          Goal Pace / mile
                      </div>
                  </div>

              </div>

              <div class="pace-row"
              style="
              display:flex;
              gap:12px;
              margin-top:12px;
              ">

                  <div class="card">
                      <div class="card-value">
                          ${paceData.split10k}
                      </div>
                      <div class="card-label">
                          10K
                      </div>
                  </div>

                  <div class="card">
                      <div class="card-value">
                          ${paceData.halfSplit}
                      </div>
                      <div class="card-label">
                          Half Marathon
                      </div>
                  </div>

                  <div class="card">
                      <div class="card-value">
                          ${paceData.split30k}
                      </div>
                      <div class="card-label">
                          30K
                      </div>
                  </div>

              </div>

              <div class="pace-row"
              style="
              display:flex;
              gap:12px;
              margin-top:12px;
              ">

                  <div class="card">
                      <div class="card-value">
                          ${paceData.split20mile}
                      </div>
                      <div class="card-label">
                          20 Mile
                      </div>
                  </div>

                  <div class="card">
                      <div class="card-value">
                          ${paceData.finishSplit}
                      </div>
                      <div class="card-label">
                          Finish
                      </div>
                  </div>

              </div>
              `;
          }
        }
        const runningTypes = [
          "Easy Run",
          "Long Run",
          "Race Pace Run",
          "Recovery Run",
          "Tempo Run",
          "RACE DAY",
        ];
        const completedRuns = activities.filter(
          (activity) =>
            runningTypes.includes(activity.type) &&
            activity.completed === "Done",
        ).length;
        const completedDistance = activities.reduce(
          (total, activity) =>
            total + (parseFloat(activity.actualDistance) || 0),
          0,
        );
        const doneCount = activities.filter(
          (activity) => activity.completed === "Done",
        ).length;
        const missedCount = activities.filter(
          (activity) => activity.completed === "Missed",
        ).length;
        const adherence =
          doneCount + missedCount > 0
            ? Math.round((doneCount / (doneCount + missedCount)) * 100)
            : 0;
        const completedSessions = activities.filter(
          (activity) => activity.completed === "Done",
        ).length;
        if (!event) {
          document.getElementById("currentEventSummary").innerHTML = `
      <div class="current-event">
      📅 <strong>No active event</strong>
      <span style="color:#64748b;">
      Create one below
      </span>

</div>
`;

          return;
        }
        document.getElementById("eventName").value = event.eventName || "";

        document.getElementById("marathonType").value =
          event.marathonType || "Marathon";

        document.getElementById("raceDistance").value =
          event.raceDistance || 42.195;

        document.getElementById("eventDate").value = event.eventDate || "";

        document.getElementById("goalTime").value = event.goalTime || "";

        document.getElementById("websiteUrl").value = event.websiteUrl || "";

        document.getElementById("gpxUrl").value = event.gpxUrl || "";
        /* ===== Training Phases ===== */
        if (event.trainingPhases?.length) {
          document.getElementById("phase1Start").value =
            event.trainingPhases[0]?.start || "";
          document.getElementById("phase1End").value =
            event.trainingPhases[0]?.end || "";

          document.getElementById("phase2Start").value =
            event.trainingPhases[1]?.start || "";
          document.getElementById("phase2End").value =
            event.trainingPhases[1]?.end || "";

          document.getElementById("phase3Start").value =
            event.trainingPhases[2]?.start || "";
          document.getElementById("phase3End").value =
            event.trainingPhases[2]?.end || "";

          document.getElementById("phase4Start").value =
            event.trainingPhases[3]?.start || "";
          document.getElementById("phase4End").value =
            event.trainingPhases[3]?.end || "";

          document.getElementById("phase5Start").value =
            event.trainingPhases[4]?.start || "";
          document.getElementById("phase5End").value =
            event.trainingPhases[4]?.end || "";

          document.getElementById("raceWeekStart").value =
            event.trainingPhases[5]?.start || "";
          document.getElementById("raceWeekEnd").value =
            event.trainingPhases[5]?.end || "";
        } else {
          document.getElementById("phase1Start").value = "2026-08-24";
          document.getElementById("phase1End").value = "2026-10-11";

          document.getElementById("phase2Start").value = "2026-10-12";
          document.getElementById("phase2End").value = "2026-11-22";

          document.getElementById("phase3Start").value = "2026-11-23";
          document.getElementById("phase3End").value = "2027-01-24";

          document.getElementById("phase4Start").value = "2027-01-25";
          document.getElementById("phase4End").value = "2027-03-07";

          document.getElementById("phase5Start").value = "2027-03-08";
          document.getElementById("phase5End").value = "2027-03-21";

          document.getElementById("raceWeekStart").value = "2027-03-22";
          document.getElementById("raceWeekEnd").value = "2027-03-26";
        }
        const raceDay = event.eventDate
          ? parseLocalDate(event.eventDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })
          : "-";
        let countdownText = "-";
        if (event.eventDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const eventDate = parseLocalDate(event.eventDate);
          eventDate.setHours(0, 0, 0, 0);
          const daysRemaining = Math.round(
            (eventDate - today) / (1000 * 60 * 60 * 24),
          );
          if (daysRemaining === 0) {
            countdownText = "TODAY";
          } else if (daysRemaining === 1) {
            countdownText = "1 day";
          } else if (daysRemaining > 1) {
            countdownText = `${daysRemaining} days`;
          } else {
            countdownText = "Completed";
          }
        }
        document.getElementById("currentEventSummary").innerHTML = `
      <div style="margin-bottom:20px;">

  <h2
  style="
    margin:0;
    padding:0;
    border:none;
    color:#0f172a;
  "
  >
    🏁 Current Event:
    ${escapeHtml(event.eventName || "Unnamed Event")}
  </h2>

  ${phaseTimelineHtml}

</div>
      <div
      class="current-event-metrics"
      style="
      display:flex;
      gap:12px;
      margin-top:15px;
      "
      >
      <div
      style="
      flex:1;
      background:white;
      border-radius:16px;
      padding:20px;
      text-align:center;
      box-shadow:
      0 4px 12px rgba(0,0,0,0.08);
      "
      >
      <div
      style="
      font-size:1.6rem;
      font-weight:bold;
      color:#2563eb;
      "
      >
      ${countdownText}
      </div>
      <div style="color:#666;">
      Countdown
      </div>
      </div>
      <div
      style="
      flex:1;
      background:white;
      border-radius:16px;
      padding:20px;
      text-align:center;
      box-shadow:
      0 4px 12px rgba(0,0,0,0.08);
      "
      >
      <div
      style="
      font-size:1.6rem;
      font-weight:bold;
      color:#2563eb;
      "
      >
      ${event.goalTime || "-"}
      </div>
      <div style="color:#666;">
      Goal Time
      </div>
      </div>
      <div
      style="
      flex:1;
      background:white;
      border-radius:16px;
      padding:20px;
      text-align:center;
      box-shadow:
      0 4px 12px rgba(0,0,0,0.08);
      "
      >
      <div
      style="
      font-size:1.6rem;
      font-weight:bold;
      color:
      ${event.marathonType === "Ultra Marathon" ? "#7c3aed" : "#2563eb"};
      "
      >
      ${event.marathonType === "Ultra Marathon" ? "Ultra" : "Marathon"}
      </div>
      <div style="color:#666;">
      Type
      </div>
      </div>
      <div
      style="
      flex:1;
      background:white;
      border-radius:16px;
      padding:20px;
      text-align:center;
      box-shadow:
      0 4px 12px rgba(0,0,0,0.08);
      "
      >
      <div
      style="
      font-size:1.6rem;
      font-weight:bold;
      color:#2563eb;
      "
      >
      ${event.raceDistance || 42.195} km
      </div>

      <div style="color:#666;">
      Race Distance
      </div>
      </div>
      <div
      style="
      flex:1;
      background:white;
      border-radius:16px;
      padding:20px;
      text-align:center;
      box-shadow:
      0 4px 12px rgba(0,0,0,0.08);
      "
      >
      <div
      style="
      font-size:1.6rem;
      font-weight:bold;
      color:#2563eb;
      "
      >
      ${raceDay || "-"}
      </div>
      <div style="color:#666;">
      Race Day
      </div>
      </div>
      <div
      style="
      flex:1;
      background:white;
      border-radius:16px;
      padding:20px;
      text-align:center;
      box-shadow:
      0 4px 12px rgba(0,0,0,0.08);
      "
      >
      <div
      style="
      font-size:1.6rem;
      font-weight:bold;
      color:#d97706;
      "
      >
      ${escapeHtml(personalBest?.raceOutcome?.officialTime || "No PB")}
      </div>
      <div style="
      color:#92400e;
      font-weight:600;
      ">
      🏅 Personal Best
      </div>
      ${
        personalBest
          ? `
      <div
      style="
      font-size:0.75rem;
      margin-top:6px;
      color:#64748b;
      "
      >
      ${escapeHtml(personalBest.event?.eventName || "")}
      </div>
      `
          : ""
      }
      </div>
      </div>
      ${paceDashboardHtml}

<div class="card" style="margin-top:20px;">
  <h3>📈 Training Phase Progress</h3>
  <div id="phaseProgressTable">
    No phase data available.
  </div>
</div>

<div
class="current-event-metrics"
style="
display:flex;
gap:12px;
margin-top:12px;
"
>
      <div
      style="
      flex:1;
      background:white;
      border-radius:16px;
      padding:20px;
      text-align:center;
      box-shadow:
      0 4px 12px rgba(0,0,0,0.08);
      "
      >
      <div
      style="
      font-size:1.6rem;
      font-weight:bold;
      color:#2563eb;
      "
      >
      ${completedRuns}
      </div>
      <div style="color:#666;">
      Runs Completed
      </div>
      </div>
      <div
      style="
      flex:1;
      background:white;
      border-radius:16px;
      padding:20px;
      text-align:center;
      box-shadow:
      0 4px 12px rgba(0,0,0,0.08);
      "
      >
      <div
      style="
      font-size:1.6rem;
      font-weight:bold;
      color:#2563eb;
      "
      >
      ${completedDistance.toFixed(1)}
      </div>
      <div style="color:#666;">
      Distance (km)
      </div>
      </div>
      <div
      style="
      flex:1;
      background:white;
      border-radius:16px;
      padding:20px;
      text-align:center;
      box-shadow:
      0 4px 12px rgba(0,0,0,0.08);
      "
      >
      <div
      style="
      font-size:1.6rem;
      font-weight:bold;
      color:#16a34a;
      "
      >
      ${adherence}%
      </div>
      <div style="color:#666;">
      Adherence
      </div>
      </div>
      <div
      style="
      flex:1;
      background:white;
      border-radius:16px;
      padding:20px;
      text-align:center;
      box-shadow:
      0 4px 12px rgba(0,0,0,0.08);
      "
      >
      <div
      style="
      font-size:1.6rem;
      font-weight:bold;
      color:#f97316;
      "
      >
      🔥 ${completedSessions}
      </div>
      <div style="color:#666;">
      Completed Sessions
      </div>
      </div>
      </div>
      `;
      const phaseTable = document.getElementById("phaseProgressTable");

if (phaseTable) {
  phaseTable.innerHTML =
    buildPhaseProgressTable(event, activities);
}
      }
      function saveEvent() {
        if (!validateTrainingPhases()) {
    return;
  }
const existingEvent =
  JSON.parse(localStorage.getItem("currentEvent"));
        const goalTime =
    document.getElementById(
        "goalTime"
    ).value;

if (
    goalTime &&
    timeToSeconds(goalTime) ===
        Number.MAX_SAFE_INTEGER
) {

    alert(
        "Goal Time must be HH:MM:SS"
    );

    return;
}
        const event = {
          id: existingEvent?.id || Date.now(),

          eventName: document.getElementById("eventName").value,
          marathonType: document.getElementById("marathonType").value,
          eventDate: document.getElementById("eventDate").value,

          raceDistance:
            parseFloat(document.getElementById("raceDistance").value) || 42.195,

          goalTime: document.getElementById("goalTime").value,
          websiteUrl: document.getElementById("websiteUrl").value,
          gpxUrl: document.getElementById("gpxUrl").value,

          trainingPhases: [
            {
              name: "Phase 1: Base Building",
              start: document.getElementById("phase1Start").value,
              end: document.getElementById("phase1End").value,
            },
            {
              name: "Phase 2: Build",
              start: document.getElementById("phase2Start").value,
              end: document.getElementById("phase2End").value,
            },
            {
              name: "Phase 3: Peak Training",
              start: document.getElementById("phase3Start").value,
              end: document.getElementById("phase3End").value,
            },
            {
              name: "Phase 4: Race Specific",
              start: document.getElementById("phase4Start").value,
              end: document.getElementById("phase4End").value,
            },
            {
              name: "Phase 5: Taper",
              start: document.getElementById("phase5Start").value,
              end: document.getElementById("phase5End").value,
            },
            {
              name: "Race Week",
              start: document.getElementById("raceWeekStart").value,
              end: document.getElementById("raceWeekEnd").value,
            },
          ],
        };

        localStorage.setItem("currentEvent", JSON.stringify(event));

        displayCurrentEvent();

        alert("Event saved successfully.");
      }
      function toggleRunFields() {
        const type = document.getElementById("workoutType").value;

        const runFields = document.getElementById("runFields");

        const runningTypes = [
          "Easy Run",
          "Long Run",
          "Race Pace Run",
          "Recovery Run",
          "Tempo Run",
          "RACE DAY",
        ];

        runFields.style.display = runningTypes.includes(type)
          ? "block"
          : "none";
      }
      function restoreFullBackup() {
        const file = document.getElementById("backupRestoreFile").files[0];

        if (!file) {
          return;
        }

        const confirmed = confirm(
          "This will overwrite all current data. Continue?",
        );

        if (!confirmed) {
          return;
        }

        const reader = new FileReader();

        reader.onload = function (event) {
          try {
            const rawBackup = JSON.parse(event.target.result);

            const backup = restoreBackup(rawBackup);

            displayCurrentEvent();
            displayActivities();
            displayWeeklyDashboard();
            displayDiaryEntries();
            displayAnalytics();
            displayFitnessMetrics();
            displayRaceOutcome();
            displayReview();
            displayRoute();

            const activityCount = backup.activities.length;

            const archiveCount = backup.eventArchive.length;

            const routePresent = backup.eventRoute ? "Yes" : "No";

            const eventName = backup.currentEvent?.eventName || "None";

            alert(
              "Backup Restored Successfully\n\n" +
                "Event:\n" +
                eventName +
                "\n\n" +
                "Activities:\n" +
                activityCount +
                "\n\n" +
                "Archived Events:\n" +
                archiveCount +
                "\n\n" +
                "Route Present:\n" +
                routePresent +
                "\n\n" +
                "Backup Version:\n" +
                backup.schemaVersion,
            );
          } catch (error) {
            console.error("Restore failed:", error);

            alert(error.message || "Restore failed.");
          }
        };

        reader.readAsText(file);
      }
      function exportFullBackup() {
        const backup = buildBackup();
        const route = loadEventRoute();
        if (route) {
          backup.eventRoute = route;
        }
        const json = JSON.stringify(backup, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const timestamp = new Date().toISOString().split("T")[0];
        link.download = `marathon-event-manager-backup-${timestamp}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        alert("Full backup exported successfully.");
      }
      function exportArchive(index) {
        const archive = JSON.parse(localStorage.getItem("eventArchive")) || [];

        const event = archive[index];

        const json = JSON.stringify(event, null, 2);

        const blob = new Blob([json], {
          type: "application/json",
        });

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;

        const fileName = (event.event?.eventName || "event")
          .replace(/[<>:"/\\|?*]/g, "")
          .replace(/\s+/g, "-");

        link.download = fileName + ".json";

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(url);
      }
      function deleteArchive(index) {
        let archive = JSON.parse(localStorage.getItem("eventArchive")) || [];

        const currentEvent = JSON.parse(localStorage.getItem("currentEvent"));

        if (currentEvent && archive[index].event?.id === currentEvent.id) {
          alert("You cannot delete the active event.");

          return;
        }
        const confirmed = confirm(
          `Delete archived event "${archive[index].event?.eventName}"?`,
        );

        if (!confirmed) {
          return;
        }

        archive.splice(index, 1);

        localStorage.setItem("eventArchive", JSON.stringify(archive));

        document.getElementById("archiveDetail").innerHTML = "";
      }
      function isDuplicateActivity(existingActivities, activity) {
        return existingActivities.some(
          (existing) =>
            existing.eventId === activity.eventId &&
            existing.date === activity.date &&
            existing.type === activity.type &&
            (existing.detail || "") === (activity.detail || ""),
        );
      }
