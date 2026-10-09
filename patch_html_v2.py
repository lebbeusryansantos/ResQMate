import glob
import re

rows_per_page_html = """
          <select id="rowsPerPage" class="rq-input rows-filter" aria-label="Rows per page" style="max-width: 120px;">
            <option value="10">10 Rows</option>
            <option value="25">25 Rows</option>
            <option value="50">50 Rows</option>
          </select>
"""

html_files = glob.glob('frontend/**/*.html', recursive=True)
for f in html_files:
    try:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
            
        if 'id="rowsPerPage"' not in content and 'class="toolbar-actions"' in content:
            # Inject before the primary button, or just at the end of toolbar-actions
            # Usually there is a button class="btn-primary"
            if 'class="btn-primary"' in content:
                # Add before the first primary button in toolbar-actions
                content = re.sub(r'(<button[^>]*class="btn-primary"[^>]*>)', rows_per_page_html + r'\n\1', content, count=1)
            else:
                # Add at the end of toolbar actions
                content = re.sub(r'(</div>\s*</div>\s*<div class="table-responsive">)', rows_per_page_html + r'\n\1', content, count=1)
            
            with open(f, 'w', encoding='utf-8') as file:
                file.write(content)
            print(f'Patched HTML: {f}')
    except Exception as e:
        print(f"Error processing {f}: {e}")
