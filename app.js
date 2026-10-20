const employees = [
    { name: 'Priya Shah', dept: 'Engineering', salary: 120000 },
    { name: 'Marcus Lee', dept: 'Engineering', salary: 185000 },
    { name: 'Ana Gomez', dept: 'Sales', salary: 110000 },
    { name: 'Jordan Kim', dept: 'People', salary: 210000 },
];

function averageSalary(list) {
    total = 0
    for (const item of list)
        total += item.salary
    return total/list.length
}


function byDept(list) {
    return list.reduce((counts, e) => {
        counts[e.dept] = (counts[e.dept] || 0) + 1;
        return counts;
    }, {});
}

function search(list, query) {
    if (!query) return null;
    return list.filter((e) => e.name.includes(query));
}

function formatSalary(salary) {
    return new Intl.NumberFormat(
        'en-US', 
        { style: 'currency', currency: 'USD' }
    ).format(salary);
}

function topEarners(list, n) {
    if (n < 1 || n > list.length) return null;
    return [...list].sort((a, b) => b.salary - a.salary).slice(n-1, n);
}


console.log(averageSalary(employees)) // 156250
console.log(byDept(employees)) // { Engineering: 2, Sales: 1, People: 1 }
console.log(search(employees, 'Priya')) // [{ name: 'Priya Shah', dept: 'Engineering', salary: 120000 }]
console.log(formatSalary(1234567)) // $1,234,567.00
console.log(topEarners(employees, 1)) // top 2nd earner


// other examples
employees.map((e) => e.name); // ['Priya Shah', ...] transform each

employees.filter((e) => e.dept === 'Engineering'); // keep the matches
employees.find((e) => e.name.startsWith('M')); // first match or undefined

employees.some((e) => e.salary > 200000); // true if any match

[...employees].sort((a, b) => a.name.localeCompare(b.name)); // sort a COPY
const depts = [...new Set(employees.map((e) => e.dept))]; // unique values
const copy = { ...employees[0], salary: 190000 }; // copy + change one field