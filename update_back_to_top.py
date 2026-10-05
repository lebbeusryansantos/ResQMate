import os

frontend_dir = r"c:\Users\Ryan\Desktop\ResQMate\frontend"
target_dirs = ["admin", "staff", "customer"]

button_html = '<button id="backToTopBtn" title="Go to top"><i class="fa-solid fa-arrow-up"></i></button>\n'
script_html = '<script src="../components/back-to-top.js"></script>\n'

for d in target_dirs:
    dir_path = os.path.join(frontend_dir, d)
    for file in os.listdir(dir_path):
        if file.endswith(".html"):
            file_path = os.path.join(dir_path, file)
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            if 'id="backToTopBtn"' in content:
                continue

            # Inject button right before </main> if it exists, otherwise before </div> <!-- dashboard-container -->
            if "</main>" in content:
                content = content.replace("</main>", f"  {button_html}    </main>")
            else:
                # Some files might not have </main>, put it before the closing dashboard container or body
                if "</body>" in content:
                    content = content.replace("</body>", f"  {button_html}</body>")
            
            # Inject script right before </body>
            if "back-to-top.js" not in content:
                content = content.replace("</body>", f"  {script_html}</body>")
                
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)

print("Updated HTML files.")
