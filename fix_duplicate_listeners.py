import glob

files = glob.glob('frontend/js/staff-*.js') + glob.glob('frontend/js/customer-*.js')

listener_block = """
    document.getElementById("rowsPerPage")?.addEventListener("change", (e) => {
        itemsPerPage = parseInt(e.target.value, 10);
        currentPage = 1;
        if (typeof updatePagination === "function") updatePagination();
        else if (typeof filterRequests === "function") filterRequests();
    });
"""

for f in files:
    try:
        with open(f, 'r', encoding='utf-8') as fh:
            content = fh.read()
            
        count = content.count(listener_block)
        if count > 1:
            # Keep only the first occurrence
            parts = content.split(listener_block)
            new_content = parts[0] + listener_block + "".join(parts[1:])
            
            with open(f, 'w', encoding='utf-8') as fh:
                fh.write(new_content)
            print(f'Fixed duplicate listeners in {f}')
    except Exception as e:
        pass
