// =====================================================================
// notes.js: tabs, search, "On this page" sidebar and expand/collapse
// =====================================================================
//
// Same STATE → RENDER pattern as index.js:
//   - `state` holds what can change (which tab, what's typed in search)
//   - render() updates the page from state
//   - listeners only change state, then call render()
//
// The notes themselves are written in notes.html. render() only decides
// which tab panel, sections and notes are visible.


// ---------------------------------------------------------------------
// Element handles
// ---------------------------------------------------------------------
// querySelectorAll gives a NodeList; spreading it makes a real array so
// we can use filter/map/find.
const tabs = [...document.querySelectorAll('[role="tab"]')];
const panels = [...document.querySelectorAll('[role="tabpanel"]')];
const searchInput = document.querySelector('#note-search');
const countEl = document.querySelector('#note-count');
const noResults = document.querySelector('#no-results');
const jumpList = document.querySelector('.jump ul');
const toolbar = document.querySelector('.notes-toolbar');

// The tab names ('html', 'css', 'js', 'interview'), read from data-tab.
const tabNames = tabs.map((tab) => tab.dataset.tab);

// Remember each summary's original text, so search highlighting can be
// undone. (dataset values are strings stored as data-* attributes.)
document.querySelectorAll('.note summary').forEach((summary) => {
    summary.dataset.text = summary.textContent;
});


// ---------------------------------------------------------------------
// State
// ---------------------------------------------------------------------
const state = {
    tab: 'html',
    query: '',
};


// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

// Which tab panel is an element inside? Returns e.g. 'css', or null.
function tabOf(el) {
    const panel = el.closest('[role="tabpanel"]');
    return panel ? panel.id.replace('panel-', '') : null;
}

// Rebuild a summary's text, wrapping the search match in <mark>.
// Built with text nodes + createElement (not innerHTML), so the note
// text can never be parsed as HTML.
function highlight(summary, q) {
    const text = summary.dataset.text;
    const i = q ? text.toLowerCase().indexOf(q) : -1;
    if (i === -1) {
        summary.textContent = text;
        return;
    }
    const mark = document.createElement('mark');
    mark.textContent = text.slice(i, i + q.length);
    summary.replaceChildren(text.slice(0, i), mark, text.slice(i + q.length));
}

// Fill the "On this page" list with links to the visible sections of
// the current tab.
function buildJumpList() {
    const panel = document.querySelector(`#panel-${state.tab}`);
    const headings = [...panel.querySelectorAll('.topic-section:not([hidden]) h2')];
    const links = headings.map((h2) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#${h2.id}`;
        a.textContent = h2.textContent;
        li.append(a);
        return li;
    });
    jumpList.replaceChildren(...links);
    watchSections(headings);
}


// ---------------------------------------------------------------------
// render(): update everything from state
// ---------------------------------------------------------------------
function render() {
    const q = state.query.trim().toLowerCase();
    const searching = q !== '';

    // 1. Tabs: mark the selected one. Only the selected tab is in the Tab
    //    order (tabindex 0); arrow keys reach the others ("roving tabindex",
    //    the standard keyboard pattern for tabs).
    tabs.forEach((tab) => {
        const selected = tab.dataset.tab === state.tab;
        tab.setAttribute('aria-selected', selected);
        tab.tabIndex = selected ? 0 : -1;
    });

    // 2. Panels: show only the selected one.
    panels.forEach((panel) => {
        panel.hidden = panel.id !== `panel-${state.tab}`;
    });

    // 3. Search: filter notes in EVERY panel, so each tab can show its
    //    number of matches.
    const matchesPerTab = {};
    panels.forEach((panel) => {
        const notes = [...panel.querySelectorAll('.note')];
        let visible = 0;
        notes.forEach((note) => {
            const ok = !searching || note.textContent.toLowerCase().includes(q);
            note.hidden = !ok;
            if (ok) visible++;
            // open matches so you can see why they matched
            if (searching && ok) note.open = true;
            highlight(note.querySelector('summary'), q);
        });
        // hide a section heading when none of its notes are visible
        panel.querySelectorAll('.topic-section').forEach((section) => {
            const anyVisible = [...section.querySelectorAll('.note')].some((n) => !n.hidden);
            section.hidden = !anyVisible;
        });
        matchesPerTab[tabOf(panel)] = { visible, total: notes.length };
    });

    // 4. Match counts on the tabs (blank when not searching; CSS hides
    //    an empty badge).
    tabs.forEach((tab) => {
        tab.querySelector('.tab-count').textContent = searching
            ? matchesPerTab[tab.dataset.tab].visible
            : '';
    });

    // 5. Count line and empty state for the current tab.
    const current = matchesPerTab[state.tab];
    countEl.textContent = searching
        ? `${current.visible} of ${current.total} notes match`
        : `${current.total} notes`;

    if (current.visible === 0) {
        // Point to the tabs that DO have matches.
        const elsewhere = tabNames
            .filter((name) => matchesPerTab[name].visible > 0)
            .map((name) => `${name.toUpperCase()} (${matchesPerTab[name].visible})`);
        noResults.textContent = elsewhere.length
            ? `Nothing here. Matches in: ${elsewhere.join(', ')}.`
            : 'No notes match.';
    }
    noResults.hidden = current.visible > 0;

    // 6. Sidebar links for this tab.
    buildJumpList();
}


// ---------------------------------------------------------------------
// Highlight the sidebar link for the section on screen.
// IntersectionObserver calls us when a heading enters or leaves a band
// near the top of the window; much cheaper than a scroll listener.
// ---------------------------------------------------------------------
let observer;
function watchSections(headings) {
    if (observer) observer.disconnect();
    observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            jumpList.querySelectorAll('a').forEach((a) => {
                a.setAttribute('aria-current', a.hash === `#${entry.target.id}`);
            });
        });
    }, { rootMargin: '0px 0px -70% 0px' });
    headings.forEach((h2) => observer.observe(h2));
}


// ---------------------------------------------------------------------
// The URL hash remembers the tab (#css), so refresh keeps your place and
// links like notes.html#js work. A section id (#css-flex) also works:
// we switch to the tab that contains it.
// ---------------------------------------------------------------------
function applyHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (tabNames.includes(id)) {
        state.tab = id;
        render();
        return;
    }
    const target = id && document.getElementById(id);
    if (target && tabOf(target)) {
        state.tab = tabOf(target);
        render();
        target.scrollIntoView();
    }
}

function selectTab(name, { focus = false } = {}) {
    state.tab = name;
    // replaceState changes the URL without adding history entries or
    // jumping the page.
    history.replaceState(null, '', `#${name}`);
    render();
    window.scrollTo({ top: 0 });
    if (focus) document.querySelector(`#tab-${name}`).focus();
}


// ---------------------------------------------------------------------
// Listeners
// ---------------------------------------------------------------------

// Tab clicks (one delegated listener on the tab list).
document.querySelector('[role="tablist"]').addEventListener('click', (e) => {
    const tab = e.target.closest('[role="tab"]');
    if (tab) selectTab(tab.dataset.tab);
});

// Arrow keys / Home / End move between tabs (expected for role="tab").
document.querySelector('[role="tablist"]').addEventListener('keydown', (e) => {
    const i = tabNames.indexOf(state.tab);
    const moves = {
        ArrowRight: (i + 1) % tabNames.length,
        ArrowLeft: (i - 1 + tabNames.length) % tabNames.length,
        Home: 0,
        End: tabNames.length - 1,
    };
    if (!(e.key in moves)) return;
    e.preventDefault();
    selectTab(tabNames[moves[e.key]], { focus: true });
});

searchInput.addEventListener('input', (e) => {
    state.query = e.target.value;
    render();
});

// Expand / collapse the visible notes in the current tab.
document.querySelector('#expand-all').addEventListener('click', () => {
    document.querySelectorAll(`#panel-${state.tab} .note:not([hidden])`)
        .forEach((note) => { note.open = true; });
});

document.querySelector('#collapse-all').addEventListener('click', () => {
    document.querySelectorAll(`#panel-${state.tab} .note`)
        .forEach((note) => { note.open = false; });
});

// "/" jumps to search (unless you're already typing); Escape clears it.
document.addEventListener('keydown', (e) => {
    const typing = e.target.matches('input, textarea');
    if (e.key === '/' && !typing) {
        e.preventDefault();
        searchInput.focus();
    }
    if (e.key === 'Escape' && e.target === searchInput) {
        searchInput.value = '';
        state.query = '';
        render();
    }
});

// Sidebar links and other #links (back/forward buttons too).
window.addEventListener('hashchange', applyHash);

// Keep --toolbar-h equal to the toolbar's real height, so the sidebar and
// anchor jumps sit just below it (it gets taller when it wraps on phones).
new ResizeObserver(() => {
    document.documentElement.style.setProperty('--toolbar-h', `${toolbar.offsetHeight}px`);
}).observe(toolbar);


// ---------------------------------------------------------------------
// First draw
// ---------------------------------------------------------------------
render();
applyHash();
