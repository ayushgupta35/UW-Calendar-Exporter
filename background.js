// background.js
// Listens for messages from content.js to fetch calendar HTML from UW website

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchCalendar') {
        fetch(request.url)
            .then(response => response.text())
            .then(html => sendResponse({ success: true, html }))
            .catch(error => sendResponse({ success: false, error: error.toString() }));
        // Indicate async response
        return true;
    }
});
