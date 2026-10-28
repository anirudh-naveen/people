// =====================================================================
// live.js: loads people from the randomuser.me API (Day 7)
// =====================================================================
//
// The same STATE → RENDER pattern as index.js, plus TIME: data arrives
// later, might fail, and might arrive out of order. So state also tracks
// WHERE the request is (loading? failed? finished?), and render() shows
// the right thing for each case.
//
// > Every async UI has these states: LOADING, ERROR, SUCCESS, and EMPTY.
// > Interviewers check whether you handle all of them.
//
// Two ways to get more data (pick with the dropdown):
//   "scroll" mode: Load more button + infinite scroll, APPENDING pages
//   "pages" mode:  Prev / 1 2 3 4 5 / Next, each page REPLACING the list
//
// File map:
//   1. Settings + the API call (getUsers)
//   2. State + element handles
//   3. Request bookkeeping (cancelling stale requests: the race condition)
//   4. Building elements (cards, skeletons, pager)
//   5. render()
//   6. Loading: loadNextPage (scroll mode), loadPage (pages mode)
//   7. Listeners: Load more, pager, mode switch, search, infinite scroll
//   8. Start-up


// =====================================================================
// 1. SETTINGS + THE API CALL
// =====================================================================
const API_URL = 'https://randomuser.me/api/';
const PAGE_SIZE = 12;
const LAST_PAGE = 5;        // randomuser has no end, so pretend it has 5 pages

// Fetch ONE page of people and return the array.
//   async function → can use `await` inside; always returns a promise,
//                    so callers write `await getUsers(1)` too
//   ?results=12    → 12 people per page
//   &page=…        → which page
//   &seed=acme     → the same "random" people every time, so pages never
//                    overlap or change between visits
//   &inc=…         → only include the fields we use (smaller response)
//   signal         → lets us CANCEL this request later (section 3)
async function getUsers(page, signal) {
    const url = `${API_URL}?results=${PAGE_SIZE}&page=${page}&seed=acme&inc=name,location,picture`;
    // await pauses THIS function (not the page) until the response
    // headers arrive.
    const res = await fetch(url, { signal });
    // ! fetch only REJECTS when the network fails. A 404 or 500 still
    // ! "succeeds", so check res.ok (true for status 200–299) yourself
    // ! and turn a bad status into an error. Classic interview gotcha.
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // Reading the body is a second async step: it parses the JSON text
    // into a JavaScript object. .results is the array of people.
    const data = await res.json();
    return data.results;
}


// =====================================================================
// 2. STATE + ELEMENT HANDLES
// =====================================================================
const state = {
    mode: 'scroll',     // 'scroll' or 'pages'
    people: [],         // everyone currently loaded
    // scroll mode: the NEXT page to load. pages mode: the CURRENT page.
    page: 1,
    loading: false,     // is a request in progress?
    error: null,        // the last error message, or null
    done: false,        // scroll mode: no more pages to load
    query: '',          // the search box text
};

const listEl = document.querySelector('#people');
const statusEl = document.querySelector('#status');
const moreBtn = document.querySelector('#more');
const pagerEl = document.querySelector('#pager');
const modeSelect = document.querySelector('#mode');
const searchInput = document.querySelector('#live-search');
const sentinel = document.querySelector('#sentinel');


// =====================================================================
// 3. REQUEST BOOKKEEPING: the race condition (Exercise 4)
// =====================================================================
// THE PROBLEM: click page 2, then page 3 quickly. The page-2 request
// might finish AFTER page 3's and overwrite it, so the screen says
// "page 3" but shows page 2's people.
//
// THE FIX, two layers (either alone would work; together they're tidy):
//   a) AbortController: before starting a request, CANCEL the previous
//      one. fetch then rejects with an 'AbortError', which we ignore.
//   b) A request counter: every request takes the next number. When a
//      response arrives, if a newer request has started since, its
//      number is no longer the latest, so the response is thrown away.
let controller = null;      // the AbortController of the request in flight
let latestRequest = 0;      // the number of the newest request

// Call this right before each fetch. Returns the signal to pass to
// fetch, and this request's number.
function startRequest() {
    if (controller) controller.abort();     // cancel whatever was running
    controller = new AbortController();
    latestRequest += 1;
    return { signal: controller.signal, id: latestRequest };
}

// true if a newer request has started since request `id`.
const isStale = (id) => id !== latestRequest;


// =====================================================================
// 4. BUILDING ELEMENTS
// =====================================================================
// Cards are built with createElement + textContent: the names come from
// an outside API, and textContent can never be parsed as HTML (no XSS).

const fullName = (p) => `${p.name.first} ${p.name.last}`;

// One person's card. The API's data is nested: p.name.first,
// p.picture.medium, p.location.city...
function personEl(p) {
    const li = document.createElement('li');
    li.className = 'card card--compact';

    const img = document.createElement('img');
    img.src = p.picture.medium;
    img.alt = '';               // the name is right below
    img.width = 72;
    img.height = 72;

    const name = document.createElement('h3');
    name.textContent = fullName(p);

    const place = document.createElement('p');
    place.className = 'dept';
    place.textContent = `${p.location.city}, ${p.location.country}`;

    li.append(img, name, place);
    return li;
}

// A grey placeholder card (Exercise 2). Same size and place as a real
// card, so nothing jumps when the data arrives. aria-hidden hides it from
// screen readers; they hear the "Loading…" status line instead.
function skeletonEl() {
    const li = document.createElement('li');
    li.className = 'card skeleton';
    li.setAttribute('aria-hidden', 'true');

    const circle = document.createElement('div');
    circle.className = 'skeleton__circle';
    const line = document.createElement('div');
    line.className = 'skeleton__line';
    const shortLine = document.createElement('div');
    shortLine.className = 'skeleton__line skeleton__line--short';

    li.append(circle, line, shortLine);
    return li;
}

// The numbered pager (Exercise 3): Prev, 1 … LAST_PAGE, Next.
// Every button carries data-page = the page it goes to, so ONE delegated
// listener (section 7) handles all of them.
function renderPager() {
    const button = (label, page, { current = false, disabled = false } = {}) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn';
        btn.textContent = label;
        btn.dataset.page = page;
        btn.disabled = disabled;
        // aria-current="page" marks the current page for screen readers;
        // CSS uses the same attribute to highlight it.
        if (current) btn.setAttribute('aria-current', 'page');
        return btn;
    };

    // Array.from({ length: 5 }, (_, i) => …) builds [fn(0), …, fn(4)].
    // `_` is a convention for "argument I don't use".
    const numbers = Array.from({ length: LAST_PAGE }, (_, i) =>
        button(String(i + 1), i + 1, { current: state.page === i + 1 }));

    pagerEl.replaceChildren(
        button('Previous', state.page - 1, { disabled: state.page <= 1 }),
        ...numbers,
        button('Next', state.page + 1, { disabled: state.page >= LAST_PAGE }),
    );
}


// =====================================================================
// 5. RENDER: make the page match `state`
// =====================================================================
function render() {
    // aria-busy tells screen readers the list is being updated.
    listEl.setAttribute('aria-busy', state.loading);

    // ---- The list ----
    if (state.loading && state.people.length === 0) {
        // FIRST load: nothing to show yet → six skeleton cards.
        // Array.from({ length: 6 }, skeletonEl) calls skeletonEl 6 times.
        listEl.replaceChildren(...Array.from({ length: 6 }, skeletonEl));
    } else {
        // Search filters what's already LOADED (it doesn't call the API).
        const q = state.query.trim().toLowerCase();
        const visible = state.people.filter((p) => fullName(p).toLowerCase().includes(q));

        if (visible.length) {
            listEl.replaceChildren(...visible.map(personEl));
        } else if (state.people.length) {
            // EMPTY state: people are loaded, but none match the search.
            const empty = document.createElement('li');
            empty.className = 'empty';
            empty.textContent = 'No one loaded so far matches your search.';
            listEl.replaceChildren(empty);
        } else {
            listEl.replaceChildren();       // nothing loaded (e.g. first load failed)
        }
    }

    // ---- The status line: exactly one message (or none) ----
    if (state.loading) {
        statusEl.textContent = 'Loading…';
    } else if (state.error) {
        statusEl.textContent = state.mode === 'scroll'
            ? `Couldn't load: ${state.error}.`
            : `Couldn't load: ${state.error}. Choose the page again to retry.`;
    } else if (state.mode === 'scroll' && state.done) {
        statusEl.textContent = "That's everyone.";
    } else {
        statusEl.textContent = '';
    }

    // ---- Scroll mode: the Load more button ----
    // Hidden in pages mode or when there's nothing left; disabled while a
    // request runs (no double clicks); "Retry" after an error. Retrying
    // needs no extra code: the page number only moves forward on success.
    moreBtn.hidden = state.mode !== 'scroll' || state.done;
    moreBtn.disabled = state.loading;
    moreBtn.textContent = state.error ? 'Retry' : 'Load more';

    // ---- Pages mode: the pager ----
    pagerEl.hidden = state.mode !== 'pages';
    if (state.mode === 'pages') renderPager();
}


// =====================================================================
// 6. LOADING
// =====================================================================

// SCROLL MODE: fetch the next page and ADD it to the end of the list.
async function loadNextPage() {
    // THE GUARD: ignore calls while a request is running, after the last
    // page, or in the other mode. Without it, scrolling would fire several
    // requests at once and add the same page more than once.
    // > Say this out loud in the interview.
    if (state.mode !== 'scroll' || state.loading || state.done) return;

    // Show the loading state straight away.
    state.loading = true;
    state.error = null;
    render();

    const { signal, id } = startRequest();
    try {
        const users = await getUsers(state.page, signal);
        if (isStale(id)) return;            // the mode changed meanwhile: drop it
        // push(...users) spreads the new people onto the END of the list.
        state.people.push(...users);
        state.page += 1;
        if (state.page > LAST_PAGE) state.done = true;
    } catch (err) {
        // AbortError = we cancelled it on purpose; not a real failure.
        if (err.name === 'AbortError' || isStale(id)) return;
        state.error = err.message;
    } finally {
        // `finally` runs whether the try worked, threw, or returned early.
        // Only the LATEST request is allowed to update the page.
        if (!isStale(id)) {
            state.loading = false;
            render();
            // If the first page doesn't fill a tall screen, the sentinel is
            // still in view, and IntersectionObserver won't fire again (it
            // only reports CHANGES). So keep loading until it's off-screen.
            if (!state.error && sentinelNearViewport()) loadNextPage();
        }
    }
}

// PAGES MODE: fetch one page and REPLACE the list with it.
// There's no "already loading" guard here on purpose: clicking quickly
// is allowed, and section 3 makes sure only the last click wins.
async function loadPage(page) {
    if (page < 1 || page > LAST_PAGE) return;
    state.page = page;
    state.loading = true;
    state.error = null;
    render();                               // the pager highlights the new page now

    const { signal, id } = startRequest();  // cancels the previous page's request
    try {
        const users = await getUsers(page, signal);
        if (isStale(id)) return;
        state.people = users;               // REPLACE, not append
        window.scrollTo({ top: 0 });        // start reading the new page from the top
    } catch (err) {
        if (err.name === 'AbortError' || isStale(id)) return;
        state.error = err.message;
    } finally {
        if (!isStale(id)) {
            state.loading = false;
            render();
        }
    }
}

// Switch between the two modes: cancel anything in flight, start again
// from page 1 with an empty list.
function switchMode(mode) {
    if (controller) controller.abort();
    latestRequest += 1;                     // makes any in-flight request stale
    Object.assign(state, {                  // copy these properties onto state
        mode, people: [], page: 1, loading: false, error: null, done: false,
    });
    if (mode === 'scroll') loadNextPage();
    else loadPage(1);
}


// =====================================================================
// 7. LISTENERS
// =====================================================================

// Load more / Retry (scroll mode).
moreBtn.addEventListener('click', loadNextPage);

// Pager buttons: one delegated listener reads data-page from whichever
// button was clicked. (A disabled button doesn't fire clicks.)
pagerEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-page]');
    if (!btn) return;
    loadPage(Number(btn.dataset.page));     // dataset values are strings
});

modeSelect.addEventListener('change', (e) => switchMode(e.target.value));

// ---------------------------------------------------------------------
// DEBOUNCED SEARCH (Exercise 1)
// ---------------------------------------------------------------------
// debounce(fn, ms) returns a NEW function that waits until calls stop for
// `ms` milliseconds, then calls fn once with the latest arguments.
//   - `timer` lives in a CLOSURE: every call of the returned function
//     shares it, even though debounce() itself finished long ago.
//   - each call cancels the pending one (clearTimeout) and schedules a
//     new one, so only the last keystroke in a burst gets through.
//   - ...args collects whatever arguments the caller passed (the event)
//     and passes them on to fn.
// > Debounce = wait for a pause (search boxes).
// > Throttle = run at most once every N ms (scroll, resize).
function debounce(fn, ms = 250) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}

searchInput.addEventListener('input', debounce((e) => {
    state.query = e.target.value;
    render();
}, 250));

// ---------------------------------------------------------------------
// INFINITE SCROLL with IntersectionObserver
// ---------------------------------------------------------------------
// The browser watches #sentinel (the empty div at the bottom) and calls
// us only when it enters or leaves view. Much cheaper and simpler than a
// 'scroll' listener, which fires dozens of times a second.
// rootMargin: '200px' grows the viewport by 200px, so loading starts a
// little BEFORE the user actually reaches the bottom.
// ! The !state.error check stops it hammering a failing server: after an
// ! error the sentinel stays in view, so it would retry endlessly. The
// ! user retries with the button instead.
const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !state.error) loadNextPage();
}, { rootMargin: '200px' });

observer.observe(sentinel);

// Is the sentinel within 200px of the bottom of the window right now?
// getBoundingClientRect() gives an element's position relative to the
// viewport; innerHeight is the window's height.
function sentinelNearViewport() {
    return sentinel.getBoundingClientRect().top < window.innerHeight + 200;
}


// =====================================================================
// 8. START-UP
// =====================================================================
// Load the first page. (loadNextPage renders the skeletons first.)
// Test the error state: DevTools → Network → throttling → "Offline",
// then click Load more.
loadNextPage();
