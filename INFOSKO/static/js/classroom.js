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
        console.log("Response received:", response);
        const scheduleTable = $('#scheduleTableBody');
        console.log("Table body:", scheduleTable);
        scheduleTable.empty();
    
        const timeslots = generateTimeSlots("07:30 AM", "09:00 PM", 30);
        console.log("Generated timeslots:", timeslots);
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
        timeslots.forEach((timeSlot) => {
            console.log(`Populating time slot: ${timeSlot}`);
            const row = $('<tr>');
            row.append(`<td>${timeSlot}</td>`);
    
            days.forEach((day) => {
                const cell = $('<td>');
                const schedules = getSchedulesForTimeSlot(response, day, timeSlot);
    
                console.log(`Schedules for ${day}, ${timeSlot}:`, schedules);
    
                if (schedules.length > 0) {
                    schedules.forEach(schedule => {
                        const scheduleItem = $('<div>')
                            .addClass('schedule-item regular-schedule')
                            .html(`
                                <strong>${schedule.class_name}</strong><br>
                                ${schedule.section}<br>
                                ${schedule.start_time} - ${schedule.end_time}<br>
                                ${schedule.professor}
                            `);
                        cell.append(scheduleItem);
                    });
                }
                row.append(cell);
            });
    
            scheduleTable.append(row);
        });
    
        console.log("Table population completed.");
    }

    function convertToMinutes(time) {
        const [hours, minutes, period] = time.match(/(\d+):(\d+)\s(AM|PM)/).slice(1);
        let totalMinutes = parseInt(hours) % 12 * 60 + parseInt(minutes);
        if (period === 'PM') totalMinutes += 12 * 60;
        return totalMinutes;
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
    
    // Helper function to convert 12-hour time to 24-hour format
    function convertTo24HourFormat(time) {
        const [hours, minutes, period] = time.match(/(\d+):(\d+)\s(AM|PM)/).slice(1);
        let hour = parseInt(hours);
        if (period === 'PM' && hour !== 12) {
            hour += 12;
        } else if (period === 'AM' && hour === 12) {
            hour = 0;
        }
        return `${hour.toString().padStart(2, '0')}:${minutes}`;
    }
    
    function getSchedulesForTimeSlot(response, day, timeSlot) {
        console.log("DEBUG: Entered getSchedulesForTimeSlot");
        console.log(`Checking time slot: ${timeSlot} for day: ${day}`);
    
        const [slotStart, slotEnd] = timeSlot.split(' - ');
        const slotStartMinutes = convertToMinutes(slotStart);
        const slotEndMinutes = convertToMinutes(slotEnd);
    
        const schedules = [...response.regularSchedules, ...response.temporarySchedules];
        console.log("Schedules to filter:", schedules);
    
        const filtered = schedules.filter(schedule => {
            const scheduleStartMinutes = convertToMinutes(schedule.start_time);
            const scheduleEndMinutes = convertToMinutes(schedule.end_time);
            const scheduleDay = schedule.day || "";
    
            const isDayMatch = scheduleDay.toLowerCase() === day.toLowerCase();
            const isTimeOverlap = scheduleStartMinutes < slotEndMinutes && scheduleEndMinutes > slotStartMinutes;
    
            console.log(`Evaluating schedule:`, schedule);
            console.log(`Day Match: ${isDayMatch}, Time Overlap: ${isTimeOverlap}`);
    
            return isDayMatch && isTimeOverlap;
        });
    
        console.log("Filtered schedules:", filtered);
        return filtered;
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
