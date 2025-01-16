// Global Variables
let modalJustClosed = false;
let noResultsAlertVisible = false;
let currentPage = 1;
let isLoading = false;
let displayedPersonnelIds = new Set();
const pageSize = 50;
let lastSearchQuery = '';
let lastUpdateTime = null;

// Debounce Helper
function debounce(func, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

// Text Normalization
function normalizeText(text) {
    return text.trim().toLowerCase().replace(/\s+/g, '').replace(/[.\-]/g, '');
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

// Function to clear personnel display layout (unchanged)
function clearPersonnelDisplay() {
    $('#key-persons-container, #full-time-container, #part-time-container').hide();
    $('#key-persons-container, #full-time-container, #part-time-container').empty(); // Clear content
    $('#full-time-header, #part-time-header, #key-persons-header').hide(); // Hide headers
    noResultsAlertVisible = true; // Track visibility state for "No Results"
    displayedPersonnelIds.clear(); // Clear displayed personnel IDs
}

// Function to display "No Results" (unchanged)
function displayNoResults() {
    console.log('Display No Results Triggered'); // Debugging log
    $('#no-results-alert').html('Sorry, no personnel found. <a href="#" id="go-back-link">Go Back</a>').fadeIn(500);
    $('#key-persons-container, #full-time-container, #part-time-container').hide(); // Hide other containers
    noResultsAlertVisible = true; // Track visibility state
}

// Update the "Go Back" link functionality
$(document).on('click', '#go-back-link', async function (event) {
    event.preventDefault(); // Prevent default link behavior

    console.log('Go Back Clicked - Resetting State');

    // Hide "No Results" alert
    noResultsAlertVisible = false; // Reset the alert visibility tracker
    $('#no-results-alert').fadeOut(300); // Fade out the "No Results" alert

    // Reset Search Input
    $('#search-input').removeClass('is-invalid').val(''); // Clear input and validation

    // Show personnel containers and reset UI
    $('#key-persons-container, #full-time-container, #part-time-container')
        .empty() // Clear any existing content
        .show(); // Make sure they are visible

    // Clear State
    clearHeaders(); // Clear any headers
    displayedPersonnelIds.clear(); // Reset the set of displayed personnel IDs

    // Fetch and display all personnel (handle pagination manually)
    try {
        let allPersonnel = []; // Array to store all personnel data
        let currentPage = 1; // Start from the first page
        const pageSize = 50; // Adjust this if your API uses a different page size

        while (true) {
            console.log(`Fetching page ${currentPage}...`);
            const response = await fetch(`/api/personnel?page=${currentPage}&size=${pageSize}`);
            if (!response.ok) {
                console.error(`Failed to fetch personnel. Status: ${response.status}`);
                break;
            }

            const rawData = await response.json();
            const personnelData = rawData.results || rawData.personnel_data || [];

            // Add fetched personnel to the array
            allPersonnel = allPersonnel.concat(personnelData);

            console.log(`Fetched Page ${currentPage}:`, personnelData.length, 'records');

            // Break if no more data to fetch
            if (personnelData.length < pageSize) break;

            // Increment page number for the next fetch
            currentPage++;
        }

        console.log(`Total Personnel Fetched: ${allPersonnel.length}`);
        
        // Update the layout with all personnel data
        updatePersonnelLayout(allPersonnel, true); // Clear existing layout and display all personnel
    } catch (error) {
        console.error('Error fetching all personnel:', error);
    }
});

// Updated fetchPersonnel with additional logs
function fetchPersonnel(searchQuery = '', triggerModal = false) {
    console.log('Fetching personnel...');
    const url = searchQuery
        ? `/api/personnel-list/?search=${encodeURIComponent(searchQuery)}&page=${currentPage}&size=${pageSize}`
        : `/api/personnel-list/?page=${currentPage}&size=${pageSize}`;

    $.ajax({
        url: url,
        success: function (data) {
            const personnelData = data.personnel_data || [];
            console.log('API Response:', data);

            if (personnelData.length === 0) {
                console.log('No personnel data found, triggering displayNoResults...');
                clearPersonnelDisplay();
                displayNoResults();
                return;
            }

            console.log('Personnel data exists, updating layout...');
            updatePersonnelLayout(personnelData); // Re-render layout dynamically
        },
        error: function (error) {
            console.error('Error Fetching Personnel:', error);
            clearPersonnelDisplay();
            displayNoResults();
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

    // If no results alert is visible, ensure it remains visible
    if (noResultsAlertVisible) {
        $('#no-results-alert').fadeIn(500);
        $('#go-back-link').fadeIn(500);
    }
});

// Function to open the personnel modal with data
function openPersonnelModal(person) {
    // Update modal content with data
    $('#modal-name').text(person.name || 'N/A');
    $('#modal-position').text(person.display_position ? `Position: ${person.display_position}` : '');
    $('#modal-location').text(person.location ? `Location: ${person.location}` : '');
    $('#modal-contact').text(person.contact ? `Contact: ${person.contact}` : '');
    $('#modal-image').attr('src', person.image || '/media/defaultpic.jpg');

    // Hide the "No Results" alert if visible
    if ($('#no-results-alert').is(':visible')) {
        $('#no-results-alert').fadeOut(500);
    }

    // Show the modal
    $('#personnelModal').fadeIn(500);
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

// Event listener for hiding the modal when clicking outside or on the close button
$(document).on('click', '#personnelModal', hideModal);

// Function to clear personnel display layout
function clearHeaders() {
    $('#key-persons-container, #full-time-container, #part-time-container').empty();
    $('#full-time-header, #part-time-header, #key-persons-header').hide();
}


// Update personnel layout with dynamic removal and addition of personnel
function updatePersonnelLayout(data, clearExisting = true) {
    if (clearExisting) {
        console.log('Clearing existing personnel layout...');
        $('#key-persons-container, #full-time-container, #part-time-container').empty().show();
        displayedPersonnelIds.clear(); // Clear tracked IDs for new data
    }

    // Check if data is empty
    if (!data || data.length === 0) {
        displayNoResults(); // Show "No Results" alert and clear layout
        return;
    }

    const currentPersonnelIds = new Set(data.map(person => String(person.id))); // IDs from server
    const removedPersonnelIds = [...displayedPersonnelIds].filter(id => !currentPersonnelIds.has(id));

    // Remove personnel not in the latest response
    removedPersonnelIds.forEach(id => {
        $(`[data-personnel-id="${id}"]`).remove();
        displayedPersonnelIds.delete(id); // Remove from tracking
    });

    const uniquePersonnel = data.filter(person => {
        const isDuplicate = displayedPersonnelIds.has(String(person.id));
        if (!isDuplicate) displayedPersonnelIds.add(String(person.id)); // Add to set
        return !isDuplicate;
    });

    // Hide "No Results" alert if new personnel are added
    if (uniquePersonnel.length > 0) {
        $('#no-results-alert').hide();
    }

    if (uniquePersonnel.length === 0 && displayedPersonnelIds.size === 0) {
        displayNoResults(); // If no personnel are left after update
        return;
    }

    console.log(`Adding ${uniquePersonnel.length} unique personnel to the layout...`);

    const keyPersons = uniquePersonnel.filter(person => person.employment_type.toLowerCase() === 'key-person');
    const fullTimePersonnel = uniquePersonnel.filter(person => person.employment_type.toLowerCase() === 'full-time');
    const partTimePersonnel = uniquePersonnel.filter(person => person.employment_type.toLowerCase() === 'part-time');

    $('#full-time-header').toggle(fullTimePersonnel.length > 0);
    $('#part-time-header').toggle(partTimePersonnel.length > 0);
    $('#key-persons-header').toggle(keyPersons.length > 0);

    createPersonnelLayout(keyPersons, $('#key-persons-container'), 'key-person');
    createPersonnelLayout(fullTimePersonnel, $('#full-time-container'));
    createPersonnelLayout(partTimePersonnel, $('#part-time-container'));
}


// Function to create the triangular hierarchy layout for personnel
function createPersonnelLayout(personnelData, container, type = '') {
    const keyPersonnelContainer = $('<div class="key-personnel-container"></div>');
    const topRow = $('<div class="key-personnel-row"></div>');
    const bottomRow = $('<div class="key-personnel-row"></div>');

    personnelData.forEach((person, index) => {
        const personCard = `
            <div class="person-image-container" onclick="showModal(${person.id})">
                <img src="${person.image || '/media/defaultpic.jpg'}" class="person-image" alt="${person.name}">
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

// Fetch and display a specific personnel's data in the modal
function showModal(id) {
    $.ajax({
        url: `/api/personnel/${id}/`,
        method: 'GET',
        success: function (person) {
            if (person) {
                openPersonnelModal(person);
            } else {
                console.error('Invalid personnel ID:', id);
                hideModal();
            }
        },
        error: function (error) {
            console.error('Error fetching personnel:', error);
            hideModal();
        },
    });
}

// Initialize on Page Load
$(document).ready(function () {
    fetchPersonnel();
    $('#personnelModal').hide();
    $('#no-results-alert').hide(); 

// Simplified Polling Integration
setInterval(() => fetchPersonnel('', false), 10000); // Poll every 10 seconds

// Fetch personnel with dynamic deletion and empty state fix
async function fetchPersonnel(searchQuery = '', triggerModal = false) {
    try {
        console.log('Fetching personnel...');

        // API URL construction
        const url = `/api/personnel?search=${encodeURIComponent(searchQuery)}`;
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`Failed to fetch personnel. Status: ${response.status}`);
            clearPersonnelDisplay();
            displayNoResults();
            return;
        }

        const rawData = await response.json();
        console.log('API Response:', rawData);

        const data = rawData.results || [];
        if (data.length === 0) {
            clearPersonnelDisplay();
            displayNoResults();
            return;
        }

        updatePersonnelLayout(data);
    } catch (error) {
        console.error('Error fetching personnel:', error);
        clearPersonnelDisplay();
        displayNoResults();
    }
}
});



    