// -----------------------------------------------------------------------------
// FITNESS DATA: STORAGE, GARMIN IMPORTS AND OBSERVATIONS
// -----------------------------------------------------------------------------
function importGarminMetrics() {

    const file =
        document
            .getElementById(
                "fitnessImport"
            )
            .files[0];

    if (!file) {
        return;
    }

    const reader =
        new FileReader();

    reader.onload = function (e) {

        try {

            const data =
                JSON.parse(
                    e.target.result
                );

            detectGarminFileType(
                data,
                file.name
            );

        }
        catch (error) {
    console.error(error);

    alert(
        "Import failed:\n\n" +
        error.message
    );
}
    };

    reader.readAsText(file);
}
function detectGarminFileType(
    data,
    fileName
) {
// Endurance Score
if (
    Array.isArray(data) &&
    data.length > 0 &&
    data[0].overallScore !== undefined &&
    data[0].classification !== undefined &&
    data[0].enduranceScoreContributor !== undefined
) {
    processEnduranceImport(
        data,
        fileName
    );
    return;
}
    if (
        !Array.isArray(data) ||
        !data.length
    ) {
        alert(
            "Unsupported Garmin file."
        );
        return;
    }

    const sample = data[0];

    if (
        sample.vo2MaxValue !==
        undefined
    ) {
        processVo2MaxImport(
            data,
            fileName
        );
        return;
    }

    if (
        sample.dailyTrainingLoadAcute !==
        undefined
    ) {
        processTrainingLoadImport(
            data,
            fileName
        );
        return;
    }

    if (
        sample.score !== undefined &&
        sample.calendarDate
    ) {
        processTrainingReadinessImport(
            data,
            fileName
        );
        return;
    }
    if (
    sample.overallScore !== undefined
) {
    processEnduranceImport(
        data,
        fileName
    );
    return;
}
    if (
        sample.restingHeartRate !==
        undefined
    ) {
        processRestingHeartRateImport(
            data,
            fileName
        );
        return;
    }
    if (
    Array.isArray(data) &&
    data.length > 0 &&
    data[0].calendarDate &&
    Array.isArray(data[0].metrics)
) {
    processHealthStatusImport(
        data,
        fileName
    );
    return;
}

    console.log(sample);
    console.log(Object.keys(sample));

    alert(
        "Unknown Garmin export format. " +
        "Open Dev Tools and inspect the console."
    );
}
function importEnduranceScore(data) {
    if (!Array.isArray(data)) return [];

    return data
        .filter(item =>
            item.calendarDate &&
            item.overallScore !== undefined
        )
        .map(item => ({
            date: new Date(item.calendarDate),
            value: item.overallScore,
            classification: item.classification,
            feedbackPhrase: item.feedbackPhrase,
            deviceId: item.deviceId,
            contributors: item.enduranceScoreContributor || []
        }))
        .sort((a, b) => a.date - b.date);
}
function normaliseEnduranceScore(score) {
    return Math.max(
        0,
        Math.min(
            100,
            Math.round(((score - 3000) / 3000) * 100)
        )
    );
}
function getLatestObservationOverall() {
    const fitness =
        getFitnessMetrics();

    return fitness.observations
        .sort(
            (a, b) =>
                new Date(
                    b.timestamp || b.date
                ) -
                new Date(
                    a.timestamp || a.date
                )
        )[0];
}
function getLatestMetric(metricType) {
    const fitness = getFitnessMetrics();

    return fitness.observations
        .filter(o =>
            o.metricType === metricType &&
            o.value !== null &&
            o.value !== undefined &&
            !Number.isNaN(Number(o.value))
        )
        .sort(
            (a, b) =>
                new Date(b.timestamp || b.date) -
                new Date(a.timestamp || a.date)
        )[0];
}
function processVo2MaxImport(data, fileName = "") {
  if (!Array.isArray(data)) {
    alert("Unexpected Garmin VO2 Max format.");
    return;
  }

  const fitness = getFitnessMetrics();
  let imported = 0;
  let updated = 0;
  let skipped = 0;

  // Remove the single bad record the old importer could create
  // when activityId was missing.
  fitness.observations = fitness.observations.filter(
    o => !(o.metricType === "vo2Max" &&
           o.id === "garmin-vo2max-undefined")
  );

  data.forEach(record => {
    const value = Number(record.vo2MaxValue);
    const date = record.calendarDate;

    if (
      record.vo2MaxValue == null ||
      !date ||
      !Number.isFinite(value)
    ) {
      skipped++;
      return;
    }

    const sport = String(record.sport || "").toUpperCase();
    const subSport = String(record.subSport || "").toUpperCase();
    const deviceId = record.deviceId || "unknown";

    // Keep the existing ID format for activity records.
    // Use stable date/sport/device fields for daily MetricsMaxMetData records.
    const id = record.activityId != null
      ? `garmin-vo2max-${record.activityId}`
      : `garmin-vo2max-${date}-${sport}-${subSport}-${deviceId}`;

    const observation = {
      id,
      metricType: "vo2Max",
      source: "Garmin",
      timestamp:
        record.timestampGmt ||
        record.timestamp ||
        record.updateTimestamp ||
        date,
      date,
      value,
      sport,
      subSport,
      activityId: record.activityId ?? null,
      deviceId: record.deviceId ?? null
    };

    const existingIndex = fitness.observations.findIndex(
      item => item.id === id
    );

    if (existingIndex >= 0) {
      fitness.observations[existingIndex] = observation;
      updated++;
    } else {
      fitness.observations.push(observation);
      imported++;
    }
  });

  fitness.imports.push({
    importDate: new Date().toISOString(),
    source: "Garmin VO2 Max",
    sourceFile: fileName,
    recordCount: data.length
  });

  saveFitnessMetrics(fitness);
  displayFitnessMetrics();

  alert(
    `${imported} new VO2 records imported\n` +
    `${updated} existing records updated\n` +
    `${skipped} records skipped`
  );
}
function processTrainingReadinessImport(
    data,
    fileName
) {
    const fitness =
        getFitnessMetrics();

    let imported = 0;
    let skipped = 0;

    data.forEach(record => {

        const score =
            Number(record.score);

        if (
            record.score == null ||
            !Number.isFinite(score)
        ) {
            skipped++;
            return;
        }

        const id =
            `garmin-readiness-${
                record.timestamp ||
                record.timestampGmt
            }-${
                record.deviceId
            }`;

        const observation = {
            id,
            metricType:
                "trainingReadiness",
            source:
                "Garmin",
            timestamp:
                record.timestamp ||
                record.timestampGmt,
            date:
                record.calendarDate,
            value:
                score,
            deviceId:
                record.deviceId
        };

        const existingIndex =
            fitness.observations.findIndex(
                o => o.id === id
            );

        if (existingIndex >= 0) {
            fitness.observations[
                existingIndex
            ] = observation;

            skipped++;
            return;
        }

        fitness.observations.push(
            observation
        );

        imported++;
    });

    fitness.imports.push({
        importDate:
            new Date().toISOString(),
        source:
            "Garmin Training Readiness",
        sourceFile:
            fileName,
        recordCount:
            data.length
    });

    saveFitnessMetrics(
        fitness
    );

    displayFitnessMetrics();

    alert(
        `${imported} readiness records imported\n` +
        `${skipped} duplicates skipped`
    );
}

      function getFitnessMetrics() {

    return (
    safeJsonParse(
        safeStorageGet("fitnessMetrics")
    ) || {
        schemaVersion: "1.0",
        imports: [],
        observations: []
    }
);
}
function processTrainingLoadImport(
    data,
    fileName
) {

    const fitness =
        getFitnessMetrics();

    let imported = 0;
    let skipped = 0;

    data.forEach(record => {

        const id =
    `garmin-load-${
        record.calendarDate
    }-${
        record.deviceId || "unknown"
    }`;

        const exists =
            fitness.observations.some(
                o => o.id === id
            );

        if (exists) {
            skipped++;
            return;
        }

        const acute = Number(
    record.dailyTrainingLoadAcute
);

if (!Number.isFinite(acute)) {
    skipped++;
    return;
}

const observation = {
    id,
    metricType: "trainingLoad",
    source: "Garmin",
    timestamp: new Date(record.timestamp).toISOString(),
    date: record.calendarDate,
    value: acute,
    chronicLoad: Number(record.dailyTrainingLoadChronic),
    acwr: Number(record.dailyAcuteChronicWorkloadRatio),
    deviceId: record.deviceId
};

        fitness.observations.push(
            observation
        );

        imported++;
    });

    fitness.imports.push({

        importDate:
            new Date().toISOString(),

        source:
            "Garmin Training Load",

        sourceFile:
            fileName,

        recordCount:
            data.length
    });

    saveFitnessMetrics(
        fitness
    );

    displayFitnessMetrics();

    alert(
        `${imported} training load records imported\n` +
        `${skipped} duplicates skipped`
    );
}
function processEnduranceImport(
    data,
    fileName
) {
    const fitness =
        getFitnessMetrics();

    let imported = 0;
    let skipped = 0;

    data.forEach(record => {

        const score =
            Number(record.overallScore);

        if (
            record.overallScore == null ||
            !Number.isFinite(score)
        ) {
            skipped++;
            return;
        }

        const id =
            `garmin-endurance-${
                record.calendarDate
            }-${
                record.deviceId || "unknown"
            }`;

        const observation = {
            id,
            metricType: "endurance",
            source: "Garmin",
            timestamp:
                record.timestamp ||
                record.timestampGmt,
            date:
                record.calendarDate,
            value: score,
            classification:
                record.classification,
            feedbackPhrase:
                record.feedbackPhrase,
            deviceId:
                record.deviceId
        };

        const existingIndex =
            fitness.observations.findIndex(
                o => o.id === id
            );

        if (existingIndex >= 0) {
            fitness.observations[
                existingIndex
            ] = observation;

            skipped++;
            return;
        }

        fitness.observations.push(
            observation
        );

        imported++;
    });

    fitness.imports.push({
        importDate:
            new Date().toISOString(),
        source:
            "Garmin Endurance",
        sourceFile:
            fileName,
        recordCount:
            data.length
    });

    saveFitnessMetrics(
        fitness
    );

    displayFitnessMetrics();

    alert(
        `${imported} endurance records imported\n` +
        `${skipped} duplicates skipped`
    );
}
function processHealthStatusImport(
    data,
    fileName
) {
    const fitness =
        getFitnessMetrics();

    let imported = 0;
    let skipped = 0;

    data.forEach(record => {

        if (
            !record.calendarDate ||
            !Array.isArray(record.metrics)
        ) {
            skipped++;
            return;
        }

        record.metrics.forEach(metric => {

            const value =
                Number(
                    metric.value
                );

            if (
                !Number.isFinite(value)
            ) {
                return;
            }

            const metricType =
                (
                    metric.type || ""
                )
                .toLowerCase();

            const id =
                `health-${metricType}-${record.calendarDate}`;

            const observation = {
                id,
                metricType,
                source: "Garmin",
                date: record.calendarDate,
                timestamp:
                    record.calendarDate,
                value
            };

            const existing =
                fitness.observations
                    .findIndex(
                        o => o.id === id
                    );

            if (existing >= 0) {

                fitness.observations[
                    existing
                ] = observation;

            } else {

                fitness.observations.push(
                    observation
                );

                imported++;
            }
        });
    });

    fitness.imports.push({
        importDate:
            new Date().toISOString(),
        source:
            "Garmin Health Status",
        sourceFile:
            fileName,
        recordCount:
            data.length
    });

    saveFitnessMetrics(
        fitness
    );

    displayFitnessMetrics();

    alert(
        `${imported} health observations imported\n${skipped} skipped`
    );
}
// -----------------------------------------------------------------------------
// FITNESS CHARTS: ACWR, ENDURANCE, VO₂ MAX, HRV, RESTING HR AND SPO₂
// -----------------------------------------------------------------------------
// ACWR ANALYSIS
// -----------------------------------------------------------------------------
// ACWR ANALYSIS CHART
// -----------------------------------------------------------------------------
function renderACWRChart() {

    const fitness = getFitnessMetrics();

    const records = fitness.observations
        .filter(o => o.metricType === "trainingLoad")
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (!records.length) {
        return;
    }

    const labels = records.map(r =>
        formatMetricDate(r.date)
    );

    const acwr = records.map(r =>
        r.acwr
    );

    if (acwrChart) {
        acwrChart.destroy();
    }

    acwrChart = new Chart(
        document.getElementById("acwrChart"),
        {
            type: "line",

            data: {
                labels,

                datasets: [
                    {
                        label: "ACWR",
                        data: acwr,
                        borderWidth: 3,
                        tension: 0.3,

                        pointRadius: ctx =>
                            ctx.dataIndex ===
                            ctx.dataset.data.length - 1 ? 6 : 0,

                        pointHoverRadius: ctx =>
                            ctx.dataIndex ===
                            ctx.dataset.data.length - 1 ? 8 : 0,

                        pointHitRadius: ctx =>
                            ctx.dataIndex ===
                            ctx.dataset.data.length - 1 ? 10 : 0,

                        pointBackgroundColor: acwr.map(value => {
                            if (value < 0.8) return "#2563eb";
                            if (value <= 1.3) return "#16a34a";
                            if (value <= 1.5) return "#f59e0b";
                            return "#dc2626";
                        }),

                        pointBorderColor: "#ffffff",
                        pointBorderWidth: 2,

                        segment: {
                            borderColor: ctx => {

                                const value =
                                    ctx.p0.parsed.y;

                                if (value < 0.8)
                                    return "#2563eb";

                                if (value <= 1.3)
                                    return "#16a34a";

                                if (value <= 1.5)
                                    return "#f59e0b";

                                return "#dc2626";
                            }
                        }
                    }
                ]
            },

            options: {
                responsive: true,

                maintainAspectRatio: false,

                interaction: {
                    mode: "index",
                    intersect: false
                },

                plugins: {
                    legend: {
                        position: "bottom",
                        display: false
                    },

                    annotation: {
                        annotations: {

                            underZone: {
                                type: "box",
                                yMin: 0,
                                yMax: 0.8,
                                backgroundColor:
                                    "rgba(37,99,235,0.08)",
                                borderWidth: 0
                            },

                            optimalZone: {
                                type: "box",
                                yMin: 0.8,
                                yMax: 1.3,
                                backgroundColor:
                                    "rgba(34,197,94,0.08)",
                                borderWidth: 0
                            },

                            elevatedZone: {
                                type: "box",
                                yMin: 1.3,
                                yMax: 1.5,
                                backgroundColor:
                                    "rgba(245,158,11,0.08)",
                                borderWidth: 0
                            },

                            riskZone: {
                                type: "box",
                                yMin: 1.5,
                                yMax: 2,
                                backgroundColor:
                                    "rgba(239,68,68,0.08)",
                                borderWidth: 0
                            },

                            detrainingLine: {
                                type: "line",
                                yMin: 0.8,
                                yMax: 0.8,
                                borderColor: "#3b82f6",
                                borderDash: [6, 6],
                                borderWidth: 2
                            },

                            optimalLine: {
                                type: "line",
                                yMin: 1.3,
                                yMax: 1.3,
                                borderColor: "#22c55e",
                                borderDash: [6, 6],
                                borderWidth: 2
                            },

                            riskLine: {
                                type: "line",
                                yMin: 1.5,
                                yMax: 1.5,
                                borderColor: "#ef4444",
                                borderDash: [6, 6],
                                borderWidth: 2
                            }
                        }
                    }
                },

                scales: {
                    y: {
                        min: 0,
                        max: 2,

                        title: {
                            display: true,
                            text: "ACWR"
                        },

                        ticks: {
  stepSize: 0.25,
  callback(value) {
    return Number(value).toFixed(2);
  }
}
                    }
                }
            }
        }
    );
}

// TRAINING LOAD CHART
      function renderTrainingLoadChart() {

    const fitness = getFitnessMetrics();

    const records = fitness.observations
        .filter(o => o.metricType === "trainingLoad")
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (!records.length) {
        return;
    }

    const labels = records.map(r =>
        formatMetricDate(r.date)
    );

    const acute = records.map(r => r.value);

    const chronic = records.map(r =>
        r.chronicLoad
    );
    const fitnessTrend = [];
const upperBand = [];
const lowerBand = [];

records.forEach(record => {
    const currentDate = new Date(record.date);

    let weightedSum = 0;
    let totalWeight = 0;

    const window = [];

    records.forEach(r => {
        const date = new Date(r.date);

        const daysAgo =
            (currentDate - date) / (1000 * 60 * 60 * 24);

        if (daysAgo >= 0 && daysAgo <= 90) {
            const weight = Math.exp(-daysAgo / 30);

            weightedSum += r.chronicLoad * weight;
            totalWeight += weight;

            window.push({
                value: r.chronicLoad,
                weight
            });
        }
    });

    const mean = weightedSum / totalWeight;

    let variance = 0;

    window.forEach(item => {
        variance +=
            item.weight *
            Math.pow(item.value - mean, 2);
    });

    variance /= totalWeight;

    const sd = Math.sqrt(variance);

    fitnessTrend.push(mean);
    upperBand.push(mean + sd);
    lowerBand.push(mean - sd);
});
    
    const chronicTrend90 = records.map(record => {
    const currentDate = new Date(record.date);

    let weightedSum = 0;
    let totalWeight = 0;

    records.forEach(r => {
        const date = new Date(r.date);

        const daysAgo =
            (currentDate - date) / (1000 * 60 * 60 * 24);

        if (daysAgo >= 0 && daysAgo <= 90) {
            const weight = Math.exp(-daysAgo / 30);

            weightedSum += r.chronicLoad * weight;
            totalWeight += weight;
        }
    });

    return totalWeight
        ? weightedSum / totalWeight
        : null;
});

    if (trainingLoadChart) {
        trainingLoadChart.destroy();
    }

    trainingLoadChart = new Chart(
        document.getElementById("trainingLoadChart"),
        {
            type: "line",

            data: {
                labels,

                datasets: [
    {
        label: "Acute Load",
        data: acute,
        borderColor: "#2563eb",
        backgroundColor: "rgba(37,99,235,.08)",
        borderWidth: 4,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 6,
        fill: true
    },
    {
        label: "Chronic Load",
        data: chronic,
        borderColor: "#16a34a",
        backgroundColor: "rgba(22,163,74,.10)",
        borderWidth: 3,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 6,
        fill: true
    },
    {
        label: "Upper Band",
        data: upperBand,
        borderColor: "rgba(0,0,0,0)",
        backgroundColor: "rgba(107,114,128,0.2)",
        borderWidth: 0,
        pointRadius: 0,
        fill: "+1"
    },
    {
        label: "Lower Band",
        data: lowerBand,
        borderColor: "rgba(0,0,0,0)",
        borderWidth: 0,
        pointRadius: 0,
        fill: false
    },
        {
        label: "Fitness Trend",
        data: fitnessTrend,
        borderColor: "#374151",
        borderWidth: 2,
        borderDash: [8, 4],
        tension: 0.4,
        pointRadius: 0,
        fill: false,
        order: 0
    }
    ]
            },

            options: {
                responsive: true,

                maintainAspectRatio: false,

                interaction: {
                    mode: "index",
                    intersect: false
                },

                plugins: {
    legend: {
        position: "bottom"
    },

    tooltip: {
    callbacks: {
        label(context) {
            return `${context.dataset.label}: ${Math.round(
                context.raw
            ).toLocaleString()}`;
        }
    }
}
},

                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: "Training Load"
                        }
                    }
                }
            }
        }
    );
}

// ENDURANCE AND HEALTH METRIC CHARTS
function renderEnduranceChart() {

    const fitness =
        getFitnessMetrics();

    const records =
    fitness.observations
        .filter(
            o =>
                o.metricType ===
                    "endurance" &&
                Number.isFinite(
                    o.value
                )
        )
        .sort(
            (a, b) =>
                new Date(a.date) -
                new Date(b.date)
        );

    if (!records.length) {
        return;
    }

    if (enduranceChart) {
        enduranceChart.destroy();
    }

    enduranceChart =
        new Chart(
            document.getElementById(
                "enduranceChart"
            ),
            {
                type: "line",

                data: {
                    labels:
                        records.map(
                            r =>
                                formatMetricDate(
                                    r.date
                                )
                        ),

                    datasets: [{
  label: "Endurance Score",

  data: records.map(r => r.value),

  borderColor: "#7c3aed",
  backgroundColor: "rgba(124,58,237,.1)",
  tension: 0.3,

  pointRadius: 3,
  pointHoverRadius: 6,

  pointBackgroundColor: records.map(r =>
    getEnduranceColour(Number(r.value))
  ),
  pointBorderColor: "#ffffff",
  pointBorderWidth: 2,

  segment: {
    borderColor: ctx =>
      getEnduranceColour(Number(ctx.p1.parsed.y))
  }
}]
                },

                options: {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
  legend: {
    display: false
  },
    annotation: {
      annotations: {
        buildingLine: {
          type: "line",
          yMin: 5500,
          yMax: 5500,
          borderColor: "#f59e0b",
          borderDash: [6, 6],
          borderWidth: 1
        },
        goodLine: {
          type: "line",
          yMin: 5800,
          yMax: 5800,
          borderColor: "#2563eb",
          borderDash: [6, 6],
          borderWidth: 1
        },
        excellentLine: {
          type: "line",
          yMin: 6000,
          yMax: 6000,
          borderColor: "#16a34a",
          borderDash: [6, 6],
          borderWidth: 1
        }
      }
    },
    tooltip: {
      callbacks: {
        label: context => {
          const value = Number(context.parsed.y);
          return `Endurance: ${value} (${getEnduranceLabel(value)})`;
        }
      }
    }
    },

    scales: {
    y: {
      title: {
        display: true,
        text: "Endurance Score"
      },
      min: 5600,
      suggestedMax: 6000
    }
    } 
  }
            }
        );
}
function renderFitnessTrendChart(config) {
  const fitness = getFitnessMetrics();
  const canvas = document.getElementById(config.canvasId);
  const latestElement = document.getElementById(config.latestId);

  if (!canvas || !latestElement) {
    return;
  }

  const records = fitness.observations
    .filter(observation => {
      if (observation.metricType !== config.metricType) {
        return false;
      }

      if (
        config.filter &&
        !config.filter(observation)
      ) {
        return false;
      }

      const value = Number(observation.value);
      const date = new Date(
        observation.timestamp || observation.date
      );

      return (
        observation.value != null &&
        Number.isFinite(value) &&
        Number.isFinite(date.getTime())
      );
    })
    .map(observation => ({
      ...observation,
      chartDate: new Date(
        observation.timestamp || observation.date
      ),
      chartValue: Number(observation.value)
    }))
    .sort((a, b) => a.chartDate - b.chartDate);

  if (fitnessTrendCharts[config.canvasId]) {
    fitnessTrendCharts[config.canvasId].destroy();
    delete fitnessTrendCharts[config.canvasId];
  }

  if (!records.length) {
    latestElement.textContent = "No observations loaded";
    return;
  }

  const latest = records[records.length - 1];
  const numberFormat = new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 1
  });

  latestElement.textContent =
    `${numberFormat.format(latest.chartValue)} ${config.unit} · ` +
    formatMetricDate(latest.date || latest.timestamp);

  const crossesYear =
    records[0].chartDate.getFullYear() !==
    latest.chartDate.getFullYear();

  fitnessTrendCharts[config.canvasId] = new Chart(canvas, {
    type: "line",

    data: {
      datasets: [{
        label: config.title,
        data: records.map(record => ({
          x: record.chartDate.getTime(),
          y: record.chartValue
        })),
        borderColor: config.color,
        backgroundColor: config.color,
        borderWidth: 2,
        tension: 0.15,
        fill: false,
        pointRadius: context =>
          context.dataIndex === records.length - 1 ? 4 : 1,
        pointHoverRadius: 5
      }]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "nearest",
        intersect: false
      },

      plugins: {
  vo2ClassificationBands: {
    bands: config.vo2Bands
  },
  legend: {
    display: false
  },
  tooltip: {
    callbacks: {
      title: items => {
        if (!items.length) return "";

        return new Date(items[0].parsed.x).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric"
        });
      },
      label: context =>
        `${config.title}: ` +
        `${numberFormat.format(context.parsed.y)} ${config.unit}`
    }
  }
},

      scales: {
        x: {
          type: "linear",
          ticks: {
            autoSkip: true,
            maxTicksLimit: 8,
            maxRotation: 0,
            callback: value =>
              new Date(Number(value)).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                ...(crossesYear ? { year: "2-digit" } : {})
              })
          }
        },

        y: {
  beginAtZero: false,
  title: {
    display: true,
    text: config.unit
  },
  ...config.yAxis
}
      }
    }
  });
}
// Set these to the profile used for interpreting this chart.
const vo2ClassificationProfile = {
  sex: "male", // "male" or "female"
  age: 33
};

// Garmin's published VO₂ max standard ratings (ml/kg/min).
// Each row contains the minimum values for Fair, Good, Excellent and Superior.
const garminVo2Thresholds = {
  male: [
    { maxAge: 29, fair: 41.7, good: 45.4, excellent: 51.1, superior: 55.4 },
    { maxAge: 39, fair: 40.5, good: 44.0, excellent: 48.3, superior: 54.0 },
    { maxAge: 49, fair: 38.5, good: 42.4, excellent: 46.4, superior: 52.5 },
    { maxAge: 59, fair: 35.6, good: 39.2, excellent: 43.4, superior: 48.9 },
    { maxAge: 69, fair: 32.3, good: 35.5, excellent: 39.5, superior: 45.7 },
    { maxAge: 79, fair: 29.4, good: 32.3, excellent: 36.7, superior: 42.1 }
  ],
  female: [
    { maxAge: 29, fair: 36.1, good: 39.5, excellent: 43.9, superior: 49.6 },
    { maxAge: 39, fair: 34.4, good: 37.8, excellent: 42.4, superior: 47.4 },
    { maxAge: 49, fair: 33.0, good: 36.3, excellent: 39.7, superior: 45.3 },
    { maxAge: 59, fair: 30.1, good: 33.0, excellent: 36.7, superior: 41.1 },
    { maxAge: 69, fair: 27.5, good: 30.0, excellent: 33.0, superior: 37.8 },
    { maxAge: 79, fair: 25.9, good: 28.1, excellent: 30.9, superior: 36.7 }
  ]
};
const vo2ClassificationBandsPlugin = {
  id: "vo2ClassificationBands",

  beforeDatasetsDraw(chart, args, options) {
    const bands = options.bands;
    if (!bands) return;

    const { ctx, chartArea, scales } = chart;
    const y = scales.y;
    if (!chartArea || !y) return;

    const colors = {
      poor:      "rgba(239, 68, 68, 0.10)",
      fair:      "rgba(249, 115, 22, 0.10)",
      good:      "rgba(234, 179, 8, 0.10)",
      excellent: "rgba(34, 197, 94, 0.10)",
      superior:  "rgba(16, 185, 129, 0.12)"
    };

    const ranges = [
      { name: "poor",      from: y.min,            to: bands.fair },
      { name: "fair",      from: bands.fair,       to: bands.good },
      { name: "good",      from: bands.good,       to: bands.excellent },
      { name: "excellent", from: bands.excellent,  to: bands.superior },
      { name: "superior",  from: bands.superior,   to: y.max }
    ];

    ctx.save();
    ctx.beginPath();
    ctx.rect(chartArea.left, chartArea.top, chartArea.width, chartArea.height);
    ctx.clip();

    for (const range of ranges) {
      const top = y.getPixelForValue(Math.min(range.to, y.max));
      const bottom = y.getPixelForValue(Math.max(range.from, y.min));

      if (bottom > top) {
        ctx.fillStyle = colors[range.name];
        ctx.fillRect(chartArea.left, top, chartArea.width, bottom - top);
      }
    }

    ctx.restore();
  }
};
 Chart.register(vo2ClassificationBandsPlugin);
function getGarminVo2Thresholds(sex, age) {
  const rows = garminVo2Thresholds[String(sex).toLowerCase()];
  if (!rows || !Number.isFinite(Number(age)) || Number(age) < 20) return null;

  return rows.find(row => Number(age) <= row.maxAge) || rows[rows.length - 1];
}
const vo2Bands = getGarminVo2Thresholds(
  vo2ClassificationProfile.sex,
  vo2ClassificationProfile.age
);

const vo2YAxis = vo2Bands
  ? {
      min: Math.max(0, Math.floor(vo2Bands.fair - 5)),
      max: Math.ceil(vo2Bands.superior + 5),
      title: {
        display: true,
        text: "VO₂ max (ml/kg/min)"
      }
    }
  : {
      title: {
        display: true,
        text: "VO₂ max (ml/kg/min)"
      }
    };

function renderFitnessTrendCharts() {
  renderFitnessTrendChart({
    canvasId: "vo2TrendChart",
    latestId: "vo2TrendLatest",
    metricType: "vo2Max",
    title: "Running VO₂ Max",
    unit: "ml/kg/min",
    color: "#2563eb",

    // Keep only running VO₂ observations.
    filter: observation =>
      String(observation.sport || "").toUpperCase() === "RUNNING",

    // Pass classification bands and axis limits into the chart renderer.
    vo2Bands,
    yAxis: vo2YAxis
  });

  renderFitnessTrendChart({
    canvasId: "hrvTrendChart",
    latestId: "hrvTrendLatest",
    metricType: "hrv",
    title: "HRV",
    unit: "ms",
    color: "#7c3aed"
  });

  renderFitnessTrendChart({
    canvasId: "hrTrendChart",
    latestId: "hrTrendLatest",
    metricType: "hr",
    title: "Resting Heart Rate",
    unit: "bpm",
    color: "#f59e0b"
  });

  renderFitnessTrendChart({
    canvasId: "spo2TrendChart",
    latestId: "spo2TrendLatest",
    metricType: "spo2",
    title: "SpO₂",
    unit: "%",
    color: "#16a34a"
  });
}
