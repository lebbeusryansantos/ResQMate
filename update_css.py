import os
import glob

css_files = glob.glob('frontend/style/*.css')
for f in css_files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    new_content = content.replace("'Poppins', 'Segoe UI', sans-serif", "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif")
    new_content = new_content.replace("'Poppins', sans-serif", "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif")
    
    if f.endswith('staff-dashboard.css') or f.endswith('staff-requests.css') or f.endswith('staff-distributions.css') or f.endswith('staff-resources.css'):
        new_content = new_content.replace('th {\n  color: #7f1d1d;\n  font-weight: 600;\n}', 'th {\n  color: #7f1d1d;\n  font-weight: 600;\n  text-transform: uppercase;\n}')
        new_content = new_content.replace('th {\n    color: #7f1d1d;\n    font-weight: 600;\n}', 'th {\n    color: #7f1d1d;\n    font-weight: 600;\n    text-transform: uppercase;\n}')
        
    if new_content != content:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        print('Updated ' + f)
