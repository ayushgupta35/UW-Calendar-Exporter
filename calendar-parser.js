/**
 * Utility functions for parsing UW academic calendar HTML
 * These functions are extracted for testability
 */

/**
 * Parses the quarter start date from UW calendar HTML
 * @param {string} html - The HTML content from UW calendar page
 * @param {string} quarter - The quarter name (Autumn, Winter, Spring, Summer)
 * @returns {Date|null} The parsed start date or null if not found
 */
function parseQuarterStartDate(html, quarter) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Find the Dates of Instruction table
    const table = doc.querySelector('table#SUMFE, table.table-striped');
    if (!table) {
        return null;
    }
    
    // Find the row for 'Instruction Begins'
    const rows = table.querySelectorAll('tbody tr');
    let startRow = null;
    rows.forEach(row => {
        if (row.textContent.includes('Instruction Begins')) {
            startRow = row;
        }
    });
    
    if (!startRow) {
        return null;
    }
    
    // Find the correct cell for the quarter
    const quarterMap = {
        'Autumn': 1,
        'Winter': 2,
        'Spring': 3,
        'Summer': 4
    };
    
    const cellIndex = quarterMap[quarter];
    if (!cellIndex) {
        return null;
    }
    
    const cells = startRow.querySelectorAll('td, th');
    if (!cells[cellIndex]) {
        return null;
    }
    
    const dateStr = cells[cellIndex].textContent.trim();
    const parsedDate = new Date(dateStr);
    
    return isNaN(parsedDate) ? null : parsedDate;
}

/**
 * Parses the quarter end date from UW calendar HTML
 * @param {string} html - The HTML content from UW calendar page
 * @param {string} quarter - The quarter name (Autumn, Winter, Spring, Summer)
 * @returns {Date|null} The parsed end date or null if not found
 */
function parseQuarterEndDate(html, quarter) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Find the Dates of Instruction table
    const table = doc.querySelector('table#SUMFE, table.table-striped');
    if (!table) {
        return null;
    }
    
    // Find the row for 'Last Day of Instruction'
    const rows = table.querySelectorAll('tbody tr');
    let endRow = null;
    rows.forEach(row => {
        if (row.textContent.includes('Last Day of Instruction')) {
            endRow = row;
        }
    });
    
    if (!endRow) {
        return null;
    }
    
    // Find the correct cell for the quarter
    const quarterMap = {
        'Autumn': 1,
        'Winter': 2,
        'Spring': 3,
        'Summer': 4
    };
    
    const cellIndex = quarterMap[quarter];
    if (!cellIndex) {
        return null;
    }
    
    const cells = endRow.querySelectorAll('td, th');
    if (!cells[cellIndex]) {
        return null;
    }
    
    const dateStr = cells[cellIndex].textContent.trim();
    const parsedDate = new Date(dateStr);
    
    return isNaN(parsedDate) ? null : parsedDate;
}

/**
 * Constructs the academic year calendar URL
 * @param {number} year - The academic year (e.g., 2025 for 2024-2025)
 * @returns {string} The calendar URL
 */
function getCalendarUrl(year) {
    const yearNum = typeof year === 'string' ? parseInt(year) : year;
    const startYY = (yearNum - 1).toString().slice(-2);
    const endYY = yearNum.toString().slice(-2);
    const calendarYear = `${startYY}${endYY}`;
    return `https://www.washington.edu/students/reg/${calendarYear}cal.html`;
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        parseQuarterStartDate,
        parseQuarterEndDate,
        getCalendarUrl
    };
}
