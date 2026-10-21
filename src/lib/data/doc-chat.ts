import type { ChatMessage, FileNode } from "./types";

/**
 * Mock replies for the Data Management document assistant. Answers are grounded only in the
 * attached files. A real implementation sends the prompt and file ids to the FastAPI RAG service.
 */
export function generateDocReply(prompt: string, files: FileNode[]): Omit<ChatMessage, "id" | "createdAt"> {
  const q = prompt.toLowerCase();
  const names = files.map((f) => f.name);
  const reply = { role: "assistant" as const };

  if (!names.length) {
    return { ...reply, content: "Attach at least one document and I'll answer from it. Use the + button to pick a file or upload one." };
  }

  const where = names.length === 1 ? `"${names[0]}"` : `your ${names.length} attached documents`;

  if (/slide|pptx|presentation|deck/.test(q)) {
    const base = names.length === 1 ? names[0].replace(/\.[^.]+$/, "") : "Attached_Documents";
    return {
      ...reply,
      content: `I generated a slide deck from ${where}. It has an overview, the key concepts, and a summary slide per source file.`,
      attachment: { kind: "file", name: `${base.replace(/\s+/g, "_")}_Slides.pptx`, ext: "pptx", content: `# ${base}\n\nGenerated slides from: ${names.join(", ")}` },
      sources: names,
    };
  }
  if (/quiz|question/.test(q)) {
    return {
      ...reply,
      content: `Here are 5 quiz questions based on ${where}:\n\n1. What is the main purpose described in the document?\n2. Which thresholds or limits are defined, and what happens when they are crossed?\n3. Who is responsible for each step of the procedure?\n4. What are the exceptions to the standard rule?\n5. Summarise the key takeaway in one sentence.`,
      sources: names,
    };
  }
  if (/compare|differen/.test(q)) {
    if (names.length < 2) return { ...reply, content: "Comparing needs at least two documents. Attach another file with the + button and ask again.", sources: names };
    return {
      ...reply,
      content: `Comparing ${where}:\n\n${names.map((n) => `• ${n}: covers its own scope, with overlapping definitions and a few differing thresholds.`).join("\n")}\n\nThe main differences are in scope and in the procedures each one defines. Want this as a table?`,
      sources: names,
    };
  }
  if (/key point|highlight|main point/.test(q)) {
    return {
      ...reply,
      content: `Key points from ${where}:\n\n• The purpose and who it applies to\n• The thresholds and limits that trigger action\n• The step-by-step procedure and who owns each step\n• Exceptions and how to request them`,
      sources: names,
    };
  }
  if (/summar/.test(q)) {
    return {
      ...reply,
      content: `Summary of ${where}:\n\n${names.map((n) => `• ${n}: covers the core concepts, worked examples and a practice checklist.`).join("\n")}\n\nI can also make slides, a study guide, or quiz questions from ${names.length === 1 ? "this file" : "these files"}.`,
      sources: names,
    };
  }
  return {
    ...reply,
    content: `Answering only from ${where}. Based on ${names[0]}, the relevant section covers your question in detail, including the thresholds and procedures. Want a short summary or a slide deck?`,
    sources: names.slice(0, 3),
  };
}
