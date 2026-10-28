// =====================================================================
// app.js: JS track 1 exercises (language basics) + shared helpers
// =====================================================================
//
// Loaded by index.html before index.js. Anything declared at the top
// level here (like formatSalary) becomes a global that index.js can call.
//
// > Heads-up: top-level `const` names here (employees, depts, copy) are
// > shared with the other scripts on the page. If index.js ever declared
// > its own `const employees`, the browser would throw
// > "Identifier 'employees' has already been declared".

// Practice data: an ARRAY of OBJECTS.
const employees = [
    { name: 'Priya Shah', dept: 'Engineering', salary: 120000 },
    { name: 'Marcus Lee', dept: 'Engineering', salary: 185000 },
    { name: 'Ana Gomez', dept: 'Sales', salary: 110000 },
    { name: 'Jordan Kim', dept: 'People', salary: 210000 },
];

// Average salary: add every salary up, divide by how many there are.
// for...of loops over the ITEMS of an array.
// ! Declare accumulators with `let`. Writing `total = 0` without it
// ! creates an accidental GLOBAL variable (and throws in strict mode).
// > A loop body without { } only includes the ONE next line, so braces
// > are used here to make the loop's extent obvious.
// Empty list → 0 instead of NaN (0 / 0).
function averageSalary(list) {
    if (list.length === 0) return 0;
    let total = 0;
    for (const item of list) {
        total += item.salary;
    }
    return total / list.length;
}


// Count employees per department → { Engineering: 2, Sales: 1, ... }
// reduce walks the array carrying an "accumulator" (here `counts`, which
// starts as the {} passed at the end).
//   counts[e.dept]       → bracket notation: property named by a variable
//   (counts[e.dept] || 0) → the current count, or 0 if this dept hasn't
//                           been seen yet (undefined || 0 → 0)
// Each step must RETURN the accumulator for the next step.
function byDept(list) {
    return list.reduce((counts, e) => {
        counts[e.dept] = (counts[e.dept] || 0) + 1;
        return counts;
    }, {});
}

// Employees whose name contains the query.
// filter keeps the items where the function returns true.
// ! .includes is case-SENSITIVE ('priya' won't find 'Priya'), so BOTH
// ! sides are lowercased before comparing, like getVisible() in index.js.
// An empty query returns everyone (every string includes '').
function search(list, query) {
    const q = query.trim().toLowerCase();
    return list.filter((e) => e.name.toLowerCase().includes(q));
}

// 1234567 → "$1,234,567.00"
// Intl.NumberFormat is the browser's built-in number formatter:
// 'en-US' = US style commas/dots, style 'currency' + 'USD' = dollar sign
// and 2 decimals. index.js uses this for the payroll table.
function formatSalary(salary) {
    return new Intl.NumberFormat(
        'en-US',
        { style: 'currency', currency: 'USD' }
    ).format(salary);
}

// The n-th highest earner, returned as a one-item array.
//   [...list]                  → copy first, because sort MUTATES
//   (a, b) => b.salary - a.salary → numbers, highest first
//   .slice(n-1, n)             → just position n (slice's end is exclusive)
// Returns null for an n that's out of range.
function topEarners(list, n) {
    if (n < 1 || n > list.length) return null;
    return [...list].sort((a, b) => b.salary - a.salary).slice(n-1, n);
}

// > other examples
// > (Cheat sheet of array methods. These lines run, but their results
// > aren't stored, so they don't affect anything.)
employees.map((e) => e.name); // ['Priya Shah', ...] transform each

employees.filter((e) => e.dept === 'Engineering'); // keep the matches
employees.find((e) => e.name.startsWith('M')); // first match or undefined

employees.some((e) => e.salary > 200000); // true if any match

[...employees].sort((a, b) => a.name.localeCompare(b.name)); // sort a COPY
const depts = [...new Set(employees.map((e) => e.dept))]; // unique values
const copy = { ...employees[0], salary: 190000 }; // copy + change one field
