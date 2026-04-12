export interface LanguageEntry {
  id: string;
  label: string;
  monacoId: string;
  category: "programming" | "sql" | "analytics";
}

export const languages: LanguageEntry[] = [
  // Programming
  { id: "javascript", label: "JavaScript", monacoId: "javascript", category: "programming" },
  { id: "typescript", label: "TypeScript", monacoId: "typescript", category: "programming" },
  { id: "python", label: "Python", monacoId: "python", category: "programming" },
  { id: "java", label: "Java", monacoId: "java", category: "programming" },
  { id: "go", label: "Go", monacoId: "go", category: "programming" },
  { id: "csharp", label: "C#", monacoId: "csharp", category: "programming" },
  { id: "c_cpp", label: "C/C++", monacoId: "cpp", category: "programming" },
  { id: "rust", label: "Rust", monacoId: "rust", category: "programming" },
  { id: "kotlin", label: "Kotlin", monacoId: "kotlin", category: "programming" },
  { id: "shell", label: "Shell", monacoId: "shell", category: "programming" },

  // SQL
  { id: "sql", label: "SQL", monacoId: "sql", category: "sql" },
  { id: "pgsql", label: "PostgreSQL", monacoId: "pgsql", category: "sql" },
  { id: "mysql", label: "MySQL", monacoId: "mysql", category: "sql" },

  // Analytics / Other
  { id: "json", label: "JSON", monacoId: "json", category: "analytics" },
  { id: "yaml", label: "YAML", monacoId: "yaml", category: "analytics" },
  { id: "markdown", label: "Markdown", monacoId: "markdown", category: "analytics" },
];

export function getLanguageById(id: string): LanguageEntry | undefined {
  return languages.find((l) => l.id === id);
}

export function getMonacoLanguage(id: string): string {
  return getLanguageById(id)?.monacoId ?? "plaintext";
}

export function getLanguagesByCategory(category: LanguageEntry["category"]): LanguageEntry[] {
  return languages.filter((l) => l.category === category);
}
