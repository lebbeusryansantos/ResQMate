import os, glob

frontend_dir = r'c:\Users\Ryan\Desktop\ResQMate\frontend'

def add_profile_modal(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check if we need to add the wrapper
    if 'id="profile-modal-wrapper"' not in content:
        content = content.replace('<div id="logout-modal-wrapper"></div>', '<div id="logout-modal-wrapper"></div>\n        <div id="profile-modal-wrapper"></div>')
    
    # Check if we need to add the script
    if 'profile-modal.js' not in content:
        content = content.replace('<script src="../components/logout-modal.js"></script>', '<script src="../components/profile-modal.js"></script>\n    <script src="../components/logout-modal.js"></script>')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Updated {filepath}')

for folder in ['staff', 'customer']:
    for filepath in glob.glob(os.path.join(frontend_dir, folder, '*.html')):
        add_profile_modal(filepath)
