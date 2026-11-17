export function restoreHistory(draft, currentSnapshot, cleanSnapshot, maxEntries) {
    const savedEntries = draft?.history;
    const snapshots = Array.isArray(savedEntries)
        ? savedEntries
            .map((entry) => cleanSnapshot(entry?.snapshot ?? entry))
            .filter(Boolean)
            .slice(-maxEntries)
        : [];
    const savedIndex = Number.isInteger(draft?.historyIndex) ? draft.historyIndex : -1;

    const hasValidCurrentSnapshot = snapshots.length > 0
        && savedIndex >= 0
        && savedIndex < snapshots.length
        && sameSnapshot(snapshots[savedIndex], currentSnapshot);

    if (hasValidCurrentSnapshot) {
        return { snapshots, index: savedIndex };
    }

    return { snapshots: [currentSnapshot], index: 0 };
}

export function addSnapshot(history, snapshot, maxEntries) {
    const currentSnapshot = history.snapshots[history.index];
    if (currentSnapshot && sameSnapshot(currentSnapshot, snapshot)) {
        return;
    }

    history.snapshots = history.snapshots.slice(0, history.index + 1);
    history.snapshots.push(snapshot);
    if (history.snapshots.length > maxEntries) {
        history.snapshots.shift();
    }
    history.index = history.snapshots.length - 1;
}

export function moveHistory(history, distance) {
    const nextIndex = history.index + distance;
    if (nextIndex < 0 || nextIndex >= history.snapshots.length) {
        return null;
    }

    history.index = nextIndex;
    return history.snapshots[history.index];
}

function sameSnapshot(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
}
