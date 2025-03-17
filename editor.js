// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("PDF Editor initializing");
  
  // Check if PDF.js is available
  if (typeof pdfjsLib === 'undefined') {
    console.error("PDF.js library not loaded properly!");
    document.body.innerHTML = '<div style="padding: 20px; color: red;"><h1>Error Loading PDF.js</h1><p>The PDF.js library could not be loaded. Please check that pdf.js and pdf.worker.js are in your extension directory.</p></div>';
    return;
  }
  
  console.log("PDF.js library detected");
  
  // PDF.js variables
  let pdfDoc = null;
  let pageNum = 1;
  let pageRendering = false;
  let pageNumPending = null;
  let scale = 1.0;
  let canvas = document.getElementById('pdf-canvas');
  let ctx = canvas.getContext('2d');
  
  // Editor state
  let currentTool = 'select';
  let annotations = [];
  let isDrawing = false;
  let startX, startY;
  let currentPath = [];
  
  // Load PDF from Chrome storage
  chrome.storage.local.get(['currentPdfData', 'currentPdfUrl', 'currentPdfName'], function(result) {
    console.log("Checking for PDF data in storage");
    
    // Set document title
    if (result.currentPdfName) {
      document.title = "Editing: " + result.currentPdfName;
    }
    
    if (result.currentPdfData) {
      console.log("Found PDF data in storage, loading...");
      // We have the binary data, convert it to an array
      try {
        const typedArray = new Uint8Array(result.currentPdfData);
        loadPdfFromData(typedArray);
      } catch (e) {
        console.error("Error processing PDF data:", e);
        showError("Error processing PDF data: " + e.message);
      }
    } 
    else if (result.currentPdfUrl) {
      console.log("Found PDF URL in storage, fetching...");
      // We have a URL, fetch the PDF
      fetchAndLoadPdf(result.currentPdfUrl);
    } 
    else {
      console.error("No PDF data or URL found in storage");
      showError("No PDF found. Please select a PDF file from the extension popup.");
    }
  });
  
  // Function to show error messages
  function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.padding = '20px';
    errorDiv.style.color = 'red';
    errorDiv.style.backgroundColor = '#ffeeee';
    errorDiv.style.border = '1px solid red';
    errorDiv.style.borderRadius = '5px';
    errorDiv.style.margin = '20px';
    errorDiv.innerHTML = `<h3>Error</h3><p>${message}</p>`;
    
    document.getElementById('pdf-container').appendChild(errorDiv);
  }
  
  // Function to load PDF from array buffer
  function loadPdfFromData(data) {
    console.log("Loading PDF from data");
    
    // Use PDF.js to load the document
    pdfjsLib.getDocument({data: data}).promise
      .then(function(pdf) {
        console.log("PDF loaded successfully", pdf);
        pdfDoc = pdf;
        document.getElementById('totalPages').textContent = pdfDoc.numPages;
        
        // Initial page rendering
        renderPage(pageNum);
        
        // Setup UI after the PDF is loaded
        setupUI();
      })
      .catch(function(error) {
        console.error("Error loading PDF:", error);
        showError('Error loading PDF: ' + error.message);
      });
  }
  
  // Function to fetch and load PDF from URL
  function fetchAndLoadPdf(url) {
    console.log("Fetching PDF from URL:", url);
    
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.status}`);
        }
        return response.arrayBuffer();
      })
      .then(arrayBuffer => {
        console.log("PDF fetched, loading data");
        loadPdfFromData(new Uint8Array(arrayBuffer));
      })
      .catch(error => {
        console.error("Error fetching PDF:", error);
        showError(`Error fetching PDF: ${error.message}. Note that Chrome extensions cannot directly access local file URLs.`);
      });
  }
  
  function renderPage(num) {
    if (!pdfDoc) {
      console.error("No PDF document loaded");
      return;
    }
    
    pageRendering = true;
    
    // Update UI
    document.getElementById('currentPage').textContent = num;
    document.getElementById('pageNumber').value = num;
    
    // Get the page
    pdfDoc.getPage(num).then(function(page) {
      const viewport = page.getViewport({scale});
      
      // Prepare canvas
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Render PDF page into canvas context
      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };
      
      const renderTask = page.render(renderContext);
      
      // Wait for rendering to finish
      renderTask.promise.then(function() {
        pageRendering = false;
        
        // Render any annotations for this page
        renderAnnotations(num);
        
        if (pageNumPending !== null) {
          // New page rendering is pending
          renderPage(pageNumPending);
          pageNumPending = null;
        }
      });
    }).catch(function(error) {
      console.error("Error rendering page:", error);
      pageRendering = false;
      showError("Error rendering page: " + error.message);
    });
  }
  
  function queueRenderPage(num) {
    if (pageRendering) {
      pageNumPending = num;
    } else {
      renderPage(num);
    }
  }
  
  function renderAnnotations(pageNumber) {
    const annotationsLayer = document.getElementById('annotations-layer');
    annotationsLayer.innerHTML = '';
    
    // Filter annotations for the current page
    const pageAnnotations = annotations.filter(a => a.page === pageNumber);
    
    // Render each annotation
    pageAnnotations.forEach(annotation => {
      switch (annotation.type) {
        case 'highlight':
          // Render highlight
          break;
        case 'underline':
          // Render underline
          break;
        case 'text':
          // Render text annotation
          break;
        case 'drawing':
          // Render drawing
          break;
        // Other annotation types
      }
    });
  }
  
  function setupUI() {
    // Navigation buttons
    document.getElementById('prevPage').addEventListener('click', function() {
      if (pageNum > 1) {
        pageNum--;
        queueRenderPage(pageNum);
      }
    });
    
    document.getElementById('nextPage').addEventListener('click', function() {
      if (pageNum < pdfDoc.numPages) {
        pageNum++;
        queueRenderPage(pageNum);
      }
    });
    
    document.getElementById('goToPage').addEventListener('click', function() {
      const input = document.getElementById('pageNumber');
      const pageNumber = parseInt(input.value);
      
      if (pageNumber >= 1 && pageNumber <= pdfDoc.numPages) {
        pageNum = pageNumber;
        queueRenderPage(pageNum);
      } else {
        alert('Invalid page number');
      }
    });
    
    // Zoom controls
    document.getElementById('zoomIn').addEventListener('click', function() {
      scale *= 1.2;
      document.getElementById('zoomLevel').textContent = Math.round(scale * 100) + '%';
      queueRenderPage(pageNum);
    });
    
    document.getElementById('zoomOut').addEventListener('click', function() {
      scale /= 1.2;
      document.getElementById('zoomLevel').textContent = Math.round(scale * 100) + '%';
      queueRenderPage(pageNum);
    });
    
    // Tool selection
    const tools = ['select', 'text', 'highlight', 'underline', 'draw', 'shape', 'erase'];
    tools.forEach(tool => {
      const toolElement = document.getElementById(tool + 'Tool');
      if (toolElement) {
        toolElement.addEventListener('click', function() {
          // Remove active class from all tools
          tools.forEach(t => {
            const el = document.getElementById(t + 'Tool');
            if (el) el.classList.remove('active');
          });
          
          // Set active tool
          this.classList.add('active');
          currentTool = tool;
          
          // Update UI based on tool selection
          updatePropertiesPanel();
        });
      }
    });
    
    // Canvas event listeners for drawing
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDrawing);
    canvas.addEventListener('mouseout', endDrawing);
    
    // Save button
    document.getElementById('savePdf').addEventListener('click', savePdf);
    
    // Print button
    document.getElementById('printPdf').addEventListener('click', function() {
      window.print();
    });
    
    // Initialize properties panel
    updatePropertiesPanel();
  }
  
  function updatePropertiesPanel() {
    const fontPropertiesElement = document.getElementById('fontProperties');
    
    // Show/hide properties based on current tool
    if (fontPropertiesElement) {
      if (currentTool === 'text') {
        fontPropertiesElement.style.display = 'block';
      } else {
        fontPropertiesElement.style.display = 'none';
      }
    }
  }
  
  function startDrawing(e) {
    if (currentTool !== 'draw' && currentTool !== 'shape') return;
    
    isDrawing = true;
    
    // Get coordinates relative to the canvas
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    
    currentPath = [{x: startX, y: startY}];
  }
  
  function draw(e) {
    if (!isDrawing) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (currentTool === 'draw') {
      // Drawing freehand
      ctx.beginPath();
      ctx.moveTo(currentPath[currentPath.length - 1].x, currentPath[currentPath.length - 1].y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = document.getElementById('strokeColor').value;
      ctx.lineWidth = document.getElementById('strokeWidth').value;
      ctx.stroke();
      
      currentPath.push({x, y});
    } else if (currentTool === 'shape') {
      // Drawing shapes (just rectangles for simplicity)
      // Clear previous temporary shape
      renderPage(pageNum); // This re-renders the page, clearing any temporary drawings
      
      // Draw new shape
      ctx.beginPath();
      ctx.rect(startX, startY, x - startX, y - startY);
      ctx.strokeStyle = document.getElementById('strokeColor').value;
      ctx.lineWidth = document.getElementById('strokeWidth').value;
      ctx.stroke();
    }
  }
  
  function endDrawing(e) {
    if (!isDrawing) return;
    isDrawing = false;
    
    if (currentPath.length < 2) return;
    
    // Create annotation
    const annotation = {
      id: Date.now(),
      page: pageNum,
      type: currentTool === 'draw' ? 'drawing' : 'shape',
      color: document.getElementById('strokeColor').value,
      width: document.getElementById('strokeWidth').value,
      path: currentPath.slice()
    };
    
    annotations.push(annotation);
    currentPath = [];
    
    // Re-render the page with the new annotation
    // This is a bit inefficient but ensures everything is rendered correctly
    renderPage(pageNum);
  }
  
  function savePdf() {
    // In a full implementation, this would use a library like jsPDF or similar
    // to create a PDF with the annotations applied
    
    chrome.storage.local.get(['currentPdfName'], function(result) {
      const fileName = result.currentPdfName || 'document.pdf';
      
      alert(`In a complete implementation, this would save the PDF with annotations.\nFor this demo, we'll download the original PDF as "${fileName}".`);
      
      // For demonstration purposes, just download the original PDF
      chrome.storage.local.get(['currentPdfData'], function(result) {
        if (result.currentPdfData) {
          const blob = new Blob([result.currentPdfData], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          
          const a = document.createElement('a');
          a.href = url;
          a.download = 'edited_' + fileName;
          a.click();
          
          URL.revokeObjectURL(url);
        }
      });
    });
  }
});