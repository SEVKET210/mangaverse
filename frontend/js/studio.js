document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const uploader = document.getElementById('imageUploader');
  const uploadOverlay = document.getElementById('uploadOverlay');
  const canvasWrapper = document.getElementById('canvasWrapper');
  const canvas = document.getElementById('mangaCanvas');
  const ctx = canvas.getContext('2d');
  const overlaysContainer = document.getElementById('overlaysContainer');
  
  // Tools
  const btnSelect = document.getElementById('toolSelect');
  const btnStamp = document.getElementById('toolStamp');
  const btnEraser = document.getElementById('toolEraser');
  const btnExport = document.getElementById('btnExport');
  
  // Sidebar
  const textLinesContainer = document.getElementById('textLinesContainer');
  const btnAddLine = document.getElementById('btnAddLine');
  
  // Settings
  const eraserSizeInput = document.getElementById('eraserSize');
  const fontFamilyInput = document.getElementById('fontFamily');
  const fontSizeInput = document.getElementById('fontSize');
  const fontColorInput = document.getElementById('fontColor');
  const lineHeightInput = document.getElementById('lineHeight');

  // State
  let currentTool = 'select'; // 'select', 'stamp', 'eraser'
  let lines = [];
  let currentActiveLineIndex = 0;
  let isDrawing = false;
  let baseImage = null;

  // Initialize
  initSidebar();

  // ==========================================
  // IMAGE UPLOAD & CANVAS SETUP
  // ==========================================
  uploader.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Setup Canvas
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        baseImage = img;
        
        // Show Workspace
        uploadOverlay.style.display = 'none';
        canvasWrapper.style.display = 'inline-block';
        canvasWrapper.style.width = img.width + 'px';
        canvasWrapper.style.height = img.height + 'px';
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  // ==========================================
  // TOOLBAR LOGIC
  // ==========================================
  const setTool = (tool) => {
    currentTool = tool;
    btnSelect.classList.remove('active');
    btnStamp.classList.remove('active');
    btnEraser.classList.remove('active');
    
    if (tool === 'select') btnSelect.classList.add('active');
    if (tool === 'stamp') btnStamp.classList.add('active');
    if (tool === 'eraser') btnEraser.classList.add('active');
    
    if (tool === 'eraser') {
      canvas.style.cursor = 'crosshair';
      overlaysContainer.style.pointerEvents = 'none';
    } else if (tool === 'stamp') {
      canvas.style.cursor = 'crosshair';
      overlaysContainer.style.pointerEvents = 'none';
    } else {
      canvas.style.cursor = 'default';
      overlaysContainer.style.pointerEvents = 'auto';
    }
  };

  btnSelect.addEventListener('click', () => setTool('select'));
  btnStamp.addEventListener('click', () => setTool('stamp'));
  btnEraser.addEventListener('click', () => setTool('eraser'));

  // ==========================================
  // SIDEBAR LOGIC (Text Lines)
  // ==========================================
  function initSidebar() {
    addLine("Birinci konuşma balonu çevirisi...");
    addLine("İkinci balon...");
    renderLines();
  }

  function addLine(text = "") {
    lines.push({ id: Date.now() + Math.random(), text });
    renderLines();
  }

  btnAddLine.addEventListener('click', () => addLine(""));

  function renderLines() {
    textLinesContainer.innerHTML = '';
    lines.forEach((line, index) => {
      const el = document.createElement('div');
      el.className = `text-line ${index === currentActiveLineIndex ? 'active' : ''}`;
      
      el.innerHTML = `
        <div class="text-line-header">
          <span>Sıra #${index + 1}</span>
          <span style="cursor:pointer; color:#ef4444;" onclick="removeLine(${index})">Sil</span>
        </div>
        <textarea oninput="updateLine(${index}, this.value)">${line.text}</textarea>
      `;
      
      el.addEventListener('click', (e) => {
        if(e.target.tagName !== 'SPAN') {
          currentActiveLineIndex = index;
          renderLines();
        }
      });
      
      textLinesContainer.appendChild(el);
    });
  }

  window.updateLine = (index, value) => {
    lines[index].text = value;
  };
  
  window.removeLine = (index) => {
    lines.splice(index, 1);
    if(currentActiveLineIndex >= lines.length) currentActiveLineIndex = Math.max(0, lines.length - 1);
    renderLines();
  };

  // ==========================================
  // CANVAS INTERACTION (Eraser & Stamp)
  // ==========================================
  canvas.addEventListener('mousedown', (e) => {
    if (currentTool === 'eraser') {
      isDrawing = true;
      erase(e);
    } else if (currentTool === 'stamp') {
      stampText(e);
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    if (isDrawing && currentTool === 'eraser') erase(e);
  });

  window.addEventListener('mouseup', () => {
    isDrawing = false;
  });

  function erase(e) {
    const rect = canvas.getBoundingClientRect();
    // Calculate scale because canvas might be scaled by CSS
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const size = parseInt(eraserSizeInput.value) || 40;
    
    ctx.fillStyle = '#FFFFFF'; // White brush
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function stampText(e) {
    if (lines.length === 0) return alert('Lütfen sol panele çeviri metni ekleyin!');
    
    const textToStamp = lines[currentActiveLineIndex]?.text;
    if (!textToStamp || textToStamp.trim() === '') return alert('Seçili satır boş!');

    const rect = canvasWrapper.getBoundingClientRect();
    // Get raw position relative to wrapper (not scaled)
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    createOverlayBox(textToStamp, x, y);
    
    // Auto advance to next line
    if (currentActiveLineIndex < lines.length - 1) {
      currentActiveLineIndex++;
      renderLines();
    }
    
    // Switch to select tool so they can move it if needed
    setTool('select');
  }

  // ==========================================
  // TEXT OVERLAYS (DOM based before export)
  // ==========================================
  let activeOverlay = null;

  function createOverlayBox(text, x, y) {
    const box = document.createElement('div');
    box.className = 'text-overlay-box';
    
    // Default size for a bubble
    const w = 200;
    const h = 150;
    
    box.style.left = (x - w/2) + 'px';
    box.style.top = (y - h/2) + 'px';
    box.style.width = w + 'px';
    box.style.height = h + 'px';
    
    const content = document.createElement('div');
    content.className = 'text-overlay-content';
    content.innerText = text;
    
    // Apply settings
    content.style.fontFamily = fontFamilyInput.value;
    content.style.fontSize = fontSizeInput.value + 'px';
    content.style.color = fontColorInput.value;
    content.style.lineHeight = lineHeightInput.value;
    
    const delBtn = document.createElement('div');
    delBtn.className = 'delete-overlay';
    delBtn.innerText = '✕';
    delBtn.onclick = (e) => {
      e.stopPropagation();
      box.remove();
    };
    
    box.appendChild(content);
    box.appendChild(delBtn);
    overlaysContainer.appendChild(box);
    
    makeDraggable(box);
  }

  function makeDraggable(elmnt) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    elmnt.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      if (currentTool !== 'select') return;
      e.preventDefault();
      
      // Highlight active
      document.querySelectorAll('.text-overlay-box').forEach(b => b.classList.remove('selected'));
      elmnt.classList.add('selected');
      activeOverlay = elmnt;
      
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
      elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  // Live update selected overlay if settings change
  [fontFamilyInput, fontSizeInput, fontColorInput, lineHeightInput].forEach(input => {
    input.addEventListener('input', () => {
      if (activeOverlay) {
        const content = activeOverlay.querySelector('.text-overlay-content');
        if (input.id === 'fontFamily') content.style.fontFamily = input.value;
        if (input.id === 'fontSize') content.style.fontSize = input.value + 'px';
        if (input.id === 'fontColor') content.style.color = input.value;
        if (input.id === 'lineHeight') content.style.lineHeight = input.value;
      }
    });
  });

  // ==========================================
  // EXPORT (BAKING HTML TO CANVAS)
  // ==========================================
  btnExport.addEventListener('click', () => {
    if (!baseImage) return alert('Lütfen önce bir resim yükleyin.');
    
    // We need to bake the DOM text into the canvas
    const overlays = document.querySelectorAll('.text-overlay-box');
    
    // Save context state
    ctx.save();
    
    overlays.forEach(box => {
      const content = box.querySelector('.text-overlay-content');
      
      // Calculate true position relative to actual canvas resolution
      const rect = canvasWrapper.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      const left = parseFloat(box.style.left) * scaleX;
      const top = parseFloat(box.style.top) * scaleY;
      const width = parseFloat(box.style.width) * scaleX;
      const height = parseFloat(box.style.height) * scaleY;
      
      // Get styles
      const fontSize = parseFloat(content.style.fontSize) * scaleY; // scale font
      const fontFamily = content.style.fontFamily;
      const color = content.style.color;
      const lineHeight = parseFloat(content.style.lineHeight) * fontSize;
      
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Split text by newlines
      const lines = content.innerText.split('\n');
      
      // For each line, we need to handle word wrapping if it exceeds width.
      // A simple implementation here:
      let drawLines = [];
      lines.forEach(line => {
        const words = line.split(' ');
        let currentLine = '';
        words.forEach(word => {
          const testLine = currentLine + word + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > width && currentLine !== '') {
            drawLines.push(currentLine);
            currentLine = word + ' ';
          } else {
            currentLine = testLine;
          }
        });
        drawLines.push(currentLine);
      });
      
      // Draw centered in the box vertically
      const totalHeight = drawLines.length * lineHeight;
      let startY = top + (height / 2) - (totalHeight / 2) + (lineHeight / 2);
      
      const centerX = left + (width / 2);
      
      drawLines.forEach(line => {
        ctx.fillText(line.trim(), centerX, startY);
        startY += lineHeight;
      });
    });
    
    ctx.restore();
    
    // Download
    const dataURL = canvas.toDataURL('image/jpeg', 0.9);
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `manga_cevirisi_${Date.now()}.jpg`;
    a.click();
    
    // Clear DOM overlays since they are baked
    overlaysContainer.innerHTML = '';
    alert('Sayfa başarıyla işlendi ve indirildi!');
  });
});
