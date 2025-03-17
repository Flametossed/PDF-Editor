document.addEventListener('DOMContentLoaded', function() {
  // Initialize popup functionality
  const openPdfBtn = document.getElementById('openPdf');
  const currentPdfBtn = document.getElementById('currentPdf');
  const recentList = document.getElementById('recentList');
  
  // Load recent PDFs from storage
  chrome.storage.local.get('recentPdfs', function(result) {
    const recentPdfs = result.recentPdfs || [];
    
    if (recentPdfs.length === 0) {
      recentList.innerHTML = '<li class="empty">No recent PDFs</li>';
    } else {
      recentList.innerHTML = '';
      recentPdfs.forEach(function(pdf) {
        const listItem = document.createElement('li');
        listItem.textContent = pdf.name;
        listItem.addEventListener('click', function() {
          if (pdf.data) {
            // If we have the data stored, use it
            chrome.storage.local.set({
              currentPdfName: pdf.name,
              currentPdfData: pdf.data
            }, function() {
              openEditorTab();
            });
          } else {
            // Otherwise, we need to reselect the file
            alert('Please reselect this PDF file as it was not fully cached.');
          }
        });
        recentList.appendChild(listItem);
      });
    }
  });
  
  // Open PDF file selector
  openPdfBtn.addEventListener('click', function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    
    input.onchange = function(event) {
      const file = event.target.files[0];
      if (file) {
        // Read the file as ArrayBuffer
        const reader = new FileReader();
        reader.onload = function(e) {
          const pdfData = e.target.result;
          
          // Store the PDF data in Chrome storage
          chrome.storage.local.set({
            currentPdfName: file.name,
            currentPdfData: pdfData
          }, function() {
            // Save to recent PDFs list with data
            saveToRecent(file.name, pdfData);
            // Open the editor
            openEditorTab();
          });
        };
        reader.readAsArrayBuffer(file);
      }
    };
    
    input.click();
  });
  
  // Check and edit current tab if it's a PDF
  currentPdfBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];
      if (currentTab.url.toLowerCase().endsWith('.pdf') || 
          currentTab.url.toLowerCase().includes('pdf')) {
        
        // For PDFs open in tabs, we'll fetch the PDF data
        chrome.scripting.executeScript({
          target: {tabId: currentTab.id},
          function: () => {
            return { url: window.location.href };
          }
        }, (results) => {
          if (results && results[0] && results[0].result) {
            const pdfUrl = results[0].result.url;
            const pdfName = pdfUrl.split('/').pop();
            
            // We'll set the URL and open editor, which will fetch the PDF
            chrome.storage.local.set({
              currentPdfUrl: pdfUrl,
              currentPdfName: pdfName
            }, function() {
              openEditorTab();
            });
          } else {
            alert('Could not access the current PDF.');
          }
        });
      } else {
        alert('Current page does not appear to be a PDF document.');
      }
    });
  });
  
  // Save PDF to recent list
  function saveToRecent(name, data) {
    chrome.storage.local.get('recentPdfs', function(result) {
      const recentPdfs = result.recentPdfs || [];
      
      // Add new PDF to the beginning of the list
      recentPdfs.unshift({
        name: name,
        data: data, // Store the actual PDF data
        date: new Date().toISOString()
      });
      
      // Keep only the 5 most recent PDFs to avoid storage limits
      const updatedList = recentPdfs.slice(0, 5);
      
      chrome.storage.local.set({recentPdfs: updatedList});
    });
  }
  
  // Open the PDF editor tab
  function openEditorTab() {
    chrome.tabs.create({
      url: chrome.runtime.getURL('editor.html')
    });
  }
});