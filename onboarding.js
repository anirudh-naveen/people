const form = document.querySelector('.form');
const status = document.querySelector('#status')
const list = document.querySelector('#new-hires')

const field = document.querySelector('#notes')
const counter = document.querySelector('#notes_count')

form.addEventListener('submit', (event) => {
    event.preventDefault(); // prevent default form submission

    const data = new FormData(form);
    const name = data.get('fullName').trim();
    const dept = data.get('department');

    if (name.length < 2) {
        status.textContent = 'Please enter a full name.'
        return;
    }

    const li = document.createElement('li');
    li.textContent = `${name} - ${dept}`;
    list.append(li);

    status.textContent = `Added ${name}.`;
    form.reset();
    form.querySelector('input').focus();
})

field.addEventListener('input', (event) => {
    const length = field.value.length;
    counter.textContent = `${length}/200`;
})