$(document).ready(function () {
    console.log("Page loaded. Fetching rooms...");
    fetchRooms(); // Initial fetch

    // Poll for room updates every 5 seconds
    setInterval(fetchRooms, 5000);

    let modalPollingInterval;

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
                    const button = $(`
                        <div class="col">
                            <button class="btn w-100 room-button btn-secondary" 
                                    data-room-id="${room.id}" 
                                    data-room-name="${room.name}">
                                ${room.name}
                            </button>
                        </div>`);
                    roomsContainer.append(button);
                });

                bindRoomButtonClick();
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
            $('#roomModalLabel').text(`Weekly Schedule for ${roomName}`);
            $('#roomName').text(roomName);

            // Fetch room schedule and start polling
            fetchAndUpdateModal(roomId);

            // Start polling modal content every 5 seconds
            if (modalPollingInterval) clearInterval(modalPollingInterval);
            modalPollingInterval = setInterval(() => fetchAndUpdateModal(roomId), 5000);

            // Show the modal
            $('#roomModal').modal('show');

            // Stop polling when the modal is hidden
            $('#roomModal').on('hidden.bs.modal', function () {
                clearInterval(modalPollingInterval);
            });
        });
    }

    async function fetchAndUpdateModal(roomId) {
        try {
            console.log(`Fetching schedule for room ID: ${roomId}`);
            const response = await fetch(`/api/room-schedule/${roomId}/`);
            const data = await response.json();
            console.log("Fetched schedule data:", data);
            populateWeeklyTable(data);
        } catch (error) {
            console.error("Error fetching room schedule:", error);
        }
    }

    function populateWeeklyTable(response) {
        console.log("populateWeeklyTable invoked");
        const scheduleTableBody = $('#scheduleTableBody');
        scheduleTableBody.empty(); // Clear any previous table content
    
        const timeslots = generateTimeSlots("07:30 AM", "09:00 PM", 30);
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
        console.log("Generated timeslots:", timeslots);
    
        timeslots.forEach((timeSlot) => {
            const row = $('<tr>');
            row.append(`<td>${timeSlot}</td>`); // Time column
    
            days.forEach((day) => {
                const cell = $('<td>');
                const schedules = getSchedulesForTimeSlot(response, day, timeSlot);
    
                console.log(`Checking time slot: ${timeSlot} for day: ${day}`);
                console.log("Schedules to filter:", schedules);
    
                if (schedules.length > 0) {
                    schedules.forEach((schedule) => {
                        const scheduleDiv = $(`
                            <div class="schedule-item ${schedule.type === 'temporary' ? 'temporary' : 'regular'}">
                                <strong>${schedule.class_name} (${schedule.section})</strong><br>
                                ${schedule.start_time} - ${schedule.end_time}<br>
                                ${schedule.professor}
                            </div>
                        `);
                        cell.append(scheduleDiv);
                    });
                } else {
                    cell.append('<span class="text-muted">No Schedule</span>');
                }
    
                row.append(cell);
            });
    
            console.log("Appending row:", row.html());
            scheduleTableBody.append(row);
        });
    
        console.log("Table population complete");
    }
    
    
    function generateTimeSlots(startTime, endTime, intervalMinutes) {
        const times = [];
        let current = new Date(`2000-01-01T${convertTo24HourFormat(startTime)}`);
        const end = new Date(`2000-01-01T${convertTo24HourFormat(endTime)}`);
    
        while (current < end) {
            const next = new Date(current);
            next.setMinutes(current.getMinutes() + intervalMinutes);
    
            const formatTime = (time) =>
                time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
            times.push(`${formatTime(current)} - ${formatTime(next)}`);
            current = next;
        }
    
        return times;
    }
    
    function convertToMinutes(time) {
        const [hours, minutes, period] = time.match(/(\d+):(\d+)\s(AM|PM)/).slice(1);
        let totalMinutes = parseInt(hours) % 12 * 60 + parseInt(minutes);
        if (period === 'PM') totalMinutes += 12 * 60;
        return totalMinutes;
    }
    
    function convertTo24HourFormat(time) {
        const [hours, minutes, period] = time.match(/(\d+):(\d+)\s(AM|PM)/).slice(1);
        let hour24 = parseInt(hours) % 12;
        if (period === 'PM') hour24 += 12;
        return `${hour24.toString().padStart(2, '0')}:${minutes}`;
    }
    
    function getSchedulesForTimeSlot(response, day, timeSlot) {
        const [slotStart, slotEnd] = timeSlot.split(' - ');
        const slotStartMinutes = convertToMinutes(slotStart);
        const slotEndMinutes = convertToMinutes(slotEnd);
    
        // Combine both regular and temporary schedules
        const schedules = [...response.regularSchedules, ...response.temporarySchedules];
    
        return schedules.filter(schedule => {
            const scheduleStartMinutes = convertToMinutes(schedule.start_time);
            const scheduleEndMinutes = convertToMinutes(schedule.end_time);
            const scheduleDay = schedule.day || ""; // Ensure day exists
    
            // Check if the schedule matches the current day and overlaps with the time slot
            const isDayMatch = scheduleDay.toLowerCase() === day.toLowerCase();
            const isTimeOverlap =
                (scheduleStartMinutes < slotEndMinutes && scheduleEndMinutes > slotStartMinutes);
    
            return isDayMatch && isTimeOverlap;
        });
    }
    
    
    // Remove expired schedules
    function removeExpiredSchedules() {
        const now = new Date();
        $('.schedule-item').each(function () {
            const endTime = new Date($(this).data('end-time')); // Assuming you store end time as a data attribute
            if (endTime < now) {
                $(this).remove();
            }
        });
    }
    setInterval(removeExpiredSchedules, 1000); // Check every second
});
