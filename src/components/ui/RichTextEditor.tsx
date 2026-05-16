'use client';

import React, { forwardRef, useImperativeHandle, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
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

function ToolbarButton({
  active,
  onClick,
  title,
  children,
  disabled,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={clsx(
        'flex h-7 min-w-[28px] items-center justify-center rounded px-1 text-sm font-semibold transition-colors',
        active
          ? 'bg-[var(--brand-primary)] text-white'
          : disabled
          ? 'opacity-30 cursor-default text-[var(--app-muted)]'
          : 'text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-ink)]',
      )}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="mx-0.5 h-4 w-px bg-[var(--app-border)]" />;
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, Props>(
  function RichTextEditor({ value, onChange, placeholder = 'Escribe aquí…', className, minHeight = '120px', onFocus }, ref) {
    const editor = useEditor({
      extensions: [
        StarterKit,
        Underline,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
        }),
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
      ],
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

    const handleLinkToggle = useCallback(() => {
      if (!editor) return;
      if (editor.isActive('link')) {
        editor.chain().focus().unsetLink().run();
        return;
      }
      const selection = editor.state.selection;
      const hasSelection = !selection.empty;
      // eslint-disable-next-line no-alert
      const url = window.prompt('URL del enlace:', 'https://');
      if (!url || url === 'https://') return;
      if (hasSelection) {
        editor.chain().focus().setLink({ href: url }).run();
      } else {
        editor.chain().focus().insertContent(`<a href="${url}">${url}</a>`).run();
      }
    }, [editor]);

    if (!editor) return null;

    return (
      <div className={clsx('overflow-hidden rounded-[16px] border border-[var(--app-border)] bg-white', className)}>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--app-border)] px-2 py-1.5">
          {/* Text formatting */}
          <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrita (Ctrl+B)">
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Cursiva (Ctrl+I)">
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Subrayado (Ctrl+U)">
            <span className="underline">U</span>
          </ToolbarButton>
          <ToolbarButton active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Tachado">
            <s>S</s>
          </ToolbarButton>

          <Sep />

          {/* Headings */}
          <ToolbarButton active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Título H2">
            H2
          </ToolbarButton>
          <ToolbarButton active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Subtítulo H3">
            H3
          </ToolbarButton>

          <Sep />

          {/* Alignment */}
          <ToolbarButton active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Alinear izquierda">
            ◁
          </ToolbarButton>
          <ToolbarButton active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Centrar">
            ◈
          </ToolbarButton>
          <ToolbarButton active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Alinear derecha">
            ▷
          </ToolbarButton>

          <Sep />

          {/* Lists & blocks */}
          <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista con viñetas">
            ≡
          </ToolbarButton>
          <ToolbarButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada">
            1≡
          </ToolbarButton>
          <ToolbarButton active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Cita">
            &quot;
          </ToolbarButton>

          <Sep />

          {/* Link */}
          <ToolbarButton active={editor.isActive('link')} onClick={handleLinkToggle} title={editor.isActive('link') ? 'Quitar enlace' : 'Insertar enlace'}>
            🔗
          </ToolbarButton>

          <Sep />

          {/* History */}
          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Deshacer (Ctrl+Z)" disabled={!editor.can().undo()}>↩</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Rehacer (Ctrl+Y)" disabled={!editor.can().redo()}>↪</ToolbarButton>
        </div>

        {/* Editor area */}
        <EditorContent
          editor={editor}
          className={clsx(
            'prose prose-sm max-w-none px-4 py-3 text-sm text-[var(--app-ink)] focus-within:outline-none',
            '[&_.ProseMirror]:min-h-[var(--rte-min-h)]',
            '[&_.ProseMirror_a]:text-[var(--brand-primary)] [&_.ProseMirror_a]:underline [&_.ProseMirror_a]:cursor-pointer',
            '[&_.ProseMirror_p.is-empty::before]:pointer-events-none [&_.ProseMirror_p.is-empty::before]:float-left [&_.ProseMirror_p.is-empty::before]:h-0 [&_.ProseMirror_p.is-empty::before]:text-[var(--app-muted)] [&_.ProseMirror_p.is-empty::before]:content-[attr(data-placeholder)]',
          )}
          style={{ '--rte-min-h': minHeight } as React.CSSProperties}
        />
      </div>
    );
  }
);
