/* ============================================
   UTILS - Shared utilities
   ============================================ */
const Utils = {
    // Storage
    save(key, data) {
        localStorage.setItem('essencia_' + key, JSON.stringify(data));
    },
    load(key) {
        const d = localStorage.getItem('essencia_' + key);
        return d ? JSON.parse(d) : null;
    },
    remove(key) {
        localStorage.removeItem('essencia_' + key);
    },

    // Generate unique ID
    id() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    },

    // Format currency BRL
    currency(val) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
    },

    // Format date
    date(d) {
        if (!d) return '-';
        return new Date(d).toLocaleDateString('pt-BR');
    },

    // Format datetime
    datetime(d) {
        if (!d) return '-';
        return new Date(d).toLocaleDateString('pt-BR') + ' ' + new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    },

    // Format phone
    phone(p) {
        if (!p) return '-';
        const n = p.replace(/\D/g, '');
        if (n.length === 11) return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`;
        if (n.length === 10) return `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`;
        return p;
    },

    // Format CPF
    cpf(c) {
        if (!c) return '-';
        const n = c.replace(/\D/g, '');
        return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    },

    // Format CNPJ
    cnpj(c) {
        if (!c) return '-';
        const n = c.replace(/\D/g, '');
        return n.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    },

    // Toast notification
    toast(msg, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const t = document.createElement('div');
        t.className = 'toast ' + type;
        t.textContent = msg;
        container.appendChild(t);
        setTimeout(() => { t.remove(); }, 3000);
    },

    // Confirm dialog
    confirm(msg) {
        return window.confirm(msg);
    },

    // Search/filter helper
    matchSearch(item, query) {
        if (!query) return true;
        const q = query.toLowerCase();
        return Object.values(item).some(v =>
            String(v).toLowerCase().includes(q)
        );
    },

    // Sort by key
    sortBy(arr, key, desc = false) {
        return [...arr].sort((a, b) => {
            if (a[key] < b[key]) return desc ? 1 : -1;
            if (a[key] > b[key]) return desc ? -1 : 1;
            return 0;
        });
    },

    // Get today as YYYY-MM-DD
    today() {
        return new Date().toISOString().split('T')[0];
    },

    // Add months to date
    addMonths(date, months) {
        const d = new Date(date);
        d.setMonth(d.getMonth() + months);
        return d.toISOString().split('T')[0];
    },

    // Days until date
    daysUntil(date) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const target = new Date(date);
        target.setHours(0, 0, 0, 0);
        return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    }
};
