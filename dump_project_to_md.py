import os

# Directories to skip entirely (you can add more here as needed)
IGNORE_DIRS = {'node_modules', '.git', '__pycache__'}

# Output Markdown file
OUTPUT_FILE = "project_contents.md"

def is_text_file(path):
    """
    Try opening the file as UTF-8. If it fails, assume it's binary
    and skip it.
    """
    try:
        with open(path, "r", encoding="utf-8") as f:
            f.read()
        return True
    except (UnicodeDecodeError, PermissionError):
        return False

def main():
    # Open the output file once, in write mode
    with open(OUTPUT_FILE, "w", encoding="utf-8") as md_out:
        # Walk through the directory tree
        for root, dirs, files in os.walk(".", topdown=True):
            # Remove ignored directories from traversal
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

            for filename in files:
                full_path = os.path.join(root, filename)
                # Skip the output file itself if it already exists
                if os.path.normpath(full_path) == os.path.normpath("./" + OUTPUT_FILE):
                    continue

                # Check if it's a readable text file
                if not is_text_file(full_path):
                    # If you want to note skipped binaries, uncomment next two lines:
                    # md_out.write(f"## {os.path.relpath(full_path)}\n")
                    # md_out.write("> *Skipped (binary or unreadable)*\n\n")
                    continue

                # Read file contents
                try:
                    with open(full_path, "r", encoding="utf-8") as f:
                        content = f.read()
                except Exception:
                    # In case something else goes wrong, skip
                    continue

                # Write a Markdown section for this file
                rel_path = os.path.relpath(full_path, ".")
                md_out.write(f"## {rel_path}\n\n")
                md_out.write("```\n")
                md_out.write(content.rstrip("\n"))
                md_out.write("\n```\n\n")

    print(f"All text files have been gathered into '{OUTPUT_FILE}'.")

if __name__ == "__main__":
    main()
