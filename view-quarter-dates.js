/**
 * Quarter Date Viewer
 * Shows actual start and end dates for the next 10 quarters
 * To run: node view-quarter-dates.js
 */

const { parseQuarterStartDate, parseQuarterEndDate, getCalendarUrl } = require('./calendar-parser.js');
const https = require('https');

// Mock DOM for Node.js environment
const { JSDOM } = require('jsdom');
global.DOMParser = new JSDOM().window.DOMParser;

// Fetch HTML from URL
function fetchHtml(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve(data);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

// Generate quarter sequence starting from Autumn 2025
function generateQuarterSequence(startYear, numQuarters) {
    const quarters = ['Autumn', 'Winter', 'Spring', 'Summer'];
    const sequence = [];
    
    let currentYear = startYear;
    let quarterIndex = 0; // Start with Autumn
    
    for (let i = 0; i < numQuarters; i++) {
        const quarter = quarters[quarterIndex];
        
        // Determine the calendar year (academic year ends in the following calendar year)
        let academicYear;
        if (quarter === 'Autumn') {
            academicYear = currentYear + 1; // Autumn 2025 is in academic year 2025-2026
        } else {
            academicYear = currentYear + 1;
        }
        
        sequence.push({
            quarter,
            displayYear: quarter === 'Autumn' ? currentYear : currentYear + 1,
            academicYear,
            calendarUrl: getCalendarUrl(academicYear)
        });
        
        quarterIndex++;
        if (quarterIndex >= quarters.length) {
            quarterIndex = 0;
            currentYear++;
        }
    }
    
    return sequence;
}

// Format date nicely
function formatDate(date) {
    if (!date) return 'NOT FOUND';
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

async function viewQuarterDates() {
    console.log('🗓️  UW Quarter Dates Viewer');
    console.log('=' .repeat(60));
    
    const quarters = generateQuarterSequence(2025, 10);
    const cache = new Map(); // Cache HTML by URL to avoid duplicate requests
    
    for (let i = 0; i < quarters.length; i++) {
        const { quarter, displayYear, academicYear, calendarUrl } = quarters[i];
        
        console.log(`\n${i + 1}. ${quarter} ${displayYear}`);
        console.log(`   Academic Year: ${academicYear - 1}-${academicYear}`);
        console.log(`   Calendar URL: ${calendarUrl}`);
        
        try {
            // Get HTML from cache or fetch it
            let html;
            if (cache.has(calendarUrl)) {
                html = cache.get(calendarUrl);
                console.log(`   📋 Using cached data`);
            } else {
                console.log(`   🌐 Fetching calendar data...`);
                html = await fetchHtml(calendarUrl);
                cache.set(calendarUrl, html);
            }
            
            const startDate = parseQuarterStartDate(html, quarter);
            const endDate = parseQuarterEndDate(html, quarter);
            
            console.log(`   📅 Start: ${formatDate(startDate)}`);
            console.log(`   📅 End:   ${formatDate(endDate)}`);
            
            if (startDate && endDate) {
                const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
                console.log(`   ⏱️  Duration: ${duration} days`);
            }
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
        
        // Add a small delay to be respectful to the server
        if (i < quarters.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Quarter dates viewing completed!');
}

// Run if this file is executed directly
if (require.main === module) {
    viewQuarterDates().catch(console.error);
}

module.exports = { viewQuarterDates };
