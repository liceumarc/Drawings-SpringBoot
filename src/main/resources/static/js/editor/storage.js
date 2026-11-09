// Thin wrapper around localStorage.
// Every access is inside try/catch because the browser can refuse it
// (private window, storage full, site data blocked) and the editor must keep working.

const DRAFT_VERSION = 1;

/**
 * One draft per user and per drawing: "drawings:root:new" or "drawings:root:5".
 * The login is part of the key so two users of the same browser do not overwrite each other.
 */
export function draftKey(username, drawingId) {
    return `drawings:${username}:${drawingId ?? 'new'}`;
}

/** @returns the saved draft, or null if there is none or it cannot be read */
export function loadDraft(key) {
    try {
        const text = localStorage.getItem(key);
        if (!text) {
            return null;
        }
        const draft = JSON.parse(text);
        return draft && draft.version === DRAFT_VERSION ? draft : null;
    } catch (error) {
        console.warn('The draft could not be read', error);
        return null;
    }
}

/** @returns true if the draft was saved */
export function saveDraft(key, content) {
    try {
        localStorage.setItem(key, JSON.stringify({ version: DRAFT_VERSION, ...content }));
        return true;
    } catch (error) {
        console.warn('The draft could not be saved', error);
        return false;
    }
}

export function clearDraft(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.warn('The draft could not be removed', error);
    }
}