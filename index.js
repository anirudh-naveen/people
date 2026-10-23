const densityBtn = document.querySelector('#density');
const dataTable = document.querySelector('.data-table');
const fill = document.querySelector('.progress__fill');

/// <summary>
/// Toggles the density of the data table.
/// </summary>
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