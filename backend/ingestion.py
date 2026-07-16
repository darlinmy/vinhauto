import os
import sys
import shutil
import time
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma

# Load environment variables from .env relative to the script directory
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

# Define absolute paths based on project structure
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
CHROMA_DIR = os.path.join(DATA_DIR, "chroma_db")

def ingest_documents():
    """
    Reads PDFs from the data/ folder, chunks the text,
    and indexes them in ChromaDB using Google Generative AI Embeddings.
    """
    # 1. Validate Gemini API Key
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("[-] Error: GOOGLE_API_KEY or GEMINI_API_KEY is not set in environment or .env file.")
        sys.exit(1)
        
    print(f"[*] Starting ingestion process...")
    print(f"[*] Reading PDFs from directory: {DATA_DIR}")
    
    # 2. Scan directories
    if not os.path.exists(DATA_DIR):
        print(f"[-] Error: Data directory '{DATA_DIR}' does not exist.")
        sys.exit(1)
        
    # Clean up existing database to start fresh
    if os.path.exists(CHROMA_DIR):
        print(f"[*] Removing old ChromaDB database at: {CHROMA_DIR}...")
        try:
            shutil.rmtree(CHROMA_DIR)
            print("[+] Old database cleared.")
        except Exception as e:
            print(f"[-] Warning: Could not remove old ChromaDB folder: {str(e)}")

    pdf_files = [f for f in os.listdir(DATA_DIR) if f.endswith(".pdf")]
    if not pdf_files:
        print("[-] Error: No PDF files found in data folder.")
        return
        
    # 3. Load PDF Documents
    all_pdf_documents = []
    for pdf_file in pdf_files:
        pdf_path = os.path.join(DATA_DIR, pdf_file)
        print(f"[*] Loading PDF: {pdf_file}...")
        try:
            loader = PyPDFLoader(pdf_path)
            docs = loader.load()
            all_pdf_documents.extend(docs)
            print(f"[+] Loaded {len(docs)} pages from {pdf_file}")
        except Exception as e:
            print(f"[-] Error loading PDF {pdf_file}: {str(e)}")
            
    # 4. Text Splitting for PDFs
    print("[*] Splitting PDF documents...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )
    pdf_chunks = text_splitter.split_documents(all_pdf_documents)
    print(f"[+] Split PDFs into {len(pdf_chunks)} chunks.")
        
    # 5. Initialize Embeddings and Chroma
    print("[*] Initializing Embeddings and vector store...")
    try:
        embeddings = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            google_api_key=api_key
        )
        vector_store = Chroma(
            embedding_function=embeddings,
            persist_directory=CHROMA_DIR
        )
        
        print("[*] Bắt đầu đẩy dữ liệu lên ChromaDB (Có áp dụng nhịp nghỉ 4s để tránh lỗi API)...")
        # Dùng vòng lặp đẩy từng chunk một lên API
        for i, chunk in enumerate(pdf_chunks):
            vector_store.add_documents([chunk])
            print(f"    - Đã nhúng đoạn {i + 1}/{len(pdf_chunks)}")
            time.sleep(4) # Nghỉ 4 giây trước khi đẩy đoạn tiếp theo
            

        print(f"[+] Success: ChromaDB created and saved at: {CHROMA_DIR}")
    except Exception as e:
        print(f"[-] Ingestion failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    ingest_documents()