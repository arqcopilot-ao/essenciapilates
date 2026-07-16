import { cache } from '../core/cache.js';

const DATA_KEYS = ['pacientes', 'pagamentos', 'agendamentos', 'presencas', 'historicos', 'notasFiscais', 'usuarios'];

export const DataManager = {
  exportAll() {
    const data = {};
    for (const key of DATA_KEYS) {
      data[key] = cache.getOr(key, []);
    }
    data._exportedAt = new Date().toISOString();
    data._version = '2.0.0';

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `essencia-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return true;
  },

  importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (!data._version) {
            reject(new Error('Arquivo de backup inválido.'));
            return;
          }
          for (const key of DATA_KEYS) {
            if (data[key] && Array.isArray(data[key])) {
              cache.set(key, data[key]);
            }
          }
          resolve({ success: true, keys: DATA_KEYS.filter(k => data[k]) });
        } catch {
          reject(new Error('Erro ao ler o arquivo. Formato inválido.'));
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));
      reader.readAsText(file);
    });
  },

  bindExportButton() {
    const btn = document.getElementById('btn-export-data');
    if (btn) {
      btn.addEventListener('click', () => {
        this.exportAll();
        showToast('Dados exportados com sucesso!');
      });
    }
  },

  bindImportButton() {
    const btn = document.getElementById('btn-import-data');
    const input = document.getElementById('import-file-input');
    if (btn && input) {
      btn.addEventListener('click', () => input.click());
      input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          await this.importData(file);
          showToast('Dados importados com sucesso! Recarregando...');
          setTimeout(() => location.reload(), 1500);
        } catch (err) {
          showToast(err.message, 'error');
        }
        input.value = '';
      });
    }
  }
};

function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
