// -----------------------------------------------------------------------------
// ACTIVITY LISTS AND ANALYTICS
// -----------------------------------------------------------------------------
      function cleanFitnessObservations() {

    const fitness =
        getFitnessMetrics();

    fitness.observations =
        fitness.observations.filter(
            o =>
                o &&
                o.metricType &&
                Number.isFinite(
                    Number(o.value)
                )
        );

    saveFitnessMetrics(
        fitness
    );
}
      function displayAnalytics() {
        console.log(
          "Analytics loaded",
          getCurrentActivities().length,
          "activities",
        );
        renderAdherenceGauge();
        renderStatusPieChart();
        renderWeeklyDistanceChart();
        displayReadinessScore();
      }
      function getCurrentActivities() {
        const currentEvent = JSON.parse(localStorage.getItem("currentEvent"));
        return (JSON.parse(localStorage.getItem("activities")) || []).filter(
          (activity) => activity.eventId === currentEvent?.id,
        );
      }
      function resetActivityFilters() {
        const search = document.getElementById("activitySearch");

        const filter = document.getElementById("activityFilter");

        if (search) {
          search.value = "";
        }

        if (filter) {
          filter.value = "All";
        }

        displayActivities();

        if (search) {
          search.focus();
        }
      }
      function renderAdherenceGauge() {
        const activities = getCurrentActivities();
        const done = activities.filter((a) => a.completed === "Done").length;
        const missed = activities.filter(
          (a) => a.completed === "Missed",
        ).length;
        const adherence =
          done + missed > 0 ? Math.round((done / (done + missed)) * 100) : 0;
        document.getElementById("adherenceValue").textContent = `${adherence}%`;
        if (adherenceChart) {
          adherenceChart.destroy();
        }
        let colour = "#ef4444";
        if (adherence >= 90) {
          colour = "#22c55e";
        } else if (adherence >= 75) {
          colour = "#facc15";
        }
        const ctx = document.getElementById("adherenceChart");
        adherenceChart = new Chart(ctx, {
          type: "doughnut",
          data: {
            labels: ["Adherence", "Remaining"],
            datasets: [
              {
                data: [adherence, 100 - adherence],
                backgroundColor: [colour, "#e5e7eb"],
                borderWidth: 0,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "75%",
            plugins: {
              legend: {
                display: false,
              },
            },
          },
        });
      }
      function renderStatusPieChart() {
        const activities = getCurrentActivities();
        const done = activities.filter(
          (activity) => activity.completed === "Done",
        ).length;
        const planned = activities.filter(
          (activity) => activity.completed === "Planned",
        ).length;
        const missed = activities.filter(
          (activity) => activity.completed === "Missed",
        ).length;
        document.getElementById("statusSummary").innerHTML = `
      <div
      style="
      display:flex;
      justify-content:center;
      gap:20px;
      flex-wrap:wrap;
      font-weight:600;
      ">
      <span style="color:#22c55e;">
      ✅ ${done}
      </span>
      <span style="color:#3b82f6;">
      📅 ${planned}
      </span>
      <span style="color:#f97316;">
      ❌ ${missed}
      </span>
      </div>
      `;
        if (statusChart) {
          statusChart.destroy();
        }
        statusChart = new Chart(document.getElementById("statusChart"), {
          type: "pie",
          data: {
            labels: ["Done", "Planned", "Missed"],
            datasets: [
              {
                data: [done, planned, missed],
                backgroundColor: ["#22c55e", "#3b82f6", "#f97316"],
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
            },
          },
        });
      }
      function renderWeeklyDistanceChart() {
        const activities = getCurrentActivities();
        const runningTypes = [
          "Easy Run",
          "Long Run",
          "Race Pace Run",
          "Recovery Run",
          "Tempo Run",
          "RACE DAY",
        ];
        const weeklyData = {};
        activities.forEach((activity) => {
          if (!runningTypes.includes(activity.type)) {
            return;
          }
          if (!activity.date) {
            return;
          }
          const date = parseLocalDate(activity.date);
          const weekStart = new Date(date);
          const day = weekStart.getDay(); // Sun=0, Mon=1, ... Sat=6
          const daysFromMonday = day === 0 ? 6 : day - 1;
          weekStart.setDate(weekStart.getDate() - daysFromMonday);
          weekStart.setHours(0, 0, 0, 0);
          const key = weekStart.toISOString().split("T")[0];
          if (!weeklyData[key]) {
            weeklyData[key] = {
              target: 0,
              actual: 0,
            };
          }
          weeklyData[key].target += parseFloat(activity.targetDistance) || 0;
          weeklyData[key].actual += parseFloat(activity.actualDistance) || 0;
        });
        const weeks = Object.keys(weeklyData).sort();
        const labels = weeks.map(
          (week) =>
            `W/C ${new Date(week).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}`,
        );
        const targetData = weeks.map((week) => weeklyData[week].target);
        const actualData = weeks.map((week) => weeklyData[week].actual);
        if (distanceChart) {
          distanceChart.destroy();
        }
        distanceChart = new Chart(document.getElementById("distanceChart"), {
          type: "bar",
          data: {
            labels,
            datasets: [
              {
                label: "Target km",
                data: targetData,
                backgroundColor: "#93c5fd",
              },
              {
                label: "Actual km",
                data: actualData,
                backgroundColor: "#2563eb",
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "bottom",
              },
            },
            scales: {
              y: {
                beginAtZero: true,
              },
            },
          },
        });
      }
      // -----------------------------------------------------------------------------
// FITNESS METRIC CALCULATIONS AND HEALTH SCORE
// -----------------------------------------------------------------------------
function getMetricCount(
    metricType
) {

    const fitness =
        getFitnessMetrics();

    return fitness.observations.filter(
        o =>
            o.metricType ===
            metricType
    ).length;
}
function formatMetricDate(
    dateString
) {

    return new Date(
        dateString
    ).toLocaleDateString(
        "en-GB",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}
function calculateEnduranceScore() {

    const latest =
        getLatestMetric(
            "endurance"
        );

    return latest
        ? latest.value
        : 0;
}

function getEnduranceColour(score) {

    if (score >= 6000)
        return "#16a34a";

    if (score >= 5800)
        return "#2563eb";

    if (score >= 5500)
        return "#f59e0b";

    return "#dc2626";
}

function getEnduranceLabel(score) {

    if (score >= 6000)
        return "Excellent";

    if (score >= 5800)
        return "Good";

    if (score >= 5500)
        return "Building";

    return "Low";
}

function getTrainingGuidance(readiness, acwr) {
    return {
        title: "Training Guidance",
        advice: "Continue training.",
        colour: "#2563eb"
    };
}
function calculateMetricTrend(metricType, periodsBack = 1) {
    const fitness = getFitnessMetrics();

    const records = fitness.observations
        .filter(o =>
            o.metricType === metricType &&
            Number.isFinite(Number(o.value))
        )
        .sort((a, b) =>
            new Date(a.date || a.timestamp) -
            new Date(b.date || b.timestamp)
        );

    if (records.length <= periodsBack) {
        return null;
    }

    const latest = Number(records.at(-1).value);
    const previous = Number(records.at(-(periodsBack + 1)).value);

    const delta = latest - previous;

    return {
        delta,
        latest,
        previous,
        icon: delta > 0 ? "▲" : delta < 0 ? "▼" : "►",
        css:
            delta > 0
                ? "#16a34a"
                : delta < 0
                ? "#dc2626"
                : "#64748b",
        text:
            delta > 0
                ? `+${delta.toFixed(1)}`
                : delta.toFixed(1)
    };
}
function getMetricAverage(metricType, days = 30) {
    const fitness = getFitnessMetrics();

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const values = fitness.observations
        .filter(o =>
            o.metricType === metricType &&
            o.value != null &&
            !Number.isNaN(Number(o.value)) &&
            new Date(o.timestamp || o.date) >= cutoff
        )
        .map(o => Number(o.value));

    if (!values.length) {
        return null;
    }

    return values.reduce((a, b) => a + b, 0) / values.length;
}
function renderTrend(trend) {
    if (!trend) {
        return "";
    }

    return `
        <div style="
            margin-top:6px;
            font-size:0.85rem;
            font-weight:700;
            color:${trend.css};
        ">
            ${trend.icon} ${trend.text}
        </div>
    `;
}
function calculateHealthScore() {

    const hrv = getLatestMetric("hrv");
    const hr = getLatestMetric("hr");
    const spo2 = getLatestMetric("spo2");
    const respiration = getLatestMetric("respiration");
    const endurance = getLatestMetric("endurance");

    const baselineHrv = getMetricAverage("hrv", 30);
    const baselineHr = getMetricAverage("hr", 30);
    const baselineSpo2 = getMetricAverage("spo2", 30);
    const baselineRespiration = getMetricAverage("respiration", 30);
    const baselineEndurance = getMetricAverage("endurance", 30);

    const values = [];

    // HRV: higher than baseline is better
    if (hrv?.value != null && baselineHrv) {
        values.push(
            Math.max(
                0,
                Math.min(
                    100,
                    Math.round((hrv.value / baselineHrv) * 100)
                )
            )
        );
    }

    // Resting HR: lower than baseline is better
    if (hr?.value != null && baselineHr) {
        values.push(
            Math.max(
                0,
                Math.min(
                    100,
                    Math.round(
                        100 - ((hr.value - baselineHr) * 5)
                    )
                )
            )
        );
    }

    // SpO2: compare to baseline
    if (spo2?.value != null && baselineSpo2) {
        values.push(
            Math.max(
                0,
                Math.min(
                    100,
                    Math.round((spo2.value / baselineSpo2) * 100)
                )
            )
        );
    }

    // Respiration: closer to baseline is better
    if (respiration?.value != null && baselineRespiration) {
        values.push(
            Math.max(
                0,
                Math.min(
                    100,
                    Math.round(
                        100 -
                        Math.abs(
                            respiration.value - baselineRespiration
                        ) * 10
                    )
                )
            )
        );
    }

    // Endurance: compare to baseline
    if (endurance?.value != null && baselineEndurance) {
        values.push(
            Math.max(
                0,
                Math.min(
                    100,
                    Math.round(
                        (endurance.value / baselineEndurance) * 100
                    )
                )
            )
        );
    }

    if (!values.length) return null;

    return Math.round(
        values.reduce((sum, value) => sum + value, 0) /
        values.length
    );
}
function getHealthLabel(score) {

    if (score == null) {
        return "--";
    }

    if (score >= 80)
        return "Excellent";

    if (score >= 65)
        return "Good";

    if (score >= 50)
        return "Monitor";

    return "Recovery";
}
function getHealthColour(score) {
    if (score == null) return "#64748b";

    if (score >= 80) return "#16a34a";
    if (score >= 60) return "#f59e0b";
    return "#dc2626";
}
// -----------------------------------------------------------------------------
// INSIGHT LIBRARIES AND INSIGHT RENDERING
// -----------------------------------------------------------------------------

const recoveryInsights = {
    positive: [
        "HRV remains above baseline while resting heart rate is stable.",
        "Recovery metrics have improved for three consecutive days.",
        "Training readiness is near peak levels.",
        "Sleep quality remains consistent despite increased workload.",
        "Recovery indicators are recovering faster than expected.",
        "Current recovery trends suggest strong adaptation.",
        "Resting heart rate remains below weekly average.",
        "Sleep, HRV and readiness are aligned.",
        "Recovery capacity remains a key strength.",
        "The balance between stress and recovery remains highly effective."
    ],

    warning: [
        "HRV has softened while training load continues to rise.",
        "Recovery quality has declined over the last three days.",
        "Sleep duration is below monthly average.",
        "Recovery indicators remain positive but below recent highs.",
        "Current sleep patterns suggest a growing recovery gap.",
        "Recent trends indicate increased recovery demand.",
        "Resting heart rate has risen modestly.",
        "Fatigue may be accumulating faster than recovery.",
        "Additional recovery strategies could improve performance."
    ],

    risk: [
        "HRV has fallen significantly below baseline.",
        "Recovery debt appears to be accumulating.",
        "Recent sleep quality trends indicate elevated fatigue risk.",
        "Recovery metrics suggest prioritising rest.",
        "Current recovery status may increase injury risk.",
        "Several recovery markers have moved outside optimal ranges.",
        "Persistent fatigue indicators suggest a recovery day is needed."
    ],

    opportunities: [
        "An additional 30 minutes of sleep may improve recovery.",
        "A low-intensity recovery session could improve readiness.",
        "The next 48 hours are ideal for a key workout.",
        "Prioritising recovery may improve long-term gains.",
        "Current metrics suggest focusing on sleep quality.",
        "Reducing external stress may improve recovery scores.",
        "Recovery improvements remain the fastest route to fitness gains."
    ]
};

const loadInsights = {
    positive: [
        "Workload remains within the optimal adaptation zone.",
        "Load progression is supporting sustainable fitness growth.",
        "Injury risk indicators remain low."
    ],

    warning: [
        "Recent load increase exceeds historical progression rates.",
        "Current training stress is approaching elevated-risk levels.",
        "Monitor recovery closely following recent workload spikes."
    ]
};

const enduranceInsights = {
    positive: [
        "Aerobic fitness is trending upward.",
        "Endurance capacity continues to improve steadily.",
        "Current training block is producing positive aerobic gains."
    ],

    neutral: [
        "Endurance metrics remain stable.",
        "Aerobic development appears to be plateauing.",
        "A new training stimulus may help break the plateau."
    ]
};

const consistencyInsights = {
    positive: [
        "Consistency remains one of your strongest performance drivers.",
        "You are maintaining an excellent training routine.",
        "Regular activity continues to contribute positively to fitness."
    ]
};

// =====================================================
// HELPERS
// =====================================================

function randomInsight(arr) {
    return arr[
        Math.floor(Math.random() * arr.length)
    ];
}

function renderInsightGroup(title, text) {

    const icons = {
        Recovery: "❤️",
        "Training Load": "⚡",
        Endurance: "🏃",
        Consistency: "📅",
        Opportunity: "🎯"
    };

    return `
        <li class="coaching-item">
            <div class="coaching-title">
                <span class="coaching-icon">
                    ${icons[title] || "💡"}
                </span>

                <strong>${title}</strong>
            </div>

            <div class="coaching-text">
                ${text}
            </div>
        </li>
    `;
}

// -----------------------------------------------------------------------------
// FITNESS DASHBOARD: SUMMARY, TRENDS AND COACHING
// -----------------------------------------------------------------------------
function displayFitnessMetrics() {

    const fitness = getFitnessMetrics();
    const healthScore = calculateHealthScore();
// =====================================================
// Dashboard KPI Calculations
// =====================================================

// Use Health Score observations if available,
// otherwise fall back to overall observations.
const scoreHistory = fitness.observations
    .filter(o =>
        o.metricType === "healthScore" ||
        o.metricType === "overall"
    )
    .sort(
        (a, b) =>
            new Date(a.date).getTime() -
            new Date(b.date).getTime()
    );

// Last 7 days
const last7Days =
    scoreHistory.slice(-7);

const avg7Day =
    last7Days.length > 0
        ? Math.round(
              last7Days.reduce(
                  (sum, s) =>
                      sum + Number(s.value || 0),
                  0
              ) / last7Days.length
          )
        : "--";

// Previous 7 days
const previous7Days =
    scoreHistory.slice(-14, -7);

const previous7DayAvg =
    previous7Days.length > 0
        ? previous7Days.reduce(
              (sum, s) =>
                  sum + Number(s.value || 0),
              0
          ) / previous7Days.length
        : null;

const weekDelta =
    previous7DayAvg != null
        ? Math.round(
              avg7Day - previous7DayAvg
          )
        : 0;

const weekDeltaIcon =
    weekDelta > 0
        ? "▲"
        : weekDelta < 0
        ? "▼"
        : "►";

// Last 30 days
const last30Days =
    scoreHistory.slice(-30);

const greenDays =
    last30Days.filter(
        d => Number(d.value) >= 70
    ).length;

const bestScore =
    last30Days.length
        ? Math.max(
              ...last30Days.map(d =>
                  Number(d.value)
              )
          )
        : "--";

const worstScore =
    last30Days.length
        ? Math.min(
              ...last30Days.map(d =>
                  Number(d.value)
              )
          )
        : "--";

const momentum =
    weekDelta > 0
        ? "Improving"
        : weekDelta < 0
        ? "Declining"
        : "Stable";

const momentumColour =
    weekDelta > 0
        ? "#16a34a"
        : weekDelta < 0
        ? "#dc2626"
        : "#64748b";
    
    const healthLabel = getHealthLabel(healthScore);
    const healthColour = getHealthColour(healthScore);

    const latestOverall =
        getLatestObservationOverall();

    const latestVo2 =
        getLatestMetric("vo2Max");

    const latestReadiness =
        getLatestMetric("trainingReadiness");

    const latestLoad =
        getLatestMetric("trainingLoad");

    const latestEndurance =
        getLatestMetric("endurance");
    const latestHrv =
    getLatestMetric("hrv");

const latestHr =
    getLatestMetric("hr");

const latestSpo2 =
    getLatestMetric("spo2");

const latestRespiration =
    getLatestMetric("respiration");

const latestSkinTemp =
    getLatestMetric("skin_temp_c");

    const latestStress =
        getLatestMetric("stress");

    const latestBodyBattery =
    getLatestMetric("bodybattery");
    // -------------------------------------------------
    // DERIVED VALUES
    // -------------------------------------------------
    const trainingReadiness =
        latestReadiness?.value ?? 0;

    const acuteLoad =
        latestLoad?.value ?? 0;

    const chronicLoad =
        latestLoad?.chronicLoad ?? 0;

    const acwr =
        latestLoad?.acwr;

    const enduranceScore =
        calculateEnduranceScore();

    const enduranceColour =
        getEnduranceColour(enduranceScore);

    const enduranceLabel =
        getEnduranceLabel(enduranceScore);

    const vo2Trend =
        calculateMetricTrend("vo2Max");

    const readinessTrend =
        calculateMetricTrend("trainingReadiness");

    const enduranceScoreTrend =
        calculateMetricTrend("endurance");

    const loadTrend =
        calculateMetricTrend("trainingLoad");
// =====================================================
// Chronic Trend
// =====================================================

const chronicRecords =
    fitness.observations
        .filter(
            o =>
                o.metricType === "trainingLoad" &&
                Number.isFinite(
                    Number(o.chronicLoad)
                )
        )
        .sort(
            (a, b) =>
                new Date(a.date) -
                new Date(b.date)
        );

let chronicTrend = null;

if (chronicRecords.length >= 2) {

    const latest =
        Number(
            chronicRecords.at(-1)
                .chronicLoad
        );

    const previous =
        Number(
            chronicRecords.at(-2)
                .chronicLoad
        );

    const delta =
        latest - previous;

    chronicTrend = {
        icon:
            delta > 0
                ? "▲"
                : delta < 0
                ? "▼"
                : "►",

        text:
            delta > 0
                ? `+${delta.toFixed(0)}`
                : delta.toFixed(0),

        css:
            delta > 0
                ? "#16a34a"
                : delta < 0
                ? "#dc2626"
                : "#64748b"
    };
}

    const enduranceDelta =
        calculateMetricTrend(
            "endurance"
        )?.delta ?? 0;

    // =====================================================
    // Endurance Trend
    // =====================================================

    const enduranceRecords =
        fitness.observations
            .filter(
                o => o.metricType === "endurance"
            )
            .sort(
                (a, b) =>
                    new Date(a.date) -
                    new Date(b.date)
            );

    let enduranceTrend =
        "No Trend";

    if (enduranceRecords.length >= 2) {

        const latest =
            enduranceRecords.at(-1).value;

        const previous =
            enduranceRecords.at(-2).value;

        if (latest > previous) {
            enduranceTrend = "Improving";
        }
        else if (latest < previous) {
            enduranceTrend = "Declining";
        }
        else {
            enduranceTrend = "Stable";
        }
    }

    // =====================================================
    // ACWR Status
    // =====================================================

    let acwrColour = "#64748b";
    let acwrLabel = "--";

    if (acwr != null) {

        if (acwr < 0.80) {
            acwrColour = "#2563eb";
            acwrLabel = "Under";
        }
        else if (acwr <= 1.30) {
            acwrColour = "#16a34a";
            acwrLabel = "Optimal";
        }
        else if (acwr <= 1.50) {
            acwrColour = "#f59e0b";
            acwrLabel = "Elevated";
        }
        else {
            acwrColour = "#dc2626";
            acwrLabel = "High Risk";
        }
    }

    // -------------------------------------------------
    // COACHING ENGINE
    // -------------------------------------------------

    const coachingInsights = [];
    const todayScore =
    scoreHistory.at(-1)?.value ??
    healthScore ??
    0;
    let overallCoachingStatus =
        "Building Fitness";

    // Recovery

    let recoveryMessage;

    if (trainingReadiness >= 80) {

        recoveryMessage =
            randomInsight(
                recoveryInsights.positive
            );

    } else if (
        trainingReadiness >= 50
    ) {

        recoveryMessage =
            randomInsight(
                recoveryInsights.warning
            );

    } else {

        recoveryMessage =
            randomInsight(
                recoveryInsights.risk
            );

        overallCoachingStatus =
            "Recovery Recommended";
    }

    // Load

    let loadMessage;

    if (
        acwr >= 0.8 &&
        acwr <= 1.3
    ) {

        loadMessage =
            randomInsight(
                loadInsights.positive
            );

    } else {

        loadMessage =
            randomInsight(
                loadInsights.warning
            );

        if (acwr > 1.3) {
            overallCoachingStatus =
                "Elevated Training Load";
        }
    }

    // Endurance

    const enduranceMessage =
        enduranceDelta > 0
            ? randomInsight(
                  enduranceInsights.positive
              )
            : randomInsight(
                  enduranceInsights.neutral
              );

    // Consistency

    const consistencyMessage =
        randomInsight(
            consistencyInsights.positive
        );

    // Opportunity

    const opportunityMessage =
        randomInsight(
            recoveryInsights.opportunities
        );

    coachingInsights.push(
        renderInsightGroup(
            "Recovery",
            recoveryMessage
        )
    );

    coachingInsights.push(
        renderInsightGroup(
            "Training Load",
            loadMessage
        )
    );

    coachingInsights.push(
        renderInsightGroup(
            "Endurance",
            enduranceMessage
        )
    );

    coachingInsights.push(
        renderInsightGroup(
            "Consistency",
            consistencyMessage
        )
    );

      coachingInsights.push(
        renderInsightGroup(
            "Opportunity",
            opportunityMessage
        )
      );
    

    document.getElementById("fitnessDashboard").innerHTML = `
<div class="dashboard">

<div class="card">
    <div
        class="card-value"
        style="color:${healthColour}"
    >
        ${healthScore ?? "--"}
    </div>

    <div class="card-label">
        Health (${healthLabel})
    </div>
</div>

<div class="card">
    <div
        class="card-value"
        style="color:${momentumColour}"
    >
        ${momentum}
    </div>
    <div class="card-label">
        Momentum
    </div>
    <div class="kpi-meta">
        14-Day Trend
    </div>
</div>
    
    <div class="card">
        <div class="card-value">
            ${trainingReadiness}
        </div>
        <div class="card-label">
            Training Readiness
        </div>
        ${renderTrend(readinessTrend)}
    </div>

    <div class="card">
        <div class="card-value">
            ${acuteLoad}
        </div>
        <div class="card-label">
            Acute Load
        </div>
        ${renderTrend(loadTrend)}
    </div>

    <div class="card">
        <div class="card-value">
            ${chronicLoad}
        </div>
        <div class="card-label">
            Chronic Load
        </div>
        ${chronicTrend ? renderTrend(chronicTrend) : ""}
    </div>

    <div class="card">
        <div class="card-value" style="color:${enduranceColour}">
            ${enduranceScore}
        </div>
        <div class="card-label">
            Endurance (${enduranceLabel})
        </div>
        ${renderTrend(enduranceScoreTrend)}
    </div>
   

</div>
`;

    document.getElementById(
        "fitnessImportStatus"
    ).textContent =
        `${fitness.observations.length} observations loaded`;

    renderTrainingLoadChart();
    renderACWRChart();
    renderEnduranceChart();
    renderFitnessTrendCharts();

    // =====================================================
    // Coaching Card
    // =====================================================

    const existing =
        document.getElementById(
            "coachingInsightsCard"
        );

    if (existing) {
        existing.remove();
    }

    const coachingCard =
        document.createElement("div");

    coachingCard.id =
        "coachingInsightsCard";

    coachingCard.className = "card";

    coachingCard.style.marginTop =
        "20px";

    coachingCard.innerHTML = `
    <!-- Fitness Score Breakdown -->
<div class="top-dashboard-row">
  <div class="card glass-card fitness-breakdown">
    <div class="card-header">
        <h3>Fitness Score Breakdown</h3>
        <span class="trend positive">▲ +4 this week</span>
    </div>

    <div class="score-summary">
        <div class="score-ring">
            <span class="score-value">82</span>
            <span class="score-label">/100</span>
        </div>
        <div>
            <h4>Overall Fitness Score</h4>
            <p>Top 25% benchmark for your age group</p>
        </div>
    </div>

    <div class="breakdown-list">
        <div class="metric-row">
            <span>Activity Consistency</span>
            <span>90</span>
        </div>
        <div class="progress"><div style="width:90%"></div></div>

        <div class="metric-row">
            <span>Cardio Fitness</span>
            <span>78</span>
        </div>
        <div class="progress"><div style="width:78%"></div></div>

        <div class="metric-row">
            <span>Strength Progress</span>
            <span>85</span>
        </div>
        <div class="progress"><div style="width:85%"></div></div>

        <div class="metric-row">
            <span>Recovery & Sleep</span>
            <span>72</span>
        </div>
        <div class="progress"><div style="width:72%"></div></div>

        <div class="metric-row">
            <span>Nutrition Adherence</span>
            <span>77</span>
        </div>
        <div class="progress"><div style="width:77%"></div></div>
    </div>
  </div>


  <!-- Next Actions Panel -->
  <div class="card glass-card next-actions">
    <div class="card-header">
        <h3>Recommended Next Actions</h3>
    </div>

    <div class="action-group high-impact">
        <h4>🟢 High Impact</h4>
        <ul>
            <li>Complete 1 additional cardio session this week</li>
            <li>Increase average sleep to 7.5+ hours</li>
        </ul>
    </div>

    <div class="action-group maintain">
        <h4>🟡 Maintain</h4>
        <ul>
            <li>Keep strength training at 3x per week</li>
            <li>Maintain protein intake goal</li>
        </ul>
    </div>

    <div class="action-group risk">
        <h4>🔴 Risk Area</h4>
        <p>Recovery score has fallen 8% over the last 7 days.</p>
    </div>

    <div class="next-step-banner">
        <strong>Recommended Next Step</strong>
        <p>
            Schedule a 30-minute Zone 2 cardio workout within the
            next 48 hours to potentially increase your score by 2-3 points.
        </p>
    </div>

    <div class="action-buttons">
        <button class="primary-btn">Schedule Workout</button>
        <button>Recovery Plan</button>
        <button>Update Goals</button>
        <button>Weekly Plan</button>
    </div>
  </div>
</div>
        <h3>🧠 Coaching Insights</h3>

        <div style="
            font-size:1.1rem;
            font-weight:700;
            margin-bottom:12px;
            color:${acwrColour};
        ">
            ${overallCoachingStatus}
        </div>

        <ul style="
    line-height:1.8;
    color:#334155;
">
    ${coachingInsights.join("")}
</ul>
    `;
    document
        .getElementById(
            "fitnessImportStatus"
        )
        .insertAdjacentElement(
            "afterend",
            coachingCard
        );
      }
      window.addEventListener("beforeunload", function (event) {
        if (hasUnsavedActivityChanges()) {
          event.preventDefault();
          event.returnValue = "";
        }
      });
      document
        .getElementById("diarySection")
        .addEventListener("toggle", function () {
          if (this.open) {
            setActiveNavButton("navDiary");
          }
        });
      document.getElementById("diaryDate").value = getLocalDateString();
      toggleRunFields();
      displayActivities();
      displayWeeklyDashboard();
      displayRoute();
      displayRaceOutcome();
      displayReview();
      displayCurrentEvent();
      displayDiaryEntries();
      displayAnalytics();
      cleanFitnessObservations();
      displayFitnessMetrics();
      updateLastSyncDisplay();

if (
    localStorage.getItem(
        "githubToken"
    )
) {
    document.getElementById(
        "cloudStatus"
    ).textContent =
        "☁ Connected";
}
      refreshCloudStatus();
      updatePhaseDurations();
      validateTrainingPhases();
