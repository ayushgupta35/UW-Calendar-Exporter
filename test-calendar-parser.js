/**
 * Unit tests for calendar parsing functions
 * To run: node test-calendar-parser.js
 */

const { parseQuarterStartDate, parseQuarterEndDate, getCalendarUrl } = require('./calendar-parser.js');

// Mock DOM for Node.js environment
const { JSDOM } = require('jsdom');
global.DOMParser = new JSDOM().window.DOMParser;

// Sample HTML from UW calendar page (2024-2025)
const sampleHtml = `
<html>
<body>
<table id="SUMFE" class="table table-striped" border="1">
<thead>
<tr>
<td style="width: 30%;" rowspan="2"></td>
<th style="width: 12%;" rowspan="2">AUTUMN 2024</th>
<th style="width: 12%;" rowspan="2">WINTER 2025</th>
<th style="width: 14%;" rowspan="2">SPRING 2025</th>
<th colspan="3">SUMMER 2025</th>
</tr>
<tr>
<th>Full-term</th>
<th>A-term</th>
<th>B-term</th>
</tr>
</thead>
<tbody>
<tr>
<td>Instruction Begins <a href="https://apps.leg.wa.gov/WAC/default.aspx?cite=478-132-030" target="_blank" rel="noopener noreferrer">WAC 478-132-030</a></td>
<td>Sep 25, 2024</td>
<td>Jan 6, 2025</td>
<td>Mar 31, 2025</td>
<td>Jun 23, 2025</td>
<td>Jun 23, 2025</td>
<td>Jul 24, 2025</td>
</tr>
<tr>
<td>Last Day of Instruction</td>
<td>Dec 6, 2024</td>
<td>Mar 14, 2025</td>
<td>Jun 6, 2025</td>
<td>Aug 22, 2025</td>
<td>Jul 23, 2025</td>
<td>Aug 22, 2025</td>
</tr>
</tbody>
</table>
</body>
</html>
`;

// Test functions
function assertEqual(actual, expected, testName) {
    if (actual?.toString() === expected?.toString()) {
        console.log(`✅ ${testName}: PASSED`);
    } else {
        console.log(`❌ ${testName}: FAILED`);
        console.log(`   Expected: ${expected}`);
        console.log(`   Actual: ${actual}`);
    }
}

function runTests() {
    console.log('Running calendar parser tests...\n');

    // Test quarter start date parsing
    assertEqual(
        parseQuarterStartDate(sampleHtml, 'Autumn')?.toDateString(),
        new Date('Sep 25, 2024').toDateString(),
        'Parse Autumn 2024 start date'
    );

    assertEqual(
        parseQuarterStartDate(sampleHtml, 'Winter')?.toDateString(),
        new Date('Jan 6, 2025').toDateString(),
        'Parse Winter 2025 start date'
    );

    assertEqual(
        parseQuarterStartDate(sampleHtml, 'Spring')?.toDateString(),
        new Date('Mar 31, 2025').toDateString(),
        'Parse Spring 2025 start date'
    );

    assertEqual(
        parseQuarterStartDate(sampleHtml, 'Summer')?.toDateString(),
        new Date('Jun 23, 2025').toDateString(),
        'Parse Summer 2025 start date'
    );

    // Test quarter end date parsing
    assertEqual(
        parseQuarterEndDate(sampleHtml, 'Autumn')?.toDateString(),
        new Date('Dec 6, 2024').toDateString(),
        'Parse Autumn 2024 end date'
    );

    assertEqual(
        parseQuarterEndDate(sampleHtml, 'Winter')?.toDateString(),
        new Date('Mar 14, 2025').toDateString(),
        'Parse Winter 2025 end date'
    );

    assertEqual(
        parseQuarterEndDate(sampleHtml, 'Spring')?.toDateString(),
        new Date('Jun 6, 2025').toDateString(),
        'Parse Spring 2025 end date'
    );

    assertEqual(
        parseQuarterEndDate(sampleHtml, 'Summer')?.toDateString(),
        new Date('Aug 22, 2025').toDateString(),
        'Parse Summer 2025 end date'
    );

    // Test calendar URL generation
    assertEqual(
        getCalendarUrl(2025),
        'https://www.washington.edu/students/reg/2425cal.html',
        'Generate calendar URL for 2024-2025'
    );

    assertEqual(
        getCalendarUrl(2026),
        'https://www.washington.edu/students/reg/2526cal.html',
        'Generate calendar URL for 2025-2026'
    );

    // Test edge cases
    assertEqual(
        parseQuarterStartDate('<html></html>', 'Autumn'),
        null,
        'Handle missing table'
    );

    assertEqual(
        parseQuarterStartDate(sampleHtml, 'InvalidQuarter'),
        null,
        'Handle invalid quarter'
    );

    console.log('\nTests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests();
}

module.exports = { runTests };
