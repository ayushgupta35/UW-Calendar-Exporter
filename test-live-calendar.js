/**
 * Live tests for calendar parsing functions
 * Tests against actual UW calendar website
 * To run: node test-live-calendar.js
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

// Test function with logging
function testQuarterDates(html, quarter, year) {
    console.log(`\nTesting ${quarter} ${year}:`);
    
    const startDate = parseQuarterStartDate(html, quarter);
    const endDate = parseQuarterEndDate(html, quarter);
    
    if (startDate) {
        console.log(`  Start Date: ${startDate.toDateString()}`);
    } else {
        console.log(`  Start Date: NOT FOUND`);
    }
    
    if (endDate) {
        console.log(`  End Date: ${endDate.toDateString()}`);
    } else {
        console.log(`  End Date: NOT FOUND`);
    }
    
    return { startDate, endDate };
}

async function runLiveTests() {
    console.log('Running live calendar tests...');
    
    try {
        // Test current academic year (2024-2025)
        const url2425 = getCalendarUrl(2025);
        console.log(`\nFetching: ${url2425}`);
        
        const html2425 = await fetchHtml(url2425);
        console.log('✅ Successfully fetched HTML');
        
        // Test all quarters for 2024-2025
        const quarters = ['Autumn', 'Winter', 'Spring', 'Summer'];
        const results = {};
        
        quarters.forEach(quarter => {
            results[quarter] = testQuarterDates(html2425, quarter, quarter === 'Autumn' ? 2024 : 2025);
        });
        
        // Verify we got valid dates
        let allValid = true;
        quarters.forEach(quarter => {
            const { startDate, endDate } = results[quarter];
            if (!startDate || !endDate) {
                console.log(`❌ Missing dates for ${quarter}`);
                allValid = false;
            }
        });
        
        if (allValid) {
            console.log('\n✅ All quarters have valid start and end dates!');
        } else {
            console.log('\n❌ Some quarters are missing dates');
        }
        
        // Test URL generation for different years
        console.log('\nTesting URL generation:');
        console.log(`2024-2025: ${getCalendarUrl(2025)}`);
        console.log(`2025-2026: ${getCalendarUrl(2026)}`);
        console.log(`2023-2024: ${getCalendarUrl(2024)}`);
        
    } catch (error) {
        console.error('❌ Error running live tests:', error.message);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runLiveTests();
}

module.exports = { runLiveTests };
