"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { languages, getMonacoLanguage } from "@/lib/language-registry";
import {
  CodeIcon,
  TypeIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-[200px] rounded-lg border border-border bg-card/50 overflow-hidden">
      <div className="h-full flex flex-col p-4 gap-2 animate-pulse">
        <div className="h-3 w-3/4 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
        <div className="h-3 w-2/3 rounded bg-muted" />
        <div className="h-3 w-1/3 rounded bg-muted" />
        <div className="flex-1" />
        <div className="h-3 w-1/4 rounded bg-muted" />
      </div>
    </div>
  ),
});

export interface Block {
  id: string;
  type: "text" | "code";
  language?: string;
  content: string;
}

interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  defaultLanguage?: string;
  templates?: Record<string, string>;
  disabled?: boolean;
}

export function BlockEditor({
  blocks,
  onChange,
  defaultLanguage,
  templates,
  disabled = false,
}: BlockEditorProps) {
  const { theme } = useTheme();
  const [showLanguageMenu, setShowLanguageMenu] = useState<string | null>(null);
  const updateBlock = (id: string, content: string) => {
    if (disabled) return;
    const updated = blocks.map((b) =>
      b.id === id ? { ...b, content } : b
    );
    onChange(updated);
  };

  const updateBlockLanguage = (id: string, language: string) => {
    if (disabled) return;
    const updated = blocks.map((b) => {
      if (b.id !== id) return b;
      const newContent = templates?.[language] ?? "";
      // Swap content if it's empty or matches a previous template
      const oldTemplate = templates?.[b.language ?? ""] ?? "";
      const shouldSwap = !b.content || b.content === oldTemplate;
      return { ...b, language, ...(shouldSwap ? { content: newContent } : {}) };
    });
    onChange(updated);
    setShowLanguageMenu(null);
  };

  const addBlock = (type: "text" | "code") => {
    if (disabled) return;
    const newBlock: Block = {
      id: crypto.randomUUID(),
      type,
      ...(type === "code"
        ? { language: defaultLanguage ?? "javascript" }
        : {}),
      content: "",
    };
    onChange([...blocks, newBlock]);
  };

  const removeBlock = (id: string) => {
    if (disabled || blocks.length <= 1) return;
    onChange(blocks.filter((b) => b.id !== id));
  };

  const moveBlock = (id: string, direction: "up" | "down") => {
    if (disabled) return;
    const cur = blocks;
    const idx = cur.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= cur.length) return;
    const newBlocks = [...cur];
    [newBlocks[idx], newBlocks[newIdx]] = [newBlocks[newIdx], newBlocks[idx]];
    onChange(newBlocks);
  };

  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-3">
      {blocks.map((block, idx) => (
        <div key={block.id} className="group relative">
          {/* Block toolbar */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              {block.type === "code" ? (
                <CodeIcon className="size-3.5 text-primary" />
              ) : (
                <TypeIcon className="size-3.5 text-muted-foreground" />
              )}
              <span className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">
                {block.type === "code" ? "Code" : "Text"}
              </span>

              {/* Language selector for code blocks */}
              {block.type === "code" && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setShowLanguageMenu(
                        showLanguageMenu === block.id ? null : block.id
                      )
                    }
                    className="text-[10px] font-mono px-2 py-0.5 rounded border border-border bg-card hover:bg-accent transition-colors"
                  >
                    {languages.find((l) => l.id === block.language)?.label ??
                      block.language ??
                      "Select language"}
                  </button>
                  {showLanguageMenu === block.id && (
                    <div className="absolute z-50 top-full left-0 mt-1 w-44 max-h-48 overflow-auto rounded-md border border-border bg-popover shadow-md py-1">
                      {languages.map((lang) => (
                        <button
                          type="button"
                          key={lang.id}
                          onClick={() =>
                            updateBlockLanguage(block.id, lang.id)
                          }
                          className={`w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors ${
                            block.language === lang.id
                              ? "text-primary font-medium"
                              : "text-foreground"
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Block actions */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => moveBlock(block.id, "up")}
                disabled={idx === 0}
                className="p-1 rounded hover:bg-accent disabled:opacity-30 transition-colors"
              >
                <ChevronUpIcon className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => moveBlock(block.id, "down")}
                disabled={idx === blocks.length - 1}
                className="p-1 rounded hover:bg-accent disabled:opacity-30 transition-colors"
              >
                <ChevronDownIcon className="size-3.5" />
              </button>
              {blocks.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeBlock(block.id)}
                  className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <TrashIcon className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Block content */}
          {block.type === "text" ? (
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, e.target.value)}
              placeholder="Write your analysis..."
              rows={4}
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y min-h-[100px]"
            />
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <MonacoEditor
                height="200px"
                language={getMonacoLanguage(block.language ?? "javascript")}
                value={block.content}
                onChange={(value) => updateBlock(block.id, value ?? "")}
                theme={theme === "dark" ? "vs-dark" : "light"}
                options={{
                  readOnly: disabled,
                  domReadOnly: disabled,
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  tabSize: 2,
                  padding: { top: 12, bottom: 12 },
                  renderLineHighlight: "none",
                  overviewRulerBorder: false,
                  hideCursorInOverviewRuler: true,
                  contextmenu: false,
                }}
              />
            </div>
          )}
        </div>
      ))}

      {/* Add block buttons */}
      <div className="flex items-center gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs h-8"
          onClick={() => addBlock("text")}
        >
          <TypeIcon className="size-3.5 mr-1.5" />
          Add text
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs h-8"
          onClick={() => addBlock("code")}
        >
          <CodeIcon className="size-3.5 mr-1.5" />
          Add code
        </Button>
      </div>
    </fieldset>
  );
}
