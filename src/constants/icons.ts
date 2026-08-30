import * as path from 'path';
import * as fs from 'fs';
import { EXT_TO_LANG, inferLanguageFromPath, displayName, getLanguageDisplayName } from './languages';

// Material Icon Theme SVG loader & color resolution

let iconsDir: string = '';
let manifest: {
    fileNames: Record<string, string>;
    fileExtensions: Record<string, string>;
    languageIds: Record<string, string>;
} | null = null;

function initMaterialIconTheme() {
    if (iconsDir && manifest) return;
    try {
        const pkgPath = require.resolve('material-icon-theme/package.json');
        const baseDir = path.dirname(pkgPath);
        iconsDir = path.join(baseDir, 'icons');
        const manifestPath = path.join(baseDir, 'dist', 'material-icons.json');
        if (fs.existsSync(manifestPath)) {
            manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        }
    } catch {
        iconsDir = path.join(__dirname, '..', 'node_modules', 'material-icon-theme', 'icons');
    }
}

// Language to Material icon mapping
const LANG_TO_MATERIAL_ICON: Record<string, string> = {
    typescript:       'typescript',
    typescriptreact:  'react_ts',
    javascript:       'javascript',
    javascriptreact:  'react',
    react:            'react',
    python:           'python',
    html:             'html',
    css:              'css',
    scss:             'sass',
    sass:             'sass',
    less:             'less',
    rust:             'rust',
    go:               'go',
    ruby:             'ruby',
    php:              'php',
    swift:            'swift',
    kotlin:           'kotlin',
    dart:             'dart',
    vue:              'vue',
    svelte:           'svelte',
    astro:            'astro',
    java:             'java',
    'c++':            'cpp',
    cplusplus:        'cpp',
    cpp:              'cpp',
    c:                'c',
    csharp:           'csharp',
    'c#':             'csharp',
    fsharp:           'fsharp',
    'f#':             'fsharp',
    zig:              'zig',
    elixir:           'elixir',
    erlang:           'erlang',
    scala:            'scala',
    clojure:          'clojure',
    solidity:         'solidity',
    haskell:          'haskell',
    r:                'r',
    julia:            'julia',
    perl:             'perl',
    gdscript:         'godot',
    godot:            'godot',
    'godot-resource': 'godot-assets',
    'godot-scene':    'godot-assets',
    'godot-shader':   'godot-assets',
    lua:              'lua',
    shader:           'shader',
    shell:            'console',
    shellscript:      'console',
    sql:              'database',
    graphql:          'graphql',
    prisma:           'prisma',
    terraform:        'terraform',
    cmake:            'cmake',
    latex:            'tex',
    markdown:         'markdown',
    json:             'json',
    yaml:             'yaml',
    toml:             'toml',
    xml:              'xml',
    docker:           'docker',
    dockerfile:       'docker',
};

// Brand colors for multi-color icons
const MULTI_COLOR_OFFICIAL_COLORS: Record<string, string> = {
    julia:   '#7e57c2',
    clojure: '#1e88e5',
    python:  '#0288d1',
    kotlin:  '#7f52ff',
    haskell: '#ef5350',
    dart:    '#4fc3f7',
    vue:     '#41b883',
    cmake:   '#1e88e5',
    fsharp:  '#0288d1',
    toml:    '#ef5350',
};

const svgCache = new Map<string, { svg: string; color: string }>();

function extractPrimaryColor(svgContent: string, iconName: string): string {
    if (MULTI_COLOR_OFFICIAL_COLORS[iconName]) {
        return MULTI_COLOR_OFFICIAL_COLORS[iconName];
    }
    const matches = [...svgContent.matchAll(/fill="([^"]+)"/g)].map(m => m[1]);
    for (const c of matches) {
        const lc = c.toLowerCase();
        if (lc !== '#fff' && lc !== '#ffffff' && lc !== '#000' && lc !== '#000000' && lc !== 'none' && !lc.startsWith('url(')) {
            return c;
        }
    }
    return matches[0] || '#3794ff';
}

function loadMaterialSvg(iconName: string, size = 14): { svg: string; color: string } | null {
    initMaterialIconTheme();
    const cacheKey = `${iconName}_${size}`;
    if (svgCache.has(cacheKey)) {
        return svgCache.get(cacheKey)!;
    }

    const svgFile = path.join(iconsDir, `${iconName}.svg`);
    if (fs.existsSync(svgFile)) {
        try {
            const raw = fs.readFileSync(svgFile, 'utf8');
            const svg = raw.replace(/<svg\s+([^>]+)>/, `<svg width="${size}" height="${size}" $1>`);
            const color = extractPrimaryColor(raw, iconName);
            const res = { svg, color };
            svgCache.set(cacheKey, res);
            return res;
        } catch { /* ignore */ }
    }
    return null;
}

const CODICON_FILE_CODE = 'M14 4.5V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h6.5L14 4.5zm-5-2.5H3v12h10V5H9V2zm1.5 5.5l2 2-2 2-.7-.7 1.3-1.3-1.3-1.3.7-.7zm-5 0l-.7.7 1.3 1.3-1.3 1.3.7.7 2-2-2-2z';

// Resolves Material icon SVG and color for a language
export function getLangIcon(lang: string, size = 14): { svg: string; color: string } {
    const l = lang.toLowerCase();
    const iconName = LANG_TO_MATERIAL_ICON[l] || l;
    const loaded = loadMaterialSvg(iconName, size);
    if (loaded) {
        return loaded;
    }

    initMaterialIconTheme();
    if (manifest) {
        const fromLang = manifest.languageIds[l] || manifest.fileExtensions[l];
        if (fromLang) {
            const res = loadMaterialSvg(fromLang, size);
            if (res) return res;
        }
    }

    // Codicon fallback
    const color = MULTI_COLOR_OFFICIAL_COLORS[iconName] || '#6e7681';
    const svg = `<svg role="img" viewBox="0 0 16 16" width="${size}" height="${size}" fill="${color}" xmlns="http://www.w3.org/2000/svg"><path d="${CODICON_FILE_CODE}"/></svg>`;
    return { svg, color };
}

// Resolves Material icon SVG and color for a file path
export function getFileIcon(filePath: string, size = 14): { svg: string; color: string } {
    initMaterialIconTheme();
    const fname = path.basename(filePath).toLowerCase();

    // Exact filename match
    if (manifest && manifest.fileNames[fname]) {
        const icon = manifest.fileNames[fname];
        const res = loadMaterialSvg(icon, size);
        if (res) return res;
    }

    // Config overrides
    if (fname === 'tsconfig.json' || fname.startsWith('tsconfig.')) {
        const res = loadMaterialSvg('tsconfig', size);
        if (res) return res;
    }
    if (fname === 'jsconfig.json' || fname.startsWith('jsconfig.')) {
        const res = loadMaterialSvg('javascript', size);
        if (res) return res;
    }

    // Source maps & TypeScript declarations
    if (fname.endsWith('.scss.map') || fname.endsWith('.sass.map') || fname.endsWith('.less.map')) {
        const res = loadMaterialSvg('css-map', size);
        if (res) return res;
    }
    if (fname.endsWith('.d.mts') || fname.endsWith('.d.cts') || fname.endsWith('.d.ts.map') || fname.endsWith('.d.mts.map') || fname.endsWith('.d.cts.map')) {
        const res = loadMaterialSvg('typescript-def', size);
        if (res) return res;
    }
    if (fname.endsWith('.map')) {
        const res = loadMaterialSvg('javascript-map', size);
        if (res) return res;
    }

    // Stem match
    const stem = fname.replace(/\.[^.]+$/, '');
    if (manifest && manifest.fileNames[stem]) {
        const icon = manifest.fileNames[stem];
        const res = loadMaterialSvg(icon, size);
        if (res) return res;
    }

    // Compound and single extension match (.js.map, .d.ts, .ts)
    const parts = fname.split('.');
    for (let i = 1; i < parts.length; i++) {
        const multiExt = parts.slice(i).join('.');
        if (manifest && manifest.fileExtensions[multiExt]) {
            const icon = manifest.fileExtensions[multiExt];
            const res = loadMaterialSvg(icon, size);
            if (res) return res;
        }
    }

    // Fallback to language icon
    const ext = path.extname(filePath).slice(1).toLowerCase();
    const canonicalLang = inferLanguageFromPath(filePath) || EXT_TO_LANG[ext] || ext;
    return getLangIcon(canonicalLang, size);
}

export function getLangColor(lang: string): string {
    return getLangIcon(lang).color;
}
export { getLangColor as langColor };
export { displayName, getLanguageDisplayName };

export function escHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
