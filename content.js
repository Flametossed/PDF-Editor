document.addEventListener('DOMContentLoaded', function() {
  const isPdf = window.location.href.toLowerCase().endsWith('.pdf') || 
                document.contentType === 'application/pdf';

  if (isPdf) {
    chrome.runtime.sendMessage({action: 'pdfDetected', url: window.location.href});
  }
});