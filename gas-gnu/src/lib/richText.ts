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

// A word hyphenated across the break ("ener-\ngía") is rejoined whole.
const joinWrapped = (acc: string, line: string) =>
  /[a-záéíóúñ]-$/i.test(acc) && /^[a-záéíóúñ]/.test(line) ? acc.slice(0, -1) + line : `${acc} ${line}`;

const NUMBERED_ITEM = /^(\d+)[.)]\s+(.+)$/;

/**
 * Rebuilds one PDF-wrapped <p>: joins the wrapped lines back into sentences,
 * breaks a paragraph where a line ends a sentence well short of the column
 * width (a paragraph's last line), promotes short unpunctuated lines that
 * follow a finished sentence to headings, and lifts a run of "1. …" / "2. …"
 * lines (a pasted numbered list, its markers flattened to plain text like
 * everything else in the paragraph) into a real <ol>.
 */
function unwrapParagraph(inner: string, headingTag: string): string {
  const lines = inner
    .split(/\s*\n\s*/)
    .map((line) => line.trim())
    .filter(Boolean);
  const typical = median(lines.map((line) => stripTags(line).length));

  const blocks: string[] = [];
  let current: string[] = [];
  let listItems: string[] = [];

  const flush = () => {
    if (!current.length) return;
    blocks.push(`<p>${current.reduce(joinWrapped)}</p>`);
    current = [];
  };
  const flushList = () => {
    if (!listItems.length) return;
    blocks.push(`<ol>${listItems.map((item) => `<li>${item}</li>`).join("")}</ol>`);
    listItems = [];
  };

  lines.forEach((line, index) => {
    const plain = stripTags(line);
    const previous = index > 0 ? stripTags(lines[index - 1]) : "";
    const next = index < lines.length - 1 ? lines[index + 1] : "";

    const numberedMatch = line.match(NUMBERED_ITEM);
    if (numberedMatch && Number(numberedMatch[1]) === listItems.length + 1) {
      flush();
      listItems.push(numberedMatch[2]);
      return;
    }
    if (listItems.length > 0) {
      // Not the next number in sequence: either this item's text wrapped
      // onto another source line (its last line isn't sentence-final yet),
      // or the list is simply over.
      if (!SENTENCE_END.test(stripTags(listItems[listItems.length - 1]))) {
        listItems[listItems.length - 1] = joinWrapped(listItems[listItems.length - 1], line);
        return;
      }
      flushList();
    }

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
  flushList();

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

  // A `</li>` with no `<li>` left open before it is a typo for `</p>` (seen in
  // the wild: a pasted "<p>Item</li>" where the editor's last edit was inside
  // a real list). Left alone, the stray tag would make every later <p> in the
  // same block merge into one, since the next real </p> becomes its close.
  html = html.replace(/<\/li>/gi, (match, offset: number) => {
    const before = html.slice(0, offset);
    const opened = (before.match(/<li[\s>]/gi) ?? []).length;
    const closed = (before.match(/<\/li>/gi) ?? []).length;
    return opened > closed ? match : "</p>";
  });

  // A whole article pasted into a section's body ("<article><header><h1>…
  // <time>…</header><p>…</p>…</article>") carries its own headline/byline —
  // but the section already has those (its `title` prop, the page's own
  // <section>). Left in place, the nesting defeats every "first thing in the
  // body" rule below (the label+headline pairing, the lead-in paragraph),
  // since the actual first element becomes <article> or <header>, not the
  // heading/paragraph those rules look for. <header> is unwrapped wherever it
  // appears; a root <article> wrapping the entire body is unwrapped too —
  // both keep their content, only the wrapper tag goes.
  html = html.replace(/<\/?header(\s[^>]*)?>/gi, "");
  for (let guard = 0; guard < 5; guard++) {
    const unwrapped = html.replace(/^<article(\s[^>]*)?>([\s\S]*)<\/article>\s*$/i, "$2");
    if (unwrapped === html) break;
    html = unwrapped.trim();
  }

  // A body pasted with no HTML at all — not even a wrapping <p> — is the
  // same PDF-wrapped shape the rule below recovers, just missing the tag
  // that rule looks inside of. Recovered the same way, once, up front: the
  // alternative is one continuous run of text with no paragraph breaks at
  // all (newlines collapse in HTML), numbered lines included.
  if (/\n/.test(html) && !/<(p|div|article|section|ul|ol|table|h[1-6])(\s|>)/i.test(html)) {
    html = unwrapParagraph(html, recoveredHeading);
  }

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

  // Another pasted-by-hand shape: a <div> of nothing but short, unpunctuated
  // <p> one-liners — an editor's bullet list typed without a <ul> (e.g. a
  // parts list: "Cilindro de GNV", "Válvula de cilindro", …). Rendered as
  // plain paragraphs it's a cramped, bullet-less wall; promoted to the same
  // checkmark list used elsewhere (ServiceCards.astro's .check-list), as a
  // responsive grid once there are enough items for one to pay off.
  html = html.replace(/<div(\s[^>]*)?>([\s\S]*?)<\/div>/gi, (match, _attrs, inner: string) => {
    const items = [...inner.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi)].map((m) => m[1].trim());
    const leftover = inner.replace(/<p(?:\s[^>]*)?>[\s\S]*?<\/p>/gi, "").replace(/\s+/g, "");
    if (items.length < 4 || leftover.length > 0) return match;
    if (items.some((item) => stripTags(item).length > 60 || SENTENCE_END.test(stripTags(item)))) return match;

    const listClass = items.length >= 6 ? "check-list check-list--grid" : "check-list";
    return `<ul class="${listClass}">${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
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
