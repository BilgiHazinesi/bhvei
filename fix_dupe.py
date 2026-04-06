with open('kutuphane/kutuphane.js', 'r') as f:
    content = f.read()

# We need to remove anything after the first `function deleteRecord(id) { ... }` block
# because it was duplicated due to a previous bug.
start_idx = content.find("function deleteRecord(id) {")
end_idx = content.find("}", start_idx) + 1

valid_content = content[:end_idx]

with open('kutuphane/kutuphane.js', 'w') as f:
    f.write(valid_content + "\n")
