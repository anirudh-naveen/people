// =====================================================================
// live.js: loads people from the randomuser.me API (Day 7)
// =====================================================================
//
// Same STATE → RENDER pattern as index.js, plus async loading.


// ---------------------------------------------------------------------
// TODO · Day 7: getUsers(page)
// · Fetch one page of 12 people from https://randomuser.me/api/ (use a
// · fixed seed so pages stay consistent) and return the array of people.
// · Throw an error if the response isn't OK.
// ---------------------------------------------------------------------


// ---------------------------------------------------------------------
// TODO · Day 7: STATE
// · The loaded people, the next page number, whether a request is in
// · progress, the last error, and whether there are no more pages.
// ---------------------------------------------------------------------


// ---------------------------------------------------------------------
// TODO · Day 7: render()
// · - One card per person: photo, full name, city and country.
// · - The status line shows "Loading…" while loading, the error message
// ·   if something failed, and nothing otherwise.
// · - The button is disabled while loading or when there are no more
// ·   pages, and reads "Retry" after an error.
// ---------------------------------------------------------------------


// ---------------------------------------------------------------------
// TODO · Day 7: loadNextPage()
// · - Never start a second request while one is running, or after the
// ·   last page (pretend the API has 5 pages).
// · - Show the loading state, fetch the next page, add the new people to
// ·   the existing list, and move to the next page.
// · - On failure, record the error.
// · - Whatever happens, finish by leaving the loading state and
// ·   re-rendering.
// · Hook it to the Load more button, and load the first page on start.
// · Test the error state with DevTools → Network → Offline.
// ---------------------------------------------------------------------


// ---------------------------------------------------------------------
// TODO · Day 7: INFINITE SCROLL
// · Load the next page automatically when the #sentinel element comes
// · within 200px of the bottom of the screen, without listening to every
// · scroll event.
// ---------------------------------------------------------------------


// ---------------------------------------------------------------------
// TODO · Day 7, Exercise 1: DEBOUNCED SEARCH
// · Filter the loaded people by name as you type, but only after typing
// · pauses for about 250ms. Write the debounce function yourself.
// ---------------------------------------------------------------------


// ---------------------------------------------------------------------
// TODO · Day 7, Exercise 2: SKELETON CARDS
// · Show 6 skeleton cards while the first page is loading.
// ---------------------------------------------------------------------


// ---------------------------------------------------------------------
// TODO · Day 7, Exercise 3: NUMBERED PAGES
// · Replace Load more with Prev / 1 2 3 / Next. Each page REPLACES the
// · list instead of adding to it.
// ---------------------------------------------------------------------


// ---------------------------------------------------------------------
// TODO · Day 7, Exercise 4: RACE CONDITION
// · If an older request finishes after a newer one, its results must not
// · overwrite the newer ones. Fix it by cancelling or ignoring stale
// · requests.
// ---------------------------------------------------------------------
