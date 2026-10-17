"""Build sibling Chinese pages from reviewed translations, without duplicating models."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit, urlunsplit
import html
import json
import os
import re

SKIP_TAGS = {"script", "style", "pre", "code"}
SKIP_CLASSES = {"equation", "inline-equation"}
TEXT_ATTRIBUTES = {"alt", "title", "aria-label", "aria-description", "placeholder"}
VOID_TAGS = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}
SITE = "https://vandermode.github.io/optics-in-5-minutes-course/"


def normalize(value):
    return " ".join(value.split())


def language_nav():
    return '''<!-- course-languages --><nav class="language-switch" aria-label="Language / 语言" translate="no"><a href="index.html" data-language="en" lang="en" hreflang="en" aria-current="page">English</a><a href="index.zh.html" data-language="zh" lang="zh-CN" hreflang="zh-CN">中文</a></nav><!-- /course-languages -->'''


def add_language_ui(text, page):
    text = re.sub(r'<!-- course-languages -->.*?<!-- /course-languages -->', '', text, flags=re.S)
    shared = "shared/" if page.parent == Path(".") else "../shared/"
    if 'language.css"' not in text:
        text = text.replace('</head>', f'<link rel="stylesheet" href="{shared}language.css"><script type="module" src="{shared}language.js"></script></head>', 1)
    return text.replace('</header>', language_nav() + '</header>', 1)


class Localizer(HTMLParser):
    def __init__(self, page, pages, phrases=None):
        super().__init__(convert_charrefs=True)
        self.page, self.pages, self.phrases = page, set(pages), phrases
        self.stack, self.parts, self.strings, self.missing = [], [], {}, set()

    @property
    def skipped(self):
        return bool(self.stack and self.stack[-1][1])

    def translate(self, value):
        key = normalize(html.unescape(value))
        if not re.search(r'[A-Za-z]{2,}', key):
            return html.unescape(value)
        self.strings[key] = str(self.page)
        if self.phrases is None:
            return html.unescape(value)
        if key not in self.phrases:
            self.missing.add(key)
            return html.unescape(value)
        before = re.match(r'^\s*', value).group()
        after = re.search(r'\s*$', value).group()
        return before + self.phrases[key] + after

    def local_link(self, href):
        if not href or href.startswith('#'):
            return href
        if href.startswith(SITE):
            href = 'https://course.invalid/' + href[len(SITE):]
        url = urlsplit(urljoin('https://course.invalid/' + self.page.as_posix(), href))
        if url.netloc != 'course.invalid':
            return href
        target = Path(url.path.lstrip('/'))
        if url.path.endswith('/') or not target.suffix:
            target = target / 'index.html'
        if target not in self.pages:
            return href
        target = target.with_name('index.zh.html')
        relative = os.path.relpath(target, self.page.parent).replace(os.sep, '/')
        return urlunsplit(('', '', relative, url.query, url.fragment))

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        skip = self.skipped or tag in SKIP_TAGS or attrs.get('translate') == 'no' or bool(SKIP_CLASSES.intersection(attrs.get('class', '').split()))
        if self.phrases is None:
            for name, value in attributes:
                if not skip and value is not None and (name in TEXT_ATTRIBUTES or tag == 'meta' and name == 'content' and attrs.get('name') == 'description'):
                    self.translate(value)
            self.parts.append(self.get_starttag_text())
        else:
            if tag == 'html':
                attrs['lang'] = 'zh-CN'
            if 'data-language' in attrs:
                if attrs['data-language'] == 'zh':
                    attrs['aria-current'] = 'page'
                else:
                    attrs.pop('aria-current', None)
            elif tag == 'a' and 'href' in attrs:
                attrs['href'] = self.local_link(attrs['href'])
            if tag == 'iframe' and 'youtube-nocookie.com/embed/' in attrs.get('src', ''):
                attrs['src'] = attrs['src'].replace('hl=en', 'hl=zh-CN')
            if not skip:
                for name, value in list(attrs.items()):
                    if value is not None and (name in TEXT_ATTRIBUTES or tag == 'meta' and name == 'content' and attrs.get('name') == 'description'):
                        attrs[name] = self.translate(value)
            rendered = ''.join(' ' + key + ('' if value is None else '="' + html.escape(value, quote=True) + '"') for key, value in attrs.items())
            self.parts.append('<' + tag + rendered + '>')
        if tag not in VOID_TAGS:
            self.stack.append((tag, skip))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if self.phrases is not None:
            self.parts[-1] = self.parts[-1][:-1] + ' />'
        if tag not in VOID_TAGS:
            self.stack.pop()

    def handle_endtag(self, tag):
        self.parts.append('</' + tag + '>')
        if tag not in VOID_TAGS:
            if not self.stack or self.stack[-1][0] != tag:
                raise ValueError(f'Unbalanced HTML in {self.page}: {tag}')
            self.stack.pop()

    def handle_data(self, value):
        if self.stack and self.stack[-1][0] in {'script', 'style'}:
            self.parts.append(value)
        else:
            self.parts.append(html.escape(value if self.skipped else self.translate(value), quote=False))

    def handle_entityref(self, name):
        self.parts.append('&' + name + ';')

    def handle_charref(self, name):
        self.parts.append('&#' + name + ';')

    def handle_comment(self, value):
        self.parts.append('<!--' + value + '-->')

    def handle_decl(self, value):
        self.parts.append('<!' + value + '>')


def page_paths(catalog):
    return [Path('index.html'), Path('preparation/index.html')] + [Path(entry['slug']) / 'index.html' for entry in catalog]


def collect_page_strings(root, catalog):
    pages = page_paths(catalog)
    strings = {}
    for page in pages:
        parser = Localizer(page, pages)
        parser.feed(add_language_ui((root / page).read_text(), page))
        strings.update(parser.strings)
    return strings


def build_languages(root, catalog):
    data = json.loads((root / 'tools/locales/zh.json').read_text())
    phrases, aliases = data['phrases'], data['termAliases']
    pages = page_paths(catalog)
    missing = set()
    outputs = {}
    for page in pages:
        english = add_language_ui((root / page).read_text(), page)
        parser = Localizer(page, pages, phrases)
        parser.feed(english)
        missing.update(parser.missing)
        translated = ''.join(parser.parts)
        if page == Path('index.html'):
            translated = translated.replace("location.replace('./e03-diffraction/'+", "location.replace('./e03-diffraction/index.zh.html'+")
        outputs[root / page] = english
        outputs[root / page.with_name('index.zh.html')] = translated
    if missing:
        raise ValueError('Chinese translations missing:\n' + '\n'.join(sorted(missing)))
    for path, content in outputs.items():
        path.write_text(content)
    (root / 'shared/zh.js').write_text('// Generated by tools/localization.py from the reviewed Chinese catalog.\n'
        + 'export const phrases = ' + json.dumps(phrases, ensure_ascii=False, indent=2) + ';\n'
        + 'export const termAliases = ' + json.dumps(aliases, ensure_ascii=False, indent=2) + ';\n')


if __name__ == '__main__':
    root = Path(__file__).resolve().parents[1]
    catalog = json.loads((root / 'course.json').read_text())
    print(json.dumps(collect_page_strings(root, catalog), ensure_ascii=False, indent=2))
