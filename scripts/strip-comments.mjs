import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
const root = path.resolve(process.cwd());
const skipDirs = new Set(["node_modules", ".next", ".git", "dist", "build", "out", ".turbo"]);
const textExtensions = new Set([
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".cts",
    ".mts",
    ".d.ts",
    ".css"
]);
function isSkipDir(dirPath) {
    const base = path.basename(dirPath);
    return skipDirs.has(base);
}
function listFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];
    for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
            if (isSkipDir(full))
                continue;
            files.push(...listFiles(full));
            continue;
        }
        if (!e.isFile())
            continue;
        const ext = e.name.endsWith(".d.ts") ? ".d.ts" : path.extname(e.name);
        if (textExtensions.has(ext))
            files.push(full);
    }
    return files;
}
function getScriptKind(filePath) {
    if (filePath.endsWith(".tsx"))
        return ts.ScriptKind.TSX;
    if (filePath.endsWith(".ts") || filePath.endsWith(".d.ts") || filePath.endsWith(".cts") || filePath.endsWith(".mts")) {
        return ts.ScriptKind.TS;
    }
    if (filePath.endsWith(".jsx"))
        return ts.ScriptKind.JSX;
    return ts.ScriptKind.JS;
}
function extractLeadingDirectives(text) {
    const lines = text.split(/\r?\n/);
    const keep = [];
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === "") {
            keep.push(line);
            continue;
        }
        if (/^\/\/\/\s*<reference\b/i.test(trimmed)) {
            keep.push(line);
            continue;
        }
        if (/^\/\/\s*@ts-(ignore|nocheck|expect-error)\b/i.test(trimmed)) {
            keep.push(line);
            continue;
        }
        if (/^\/\/\s*eslint-disable\b/i.test(trimmed)) {
            keep.push(line);
            continue;
        }
        break;
    }
    return keep.join("\n").replace(/\n+$/, "\n");
}
function stripTsLike(text, filePath) {
    const kind = getScriptKind(filePath);
    const sourceFile = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, false, kind);
    const printer = ts.createPrinter({ removeComments: true, newLine: ts.NewLineKind.LineFeed });
    const printed = printer.printFile(sourceFile);
    const directives = extractLeadingDirectives(text);
    const body = printed.replace(/^\uFEFF?/, "").replace(/\r\n/g, "\n");
    const merged = directives ? directives + body.replace(/^\s*\n/, "") : body;
    return merged;
}
function stripCss(text) {
    return text.replace(/\/\*[\s\S]*?\*\//g, "");
}
function normalizeEol(original, next) {
    const wantsCrlf = /\r\n/.test(original);
    if (!wantsCrlf)
        return next;
    return next.replace(/\n/g, "\r\n");
}
function main() {
    const files = listFiles(root);
    let changed = 0;
    for (const f of files) {
        const original = fs.readFileSync(f, "utf8");
        const ext = f.endsWith(".d.ts") ? ".d.ts" : path.extname(f);
        let next = original;
        if (ext === ".css") {
            next = stripCss(original);
        }
        else {
            next = stripTsLike(original, f);
        }
        next = next.replace(/\s+$/g, match => (match.includes("\n") ? "\n" : ""));
        next = normalizeEol(original, next);
        if (next !== original) {
            fs.writeFileSync(f, next, "utf8");
            changed++;
        }
    }
    process.stdout.write(`Stripped comments in ${changed} file(s).\n`);
}
main();
