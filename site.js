// =====================================================================
// site.js: header behaviour shared by every page
// =====================================================================
//
// Loaded with <script src="site.js" defer> on index, onboarding and live.
// Two features, both in the site header:
//   1. THEME TOGGLE (JS track 6): switch light/dark and remember it.
//   2. HAMBURGER MENU (Day 6, Challenge 2): open/close the nav on phones.
//
// Both follow the same rule as the rest of the project: JS only changes
// STATE (an attribute or a class); CSS decides what that looks like.


// =====================================================================
// 1. THEME TOGGLE
// =====================================================================
// How the pieces fit together:
//   - styles.css has dark colour tokens for :root[data-theme="dark"], and
//     for the OS dark setting unless data-theme="light".
//   - The inline <script> in each page's <head> applies a SAVED choice
//     before the page is drawn (no flash of the wrong theme).
//   - This code handles the button: flip the choice, save it, update the
//     button's pressed state.

// document.documentElement = the <html> element. Setting
// root.dataset.theme writes the attribute data-theme="..." on it.
const root = document.documentElement;
const themeBtn = document.querySelector('#theme');

// What's actually showing right now? An explicit choice wins; otherwise
// follow the operating system. matchMedia runs a media query from JS and
// tells us whether it currently matches.
function currentTheme() {
    if (root.dataset.theme) return root.dataset.theme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Keep the button in sync: aria-pressed="true" = dark mode is on.
// > setAttribute turns the boolean into the string "true"/"false".
function syncThemeButton() {
    themeBtn.setAttribute('aria-pressed', currentTheme() === 'dark');
}

// Some pages might not have the button; `if (themeBtn)` avoids a crash.
if (themeBtn) {
    syncThemeButton();

    themeBtn.addEventListener('click', () => {
        const next = currentTheme() === 'dark' ? 'light' : 'dark';
        root.dataset.theme = next;
        // localStorage keeps a string per site, in this browser, across
        // reloads and restarts. try/catch because it can throw when
        // storage is blocked (some private-browsing modes).
        try {
            localStorage.setItem('theme', next);
        } catch (err) {
            // Not saved, but the theme still changed for this visit.
        }
        syncThemeButton();
    });

    // If the OS switches between light and dark while the page is open
    // (and the user hasn't picked a theme), the CSS follows automatically,
    // so the button must follow too. matchMedia(...) returns an object
    // that fires 'change' whenever the media query starts/stops matching.
    window.matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', syncThemeButton);
}


// =====================================================================
// 2. HAMBURGER MENU (phones only; CSS hides the button from 769px up)
// =====================================================================
// Clicking the button adds/removes .nav-open on the header. CSS shows the
// nav links as a drop-down panel while that class is there.
// aria-expanded tells screen readers whether the menu is open.
const header = document.querySelector('.site-header');
const navToggle = document.querySelector('.nav-toggle');

function setNavOpen(open) {
    header.classList.toggle('nav-open', open);     // 2nd argument: force on/off
    navToggle.setAttribute('aria-expanded', open);
}

if (navToggle) {
    navToggle.addEventListener('click', () => {
        // Currently open? Then close it, and vice versa.
        setNavOpen(!header.classList.contains('nav-open'));
    });

    // Close the menu after a link is picked (event delegation: one
    // listener on the header catches clicks on any link inside it).
    header.addEventListener('click', (e) => {
        if (e.target.closest('.nav-links a')) setNavOpen(false);
    });

    // Escape closes it and puts focus back on the button, so keyboard
    // users aren't left somewhere unexpected.
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && header.classList.contains('nav-open')) {
            setNavOpen(false);
            navToggle.focus();
        }
    });
}
