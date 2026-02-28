window.ChartEngine = (() => {
    let employeeChart = null;
    let hrBpsChart = null;
    let hrActivityChart = null;

    const chartConfig = {
        responsive: true,
        plugins: {
            legend: { display: false }
        },
        scales: {
            y: { grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { grid: { display: false } }
        }
    };

    return {
        renderEmployeeTrend: (data) => {
            const ctx = document.getElementById('employee-activity-chart').getContext('2d');
            const labels = data.map(d => d.date.split('T')[0]).reverse();
            const bps = data.map(d => d.bps).reverse();

            if (employeeChart) employeeChart.destroy();

            employeeChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'BPS',
                        data: bps,
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.2)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: chartConfig
            });
        },

        initActivityChart: function (canvasId, data = []) {
            const ctx = document.getElementById(canvasId).getContext('2d');

            // If no data, show mockup
            if (data.length === 0) data = [12, 19, 3, 5, 2, 3, 7, 10, 5, 8];

            return new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10'],
                    datasets: [{
                        label: 'Mouse Movement',
                        data: data,
                        backgroundColor: '#6366f1',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: 'rgba(255, 255, 255, 0.5)' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: 'rgba(255, 255, 255, 0.5)' }
                        }
                    }
                }
            });
        },

        renderHRDetail: (history, activityTrend) => {
            const bpsCtx = document.getElementById('hr-employee-bps-chart').getContext('2d');
            const actCtx = document.getElementById('hr-employee-activity-chart').getContext('2d');

            const labels = history.map(h => h.date.split('T')[0]).reverse();
            const bps = history.map(h => h.bps).reverse();

            if (hrBpsChart) hrBpsChart.destroy();
            if (hrActivityChart) hrActivityChart.destroy();

            hrBpsChart = new Chart(bpsCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Burnout Score',
                        data: bps,
                        borderColor: '#f43f5e',
                        backgroundColor: 'rgba(244, 63, 94, 0.2)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: chartConfig
            });

            hrActivityChart = new Chart(actCtx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Activity Volume',
                        data: activityTrend.reverse(),
                        backgroundColor: '#6366f1',
                        borderRadius: 8
                    }]
                },
                options: chartConfig
            });
        }
    };
})();
