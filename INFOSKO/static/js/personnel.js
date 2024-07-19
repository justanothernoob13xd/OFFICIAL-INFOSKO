// Faculties 
function fetchPersonnel() {
    $.ajax({
        url: '/api/personnel/',
        method: 'GET',
        success: function(data) {
            const personnelList = $('#personnel-list');
            personnelList.empty(); // Clear existing content to prevent duplicates

            // Define the layout: number of items per row
            const layout = [1, 2, 20]; // Adjust based on your needs
            let currentIndex = 0;

            layout.forEach(rowCount => {
                const row = $('<div class="row justify-content-center"></div>');

                for (let i = 0; i < rowCount && currentIndex < data.length; i++) {
                    const person = data[currentIndex];
                    const personCard = `
                        <div class="col-md-3 mb-4">
                            <div class="personnel-card text-center">
                                <div class="person-image-container" onclick="showModal(${currentIndex})">
                                    <img src="${person.image ? person.image : 'https://via.placeholder.com/150'}" class="person-image" alt="${person.name}">
                                    <h5 class="person-name">${person.name}</h5>
                                </div>
                            </div>
                        </div>
                    `;
                    row.append(personCard);
                    currentIndex++;
                }
                
                personnelList.append(row);
            });
        },
        error: function(error) {
            console.error('Error fetching personnel:', error);
        }
    });
}

// Function to show modal with personnel information
function showModal(id) {
    $.ajax({
        url: '/api/personnel/',
        method: 'GET',
        success: function(data) {
            const person = data[id];
            $('#modal-name').text(person.name);
            $('#modal-position').text('Position: ' + person.position);
            $('#modal-contact').text('Contact: ' + person.contact);
            $('#modal-location').text('Location: ' + person.location);
            $('#modal-image').attr('src', person.image ? person.image : 'https://via.placeholder.com/150');
            $('#personnelModal').show();
        },
        error: function(error) {
            console.error('Error fetching personnel:', error);
        }
    });
}

function hideModal(event) {
    if (event) {
        // Check if the click is outside the modal content
        const modalContent = document.querySelector('.modal-content');
        if (event.target === modalContent || modalContent.contains(event.target)) {
            return;
        }
    }
    document.getElementById('personnelModal').style.display = 'none';
}

// Initialize personnel data fetching on page load and periodically refresh it
$(document).ready(function() {
    fetchPersonnel();
    setInterval(fetchPersonnel, 10000); // Poll every 10 seconds
});

