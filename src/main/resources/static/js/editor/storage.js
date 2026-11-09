const DRAFT_VERSION = 1;

export function draftKey(username, drawingId) {
    return `drawings:${username}:${drawingId ?? 'new'}`;
}

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