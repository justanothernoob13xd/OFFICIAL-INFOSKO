// idle-timer.js
document.addEventListener('DOMContentLoaded', function() {
    var idleTime = 0;
    var idleInterval = setInterval(timerIncrement, 1000); // 1 second

    // Reset the idle timer on any of these events
    document.addEventListener('mousemove', resetTimer);
    document.addEventListener('keypress', resetTimer);
    document.addEventListener('click', resetTimer);
    document.addEventListener('scroll', resetTimer);

    function timerIncrement() {
        idleTime += 1;
        console.log("Idle time: " + idleTime + " seconds"); // Debug log
        if (idleTime >= 60) { // 60 seconds
            window.location.href = redirectUrl;
        }
    }

    function resetTimer() {
        idleTime = 0;
        console.log("Timer reset"); // Debug log
    }
});

// Faculties 
function fetchPersonnel() {
    fetch('/api/personnel/')
        .then(response => response.json())
        .then(data => {
            const personnelList = document.getElementById('personnel-list');
            personnelList.innerHTML = '';  // Clear existing content to prevent duplicates

            data.forEach((person, index) => {
                const personCard = document.createElement('div');
                personCard.className = 'col-md-3';
                personCard.innerHTML = `
                    <div class="personnel-card mt-5 text-center">
                        <div class="person-image-container" onclick="showModal(${index})">
                            <img src="${person.image ? person.image : 'https://via.placeholder.com/150'}" class="person-image" alt="${person.name}">
                            <h5 class="person-name">${person.name}</h5>
                        </div>
                    </div>
                `;
                personnelList.appendChild(personCard);
            });
        })
        .catch(error => console.error('Error fetching personnel:', error));
}

// Function to show modal with personnel information
function showModal(id) {
    fetch('/api/personnel/')
        .then(response => response.json())
        .then(data => {
            const person = data[id];
            document.getElementById('modal-name').textContent = person.name;
            document.getElementById('modal-position').textContent = 'Position: ' + person.position;
            document.getElementById('modal-contact').textContent = 'Contact: ' + person.contact;
            document.getElementById('modal-location').textContent = 'Location: ' + person.location;
            document.getElementById('modal-image').src = person.image ? person.image : 'https://via.placeholder.com/150';
            document.getElementById('personnelModal').style.display = 'block';
        })
        .catch(error => console.error('Error fetching personnel:', error));
}

// Function to hide modal
function hideModal() {
    document.getElementById('personnelModal').style.display = 'none';
}

// Initialize personnel data fetching on page load
document.addEventListener('DOMContentLoaded', fetchPersonnel);

// Classroom
document.addEventListener("DOMContentLoaded", function() {
    fetch('/api/classrooms/')
        .then(response => response.json())
        .then(data => {
            data.forEach(room => {
                const roomElement = document.querySelector(`article:contains('${room.room_number}')`);
                if (room.is_occupied) {
                    roomElement.classList.remove('green');
                    roomElement.classList.add('red');
                } else {
                    roomElement.classList.remove('red');
                    roomElement.classList.add('green');
                }
            });
        });
});