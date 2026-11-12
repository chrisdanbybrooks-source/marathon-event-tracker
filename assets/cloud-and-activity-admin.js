// -----------------------------------------------------------------------------
// DOCUMENTATION AND CLOUD BACKUP
// -----------------------------------------------------------------------------
let mermaidRendererPromise;

function loadMermaidRenderer() {
    if (!mermaidRendererPromise) {
        mermaidRendererPromise = import(
            "https://cdn.jsdelivr.net/npm/mermaid@12/dist/mermaid.esm.min.mjs"
        ).then(({ default: mermaid }) => {
            mermaid.initialize({
                startOnLoad: false,
                securityLevel: "strict",
                theme: "neutral"
            });
            return mermaid;
        });
    }

    return mermaidRendererPromise;
}

async function renderMermaidDiagrams(container) {
    const codeBlocks = Array.from(
        container.querySelectorAll("pre > code.language-mermaid")
    );
    if (!codeBlocks.length) return;

    try {
        const mermaid = await loadMermaidRenderer();

        for (const codeBlock of codeBlocks) {
            const originalPre = codeBlock.parentElement;
            const diagram = document.createElement("pre");
            diagram.className = "mermaid";
            diagram.textContent = codeBlock.textContent || "";
            originalPre.replaceWith(diagram);

            try {
                await mermaid.run({ nodes: [diagram] });
            } catch (error) {
                console.error("Unable to render Mermaid diagram", error);
                diagram.replaceWith(originalPre);
            }
        }
    } catch (error) {
        // Keep the fenced source readable if the Mermaid library cannot load.
        console.warn("Mermaid rendering is unavailable", error);
    }
}

async function loadDocumentation(
    fileName,
    title
) {
  showLoading(
    "Loading documentation..."
);

    try {

        const token =
            localStorage.getItem(
                "githubToken"
            );

        if (!token) {
          hideLoading();
          alert(
                "Configure GitHub Token first."
            );

            return;
        }

        const path = fileName === "README.md"
            ? fileName
            : fileName.startsWith("assets/")
                ? fileName
                : `docs/${fileName}`;

const response =
    await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
        {
            headers: {
                Authorization:
                    `Bearer ${token}`
            }
        }
    );

        if (!response.ok) {
          hideLoading();

            throw new Error(
                "Document not found"
            );

        }

        const file =
            await response.json();

        const markdown =
            decodeURIComponent(
                escape(
                    atob(file.content)
                )
            );

        document.getElementById(
            "documentationTitle"
        ).textContent = title;

        const documentationContent = document.getElementById(
            "documentationContent"
        );
        documentationContent.innerHTML =
            renderMarkdown(
                markdown
            );

        document.getElementById(
            "documentationModal"
        ).style.display =
            "block";
            hideLoading();
        renderMermaidDiagrams(documentationContent);

    }
    catch(error) {
      hideLoading();

        console.error(error);

        alert(
            "Unable to load documentation."
        );
    }
}

async function refreshCloudStatus() {

    try {

        const token =
            localStorage.getItem(
                "githubToken"
            );

        if (!token) {
            return;
        }

        const response =
            await fetch(
                `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        if (!response.ok) {
            return;
        }

        const githubFile =
            await response.json();

        const backup =
            JSON.parse(
                decodeURIComponent(
                    escape(
                        atob(
                            githubFile.content
                        )
                    )
                )
            );

        updateCloudTimestampDisplay(
            backup.backupDate
        );

    }
    catch(error) {

        console.error(
            "Cloud status check failed",
            error
        );

    }
}
async function saveCloudBackup() {
    try {

        const confirmed = confirm(
            "Upload current data to cloud and overwrite the existing cloud backup?"
        );

        if (!confirmed) {
            return;
        }
         showLoading(
    "Uploading backup..."
);

const token =
    localStorage.getItem(
        "githubToken"
    );

if (!token) {

    hideLoading();

    alert(
        "Configure GitHub Token first."
    );

    return;
}

        const backup =
            buildBackup();

        const content =
            btoa(
                unescape(
                    encodeURIComponent(
                        JSON.stringify(
                            backup,
                            null,
                            2
                        )
                    )
                )
            );

        const url =
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE}`;

        let sha = null;

        const existing =
            await fetch(
                url,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        if (existing.ok) {

            const existingFile =
                await existing.json();

            sha =
                existingFile.sha;
        }

        const upload =
            await fetch(
                url,
                {
                    method: "PUT",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        message:
                            `Cloud sync ${new Date().toISOString()}`,

                        content,

                        sha
                    })
                }
            );

        if (!upload.ok) {

            throw new Error(
                "Upload failed"
            );
        }

        localStorage.setItem(
            "lastCloudSync",
            new Date()
                .toLocaleString(
                    "en-GB"
                )
        );

        document.getElementById(
            "cloudStatus"
        ).textContent =
            "☁ Synced";

        updateLastSyncDisplay();

        alert(
            "Cloud backup uploaded successfully."
        );

    }
    catch(error) {

        console.error(error);

        alert(
            "Cloud save failed:\n" +
            error.message
        );
    }
    finally {

        hideLoading();

    }
}

async function loadCloudBackup() {

    try {

        const confirmed = confirm(
            "Download cloud backup and overwrite local data?"
        );

        if (!confirmed) {
            return;
        }

        const token =
            localStorage.getItem(
                "githubToken"
            );

        if (!token) {

            alert(
                "Configure GitHub Token first."
            );

            return;
        }

        showLoading(
            "Downloading backup..."
        );

        const response =
            await fetch(
                `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        if (!response.ok) {

            hideLoading();

            alert(
                "No cloud backup found."
            );

            return;
        }

        const githubFile =
            await response.json();

        const backup =
            JSON.parse(
                decodeURIComponent(
                    escape(
                        atob(
                            githubFile.content
                        )
                    )
                )
            );

        restoreBackup(
            backup
        );

        // Refresh UI

        displayCurrentEvent();
        displayActivities();
        displayWeeklyDashboard();
        displayDiaryEntries();
        displayAnalytics();
        displayFitnessMetrics();
        displayRaceOutcome();
        displayReview();
        displayRoute();

        // Cloud backup date

        if (backup.backupDate) {

            updateCloudTimestampDisplay(
                backup.backupDate
            );

        }

        // Local sync timestamp

        const timestamp =
            new Date()
                .toLocaleString(
                    "en-GB"
                );

        localStorage.setItem(
            "lastCloudSync",
            timestamp
        );

        updateLastSyncDisplay();

        document.getElementById(
            "cloudStatus"
        ).textContent =
            "☁ Loaded";

        hideLoading();

        alert(
            "Cloud backup restored successfully."
        );

    }

    catch (error) {

        console.error(
            "Cloud download failed:",
            error
        );

        hideLoading();

        alert(
            "Cloud load failed:\n" +
            error.message
        );

    }
}
function updateCloudTimestampDisplay(backupDate) {

    const element =
        document.getElementById(
            "cloudBackupTimestamp"
        );

    if (!backupDate) {

        element.textContent =
            "Cloud Backup: Unknown";

        return;
    }

    const date =
        new Date(backupDate);

    element.textContent =
        "Cloud Backup: " +
        date.toLocaleString(
            "en-GB"
        );
}
function clearGitHubToken() {

    localStorage.removeItem(
        "githubToken"
    );

    alert(
        "GitHub token removed."
    );

}
// -----------------------------------------------------------------------------
// ACTIVITY ADMIN, DIARY EDITING AND ROUTE CONTROLS
// -----------------------------------------------------------------------------
      function saveActivity() {
        const currentEvent = JSON.parse(localStorage.getItem("currentEvent"));
        if (!currentEvent) {
          alert("Please create and save an Event first.");
          return;
        }
        let activities = JSON.parse(localStorage.getItem("activities")) || [];

        const activity = {
          id: editingActivityId ||
    crypto.randomUUID(),

          eventId: currentEvent?.id,

          date: document.getElementById("activityDate").value,

          type: document.getElementById("workoutType").value,

          detail: document.getElementById("detail").value,

          morningOnly: document.getElementById("morningOnly").checked,

          completed: document.getElementById("completed").value,

          targetDistance: document.getElementById("targetDistance").value,

          actualDistance: document.getElementById("actualDistance").value,

          comments: document.getElementById("comments").value,
        };

        const saveButton = document.querySelector(
          'button[onclick="saveActivity()"]',
        );

        saveButton.textContent = "Save Activity";

        saveButton.style.background = "#2563eb";

        if (editingActivityId) {
    activities = activities.map(a =>
        a.id === editingActivityId
            ? activity
            : a
    );
} else {
    activities.push(activity);
}

activities = sortActivities(activities);

localStorage.setItem(
    "activities",
    JSON.stringify(activities)
);

        editingActivityId = null;

        document.getElementById("activityForm").reset();
        document.getElementById("morningOnly").checked = false;

        toggleRunFields();

        document.getElementById("cancelEditBtn").style.display = "none";

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
        originalActivitySnapshot = null;
        alert("Activity saved.");
      }
      function cancelEdit() {
        if (hasUnsavedActivityChanges()) {
          const confirmed = confirm("Discard unsaved changes?");

          if (!confirmed) {
            return;
          }
        }

        const saveButton = document.querySelector(
          'button[onclick="saveActivity()"]',
        );

        saveButton.textContent = "Save Activity";

        saveButton.style.background = "#2563eb";

        editingActivityId = null;

        originalActivitySnapshot = null;

        document.getElementById("activityForm").reset();

        document.getElementById("morningOnly").checked = false;

        toggleRunFields();

        document.getElementById("cancelEditBtn").style.display = "none";
      }
      function getActivityFormSnapshot() {
        return JSON.stringify({
          date: document.getElementById("activityDate").value,

          type: document.getElementById("workoutType").value,

          detail: document.getElementById("detail").value,

          completed: document.getElementById("completed").value,

          targetDistance: document.getElementById("targetDistance").value,

          actualDistance: document.getElementById("actualDistance").value,

          comments: document.getElementById("comments").value,
        });
      }

      function hasUnsavedActivityChanges() {
        if (!originalActivitySnapshot) {
          return false;
        }

        return getActivityFormSnapshot() !== originalActivitySnapshot;
      }
      function editActivity(id) {
        console.log(
    "editActivity called with:",
    id
);
        
        if (editingActivityId && hasUnsavedActivityChanges()) {
          const confirmed = confirm(
            "You have unsaved changes. Discard them and continue?",
          );

          if (!confirmed) {
            return;
          }
        }

        lastEditedActivityId = id;

        const activities = JSON.parse(localStorage.getItem("activities")) || [];

        const saveButton = document.querySelector(
          'button[onclick="saveActivity()"]',
        );

        saveButton.textContent = "Update Activity";

        saveButton.style.background = "#16a34a";

        const activity = activities.find((a) => a.id === id);

        if (!activity) {
          return;
        }

        document.getElementById("trainingSection").open = true;

        document.getElementById("activityDate").value = activity.date;

        document.getElementById("workoutType").value = activity.type;

        document.getElementById("detail").value = activity.detail || "";

        document.getElementById("morningOnly").checked = activity.morningOnly || false;

        document.getElementById("targetDistance").value =
          activity.targetDistance || "";

        document.getElementById("actualDistance").value =
          activity.actualDistance || "";

        document.getElementById("completed").value = activity.completed;

        document.getElementById("comments").value = activity.comments || "";

        toggleRunFields();

        editingActivityId = id;

        originalActivitySnapshot = getActivityFormSnapshot();

        document.getElementById("cancelEditBtn").style.display = "block";

        document.getElementById("trainingSection").open = true;

        setTimeout(() => {
          document.getElementById("activityForm").scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 100);
      }
      function validateImportedArchiveEvent(eventData) {
        if (!eventData || typeof eventData !== "object") {
          throw new Error("Invalid event file.");
        }

        return {
          archiveDate: eventData.archiveDate || new Date().toISOString(),

          event: eventData.event || {},

          route: eventData.route || null,

          activities: Array.isArray(eventData.activities)
            ? eventData.activities
            : [],

          raceOutcome: eventData.raceOutcome || {},

          review: eventData.review || {},
        };
      }
      function importEvent() {
        const file = document.getElementById("importFile").files[0];

        if (!file) {
          alert("Please select a JSON file.");

          return;
        }

        const reader = new FileReader();

        reader.onload = function (event) {
          try {
            const importedEvent = validateImportedArchiveEvent(
              JSON.parse(event.target.result),
            );

            let archive =
              JSON.parse(localStorage.getItem("eventArchive")) || [];

            archive.push(importedEvent);

            localStorage.setItem("eventArchive", JSON.stringify(archive));

            alert("Event imported successfully.");
          } catch (error) {
            alert("Invalid JSON file.");

            console.error(error);
          }
        };

        reader.readAsText(file);
      }
      function formatDiaryDate(dateString) {
        if (!dateString) {
          return "";
        }

        const date = parseLocalDate(dateString);

        return date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "2-digit",
        });
      }
      function displayDiaryEntries() {
        const entries = getDiaryEntries();

        const diaryTable = document.getElementById("diaryTable");

        entries.sort((a, b) => b.date.localeCompare(a.date));

        if (!entries.length) {
          diaryTable.innerHTML = `
                  <div class="card">
                      No diary entries recorded.
                  </div>
              `;

          return;
        }

        let html = `
      <table style="
          width:100%;
          border-collapse:collapse;
          color:#334155;
          font-weight:400;
      ">

                  <thead>

                      <tr style="
                          border-bottom:1px solid #e5e7eb;
                      ">

                          <th style="
                              text-align:left;
                              padding:10px;
                          ">
                              Date
                          </th>

                          <th style="
                              text-align:left;
                              padding:10px;
                          ">
                              Diary Entry
                          </th>

                          <th style="
                              text-align:center;
                              padding:10px;
                          ">
                              Actions
                          </th>

                      </tr>

                  </thead>

                  <tbody>
          `;

        entries.forEach((entry) => {
          html += `
                  <tr style="
                      border-bottom:1px solid #f1f5f9;
                  ">

                      <td style="
          padding:10px;
          vertical-align:top;
          white-space:nowrap;
          color:#0f172a;
      font-weight:400;
      ">
          ${formatDiaryDate(entry.date)}
      </td>

                      <td style="
          padding:10px;
          color:#0f172a;
          font-weight:400;
          line-height:1.5;
      ">
          <div class="markdown-content">
    ${renderMarkdown(entry.entry)}
</div>
      </td>

                      <td style="
          padding:10px;
          text-align:center;
          white-space:nowrap;
      ">
          <button
              type="button"
              onclick="editDiaryEntry(${entry.id})">
              Edit
          </button>

          <button
              type="button"
              onclick="deleteDiaryEntry(${entry.id})"
              style="
                  background:#d83b01;
                  margin-left:5px;
              ">
              Delete
          </button>
      </td>

                  </tr>
              `;
        });

        html += `
                  </tbody>

              </table>
          `;

        diaryTable.innerHTML = html;
      }
      function editDiaryEntry(id) {
        const entries = getDiaryEntries();

        const entry = entries.find((e) => e.id === id);

        if (!entry) {
          return;
        }

        editingDiaryId = id;

        document.getElementById("diaryDate").value = entry.date;

        document.getElementById("diaryEntry").value = entry.entry;

        document.getElementById("saveDiaryBtn").textContent = "Update Entry";

        document.getElementById("saveDiaryBtn").style.background = "#16a34a";

        document.getElementById("cancelDiaryEditBtn").style.display =
          "inline-block";

        document.getElementById("diarySection").open = true;

        document.getElementById("diaryEntry").scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }

      function cancelDiaryEdit() {
        editingDiaryId = null;

        document.getElementById("diaryDate").value = getLocalDateString();

        document.getElementById("diaryEntry").value = "";

        document.getElementById("saveDiaryBtn").textContent = "Save Entry";

        document.getElementById("saveDiaryBtn").style.background = "#2563eb";

        document.getElementById("cancelDiaryEditBtn").style.display = "none";
      }
      function saveDiaryEntry() {
        const date = document.getElementById("diaryDate").value;

        const entryText = document.getElementById("diaryEntry").value.trim();

        if (!date) {
          alert("Please enter a date.");

          return;
        }

        if (!entryText) {
          alert("Please enter a diary entry.");

          return;
        }

        let entries = getDiaryEntries();

        if (editingDiaryId) {
          entries = entries.map((entry) =>
            entry.id === editingDiaryId
              ? {
                  ...entry,
                  date,
                  entry: entryText,
                }
              : entry,
          );

          alert("Diary entry updated.");
        } else {
          entries.push({
            id: Date.now(),
            date,
            entry: entryText,
          });

          alert("Diary entry saved.");
        }

        saveDiaryEntries(entries);

        editingDiaryId = null;

        document.getElementById("diaryDate").value = getLocalDateString();

        document.getElementById("diaryEntry").value = "";

        document.getElementById("saveDiaryBtn").textContent = "Save Entry";

        document.getElementById("saveDiaryBtn").style.background = "#2563eb";

        document.getElementById("cancelDiaryEditBtn").style.display = "none";

        displayDiaryEntries();
      }
      function deleteDiaryEntry(id) {
        const confirmed = confirm("Delete this diary entry?");

        if (!confirmed) {
          return;
        }

        let entries = getDiaryEntries();

        entries = entries.filter((entry) => entry.id !== id);

        saveDiaryEntries(entries);

        displayDiaryEntries();

        alert("Diary entry successfully deleted.");
      }
      function clearRoute() {
        const confirmed = confirm("Remove the saved route?");

        if (!confirmed) {
          return;
        }

        deleteEventRoute();
        clearRouteUI();

        alert("Route removed.");
      }
      function clearRouteUI() {
        document.getElementById("routeGpxFile").value = "";
        document.getElementById("routePreview").innerHTML = "";
      }
      function clearPhaseErrors() {

  document.querySelectorAll(".phase-error").forEach(el => {
    el.innerHTML = "";
    el.classList.remove("show");
  });

  document
    .querySelectorAll(".phase-card input")
    .forEach(input => input.classList.remove("error"));
}

function showPhaseError(phaseId, message) {

  const error = document.getElementById(phaseId + "Error");

  if (!error) {
    return;
  }

  error.innerHTML += `• ${message}<br>`;
  error.classList.add("show");

  document
    .querySelectorAll(`#${phaseId}Start, #${phaseId}End`)
    .forEach(input => {
      if (input) {
        input.classList.add("error");
      }
    });
}
      function displayRoute() {
        const cachedRoute = loadEventRoute();

        if (cachedRoute?.points?.length) {
          renderCachedRoute(cachedRoute);

          return;
        }
        const fileInput = document.getElementById("routeGpxFile");

        const file = fileInput.files[0];

        if (!file) {
          return;
        }

        const reader = new FileReader();

        reader.onload = function (e) {
          document.getElementById("routePreview").innerHTML = `
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
      display:none;
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

          const gpx = new L.GPX(e.target.result, {
            async: true,
            marker_options: {
              startIconUrl: null,
              endIconUrl: null,
              shadowUrl: null,
              wptIconUrls: {},
            },
          });

          gpx.on("loaded", function (evt) {
            map.fitBounds(evt.target.getBounds());

            const legend = document.getElementById("routeLegend");

            legend.innerHTML = `
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
            legend.style.display = "block";
            let points = [];
            function extractLatLngs(layer) {
              if (!layer) {
                return;
              }
              if (typeof layer.getLatLngs === "function") {
                const latlngs = layer.getLatLngs();
                if (
                  Array.isArray(latlngs) &&
                  latlngs.length &&
                  latlngs[0].lat !== undefined
                ) {
                  points = latlngs;
                  return;
                }
                latlngs.forEach(extractLatLngs);
              }
              if (typeof layer.getLayers === "function") {
                layer.getLayers().forEach(extractLatLngs);
              }
            }
            extractLatLngs(evt.target);
            if (points.length < 2) {
              return;
            }
            const currentEvent = JSON.parse(
              localStorage.getItem("currentEvent"),
            );

            let totalDistance = 0;

            for (let i = 1; i < points.length; i++) {
              totalDistance += points[i - 1].distanceTo(points[i]);
            }

            const checkpointInterval =
              currentEvent?.marathonType === "Ultra Marathon" ? 10 : 5;

            const checkpointCount = Math.floor(
              totalDistance / 1000 / checkpointInterval,
            );

            saveEventRoute({
              points: points.map((p) => ({
                lat: p.lat,
                lng: p.lng,
              })),
              distanceKm: Number((totalDistance / 1000).toFixed(1)),
              pointCount: points.length,
              checkpointCount,
            });
            addRouteMarker(
              map,
              points[0],
              "🚩 START",
              "#059669",
              "Start of route",
            );
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
                let background = "#2563eb";
                if (checkpointKm % 20 === 0) {
                  background = "#16a34a";
                }
                addRouteMarker(
                  map,
                  checkpointPoint,
                  `${checkpointKm} km`,
                  background,
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
          });
          gpx.addTo(map);
        };
        reader.readAsText(file);
      }
      function parseCsv(csv) {
        const rows = [];
        let row = [];
        let field = "";
        let inQuotes = false;
        for (let i = 0; i < csv.length; i++) {
          const char = csv[i];
          const next = csv[i + 1];
          if (char === '"') {
            if (inQuotes && next === '"') {
              field += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === "," && !inQuotes) {
            row.push(field);
            field = "";
          } else if ((char === "\n" || char === "\r") && !inQuotes) {
            if (char === "\r" && next === "\n") {
              i++;
            }
            row.push(field);
            if (row.length > 1 || row[0] !== "") {
              rows.push(row);
            }
            row = [];
            field = "";
          } else {
            field += char;
          }
        }
        row.push(field);
        if (row.length > 1 || row[0] !== "") {
          rows.push(row);
        }
        return rows;
      }
      function displayActivities() {
        const currentEvent = JSON.parse(localStorage.getItem("currentEvent"));
        const allActivities =
          JSON.parse(localStorage.getItem("activities")) || [];
        const activities = sortActivities(
          allActivities.filter(
            (activity) => activity.eventId === currentEvent?.id,
          ),
        );
        const searchText =
          document
            .getElementById("activitySearch")
            ?.value?.toLowerCase()
            ?.trim() || "";
        const filterType =
          document.getElementById("activityFilter")?.value || "All";
        const filteredActivities = activities.filter((activity) => {
          const searchableText = [
            activity.type,
            activity.detail,
            activity.comments,
            activity.completed,
            activity.targetDistance,
            activity.actualDistance,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const matchesSearch =
            !searchText || searchableText.includes(searchText);

          let matchesFilter = filterType === "All";

          if (filterType === "Next10Days") {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const futureDate = new Date(today);
            futureDate.setDate(futureDate.getDate() + 10);

            const activityDate = parseLocalDate(activity.date);

            matchesFilter =
              activityDate &&
              activityDate >= today &&
              activityDate <= futureDate &&
              activity.completed === "Planned";
          } else if (filterType === "Run") {
            matchesFilter = [
              "Easy Run",
              "Long Run",
              "Race Pace Run",
              "Recovery Run",
              "Tempo Run",
              "RACE DAY",
            ].includes(activity.type);
          } else if (filterType !== "All") {
            matchesFilter = activity.type === filterType;
          }

          return matchesSearch && matchesFilter;
        });
        const activityLabel =
          filteredActivities.length === 1 ? "activity" : "activities";

        const activityCountText = `${filteredActivities.length} ${activityLabel}`;
        document.getElementById("activityCount").textContent =
          `(${activityCountText})`;
        const runningTypes = [
          "Easy Run",
          "Long Run",
          "Race Pace Run",
          "Recovery Run",
          "Tempo Run",
          "RACE DAY",
        ];
        let html = "";
        filteredActivities.forEach((activity) => {
          const formattedDate = activity.date
            ? parseLocalDate(activity.date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "-";
          const now = new Date();
          const isToday = activity.date === getLocalDateString();
          const isRun = runningTypes.includes(activity.type);
          const cardShadow = isToday ? "0 0 0 3px #2563eb" : "none";
          const status =
            activity.completed === "Done"
              ? "✅ Done"
              : activity.completed === "Missed"
                ? "❌ Missed"
                : "📅 Planned";
          const cardBackground =
            activity.completed === "Done"
              ? "#ecfdf5"
              : activity.completed === "Missed"
                ? "#fff7ed"
                : "#ffffff";
          const cardBorder =
            activity.completed === "Done"
              ? "#86efac"
              : activity.completed === "Missed"
                ? "#fdba74"
                : "#e5e7eb";
          html += `
      <div
      id="activity-${activity.id}"
      data-today="${isToday}"
      style="
      background:${cardBackground};
      border:1px solid ${cardBorder};
      border-radius:8px;
      padding:6px 10px;
      margin-bottom:4px;
      box-shadow:${cardShadow};
      "
      >
      <div
      style="
      display:flex;
      flex-wrap:wrap;
      gap:4px;
      font-size:0.9rem;
      line-height:1.2;
      align-items:center;
      "
      >
      <button
      type="button"
      onclick="editActivity('${activity.id}')"
      style="
      width:auto;
      padding:0;
      margin:0;
      border:none;
      background:none;
      color:#2563eb;
      font-weight:600;
      cursor:pointer;
      "
      >
      📅 ${formattedDate}
      </button>
      <span style="color:#94a3b8;">|</span>
      <span>
      ${activityIcons[activity.type] || "📋"}
      ${escapeHtml(activity.type)}
      </span>
      ${
        activity.detail
          ? `
<span style="color:#94a3b8;">|</span>
<span>📍 ${escapeHtml(activity.detail)}</span>
`
          : ""
      }
      <span style="color:#94a3b8;">|</span>
      <span>${status}</span>
      ${
    activity.morningOnly
        ? `
<span style="
    color:#d97706;
    font-weight:600;
">
🌅 Morning
</span>
`
        : ""
}
      ${
        isRun
          ? `
      <span style="color:#94a3b8;">|</span>
      <span>🎯 ${activity.targetDistance || "-"} km</span>
      <span style="color:#94a3b8;">|</span>
      <span>📏 ${activity.actualDistance || "-"} km</span>
      `
          : ""
      }
      ${
        activity.comments
          ? `
<span style="color:#94a3b8;">|</span>
<span style="color:#64748b;">
📝 ${escapeHtml(activity.comments)}
</span>
`
          : ""
      }
      </div>
      </div>
      `;
        });
        if (!html) {
          html = `
          <div class="card">
              No matching activities found.
          </div>
          `;
        }
        document.getElementById("activityHistory").innerHTML = html;
      }
      let adherenceChart;
      let statusChart;
      let distanceChart;
