import fitz  # PyMuPDF


def extract_text_from_pdf(file_path: str) -> str:
    """Extract raw text from a PDF file."""
    text = ""
    try:
        doc = fitz.open(file_path)
        for page in doc:
            text += page.get_text("text") + "\n"
        doc.close()
    except Exception as e:
        raise ValueError(f"Failed to parse PDF: {e}")
    return text.strip()
