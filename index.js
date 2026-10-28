// =====================================================================
// index.js: all the JavaScript for the Employee Directory page
// =====================================================================
//
// Loaded by index.html with <script src="index.js" defer>. "defer" means
// the browser runs this only after the whole HTML is parsed, so every
// element we look up below already exists. (Without defer, querySelector
// would run too early and return null.)
//
// THE BIG IDEA (JS track 4): the STATE → RENDER pattern.
//   1. One `state` object holds everything that can change.
//   2. One `render()` function reads `state` and redraws the page.
//   3. Event listeners ONLY update `state`, then call `render()`.
// We never patch the page by hand; we change the data and redraw.
// This is exactly how React thinks (Day 8).
//
// File map (top to bottom):
//   1. Element handles
//   2. State (the data + UI state)
//   3. Remembering filters in localStorage (JS track 6)
//   4. Small helpers
//   5. Department dropdowns, built from the data
//   6. Pure "what to show" functions: getVisible, getSortedPayroll
//   7. Building elements: cardEl, payrollRowHTML
//   8. render() and renderStats()
//   9. Event listeners: toolbar, cards, table, density
//  10. Modal (JS track 5, Part 1) + toast
//  11. Tabs, accordion, dropdown menu (JS track 5 + Day 5 challenge)
//  12. Start-up
//
// `formatSalary` is NOT defined in this file: it comes from app.js, which
// index.html loads first. Functions declared at the top level of a
// classic script become globals, so this file can call them.


// =====================================================================
// 1. ELEMENT HANDLES
// =====================================================================
// Grab every element we use more than once, ONCE, at the top.
// document.querySelector(selector) returns the FIRST element matching a
// CSS selector, or null if nothing matches.
// > '#x' = id, '.x' = class, 'x' = tag name. Getting the symbol wrong
// > returns null, and the next line crashes with
// > "Cannot read properties of null".
const listEl = document.querySelector('.card-list');
const countEl = document.querySelector('#result-count');
const searchInput = document.querySelector('#search');
const deptSelect = document.querySelector('#dept');
const sortSelect = document.querySelector('#sort');
const dataTable = document.querySelector('.data-table');
// '.data-table tbody' = a <tbody> TAG inside an element with class
// data-table. (No dot before tbody: '.tbody' would mean a CLASS.)
const tbodyEl = document.querySelector('.data-table tbody');
const theadEl = document.querySelector('.data-table thead');
const densityBtn = document.querySelector('#density');
const selectedCountEl = document.querySelector('#selected-count');
const progressEl = document.querySelector('.progress');
const fill = document.querySelector('.progress__fill');
const toastRegion = document.querySelector('#toasts');


// =====================================================================
// 2. STATE: the single source of truth for everything that can change
// =====================================================================
// `const` means `state` can never point to a different object, but the
// object's CONTENTS can still change (state.query = 'priya' is allowed).
const state = {
    // The data. Each employee is an object: { key: value, ... }.
    //   id      unique number, so we can find a person later
    //   salary  a plain NUMBER (115000), not a string like '$115,000'.
    //           > Rule: store raw data, format it only when displaying it.
    //           > Numbers sort correctly; strings sort letter by letter
    //           > ('$80,000' would come after '$145,000' because '8' > '1').
    //   start   'YYYY-MM-DD', so comparing as text = comparing dates
    //   status  'Active' | 'On leave' | 'Terminated' (drives the badge)
    //   img     a number for the pravatar.cc placeholder photo (1–70)
    //   featured  optional; true = full-width card shown first
    employees: [
        { id: 1, name: 'Priya Shah', role: 'Senior Engineer', dept: 'Engineering', salary: 115000, start: '2022-03-01', status: 'Active', featured: true, img: 5 },
        { id: 2, name: 'Marcus Lee', role: 'Account Executive', dept: 'Sales', salary: 80000, start: '2024-07-15', status: 'Active', img: 13 },
        { id: 3, name: 'Ana Gomez', role: 'People Partner', dept: 'People', salary: 80000, start: '2021-11-08', status: 'On leave', img: 9 },
        { id: 4, name: 'Jordan Kim', role: 'Senior Engineer', dept: 'Engineering', salary: 120000, start: '2025-01-20', status: 'Active', img: 15 },
        { id: 5, name: 'Jamie Taylor', role: 'Account Executive', dept: 'Sales', salary: 75000, start: '2023-06-12', status: 'Active', img: 12 },
        { id: 6, name: 'Morgan Lee', role: 'People Partner', dept: 'People', salary: 85000, start: '2022-09-30', status: 'Active', img: 6 },
        { id: 7, name: 'Alex Johnson', role: 'Staff Engineer', dept: 'Engineering', salary: 145000, start: '2021-05-15', status: 'Active', img: 7 },
        { id: 8, name: 'Slug Freeman', role: 'Analyst', dept: 'Finance', salary: 100000, start: '2026-01-01', status: 'Active', img: 8 },
        // Day 5, Step 3: ten more people, so the page is long enough to
        // test the sticky header and the sticky table header.
        { id: 9, name: 'Wei Chen', role: 'Product Designer', dept: 'Design', salary: 105000, start: '2026-10-05', status: 'Active', img: 11 },
        { id: 10, name: 'Grace Okafor', role: 'Engineering Manager', dept: 'Engineering', salary: 175000, start: '2020-02-10', status: 'Active', img: 20 },
        { id: 11, name: 'Diego Silva', role: 'Sales Manager', dept: 'Sales', salary: 130000, start: '2019-08-19', status: 'On leave', img: 33 },
        { id: 12, name: 'Aisha Khan', role: 'Financial Analyst', dept: 'Finance', salary: 92000, start: '2024-03-04', status: 'Active', img: 44 },
        { id: 13, name: 'Tom Berg', role: 'Recruiter', dept: 'People', salary: 78000, start: '2026-10-19', status: 'Active', img: 52 },
        { id: 14, name: 'Lena Novak', role: 'Senior Designer', dept: 'Design', salary: 118000, start: '2023-01-23', status: 'Active', img: 25 },
        { id: 15, name: 'Omar Haddad', role: 'Support Engineer', dept: 'Engineering', salary: 88000, start: '2022-12-01', status: 'Terminated', img: 59 },
        { id: 16, name: 'Sam Park', role: 'Controller', dept: 'Finance', salary: 140000, start: '2018-04-16', status: 'Active', img: 60 },
        // A deliberately long name, to show the email truncation (Day 6, Step 6).
        { id: 17, name: 'Bartholomew Fitzgerald-Montgomery', role: 'Account Executive', dept: 'Sales', salary: 82000, start: '2025-09-08', status: 'Active', img: 68 },
        { id: 18, name: 'Haley Stardew', role: 'UX Researcher', dept: 'Design', salary: 97000, start: '2021-07-12', status: 'Active', img: 47 },
    ],

    // ---- UI state for the CARDS ----
    query: '',          // what's typed in the search box ('' = everyone)
    dept: 'All',        // chosen department; 'All' matches <option value="All">
    sort: 'name',       // 'name' (A–Z) or 'newest'; matches the #sort option values

    // ---- UI state for the TABLE ----
    // Which column is sorted and which way. key must match an employee
    // property AND a data-key="..." on a <th>. dir: 'asc' | 'desc'.
    tableSort: { key: 'name', dir: 'asc' },
    // Which rows are selected, by employee id. A Set holds each id at
    // most once and has fast .has/.add/.delete.
    // > Keeping selection in STATE (not just as a class on a <tr>) means
    // > it survives re-renders: sorting rebuilds every row, and the
    // > rows come back already selected because render() reads this Set.
    selectedIds: new Set(),
};


// =====================================================================
// 3. REMEMBERING FILTERS (JS track 6)
// =====================================================================
// The search text, department and sort survive a page reload.
// > localStorage only stores STRINGS, so objects go through JSON:
// >   JSON.stringify(obj) → a string to save
// >   JSON.parse(string)  → the object back
// > getItem returns null for a missing key, and JSON.parse(null) is null.
// > localStorage vs sessionStorage vs cookies: localStorage persists,
// > sessionStorage is cleared when the tab closes, cookies are sent to
// > the server with every request.
const FILTERS_KEY = 'people-filters';

function saveFilters() {
    const { query, dept, sort } = state;    // destructuring: pull out 3 properties
    try {
        localStorage.setItem(FILTERS_KEY, JSON.stringify({ query, dept, sort }));
    } catch (err) {
        // Storage can be blocked (private browsing). Not fatal: the
        // filters just won't be remembered.
    }
}

function loadFilters() {
    try {
        const saved = JSON.parse(localStorage.getItem(FILTERS_KEY));
        if (!saved) return;
        // ?? = "use the right side only if the left is null/undefined",
        // so a missing property falls back to the default.
        state.query = saved.query ?? '';
        state.dept = saved.dept ?? 'All';
        state.sort = saved.sort ?? 'name';
    } catch (err) {
        // Corrupt or blocked storage: keep the defaults.
    }
}


// =====================================================================
// 4. SMALL HELPERS
// =====================================================================

// Escape text before putting it into innerHTML, to prevent XSS
// (cross-site scripting). If a name contained
// '<img src=x onerror=alert(1)>' and went straight into innerHTML, the
// browser would create that tag and RUN the code. This swaps the five
// dangerous characters for harmless HTML entities, so they show as text.
//   String(s)          → make sure we have a string (numbers too)
//   /[&<>"']/g         → a regular expression: any of these characters;
//                        g = global, i.e. replace ALL of them
//   (c) => ({...}[c])  → look up the replacement for character c
const escapeHTML = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));

// 'On leave' → 'badge--on-leave'. Builds the CSS modifier class for a
// status: lowercase it, turn spaces into hyphens.
// > replaceAll replaces every match; replace would only do the first.
const badgeClass = (status) => `badge--${status.toLowerCase().replaceAll(' ', '-')}`;

// 'Bartholomew Fitzgerald-Montgomery' → 'bartholomew.fitzgerald-montgomery@acme.com'.
// Emails are worked out from the name instead of stored, so people added
// through the modal get one too.
const emailFor = (person) => `${person.name.toLowerCase().replaceAll(' ', '.')}@acme.com`;


// =====================================================================
// 5. DEPARTMENT DROPDOWNS, built from the data instead of hard-coded
// =====================================================================
// Fills BOTH the toolbar filter (#dept) and the modal's department field
// (#m-dept) with one <option> per department that exists in the data.
// Called at start-up and whenever employees are added or removed.
// > This REPLACES the options each time (replaceChildren), so calling it
// > repeatedly can't create duplicates. Appending each time would.
const modalDeptSelect = document.querySelector('#m-dept');

function renderDeptOptions() {
    // A Set can't hold duplicates: 'Engineering' added 5 times is stored
    // once. Spreading it into [ ] turns it back into an array, which has
    // .sort(). (Array(set) would NOT work: that's a one-item array
    // containing the Set itself.)
    const departments = [...new Set(state.employees.map((e) => e.dept))].sort();

    // If the remembered/chosen department no longer exists (everyone in
    // it was removed), fall back to showing everyone.
    if (state.dept !== 'All' && !departments.includes(state.dept)) {
        state.dept = 'All';
    }

    // CREATE → FILL → (later) APPEND, for each name.
    // An <option> with no value="" uses its text as its value, so picking
    // it sets state.dept to e.g. 'Engineering'.
    const makeOption = (text, value = text) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        return option;
    };

    // Toolbar: "All departments" first, then each department.
    deptSelect.replaceChildren(
        makeOption('All departments', 'All'),
        ...departments.map((d) => makeOption(d)),
    );
    deptSelect.value = state.dept;          // keep the current choice selected

    // Modal: an empty "Choose one…" first, so `required` forces a choice.
    modalDeptSelect.replaceChildren(
        makeOption('Choose one…', ''),
        ...departments.map((d) => makeOption(d)),
    );
}


// =====================================================================
// 6. "WHAT TO SHOW" FUNCTIONS
// =====================================================================
// These read `state` and return NEW arrays. They never change anything,
// which makes them easy to test in the console: getVisible().

// Which employees should the CARDS show, and in what order?
function getVisible() {
    // .trim() removes spaces at both ends; .toLowerCase() makes the search
    // case-insensitive ("PRIYA" finds "Priya").
    const q = state.query.trim().toLowerCase();
    // Each method returns a new array that the next one works on
    // ("chaining").
    return state.employees
        // Filter 1 (department): keep everyone when 'All' is chosen
        // (|| stops at the first true), otherwise only that department.
        .filter((e) => state.dept === 'All' || e.dept === state.dept)
        // Filter 2 (search): glue name + role into one lowercase string and
        // check whether the search text appears anywhere in it.
        // When q is '', every string .includes('') → everyone passes.
        .filter((e) => `${e.name} ${e.role}`.toLowerCase().includes(q))
        // Sort. A compare function returns negative (a first), positive
        // (b first) or 0. .sort() changes the array it's called on, but
        // here that's the NEW array from .filter(), so state.employees
        // keeps its order.
        .sort((a, b) => {
            // Featured people always come first (Day 5, Challenge 1).
            // `!==` → only when exactly one of the two is featured.
            if (Boolean(a.featured) !== Boolean(b.featured)) return a.featured ? -1 : 1;
            // `? :` is a ternary (a one-line if/else):
            //   'name'   → localeCompare = alphabetical A–Z
            //   'newest' → b vs a (swapped!) = latest start date first
            return state.sort === 'name'
                ? a.name.localeCompare(b.name)
                : b.start.localeCompare(a.start);
        });
}

// Employees sorted for the PAYROLL TABLE (all of them, unfiltered).
function getSortedPayroll() {
    // Destructuring: shorthand for
    //   const key = state.tableSort.key; const dir = state.tableSort.dir;
    const { key, dir } = state.tableSort;
    // [...array] makes a COPY first, because .sort() changes the array it's
    // called on and we don't want to reorder the real data.
    return [...state.employees].sort((a, b) => {
        // Bracket notation: a[key] reads the property whose NAME is stored
        // in `key`. If key is 'salary', a[key] is a.salary. That's how one
        // compare function works for every column.
        // Numbers compare by subtraction (negative → a first);
        // strings with localeCompare (alphabetical).
        const result = typeof a[key] === 'number'
            ? a[key] - b[key]
            : a[key].localeCompare(b[key]);
        // Descending = flip the sign, which reverses every comparison.
        return dir === 'asc' ? result : -result;
    });
}


// =====================================================================
// 7. BUILDING ELEMENTS
// =====================================================================

// ---------------------------------------------------------------------
// cardEl(e): ONE employee card as a real element (createElement version)
// ---------------------------------------------------------------------
// > Tradeoff (interview question!) vs a template string + innerHTML:
// >   + safe by default: textContent never parses HTML, so no escapeHTML
// >     is needed and there's nothing to forget
// >   + gives back a real element you could attach listeners to
// >   - much more verbose
function cardEl(e) {
    const article = document.createElement('article');
    // className sets the whole class attribute. Fine on a brand-new
    // element (there are no other classes to overwrite).
    article.className = 'card';
    // classList.add adds ONE class and keeps the others.
    if (e.featured) article.classList.add('card--featured');
    // dataset.id = ... writes data-id="..."; the Remove listener reads it.
    article.dataset.id = e.id;

    // AVATAR + STATUS DOT (Day 5, Step 4).
    // An <img> can't contain other elements, so a wrapper <div class="avatar">
    // holds the photo AND the dot. CSS makes the wrapper position: relative
    // and the dot position: absolute, pinned to its bottom-right corner.
    const avatar = document.createElement('div');
    avatar.className = 'avatar';

    const img = document.createElement('img');
    img.src = `https://i.pravatar.cc/120?img=${e.img}`;
    // alt="" = decorative: the name is right below it, so a screen reader
    // should skip the photo instead of repeating the name.
    img.alt = '';
    // width/height let the browser reserve space before the image loads,
    // so the layout doesn't jump when it arrives.
    img.width = 120;
    img.height = 120;

    // The dot. Only active employees show as "online".
    const dot = document.createElement('span');
    dot.className = 'avatar__status';
    // Without a label the dot is a meaningless coloured circle to a screen
    // reader. role="img" makes the label count on a plain <span>.
    dot.setAttribute('role', 'img');
    dot.setAttribute('aria-label', e.status === 'Active' ? 'Online' : e.status);
    dot.hidden = e.status !== 'Active';

    // Order matters: the dot comes AFTER the photo, so it's painted on top.
    avatar.append(img, dot);

    const name = document.createElement('h3');
    name.textContent = e.name;

    const role = document.createElement('p');
    role.className = 'role';
    role.textContent = e.role;

    const dept = document.createElement('p');
    dept.className = 'dept';
    dept.textContent = e.dept;

    // EMAIL LINK (Day 6, Step 6). mailto: opens the user's email app.
    // CSS (.card__email) keeps long addresses on one line with "…"; the
    // title attribute shows the full address on hover.
    const email = document.createElement('a');
    email.className = 'card__email';
    email.href = `mailto:${emailFor(e)}`;
    email.textContent = emailFor(e);
    email.title = emailFor(e);

    const btn = document.createElement('button');
    // A <button> defaults to type="submit". 'button' = a plain button.
    btn.type = 'button';
    btn.className = 'btn';
    // data-action="remove" is what the delegated listener looks for.
    btn.dataset.action = 'remove';
    btn.textContent = 'Remove';
    // Without this, a screen reader hears "Remove, Remove, Remove...".
    btn.setAttribute('aria-label', `Remove ${e.name}`);

    // append takes several elements at once, added in this order
    // (= the card's top-to-bottom order).
    article.append(avatar, name, role, dept, email, btn);
    return article;   // an ELEMENT, not a string
}

// ---------------------------------------------------------------------
// payrollRowHTML(e): ONE table row as an HTML STRING
// ---------------------------------------------------------------------
// The template-string approach (compare with cardEl). render() turns the
// strings into elements with innerHTML, so every piece of text data MUST
// go through escapeHTML.
//   data-id      which employee the row is (read by the selection listener)
//   is-selected  added when the id is in state.selectedIds
//   data-label   the column name, which CSS shows before each value on
//                phones, when the table becomes stacked cards
//                (Day 6, Challenge 3: td::before { content: attr(data-label) })
// formatSalary (app.js) turns 115000 into "$115,000.00". It's a number we
// format ourselves, so it can't contain HTML.
// <td> = data cell. (<th> is only for header cells.)
function payrollRowHTML(e) {
    const selected = state.selectedIds.has(e.id) ? ' class="is-selected"' : '';
    return `
        <tr data-id="${e.id}"${selected}>
            <td data-label="Name">${escapeHTML(e.name)}</td>
            <td data-label="Department">${escapeHTML(e.dept)}</td>
            <td data-label="Status"><span class="badge ${badgeClass(e.status)}">${escapeHTML(e.status)}</span></td>
            <td data-label="Salary" class="num">${formatSalary(e.salary)}</td>
        </tr>`;
}


// =====================================================================
// 8. RENDER: redraw everything from `state`
// =====================================================================
// Called once at start-up and after EVERY state change. It doesn't care
// WHAT changed; it just makes the page match the state.
function render() {
    // ---- Cards ----
    const visible = getVisible();
    if (visible.length) {
        // replaceChildren removes everything inside .card-list and inserts
        // what we pass. visible.map(cardEl) is an ARRAY of <article>s;
        // `...` spreads them into separate arguments.
        listEl.replaceChildren(...visible.map(cardEl));
    } else {
        // EMPTY STATE: say so, instead of showing a blank area.
        const empty = document.createElement('p');
        empty.className = 'empty';
        empty.textContent = 'No one matches your search.';
        listEl.replaceChildren(empty);
    }
    countEl.textContent = `${visible.length} of ${state.employees.length} people`;

    // ---- Payroll table ----
    // Map each employee to a <tr> string, join them into ONE string
    // (join('') so there are no commas between rows), and let innerHTML
    // build the rows inside the <tbody>. Only the <tbody> is replaced, so
    // the caption and header row survive.
    tbodyEl.innerHTML = getSortedPayroll().map(payrollRowHTML).join('');

    // aria-sort tells screen readers which column is sorted and how.
    // Exactly ONE <th> should have it, so visit every header: the sorted
    // one gets 'ascending'/'descending' (the full words ARIA requires),
    // the others lose the attribute. CSS draws ▲/▼ from it.
    theadEl.querySelectorAll('th').forEach((th) => {
        if (th.dataset.key === state.tableSort.key) {
            th.setAttribute('aria-sort', state.tableSort.dir === 'asc' ? 'ascending' : 'descending');
        } else {
            th.removeAttribute('aria-sort');
        }
    });

    // ---- Selection counter + progress bar (JS track 3) ----
    const selected = state.selectedIds.size;          // a Set has .size, not .length
    const total = state.employees.length;
    const percent = total ? Math.round((selected / total) * 100) : 0;   // avoid ÷ 0
    selectedCountEl.textContent = `Selected: ${selected}`;
    // style.setProperty writes a CSS custom property on the element; CSS
    // reads it with width: var(--progress, 0%). The unit matters: '40'
    // means nothing to width, '40%' works.
    fill.style.setProperty('--progress', `${percent}%`);
    progressEl.setAttribute('aria-valuenow', percent);

    renderStats();
}

// The three numbers in the stat tiles, calculated from the data.
function renderStats() {
    // 'YYYY-MM' for today, e.g. '2026-10'. toISOString() gives
    // 'YYYY-MM-DDTHH:MM:SS…'; slice(0, 7) keeps the first 7 characters.
    const thisMonth = new Date().toISOString().slice(0, 7);
    const newThisMonth = state.employees.filter((e) => e.start.startsWith(thisMonth)).length;
    const onLeave = state.employees.filter((e) => e.status === 'On leave').length;

    document.querySelector('#stat-headcount').textContent = state.employees.length;
    document.querySelector('#stat-new').textContent = newThisMonth;
    document.querySelector('#stat-leave').textContent = onLeave;
}


// =====================================================================
// 9. EVENT LISTENERS: update state, then render(). Nothing else.
// =====================================================================

// Search box. 'input' fires on every keystroke, paste or delete.
// e.target is the <input>; .value is its current text.
searchInput.addEventListener('input', (e) => {
    state.query = e.target.value;
    saveFilters();
    render();
});

// Department filter. 'change' fires when a new option is picked.
deptSelect.addEventListener('change', (e) => {
    state.dept = e.target.value;
    saveFilters();
    render();
});

// Card sort ('name' or 'newest').
sortSelect.addEventListener('change', (e) => {
    state.sort = e.target.value;
    saveFilters();
    render();
});

// REMOVE BUTTONS: event delegation. One listener on the card list handles
// every card's button, including cards rendered later.
// > Why delegation? render() replaces the cards, so listeners attached
// > directly to old buttons would be thrown away with them. A click on a
// > button BUBBLES up to .card-list, which never gets replaced.
listEl.addEventListener('click', (e) => {
    // closest() walks UP from the clicked element (maybe the button, maybe
    // something inside it) to the first match, or returns null.
    const btn = e.target.closest('[data-action="remove"]');
    if (!btn) return;                       // the click wasn't on a Remove button
    // dataset values are always STRINGS; Number() matches the numeric ids.
    const id = Number(btn.closest('.card').dataset.id);
    const person = state.employees.find((emp) => emp.id === id);
    // Keep everyone EXCEPT this id. filter returns a NEW array.
    state.employees = state.employees.filter((emp) => emp.id !== id);
    state.selectedIds.delete(id);           // can't stay selected if they're gone
    renderDeptOptions();                    // their department might now be empty
    render();
    showToast(`Removed ${person.name}.`);
});

// ROW SELECTION: delegation again, on the <tbody>.
// 'tr[data-id]' only matches body rows, so header clicks are ignored.
tbodyEl.addEventListener('click', (e) => {
    const row = e.target.closest('tr[data-id]');
    if (!row) return;
    const id = Number(row.dataset.id);
    // Toggle the id in the Set: remove it if it's there, add it if not.
    if (state.selectedIds.has(id)) {
        state.selectedIds.delete(id);
    } else {
        state.selectedIds.add(id);
    }
    render();
});

// TABLE SORTING: one delegated listener on the header row.
theadEl.addEventListener('click', (e) => {
    const th = e.target.closest('th[data-key]');
    if (!th) return;
    const key = th.dataset.key;             // reads data-key="..."
    // Same column as now → flip the direction.
    // Different column → switch to it, starting ascending.
    // > Remember: `=` ASSIGNS, `===` COMPARES.
    if (key === state.tableSort.key) {
        state.tableSort.dir = state.tableSort.dir === 'asc' ? 'desc' : 'asc';
    } else {
        state.tableSort = { key, dir: 'asc' };   // { key } is shorthand for { key: key }
    }
    render();
});

// COMPACT VIEW (JS track 3: JS toggles a class, CSS owns the looks).
densityBtn.addEventListener('click', () => {
    // classList.toggle adds the class if missing, removes it if present,
    // and RETURNS true if the class is now there.
    // CSS: .compact .data-table td { padding: ... }
    const on = document.body.classList.toggle('compact');
    // aria-pressed makes this a toggle button for screen readers.
    densityBtn.setAttribute('aria-pressed', on);
});


// =====================================================================
// 10. ADD EMPLOYEE MODAL (JS track 5, Part 1) + TOAST
// =====================================================================
const modal = document.querySelector('#add-modal');
const openBtn = document.querySelector('#add-employee');
const modalForm = modal.querySelector('form');

function openModal() {
    modal.hidden = false;
    // Move focus INTO the dialog, so keyboard and screen reader users land
    // inside it instead of somewhere on the page behind it.
    modal.querySelector('input').focus();
}

function closeModal() {
    modal.hidden = true;
    modalForm.reset();                      // clear the fields for next time
    // Send focus back to the button that opened it, so the user doesn't
    // get dumped at the top of the page.
    openBtn.focus();
}

openBtn.addEventListener('click', openModal);
modal.querySelector('.modal__close').addEventListener('click', closeModal);
modal.querySelector('[data-close]').addEventListener('click', closeModal);   // Cancel

// A click directly on the dimmed backdrop closes it. Clicks inside the
// white box bubble up here too, but their target is something INSIDE the
// box, so only a click on the backdrop itself matches.
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

// Submitting the form adds a person. The browser's built-in validation
// (required, minlength, min/max/step) runs FIRST; 'submit' only fires if
// every field passes.
modalForm.addEventListener('submit', (e) => {
    e.preventDefault();                     // stop the page reload
    const name = modal.querySelector('#m-name').value.trim();
    state.employees.push({
        id: Date.now(),                     // ms since 1970: unique per click
        name,                               // shorthand for name: name
        role: modal.querySelector('#m-role').value.trim(),
        dept: modalDeptSelect.value,
        salary: Number(modal.querySelector('#m-salary').value),   // inputs give strings
        // Today as 'YYYY-MM-DD', matching the other start dates, so the
        // "Newest hire" sort and the "New this month" tile count them.
        start: new Date().toISOString().slice(0, 10),
        status: 'Active',
        img: (Date.now() % 70) + 1,         // any photo from 1–70
    });
    render();
    closeModal();
    showToast(`Added ${name}.`);
});

// > With more time: trap Tab inside the modal while it's open. The native
// > <dialog> element + dialog.showModal() gives you the backdrop, focus
// > trapping and Escape for free.

// ---------------------------------------------------------------------
// TOAST (Day 5 Challenge 3 + Day 7 morning challenge)
// ---------------------------------------------------------------------
// Adds a short message to the bottom-right corner and removes it after
// 3 seconds. The region (#toasts) is role="status" and exists from page
// load, so screen readers announce each new message.
//   1. create the toast; CSS @keyframes animates it in
//   2. after 3s, add .is-leaving; the CSS transition fades it out
//   3. 300ms later (just after the 200ms fade), remove it from the page
// ! We remove it with a timer, not the 'transitionend' event: for users
// ! with reduced motion there's no transition, so that event never fires
// ! and the toast would stay forever.
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastRegion.append(toast);

    setTimeout(() => {
        toast.classList.add('is-leaving');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}


// =====================================================================
// 11. TABS, ACCORDION, DROPDOWN MENU
// =====================================================================

// ---------------------------------------------------------------------
// TABS (JS track 5, Part 2)
// ---------------------------------------------------------------------
// [...nodeList] turns the NodeList into a real array (for indexOf etc.).
const tabs = [...document.querySelectorAll('.tabs [role="tab"]')];

// Select one tab: loop over ALL of them, so exactly one ends up selected.
//   aria-selected  → screen readers say "selected"; CSS underlines it
//   tabIndex       → only the selected tab is in the Tab order
//                    ("roving tabindex"); the arrows reach the others
//   panel.hidden   → show this tab's panel, hide the rest
//                    (aria-controls holds the panel's id)
function selectTab(tab) {
    tabs.forEach((t) => {
        const selected = t === tab;
        t.setAttribute('aria-selected', selected);
        t.tabIndex = selected ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !selected;
    });
    tab.focus();
}

tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (e) => {
        // % (remainder) wraps around: from the last tab, Right goes to the
        // first. Adding tabs.length before % on Left avoids a negative index.
        if (e.key === 'ArrowRight') selectTab(tabs[(i + 1) % tabs.length]);
        if (e.key === 'ArrowLeft') selectTab(tabs[(i - 1 + tabs.length) % tabs.length]);
        if (e.key === 'Home') selectTab(tabs[0]);
        if (e.key === 'End') selectTab(tabs[tabs.length - 1]);
    });
});

// ---------------------------------------------------------------------
// ACCORDION (JS track 5, Part 3): only one answer open at a time
// ---------------------------------------------------------------------
const questions = [...document.querySelectorAll('.accordion__trigger')];

// Same loop shape as the tabs, with one difference: clicking the open
// question closes it, so all answers can be closed.
function toggleQuestion(button) {
    const wasOpen = button.getAttribute('aria-expanded') === 'true';   // attributes are strings
    questions.forEach((q) => {
        const open = q === button && !wasOpen;
        q.setAttribute('aria-expanded', open);
        document.getElementById(q.getAttribute('aria-controls')).hidden = !open;
    });
}

questions.forEach((q) => {
    q.addEventListener('click', () => toggleQuestion(q));
});

// ---------------------------------------------------------------------
// "⋯" DROPDOWN MENU (Day 5, Challenge 2)
// ---------------------------------------------------------------------
const menuBtn = document.querySelector('.menu > .btn');
const menu = document.querySelector('#row-menu');

function setMenuOpen(open) {
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', open);
}

// Toggle on click. menu.hidden is true when closed, so "open it" = hidden.
menuBtn.addEventListener('click', () => setMenuOpen(menu.hidden));

// A click on a menu item: run the (demo) action and close the menu.
menu.addEventListener('click', (e) => {
    const item = e.target.closest('[data-menu-action]');
    if (!item) return;
    showToast(`${item.dataset.menuAction} Priya Shah (demo only).`);
    setMenuOpen(false);
    menuBtn.focus();
});

// A click anywhere OUTSIDE the .menu wrapper closes it.
document.addEventListener('click', (e) => {
    if (!menu.hidden && !e.target.closest('.menu')) setMenuOpen(false);
});

// ESCAPE closes whichever overlay is open: the modal first, else the menu.
// One listener on the document works wherever focus is.
document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!modal.hidden) {
        closeModal();
    } else if (!menu.hidden) {
        setMenuOpen(false);
        menuBtn.focus();                    // back to the button that opened it
    }
});


// =====================================================================
// 12. START-UP
// =====================================================================
// Order matters:
//   1. restore the saved filters into state
//   2. build the department options (needs state.dept to select one)
//   3. copy state into the controls, so the page SHOWS the restored values
//   4. first render
// > If anything inside render() throws, the script stops there. When lots
// > of things break at once, fix the FIRST red error in the Console.
loadFilters();
renderDeptOptions();
searchInput.value = state.query;
sortSelect.value = state.sort;
render();
