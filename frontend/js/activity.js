window.ActivityTracker = (() => {
    let mouseMoves = 0;
    let activityInterval = null;
    let idleStart = null;
    let totalBreakTime = 0; // minutes
    let dailyPattern = []; // counts per minute

    const IDLE_THRESHOLD = 3 * 60 * 1000; // 3 minutes in ms

    function trackMove() {
        mouseMoves++;

        // If we were idling, check how long it's been
        if (idleStart) {
            const idleDuration = Date.now() - idleStart;
            if (idleDuration >= IDLE_THRESHOLD) {
                totalBreakTime += idleDuration / (60 * 1000);
                console.log(`Break detected: ${idleDuration / (60 * 1000)} mins`);
            }
            idleStart = null;
            updateStatus('active');
        }
    }

    function recordActivity() {
        dailyPattern.push(mouseMoves);

        // Check for idle
        if (mouseMoves === 0) {
            if (!idleStart) {
                idleStart = Date.now();
                updateStatus('idle');
            }
        } else {
            mouseMoves = 0; // Reset for next minute
        }
    }

    function updateStatus(status) {
        const badge = document.getElementById('tracking-status');
        if (!badge) return;

        badge.innerText = status.charAt(0).toUpperCase() + status.slice(1);
        badge.className = `status-badge ${status}`;
    }

    return {
        start: () => {
            if (activityInterval) return;

            document.addEventListener('mousemove', trackMove);
            activityInterval = setInterval(recordActivity, 60 * 1000); // Record every minute
            console.log('Activity tracking started');
            updateStatus('active');
        },
        stop: () => {
            document.removeEventListener('mousemove', trackMove);
            clearInterval(activityInterval);
            activityInterval = null;
        },
        getPatterns: () => dailyPattern,
        getBreakTime: () => Math.round(totalBreakTime * 10) / 10,
        reset: () => {
            dailyPattern = [];
            totalBreakTime = 0;
            mouseMoves = 0;
        }
    };
})();
