// This file configures the PDF.js library
// It will wait for the pdf.js file to finish loading

// Set up a function to configure the PDF.js worker
function configurePdfWorker() {
  if (typeof pdfjsLib !== 'undefined') {
    console.log("PDF.js detected, configuring worker");
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.js';
    return true;
  }
  console.warn("PDF.js not available yet");
  return false;
}

// Try to configure immediately
let configured = configurePdfWorker();

// If not successful, set up a fallback approach
if (!configured) {
  console.log("Setting up PDF.js configuration fallback");
  
  // Try again when the document is fully loaded
  document.addEventListener('DOMContentLoaded', function() {
    if (!configured) {
      console.log("Trying to configure PDF.js again after DOM loaded");
      configured = configurePdfWorker();
    }
  });
  
  // Final attempt with a delay
  setTimeout(function() {
    if (!configured) {
      console.log("Last attempt to configure PDF.js");
      configurePdfWorker();
    }
  }, 1000);
}