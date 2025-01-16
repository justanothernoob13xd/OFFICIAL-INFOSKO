document.addEventListener("DOMContentLoaded", function () {
    // Locate the fields in the form
    const employmentTypeField = document.getElementById("id_employment_type");
    const departmentPositionField = document.getElementById("id_department_position");

    // Ensure the script only runs when the fields exist (e.g., on add/change pages)
    if (employmentTypeField && departmentPositionField) {
        // Function to toggle the department position field based on employment type
        function toggleDepartmentPosition() {
            if (employmentTypeField.value === "key-person") {
                departmentPositionField.removeAttribute("disabled");
            } else {
                departmentPositionField.setAttribute("disabled", "disabled");
                departmentPositionField.value = ""; // Clear field if not key-person
            }
        }

        // Add event listener to handle changes in employment type
        employmentTypeField.addEventListener("change", toggleDepartmentPosition);

        // Initial call to set the correct state
        toggleDepartmentPosition();
    }   
    console.log("Custom admin JS loaded!");
});
