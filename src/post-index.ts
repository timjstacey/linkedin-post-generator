/**
 * Write a LinkedIn post URL into the `LinkedIn URL` column of `posts/INDEX.md`.
 *
 * The publish workflow knows the post's date (from the filename), and each post
 * has exactly one row in the index keyed by that date. This fills the trailing
 * `LinkedIn URL` cell of that row, which the research skill appends empty.
 */
export function setLinkedInUrl(indexMarkdown: string, postDate: string, url: string): string {
  const lines = indexMarkdown.split('\n');

  // Find the last data row whose first cell equals the post date. The header
  // ("Date") and separator ("----") rows never match a date, so they are skipped.
  let target = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trimStart().startsWith('|')) continue;
    const cells = line.split('|');
    if (cells.length < 4) continue;
    if (cells[1]?.trim() === postDate) target = i;
  }

  if (target === -1) {
    throw new Error(`No posts/INDEX.md row found for date ${postDate}`);
  }

  // Cells: ['', ' Date ', ' Title ', ' Topic ', ' Archetype ', ' Hashtags ', ' LinkedIn URL ', '']
  // The LinkedIn URL cell is the last content cell (second-to-last split element).
  const cells = lines[target].split('|');
  cells[cells.length - 2] = ` ${url} `;
  lines[target] = cells.join('|');

  return lines.join('\n');
}
