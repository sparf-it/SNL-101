/*
    SCORM 2004 API Wrapper
    This script handles finding and interfacing with the SCORM 2004 API provided by the LMS
    Based on SCORM 2004 4th Edition
    Modified for LearnWorlds compatibility
*/

// Variable to store the API reference for SCORM 2004
var API = null;
// Validated data model elements for SCORM 2004
var validDataModel = {};

// Attempts to locate the SCORM 2004 API in the parent windows
function findAPI(win) {
    let findAPITries = 0;
    const maxTries = 7;
    
    while ((findAPITries < maxTries)) {
        // Only look for SCORM 2004 API
        if (typeof win.API_1484_11 !== 'undefined' && win.API_1484_11 !== null) {
            return win.API_1484_11;
        }
        
        // If not found and we can go up, go up
        if ((win.parent != null) && (win.parent != win)) {
            findAPITries++;
            win = win.parent;
        } else {
            break;
        }
    }
    
    return null;
}

// Main function to get the SCORM API reference
function getAPI() {
    // If we already have the API, return it
    if (API != null) {
        return API;
    }
    
    // Look for the API, starting in the current window
    let currentWin = window;
    API = findAPI(currentWin);
    
    // If not found, look in the opener window
    if ((API == null) && (window.opener != null) && (typeof(window.opener) != "undefined")) {
        currentWin = window.opener;
        API = findAPI(currentWin);
    }
    
    // If not found, log an error
    if (API == null) {
        console.error("Unable to find SCORM API");
        return null;
    }
    
    // Initialize valid data model elements based on SCORM version
    initializeDataModel();
    
    return API;
}

// Initialize the valid data model elements for SCORM 2004
function initializeDataModel() {
    // SCORM 2004 data model elements
    validDataModel = {
        // Core elements
        "cmi.completion_status": true,
        "cmi.success_status": true,
        "cmi.exit": true,
        "cmi.entry": true,
        "cmi.location": true,
        "cmi.suspend_data": true,
        
        // Score-related elements
        "cmi.score.raw": true,
        "cmi.score.min": true,
        "cmi.score.max": true,
        "cmi.score.scaled": true,
        
        // Time-related elements
        "cmi.total_time": true,
        "cmi.session_time": true,
        
        // Learner information
        "cmi.learner_id": true,
        "cmi.learner_name": true,
        
        // Other elements
        "cmi.mode": true,
        "cmi.credit": true,
        "cmi.progress_measure": true,
        "cmi.completionThreshold": true
    };
}

// Safe wrapper for SetValue that validates data model elements for SCORM 2004
function setSCORMValue(element, value) {
    if (!API) {
        console.warn("SCORM 2004 API not initialized - can't set value");
        return false;
    }
    
    // Check if element is valid in SCORM 2004
    if (validDataModel[element] === false) {
        console.warn("Ignoring attempt to set invalid data model element: " + element);
        return false;
    }
    
    // Set the value using SCORM 2004 API
    try {
        console.info("Setting " + element + " to " + value);
        return API.SetValue(element, value);
    } catch (e) {
        console.warn("Error setting " + element + ": " + e.message);
        return false;
    }
}

// Safe wrapper for GetValue that handles errors gracefully
function getSCORMValue(element) {
    if (!API) {
        console.warn("SCORM 2004 API not initialized - can't get value");
        return "";
    }
    
    // Get the value using SCORM 2004 API
    try {
        return API.GetValue(element);
    } catch (e) {
        console.warn("Error getting " + element + ": " + e.message);
        return "";
    }
}

// Initialize the SCORM 2004 session
function initializeSCORM() {
    // Get API reference
    const api = getAPI();
    
    if (!api) {
        console.warn("SCORM 2004 API not found - running in standalone mode");
        return false;
    }
    
    // Initialize using SCORM 2004 method
    let result = (api.Initialize("") === "true" || api.Initialize("") === true);
    
    if (!result) {
        console.error("Failed to initialize SCORM 2004 API");
    } else {
        console.log("SCORM 2004 API initialized successfully");
    }
    
    return result;
}

// Terminate the SCORM 2004 session
function terminateSCORM() {
    if (!API) {
        return false;
    }
    
    // Terminate using SCORM 2004 method
    return API.Terminate("");
}

// Set completion status for SCORM 2004
function setCompletionStatus(status) {
    if (!API) {
        return false;
    }
    
    setSCORMValue("cmi.completion_status", status);
    setSCORMValue("cmi.success_status", status); // Usually these would be set differently, but for simple scenarios we use same value
    return API.Commit("");
}

// Commit changes to the LMS using SCORM 2004
function commitSCORM() {
    if (!API) {
        return false;
    }
    
    return API.Commit("");
}
