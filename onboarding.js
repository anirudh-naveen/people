// =====================================================================
// onboarding.js: JavaScript for the New Hire Onboarding form (JS track 2)
// =====================================================================
//
// Loaded by onboarding.html with <script src="onboarding.js" defer>.
// > A <script> with a src="" IGNORES any code written between its tags,
// > so all the code must live in this file.
//
// What this page does, with no page reload:
//   - submit → validate, add the new hire to a list, show a message
//   - an inline error under the email field (must end in @acme.com)
//   - a live "N/200" character counter under the notes textarea
//   - the Submit button stays disabled until "I agree" is checked
//   - each new hire gets a Remove button

// > querySelector takes a CSS selector:
// >   'x'  → an element named <x> (a tag)
// >   '#x' → the element with id="x"
// >   '.x' → an element with class="x"
const form = document.querySelector('.form');
// role="status" in the HTML makes screen readers announce its changes.
const status = document.querySelector('#status');
const list = document.querySelector('#new-hires');

const notes = document.querySelector('#notes');
const counter = document.querySelector('#notes-count');
const submitBtn = document.querySelector('#submit-btn');
const agree = document.querySelector('#agree');
const emailInput = document.querySelector('#email');
const emailError = document.querySelector('#email-error');


// ---------------------------------------------------------------------
// EMAIL CHECK (JS track 2, exercise 4)
// ---------------------------------------------------------------------
// The browser already checks the email FORMAT (type="email"). This adds
// our own rule: it must be an @acme.com address.
// Returns true/false and shows or hides the inline error.
//   aria-invalid="true" → screen readers announce "invalid entry", and
//                         CSS gives the input a red border
//   the error <p> is linked with aria-describedby (in the HTML), so it's
//   read out whenever the field is focused
function checkEmail() {
    const value = emailInput.value.trim();
    // Only complain once something's been typed: an empty required field
    // is the browser's job.
    const ok = value === '' || value.toLowerCase().endsWith('@acme.com');
    emailError.hidden = ok;
    emailInput.setAttribute('aria-invalid', !ok);
    return ok;
}

// 'blur' fires when focus LEAVES the field: check once the user is done,
// rather than shouting at them on every keystroke.
emailInput.addEventListener('blur', checkEmail);
// But once an error is showing, re-check as they type so it disappears
// as soon as it's fixed.
emailInput.addEventListener('input', () => {
    if (!emailError.hidden) checkEmail();
});


// ---------------------------------------------------------------------
// SUBMIT: runs when the form is submitted (button click or Enter).
// The browser's built-in validation (required, type="email", min/max...)
// runs FIRST. This only fires if every field passes.
// ---------------------------------------------------------------------
form.addEventListener('submit', (event) => {
    // Without preventDefault the browser would send the form and reload
    // the page, wiping out everything we're about to add.
    event.preventDefault();

    // FormData reads every field by its name="..." attribute.
    // data.get('fullName') → the value of <input name="fullName">.
    const data = new FormData(form);
    const name = data.get('fullName').trim();
    const dept = data.get('department');

    // Our own checks. `return` stops the function early, so nothing below
    // runs and nothing gets added.
    if (name.length < 2) {
        status.textContent = 'Please enter a full name.';
        return;
    }
    if (!checkEmail()) {
        status.textContent = 'Please use your @acme.com email address.';
        emailInput.focus();                 // take the user straight to the problem
        return;
    }

    // Build the list item: CREATE → FILL → APPEND.
    // textContent is safe: a name containing <script> shows as plain text.
    // ! Order matters: set the li's textContent BEFORE appending the
    // ! button, because setting textContent replaces everything inside,
    // ! including child elements.
    const li = document.createElement('li');
    li.textContent = `${name} — ${dept} `;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';              // buttons default to type="submit"
    removeBtn.className = 'btn';
    removeBtn.textContent = 'Remove';
    // Without this, a screen reader hears "Remove, Remove, Remove" with no
    // idea which person each button is for.
    removeBtn.setAttribute('aria-label', `Remove ${name}`);

    // CLOSURE: this arrow function "remembers" the `li` from THIS run of
    // the submit handler, so each button removes only its own item.
    // It has to be created in here: li and removeBtn are block-scoped
    // (const inside these { }) and don't exist outside.
    removeBtn.addEventListener('click', () => {
        li.remove();
        status.textContent = `Removed ${name}.`;
    });

    li.append(removeBtn);
    list.append(li);

    // form.reset() clears every field AND fires the 'reset' event (handled
    // below) immediately. The reset handler clears the status line, so the
    // success message is written AFTER reset, or it would be wiped at once.
    form.reset();
    status.textContent = `Added ${name}.`;
    // Put the cursor back in the first field, ready for the next hire.
    form.querySelector('input').focus();
});


// ---------------------------------------------------------------------
// RESET: runs on the Clear button AND on form.reset() above.
// > form.reset() does NOT fire 'input' or 'change' events, so without
// > this the counter and the button would be stuck on their old values.
// > The 'reset' event fires BEFORE the fields are actually cleared, so
// > we set fixed values here instead of reading the fields.
// ---------------------------------------------------------------------
form.addEventListener('reset', () => {
    submitBtn.disabled = true;              // "I agree" will be unchecked
    counter.textContent = '0/200';
    status.textContent = '';
    emailError.hidden = true;
    emailInput.removeAttribute('aria-invalid');
});


// ---------------------------------------------------------------------
// "I AGREE" CHECKBOX → enable/disable Submit (exercise 2)
// 'change' fires when a checkbox is checked or unchecked.
// .checked is true/false; `!` flips it, so:
//   checked   → disabled = false (button works)
//   unchecked → disabled = true
// > The listener is on the checkbox itself. A listener on the whole form
// > would also fire for the radios and the textarea.
// > This is a UX nicety, NOT security: anyone can re-enable a button in
// > DevTools, and the checkbox's `required` does the real validation.
// ---------------------------------------------------------------------
agree.addEventListener('change', () => {
    submitBtn.disabled = !agree.checked;
});


// ---------------------------------------------------------------------
// LIVE CHARACTER COUNTER (exercise 1)
// 'input' fires on every keystroke, paste and delete ('change' would only
// fire when the field loses focus). maxlength="200" in the HTML stops
// the user typing more.
// ---------------------------------------------------------------------
notes.addEventListener('input', () => {
    counter.textContent = `${notes.value.length}/200`;
});
