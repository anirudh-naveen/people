// =====================================================================
// notes.js: search, topic filter and expand/collapse for notes.html
// =====================================================================
//
// This uses the same STATE → RENDER pattern as index.js:
//   - `state` holds what can change (the search text and the topic)
//   - render() shows/hides notes based on state
//   - listeners only update state, then call render()
//
// Unlike index.js, the notes themselves are written in the HTML, not
// generated from data. render() just decides which ones are visible
// (using the `hidden` property), which is simpler for content that you
// write and edit by hand.


// ---------------------------------------------------------------------
// Element handles
// ---------------------------------------------------------------------
const searchInput = document.querySelector('#note-search');
// querySelectorAll returns a NodeList. Spreading it into an array gives
// us array methods like filter (a NodeList only has forEach).
const notes = [...document.querySelectorAll('.note')];
const sections = [...document.querySelectorAll('.topic-section')];
const topicButtons = [...document.querySelectorAll('.topics button')];
const countEl = document.querySelector('#note-count');
const noResults = document.querySelector('#no-results');


// ---------------------------------------------------------------------
// State
// ---------------------------------------------------------------------
const state = {
    // search box text ('' = no filter)
    query: '',
    // matches a data-topic value, or 'all'
    topic: 'all',
};


// ---------------------------------------------------------------------
// Does one note match the current filters?
// ---------------------------------------------------------------------
function matches(note) {
    // Topic filter: 'all' lets everything through. Otherwise the note's
    // data-topic="..." (read via dataset.topic) must equal the topic.
    const topicOk = state.topic === 'all' || note.dataset.topic === state.topic;

    // Search filter: case-insensitive match against ALL the text in the
    // note (summary + body). textContent gives every bit of text inside
    // the element, with the tags stripped out.
    const q = state.query.trim().toLowerCase();
    const textOk = note.textContent.toLowerCase().includes(q);

    return topicOk && textOk;
}


// ---------------------------------------------------------------------
// render(): show/hide notes and sections from state
// ---------------------------------------------------------------------
function render() {
    // Search mode = something is typed in the box.
    const searching = state.query.trim() !== '';

    notes.forEach((note) => {
        const ok = matches(note);
        // The `hidden` property mirrors the HTML hidden attribute:
        // true = not displayed (and hidden from screen readers too).
        note.hidden = !ok;
        // While searching, open the matching notes so you can see the
        // match without clicking each one. (We don't close them again
        // when the search is cleared, so notes you opened stay open.)
        if (searching && ok) note.open = true;
    });

    // Hide a whole section (and its heading) when none of its notes are
    // visible. .some() is true if at least one note in the section
    // passes the test.
    sections.forEach((section) => {
        const sectionNotes = [...section.querySelectorAll('.note')];
        section.hidden = !sectionNotes.some((note) => !note.hidden);
    });

    // Count and empty state.
    const visibleCount = notes.filter((note) => !note.hidden).length;
    countEl.textContent = `${visibleCount} of ${notes.length} notes`;
    noResults.hidden = visibleCount > 0;

    // Mark which topic button is active. aria-pressed tells screen
    // readers it's on; CSS uses the same attribute to style it
    // ("JS sets state, CSS owns the visuals").
    topicButtons.forEach((btn) => {
        btn.setAttribute('aria-pressed', btn.dataset.topic === state.topic);
    });
}


// ---------------------------------------------------------------------
// Listeners: update state → render()
// ---------------------------------------------------------------------

// 'input' fires on every keystroke.
searchInput.addEventListener('input', (e) => {
    state.query = e.target.value;
    render();
});

// EVENT DELEGATION: one listener on the button group handles all the
// topic buttons.
document.querySelector('.topics').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    state.topic = btn.dataset.topic;
    render();
});

// Expand / collapse every VISIBLE note. A <details> element has an
// `open` property: true = expanded.
document.querySelector('#expand-all').addEventListener('click', () => {
    notes.forEach((note) => {
        if (!note.hidden) note.open = true;
    });
});

document.querySelector('#collapse-all').addEventListener('click', () => {
    notes.forEach((note) => {
        note.open = false;
    });
});

// Keyboard shortcut: press "/" anywhere to jump to the search box.
// keydown on the whole document; e.key is the key's character.
// Skip it if you're already typing in a field, so "/" can still be
// typed normally there.
document.addEventListener('keydown', (e) => {
    const typing = e.target.matches('input, textarea');
    if (e.key === '/' && !typing) {
        // stop the "/" from being typed into the box
        e.preventDefault();
        searchInput.focus();
    }
    // Escape inside the search box clears it.
    if (e.key === 'Escape' && e.target === searchInput) {
        searchInput.value = '';
        state.query = '';
        render();
    }
});


// First draw.
render();
