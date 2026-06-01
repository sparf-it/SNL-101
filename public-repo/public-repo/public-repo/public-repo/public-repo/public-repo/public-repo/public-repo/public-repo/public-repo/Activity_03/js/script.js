// Initialize SCORM 2004
let initialized = false;

// SCORM initialization function
function setupSCORM() {
    // Initialize SCORM 2004 API using our enhanced wrapper
    initialized = initializeSCORM();   
}

// Create a separate function name to avoid naming conflicts
function closeScormSession() {
    if (initialized) {
        // Call the terminateSCORM function from the SCORM API wrapper
        // which handles the different SCORM versions internally
        window.terminateSCORM();
    }
}

// Function to set completion status using SCORM 2004 data model elements
function setCompletionStatus(status) {
    if (initialized) {
        // Update both completion_status and success_status for SCORM 2004
        setSCORMValue("cmi.completion_status", status);
        
        // If completed, set success status to passed, otherwise unknown
        if (status === "completed") {
            setSCORMValue("cmi.success_status", "passed");
        } else {
            setSCORMValue("cmi.success_status", "unknown");
        }
        
        commitSCORM();
    }
}

function markActivityComplete(){
    $('#completionMessage').css('display', 'block');
    $('#completionButton').css('display', 'none');
    setCompletionStatus("completed");
}

function markActivityInComplete(){
    $('#completionMessage').css('display', 'block');
    $('#completionButton').css('display', 'none');
    setCompletionStatus("incomplete");
}

// Using jQuery for event handling
$(document).ready(function() { 
    // Initialize SCORM 2004
    setupSCORM();
    
    // Check if the activity is already completed and update UI accordingly
    if (initialized) {
        try {
            // First try SCORM 2004 data model elements
            let isComplete = false;
            try {
                let completionStatus = getSCORMValue("cmi.completion_status");
                console.log("SCORM 2004 completion_status: " + completionStatus);
                if (completionStatus === "completed") {
                    isComplete = true;
                }
            } catch (e) {
                console.warn("Could not get cmi.completion_status: " + e.message);
            }
            
            try {
                let successStatus = getSCORMValue("cmi.success_status");
                console.log("SCORM 2004 success_status: " + successStatus);
                if (successStatus === "passed") {
                    isComplete = true;
                }
            } catch (e) {
                console.warn("Could not get cmi.success_status: " + e.message);
            }
            
            // Update UI based on completion status
            if (isComplete) {
                $('#completionMessage').css('display', 'block');
                $('#completionButton').css('display', 'none');
                console.log("Activity marked as completed based on SCORM status");
            }
        } catch (e) {
            console.error("Error checking completion status: " + e.message);
        }
    }
    
    // Set up window unload event to terminate SCORM session
    $(window).on('beforeunload', function() {
        if (initialized) {
            closeScormSession();
        }
    });
});
