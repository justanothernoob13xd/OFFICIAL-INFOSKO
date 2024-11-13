// Track if the modal has been closed to avoid accidental re-filters
let modalJustClosed = false;

// Debounce function for limiting search requests
function debounce(func, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

// Fetch personnel without redundant filtering
function fetchPersonnel(searchQuery = '') {
    if (modalJustClosed) {
        modalJustClosed = false; // Reset modal flag after search completes
    }

    clearHeaders();
    $('#no-results-alert').hide();
    $('#go-back-link').hide();

    $.ajax({
        url: '/api/personnel-list/',
        data: { search: searchQuery },
        success: function(data) {
            if (searchQuery && data.length === 1) {
                openPersonnelModal(data[0]); // Open modal if exactly one result
            } else if (data.length > 0) {
                updatePersonnelLayout(data); // Display list if multiple results
            } else {
                $('#no-results-alert').html('Sorry, no personnel found. <a href="#" id="go-back-link" style="text-decoration: underline;">Go back</a>').show();
            }
        },
        error: function() {
            $('#no-results-alert').text('Error fetching personnel information.').show();
        }
    });
}

// Debounced function for limiting search requests timing
const debouncedFetchPersonnel = debounce(fetchPersonnel, 300);


// Function to open the personnel modal with data
function openPersonnelModal(person) {
    $('#modal-name').text(person.name);
    $('#modal-location').text('Location: ' + person.location);
    $('#modal-contact').text('Contact: ' + person.contact);
    $('#modal-image').attr('src', person.image || 'https://via.placeholder.com/150');

    if (person.display_position) {
        $('#modal-position').html(`<span class="university-position">Position: ${person.display_position}</span>`);
    } else {
        $('#modal-position').text(''); // Leave blank if position is unavailable
    }
    
    $('#personnelModal').fadeIn(400);
}

// Reset `modalJustClosed` when modal is hidden, to avoid immediate re-filtering
$('#personnelModal').on('hidden.bs.modal', function () {
    modalJustClosed = true;
});

// Function to hide modal
$(document).on('click', '#personnelModal', function(event) {
    if (!$(event.target).closest('.modal-content').length) {
        $('#personnelModal').fadeOut(400);
    }
});

// Hide modal when clicking outside of content
$(document).on('click', '#personnelModal', function(event) {
    if (!$(event.target).closest('.modal-content').length) {
        $('#personnelModal').fadeOut(400);
    }
});

// Search button functionality
$('#search-button').on('click', function() {
    modalJustClosed = false;
    const searchQuery = $('#search-input').val().trim();

    // If searchQuery exists, reset error indicators and perform search
    if (searchQuery) {
        $('#search-input').removeClass('is-invalid');
        $('#no-results-alert').hide();
        debouncedFetchPersonnel(searchQuery);
    } else {
        $('#search-input').addClass('is-invalid');
        $('#search-input').attr('placeholder', 'Please enter a name');
    }
});


// Clear headers to reset personnel display layout
function clearHeaders() {
    $('#key-persons-container, #full-time-container, #part-time-container').empty();
    $('#full-time-header, #part-time-header').hide();
}

// "Go Back" link to reset personnel display and search input
$(document).on('click', '#go-back-link', function(event) {
    event.preventDefault();
    lastSearchQuery = '';
    fetchPersonnel(); // Reset personnel display
    $('#full-time-header, #part-time-header, #key-persons-header').show();
    $('#no-results-alert').hide();
    $('#go-back-link').hide();
    $('#search-input').removeClass('is-invalid');
});

// Autocomplete for search input with debounced fetching of suggestions
$('#search-input').autocomplete({
    source: debounce(function(request, response) {
        $.ajax({
            url: '/api/personnel-suggestions/',
            data: { search: request.term },
            success: function(data) {
                response($.map(data, function(person) {
                    return {
                        label: `${person.name} (${person.employment_type.replace('-', ' ')})`,
                        value: person.name,
                        id: person.id
                    };
                }));
            },
            error: function(error) {
                console.error('Error fetching suggestions:', error);
            }
        });
    }, 300),
    
    select: function(event, ui) {
        modalJustClosed = true;  // Prevents immediate re-search on close
        $.ajax({
            url: `/api/personnel/${ui.item.id}/`,
            method: 'GET',
            success: function(person) {
                openPersonnelModal(person);
            },
            error: function(error) {
                console.error('Error fetching personnel data:', error);
            }
        });
    },
    minLength: 2
});

// Handle search input to trigger real-time layout update with debounce
$('#search-input').on('input', function() {
    const searchQuery = $(this).val().trim();

    if (searchQuery !== lastSearchQuery) {
        lastSearchQuery = searchQuery;
        debouncedFetchPersonnel(searchQuery);
    }
});

// Function to create the layout for personnel display
function createPersonnelLayout(personnelData, container, type = '') {
    const keyPersonnelContainer = $('<div class="key-personnel-container"></div>');
    const topRow = $('<div class="key-personnel-row"></div>');
    const bottomRow = $('<div class="key-personnel-row"></div>');

    personnelData.forEach((person, index) => {
        const personPosition = person.department_position || '';

        // Display position only for key-persons
        let positionDisplay = '';
        if (person.employment_type === 'key-person' && personPosition) {
            positionDisplay = personPosition;
        }

        const personCard = `
            <div class="person-image-container" onclick="showModal(${person.id})">
                <img src="${person.image || 'https://via.placeholder.com/150'}" class="person-image" alt="${person.name}">
                <h5 class="person-name">${person.name}</h5>
                ${positionDisplay ? `<p class="person-position">${positionDisplay}</p>` : ''}
            </div>
        `;

        if (type === 'key-person') {
            if (index === 0) {
                topRow.append(personCard);
            } else {
                bottomRow.append(personCard);
            }
        } else {
            const personnelSection = $('<div class="personnel-section"></div>');
            personnelSection.append(personCard);
            container.append(personnelSection);
        }
    });

    if (type === 'key-person') {
        keyPersonnelContainer.append(topRow, bottomRow);
        container.append(keyPersonnelContainer);
    }

    // Apply font size after elements are added to the DOM
    setTimeout(() => {
        $('.person-position').css('font-size', '20px'); // Adjust size here
    }, 0);
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
            $('#personnelModal').fadeOut(400);
        }
    });
}

// Function to update the personnel layout with multiple results
function updatePersonnelLayout(data) {
    const keyPersonsContainer = $('#key-persons-container');
    const fullTimeContainer = $('#full-time-container');
    const partTimeContainer = $('#part-time-container');

    keyPersonsContainer.empty();
    fullTimeContainer.empty();
    partTimeContainer.empty();

    const keyPersons = data.filter(person => person.employment_type === 'key-person');
    const fullTimePersonnel = data.filter(person => person.employment_type === 'full-time');
    const partTimePersonnel = data.filter(person => person.employment_type === 'part-time');

    if (keyPersons.length === 0 && fullTimePersonnel.length === 0 && partTimePersonnel.length === 0) {
        $('#no-results-alert').html('Sorry, no personnel found. <a href="#" id="go-back-link" style="text-decoration: underline;">Go back</a>').show();
    } else {
        $('#no-results-alert').hide();
        if (fullTimePersonnel.length > 0) $('#full-time-header').show();
        if (partTimePersonnel.length > 0) $('#part-time-header').show();
        if (keyPersons.length > 0) $('#key-persons-header').show();
    }

    createPersonnelLayout(keyPersons, keyPersonsContainer, 'key-person');
    createPersonnelLayout(fullTimePersonnel, fullTimeContainer);
    createPersonnelLayout(partTimePersonnel, partTimeContainer);
}


// Auto-refresh personnel layout with timer while modal is closed
function autoRefreshPersonnel() {
    setInterval(function () {
        if (!$('#no-results-alert').is(':visible') && !modalJustClosed) {
            fetchPersonnel();
        }
    }, 10000);  // Adjust interval time (e.g., 10 seconds)
}

// Start auto-refresh
autoRefreshPersonnel();

// Initialize the auto-refresh and fetch personnel on page load
$(document).ready(function() {
    fetchPersonnel();  // Load personnel data without search query (initial load)
    autoRefreshPersonnel();  // Start auto-refresh for dynamic updates
});

// Idle timer function to redirect to index after 30 seconds of inactivity
let idleTimer, countdownTimer, countdown = 30;

function startIdleTimer() {
    countdown = 30;
    countdownTimer = setInterval(function() {
        countdown--;
        if (countdown <= 0) {
            clearInterval(countdownTimer);
            window.location.href = '/';
        }   
    }, 1000);
}

function resetIdleTimer() {
    clearTimeout(idleTimer);
    clearInterval(countdownTimer);
    idleTimer = setTimeout(startIdleTimer, 30000);
}

$(document).on('scroll click', resetIdleTimer);  // Reset timer on scroll or click
startIdleTimer();