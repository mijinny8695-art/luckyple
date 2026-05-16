'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import { useRef, useState, useCallback } from 'react'

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: (element) => element.getAttribute('style'),
        renderHTML: (attributes) => {
          if (!attributes.style) return {}
          return { style: attributes.style }
        },
      },
    }
  },
})

// fontSize를 TextStyle에 커스텀 attribute로 추가
const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.fontSize || null,
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.fontSize) return {}
          return { style: `font-size: ${attributes.fontSize}` }
        },
      },
    }
  },
})

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '40px', '48px']
const COLORS = ['#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280']

export function RichEditor({
  content,
  onChange,
  minHeight = '200px',
}: {
  content: string
  onChange: (html: string) => void
  minHeight?: string
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [customColor, setCustomColor] = useState('#000000')

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      CustomImage.configure({ inline: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      FontSize,
      Color,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none px-4 py-3 focus:outline-none',
        style: `min-height: ${minHeight}`,
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files
        if (files && files.length > 0) {
          event.preventDefault()
          handleFiles(Array.from(files))
          return true
        }
        return false
      },
      handlePaste: (view, event) => {
        const files = event.clipboardData?.files
        if (files && files.length > 0) {
          event.preventDefault()
          handleFiles(Array.from(files))
          return true
        }
        return false
      },
    },
  })

  const handleFiles = useCallback(async (files: File[]) => {
    if (!editor) return
    const imageFiles = files.filter((f) => f.type.startsWith('image/'))
    if (imageFiles.length === 0) return

    setUploading(true)
    for (const file of imageFiles) {
      try {
        const formData = new FormData()
        formData.set('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const result = await res.json()
        if (result.url) {
          editor.commands.focus('end')
          editor.chain().insertContent('<p></p>').run()
          editor.chain().focus().setImage({ src: result.url } as any).run()
        }
      } catch {}
    }
    editor.chain().focus('end').insertContent('<p></p>').run()
    setUploading(false)
  }, [editor])

  if (!editor) return null

  function setFontSize(size: string) {
    editor!.chain().focus().setMark('textStyle', { fontSize: size }).run()
  }

  function setColor(color: string) {
    editor!.chain().focus().setColor(color).run()
    setShowColorPicker(false)
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-300">
      {/* 툴바 */}
      <div className="flex flex-wrap items-center gap-1 border-b border-zinc-200 bg-zinc-50 p-2">
        <ToolBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>B</ToolBtn>
        <ToolBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>I</ToolBtn>
        <ToolBtn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>S</ToolBtn>

        <div className="mx-1 h-5 w-px bg-zinc-200" />

        <ToolBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</ToolBtn>
        <ToolBtn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</ToolBtn>

        <div className="mx-1 h-5 w-px bg-zinc-200" />

        {/* 정렬 */}
        <ToolBtn active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>좌</ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>중</ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>우</ToolBtn>

        <div className="mx-1 h-5 w-px bg-zinc-200" />

        {/* 글자 크기 */}
        <select
          onChange={(e) => { if (e.target.value) setFontSize(e.target.value); e.target.value = '' }}
          className="rounded border border-zinc-300 bg-white px-1.5 py-1 text-xs text-zinc-700"
          defaultValue=""
        >
          <option value="" disabled>크기</option>
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* 글자 색상 */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="flex items-center gap-1 rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
          >
            <span className="inline-block h-3 w-3 rounded-sm border border-zinc-300" style={{ backgroundColor: editor.getAttributes('textStyle').color || '#000' }} />
            색상
          </button>
          {showColorPicker && (
            <div className="absolute left-0 top-full z-10 mt-1 rounded-lg border border-zinc-200 bg-white p-2 shadow-lg">
              <div className="grid grid-cols-5 gap-1">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="h-6 w-6 rounded border border-zinc-300 hover:scale-110 transition"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="mt-2 flex gap-1">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="h-7 w-7 cursor-pointer rounded border border-zinc-300"
                />
                <button
                  type="button"
                  onClick={() => setColor(customColor)}
                  className="rounded bg-zinc-900 px-2 text-xs text-white hover:bg-zinc-800"
                >
                  적용
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mx-1 h-5 w-px bg-zinc-200" />

        {/* 이미지 */}
        <ToolBtn active={false} onClick={() => fileInputRef.current?.click()}>이미지</ToolBtn>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={async (e) => {
            if (e.target.files) await handleFiles(Array.from(e.target.files))
            if (fileInputRef.current) fileInputRef.current.value = ''
          }}
        />

        {uploading && <span className="ml-2 text-xs text-zinc-500">업로드 중...</span>}
      </div>

      {/* 에디터 */}
      <div className="bg-white">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

function ToolBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`rounded px-2 py-1 text-xs font-medium transition ${active ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-200'}`}
    >
      {children}
    </button>
  )
}
