/**
 * UW Calendar Exporter
 * This script finds a specific course table on the page, extracts course details,
 * and adds buttons for adding events to Google Calendar and Apple Calendar.
 */

console.log("UW Calendar Exporter initializing...");

/**
 * Finds the course table on the page using prioritized selectors.
 * @returns {HTMLElement|null} The table element or null if not found.
 */
function findTable() {
    console.log("Searching for course table...");
    
    // Try different selectors in order of specificity
    const selectors = [
        "table.table-mobile-responsive.mb-0.table",
        "table.table-mobile-responsive",
        "table.mb-0.table",
        "table[class*='table-mobile-responsive']",
        "table"
    ];
    
    let table = null;
    for (const selector of selectors) {
        const found = document.querySelector(selector);
        console.log(`Trying selector "${selector}": ${found ? "FOUND" : "not found"}`);
        if (found) {
            table = found;
            break;
        }
    }
    
    return table;
}

/**
 * Processes the given table by adding headers and calendar buttons to each row.
 * @param {HTMLElement} table - The table element to process.
 */
function processTable(table) {
    console.log("Processing table:", table);
    
    // Skip processing if already done.
    if (table.getAttribute("data-calendar-processed") === "true") {
        console.log("Table already processed, skipping");
        return;
    }
    
    // Get the header row (in thead)
    const headerRow = table.querySelector("thead tr");
    if (!headerRow) {
        console.error("Header row not found");
        return;
    }
    
    console.log("Found header row with", headerRow.children.length, "cells");
    
    // Add Google Calendar header.
    const googleHeader = document.createElement("th");
    googleHeader.scope = "col";
    googleHeader.id = "registered-gcal";
    googleHeader.innerHTML = "Google<br>Calendar";
    googleHeader.style.textAlign = "center";
    googleHeader.style.whiteSpace = "nowrap";
    headerRow.appendChild(googleHeader);
    console.log("Added Google Calendar header");
    
    // Add Apple Calendar header.
    const appleHeader = document.createElement("th");
    appleHeader.scope = "col";
    appleHeader.id = "registered-ical";
    appleHeader.innerHTML = "Apple<br>Calendar";
    appleHeader.style.textAlign = "center";
    appleHeader.style.whiteSpace = "nowrap";
    headerRow.appendChild(appleHeader);
    console.log("Added Apple Calendar header");
    
    // Process each data row.
    const rows = table.querySelectorAll("tbody tr");
    console.log("Found", rows.length, "data rows");

    rows.forEach((row, index) => {
        console.log(`Processing row ${index + 1}`);
        
        // Get meeting information (we need to check if it has time data)
        const meetingCell = row.querySelector("[data-content='Meeting']");
        if (!meetingCell) {
            console.log(`Row ${index + 1} has no meeting cell, skipping`);
            return;
        }
        
        const timeElements = meetingCell.querySelectorAll("time");
        if (timeElements.length < 2) {
            console.log(`Row ${index + 1} has insufficient time data, adding empty cells`);
            // Add empty cells for consistency
            row.appendChild(document.createElement("td"));
            row.appendChild(document.createElement("td"));
            return;
        }
        
        // Extract course details.
        const courseCell = row.querySelector("[data-content='Course']");
        const typeCell = row.querySelector("[data-content='Type']");
        const instructorCell = row.querySelector("[data-content='Instructor']");
        const daysSpan = meetingCell.querySelector("span[title]");
        const days = daysSpan ? daysSpan.getAttribute("title") : "TBA";
        const startTime = timeElements[0]?.innerText.trim() || "";
        const endTime = timeElements[1]?.innerText.trim() || "";
        const time = startTime && endTime ? `${startTime}-${endTime}` : "TBA";
        const locationDiv = meetingCell.querySelectorAll("div")[3];
        const location = locationDiv ? locationDiv.innerText.trim().replace("Location:", "").trim() : "TBA";
        
        const course = {
            courseNumber: courseCell?.innerText.trim() || "TBA",
            courseCode: courseCell?.innerText.trim() || "TBA",
            courseType: typeCell?.innerText.trim() || "TBA",
            title: courseCell?.innerText.trim() || "TBA", // Using course number as title
            days: days,
            time: time,
            location: location,
            instructor: formatInstructor(instructorCell?.getAttribute("title") || instructorCell?.innerText.trim() || "TBA")
        };
        
        console.log(`Row ${index + 1} has time data, adding calendar buttons`);
        console.log("Course data:", course);
        
        // Create and attach Google Calendar button.
        const googleCell = document.createElement("td");
        googleCell.style.textAlign = "center";
        googleCell.setAttribute("headers", "registered-gcal");
        const googleButton = document.createElement("button");
        googleButton.className = "btn zoom";
        googleButton.style.backgroundColor = "transparent";
        googleButton.style.border = "none";
        googleButton.style.cursor = "pointer";
        googleButton.title = "Add to Google Calendar";
        // Use a web image instead of inline SVG for the Google Calendar icon.
        googleButton.innerHTML = `<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Google_Calendar_icon_%282020%29.svg/2048px-Google_Calendar_icon_%282020%29.svg.png" alt="Google Calendar Icon" width="24" height="24">`;
        googleButton.addEventListener("click", function(event) {
            event.preventDefault();
            event.stopPropagation();
            console.log("Google Calendar button clicked");
            try {
                const quarterInfo = getQuarterInfo();
                console.log("Quarter info:", quarterInfo);
                const eventUrl = prepareGoogleCalendarEventUrl(course, quarterInfo);
                console.log("Opening URL:", eventUrl);
                window.open(eventUrl, '_blank');
            } catch(error) {
                console.error("Error creating Google Calendar event:", error);
            }
            return false;
        });
        // Attach a custom tooltip to the Google button.
        addTooltip(googleButton, googleButton.title);
        googleCell.appendChild(googleButton);
        row.appendChild(googleCell);

        // Create and attach Apple Calendar button.
        const appleCell = document.createElement("td");
        appleCell.style.textAlign = "center";
        appleCell.setAttribute("headers", "registered-ical");
        const appleButton = document.createElement("button");
        appleButton.className = "btn zoom";
        appleButton.style.backgroundColor = "transparent";
        appleButton.style.border = "none";
        appleButton.style.cursor = "pointer";
        appleButton.title = "Add to Apple Calendar";
        // Use a web image instead of inline SVG for the Apple Calendar icon.
        appleButton.innerHTML = `<img src="https://help.apple.com/assets/65D689DF13D1B1E17703916F/65D689E0D302CF88600FDD25/en_US/941b3852f089696217cabe420c7a459f.png" alt="Apple Calendar Icon" width="24" height="24">`;
        appleButton.addEventListener("click", function(event) {
            event.preventDefault();
            event.stopPropagation();
            console.log("Apple Calendar button clicked");
            try {
                downloadICSForCourse(course);
            } catch(error) {
                console.error("Error creating ICS file:", error);
            }
            return false;
        });
        // Attach a custom tooltip to the Apple button.
        addTooltip(appleButton, appleButton.title);
        appleCell.appendChild(appleButton);
        row.appendChild(appleCell);
    });
    
    // Mark table as processed.
    table.setAttribute("data-calendar-processed", "true");
    console.log("Table processing complete");
    
    // Append CSS styles for button effects.
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
        .zoom:hover {
            transform: scale(1.05);
            transition: transform 0.2s;
        }
        .btn:active {
            transform: scale(0.95);
        }
    `;
    document.head.appendChild(style);
}

/**
 * Attaches custom tooltip functionality to an element.
 * When the element is hovered, a tooltip will follow the cursor.
 * @param {HTMLElement} element - The target element.
 * @param {string} tooltipText - The text to display in the tooltip.
 */
function addTooltip(element, tooltipText) {
    let tooltip;
    
    element.addEventListener("mouseenter", function(e) {
        tooltip = document.createElement('div');
        tooltip.innerText = tooltipText;
        tooltip.className = 'custom-tooltip';
        // Basic styling for the tooltip.
        tooltip.style.position = 'absolute';
        tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        tooltip.style.color = '#fff';
        tooltip.style.padding = '4px 8px';
        tooltip.style.borderRadius = '4px';
        tooltip.style.fontSize = '12px';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.zIndex = '1000';
        document.body.appendChild(tooltip);
        // Position the tooltip near the mouse.
        tooltip.style.left = (e.pageX + 8) + "px";
        tooltip.style.top = (e.pageY + 8) + "px";
    });
    
    element.addEventListener("mousemove", function(e) {
        if (tooltip) {
            tooltip.style.left = (e.pageX + 8) + "px";
            tooltip.style.top = (e.pageY + 8) + "px";
        }
    });
    
    element.addEventListener("mouseleave", function() {
        if (tooltip) {
            document.body.removeChild(tooltip);
            tooltip = null;
        }
    });
}

/**
 * Initializes the table processing after the document is ready.
 */
function main() {
    console.log("Main function running");
    
    // Try to find and process the table immediately
    const table = findTable();
    if (table) {
        processTable(table);
    } else {
        console.log("Table not found on initial load, setting up observer");
        
        // Observe DOM mutations in case the table is loaded asynchronously.
        const observer = new MutationObserver(function() {
            const table = findTable();
            if (table) {
                console.log("Table found via observer");
                processTable(table);
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        // Fallback check after a delay.
        setTimeout(function() {
            const table = findTable();
            if (table) {
                console.log("Table found via timeout");
                processTable(table);
                observer.disconnect();
            }
        }, 2000);
    }
}

// Run initialization when the document is ready.
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main);
} else {
    main();
}

/**
 * Extracts quarter information from the page header or URL.
 * @returns {{quarter: string, year: number}} The quarter and year data.
 */
function getQuarterInfo() {
    console.log("Getting quarter info");
    const header = document.querySelector('h1');
    
    if (!header) {
        console.error("Could not find page header");
        return { quarter: "Spring", year: new Date().getFullYear() };
    }
    
    console.log("Page header:", header.innerText);
    
    // Try new format first: "Your Spring 2025 Schedule"
    let match = header.innerText.match(/Your\s+(Autumn|Winter|Spring|Summer)\s+(\d{4})\s+Schedule/i);
    
    if (!match) {
        // Try old format: "Registration - Spring 2024"
        match = header.innerText.match(/Registration - (Autumn|Winter|Spring|Summer) (\d{4})/);
    }
    
    if (!match) {
        // Try to extract from URL if header doesn't contain it
        const urlMatch = window.location.href.match(/\/([a-z]{2})(\d{2})/i);
        if (urlMatch) {
            const qtrCode = urlMatch[1].toLowerCase();
            const year = "20" + urlMatch[2];
            
            const qtrMap = {
                'au': 'Autumn',
                'sp': 'Spring',
                'wi': 'Winter',
                'su': 'Summer'
            };
            
            if (qtrMap[qtrCode]) {
                console.log(`Extracted quarter info from URL: ${qtrMap[qtrCode]}, ${year}`);
                return { quarter: qtrMap[qtrCode], year: parseInt(year) };
            }
        }
        
        console.error("Could not extract quarter info from header");
        return { quarter: "Spring", year: new Date().getFullYear() };
    }
    
    const quarter = match[1];
    const year = match[2];
    console.log(`Extracted quarter info: ${quarter}, ${year}`);
    return { quarter, year };
}

/**
 * Creates and triggers the download of an ICS file for Apple Calendar.
 * @param {Object} course - The course object containing event details.
 */
function downloadICSForCourse(course) {
    const quarterInfo = getQuarterInfo();
    const { startTime, endTime } = convertTime(course.time, course.days, quarterInfo);

    const event = {
        title: course.courseNumber, // Changed from `${course.courseNumber}: ${course.title}`
        description: `Instructor: ${course.instructor}`,
        location: `University of Washington, ${course.location}`,
        start: startTime.replace(/-|:/g, ''),
        end: endTime.replace(/-|:/g, ''),
        timezone: "America/Los_Angeles",
        repeatRule: `FREQ=WEEKLY;BYDAY=${convertDaysToRecurrence(course.days)};UNTIL=${getQuarterEndDate(quarterInfo)}`
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//UW Calendar Exporter//EN
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
    link.download = `${course.courseNumber.replace(/\s+/g, '_')}_calendar.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Prepares a Google Calendar event URL for the given course.
 * @param {Object} course - The course object containing event details.
 * @param {Object} quarterInfo - The quarter information for the event.
 * @returns {string} The URL for creating a Google Calendar event.
 */
function prepareGoogleCalendarEventUrl(course, quarterInfo) {
    const { startTime, endTime } = convertTime(course.time, course.days, quarterInfo);

    const baseUrl = "https://calendar.google.com/calendar/r/eventedit";

    const params = new URLSearchParams({
        text: course.courseNumber, // Changed from `${course.courseNumber}: ${course.title}`
        dates: `${startTime.replace(/-|:/g, '')}/${endTime.replace(/-|:/g, '')}`,
        ctz: 'America/Los_Angeles',
        details: course.instructor === "TBA" ? "" : `Instructor: ${course.instructor}`,
        location: `University of Washington, ${course.location}`,
        recur: `RRULE:FREQ=WEEKLY;BYDAY=${convertDaysToRecurrence(course.days)};UNTIL=${getQuarterEndDate(quarterInfo)}`
    });

    return `${baseUrl}?${params.toString()}`;
}

/**
 * Converts a course's time string into start and end times based on the quarter and class days.
 * @param {string} time - The raw time string.
 * @param {string} days - The days string.
 * @param {Object} quarterInfo - The quarter information.
 * @returns {{startTime: string, endTime: string}} The formatted start and end times.
 */
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

/**
 * Converts a given time string to 24-hour format.
 * @param {string} time - The time string (e.g., "10:00", "11:20am").
 * @returns {string} The time in 24-hour HH:mm format.
 */
function convertTo24HourFormat(time) {
    // Handle cases like "10:00" and "11:20am"
    const timeStr = time.trim().toLowerCase();
    let hour, minute;
    
    // Check if the time already has a colon (e.g., "10:00")
    if (timeStr.includes(':')) {
        [hour, minute] = timeStr.split(':');
        hour = parseInt(hour, 10);
        minute = parseInt(minute.replace(/[^\d]/g, ''), 10);
    } else {
        // Handle cases like "1130am"
        const digits = timeStr.replace(/[^\d]/g, '');
        if (digits.length === 4) {
            hour = parseInt(digits.substring(0, 2), 10);
            minute = parseInt(digits.substring(2), 10);
        } else if (digits.length === 3) {
            hour = parseInt(digits.substring(0, 1), 10);
            minute = parseInt(digits.substring(1), 10);
        } else {
            console.error(`Invalid time format: ${time}`);
            return "00:00";
        }
    }
    
    // Adjust for AM/PM
    if (timeStr.includes('pm') && hour < 12) {
        hour += 12;
    } else if (timeStr.includes('am') && hour === 12) {
        hour = 0;
    }
    
    // Default handling for times without am/pm
    // Assume 8-11 are AM, 1-7 are PM
    if (!timeStr.includes('am') && !timeStr.includes('pm')) {
        if (hour >= 8 && hour <= 11) {
            // Morning times are AM (as is)
        } else if (hour >= 1 && hour <= 7) {
            hour += 12; // Convert to PM
        }
    }
    
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/**
 * Determines the adjusted start date for the first class based on the quarter start and class days.
 * @param {Object} quarterInfo - The quarter information.
 * @param {string} days - The days string.
 * @param {Date} today - The current date.
 * @returns {string} The start date in YYYY-MM-DD format.
 */
function getAdjustedStartDate(quarterInfo, days, today) {
    // Quarter start dates
    const quarterStartMap = {
        'Winter': `${quarterInfo.year}-01-03`,
        'Spring': `${quarterInfo.year}-03-27`, 
        'Summer': `${quarterInfo.year}-06-19`,
        'Autumn': `${quarterInfo.year}-09-27`
    };
    
    const quarterStart = new Date(quarterStartMap[quarterInfo.quarter] || `${quarterInfo.year}-09-27`);
    
    // Convert days string to day numbers
    const dayMap = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'M': 1, 'T': 2, 'W': 3, 'Th': 4, 'F': 5 };
    const classDaysRaw = days.match(/Monday|Tuesday|Wednesday|Thursday|Friday|M|T|W|Th|F/g) || [];
    const classDays = classDaysRaw.map(day => dayMap[day]);
    
    // If today is after quarter start and is a class day, use today
    if (today > quarterStart) {
        const todayDay = today.getDay(); // 0=Sun, 1=Mon, etc.
        if (classDays.includes(todayDay)) {
            return today.toISOString().split('T')[0];
        }
        
        // Find next class day
        let nextDay = new Date(today);
        let daysToAdd = 1;
        while (daysToAdd < 8) {
            nextDay = new Date(today);
            nextDay.setDate(today.getDate() + daysToAdd);
            if (classDays.includes(nextDay.getDay())) {
                return nextDay.toISOString().split('T')[0];
            }
            daysToAdd++;
        }
    }
    
    // Otherwise find first class day from quarter start
    let firstClassDate = new Date(quarterStart);
    let daysChecked = 0;
    
    // Find the first occurrence of a class day after the quarter start
    while (daysChecked < 7) {
        if (classDays.includes(firstClassDate.getDay())) {
            return firstClassDate.toISOString().split('T')[0];
        }
        firstClassDate.setDate(firstClassDate.getDate() + 1);
        daysChecked++;
    }
    
    // Fallback: return quarter start
    return quarterStart.toISOString().split('T')[0];
}

/**
 * Converts course days into a recurrence rule format.
 * @param {string} days - The days string.
 * @returns {string} The recurrence rule days (e.g., "MO,TU").
 */
function convertDaysToRecurrence(days) {
    const dayMap = {
        'Monday': 'MO',
        'Tuesday': 'TU',
        'Wednesday': 'WE',
        'Thursday': 'TH',
        'Friday': 'FR',
        'M': 'MO',
        'T': 'TU',
        'W': 'WE',
        'Th': 'TH',
        'F': 'FR'
    };

    const dayMatches = days.match(/Monday|Tuesday|Wednesday|Thursday|Friday|M|T|W|Th|F/g) || [];
    let rruleDays = dayMatches.map(day => dayMap[day]).join(',');
    console.log(`Recurrence rule days: ${rruleDays}`);

    return rruleDays || 'MO';
}

/**
 * Retrieves the quarter end date in a format suitable for calendar recurrence rules.
 * @param {{quarter: string, year: number}} info - The quarter information.
 * @returns {string} The quarter end date in the format YYYYMMDDTHHmmssZ.
 */
function getQuarterEndDate({ quarter, year }) {
    const quarterEndDates = {
        'Autumn': `${year}1215T235959Z`,
        'Winter': `${year}0320T235959Z`,
        'Spring': `${year}0607T235959Z`,
        'Summer': `${year}0815T235959Z`
    };

    console.log(`Quarter end date: ${quarterEndDates[quarter]}`);
    return quarterEndDates[quarter] || `${year}1215T235959Z`;
}

/**
 * Formats the instructor's name.
 * @param {string} name - The raw instructor name.
 * @returns {string} The formatted name.
 */
function formatInstructor(name) {
    if (name.includes(",")) {
        const [lastName, firstName] = name.split(",").map(s => s.trim());
        return `${firstName} ${lastName}`;
    }
    return name;
}

/**
 * Formats a title string to have each word capitalized appropriately.
 * @param {string} title - The raw title.
 * @returns {string} The formatted title.
 */
function formatTitle(title) {
    return title.split(' ').map(word => {
        return word === word.toUpperCase() ? word : word[0].toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
}
