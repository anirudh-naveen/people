// with no #, query selector looks for an element named 'name'
// with #, query selector looks for an element with the id 'name'

const form = document.querySelector('.form');
const newHires = document.querySelector('#status')
const list = document.querySelector('#new-hires')

const field = document.querySelector('#notes')
const counter = document.querySelector('#notes-count')
const submitBtn = document.querySelector('#submit-btn')
const agree = document.querySelector('#agree');

/// <summary>
/// Handles form submission.
/// </summary>
form.addEventListener('submit', (event) => {
    event.preventDefault(); // prevent default form submission

    const data = new FormData(form);
    const name = data.get('fullName').trim();
    const email = data.get('email').trim();
    const dept = data.get('department');

    if (name.length < 2) {
        newHires.textContent = 'Please enter a full name.'
        return;
    }

    if (!email.endsWith('@acme.com')) {
        newHires.textContent = 'Please enter a valid ACME email address.'
        return;
    }

    const li = document.createElement('li');
    li.textContent = `${name} - ${dept}`;
    list.append(li);

    const removeBtn = document.createElement('button');
    // defaults to type="submit"
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remove';
    removeBtn.setAttribute('aria-label', `Remove ${name}`);
    li.append(removeBtn);

    removeBtn.addEventListener('click', (event) => {
        li.remove();
    });

    newHires.textContent = `Added ${name}.`;
    form.reset();
    form.querySelector('input').focus();
});



form.addEventListener('reset', () => {
    submitBtn.disabled = true;
    counter.textContent = '0/200';
    newHires.textContent = '';
});


/// <summary>
/// Handles submit button state.
/// </summary>
agree.addEventListener('change', (event) => {
    submitBtn.disabled = !agree.checked;
});


/// <summary>
/// Tracks characters typed in the notes field.
/// </summary>
field.addEventListener('input', (event) => {
    const length = field.value.length;
    counter.textContent = `${length}/200`;
});