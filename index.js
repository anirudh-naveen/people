// use # for const to define true privacy
const densityBtn = document.querySelector('#density');
const dataTable = document.querySelector('.data-table');
const fill = document.querySelector('.progress__fill');

const state = {
    employees: [
        { id: 1, name: 'Priya Shah', role: 'Senior Engineer', dept: 'Engineering', salary: 115000, start: '2022-03-01', status: 'Active', img: 12 },
        { id: 2, name: 'Marcus Lee', role: 'Account Executive', dept: 'Sales', salary: 80000, start: '2024-07-15', status: 'Active', img: 13 },
        { id: 3, name: 'Ana Gomez', role: 'People Partner', dept: 'People', salary: 80000, start: '2021-11-08', status: 'Active', img: 5 },
        { id: 4, name: 'Jordan Kim', role: 'Senior Engineer', dept: 'Engineering', salary: 120000, start: '2025-01-20', status: 'Active', img: 15 },
        { id: 5, name: 'Jamie Taylor', role: 'Account Executive', dept: 'Sales', salary: 75000, start: '2023-06-12', status: 'Active', img: 12 },
        { id: 6, name: 'Morgan Lee', role: 'People Partner', dept: 'People', salary: 85000, start: '2022-09-30', status: 'Active', img: 6 },
        { id: 7, name: 'Alex Johnson', role: 'Staff Engineer', dept: 'Engineering', salary: 145000, start: '2021-05-15', status: 'Active', img: 7 },
        { id: 8, name: 'Slug Freeman', role: 'Analyst', dept: 'Finance', salary: 100000, start: '2026-01-01', status: 'Active', img: 8 },
    ],
    query: '',
    dept: 'All',
    sort: 'name',
    tableSort: { key: 'name', dir: 'asc' },
};


const departments = new Set() 
// 'in' → keys (of an object)
// 'of' → items (of an array, Set, string...)
for (const e of state.employees) {
    departments.add(e.dept)
}

// [...departments] unpacks the sets elements into an array
const sortedDepts = [...departments].sort();
const deptSelect = document.querySelector('#dept')

// automatic department filter
for (const name of sortedDepts) {
    const option = document.createElement('option');
    option.textContent = name;
    deptSelect.append(option);
}



/// Toggles the density of the data table.
densityBtn.addEventListener('click', () => {
    const on = document.body.classList.toggle('compact');
    densityBtn.setAttribute('aria-pressed', on);
});


dataTable.addEventListener('click', (event) => {
    const clickedRow = event.target.closest('tbody tr');
    if (clickedRow) {
        // classList methods (affects the list of classes the element has)
            //.add
            //.remove
            //.toggle
            //contains
        clickedRow.classList.toggle('is-selected')
        const selectedCount = document.querySelectorAll('.data-table tbody tr.is-selected').length;
        document.querySelector('#selected-count').textContent = `Selected: ${selectedCount}`;

        const rows = dataTable.rows.length
        fill.style.setProperty('--progress', `${(selectedCount / (dataTable.rows.length - 1)) * 100}%`);
    }
});


// returns the visible employee info based on the filters
function getVisible() {
    // state.query is whatever that is in the search box
    const q = state.query.trim().toLowerCase();
    return state.employees 
        .filter((e) => state.dept === 'All' || e.dept === state.dept)
        .filter((e) => `${e.name} ${e.role}`.toLowerCase().includes(q))
        .sort((a, b) =>
            state.sort === 'name' ? a.name.localeCompare(b.name) :
                b.start.localeCompare(a.start)
    );
}



const listEl = document.querySelector('.card-list');
const countEl = document.querySelector('#result-count');
const tableEl = document.querySelector('.data-table');
const tbodyEl = document.querySelector('.data-table tbody');


// escape text before putting it in innerHTML to prevent XSS
const escapeHTML = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;',
        '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));



// declares the html of the cards based on what is in data
function cardEl(e) {
    // create the elements, fill them, put them together
    const article = document.createElement('article');
    article.className = 'card';
    article.dataset.id = e.id;

    const img = document.createElement('img');
    img.src = `https://i.pravatar.cc/120?img=${e.img}`;
    img.alt = '';
    img.width = 120;
    img.height = 120;

    const name = document.createElement('h3');
    name.textContent = e.name;

    const role = document.createElement('p');
    role.className = 'role';
    role.textContent = e.role;

    const dept = document.createElement('p');
    dept.className = 'dept';
    dept.textContent = e.dept;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn';
    btn.dataset.action = 'remove';
    btn.textContent = 'Remove';

    article.append(img, name, role, dept, btn);
    return article;   // an ELEMENT, not a string
}

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


function getSortedPayroll() {
    const { key, dir } = state.tableSort;
    return [...state.employees].sort((a, b) => {
        const result = typeof a[key] === 'number'
            ? a[key] - b[key]
            : a[key].localeCompare(b[key]);
        return dir === 'asc' ? result : -result;
    });
}


function render() {
    const visible = getVisible();
    listEl.replaceChildren(...visible.map(cardEl));
    countEl.textContent = `${visible.length} of ${state.employees.length} people`;
    
    tbodyEl.innerHTML = getSortedPayroll().map(payrollHTML).join('');
    document.querySelectorAll('.data-table thead th').forEach((th) => {
        if (th.dataset.key === state.tableSort.key) {
            th.setAttribute('aria-sort', state.tableSort.dir === 'asc' ? 'ascending' : 'descending');
        } else {
            th.removeAttribute('aria-sort');
        }
    });
}

document.querySelector('#search').addEventListener('input', (e) => {
    state.query = e.target.value;
    render();
});

document.querySelector('#dept').addEventListener('change', (e) => {
    state.dept = e.target.value;
    render();
});

document.querySelector('#sort').addEventListener('change', (e) => {
    state.sort = e.target.value;
    render();
});

// EVENT DELEGATION: one listener on the parent handles every card's button,
// including cards rendered later.
listEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="remove"]');
    if (!btn) return;
    const id = Number(btn.closest('.card').dataset.id);
    state.employees = state.employees.filter((emp) => emp.id !== id);
    render();
});
render();


const addBtn = document.querySelector('.toolbar .btn--primary');
addBtn.addEventListener('click', (e) => {
    const nextId = Math.max(...state.employees.map((e) => e.id)) + 1;
    state.employees.push(
        { id: nextId, name: 'Slug Freeman', role: 'Analyst', dept: 'Finance', salary: 100000, start: '2026-01-01', status: 'Active', img: 8 }
    )
    render()
})


document.querySelector('.data-table thead').addEventListener('click', (e) => {
    const th = e.target.closest('th');
    if (!th) return;
    const key = th.dataset.key;

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