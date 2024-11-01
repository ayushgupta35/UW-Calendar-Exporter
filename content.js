window.onload = function () {
    // Locate the table with the course information
    const table = document.querySelector(".sps_table");

    if (!table) {
        console.error("Course table not found.");
        return; // Exit if the table isn't found
    }

    const rows = table.querySelectorAll("tbody tr");

    // Locate the first row (main header row) and extend the colspan of "Meetings"
    const mainHeaderRow = table.querySelectorAll("tr")[0];
    const meetingsHeader = mainHeaderRow.querySelectorAll("th")[7];
    meetingsHeader.colSpan = 6; // Extending the colspan to include the new Apple column

    // Locate the second row (where Days, Time, Location, Instructor are defined) and insert the new subheading
    const headerRow = table.querySelectorAll("tr")[1];

    // Add the Google Calendar header
    const googleHeader = document.createElement("th");
    googleHeader.innerHTML = "Add to Google<br>Calendar";
    googleHeader.style.textAlign = "center";
    googleHeader.style.whiteSpace = "nowrap";
    headerRow.appendChild(googleHeader);

    // Add the Apple Calendar header
    const appleHeader = document.createElement("th");
    appleHeader.innerHTML = "Add to Apple<br>Calendar";
    appleHeader.style.textAlign = "center";
    appleHeader.style.whiteSpace = "nowrap";
    headerRow.appendChild(appleHeader);

    // Iterate through each row of the course schedule
    rows.forEach(row => {
        const cells = row.querySelectorAll("tt");

        if (cells.length >= 6) {
            const course = {
                courseNumber: cells[1]?.innerText.trim() || "TBA",
                courseCode: cells[2]?.innerText.trim() || "TBA",
                courseType: cells[3]?.innerText.trim() || "TBA", // Type like LC (Lecture), LB (Lab), etc.
                title: formatTitle(cells[5]?.innerText.trim() || "TBA"),
                days: cells[6]?.innerText.trim() || "TBA",
                time: cells[7]?.innerText.trim() || "TBA",
                location: cells[8]?.innerText.trim() || "TBA",
                instructor: formatInstructor(cells[9]?.innerText.trim() || "TBA")
            };

            if (course.time !== "TBA") {
                // Create the Google Calendar button with tooltip
                const googleTooltip = document.createElement("div");
                googleTooltip.classList.add('tooltip');
                const googleButton = document.createElement("button");
                const googleIcon = document.createElement("img");
                googleIcon.src = chrome.runtime.getURL('google-calendar-icon.png');
                googleIcon.alt = 'Google Calendar Icon';
                googleIcon.style.width = '24px';
                googleButton.appendChild(googleIcon);
                googleButton.classList.add('btn', 'zoom');
                googleButton.style.backgroundColor = 'transparent';
                googleButton.style.outline = 'none';
                googleButton.style.border = 'none';
                
                googleButton.addEventListener("click", (event) => {
                    event.preventDefault();
                    const quarterInfo = getQuarterInfo();
                    const eventUrl = prepareGoogleCalendarEventUrl(course, quarterInfo);
                    window.open(eventUrl, '_blank');
                });
                
                const googleTooltipText = document.createElement("span");
                googleTooltipText.classList.add('tooltiptext');
                googleTooltipText.innerText = 'Click to create Google Calendar event';
                googleTooltip.appendChild(googleButton);
                googleTooltip.appendChild(googleTooltipText);

                // Create the Apple Calendar button with tooltip
                const appleTooltip = document.createElement("div");
                appleTooltip.classList.add('tooltip');
                const appleButton = document.createElement("button");
                const appleIcon = document.createElement("img");
                appleIcon.src = chrome.runtime.getURL('apple-calendar-icon.png');
                appleIcon.alt = 'Apple Calendar Icon';
                appleIcon.style.width = '24px';
                appleButton.appendChild(appleIcon);
                appleButton.classList.add('btn', 'zoom');
                appleButton.style.backgroundColor = 'transparent';
                appleButton.style.outline = 'none';
                appleButton.style.border = 'none';

                appleButton.addEventListener("click", (event) => {
                    event.preventDefault();
                    downloadICSForCourse(course); // New function to create the ICS file dynamically
                });

                const appleTooltipText = document.createElement("span");
                appleTooltipText.classList.add('tooltiptext');
                appleTooltipText.innerText = 'Click to download ICS file';
                appleTooltip.appendChild(appleButton);
                appleTooltip.appendChild(appleTooltipText);

                // Add buttons with tooltips to the row
                const googleButtonCell = document.createElement("td");
                googleButtonCell.style.textAlign = "center";
                googleButtonCell.appendChild(googleTooltip);
                row.appendChild(googleButtonCell);

                const appleButtonCell = document.createElement("td");
                appleButtonCell.style.textAlign = "center";
                appleButtonCell.appendChild(appleTooltip);
                row.appendChild(appleButtonCell);
            }
        }
    });

    // Create a <style> element
    const style = document.createElement('style');
    style.type = 'text/css';

    // Add the CSS for the zoom effect and tooltips
    style.innerHTML = `
        .zoom:hover {
            transform: scale(1.05);
            transition: transform 0.2s;
        }

        .tooltip {
            position: relative;
            display: inline-block;
        }

        .tooltiptext {
            font-size: 10px;
            font-weight: bold;
        }

        .tooltip .tooltiptext {
            visibility: hidden;
            width: 130px;
            background-color: #4b2a85;
            color: #fafafa;
            text-align: center;
            padding: 5px;
            border-radius: 6px;
            position: absolute;
            z-index: 1;
            bottom: 125%; /* Position above the icon */
            left: 50%;
            margin-left: -70px;
            opacity: 0;
            transition: opacity 0.3s;
        }

        .tooltip:hover .tooltiptext {
            visibility: visible;
            opacity: 1;
        }
    `;

    // Append the <style> element to the <head>
    document.head.appendChild(style);
};


// Function to create and download ICS file for Apple Calendar
function downloadICSForCourse(course) {
    const quarterInfo = getQuarterInfo();
    const { startTime, endTime } = convertTime(course.time, course.days, quarterInfo);

    const event = {
        title: `${course.courseNumber}: ${course.title} w/ ${course.instructor}`,
        description: `Instructor: ${course.instructor}`,
        location: `University of Washington, ${course.location}`,
        start: startTime.replace(/-|:/g, ''),
        end: endTime.replace(/-|:/g, ''),
        timezone: "America/Los_Angeles",
        repeatRule: `FREQ=WEEKLY;BYDAY=${convertDaysToRecurrence(course.days)};UNTIL=${getQuarterEndDate(quarterInfo)}`
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MyApp//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
DTSTART;TZID=${event.timezone}:${event.start}
DTEND;TZID=${event.timezone}:${event.end}
RRULE:${event.repeatRule}
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.location}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'event.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Extract quarter info from the page
function getQuarterInfo() {
    const header = document.querySelector('h1').innerText;
    const [_, quarter, year] = header.match(/Registration - (Autumn|Winter|Spring) (\d{4})/);
    console.log(`Extracted quarter info: ${quarter}, ${year}`);
    return { quarter, year };
}

// Prepare Google Calendar Event URL
function prepareGoogleCalendarEventUrl(course, quarterInfo) {
    const { startTime, endTime } = convertTime(course.time, course.days, quarterInfo);

    console.log(`Start time: ${startTime}, End time: ${endTime}`);

    const baseUrl = "https://calendar.google.com/calendar/r/eventedit";

    const params = new URLSearchParams({
        text: `${course.courseNumber}: ${course.title} w/ ${course.instructor}`,
        dates: `${startTime.replace(/-|:/g, '')}/${endTime.replace(/-|:/g, '')}`,
        ctz: 'America/Los_Angeles',
        details: `Instructor: ${course.instructor}`,
        location: `University of Washington, ${course.location}`,
        recur: `RRULE:FREQ=WEEKLY;BYDAY=${convertDaysToRecurrence(course.days)};UNTIL=${getQuarterEndDate(quarterInfo)}`
    });

    const eventUrl = `${baseUrl}?${params.toString()}`;

    console.log(`Google Calendar Event URL: ${eventUrl}`);

    return eventUrl;
}

function convertTime(time, days, quarterInfo) {
    console.log(`Raw time before processing: ${time}`);
    time = time.replace(/&nbsp;/g, '').trim();
    console.log(`Sanitized time: ${time}`);

    if (!time.includes("-")) {
        console.error(`Invalid time format: ${time}`);
        return { startTime: "", endTime: "" };
    }

    const [start, end] = time.split("-");
    console.log(`Extracted start time: ${start}, end time: ${end}`);

    const convertedStartTime = convertTo24HourFormat(start.trim());
    const convertedEndTime = convertTo24HourFormat(end.trim());

    console.log(`Converted start time: ${convertedStartTime}, Converted end time: ${convertedEndTime}`);

    const today = new Date();
    const firstClassDate = getAdjustedStartDate(quarterInfo, days, today);

    console.log(`First class date: ${firstClassDate}`);

    const startTime = `${firstClassDate}T${convertedStartTime}:00`;
    const endTime = `${firstClassDate}T${convertedEndTime}:00`;

    console.log(`Final start time: ${startTime}, Final end time: ${endTime}`);

    return { startTime, endTime };
}

function convertTo24HourFormat(time) {
    let hour, minutes;

    time = time.replace(/[^\d]/g, ''); // Ensure time is numeric
    console.log(`Time after removing non-numeric characters: ${time}`);

    if (time.length === 4) {
        hour = parseInt(time.slice(0, 2), 10);
        minutes = parseInt(time.slice(2), 10);
    } else if (time.length === 3) {
        hour = parseInt(time.slice(0, 1), 10);
        minutes = parseInt(time.slice(1), 10);
    } else {
        console.error(`Invalid time format: ${time}`);
        return "00:00";
    }

    console.log(`Extracted hour: ${hour}, Extracted minutes: ${minutes}`);

    if (hour >= 8 && hour <= 11) {
        // Morning times are AM
    } else if (hour >= 1 && hour <= 9) {
        hour += 12; // Convert to PM
    }

    console.log(`Converted hour to 24-hour format: ${hour}`);
    return `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function getAdjustedStartDate(quarterInfo, days, today) {
    let startDate = getQuarterStartDate(quarterInfo, days);
    const currentDate = today.toISOString().split('T')[0];

    if (new Date(startDate) < today) {
        startDate = currentDate;
    }

    console.log(`Adjusted start date: ${startDate}`);
    return startDate;
}

function getQuarterStartDate({ quarter, year }, days) {
    const quarterStartDates = {
        'Autumn': new Date(`${year}-09-25`),
        'Winter': new Date(`${year}-01-02`),
        'Spring': new Date(`${year}-03-30`)
    };

    let startDate = quarterStartDates[quarter];

    const dayMap = { 'M': 1, 'T': 2, 'W': 3, 'Th': 4, 'F': 5 };
    const classDays = days.match(/Th|M|T|W|F/g).map(day => dayMap[day]);
    let nextDayOffset = Math.min(...classDays.map(day => (day - startDate.getDay() + 7) % 7));

    startDate.setDate(startDate.getDate() + nextDayOffset);
    console.log(`Start date of the quarter: ${startDate}`);

    return startDate.toISOString().split('T')[0];
}

function convertDaysToRecurrence(days) {
    const dayMap = {
        'M': 'MO',
        'T': 'TU',
        'W': 'WE',
        'Th': 'TH',
        'F': 'FR'
    };

    let rruleDays = days.match(/Th|M|T|W|F/g).map(day => dayMap[day] || '').join(',');
    console.log(`Recurrence rule days: ${rruleDays}`);

    return rruleDays;
}

function getQuarterEndDate({ quarter, year }) {
    const quarterEndDates = {
        'Autumn': `${year}1215T235959Z`,
        'Winter': `${year}0315T235959Z`,
        'Spring': `${year}0601T235959Z`
    };

    console.log(`Quarter end date: ${quarterEndDates[quarter]}`);
    return quarterEndDates[quarter];
}

function formatInstructor(name) {
    if (name.includes(",")) {
        const [lastName, firstName] = name.split(",").map(s => s.trim());
        return `${firstName} ${lastName}`;
    }
    return name;
}

function formatTitle(title) {
    return title.split(' ').map(word => {
        return word === word.toUpperCase() ? word : word[0].toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
}