// Test file to check if PDF.js is present
// Save this as "check-pdfjs.js" in your extension directory

document.addEventListener('DOMContentLoaded', function() {
  // Create a div to show results
  const resultDiv = document.createElement('div');
  resultDiv.style.padding = '20px';
  resultDiv.style.fontFamily = 'Arial, sans-serif';
  document.body.appendChild(resultDiv);
  
  // Check for pdf.js
  const pdfJsScript = document.createElement('script');
  pdfJsScript.src = 'pdf.js';
  pdfJsScript.onload = function() {
    resultDiv.innerHTML += '<p style="color: green">✓ pdf.js was found and loaded successfully!</p>';
    
    // Now check if the library works
    if (typeof pdfjsLib !== 'undefined') {
      resultDiv.innerHTML += '<p style="color: green">✓ pdfjsLib object is available!</p>';
      resultDiv.innerHTML += '<p>PDF.js version: ' + pdfjsLib.version + '</p>';
    } else {
      resultDiv.innerHTML += '<p style="color: red">✗ pdfjsLib object is not available!</p>';
    }
    
    // Check for pdf.worker.js
    fetch('pdf.worker.js')
      .then(response => {
        if (response.ok) {
          resultDiv.innerHTML += '<p style="color: green">✓ pdf.worker.js was found!</p>';
        } else {
          resultDiv.innerHTML += '<p style="color: red">✗ pdf.worker.js not found or not accessible!</p>';
        }
      })
      .catch(error => {
        resultDiv.innerHTML += '<p style="color: red">✗ Error checking pdf.worker.js: ' + error.message + '</p>';
      });
  };
  
  pdfJsScript.onerror = function() {
    resultDiv.innerHTML += '<p style="color: red">✗ pdf.js could not be loaded!</p>';
    resultDiv.innerHTML += '<h3>Recommended Fix:</h3>';
    resultDiv.innerHTML += '<ol>' + 
      '<li>Download PDF.js from <a href="https://github.com/mozilla/pdf.js/releases" target="_blank">GitHub releases</a></li>' +
      '<li>Extract the zip file</li>' +
      '<li>Copy "build/pdf.min.js" to your extension directory and rename it to "pdf.js"</li>' +
      '<li>Copy "build/pdf.worker.min.js" to your extension directory and rename it to "pdf.worker.js"</li>' +
      '</ol>';
  };
  
  document.head.appendChild(pdfJsScript);
});