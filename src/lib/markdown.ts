// The small Markdown subset used by local posts: headings, paragraphs, lists,
// tables, code, links, and images. Raw HTML is escaped, not executed as MDX.
function escapeHtml(text: string): string {
    const entities: Record<string, string> = {
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    };
    return text.replace(/[&<>"']/g, (char) => entities[char]);
}

function safeUrl(url: string): boolean {
    return !/[\s\\\u0000-\u001f]/.test(url)
        && (/^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url) || /^#/.test(url));
}

function inline(text: string): string {
    const tokens = /`[^`\n]+`|!?\[[^\]\n]*\]\([^\s)]+\)|\*\*[^*\n]+\*\*|\*[^*\n]+\*/g;
    let html = "";
    let cursor = 0;
    for (const match of text.matchAll(tokens)) {
        html += escapeHtml(text.slice(cursor, match.index));
        const token = match[0];
        const link = token.match(/^(!?)\[([^\]]*)\]\(([^)]+)\)$/);
        if (token.startsWith("`")) {
            html += `<code>${escapeHtml(token.slice(1, -1))}</code>`;
        } else if (link) {
            const [, image, label, url] = link;
            if (!safeUrl(url)) {
                html += escapeHtml(label);
            } else if (image) {
                html += `<img src="${escapeHtml(url)}" alt="${escapeHtml(label)}" loading="lazy" decoding="async" />`;
            } else {
                html += `<a href="${escapeHtml(url)}">${inline(label)}</a>`;
            }
        } else if (token.startsWith("**")) {
            html += `<strong>${escapeHtml(token.slice(2, -2))}</strong>`;
        } else {
            html += `<em>${escapeHtml(token.slice(1, -1))}</em>`;
        }
        cursor = match.index! + token.length;
    }
    return html + escapeHtml(text.slice(cursor));
}

function cells(line: string): string[] {
    return line.trim().replace(/^\|/, "").replace(/\|$/, "")
        .split("|").map((cell) => cell.trim());
}

export function parseMarkdown(text: string): string {
    const lines = text.replace(/\r\n/g, "\n").split("\n");
    const blocks: string[] = [];
    const listItem = /^\s*(?:([-+*])|\d+\.)\s+(.+)$/;
    const isTable = (i: number) => lines[i]?.includes("|")
        && i + 1 < lines.length && cells(lines[i + 1]).every((cell) => /^:?-{3,}:?$/.test(cell))
        && cells(lines[i]).length === cells(lines[i + 1]).length;
    const startsBlock = (i: number) => /^(#{1,6}\s|```)/.test(lines[i])
        || listItem.test(lines[i]) || isTable(i);

    let i = 0;
    while (i < lines.length) {
        if (!lines[i].trim()) { i++; continue; }

        if (lines[i].startsWith("```")) {
            const code: string[] = [];
            i++;
            while (i < lines.length && !lines[i].startsWith("```")) code.push(lines[i++]);
            if (i < lines.length) i++;
            blocks.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
            continue;
        }

        const heading = lines[i].match(/^(#{1,6})\s+(.+)$/);
        if (heading) {
            const level = Math.max(2, heading[1].length);
            blocks.push(`<h${level}>${inline(heading[2])}</h${level}>`);
            i++;
            continue;
        }

        if (isTable(i)) {
            const headers = cells(lines[i]);
            const alignment = cells(lines[i + 1]).map((cell) => cell.endsWith(":")
                ? (cell.startsWith(":") ? "center" : "right") : "left");
            const row = (values: string[], tag: "th" | "td") => "<tr>" + headers.map((_, j) =>
                `<${tag}${tag === "th" ? ' scope="col"' : ""} style="text-align:${alignment[j]}">${inline(values[j] ?? "")}</${tag}>`
            ).join("") + "</tr>";
            let table = `<table><thead>${row(headers, "th")}</thead><tbody>`;
            i += 2;
            while (i < lines.length && lines[i].trim() && lines[i].includes("|")) {
                table += row(cells(lines[i++]), "td");
            }
            table += "</tbody></table>";
            blocks.push(`<div class="blog-table" role="region" aria-label="Results table" tabindex="0">${table}</div>`);
            continue;
        }

        const first = lines[i].match(listItem);
        if (first) {
            const ordered = !first[1];
            const tag = ordered ? "ol" : "ul";
            const start = ordered ? ` start="${parseInt(lines[i].trim(), 10)}"` : "";
            const items: string[] = [];
            while (i < lines.length) {
                const item = lines[i].match(listItem);
                if (!item) break;
                if (!item[1] !== ordered) break;
                items.push(`<li>${inline(item[2])}</li>`);
                i++;
            }
            blocks.push(`<${tag}${start}>${items.join("")}</${tag}>`);
            continue;
        }

        const paragraph = [lines[i++].trim()];
        while (i < lines.length && lines[i].trim() && !startsBlock(i)) {
            paragraph.push(lines[i++].trim());
        }
        blocks.push(`<p>${inline(paragraph.join(" "))}</p>`);
    }
    return blocks.join("\n");
}
