# Obsidian Companion Skill

## Description

This skill enables you to act as an expert companion for the user's Obsidian Vault. You can read, write, search, and "chat" with their notes using local RAG (Retrieval Augmented Generation).

## Capabilities

- **Read Notes:** Access the raw markdown of any note.
- **Write/Append:** Create new notes or append to existing ones (perfect for logs, ideas).
- **Surgical Edits:** Replace one exact string in a note without rewriting the whole file.
- **Daily Notes:** Quickly access or create today's daily journal entry.
- **Search:** Find notes by keyword or filename.
- **Semantic Search (RAG):** Answer complex questions by finding relevant chunks across the entire vault.
- **Indexing:** Build a local vector index of the vault to enable RAG.
- **Link Audits:** Find broken wikilinks before they rot the graph.

## Workflow Guidelines

### 1. Initialization

- **Check Vault Path:** Before calling any tool, ensure you know the `vault_path`. If it's not provided in the current context or environment (`OBSIDIAN_VAULT_PATH`), ask the user: "Please provide the absolute path to your Obsidian Vault."
- **First Time RAG:** If the user asks a semantic question (e.g., "Summarize my thoughts on AI"), try `obsidian_rag_query`. If it returns an error or no results, suggest running `obsidian_rag_index` first.

### 2. Retrieval Strategy

- **Specific Note:** If the user asks for a specific file (e.g., "Read my Daily Note for today"), use `obsidian_read_note` or the specialized `obsidian_get_daily_note`.
- **Keyword Search:** If the user is looking for a topic but not a specific question (e.g., "Find notes about 'cooking'"), use `obsidian_search_notes`.
- **Complex Q&A:** For questions requiring synthesis (e.g., "What have I learned about React this month?"), use `obsidian_rag_query`.

### 3. Writing Strategy

- **Quick Capture:** If the user says "Log this" or "Remember that...", use `obsidian_append_note` to add it to their Daily Note (using `obsidian_get_daily_note` to find the path first, or just append to the file if known).
- **New Ideas:** Use `obsidian_create_note` for substantial new topics.
- **Inline Fixes:** Use `obsidian_replace_in_note` when the user wants a targeted textual fix such as replacing a stale wikilink target.
- **Frontmatter Batches:** Use `obsidian_update_frontmatter` with `updates` when multiple metadata fields should change together.

### 4. Context Management

- **Links:** When reading a note, pay attention to `[[Wikilinks]]`. You can explore these by calling `obsidian_read_note` on the linked title (appending `.md` if needed).
- **Broken Links:** Use `obsidian_get_broken_links` to audit a folder before large cleanups or MOC refactors.
- **Frontmatter:** Respect YAML frontmatter (tags, aliases) for context.

## Example Interactions

**User:** "What did I work on last week?"
**Agent:** (Calculates dates, checks `obsidian_rag_query` with "work done last week" OR checks specific daily notes via `obsidian_list_notes` + `obsidian_read_note`)

**User:** "Log that I finished the API integration."
**Agent:** (Gets today's date) `obsidian_append_note(file_path="Daily Notes/2024-05-21.md", content="- Finished API integration")`

**User:** "Index my vault."
**Agent:** `obsidian_rag_index(vault_path="/Users/me/Vault")`

**User:** "Find the recipe for lasagna."
**Agent:** `obsidian_search_notes(query="lasagna", vault_path="/Users/me/Vault")`
