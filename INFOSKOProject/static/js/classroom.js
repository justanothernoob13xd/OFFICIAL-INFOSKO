$(document).ready(function () {
    console.log("Page loaded. Fetching rooms...");
    fetchRooms(); // Initial fetch

    setInterval(fetchRooms, 5000); // Poll for room updates every 5 seconds

    let modalPollingInterval;
    let roomTimers = {}; // Track timers for each room

    async function fetchRooms() {
        try {
            const response = await fetch("/api/get-rooms/");
            const data = await response.json();
            console.log("Fetched rooms data:", data);

            const roomsContainer = $("#rooms-container");

            // Clear the container and "NO CLASSROOMS AVAILABLE" message
            roomsContainer.empty();
            $(".no-classrooms-message").remove();

            if (!data.rooms || data.rooms.length === 0) {
                // If no rooms, display the message
                roomsContainer.append('<p class="text-center text-muted no-classrooms-message w-100">NO CLASSROOMS AVAILABLE</p>');
            } else {
                // Create or update buttons for rooms
                data.rooms.forEach(room => {
                    let button = $(`button[data-room-id='${room.id}']`);
                    if (button.length === 0) {
                        // Button doesn't exist, create it
                        button = $(`
                            <button class="btn w-100 room-button btn-success" 
                                    data-room-id="${room.id}" 
                                    data-room-name="${room.name}">
                                ${room.name}
                            </button>
                        `);
                        const col = $(`<div class="col"></div>`).append(button);
                        roomsContainer.append(col);
                    }

                    // Update button class based on occupied status
                    if (room.occupied) {
                        button.removeClass('btn-success').addClass('btn-danger');

                        // Clear any existing timer for the room
                        clearTimeout(roomTimers[room.id]);

                        // Set a timer to reset the room to green after 30 seconds
                        roomTimers[room.id] = setTimeout(() => {
                            button.removeClass('btn-danger').addClass('btn-success');
                            console.log(`Room ${room.id} reset to unoccupied (green) after no motion for 30 seconds`);
                        }, 300000); // Adjust to 60000 for 1 minute
                    } else {
                        button.removeClass('btn-danger').addClass('btn-success');
                        clearTimeout(roomTimers[room.id]); // Clear any timer if room is unoccupied
                    }
                });
            }

            bindRoomButtonClick(); // Rebind click events
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

            // Inject type property into schedules
            data.regularSchedules.forEach(schedule => (schedule.type = 'regular'));
            data.temporarySchedules.forEach(schedule => (schedule.type = 'temporary'));

            console.log("Fetched schedule data with types:", data);
            const updatedData = filterExpiredTemporarySchedules(data); // Filter expired schedules
            populateWeeklyTable(updatedData);
        } catch (error) {
            console.error("Error fetching room schedule:", error);
        }
    }

    function filterExpiredTemporarySchedules(data) {
        const now = new Date();
        const currentTimeMinutes = now.getHours() * 60 + now.getMinutes(); // Current time in minutes

        // Filter temporary schedules based on current time
        const temporarySchedules = data.temporarySchedules.filter(schedule => {
            const endMinutes = convertToMinutes(schedule.end_time);
            return endMinutes > currentTimeMinutes; // Keep schedules that are still active
        });

        return {
            ...data,
            temporarySchedules,
        };
    }

    function populateWeeklyTable(response) {
        console.log("populateWeeklyTable invoked");
        const scheduleTableBody = $('#scheduleTableBody');
        scheduleTableBody.empty(); // Clear previous table content
    
        const timeslots = generateTimeSlots("07:30 AM", "09:00 PM", 30);
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
        console.log("Generated timeslots:", timeslots);
    
        const coveredCells = {};
    
        timeslots.forEach((timeSlot, rowIndex) => {
            const row = $('<tr>');
            row.append(`<td>${timeSlot}</td>`); // Add time column
    
            days.forEach((day, dayIndex) => {
                const cellKey = `${rowIndex}-${dayIndex}`;
    
                if (coveredCells[cellKey]) {
                    console.log(`Skipping covered cell for ${day}, ${timeSlot}`);
                    return;
                }
    
                console.log(`Processing Day: ${day}, Slot: ${timeSlot}`);
                const schedules = getSchedulesForTimeSlot(response, day, timeSlot);
                console.log(`Filtered schedules for ${day}, ${timeSlot}:`, schedules);
    
                if (schedules.length > 0) {
                    const duration = calculateDuration(schedules[0].start_time, schedules[0].end_time, 30);
                    for (let i = 0; i < duration; i++) {
                        coveredCells[`${rowIndex + i}-${dayIndex}`] = true;
                    }
    
                    // Generate content for both regular and temporary schedules
                    let content = "";
    
                    schedules.forEach(schedule => {
                        const scheduleClass = schedule.type === 'temporary' ? 'temporary-schedule' : 'regular-schedule';
                        const overriddenLabel = schedule.overridden ? '<span class="badge bg-danger">Overridden</span>' : '';
                        const tempLabel = schedule.type === 'temporary' ? '<span class="text-danger">(Temporary)</span>' : '';
                    
                        content += `
                            <div class="text-center ${scheduleClass} p-2 mb-2" style="border: 1px solid ${schedule.type === 'temporary' ? '#f5c6cb' : '#c3e6cb'}; border-radius: 5px;">
                                <strong>${schedule.class_name || 'N/A'} (${schedule.section || 'N/A'})</strong><br>
                                ${schedule.start_time} - ${schedule.end_time}<br>
                                ${schedule.professor || 'No Professor Assigned'}<br>
                                ${overriddenLabel} ${tempLabel}
                            </div>
                        `;
                    });
                    
                    const scheduleCell = $(`
                        <td rowspan="${duration}">
                            ${content}
                        </td>
                    `);
    
                    console.log("Appending merged cell for schedules:", scheduleCell.html());
                    row.append(scheduleCell);
                } else {
                    row.append('<td><span class="text-muted">No Schedule</span></td>');
                }
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

        console.log("Generated time slots:", times);
        return times;
    }

    function convertToMinutes(time) {
        const [hours, minutes, period] = time.match(/(\d+):(\d+)\s?(AM|PM)/).slice(1);
        let hourInMinutes = parseInt(hours) % 12 * 60 + parseInt(minutes);
        if (period === 'PM') hourInMinutes += 12 * 60;
        return hourInMinutes;
    }

    function convertTo24HourFormat(time) {
        const [hours, minutes, period] = time.match(/(\d+):(\d+)\s?(AM|PM)/).slice(1);
        let hour24 = parseInt(hours) % 12;
        if (period === 'PM') hour24 += 12;
        return `${hour24.toString().padStart(2, '0')}:${minutes}`;
    }

    function getSchedulesForTimeSlot(response, day, timeSlot) {
        const [slotStart, slotEnd] = timeSlot.split(' - ');
        const slotStartMinutes = convertToMinutes(slotStart);
        const slotEndMinutes = convertToMinutes(slotEnd);
    
        const schedules = [...response.regularSchedules, ...response.temporarySchedules];
    
        console.log(`Processing Day: ${day}, Slot: ${timeSlot}`);
        console.log(`Slot Start Minutes: ${slotStartMinutes}, Slot End Minutes: ${slotEndMinutes}`);
    
        const matchingSchedules = schedules.filter(schedule => {
            const scheduleStartMinutes = convertToMinutes(schedule.start_time);
            const scheduleEndMinutes = convertToMinutes(schedule.end_time);
            const scheduleDay = schedule.day || "";
    
            const normalizedScheduleDay = scheduleDay.trim().toLowerCase();
            const normalizedSlotDay = day.trim().toLowerCase();
    
            const isDayMatch = normalizedScheduleDay === normalizedSlotDay;
            const isTimeOverlap =
                scheduleStartMinutes < slotEndMinutes && scheduleEndMinutes > slotStartMinutes;
    
            // Always include temporary schedules, even if they overlap partially
            return isDayMatch && isTimeOverlap;
        });
    
        console.log(`Matching schedules for ${day}, ${timeSlot}:`, matchingSchedules);
        return matchingSchedules;
    }
    

    function calculateDuration(startTime, endTime, slotMinutes) {
        const startMinutes = convertToMinutes(startTime);
        const endMinutes = convertToMinutes(endTime);
        return Math.ceil((endMinutes - startMinutes) / slotMinutes);
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

// Run cleanup every 1 minute
setInterval(removeExpiredSchedules, 1 * 60 * 1000); // Check every 1 minute

});

//ROOM OCCUPATION