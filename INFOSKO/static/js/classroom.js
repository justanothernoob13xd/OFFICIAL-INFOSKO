$(document).ready(function () {
    console.log("Page loaded. Fetching rooms...");
    fetchRooms(); // Initial fetch

    // Poll for room updates every second
    setInterval(fetchRooms, 1000);

    async function fetchRooms() {
        try {
            const response = await fetch("/api/get-rooms/");
            const data = await response.json();
            console.log("Fetched rooms data:", data);

            const roomsContainer = $("#rooms-container");
            roomsContainer.empty();

            if (!data.rooms || data.rooms.length === 0) {
                roomsContainer.append('<p class="text-center text-muted w-100">NO CLASSROOMS AVAILABLE</p>');
            } else {
                data.rooms.forEach(room => {
                    console.log("Processing room:", room);
                    const button = $(`<button class="btn w-100 room-button btn-${room.isOccupied ? 'danger' : 'secondary'}" 
                                    data-room-id="${room.id}" 
                                    data-room-name="${room.name}">
                                ${room.name}
                            </button>`);
                    roomsContainer.append(button);
                });

                bindRoomButtonClick(); // Rebind click events after adding new buttons
            }
        } catch (error) {
            console.error("Error fetching room data:", error);
        }
    }

    function bindRoomButtonClick() {
        $('.room-button').off('click').on('click', function () {
            const roomId = $(this).data('room-id');
            const roomName = $(this).data('room-name');

            if (!roomId || !roomName) {
                console.error("Room ID or Name is undefined. Button data attributes may not be set correctly.");
                return;
            }

            // Set modal title
            $('#roomModalLabel').text(`Schedule for ${roomName}`);

            // Clear previous modal content
            $('#regularScheduleContainer').empty();
            $('#temporaryScheduleContainer').empty();

            // Fetch room schedule via API
            console.log(`Fetching schedule for Room ID: ${roomId}`);
            $.ajax({
                url: `/api/room-schedule/${roomId}/`,
                type: 'GET',
                success: function (response) {
                    console.log("Schedule fetched successfully:", response);
                    populateSchedules(response);

                    // Show the modal
                    const modal = new bootstrap.Modal(document.getElementById('roomModal'));
                    modal.show();
                },
                error: function (xhr, status, error) {
                    console.error("Error fetching schedule:", error);
                    $('#regularScheduleContainer, #temporaryScheduleContainer').html('<p class="text-danger">Failed to load schedule details. Please try again later.</p>');
                }
            });
        });
    }

    function populateSchedules(response) {
        // Debug the API response
        console.log("Populating schedules with response:", response);

        // Populate Regular Schedule
        const regularScheduleContainer = $('#regularScheduleContainer');
        regularScheduleContainer.empty();

        if (!response.regularSchedules || response.regularSchedules.length === 0) {
            regularScheduleContainer.append('<p class="text-muted">No regular schedule available for today.</p>');
        } else {
            response.regularSchedules.forEach(schedule => {
                regularScheduleContainer.append(`
                    <p>
                        <strong>${schedule.class_name}</strong><br>
                        ${schedule.start_time} - ${schedule.end_time}<br>
                        Section: ${schedule.section}<br>
                        Professor: ${schedule.professor}
                    </p>
                `);
            });
        }

        // Populate Temporary Schedule
        const temporaryScheduleContainer = $('#temporaryScheduleContainer');
        temporaryScheduleContainer.empty();

        if (!response.temporarySchedules || response.temporarySchedules.length === 0) {
            temporaryScheduleContainer.append('<p class="text-muted">No temporary schedule available for today.</p>');
        } else {
            response.temporarySchedules.forEach(schedule => {
                temporaryScheduleContainer.append(`
                    <p>
                        <strong>${schedule.class_name}</strong><br>
                        ${schedule.start_time} - ${schedule.end_time}<br>
                        Section: ${schedule.section}<br>
                        Professor: ${schedule.professor}
                    </p>
                `);
            });
        }
    }
});
