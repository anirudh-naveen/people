// =====================================================================
// index.js: all the JavaScript for the Employee Directory page
// =====================================================================
//
// This file is loaded by index.html with <script src="index.js" defer>.
// "defer" means the browser waits until the whole HTML is parsed before
// running this file, so every element we look up below already exists.
// (Without defer, querySelector would run too early and return null.)
//
// The big idea in this file (JS track 4) is the STATE → RENDER pattern:
//   1. One `state` object holds everything that can change.
//   2. One `render()` function reads `state` and redraws the page.
//   3. Event listeners ONLY update `state`, then call `render()`.
// We never patch the page by hand. We change the data and redraw.
// This is exactly how React thinks (Day 8).
//
// Note: `formatSalary` used further down is NOT defined in this file.
// It comes from app.js, which index.html loads first. Functions declared
// at the top level of a classic script become globals, so this file can
// call them.


// > use # for const to define true privacy
// ---------------------------------------------------------------------
// Grab elements we need more than once.
// document.querySelector(selector) returns the FIRST element matching a
// CSS selector, or null if nothing matches.
//   '#density'        → # means "the element with id="density""
//   '.data-table'     → . means "an element with class="data-table""
//   '.progress__fill' → BEM naming: block "progress", element "fill"
// ---------------------------------------------------------------------
const densityBtn = document.querySelector('#density');
const dataTable = document.querySelector('.data-table');
const fill = document.querySelector('.progress__fill');


// =====================================================================
// STATE: the single source of truth for everything that can change
// =====================================================================
// `const` means the variable `state` can never point to a different
// object, but the object's CONTENTS can still change
// (e.g. state.query = 'priya' is allowed).
const state = {
    // The data. Each employee is an object: { key: value, ... }.
    //   salary is a plain NUMBER (115000), not a string like '$115,000'.
    //     Rule: store raw data, format it only when displaying it.
    //     Numbers sort correctly; strings sort letter by letter
    //     ('$80,000' would come after '$145,000' because '8' > '1').
    //   start is 'YYYY-MM-DD', so comparing as strings = comparing dates.
    //   img is just a number for the pravatar.cc placeholder photo.
    employees: [
        { id: 1, name: 'Priya Shah', role: 'Senior Engineer', dept: 'Engineering', salary: 115000, start: '2022-03-01', status: 'Active', featured: true , img: 5 },
        { id: 2, name: 'Marcus Lee', role: 'Account Executive', dept: 'Sales', salary: 80000, start: '2024-07-15', status: 'Active', img: 13 },
        { id: 3, name: 'Ana Gomez', role: 'People Partner', dept: 'People', salary: 80000, start: '2021-11-08', status: 'Active', img: 5 },
        { id: 4, name: 'Jordan Kim', role: 'Senior Engineer', dept: 'Engineering', salary: 120000, start: '2025-01-20', status: 'Active', img: 15 },
        { id: 5, name: 'Jamie Taylor', role: 'Account Executive', dept: 'Sales', salary: 75000, start: '2023-06-12', status: 'Active', img: 12 },
        { id: 6, name: 'Morgan Lee', role: 'People Partner', dept: 'People', salary: 85000, start: '2022-09-30', status: 'Active', img: 6 },
        { id: 7, name: 'Alex Johnson', role: 'Staff Engineer', dept: 'Engineering', salary: 145000, start: '2021-05-15', status: 'Active', img: 7 },
        { id: 8, name: 'Slug Freeman', role: 'Analyst', dept: 'Finance', salary: 100000, start: '2026-01-01', status: 'Active', img: 8 },
        // TODO · Day 5, Step 3: add about 10 more employees, so the page is
        // · long enough to test the sticky header and table header.
    ],
    // What's typed in the search box ('' = show everyone).
    query: '',
    // Chosen department. 'All' matches <option value="All"> in the HTML.
    dept: 'All',
    // Card order: 'name' (A–Z) or 'newest' (latest start date first).
    // These match the <option value="..."> values of the #sort dropdown.
    sort: 'name',
    // Payroll table sort: which column (key) and which direction (dir).
    // key must match a property name above ('name', 'dept', 'status',
    // 'salary') AND a data-key="..." on a <th> in the HTML.
    // dir is 'asc' (A→Z, low→high) or 'desc' (Z→A, high→low).
    tableSort: { key: 'name', dir: 'asc' },
};

// ---------------------------------------------------------------------
// TODO · JS track 6: REMEMBER THE FILTERS
// · Save the search text, department and card sort whenever they change,
// · and restore them on page load, so a refresh keeps them. The search
// · box and dropdowns should show the restored values too.
// ---------------------------------------------------------------------


// =====================================================================
// DEPARTMENT DROPDOWN: built from the data instead of hard-coded
// =====================================================================
// A Set is a collection that CAN'T hold duplicates. Adding 'Engineering'
// three times still stores it only once, so the result is the list of
// unique department names.
const departments = new Set()
// > 'in' → keys (of an object)
// > 'of' → items (of an array, Set, string...)
// for...of walks through the ITEMS of the array: each `e` is one employee
// object. (for...in would give the indexes '0', '1', '2'... instead.)
for (const e of state.employees) {
    departments.add(e.dept)
}

// > [...departments] unpacks the sets elements into an array
// A Set has no .sort(), so we spread it into a real array first.
// `...` = "take each value out of this collection"; wrapping it in [ ]
// collects those values into a new array. (Array(departments) would NOT
// work: it makes an array with ONE item, the Set itself.)
// .sort() with no compare function sorts strings alphabetically.
const sortedDepts = [...departments].sort();
const deptSelect = document.querySelector('#dept')

// automatic department filter
// For each name: CREATE an <option> element, FILL its text, APPEND it.
//   - createElement makes a new element in memory (not on the page yet).
//   - textContent sets plain text (safe: never parsed as HTML).
//     An <option> with no value="" uses its text as its value, so
//     choosing it sets state.dept to e.g. 'Engineering'.
//   - append adds it to the END of the <select>, so the hard-coded
//     "All Departments" option in the HTML stays first.
// This runs ONCE at page load. It must NOT go inside render(), or every
// keystroke in the search box would add duplicate options.
for (const name of sortedDepts) {
    const option = document.createElement('option');
    option.textContent = name;
    deptSelect.append(option);
}



// =====================================================================
// COMPACT VIEW BUTTON (JS track 3: JS toggles classes, CSS owns looks)
// =====================================================================
/// Toggles the density of the data table.
densityBtn.addEventListener('click', () => {
    // classList.toggle adds the class if missing, removes it if present,
    // and RETURNS true if the class is now there. So `on` is true/false.
    // The CSS rule `.compact .data-table td { ... }` does the visual work.
    const on = document.body.classList.toggle('compact');
    // aria-pressed tells screen readers this is a toggle button and
    // whether it's currently "pressed".
    densityBtn.setAttribute('aria-pressed', on);
});


// =====================================================================
// ROW SELECTION + "Selected: N" COUNTER + PROGRESS BAR
// =====================================================================
// EVENT DELEGATION: one listener on the whole <table>, not one per row.
// A click starts on the innermost element (a <td>) and BUBBLES up:
// td → tr → tbody → table. So this listener hears every click in the
// table, including rows that render() creates later.
dataTable.addEventListener('click', (event) => {
    // event.target = the element actually clicked (e.g. a <td>).
    // .closest(selector) walks UP from there and returns the first
    // ancestor (or itself) matching the selector, or null.
    // 'tbody tr' (not just 'tr') so header clicks return null and are
    // ignored instead of "selecting" the header row.
    const clickedRow = event.target.closest('tbody tr');
    // null counts as false, so header/caption clicks skip this block.
    if (clickedRow) {
        // > classList methods (affects the list of classes the element has)
            // > .add
            // > .remove
            // > .toggle
            // > contains
        // 'is-selected' is a name we made up. It's not in the HTML file.
        // JS adds it to the LIVE page (the DOM), and CSS
        // `.data-table tbody tr.is-selected` paints it purple.
        clickedRow.classList.toggle('is-selected')
        // Recount from the page every time instead of keeping a separate
        // counter variable, so the number can never drift out of sync.
        const selectedCount = document.querySelectorAll('.data-table tbody tr.is-selected').length;
        document.querySelector('#selected-count').textContent = `Selected: ${selectedCount}`;

        // Progress = selected ÷ total body rows × 100, as a percentage.
        // dataTable.rows includes the header row, hence the "- 1".
        // style.setProperty writes a CSS custom property (variable) on the
        // element. CSS reads it with `width: var(--progress, 0%)`.
        // The value needs a unit, so we add '%' in the template literal.
        fill.style.setProperty('--progress', `${(selectedCount / (dataTable.rows.length - 1)) * 100}%`);
    }
});


// =====================================================================
// getVisible(): which employees should the CARDS show, in what order?
// =====================================================================
// Reads `state`, returns a NEW array, changes nothing.
// returns the visible employee info based on the filters
function getVisible() {
    // state.query is whatever that is in the search box
    // .trim() removes spaces at both ends; .toLowerCase() makes the
    // search case-insensitive ("PRIYA" finds "Priya").
    const q = state.query.trim().toLowerCase();
    // Each method below returns a new array that the next one works on
    // (this is called "chaining").
    return state.employees
        // Filter 1 (department): keep everyone when 'All' is chosen
        // (|| stops at the first true), otherwise only matching depts.
        .filter((e) => state.dept === 'All' || e.dept === state.dept)
        // Filter 2 (search): glue name + role into one string, lowercase
        // it, and check whether the search text appears anywhere in it.
        // When q is '' every string .includes('') → everyone passes.
        .filter((e) => `${e.name} ${e.role}`.toLowerCase().includes(q))
        // Sort. The compare function returns negative (a first),
        // positive (b first) or 0. `? :` is a ternary (one-line if/else).
        //   'name'   → localeCompare = alphabetical A–Z
        //   'newest' → b vs a (swapped!) = latest start date first
        // .sort() changes the array it's called on, but here that's the
        // new array from .filter(), so state.employees keeps its order.
        .sort((a, b) => {
            if (a.featured !== b.featured) return a.featured ? -1 : 1;
            return state.sort === 'name'
                ? a.name.localeCompare(b.name)
                : b.start.localeCompare(a.start);
        });
}



// More element handles used by render().
const listEl = document.querySelector('.card-list');
const countEl = document.querySelector('#result-count');
// '.data-table tbody' = a <tbody> TAG inside an element with class
// data-table. (No dot before tbody: '.tbody' would mean a CLASS.)
const tbodyEl = document.querySelector('.data-table tbody');


// escape text before putting it in innerHTML to prevent XSS
// XSS (cross-site scripting): if data like a name contained
// '<img src=x onerror=alert(1)>' and we put it into innerHTML, the browser
// would create that tag and RUN the code. escapeHTML swaps the five
// dangerous characters for harmless "HTML entities", so they are
// displayed as text instead of being treated as markup.
//   String(s)            → make sure we have a string (numbers too)
//   /[&<>"']/g           → a regular expression: any of these characters,
//                          g = global, i.e. replace ALL of them
//   (c) => ({...}[c])    → look up the replacement for character c
const escapeHTML = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;',
        '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));



// =====================================================================
// cardEl(e): build ONE employee card as a real element
// =====================================================================
// Uses createElement + textContent instead of an HTML string.
// > Tradeoff (interview question!):
// >   + safe by default: textContent never parses HTML, so no escapeHTML
// >     is needed and there's nothing to forget
// >   + gives back a real element you could attach listeners to
// >   - much more verbose than a template string
// declares the html of the cards based on what is in data
function cardEl(e) {
    // create the elements, fill them, put them together
    const article = document.createElement('article');
    // className sets the whole class attribute. Fine here because the
    // element is brand new (no classes to overwrite).
    article.className = 'card';
    if (e.featured) article.classList.add('card--featured');
    // dataset.id = ... writes the attribute data-id="...".
    // The Remove listener reads it back with .dataset.id.
    article.dataset.id = e.id;

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    // Elements have properties matching their attributes (src, alt, ...).
    const img = document.createElement('img');
    img.src = `https://i.pravatar.cc/120?img=${e.img}`;
    // alt="" = decorative image: the name is right next to it, so a
    // screen reader should skip the photo instead of repeating the name.
    img.alt = '';
    // width/height let the browser reserve space before the image loads,
    // so the layout doesn't jump.
    img.width = 120;
    img.height = 120;

    const status = document.createElement('span');
    status.className = 'avatar__status';
    status.setAttribute('aria-label', 'Online');

    avatar.append(img, status)

    const name = document.createElement('h3');
    name.textContent = e.name;

    const role = document.createElement('p');
    role.className = 'role';
    role.textContent = e.role;

    const dept = document.createElement('p');
    dept.className = 'dept';
    dept.textContent = e.dept;

    const btn = document.createElement('button');
    // A <button> defaults to type="submit". 'button' = plain button.
    btn.type = 'button';
    btn.className = 'btn';
    // Writes data-action="remove", which the delegated Remove listener
    // looks for with closest('[data-action="remove"]').
    btn.dataset.action = 'remove';
    btn.textContent = 'Remove';

    // TODO · Day 5, Step 4: wrap the photo in a <div class="avatar"> and
    // · add a status dot element after it, with a label screen readers can
    // · read (e.g. "Online").

    // TODO · Day 6, Step 6: add the employee's email as a mailto: link.
    // · (The data needs an email for each employee first.)

    // TODO · Day 5, Challenge 1: give one employee a "featured" card that
    // · spans the full row of the grid.

    // append can take several elements at once, added in this order
    // (= top-to-bottom order of the card).
    article.append(avatar, name, role, dept, btn);
    return article;   // an ELEMENT, not a string
}

// =====================================================================
// payrollHTML(e): build ONE table row as an HTML STRING
// =====================================================================
// The template-string approach (compare with cardEl above). The string
// is turned into real elements when render() assigns it to innerHTML,
// so every piece of data MUST go through escapeHTML.
// formatSalary (from app.js) turns 115000 into "$115,000.00". It's a
// number we format ourselves, so it can't contain HTML.
// <td> = data cell. (<th> is only for header cells.)
// TODO · Day 6, Challenge 3: give each cell a data-label with its column
// · name, for the stacked mobile table layout.
function payrollHTML(e) {
    return `
        <tr>
            <td>${escapeHTML(e.name)}</td>
            <td>${escapeHTML(e.dept)}</td>
            <td>${escapeHTML(e.status)}</td>
            <td class="num">${formatSalary(e.salary)}</td>
        </tr>
    `;
}


// =====================================================================
// getSortedPayroll(): employees sorted for the TABLE
// =====================================================================
function getSortedPayroll() {
    // Destructuring: shorthand for
    //   const key = state.tableSort.key;
    //   const dir = state.tableSort.dir;
    const { key, dir } = state.tableSort;
    // [...state.employees] makes a COPY, because .sort() changes the
    // array it's called on and we don't want to reorder the real data.
    return [...state.employees].sort((a, b) => {
        // Bracket notation: a[key] reads the property whose NAME is stored
        // in `key`. If key is 'salary', a[key] is a.salary. That's how one
        // compare function works for every column.
        // Numbers compare by subtraction (negative → a first).
        // Strings compare with localeCompare (alphabetical).
        const result = typeof a[key] === 'number'
            ? a[key] - b[key]
            : a[key].localeCompare(b[key]);
        // Descending = flip the sign. Negative ↔ positive swaps every
        // pair, which reverses the whole order.
        return dir === 'asc' ? result : -result;
    });
}


// =====================================================================
// render(): redraw everything from `state`
// =====================================================================
// Called once at page load and after EVERY state change.
function render() {
    const visible = getVisible();
    // replaceChildren removes everything inside .card-list and puts in
    // whatever we pass. visible.map(cardEl) is an ARRAY of <article>
    // elements; `...` spreads them into separate arguments.
    // ! NOTE: when nothing matches, the list is just empty. The old
    // ! "No one matches." message isn't shown any more.
    listEl.replaceChildren(...visible.map(cardEl));
    countEl.textContent = `${visible.length} of ${state.employees.length} people`;

    // Table rows: map each employee to a <tr> string, join them into one
    // string (join('') so there are no commas between rows), and let
    // innerHTML turn that string into real rows inside the <tbody>.
    // Only the <tbody> is replaced, so the caption and header survive.
    // Side effect: rows are rebuilt, so any is-selected highlight is lost.
    tbodyEl.innerHTML = getSortedPayroll().map(payrollHTML).join('');
    // aria-sort tells screen readers which column is sorted and how.
    // Exactly ONE <th> should have it, so we visit every header:
    //   the sorted one gets 'ascending'/'descending' (full words, as ARIA
    //   requires), every other one has the attribute removed.
    // CSS reads this attribute to draw the arrows:
    //   th[aria-sort="ascending"] button::after { content: " ▲"; }
    document.querySelectorAll('.data-table thead th').forEach((th) => {
        if (th.dataset.key === state.tableSort.key) {
            th.setAttribute('aria-sort', state.tableSort.dir === 'asc' ? 'ascending' : 'descending');
        } else {
            th.removeAttribute('aria-sort');
        }
    });
}

// =====================================================================
// EVENT LISTENERS: update state, then render(). Nothing else.
// =====================================================================

// Search box. The 'input' event fires on every keystroke, paste or delete.
// e.target is the <input>; .value is its current text.
document.querySelector('#search').addEventListener('input', (e) => {
    state.query = e.target.value;
    render();
});

// Department dropdown. 'change' fires when a new option is picked.
document.querySelector('#dept').addEventListener('change', (e) => {
    state.dept = e.target.value;
    render();
});

// Card sort dropdown ('name' or 'newest').
document.querySelector('#sort').addEventListener('change', (e) => {
    state.sort = e.target.value;
    render();
});

// EVENT DELEGATION: one listener on the parent handles every card's button,
// including cards rendered later.
listEl.addEventListener('click', (e) => {
    // Was the click on (or inside) a Remove button? If not, stop.
    const btn = e.target.closest('[data-action="remove"]');
    if (!btn) return;
    // Find the card the button belongs to and read its data-id.
    // dataset values are always STRINGS, so Number() converts it to
    // match the numeric ids in state.
    const id = Number(btn.closest('.card').dataset.id);
    // Keep everyone EXCEPT this id. filter returns a new array, which
    // replaces the old one.
    state.employees = state.employees.filter((emp) => emp.id !== id);
    render();
});
// First draw when the page loads.
// > If anything inside render() throws an error, the script stops HERE and
// > none of the listeners below get attached. A good reason to check the
// > Console for the FIRST red error when several things break at once.
render();


// ---------------------------------------------------------------------
// TODO · JS track 5, Part 1: WIRE THE MODAL
// · Replace the hard-coded "Add Employee" below with the Day 5 modal:
// ·   - The Add Employee button opens it and moves focus inside it.
// ·   - The ×, Cancel, a click on the backdrop, and Escape all close it.
// ·   - Closing clears the form and returns focus to the Add Employee
// ·     button.
// ·   - Submitting adds an employee from the form's values, re-renders
// ·     and closes.
// ---------------------------------------------------------------------


const modal = document.querySelector('#add-modal');
const openBtn = document.querySelector('.toolbar .btn--primary');
const modalForm = modal.querySelector('form');

function openModal() {
    modal.hidden = false;
    modal.querySelector('input').focus();   // move focus into the dialog
}

function closeModal() {
    modal.hidden = true;
    modalForm.reset();
    openBtn.focus();                        // return focus where it came from
}

openBtn.addEventListener('click', openModal);
modal.querySelector('modal__close').addEventListener('click', closeModal);
modal.querySelector('.modal__actions .btn:not(.btn--primary)')
    .addEventListener('click', closeModal);

modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();       // clicked the backdrop
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
});

modalForm.addEventListener('submit'
, (e) => {
    e.preventDefault();
    state.employees.push({
        id: Date.now(),
        name: modal.querySelector('#m-name').value.trim(),
        role: modal.querySelector('#m-role').value.trim(),
        dept: 'Engineering',
        start: new Date().toISOString().slice(0, 10),
        img: 20,
    });
    render();
    closeModal();
});


// TODO · Day 7, Morning challenge: show a toast ("Added <name>") when an
// · employee is added, and remove it after 3 seconds.

// Add Employee button (hard-coded employee for practice; JS track 5
// replaces this with a real form in a modal).
const addBtn = document.querySelector('.toolbar .btn--primary');
addBtn.addEventListener('click', (e) => {
    // A unique id: take every id (map), spread them into separate
    // arguments (Math.max doesn't accept an array), then add 1.
    // Edge case: with zero employees, Math.max() is -Infinity.
    const nextId = Math.max(...state.employees.map((e) => e.id)) + 1;
    // push adds to the END of an array. (append is for DOM elements.)
    state.employees.push(
        { id: nextId, name: 'Slug Freeman', role: 'Analyst', dept: 'Finance', salary: 100000, start: '2026-01-01', status: 'Active', img: 8 }
    )
    render()
})


// Payroll table header clicks → sort by that column.
// One delegated listener on <thead> for all four header buttons.
document.querySelector('.data-table thead').addEventListener('click', (e) => {
    const th = e.target.closest('th');
    if (!th) return;
    // Reads data-key="..." from the clicked <th>.
    const key = th.dataset.key;

    // Same column as now → flip direction.
    // Different column → switch to it and start ascending.
    // > Remember: `=` ASSIGNS, `===` COMPARES.
    if (key === state.tableSort.key) {
        if (state.tableSort.dir === 'asc') {
            state.tableSort.dir = 'desc';
        } else {
            state.tableSort.dir = 'asc';
        }
        // flip state.tableSort.dir: 'asc' becomes 'desc', 'desc' becomes 'asc'
    } else {
        state.tableSort.key = key;
        state.tableSort.dir = 'asc';
        // set state.tableSort.key to the new key
        // and start at 'asc'
    }
    render();
});


// =====================================================================
// JS TRACK 5: INTERACTIVE COMPONENTS
// =====================================================================

// ---------------------------------------------------------------------
// TODO · JS track 5, Part 2: TABS
// · Clicking a tab shows its panel and hides the others. Only the selected
// · tab is reachable with Tab; the arrow keys move between tabs. Keep
// · aria-selected in sync.
// ---------------------------------------------------------------------


// ---------------------------------------------------------------------
// TODO · JS track 5, Part 3: ACCORDION
// · Each question button opens its answer and closes any other open one.
// · Keep aria-expanded in sync.
// ---------------------------------------------------------------------


// ---------------------------------------------------------------------
// TODO · Day 5, Challenge 2: "⋯" DROPDOWN MENU
// · The ⋯ button opens and closes its menu. Clicking outside the menu or
// · pressing Escape closes it.
// ---------------------------------------------------------------------

const menuBtn = document.querySelector('.menu .btn');
const menu = document.querySelector('#row-menu');

function closeMenu() {
    menu.hidden = true;
    menuBtn.setAttribute('aria-expanded', 'false');
}

menuBtn.addEventListener('click', () => {
    const open = menu.hidden;
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.menu')) closeMenu();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) closeMenu();
});

// =====================================================================
// JS TRACK 6: THEME
// =====================================================================

// ---------------------------------------------------------------------
// TODO · JS track 6: THEME TOGGLE
// · The #theme button switches between light and dark by setting
// · data-theme on <html>. The choice survives a page reload.
// ---------------------------------------------------------------------
