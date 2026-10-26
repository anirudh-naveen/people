// =====================================================================
// onboarding.js: JavaScript for the New Hire Onboarding form (JS track 2)
// =====================================================================
//
// Loaded by onboarding.html with <script src="onboarding.js" defer>.
// Remember: a <script> with a src="" IGNORES any code written between
// its tags, so all the code must live in this file.
//
// What this page does, with no page reload:
//   - submit → validate, add the new hire to a list, show a message
//   - live "N/200" character counter under the notes textarea
//   - Submit button disabled until "I agree" is checked
//   - each new hire gets a Remove button

// with no #, query selector looks for an element named 'name'
// with #, query selector looks for an element with the id 'name'
// (and with a dot, .name, it looks for an element with class="name")

const form = document.querySelector('.form');
// NOTE: despite its name, `newHires` is the <p id="status"> message
// paragraph, not the list. Renaming it to `status` would be clearer.
// role="status" in the HTML makes screen readers announce its changes.
const newHires = document.querySelector('#status')
const list = document.querySelector('#new-hires')

const field = document.querySelector('#notes')
const counter = document.querySelector('#notes-count')
const submitBtn = document.querySelector('#submit-btn')
const agree = document.querySelector('#agree');

// ---------------------------------------------------------------------
// SUBMIT: runs when the form is submitted (button click or Enter).
// The browser's built-in validation (required, type="email", min/max...)
// runs FIRST. This only fires if every field passes.
// ---------------------------------------------------------------------
/// <summary>
/// Handles form submission.
/// </summary>
form.addEventListener('submit', (event) => {
    event.preventDefault(); // prevent default form submission
    // (Without preventDefault the browser would send the form and reload
    // the page, wiping out everything we're about to add.)

    // FormData reads every field by its name="..." attribute.
    // data.get('fullName') → the value of <input name="fullName">.
    const data = new FormData(form);
    const name = data.get('fullName').trim();
    const email = data.get('email').trim();
    // NOTE: the form has no field with name="department", so this is
    // null and the list shows "Name - null". Add a
    // <select name="department"> to the form to fix it.
    const dept = data.get('department');

    // Extra validation. `return` stops the function early, so nothing
    // below runs and nothing gets added.
    if (name.length < 2) {
        newHires.textContent = 'Please enter a full name.'
        return;
    }

    if (!email.endsWith('@acme.com')) {
        newHires.textContent = 'Please enter a valid ACME email address.'
        return;
    }

    // Build the list item: create → fill → append.
    // textContent is safe: a name containing <script> shows as text.
    // Order matters: set textContent BEFORE appending the button,
    // because setting textContent replaces everything inside, including
    // child elements.
    const li = document.createElement('li');
    li.textContent = `${name} - ${dept}`;
    list.append(li);

    const removeBtn = document.createElement('button');
    // defaults to type="submit"
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remove';
    // Without this, a screen reader hears "Remove, Remove, Remove" with
    // no idea which person each button is for.
    removeBtn.setAttribute('aria-label', `Remove ${name}`);
    li.append(removeBtn);

    // CLOSURE: this arrow function "remembers" the `li` from THIS run of
    // the submit handler, so each button removes only its own item.
    // It has to be inside the handler: removeBtn and li are block-scoped
    // (declared with const inside these { }) and don't exist outside.
    removeBtn.addEventListener('click', (event) => {
        li.remove();
    });

    newHires.textContent = `Added ${name}.`;
    // form.reset() clears every field and fires the 'reset' event
    // (handled below) immediately, before the next line runs.
    // NOTE: the Clear button in the HTML has id="reset". An element with
    // that id inside a form REPLACES form.reset, so this line throws
    // "form.reset is not a function". Rename that id (e.g. "clear-btn").
    form.reset();
    // Put the cursor back in the first field, ready for the next hire.
    form.querySelector('input').focus();
});



// ---------------------------------------------------------------------
// RESET: runs on the Clear button AND on form.reset() above.
// Resetting the form does NOT fire 'input' or 'change' events, so the
// counter and the button would get stuck without this.
// ---------------------------------------------------------------------
form.addEventListener('reset', () => {
    submitBtn.disabled = true;
    counter.textContent = '0/200';
    // NOTE: this also wipes "Added <name>." right after a successful
    // submit (because submit calls form.reset()). Remove this line if
    // you want the success message to stay.
    newHires.textContent = '';
});


// ---------------------------------------------------------------------
// "I agree" checkbox → enable/disable Submit (exercise 2)
// 'change' fires when a checkbox is checked or unchecked.
// .checked is true/false; `!` flips it, so:
//   checked   → disabled = false (button works)
//   unchecked → disabled = true
// This is a UX nicety, NOT security: anyone can re-enable a button in
// DevTools, and the checkbox's `required` does the real validation.
// ---------------------------------------------------------------------
/// <summary>
/// Handles submit button state.
/// </summary>
agree.addEventListener('change', (event) => {
    submitBtn.disabled = !agree.checked;
});


// ---------------------------------------------------------------------
// Live character counter (exercise 1)
// 'input' fires on every keystroke, paste and delete. ('change' would
// only fire when the field loses focus.) maxlength="200" in the HTML
// stops the user typing more.
// ---------------------------------------------------------------------
/// <summary>
/// Tracks characters typed in the notes field.
/// </summary>
field.addEventListener('input', (event) => {
    const length = field.value.length;
    counter.textContent = `${length}/200`;
});
