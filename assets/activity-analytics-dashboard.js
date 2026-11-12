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
function getHealthScoreBreakdown() {
    const definitions = [
        {
            metricType: "hrv",
            label: "HRV",
            unit: "ms",
            score: (value, baseline) => (value / baseline) * 100
        },
        {
            metricType: "hr",
            label: "Resting heart rate",
            unit: "bpm",
            score: (value, baseline) => 100 - ((value - baseline) * 5)
        },
        {
            metricType: "spo2",
            label: "SpO₂",
            unit: "%",
            score: (value, baseline) => (value / baseline) * 100
        },
        {
            metricType: "respiration",
            label: "Respiration",
            unit: "br/min",
            score: (value, baseline) =>
                100 - Math.abs(value - baseline) * 10
        },
        {
            metricType: "endurance",
            label: "Endurance",
            unit: "score",
            score: (value, baseline) => (value / baseline) * 100
        }
    ];

    return definitions.map(definition => {
        const observation = getLatestMetric(definition.metricType);
        const value = observation?.value != null
            ? Number(observation.value)
            : null;
        const baseline = getMetricAverage(definition.metricType, 30);

        let score = null;
        if (
            value != null &&
            Number.isFinite(value) &&
            baseline != null &&
            Number.isFinite(baseline) &&
            baseline > 0
        ) {
            score = Math.max(
                0,
                Math.min(
                    100,
                    Math.round(definition.score(value, baseline))
                )
            );
        }

        return {
            ...definition,
            observation,
            value: Number.isFinite(value) ? value : null,
            baseline: Number.isFinite(baseline) ? baseline : null,
            score
        };
    });
}

function calculateHealthScore(components = getHealthScoreBreakdown()) {
    const scores = components
        .map(component => component.score)
        .filter(score => score != null && Number.isFinite(score));

    if (!scores.length) {
        return null;
    }

    return Math.round(
        scores.reduce((sum, score) => sum + score, 0) / scores.length
    );
}

function formatScoreMetricValue(value) {
    return Number(value).toLocaleString("en-GB", {
        maximumFractionDigits: 1
    });
}

function renderFitnessScoreBreakdown(components, healthScore) {
    const available = components.filter(
        component => component.score != null
    ).length;

    const rows = components.map(component => {
        const scoreText = component.score == null
            ? "—"
            : `${component.score}`;
        const currentText = component.value == null
            ? "No current reading"
            : `${formatScoreMetricValue(component.value)} ${component.unit}`;
        const baselineText = component.baseline == null
            ? "30-day baseline unavailable"
            : `30-day average ${formatScoreMetricValue(component.baseline)} ${component.unit}`;
        const updatedText = component.observation
            ? `Updated ${formatMetricDate(component.observation.timestamp || component.observation.date)}`
            : "No reading imported";
        const width = component.score ?? 0;

        return `
            <div class="score-component">
                <div class="metric-row">
                    <span>${component.label}</span>
                    <strong>${scoreText}</strong>
                </div>
                <div class="score-component-meta">
                    ${currentText} · ${baselineText} · ${updatedText}
                </div>
                <div class="progress" role="progressbar"
                     aria-label="${component.label} score"
                     aria-valuemin="0" aria-valuemax="100"
                     aria-valuenow="${width}">
                    <div style="width:${width}%"></div>
                </div>
            </div>
        `;
    }).join("");

    const scoreValue = healthScore == null ? "—" : healthScore;
    const scoreDescription = healthScore == null
        ? "Import recent readings and build a 30-day baseline to calculate a score."
        : `Average of ${available} available signals, each compared with its 30-day average.`;

    return `
        <section class="card glass-card fitness-breakdown" aria-label="Fitness score breakdown">
            <div class="card-header">
                <h3>Fitness Score Breakdown</h3>
                <span class="score-coverage">${available}/${components.length} signals scored</span>
            </div>
            <div class="score-summary">
                <div class="score-ring"
                     style="--score-progress:${healthScore ?? 0}%;--score-colour:${getHealthColour(healthScore)}">
                    <span class="score-value">${scoreValue}</span>
                    <span class="score-label">/100</span>
                </div>
                <div>
                    <h4>Latest Health Score</h4>
                    <p>${scoreDescription}</p>
                </div>
            </div>
            <div class="breakdown-list">${rows}</div>
            <p class="score-explainer">
                Missing signals are excluded from the average. Scores are capped at 100.
            </p>
        </section>
    `;
}

function isObservationRecent(observation, maxAgeDays) {
    if (!observation) return false;

    const date = new Date(observation.timestamp || observation.date);
    if (!Number.isFinite(date.getTime())) return false;

    const age = Date.now() - date.getTime();
    return age >= 0 && age <= maxAgeDays * 24 * 60 * 60 * 1000;
}

function getWeeklyActivityConsistency() {
    const today = new Date();
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);

    const dueActivities = getCurrentActivities().filter(activity => {
        if (!activity.date) return false;

        const date = parseLocalDate(activity.date) || new Date(activity.date);
        return Number.isFinite(date.getTime()) && date >= start && date <= end;
    });

    const completed = dueActivities.filter(
        activity => activity.completed === "Done"
    ).length;

    return {
        due: dueActivities.length,
        completed,
        unfinished: dueActivities.length - completed,
        percentage: dueActivities.length
            ? Math.round((completed / dueActivities.length) * 100)
            : null
    };
}

function buildRecommendedNextActions({
    healthScore,
    healthComponents,
    readiness,
    trainingLoad,
    consistency
}) {
    const actions = [];
    const readinessValue = readiness?.value != null
        ? Number(readiness.value)
        : null;
    const readinessRecent =
        readinessValue != null &&
        Number.isFinite(readinessValue) &&
        isObservationRecent(readiness, 4);
    const acwrValue = trainingLoad?.acwr != null
        ? Number(trainingLoad.acwr)
        : null;
    const acwrRecent =
        acwrValue != null &&
        Number.isFinite(acwrValue) &&
        isObservationRecent(trainingLoad, 4);
    const recentHealth = healthComponents.filter(
        component =>
            component.score != null &&
            isObservationRecent(component.observation, 7)
    );
    const belowUsual = recentHealth.filter(
        component => component.score < 80
    );
    const add = (rank, label, title, reason) => {
        actions.push({ rank, label, title, reason });
    };
    const dateNote = observation => {
        const date = observation?.timestamp || observation?.date;
        return date ? ` Updated ${formatMetricDate(date)}.` : "";
    };

    if (acwrRecent && acwrValue > 1.5) {
        add(
            1,
            "Priority",
            "Avoid increasing training load",
            `ACWR is ${acwrValue.toFixed(2)}, above the chart's 1.50 high-risk threshold. Keep the next planned session easy or take recovery, then review after fresh load data.${dateNote(trainingLoad)}`
        );
    }

    if (readinessRecent && readinessValue <= 25) {
        add(
            1,
            "Priority",
            "Prioritise recovery today",
            `Garmin Training Readiness is ${Math.round(readinessValue)}/100. Consider an easy or rest day instead of adding intensity.${dateNote(readiness)}`
        );
    }

    if (
        healthScore != null &&
        healthScore < 50 &&
        recentHealth.length >= 3
    ) {
        add(
            1,
            "Priority",
            "Keep the next session conservative",
            `Today's Health Score is ${healthScore}/100 across ${recentHealth.length} recent signals. Check the component readings below and avoid increasing effort until the next update.`
        );
    } else if (
        recentHealth.length >= 3 &&
        belowUsual.length >= 3
    ) {
        add(
            2,
            "Review",
            "Review recovery signals before your next hard session",
            `${belowUsual.map(component => component.label).join(", ")} are below 80 on their personal-baseline scores. Consider an easy session and refresh your readings.`
        );
    }

    if (acwrRecent && acwrValue > 1.3 && acwrValue <= 1.5) {
        add(
            2,
            "Review",
            "Hold off on a further load increase",
            `ACWR is ${acwrValue.toFixed(2)} in the elevated band (1.30–1.50). Keep the next session controlled and check the ratio again after new load data.${dateNote(trainingLoad)}`
        );
    } else if (readinessRecent && readinessValue > 25 && readinessValue < 50) {
        add(
            2,
            "Review",
            "Keep the next workout easy",
            `Garmin Training Readiness is ${Math.round(readinessValue)}/100. Avoid stacking another hard session on top of this reading.${dateNote(readiness)}`
        );
    }

    if (consistency.due >= 3 && consistency.percentage < 60) {
        add(
            2,
            "Plan",
            "Review unfinished sessions from this week",
            `${consistency.completed} of ${consistency.due} activities due in the last seven days are marked Done. Complete a planned session if appropriate, or update/reschedule missed entries in Activity Admin.`
        );
    }

    if (
        acwrRecent && acwrValue < 0.8 &&
        readinessRecent && readinessValue >= 50
    ) {
        add(
            3,
            "Build gradually",
            "Resume progression gradually",
            `ACWR is ${acwrValue.toFixed(2)} (below 0.80) and readiness is ${Math.round(readinessValue)}/100. Follow the planned progression rather than trying to make up missed volume.${dateNote(trainingLoad)}`
        );
    }

    if (
        acwrRecent && acwrValue >= 0.8 && acwrValue <= 1.3 &&
        readinessRecent && readinessValue >= 80 &&
        !actions.some(action => action.rank <= 2)
    ) {
        add(
            3,
            "Maintain",
            "Continue with the planned training session",
            `Readiness is ${Math.round(readinessValue)}/100 and ACWR is ${acwrValue.toFixed(2)}, within the chart's optimal band. Keep the planned session and avoid an unplanned jump in load.${dateNote(readiness)}`
        );
    }

    const missingData = [];
    if (!readinessRecent) missingData.push("recent Training Readiness");
    if (!acwrRecent) missingData.push("recent training-load/ACWR data");
    if (recentHealth.length < 3) missingData.push("three recent health signals");

    if (!actions.length && !missingData.length) {
        add(
            3,
            "Maintain",
            "No immediate change is indicated by the available data",
            "Continue your current plan and review again when the next Garmin readings and activity updates are available."
        );
    }

    if (missingData.length) {
        add(
            4,
            "Data needed",
            "Refresh the data used for recommendations",
            `The app is missing or has old ${missingData.join(", ")}. Import the latest Garmin files so these recommendations reflect current readings.`
        );
    }

    return actions
        .sort((a, b) => a.rank - b.rank)
        .slice(0, 3);
}

function renderRecommendedActions(actions, consistency) {
    const items = actions.map(action => `
        <li class="recommendation-item level-${action.rank}">
            <div class="recommendation-heading">
                <span class="recommendation-level">${action.label}</span>
                <strong>${action.title}</strong>
            </div>
            <p class="recommendation-reason">${action.reason}</p>
        </li>
    `).join("");

    const consistencyText = consistency.due
        ? `Last 7 days: ${consistency.completed}/${consistency.due} due activities marked Done (${consistency.percentage}%).`
        : "No activities were due in the last seven days for the current event.";

    return `
        <section class="card glass-card next-actions" aria-label="Recommended next actions">
            <div class="card-header">
                <h3>Recommended Next Actions</h3>
            </div>
            <ul class="recommendation-list">${items}</ul>
            <p class="recommendation-context">${consistencyText}</p>
            <p class="recommendation-disclaimer">
                Guidance uses current app data and training-load ranges; it is not a medical assessment.
            </p>
        </section>
    `;
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

// =====================================================
// HELPERS
// =====================================================

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

function buildCoachingInsights({ readiness, trainingLoad, enduranceTrend, healthComponents, consistency }) {
    const items = [];
    const recent = (observation, days) => isObservationRecent(observation, days);
    const valueOf = observation => observation?.value != null && Number.isFinite(Number(observation.value))
        ? Number(observation.value)
        : null;
    const dateNote = observation => {
        const date = observation?.timestamp || observation?.date;
        return date ? ` Updated ${formatMetricDate(date)}.` : "";
    };
    const readinessValue = valueOf(readiness);
    const readinessCurrent = readinessValue != null && recent(readiness, 4);
    const acwr = trainingLoad?.acwr != null && Number.isFinite(Number(trainingLoad.acwr))
        ? Number(trainingLoad.acwr)
        : null;
    const loadCurrent = acwr != null && recent(trainingLoad, 4);

    if (!readinessCurrent) {
        items.push(["Recovery", "No recent Training Readiness reading is available; import updated Garmin data to assess recovery."]);
    } else if (readinessValue >= 80) {
        items.push(["Recovery", `Training Readiness is ${Math.round(readinessValue)}/100, in the high band (80+). Use it alongside your plan and how you feel before choosing intensity.${dateNote(readiness)}`]);
    } else if (readinessValue >= 50) {
        items.push(["Recovery", `Training Readiness is ${Math.round(readinessValue)}/100, in the middle band (50–79). Consider keeping intensity controlled if you feel under-recovered.${dateNote(readiness)}`]);
    } else {
        items.push(["Recovery", `Training Readiness is ${Math.round(readinessValue)}/100, below 50. Consider an easy or rest day and reassess after your next update.${dateNote(readiness)}`]);
    }

    if (!loadCurrent) {
        items.push(["Training Load", "No recent ACWR value is available; import updated training-load data to check the load band."]);
    } else if (acwr < 0.8) {
        items.push(["Training Load", `ACWR is ${acwr.toFixed(2)} (Under, below 0.80). If building back, follow the planned progression rather than making up missed volume.${dateNote(trainingLoad)}`]);
    } else if (acwr <= 1.3) {
        items.push(["Training Load", `ACWR is ${acwr.toFixed(2)} (Optimal, 0.80–1.30), within the app's target band.${dateNote(trainingLoad)}`]);
    } else if (acwr <= 1.5) {
        items.push(["Training Load", `ACWR is ${acwr.toFixed(2)} (Elevated, 1.30–1.50). Keep the next load increase controlled and review after fresh data.${dateNote(trainingLoad)}`]);
    } else {
        items.push(["Training Load", `ACWR is ${acwr.toFixed(2)} (High Risk, above 1.50). Avoid adding load until you have reviewed the next planned session.${dateNote(trainingLoad)}`]);
    }

    if (enduranceTrend) {
        const direction = enduranceTrend.delta > 0 ? "up" : enduranceTrend.delta < 0 ? "down" : "unchanged";
        const delta = Math.abs(enduranceTrend.delta).toFixed(0);
        items.push(["Endurance", `Endurance Score is ${Number(enduranceTrend.latest).toLocaleString()} (${direction} ${delta} points versus the previous recorded value).`]);
    } else {
        items.push(["Endurance", "At least two Endurance Score readings are needed to describe a trend."]);
    }

    const recentComponents = healthComponents.filter(component =>
        component.score != null && recent(component.observation, 7)
    );
    if (consistency.due > 0) {
        items.push(["Consistency", `In the last seven days, ${consistency.completed} of ${consistency.due} due activities are marked Done (${consistency.percentage}%).`]);
    } else {
        items.push(["Consistency", "No activities were due in the last seven days for the current event."]);
    }

    const lowest = recentComponents
        .slice()
        .sort((a, b) => a.score - b.score)[0];
    if (lowest) {
        items.push(["Opportunity", `${lowest.label} is the lowest recent health component at ${Math.round(lowest.score)}/100 against its 30-day baseline. Review its latest reading in Fitness Score Breakdown.`]);
    } else {
        items.push(["Opportunity", "Import recent HRV, resting HR, SpO₂, respiration, or endurance readings to identify which signal has the most room to improve."]);
    }

    let status = "Building Fitness";
    if (loadCurrent && acwr > 1.5) status = "High Training Load";
    else if (readinessCurrent && readinessValue < 50) status = "Recovery Recommended";
    else if (loadCurrent && acwr > 1.3) status = "Elevated Training Load";
    else if (readinessCurrent && readinessValue >= 80 && loadCurrent && acwr >= 0.8 && acwr <= 1.3) status = "Ready to Follow the Plan";

    return { items, status };
}

// -----------------------------------------------------------------------------
// FITNESS DASHBOARD: SUMMARY, TRENDS AND COACHING
// -----------------------------------------------------------------------------
function displayFitnessMetrics() {

    const fitness = getFitnessMetrics();
    const healthComponents = getHealthScoreBreakdown();
    const healthScore = calculateHealthScore(healthComponents);
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

    const weeklyConsistency = getWeeklyActivityConsistency();
    const recommendedActions = buildRecommendedNextActions({
        healthScore,
        healthComponents,
        readiness: latestReadiness,
        trainingLoad: latestLoad,
        consistency: weeklyConsistency
    });

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

    const coaching = buildCoachingInsights({
        readiness: latestReadiness,
        trainingLoad: latestLoad,
        enduranceTrend: enduranceScoreTrend,
        healthComponents,
        consistency: weeklyConsistency
    });
    const overallCoachingStatus = coaching.status;
    const coachingInsights = coaching.items.map(([title, text]) =>
        renderInsightGroup(title, text)
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
<div class="top-dashboard-row">
    ${renderFitnessScoreBreakdown(healthComponents, healthScore)}
    ${renderRecommendedActions(recommendedActions, weeklyConsistency)}
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
