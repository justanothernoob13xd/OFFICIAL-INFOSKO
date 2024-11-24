// Track if modal has been closed to avoid accidental re-filters
let modalJustClosed = false;
let noResultsAlertVisible = false; 

// Debounce function for limiting search requests
function debounce(func, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

// Track the last search query to avoid redundant searches
let lastSearchQuery = '';

// Enhanced text normalization to handle variations in spaces, punctuation, and casing
function normalizeText(text) {
    return text.toLowerCase().replace(/\s+/g, '').replace(/[.\-]/g, '');  // Removes spaces, dots, and hyphens
}

// Fetch personnel with exact match handling
function hideModal() {
    $('#personnelModal').fadeOut(500, function () {
        // Restore the "no results" message only if it was previously visible
        if ($('#no-results-alert').is(':visible')) {
            $('#no-results-alert').fadeIn(500); // Ensure the message is displayed consistently
        }
    });
}

// Function to clear personnel display layout
function clearPersonnelDisplay() {
    clearHeaders();
    $('#key-persons-container, #full-time-container, #part-time-container').hide();
    noResultsAlertVisible = true; // Track visibility state for "No Results"
}

// Update the "Go Back" link functionality
$(document).on('click', '#go-back-link', function (event) {
    event.preventDefault();
    lastSearchQuery = '';
    noResultsAlertVisible = false; // Reset visibility state
    fetchPersonnel(); // Reset display to show all personnel
    $('#no-results-alert').hide();
    $('#go-back-link').hide();
    $('#search-input').removeClass('is-invalid');
    $('#search-input').val(''); // Clear search input
    $('#key-persons-container, #full-time-container, #part-time-container').show(); // Restore containers
});

// Improved fetchPersonnel function to handle modal restoration
function fetchPersonnel(searchQuery = '', triggerModal = false) {
    const normalizedQuery = normalizeText(searchQuery);

    if (!triggerModal) {
        clearHeaders();
    }

    $.ajax({
        url: '/api/personnel-list/',
        data: { search: searchQuery },
        success: function (data) {
            const exactMatch = data.find(person => normalizeText(person.name) === normalizedQuery);

            if (triggerModal && exactMatch) {
                openPersonnelModal(exactMatch);
            } else if (triggerModal) {
                noResultsAlertVisible = true;
                clearPersonnelDisplay();
                $('#no-results-alert')
                    .html('Sorry, no personnel found. <a href="#" id="go-back-link" style="text-decoration: underline;">Go back</a>')
                    .fadeIn(500);
            } else if (data.length === 0) {
                noResultsAlertVisible = true;
                clearPersonnelDisplay();
                $('#no-results-alert')
                    .html('Sorry, no personnel found. <a href="#" id="go-back-link" style="text-decoration: underline;">Go back</a>')
                    .fadeIn(500);
            } else {
                noResultsAlertVisible = false; // Reset alert visibility state
                $('#no-results-alert').hide();
                updatePersonnelLayout(data);
            }
        },
        error: function () {
            $('#no-results-alert').text('Error fetching personnel information.').fadeIn(500);
        }
    });
}

// Debounced function to control fetch timing
const debouncedFetchPersonnel = debounce(fetchPersonnel, 300);

// Search button functionality with trigger for modal on exact match
$('#search-button').on('click', function() {
    modalJustClosed = false;
    const searchQuery = $('#search-input').val().trim();
    if (searchQuery) {
        $('#search-input').removeClass('is-invalid');
        $('#no-results-alert').hide();
        fetchPersonnel(searchQuery, true);  // Set triggerModal to true for search button click
    } else {
        $('#search-input').addClass('is-invalid');
        $('#search-input').attr('placeholder', 'Please enter a name or keyword to search');
    }
});

// Autocomplete for search input with debounced fetching of suggestions
$('#search-input').autocomplete({
    source: debounce(function (request, response) {
        // AJAX call to fetch suggestions from the backend
        $.ajax({
            url: '/api/personnel-suggestions/',
            data: { search: request.term },
            success: function (data) {
                response($.map(data, function (person) {
                    // Modify label: exclude employment type only for "Key - Person"
                    let label = person.name;
                    if (person.employment_type !== 'key-person') {
                        label += ` (${person.employment_type.replace('-', ' ')})`;
                    }
                    
                    return {
                        label: label, // Adjusted label
                        value: person.name,
                        id: person.id,
                    };
                }));
            },
            error: function (error) {
                console.error('Error fetching suggestions:', error);
            },
        });
    }, 300), // Debounce AJAX call to limit requests
    select: function (event, ui) {
        // Triggered when a dropdown item is selected
        modalJustClosed = true;

        // Fetch full personnel details for the selected item
        $.ajax({
            url: `/api/personnel/${ui.item.id}/`, // Get personnel by ID
            method: 'GET',
            success: function (person) {
                openPersonnelModal(person); // Open modal with the personnel's details
            },
            error: function (error) {
                console.error('Error fetching personnel data:', error);
            },
        });
    },
    minLength: 2, // Require at least 2 characters before showing suggestions
});

// Reset `modalJustClosed` when modal is hidden, to avoid immediate re-filtering
$('#personnelModal').on('hidden.bs.modal', function () {
    modalJustClosed = true;

    // Do not reset the page if personnel results are already displayed
    if (!noResultsAlertVisible) {
        return;
    }

    // Restore "No Results" state if applicable
    $('#no-results-alert').show();
    $('#go-back-link').show();
});

// Function to open the personnel modal with data
function openPersonnelModal(person) {
    $('#modal-name').text(person.name);
    $('#modal-location').text('Location: ' + person.location);
    $('#modal-contact').text('Contact: ' + person.contact);
    $('#modal-image').attr('src', person.image || 'https://via.placeholder.com/150');
    if (person.display_position) {
        $('#modal-position').html(`<span class="university-position">Position: ${person.display_position}</span>`);
    } else {
        $('#modal-position').text('');
    }

    // Fade out alert when opening modal, if visible
    if ($('#no-results-alert').is(':visible')) {
        $('#no-results-alert').fadeOut(500); // Smooth fade out
    }

    $('#personnelModal').fadeIn(500); // Show modal
}

// Function to handle modal closing and restore "No Results" state
function hideModal() {
    $('#personnelModal').fadeOut(500, function () {
        if (noResultsAlertVisible) {
            $('#no-results-alert').fadeIn(500); // Restore alert smoothly
        }
    });
}

// Event to hide modal when clicking outside modal content or on close button
$(document).on('click', '#personnelModal, .close-modal', function(event) {
    if (!$(event.target).closest('.modal-content').length || $(event.target).hasClass('close-modal')) {
        hideModal();
    }
});

// Function to clear personnel display layout
function clearHeaders() {
    $('#key-persons-container, #full-time-container, #part-time-container').empty();
    $('#full-time-header, #part-time-header, #key-persons-header').hide();
}

// Function to clear personnel display layout
function clearPersonnelDisplay() {
    // Hide and clear all personnel containers and headers
    $('#key-persons-container, #full-time-container, #part-time-container').empty().hide();
    $('#full-time-header, #part-time-header, #key-persons-header').hide(); // Ensure headers are hidden
    noResultsAlertVisible = true; // Mark that "No Results" state is active
}


// "Go Back" link to reset personnel display and search input
$(document).on('click', '#go-back-link', function (event) {
    event.preventDefault();
    lastSearchQuery = '';
    noResultsAlertVisible = false; // Reset alert visibility state
    fetchPersonnel(); // Reset personnel display
    $('#no-results-alert').fadeOut(500); // Smooth fade-out
    $('#go-back-link').fadeOut(500);
    $('#search-input').removeClass('is-invalid').val(''); // Clear search input
    $('#key-persons-container, #full-time-container, #part-time-container').fadeIn(500); // Restore containers
});

// Function to update the personnel layout when multiple results are found
function updatePersonnelLayout(data) {
    // Clear all containers
    const keyPersonsContainer = $('#key-persons-container').empty().show();
    const fullTimeContainer = $('#full-time-container').empty().show();
    const partTimeContainer = $('#part-time-container').empty().show();

    // Filter data into categories
    const keyPersons = data.filter(person => person.employment_type === 'key-person');
    const fullTimePersonnel = data.filter(person => person.employment_type === 'full-time');
    const partTimePersonnel = data.filter(person => person.employment_type === 'part-time');

    // Handle visibility of headers based on data
    if (fullTimePersonnel.length > 0) {
        $('#full-time-header').show();
    } else {
        $('#full-time-header').hide();
    }

    if (partTimePersonnel.length > 0) {
        $('#part-time-header').show();
    } else {
        $('#part-time-header').hide();
    }

    if (keyPersons.length > 0) {
        $('#key-persons-header').show();
    } else {
        $('#key-persons-header').hide();
    }

    // Populate containers with filtered data
    createPersonnelLayout(keyPersons, keyPersonsContainer, 'key-person');
    createPersonnelLayout(fullTimePersonnel, fullTimeContainer);
    createPersonnelLayout(partTimePersonnel, partTimeContainer);
}

// Function to create the triangular hierarchy layout for personnel
function createPersonnelLayout(personnelData, container, type = '') {
    const keyPersonnelContainer = $('<div class="key-personnel-container"></div>');
    const topRow = $('<div class="key-personnel-row"></div>');
    const bottomRow = $('<div class="key-personnel-row"></div>');

    personnelData.forEach((person, index) => {
        const personCard = `
            <div class="person-image-container" onclick="showModal(${person.id})">
                <img src="${person.image || 'https://via.placeholder.com/150'}" class="person-image" alt="${person.name}">
                <h5 class="person-name">${person.name}</h5>
                ${type === 'key-person' && person.department_position ? `<p class="person-position">${person.department_position}</p>` : ''}
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
            hideModal();
        }
    });
}

// Auto-refresh personnel layout every 5 minutes
setInterval(() => {
    if (!modalJustClosed) {
        fetchPersonnel(lastSearchQuery || ''); // Fetch all if no search query
    }
}, 5000); // Lower interval to 5 seconds for testing

// Initialize personnel display on page load
$(document).ready(function() {
    fetchPersonnel(); // Initial call to display all personnel
});

// Idle timer function to redirect to index after 1 minute of inactivity
let idleTimer, countdownTimer, countdown = 60; // 60 seconds for 1 minute

function startIdleTimer() {
    countdown = 60; // Reset countdown to 1 minute
    console.log("Idle timer started. Redirecting in 1 minute...");
    countdownTimer = setInterval(function () {
        countdown--;
        console.log(`Redirecting in ${countdown} seconds...`); // Log countdown in console
        if (countdown <= 0) {
            clearInterval(countdownTimer);
            console.log("Redirecting now...");
            window.location.href = '/'; // Redirect to the index page
        }
    }, 1000); // 1-second intervals
}

function resetIdleTimer() {
    clearTimeout(idleTimer);
    clearInterval(countdownTimer);
    console.log("User activity detected. Idle timer reset.");
    idleTimer = setTimeout(startIdleTimer, 60000); // Restart idle timer for 1 minute
}

// Reset timer on scroll or click
$(document).on('scroll click', resetIdleTimer);

// Start idle timer on page load
startIdleTimer();
