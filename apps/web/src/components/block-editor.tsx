"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
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
    <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground border border-border rounded-lg bg-card/50">
      Loading editor...
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
}

export function BlockEditor({
  blocks,
  onChange,
  defaultLanguage,
}: BlockEditorProps) {
  const [showLanguageMenu, setShowLanguageMenu] = useState<string | null>(null);
  // Use a ref to always have the latest blocks for callbacks
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const updateBlock = useCallback((id: string, content: string) => {
    const updated = blocksRef.current.map((b) =>
      b.id === id ? { ...b, content } : b
    );
    onChangeRef.current(updated);
  }, []);

  const updateBlockLanguage = useCallback((id: string, language: string) => {
    const updated = blocksRef.current.map((b) =>
      b.id === id ? { ...b, language } : b
    );
    onChangeRef.current(updated);
    setShowLanguageMenu(null);
  }, []);

  const addBlock = useCallback(
    (type: "text" | "code") => {
      const newBlock: Block = {
        id: crypto.randomUUID(),
        type,
        ...(type === "code"
          ? { language: defaultLanguage ?? "javascript" }
          : {}),
        content: "",
      };
      onChangeRef.current([...blocksRef.current, newBlock]);
    },
    [defaultLanguage]
  );

  const removeBlock = useCallback((id: string) => {
    if (blocksRef.current.length <= 1) return;
    onChangeRef.current(blocksRef.current.filter((b) => b.id !== id));
  }, []);

  const moveBlock = useCallback((id: string, direction: "up" | "down") => {
    const cur = blocksRef.current;
    const idx = cur.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= cur.length) return;
    const newBlocks = [...cur];
    [newBlocks[idx], newBlocks[newIdx]] = [newBlocks[newIdx], newBlocks[idx]];
    onChangeRef.current(newBlocks);
  }, []);

  return (
    <div className="space-y-3">
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
                onClick={() => moveBlock(block.id, "up")}
                disabled={idx === 0}
                className="p-1 rounded hover:bg-accent disabled:opacity-30 transition-colors"
              >
                <ChevronUpIcon className="size-3.5" />
              </button>
              <button
                onClick={() => moveBlock(block.id, "down")}
                disabled={idx === blocks.length - 1}
                className="p-1 rounded hover:bg-accent disabled:opacity-30 transition-colors"
              >
                <ChevronDownIcon className="size-3.5" />
              </button>
              {blocks.length > 1 && (
                <button
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
                theme="vs-dark"
                options={{
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
    </div>
  );
}
