import os
import re
from glob import glob

def patch_html_files():
    html_files = [
        'frontend/admin/requests.html',
        'frontend/customer/request.html',
        'frontend/customer/requests.html',
        'frontend/staff/requests.html'
    ]

    for file_path in html_files:
        if not os.path.exists(file_path):
            continue

        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 1. Add minlength="30" to textarea if not exists
        # We find <textarea ...> and add minlength="30"
        def replace_textarea(match):
            tag = match.group(0)
            if 'minlength' not in tag:
                return tag.replace('<textarea', '<textarea minlength="30"')
            return tag
            
        content = re.sub(r'<textarea[^>]*>', replace_textarea, content)

        # 2. Inject <small class="char-counter text-muted">0/30 minimum characters</small> after </textarea>
        # but only if it doesn't already exist.
        def replace_counter(match):
            full_match = match.group(0)
            return full_match + '\n<small class="char-counter text-muted" style="display:block; margin-top:4px; font-size:0.8rem; color:#6c757d;">0/30 minimum characters</small>'

        # We need to make sure we don't inject multiple times
        if 'char-counter text-muted' not in content:
            content = re.sub(r'</textarea>', replace_counter, content)

        # 3. Add script tag
        if 'textarea-validation.js' not in content:
            content = content.replace('</body>', '  <script src="../js/textarea-validation.js"></script>\n</body>')

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

if __name__ == '__main__':
    patch_html_files()
