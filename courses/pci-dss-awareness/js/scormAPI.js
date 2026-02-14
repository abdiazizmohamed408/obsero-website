/**
 * SCORM 1.2 API Wrapper for Obsero Courses
 * Handles communication with LMS
 */

const SCORM = {
    API: null,
    isInitialized: false,
    
    // Find the SCORM API
    findAPI(win) {
        let attempts = 0;
        while ((!win.API) && (win.parent) && (win.parent !== win) && (attempts < 10)) {
            attempts++;
            win = win.parent;
        }
        return win.API || null;
    },

    // Initialize connection to LMS
    init() {
        this.API = this.findAPI(window);
        
        if (this.API) {
            const result = this.API.LMSInitialize("");
            this.isInitialized = (result === "true" || result === true);
            
            if (this.isInitialized) {
                // Set incomplete status on start
                this.setValue("cmi.core.lesson_status", "incomplete");
            }
        } else {
            // Running outside LMS (preview mode)
            console.log("SCORM API not found - running in preview mode");
            this.isInitialized = true;
            this.previewMode = true;
        }
        
        return this.isInitialized;
    },

    // Get value from LMS
    getValue(element) {
        if (this.previewMode) {
            return localStorage.getItem(`scorm_${element}`) || "";
        }
        if (this.API && this.isInitialized) {
            return this.API.LMSGetValue(element);
        }
        return "";
    },

    // Set value in LMS
    setValue(element, value) {
        if (this.previewMode) {
            localStorage.setItem(`scorm_${element}`, value);
            return "true";
        }
        if (this.API && this.isInitialized) {
            return this.API.LMSSetValue(element, value);
        }
        return "false";
    },

    // Commit data to LMS
    commit() {
        if (this.previewMode) return "true";
        if (this.API && this.isInitialized) {
            return this.API.LMSCommit("");
        }
        return "false";
    },

    // Finish/close connection
    finish() {
        if (this.previewMode) return "true";
        if (this.API && this.isInitialized) {
            return this.API.LMSFinish("");
        }
        return "false";
    },

    // Get last error
    getLastError() {
        if (this.previewMode) return "0";
        if (this.API) {
            return this.API.LMSGetLastError();
        }
        return "0";
    },

    // Helper: Set lesson status
    setStatus(status) {
        // Valid: "passed", "completed", "failed", "incomplete", "browsed", "not attempted"
        return this.setValue("cmi.core.lesson_status", status);
    },

    // Helper: Set score
    setScore(score, max = 100, min = 0) {
        this.setValue("cmi.core.score.raw", score.toString());
        this.setValue("cmi.core.score.max", max.toString());
        this.setValue("cmi.core.score.min", min.toString());
        return this.commit();
    },

    // Helper: Set bookmark (location)
    setBookmark(location) {
        return this.setValue("cmi.core.lesson_location", location);
    },

    // Helper: Get bookmark
    getBookmark() {
        return this.getValue("cmi.core.lesson_location");
    },

    // Helper: Set suspend data (for saving progress)
    setSuspendData(data) {
        return this.setValue("cmi.suspend_data", JSON.stringify(data));
    },

    // Helper: Get suspend data
    getSuspendData() {
        const data = this.getValue("cmi.suspend_data");
        try {
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    },

    // Helper: Complete course
    complete(passed = true, score = null) {
        if (score !== null) {
            this.setScore(score);
        }
        this.setStatus(passed ? "passed" : "failed");
        this.commit();
        return this.finish();
    }
};

// Auto-initialize when script loads
document.addEventListener('DOMContentLoaded', () => {
    SCORM.init();
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    SCORM.commit();
    SCORM.finish();
});
