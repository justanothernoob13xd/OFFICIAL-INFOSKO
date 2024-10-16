// Function to fetch personnel based on the search query
function fetchPersonnel(searchQuery = '') {
    $.ajax({
        url: '/api/personnel-list/',  // Matches your Django URL pattern
        data: { search: searchQuery },  // Send search query to backend
        success: function (data) {
            if (data.length > 0) {
                $('#no-results-message').hide();  // Hide "no results" message if data is found
                if (searchQuery) {
                    const person = data[0];  // Handle the first result
                    openPersonnelModal(person);  // Open the modal for the first result
                } else {
                    updatePersonnelLayout(data);  // Update layout for multiple results
                }
            } else {
                // Show the "Sorry, no personnel found" message
                $('#no-results-message').text('Sorry, no personnel found.').show();
            }
        },
        error: function () {
            // Show an error message if there's a failure in fetching personnel
            $('#no-results-message').text('Error fetching personnel information.').show();
        }
    });
}

// Function to open the personnel modal with data
function openPersonnelModal(person) {
    // Update the modal with the personnel data
    $('#modal-name').text(person.name);
    $('#modal-position').text('Position: ' + person.position);
    $('#modal-location').text('Location: ' + person.location);
    $('#modal-contact').text('Contact: ' + person.contact);
    $('#modal-image').attr('src', person.image || 'https://via.placeholder.com/150');  // Handle image

    // Show the modal
    $('#personnelModal').show();
}

// Hide modal when clicking outside the modal content or close button
function hideModal(event) {
    if (!event || event.target === event.currentTarget) {
        $('#personnelModal').hide();
    }
}

// Ensure personnel data is loaded on page load
$(document).ready(function() {
    fetchPersonnel();  // Load personnel data without search query (initial load)
});

// Search button functionality
$('#search-button').on('click', function() {
    const searchQuery = $('#search-input').val().trim();  // Make sure searchQuery is defined here
    if (searchQuery) {
        $('#no-results-message').hide();  // Hide any previous "no results" message
        fetchPersonnel(searchQuery);    // Perform search with input value
    } else {
        $('#no-results-message').text('Please enter a name or keyword to search.').show();  // Show input warning
    }
});

// Autocomplete functionality for the search input
$('#search-input').autocomplete({
    source: function(request, response) {
        $.ajax({
            url: '/api/personnel-suggestions/',  // API for suggestions
            data: { search: request.term },  // Send search term
            success: function(data) {
                response($.map(data, function(person) {
                    return {
                        label: person.name,  // Suggestion label
                        value: person.name,  // Input value
                        id: person.id        // Personnel ID
                    };
                }));
            },
            error: function(error) {
                console.error('Error fetching suggestions:', error);
            }
        });
    },
    select: function(event, ui) {
        // When a suggestion is selected, trigger search
        fetchPersonnel(ui.item.label);
    },
    minLength: 2  // Trigger after 2 characters
});

// Function to create the layout for personnel display
function createPersonnelLayout(personnelData, container, type = '') {
    const keyPersonnelContainer = $('<div class="key-personnel-container"></div>');
    const topRow = $('<div class="key-personnel-row"></div>');
    const bottomRow = $('<div class="key-personnel-row"></div>');

    personnelData.forEach((person, index) => {
        const personCard = `
            <div class="person-image-container" onclick="showModal(${person.id})">
                <img src="${person.image || 'https://via.placeholder.com/150'}" class="person-image" alt="${person.name}">
                <h5 class="person-name">${person.name}</h5>
            </div>
        `;

        if (type === 'key-person') {
            if (index === 0) {
                topRow.append(personCard);  // Top row (1 person)
            } else {
                bottomRow.append(personCard);  // Bottom row (remaining persons)
            }
        } else {
            const personnelSection = $('<div class="personnel-section"></div>');
            personnelSection.append(personCard);
            container.append(personnelSection);
        }
    });

    keyPersonnelContainer.append(topRow, bottomRow);
    container.append(keyPersonnelContainer);
}

// Function to show modal with personnel information
function showModal(id) {
    $.ajax({
        url: `/api/personnel/${id}/`,
        method: 'GET',
        success: function(person) {
            if (person) {
                openPersonnelModal(person);
            } else {
                console.error("Invalid personnel ID:", id);
            }
        },
        error: function(error) {
            console.error('Error fetching personnel:', error);
        }
    });
}

// Close modal when clicking outside the modal content
$(document).on('click', '#personnelModal', function(event) {
    if (!$(event.target).closest('.modal-content').length) {
        $('#personnelModal').fadeOut(400);  // Hide modal with fade-out effect
    }
});

// Function to update the personnel layout when multiple results are found
function updatePersonnelLayout(data) {
    const keyPersonsContainer = $('#key-persons-container');
    const fullTimeContainer = $('#full-time-container');
    const partTimeContainer = $('#part-time-container');

    // Clear existing content
    keyPersonsContainer.empty();
    fullTimeContainer.empty();
    partTimeContainer.empty();

    const keyPersons = data.filter(person => person.employment_type === 'key-person');
    const fullTimePersonnel = data.filter(person => person.employment_type === 'full-time');
    const partTimePersonnel = data.filter(person => person.employment_type === 'part-time');

    if (keyPersons.length === 0 && fullTimePersonnel.length === 0 && partTimePersonnel.length === 0) {
        $('#no-results-message').text('Sorry, no personnel found.').show();  // Show "No personnel found" message
    } else {
        $('#no-results-message').hide();  // Hide the alert
    }

    createPersonnelLayout(keyPersons, keyPersonsContainer, 'key-person');
    createPersonnelLayout(fullTimePersonnel, fullTimeContainer);
    createPersonnelLayout(partTimePersonnel, partTimeContainer);
}
