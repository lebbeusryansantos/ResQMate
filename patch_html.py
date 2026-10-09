import glob
import re
import os

pagination_html = """
                <div class="pagination-controls" style="display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-top: 1px solid #e5e7eb;">
                    <button id="prevPageBtn" class="rq-btn-reject disabled-btn" style="background: #e5e7eb; color: #4b5563; border: none; padding: 8px 16px; border-radius: 6px; cursor: not-allowed;" disabled>Previous</button>
                    <span id="pageIndicator" style="font-size: 0.9rem; color: #4b5563; font-weight: 500;">Page 1</span>
                    <button id="nextPageBtn" class="rq-btn-approve" style="background: #e5e7eb; color: #4b5563; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Next</button>
                </div>
"""

html_files = glob.glob('frontend/**/*.html', recursive=True)
for f in html_files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
        
    if '</table>' in content and 'pagination-controls' not in content:
        pattern = r'(</table>\s*</div>)'
        new_content = re.sub(pattern, r'\1' + pagination_html, content)
        if new_content == content:
            # fallback
            pattern2 = r'(</table>)'
            new_content = re.sub(pattern2, r'\1' + pagination_html, content)
        
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        print(f'Patched HTML: {f}')
