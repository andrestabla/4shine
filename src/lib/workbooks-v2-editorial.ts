export const WORKBOOK_V2_EDITORIAL = {
    classes: {
        shell: 'wbv2-shell min-h-screen bg-[#f4f7fb] text-[#0f172a] overflow-x-hidden',
        toolbar: 'sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl shadow-[0_8px_24px_rgba(15,23,42,0.06)]',
        toolbarInner: 'max-w-[1280px] mx-auto w-full px-3 sm:px-5 md:px-8 py-3 md:py-4 flex flex-wrap items-center gap-2 sm:gap-3',
        backButton:
            'inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold tracking-wide hover:bg-slate-100 transition-colors',
        sidebar:
            'hidden lg:block rounded-2xl border border-slate-200/90 bg-white p-4 lg:sticky lg:top-24 shadow-[0_12px_28px_rgba(15,23,42,0.06)]',
        sidebarTitle: 'text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3',
        bottomNav: 'rounded-2xl border border-slate-200 bg-white p-3 md:p-5 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between',
        bottomNavPrev:
            'inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
        bottomNavNext:
            'inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
        progressPill:
            'rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-[11px] font-semibold text-blue-700',
        savedPill:
            'rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700',
        exportingPill:
            'rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700',
        lockButton:
            'inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors',
        saveButton:
            'inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        pdfButton:
            'inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-3 py-2 text-xs font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        htmlButton:
            'inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
    },
    labels: {
        workbookTag: 'Workbook v2',
        index: 'Índice',
        navigation: 'Navegación',
        back: 'Atrás',
        next: 'Adelante',
        fieldsEditable: 'Campos editables',
        fieldsLocked: 'Campos bloqueados',
        pdfLoading: 'Preparando PDF completo...',
        htmlLoading: 'Preparando HTML completo...',
        pdfDownload: 'Descargar PDF (WB completo)',
        htmlDownload: 'Descargar HTML (WB completo)',
        exportingAll: 'Preparando exportación completa...'
    }
} as const
