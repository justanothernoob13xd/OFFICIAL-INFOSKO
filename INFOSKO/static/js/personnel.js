function fetchPersonnel() {
    $.ajax({
        url: '/api/personnel/',
        method: 'GET',
        success: function(data) {
            console.log('API Response:', data);
            
            const keyPersonsContainer = $('#key-persons-container');
            const fullTimeContainer = $('#full-time-container');
            const partTimeContainer = $('#part-time-container');
            
            keyPersonsContainer.empty();
            fullTimeContainer.empty();
            partTimeContainer.empty();

            // Separate personnel into key persons, full-time, and part-time
            const keyPersons = data.filter(person => person.employment_type === 'key-person');
            const fullTimePersonnel = data.filter(person => person.employment_type === 'full-time');
            const partTimePersonnel = data.filter(person => person.employment_type === 'part-time');

            console.log('Key Persons:', keyPersons);
            console.log('Full-Time Personnel:', fullTimePersonnel);
            console.log('Part-Time Personnel:', partTimePersonnel);

            // Create layout for each category
            createPersonnelLayout(keyPersons, keyPersonsContainer, 'key-person');
            createPersonnelLayout(fullTimePersonnel, fullTimeContainer);
            createPersonnelLayout(partTimePersonnel, partTimeContainer);
        },
        error: function(error) {
            console.error('Error fetching personnel:', error);
        }
    });
}

// Helper function to create the personnel card layout
function createPersonnelLayout(personnelData, container, type = '') {
    if (type === 'key-person') {
        const keyPersonnelContainer = $('<div class="key-personnel-container"></div>');
        const topRow = $('<div class="key-personnel-row"></div>');
        const bottomRow = $('<div class="key-personnel-row"></div>');

        personnelData.forEach((person, index) => {
            const personCard = `
                <div class="person-image-container" onclick="showModal(${person.id})">
                    <img src="${person.image ? person.image : 'https://via.placeholder.com/150'}" class="person-image" alt="${person.name}">
                    <h5 class="person-name">${person.name}</h5>
                </div>
            `;

            // For the triangular layout: 1 person on top, and the rest on the bottom
            if (index === 0) {
                topRow.append(personCard); // Top (1 person)
            } else {
                bottomRow.append(personCard); // Bottom (2-3 persons)
            }
        });

        keyPersonnelContainer.append(topRow, bottomRow);
        container.append(keyPersonnelContainer);
    } else {
        // For full-time and part-time personnel
        const personnelSection = $('<div class="personnel-section"></div>');

        personnelData.forEach(person => {
            const personCard = `
                <div class="person-image-container" onclick="showModal(${person.id})">
                    <img src="${person.image ? person.image : 'https://via.placeholder.com/150'}" class="person-image" alt="${person.name}">
                    <h5 class="person-name">${person.name}</h5>
                </div>
            `;
            personnelSection.append(personCard);
        });

        container.append(personnelSection);
    }
}

// Function to show modal with personnel information
function showModal(id) {
    $.ajax({
        url: `/api/personnel/${id}/`,
        method: 'GET',
        success: function(person) {
            console.log("Personnel data:", person);

            if (person) {
                $('#modal-name').text(person.name);
                $('#modal-position').text('Position: ' + person.position);
                $('#modal-contact').text('Contact: ' + person.contact);
                $('#modal-location').text('Location: ' + person.location);
                $('#modal-image').attr('src', person.image ? person.image : 'https://via.placeholder.com/150');
                
                $('#personnelModal').fadeIn(400, 'linear');  // Show the modal using fadeIn() for better UI
            } else {
                console.error("Invalid personnel ID:", id);
            }
        },
        error: function(error) {
            console.error('Error fetching personnel:', error);
        }
    });
}

// Function to hide modal
function hideModal(event) {
    if (event) {
        const modalContent = document.querySelector('.modal-content');
        if (event.target !== modalContent && !modalContent.contains(event.target)) {
            $('#personnelModal').fadeOut(400, 'linear');  // Hide the modal with fadeOut() for better UI
        }
    } else {
        $('#personnelModal').fadeOut();  // Hide the modal when clicking close button
    }
}

// To close the modal when clicking outside the modal content
$(document).on('click', '#personnelModal', function(event) {
    if (!$(event.target).closest('.modal-content').length) {
        $('#personnelModal').fadeOut(400, 'linear');
    }
});


// Initialize personnel data fetching on page load and periodically refresh it
$(function() {
    console.log("Document ready, fetching personnel...");
    fetchPersonnel();
    setInterval(fetchPersonnel, 10000); // Poll every 10 seconds
});
