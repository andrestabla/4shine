'use client';

import React, { forwardRef, useImperativeHandle } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import clsx from 'clsx';

export interface RichTextEditorHandle {
  insertText(text: string): void;
  getHTML(): string;
}

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  onFocus?: () => void;
}

interface ToolbarButtonProps {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ active, onClick, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={clsx(
        'flex h-7 w-7 items-center justify-center rounded text-sm font-semibold transition-colors',
        active
          ? 'bg-[var(--brand-primary)] text-white'
          : 'text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-ink)]',
      )}
    >
      {children}
    </button>
  );
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, Props>(
  function RichTextEditor({ value, onChange, placeholder = 'Escribe aquí…', className, minHeight = '120px', onFocus }, ref) {
    const editor = useEditor({
      extensions: [StarterKit],
      content: value || '',
      onUpdate({ editor: ed }) {
        const html = ed.getHTML();
        onChange(html === '<p></p>' ? '' : html);
      },
      editorProps: {
        attributes: {
          class: 'outline-none',
          'data-placeholder': placeholder,
        },
        handleDOMEvents: {
          focus: () => { onFocus?.(); return false; },
        },
      },
    });

    useImperativeHandle(ref, () => ({
      insertText(text: string) {
        if (!editor) return;
        editor.chain().focus().insertContent(text).run();
      },
      getHTML() {
        return editor?.getHTML() ?? '';
      },
    }), [editor]);

    // Sync external value resets
    const prevValueRef = React.useRef(value);
    React.useEffect(() => {
      if (!editor) return;
      if (value !== prevValueRef.current && value !== editor.getHTML()) {
        editor.commands.setContent(value || '');
      }
      prevValueRef.current = value;
    }, [value, editor]);

    if (!editor) return null;

    return (
      <div className={clsx('overflow-hidden rounded-[16px] border border-[var(--app-border)] bg-white', className)}>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--app-border)] px-2 py-1.5">
          <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrita">
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Cursiva">
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Tachado">
            <s>S</s>
          </ToolbarButton>

          <span className="mx-1 h-4 w-px bg-[var(--app-border)]" />

          <ToolbarButton active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Título H2">
            H2
          </ToolbarButton>
          <ToolbarButton active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Subtítulo H3">
            H3
          </ToolbarButton>

          <span className="mx-1 h-4 w-px bg-[var(--app-border)]" />

          <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista">
            ≡
          </ToolbarButton>
          <ToolbarButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada">
            1≡
          </ToolbarButton>
          <ToolbarButton active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Cita">
            &quot;
          </ToolbarButton>
          <ToolbarButton active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} title="Código">
            {'<>'}
          </ToolbarButton>

          <span className="mx-1 h-4 w-px bg-[var(--app-border)]" />

          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Deshacer">↩</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Rehacer">↪</ToolbarButton>
        </div>

        {/* Editor area */}
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none px-4 py-3 text-sm text-[var(--app-ink)] focus-within:outline-none [&_.ProseMirror]:min-h-[var(--rte-min-h)] [&_.ProseMirror_p.is-empty::before]:pointer-events-none [&_.ProseMirror_p.is-empty::before]:float-left [&_.ProseMirror_p.is-empty::before]:h-0 [&_.ProseMirror_p.is-empty::before]:text-[var(--app-muted)] [&_.ProseMirror_p.is-empty::before]:content-[attr(data-placeholder)]"
          style={{ '--rte-min-h': minHeight } as React.CSSProperties}
        />
      </div>
    );
  }
);
