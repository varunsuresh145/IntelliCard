/* ============================================================
   INTELLICARD AI — GLOBAL APP UTILITIES
   ============================================================ */

/**
 * Displays a toast notification in the bottom right corner
 * @param {string} msg - The message to display
 * @param {string} category - The type of toast ('success', 'error', 'info')
 */
function showToast(msg, category = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${category}`;

  let icon = '⚡';
  if (category === 'success') icon = '✓';
  if (category === 'error') icon = '⚠️';
  if (category === 'info') icon = '✦';

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-content">${msg}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;

  container.appendChild(toast);

  // Auto-remove after 4.5 seconds
  setTimeout(() => {
    toast.style.animation = 'toast-out 0.3s forwards';
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 4500);
}

// Add CSS keyframe for toast exit
const style = document.createElement('style');
style.innerHTML = `
@keyframes toast-out {
  from { opacity: 1; transform: translateX(0) scale(1); }
  to   { opacity: 0; transform: translateX(40px) scale(0.9); }
}
`;
document.head.appendChild(style);

/* ─── FILE UPLOAD DRAG & DROP HANDLERS ───────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const uploadForm = document.getElementById('upload-form');

  if (dropZone && fileInput && uploadForm) {
    // Highlight drop area when dragging file over it
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('drag-over');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');
      }, false);
    });

    // Handle dropped files
    dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;

      if (files.length > 0) {
        fileInput.files = files;
        handleFileSelect(fileInput);
      }
    });

    // Make drop zone clickable
    dropZone.addEventListener('click', (e) => {
      // Don't trigger if clicked browse link since it triggers fileInput.click() directly
      if (e.target.tagName !== 'SPAN') {
        fileInput.click();
      }
    });
  }
});

/**
 * Handle document selection and manage the uploading interface
 * @param {HTMLInputElement} input - The file input element
 */
function handleFileSelect(input) {
  const file = input.files[0];
  if (!file) return;

  const dropTitle = document.getElementById('drop-title');
  const dropSub = document.getElementById('drop-sub');
  const progressContainer = document.getElementById('upload-progress');
  const progressLabel = document.getElementById('progress-label');
  const progressBar = document.getElementById('progress-bar');
  const progressPct = document.getElementById('progress-pct');
  const dropIcon = document.getElementById('drop-icon');

  // Validate file extensions
  const allowed = ['pdf', 'docx', 'txt', 'png', 'jpg', 'jpeg'];
  const ext = file.name.split('.').pop().toLowerCase();
  if (!allowed.includes(ext)) {
    showToast('Invalid file format. Upload PDF, DOCX, TXT, or images.', 'error');
    input.value = '';
    return;
  }

  // Update layout to show loading state
  if (dropTitle) dropTitle.innerHTML = `Uploading <strong>${file.name}</strong>...`;
  if (dropSub) dropSub.textContent = 'Please wait while IntelliCard segments and processes topics.';
  if (dropIcon) dropIcon.innerHTML = '🧠';
  if (progressContainer) progressContainer.style.display = 'block';

  // Perform AJAX upload to show progress bar updates
  const formData = new FormData(document.getElementById('upload-form'));
  const xhr = new XMLHttpRequest();

  xhr.open('POST', '/upload', true);

  // Update progress bar
  xhr.upload.addEventListener('progress', (e) => {
    if (e.lengthComputable) {
      const percent = Math.round((e.loaded / e.total) * 100);
      if (progressBar) progressBar.style.width = percent + '%';
      if (progressPct) progressPct.textContent = percent + '%';
      if (progressLabel) progressLabel.textContent = percent < 100 ? 'Uploading file...' : 'AI generating flashcards (may take a moment)...';
    }
  });

  // Upload finished
  xhr.onload = function() {
    if (xhr.status === 200) {
      try {
        const response = JSON.parse(xhr.responseText);
        if (response.success) {
          showToast('Deck generated successfully!', 'success');
          // Redirect to the newly created deck
          window.location.href = `/flashcards?deck=${response.deck_id}`;
        } else {
          showToast(response.error || 'Generation failed.', 'error');
          resetUploadUI();
        }
      } catch (err) {
        showToast('Server returned an invalid response.', 'error');
        resetUploadUI();
      }
    } else {
      showToast('Error uploading file. Please try again.', 'error');
      resetUploadUI();
    }
  };

  xhr.onerror = function() {
    showToast('Connection error occurred.', 'error');
    resetUploadUI();
  };

  xhr.send(formData);
}

function resetUploadUI() {
  const fileInput = document.getElementById('file-input');
  if (fileInput) fileInput.value = '';
  
  const dropTitle = document.getElementById('drop-title');
  const dropSub = document.getElementById('drop-sub');
  const progressContainer = document.getElementById('upload-progress');
  const dropIcon = document.getElementById('drop-icon');

  if (dropTitle) dropTitle.innerHTML = 'Drop your file here, or <span style="color:var(--cyan);cursor:pointer" onclick="document.getElementById(\'file-input\').click()">browse</span>';
  if (dropSub) dropSub.textContent = 'AI will auto-segment topics and generate flashcards instantly';
  if (dropIcon) dropIcon.innerHTML = `
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--cyan)">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  `;
  if (progressContainer) progressContainer.style.display = 'none';
}
