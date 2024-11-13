document.addEventListener("DOMContentLoaded", function () {
    const employmentTypeField = document.getElementById("id_employment_type");
    const departmentPositionField = document.getElementById("id_department_position");

    function toggleDepartmentPosition() {
        if (employmentTypeField.value === "key-person") {
            departmentPositionField.removeAttribute("disabled");
        } else {
            departmentPositionField.setAttribute("disabled", "disabled");
            departmentPositionField.value = "";  // Clear field if not key-person
        }
    }

    employmentTypeField.addEventListener("change", toggleDepartmentPosition);
    toggleDepartmentPosition();  // Initial call to set state
});
