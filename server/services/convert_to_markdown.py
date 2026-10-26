# -*- coding: utf-8 -*-
"""
Microsoft MarkItDown CLI Bridge for TDMU Trade Union Document Parser
Converts DOCX, PPTX, XLSX, XLS, PDF, CSV, and HTML into clean, token-efficient Markdown.
"""

import sys
import os
import json
import io

# Ensure UTF-8 output even in Windows cmd/powershell
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
if sys.stderr.encoding != 'utf-8':
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

def convert_document(file_path):
    if not os.path.exists(file_path):
        return {
            "success": False,
            "error": f"File not found: {file_path}"
        }

    try:
        from markitdown import MarkItDown
        md = MarkItDown()
        result = md.convert(file_path)
        
        text_content = result.text_content or ""
        title = getattr(result, 'title', None) or ""

        return {
            "success": True,
            "markdown": text_content,
            "title": title,
            "char_count": len(text_content)
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"MarkItDown error: {str(e)}"
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        output = {"success": False, "error": "Usage: convert_to_markdown.py <file_path>"}
    else:
        file_path = sys.argv[1]
        output = convert_document(file_path)
    
    print(json.dumps(output, ensure_ascii=False))
