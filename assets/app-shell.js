/*
      ====================================================
      MARATHON EVENT MANAGER
      Version History
      ====================================================
      Future Ideas
      ---------
      □ Backup checksum validation
      □ Restore preview mode
      □ Selective restore options
      □ Automatic scheduled backups
      □ Backup statistics dashboard
      □ Route elevation analytics
      □ Calendar view
      □ Training plan templates
      □ Event comparison dashboard
      □ Cloud synchronisation
      □ Multi-event tracking
      v3.3
      ---------
      ✓ Added Full Application Backup / Restore
      ✓ Introduced backup schema versioning (3.3)
      ✓ Added backup migration framework
      ✓ Added backup validation and normalisation layer
      ✓ Added legacy backup compatibility support
      ✓ Centralised restore processing through restoreBackup()
      ✓ Centralised route persistence through saveEventRoute()

      Backup & Restore Architecture
      ---------
      ✓ Added createEmptyBackup()
      ✓ Added migrateBackup()
      ✓ Added migrateLegacyBackup()
      ✓ Added validateAndNormalise34()
      ✓ Added restore success summary reporting
      ✓ Added backup integrity validation
      ✓ Added migration testing framework
      ✓ Added defensive restore error handling
      ✓ Added schema compatibility checks
      ✓ Centralised backup version routing

      Route Management
      ---------
      ✓ Added event-specific route persistence
      ✓ Added route migration from legacy storage keys
      ✓ Added safe route validation
      ✓ Added route cache rendering support
      ✓ Added route export and archive support
      ✓ Improved GPX route processing

      Route Restore Fixes
      ---------
      ✓ Fixed route not clearing when restoring backups with eventRoute = null
      ✓ Added clearRouteUI() for internal route cleanup
      ✓ Separated user route removal from restore processing
      ✓ Route restore now clears existing route state before loading backup
      ✓ Eliminated unnecessary route confirmation prompts during restore
      ✓ Eliminated unnecessary "Route removed" messages during restore
      ✓ Improved restore reliability for all route scenarios

      Storage Reliability
      ---------
      ✓ Added safeJsonParse()
      ✓ Added safeStorageGet()
      ✓ Added safeStorageSet()
      ✓ Added safeStorageRemove()
      ✓ Improved localStorage error handling
      ✓ Improved route storage resilience

      Architecture Improvements
      ---------
      ✓ Separated UI and data restore responsibilities
      ✓ restoreFullBackup() now acts as UI/controller layer only
      ✓ restoreBackup() is the single restore engine
      ✓ Validation always executed before restore
      ✓ Migration always executed before restore
      ✓ Eliminated duplicated restore logic
      ✓ Improved separation of concerns
      ✓ Improved maintainability for future schema upgrades

      Testing & Validation
      ---------
      ✓ Tested backup restore with route present
      ✓ Tested backup restore with no route present
      ✓ Tested route cleanup workflow
      ✓ Tested route persistence after restore
      ✓ Tested route rendering after restore
      ✓ Tested GPX file selector cleanup
      ✓ Tested manual route removal workflow
      ✓ Completed backup and restore regression testing

      Result
      ---------
      ✓ Route backup and restore functionality fully operational
      ✓ Reliable restore handling for all supported backup scenarios
      ✓ Improved application stability and maintainability

      ----------------------------------------------------

      v3.2
      ---------
      ✓ Added GPX route upload support
      ✓ Added Leaflet route map rendering
      ✓ Added route distance calculations
      ✓ Added route statistics dashboard
      ✓ Added route start and finish markers
      ✓ Added automatic route checkpoints
      ✓ Added route cache persistence
      ✓ Added archive route preservation
      ✓ Improved GPX validation

      ----------------------------------------------------

      v3.1
      ---------
      ✓ Added Marathon Readiness Score
      ✓ Added readiness classification engine
      ✓ Added adherence scoring
      ✓ Added volume scoring
      ✓ Added long run completion scoring
      ✓ Added consistency scoring
      ✓ Added training adherence dashboard
      ✓ Added status pie chart
      ✓ Added weekly target vs actual distance chart
      ✓ Added goal pace calculator
      ✓ Added marathon split targets
      ✓ Added ultra marathon split targets

      ----------------------------------------------------

      v3.0
      ---------
      ✓ Introduced modern dashboard UI
      ✓ Added hero banner
      ✓ Added application version badge
      ✓ Added navigation toolbar
      ✓ Added sticky navigation support
      ✓ Added active navigation highlighting
      ✓ Added one-click section navigation
      ✓ Added Today navigation shortcut
      ✓ Added Collapse All functionality
      ✓ Enhanced Current Event dashboard
      ✓ Added event countdown tracking
      ✓ Added race metrics dashboard
      ✓ Added personal best tracking
      ✓ Improved mobile responsiveness
      ✓ Improved activity management workflows
      ✓ Improved archive management
      ✓ Refactored application structure

      v2.7
      ---------
      ✓ Added Full Application Backup / Restore
      ✓ Introduced backup schema versioning
      ✓ Added backup migration framework
      ✓ Added backup validation and normalisation layer
      ✓ Added legacy backup compatibility support
      ✓ Centralised restore processing through restoreBackup()
      ✓ Centralised route persistence through saveEventRoute()
      ✓ Added backup integrity testing suite
      ✓ Added restore success summary reporting
      ✓ Improved route storage architecture
      ✓ Added safe JSON parsing utilities
      ✓ Added safe localStorage read/write/delete wrappers
      ✓ Added automatic route migration from legacy storage keys
      ✓ Refactored restore workflow into UI and data layers
      ✓ Eliminated duplicated restore logic
      ✓ Improved maintainability for future schema upgrades

      Backup & Restore Architecture
      ---------
      ✓ restoreFullBackup() now handles UI only
      ✓ restoreBackup() is the single restore engine
      ✓ migrateBackup() handles version routing
      ✓ validateAndNormalise34() enforces schema consistency
      ✓ Route restoration now uses application storage APIs
      ✓ Future backup versions can be added with minimal code changes

      Quality Improvements
      ---------
      ✓ Added migration testing framework
      ✓ Added backup validation tests
      ✓ Added schema compatibility checks
      ✓ Added defensive error handling during restore
      ✓ Improved separation of concerns
      ✓ Improved code maintainability
      ✓ Improved long-term upgrade path

      Planned
      ---------
      □ Backup version 2.8 support
      □ Backup checksum validation
      □ Restore preview mode
      □ Selective restore options
      □ Automatic backup creation
      □ Backup statistics dashboard
      □ Cloud backup integration

      ----------------------------------------------------

      v2.6
      ---------
      ✓ Route persistence improvements
      ✓ Event-specific route storage
      ✓ Route migration support
      ✓ Enhanced route validation
      ✓ Improved GPX processing
      ✓ Route rendering optimisation

      ----------------------------------------------------

      v2.5
      ---------
      ✓ Marathon readiness scoring
      ✓ Training adherence analytics
      ✓ Weekly distance tracking
      ✓ Goal pace dashboard
      ✓ Personal best tracking
      ✓ Activity filtering and search

      ----------------------------------------------------

      v2.4
      ---------
      ✓ Created v2.4 development branch
      ✓ Added application version badge
      ✓ Navigation toolbar stabilised
      ✓ Navigation CSS cleaned and consolidated
      ✓ Removed hidden/invalid CSS characters
      ✓ Standardised button layout using CSS Grid
      ✓ Reduced navigation button height
      ✓ Browser compatibility verified

      ----------------------------------------------------

      v2.3
      ---------
      ✓ Navigation redesign
      ✓ Dashboard-style navigation toolbar
      ✓ Improved spacing and visual hierarchy
      ✓ Sticky navigation behaviour
      ✓ Navigation troubleshooting and CSS cleanup
      ✓ Hero section refinements

      ----------------------------------------------------

      Future Ideas
      ---------
      □ Calendar view
      □ Training plan templates
      □ Pace calculator
      □ Route statistics
      □ Event comparison dashboard
      □ Multi-event tracking
      □ Cloud synchronisation
      □ Multiple active event support====================================================
      FULL BACKUP RESTORE ARCHITECTURE
      ====================================================

      Restore Flow

      restoreFullBackup()
          ↓
      restoreBackup(rawBackup)
          ↓
      migrateBackup(rawBackup)
          ├─ migrateLegacyBackup()
          └─ validateAndNormalise34()
          ↓
      Restore application data
          ├─ currentEvent
          ├─ activities
          ├─ raceOutcome
          ├─ postRaceReview
          ├─ eventArchive
          └─ saveEventRoute(eventRoute)
          ↓
      Return normalised backup object
          ↓
      Refresh UI
          ├─ displayCurrentEvent()
          ├─ displayActivities()
          ├─ displayWeeklyDashboard()
          ├─ displayAnalytics()
          ├─ displayArchive()
          ├─ displayRaceOutcome()
          ├─ displayReview()
          └─ displayRoute()
          ↓
      Display restore summary

      ----------------------------------------------------
      Responsibilities
      ----------------------------------------------------

      restoreFullBackup()
      -------------------
      UI/controller layer only.

      Responsible for:
      - Reading backup file
      - Confirming overwrite
      - Parsing JSON
      - Calling restoreBackup()
      - Refreshing screens
      - Showing success/failure messages

      Does not modify localStorage directly.

      restoreBackup(rawBackup)
      ------------------------
      Core restore engine.

      Responsible for:
      - Running migrations
      - Running validation
      - Restoring application data
      - Saving routes using saveEventRoute()

      Returns a fully normalised backup object.

      migrateBackup()
      ---------------
      Version routing layer.

      Currently supports:
      - legacy
      - 2.7

      Future versions should be added here so that
      restore logic remains centralised.

      validateAndNormalise34()
      -------------------------
      Schema validation layer.

      Guarantees the following properties exist:

      - currentEvent
      - eventRoute
      - activities
      - raceOutcome
      - postRaceReview
      - eventArchive
      - settings

      Benefits
      --------
      ✓ Single restore pathway
      ✓ Migration always executed
      ✓ Validation always executed
      ✓ Route persistence centralised
      ✓ Future schema versions supported
      ✓ No duplicated restore logic
      ✓ Clear separation of UI and data layers
      ====================================================
      */

      // CODE MAP
      // 1. App state and configuration
      // 2. ACWR chart and shared UI helpers
      // 3. Fitness data storage and Garmin imports
      // 4. Fitness charts and VO₂ classifications
      // 5. Navigation, events, routes, activities and backups
      // 6. Analytics, fitness scoring and insight libraries
      // 7. Fitness dashboard rendering
      let editingActivityId = null;
      let lastEditedActivityId = null;
      let originalActivitySnapshot = null;
      let editingDiaryId = null;
      const GITHUB_OWNER = "chrisdanbybrooks-source";
      const GITHUB_REPO = "marathon-event-data";
      const GITHUB_FILE = "data.json";
      let acwrChart;
      let trainingLoadChart;
      let enduranceChart;
      let fitnessTrendCharts = {};

      function renderMarkdown(markdown = "") {

    const html =
        marked.parse(markdown);

    return DOMPurify.sanitize(
        html
    );
}
      function parseLocalDate(dateString) {
        if (!dateString) {
          return null;
        }
        const [year, month, day] = dateString.split("-").map(Number);
        return new Date(year, month - 1, day);
      }
      function getLocalDateString() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
          2,
          "0",
        )}-${String(now.getDate()).padStart(2, "0")}`;
      }
      function updateLastSyncDisplay() {

    const lastSync =
        localStorage.getItem(
            "lastCloudSync"
        );

    document.getElementById(
        "lastSyncStatus"
    ).textContent =
        lastSync
            ? `Last Sync: ${lastSync}`
            : "Last Sync: Never";
}
function configureGitHubToken() {

    const token = prompt(
        "Paste your GitHub Personal Access Token"
    );

    if (!token) {
        return;
    }

    localStorage.setItem(
        "githubToken",
        token.trim()
    );

    document.getElementById(
        "cloudStatus"
    ).textContent =
        "☁ Connected";

    alert(
        "GitHub token saved."
    );
}
function showLoading(message = "Loading...") {

    document.getElementById(
        "loadingMessage"
    ).textContent = message;

    document.getElementById(
        "loadingOverlay"
    ).style.display = "flex";
}

function hideLoading() {

    document.getElementById(
        "loadingOverlay"
    ).style.display = "none";
}
function isMorningObservation(timestamp) {

    if (!timestamp) {
        return false;
    }

    const date =
        new Date(timestamp);

    const hour =
        date.getHours();

    return hour < 12;
}
function saveFitnessMetrics(data) {

    safeStorageSet(
        "fitnessMetrics",
        JSON.stringify(data)
    );

}
      function getCurrentEvent() {

    return safeJsonParse(
        safeStorageGet(
            "currentEvent"
        )
    );
}
