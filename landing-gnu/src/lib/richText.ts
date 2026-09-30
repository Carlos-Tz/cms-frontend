// Build-time clean-up of CMS-authored HTML (rich_text bodies, blog posts).
//
// The admin's editor stores whatever is pasted into it, and most long copy on
// this site was pasted from PDFs: a whole article arrives as ONE <p> with a
// hard line break every ~85 characters and its subheadings as bare short
// lines. A browser collapses those breaks, so the article renders as a single
// wall of text. This module rebuilds that structure (paragraphs and headings)
// and normalizes a few other editor habits, without touching well-formed HTML.
//
// String-based on purpose: it runs in the static build, where there is no DOM,
// and the CMS markup is simple (p, h1–h3, strong, ul/li, section/article).

export type RichTextHeading = { id: string; text: string };

export type RichTextResult = {
  html: string;
  // h2 headings with the ids added to them, for a table of contents.
  headings: RichTextHeading[];
  words: number;
};

type Options = {
  // Tag for headings recovered from pasted text: h2 in a blog post (the post
  // title is the h1), h3 inside a rich_text section (its title is the h2).
  recoveredHeading?: "h2" | "h3";
  // Add ids to h2s and collect them (blog posts).
  collectHeadings?: boolean;
};

const SENTENCE_END = /[.!?:;]["”»')]?$/;
const STARTS_UPPER = /^(<[^>]+>)*[¿¡"“«(]?[A-ZÁÉÍÓÚÜÑ0-9]/;

const stripTags = (html: string) => html.replace(/<[^>]+>/g, "");

const slugify = (text: string) =>
  stripTags(text)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
};

/**
 * Rebuilds one PDF-wrapped <p>: joins the wrapped lines back into sentences,
 * breaks a paragraph where a line ends a sentence well short of the column
 * width (a paragraph's last line), and promotes short unpunctuated lines that
 * follow a finished sentence to headings.
 */
function unwrapParagraph(inner: string, headingTag: string): string {
  const lines = inner
    .split(/\s*\n\s*/)
    .map((line) => line.trim())
    .filter(Boolean);
  const typical = median(lines.map((line) => stripTags(line).length));

  const blocks: string[] = [];
  let current: string[] = [];
  const flush = () => {
    if (!current.length) return;
    const text = current.reduce((acc, line) =>
      // A word hyphenated across the break ("ener-\ngía") is rejoined whole.
      /[a-záéíóúñ]-$/i.test(acc) && /^[a-záéíóúñ]/.test(line) ? acc.slice(0, -1) + line : `${acc} ${line}`,
    );
    blocks.push(`<p>${text}</p>`);
    current = [];
  };

  lines.forEach((line, index) => {
    const plain = stripTags(line);
    const previous = index > 0 ? stripTags(lines[index - 1]) : "";
    const next = index < lines.length - 1 ? lines[index + 1] : "";
    // A heading sits between a finished sentence and a new one: the line
    // before ends in punctuation and the line after starts with a capital.
    // A wrapped paragraph line, by contrast, runs on mid-sentence into a
    // lowercase word ("…más limpias / disponibles actualmente…").
    const isHeading =
      index > 0 &&
      next !== "" &&
      plain.length <= 90 &&
      plain.length < typical * 0.95 &&
      !SENTENCE_END.test(plain) &&
      !/[,\-–]$/.test(plain) &&
      STARTS_UPPER.test(line) &&
      STARTS_UPPER.test(next) &&
      SENTENCE_END.test(previous);

    if (isHeading) {
      flush();
      blocks.push(`<${headingTag}>${line}</${headingTag}>`);
      return;
    }

    current.push(line);
    if (SENTENCE_END.test(plain) && plain.length < typical * 0.8) flush();
  });
  flush();

  return blocks.join("\n");
}

export function normalizeRichText(input: string | null | undefined, options: Options = {}): RichTextResult {
  const { recoveredHeading = "h3", collectHeadings = false } = options;
  let html = (input ?? "").trim();

  // Leading/trailing <br>s and empty paragraphs are editor residue that only
  // push the copy away from its title.
  html = html
    .replace(/^(\s*<br\s*\/?>\s*)+/i, "")
    .replace(/(\s*<br\s*\/?>\s*)+$/i, "")
    .replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "");

  // A PDF-wrapped paragraph carries several hard line breaks; normal ones
  // (one per source-code line at most) are left alone.
  html = html.replace(/<p>([\s\S]*?)<\/p>/gi, (match, inner: string) =>
    (inner.match(/\n/g)?.length ?? 0) >= 3 ? unwrapParagraph(inner, recoveredHeading) : match,
  );

  // The page (or post) already has its h1; a second one in the body would
  // break the document outline, so it becomes a section heading.
  html = html.replace(/<(\/?)h1(\s|>)/gi, "<$1h2$2");

  // "Nuestra historia" pattern: a <section> whose h3s are all years is a
  // timeline. Marked explicitly so other <section>s keep plain prose styling.
  html = html.replace(/<section(\s[^>]*)?>([\s\S]*?)<\/section>/gi, (match, attrs = "", inner: string) => {
    const h3s = [...inner.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)].map((m) => stripTags(m[1]).trim());
    const isTimeline = h3s.length >= 2 && h3s.every((text) => /^\d{4}$/.test(text));
    return isTimeline ? `<section class="prose-timeline"${attrs}>${inner}</section>` : match;
  });

  // Links leaving the site open in a new tab, safely; images load lazily.
  html = html
    .replace(/<a\s+([^>]*href="https?:\/\/[^"]+"[^>]*)>/gi, (match, attrs: string) =>
      /target=/.test(attrs) ? match : `<a ${attrs} target="_blank" rel="noopener noreferrer">`,
    )
    .replace(/<img(?![^>]*\sloading=)/gi, '<img loading="lazy"')
    // Wide tables scroll inside their own box instead of the page.
    .replace(/<table/gi, '<div class="prose-table"><table')
    .replace(/<\/table>/gi, "</table></div>");

  const headings: RichTextHeading[] = [];
  if (collectHeadings) {
    const used = new Set<string>();
    html = html.replace(/<h2(\s[^>]*)?>([\s\S]*?)<\/h2>/gi, (match, attrs = "", inner: string) => {
      if (/\sid=/.test(attrs)) return match;
      let id = slugify(inner) || "seccion";
      for (let n = 2; used.has(id); n++) id = `${slugify(inner)}-${n}`;
      used.add(id);
      headings.push({ id, text: stripTags(inner).trim() });
      return `<h2 id="${id}"${attrs}>${inner}</h2>`;
    });
  }

  const words = stripTags(html).split(/\s+/).filter(Boolean).length;
  return { html, headings, words };
}

/** Minutes to read at ~200 words per minute, never less than one. */
export const readingMinutes = (words: number) => Math.max(1, Math.round(words / 200));
