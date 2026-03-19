export const WORKBOOK_V2_EDITORIAL = {
    classes: {
        shell: 'wbv2-shell min-h-screen bg-[#f4f7fb] pb-20 text-[#0f172a] overflow-x-hidden md:pb-0',
        toolbar: 'sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl shadow-[0_8px_24px_rgba(15,23,42,0.06)]',
        toolbarInner: 'max-w-[1280px] mx-auto flex w-full flex-wrap items-start gap-2 px-3 py-3 sm:gap-3 sm:px-5 md:px-8 md:py-4',
        backButton:
            'inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100',
        sidebar:
            'hidden lg:block rounded-2xl border border-slate-200/90 bg-white p-4 lg:sticky lg:top-24 shadow-[0_12px_28px_rgba(15,23,42,0.06)]',
        sidebarTitle: 'text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3',
        bottomNav: 'rounded-2xl border border-slate-200 bg-white p-3 md:p-5 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between',
        bottomNavPrev:
            'inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
        bottomNavNext:
            'inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
        progressPill:
            'workbook-progress-pill rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700',
        savedPill:
            'rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700',
        exportingPill:
            'rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700',
        lockButton:
            'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100',
        saveButton:
            'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50',
        pdfButton:
            'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50',
        htmlButton:
            'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50'
    },
    labels: {
        workbookTag: 'Workbook',
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
