document.addEventListener('DOMContentLoaded', function () {
    const employmentTypeSelect = document.getElementById('id_employment_type');
    if (employmentTypeSelect) {
        employmentTypeSelect.addEventListener('click', function () {
            const placeholderOption = employmentTypeSelect.querySelector('option[value=""]');
            if (placeholderOption) {
                placeholderOption.style.display = 'none';
            }
        });
    }
});
