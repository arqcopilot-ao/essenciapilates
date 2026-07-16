import { undoManager } from '../core/undo.js';

export function initShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl+Z / Cmd+Z → Undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      if (undoManager.canUndo) {
        undoManager.undo();
        showToast('Ação desfeita', 'warning');
      }
    }
    // Ctrl+Shift+Z / Cmd+Shift+Z / Ctrl+Y → Redo
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      if (undoManager.canRedo) {
        undoManager.redo();
        showToast('Ação refeita');
      }
    }
    // Escape → Close active modal
    if (e.key === 'Escape') {
      const active = document.querySelector('.modal-overlay.active');
      if (active) {
        active.classList.remove('active');
      }
    }
  });
}

function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
