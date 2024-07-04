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

// Faculties toggle
$(document).ready(function() {
    fetch('/api/personnel/')
        .then(response => response.json())
        .then(data => {
            const container = $('#personnel-container');
            data.forEach(person => {
                const card = `
                    <div class="col-md-4">
                        <div class="card" data-toggle="modal" data-target="#modal-${person.id}">
                            <img src="${person.photo}" class="card-img-top personnel-image" alt="${person.name}">
                            <div class="card-body">
                                <h5 class="card-title">${person.name}</h5>
                            </div>
                        </div>
                    </div>
                `;
                container.append(card);

                const modalTemplate = `
                    <div class="modal fade" id="modal-${person.id}" tabindex="-1" role="dialog" aria-labelledby="modal-${person.id}Label" aria-hidden="true">
                        <div class="modal-dialog" role="document">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title" id="modal-${person.id}Label">${person.name}</h5>
                                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                                <div class="modal-body">
                                    <p>${person.info}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                $('body').append(modalTemplate);
            });

            $('.card').on('click', function() {
                $('body').addClass('blur-background');
            });

            $('.modal').on('hidden.bs.modal', function () {
                $('body').removeClass('blur-background');
            });
        });
});

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