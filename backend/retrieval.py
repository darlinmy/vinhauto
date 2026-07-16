import os
import json
import csv
import re
from typing import List, Optional
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_chroma import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.documents import Document
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

# Load environment variables
load_dotenv()

# Define absolute paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
CHROMA_DIR = os.path.join(DATA_DIR, "chroma_db")

# 1. Initialize Embeddings and Load Vector Store
api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY or GEMINI_API_KEY is not set.")

embeddings = GoogleGenerativeAIEmbeddings(
    model="models/gemini-embedding-001",
    google_api_key=api_key
)

# Load ChromaDB in read-only mode for PDF manuals
if not os.path.exists(CHROMA_DIR):
    raise FileNotFoundError(f"ChromaDB not found at {CHROMA_DIR}. Please run ingestion.py first.")

vector_store = Chroma(
    persist_directory=CHROMA_DIR,
    embedding_function=embeddings
)

# Create retriever configuration for PDF manuals
retriever = vector_store.as_retriever(search_kwargs={"k": 3})

# 2. Load OBD-II Powertrain Codes for Fast Exact Lookup
csv_path = os.path.join(DATA_DIR, "Powertrain Codes.csv")
obd_lookup = {}
if os.path.exists(csv_path):
    print(f"[*] Loading OBD-II powertrain codes from {csv_path}...")
    try:
        with open(csv_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                code = row.get("Code", "").strip().upper()
                system = row.get("Trouble Code System", "").strip()
                desc = row.get("Condition Description", "").strip()
                if code:
                    obd_lookup[code] = {"system": system, "desc": desc}
        print(f"[+] Loaded {len(obd_lookup)} OBD-II codes for fast exact lookup.")
    except Exception as e:
        print(f"[-] Error loading OBD-II CSV lookup: {str(e)}")
else:
    print(f"[-] Warning: Powertrain Codes.csv not found at {csv_path}. Exact OBD-II lookup will be disabled.")

# 3. Setup Gemini LLM
# We use gemini-3.5-flash as the requested model
llm = ChatGoogleGenerativeAI(
    model="gemini-3.5-flash",
    google_api_key=api_key,
    temperature=0.2
)

# 4. Create RAG Prompts
SYSTEM_PROMPT = (
    "Bạn là một chuyên gia kỹ thuật ô tô và cố vấn dịch vụ thông minh của garage Vinh Auto.\n"
    "Nhiệm vụ của bạn là hỗ trợ khách hàng và kỹ thuật viên chẩn đoán sự cố, tra cứu tài liệu và bảo dưỡng ô tô.\n\n"
    "HƯỚNG DẪN TRẢ LỜI CHẨN ĐOÁN & KỸ THUẬT:\n"
    "Khi trả lời về sự cố kỹ thuật hoặc mã lỗi (OBD-II), hãy trình bày rõ ràng theo cấu trúc chuyên nghiệp sau:\n"
    "1. **Giải thích sự cố / mã lỗi**: Nêu rõ ý nghĩa, mức độ nghiêm trọng và ảnh hưởng của nó đến vận hành xe.\n"
    "2. **Nguyên nhân phổ biến**: Liệt kê các nguyên nhân gây ra lỗi từ phổ biến nhất đến ít phổ biến hơn (với các chi tiết kỹ thuật cụ thể).\n"
    "3. **Quy trình kiểm tra / Chẩn đoán gợi ý**: Hướng dẫn các bước đo đạc, kiểm tra cơ bản hoặc chuyên sâu (sử dụng đồng hồ vạn năng, máy quét lỗi, kiểm tra trực quan, v.v.).\n"
    "4. **Giải pháp khắc phục & Bảo dưỡng**: Đưa ra hướng xử lý thích hợp, các vật tư linh kiện cần thay thế hoặc kiểm tra định kỳ (tham khảo lịch bảo dưỡng hoặc TSB nếu có).\n\n"
    "HƯỚNG DẪN SỬ DỤNG NGỮ CẢNH & THÔNG TIN:\n"
    "- Ưu tiên sử dụng thông tin kỹ thuật chính xác từ tài liệu tham khảo được cung cấp bên dưới (ví dụ: Lịch bảo dưỡng Ford Ranger, Bản tin TSB).\n"
    "- Nếu câu hỏi là về các kiến thức ô tô chung hoặc câu xã giao ngoài tài liệu, hãy dùng chuyên môn sâu của bạn về kỹ thuật ô tô để giải đáp nhiệt tình, cụ thể, không từ chối hoặc đùn đẩy.\n"
    "- Chỉ khi gặp câu hỏi cực kỳ đặc thù, sơ đồ mạch chi tiết hoặc lỗi phần cứng phức tạp của dòng xe nằm ngoài tài liệu, mới khuyên khách hàng đưa xe đến Vinh Auto để kỹ thuật viên kiểm tra trực tiếp.\n\n"
    "Dữ liệu kỹ thuật tham khảo:\n"
    "---------------------\n"
    "{context}\n"
    "---------------------\n"
)

CONDENSE_QUESTION_SYSTEM_PROMPT = (
    "Cho lịch sử cuộc trò chuyện dưới đây và một câu hỏi mới nhất từ người dùng, "
    "hãy tạo ra một câu hỏi độc lập (standalone question) bằng tiếng Việt có đầy đủ ngữ cảnh để có thể hiểu được mà không cần xem lịch sử cuộc trò chuyện (đặc biệt cần giữ lại các mã lỗi OBD-II hoặc tên xe nếu có đề cập ở trước).\n"
    "KHÔNG trả lời câu hỏi đó, chỉ viết lại câu hỏi đó nếu cần thiết, ngược lại giữ nguyên câu hỏi ban đầu."
)

def is_conversational_query(query: str) -> bool:
    """Detects if a query is a greeting, basic social message, or very short phrase to skip vector search."""
    clean_query = query.strip().lower()
    # Remove punctuation
    clean_query = re.sub(r'[^\w\s]', '', clean_query)
    
    # Set of common Vietnamese and English greetings/conversational phrases
    phrases = {
        "chào", "xin chào", "chào bạn", "chào ad", "hello", "hi", "helo", "alo", "halô",
        "cảm ơn", "cám ơn", "cảm ơn bạn", "thank", "thanks", "thank you",
        "tạm biệt", "bye", "goodbye", "bạn là ai", "ai đấy", "tên bạn là gì",
        "trợ giúp", "help", "ok", "okay", "ừ", "vâng", "dạ"
    }
    
    if clean_query in phrases:
        return True
        
    # Also skip if extremely short and doesn't look like an OBD-II error code (like P0101)
    if len(clean_query) < 4 and not re.match(r'^[pcbu]\d', clean_query):
        return True
        
    return False

def format_docs(docs):
    """Formats list of retrieved documents into a clean string for the context prompt."""
    formatted = []
    for i, doc in enumerate(docs):
        source = os.path.basename(doc.metadata.get("source", "Tài liệu"))
        page = doc.metadata.get("page", 0) + 1
        page_str = f"Trang {page}" if page > 1 else "Bản ghi"
        formatted.append(f"[Tài liệu {i+1}]: {source} ({page_str})\nNội dung: {doc.page_content}")
    return "\n\n".join(formatted)

async def stream_rag(question: str, history: Optional[List] = None):
    """
    Asynchronously retrieves relevant chunks and streams LLM response,
    taking into account the conversation history for multi-turn capability.
    Yields Server-Sent Events (SSE) structured JSON:
    1. First event: sources retrieved from vector store and/or CSV exact lookup
    2. Sub-sequent events: response tokens as they are generated from gemini-3.5-flash
    """
    if history is None:
        history = []

    try:
        # A. Condense/Rephrase the user's latest question if history is present
        search_query = question
        if len(history) > 0 and not is_conversational_query(question):
            rephrase_messages = [SystemMessage(content=CONDENSE_QUESTION_SYSTEM_PROMPT)]
            for msg in history:
                sender = msg.get("sender") if isinstance(msg, dict) else getattr(msg, "sender", None)
                text = msg.get("text") if isinstance(msg, dict) else getattr(msg, "text", None)
                if sender == "user":
                    rephrase_messages.append(HumanMessage(content=text))
                elif sender == "bot":
                    rephrase_messages.append(AIMessage(content=text))
            rephrase_messages.append(HumanMessage(content=question))
            
            try:
                rephrase_response = await llm.ainvoke(rephrase_messages)
                search_query = rephrase_response.content.strip()
                print(f"[*] Rephrased '{question}' -> '{search_query}'")
            except Exception as rephrase_err:
                print(f"[-] Error rephrasing question: {str(rephrase_err)}")
                search_query = question

        # B. Perform Exact OBD-II Code Lookup using regex on the search query
        obd_docs = []
        found_codes = re.findall(r'\b[P|C|B|U]\d{4}\b|\b[P|C|B|U]\d[A-F0-9]\d{2}\b', search_query.upper())
        found_codes = list(set(found_codes))  # De-duplicate codes
        
        for code in found_codes:
            if code in obd_lookup:
                info = obd_lookup[code]
                snippet = f"Mã lỗi OBD-II: {code}\nHệ thống: {info['system']}\nMô tả sự cố: {info['desc']}"
                obd_docs.append(Document(
                    page_content=snippet,
                    metadata={"source": "Powertrain Codes.csv", "page": 0}
                ))
                print(f"[+] Exact match found for OBD-II code: {code}")

        # C. Retrieve relevant documents from Chroma vector store (PDF manuals)
        # Skip vector DB retrieval for simple greetings/conversational queries to improve response speed
        if is_conversational_query(search_query) and not obd_docs:
            docs = []
            print(f"[*] Conversational query detected: '{search_query}'. Skipping vector search.")
        else:
            docs = await retriever.ainvoke(search_query)
        
        # Combine both OBD-II lookup documents and PDF manual chunks
        all_docs = obd_docs + list(docs)
        
        # Extract source references to return to client
        sources = []
        for doc in all_docs:
            source_file = os.path.basename(doc.metadata.get("source", ""))
            page = doc.metadata.get("page", 0) + 1
            sources.append({
                "source": source_file,
                "page": page,
                "snippet": doc.page_content[:150] + "..."  # Snippet preview
            })
            
        # Yield source documents first so client can display references
        yield f"data: {json.dumps({'type': 'sources', 'data': sources}, ensure_ascii=False)}\n\n"
        
        # Build prompt with formatted context
        context = format_docs(all_docs)
        
        # Construct dynamic list of messages for LLM inference
        inference_messages = [SystemMessage(content=SYSTEM_PROMPT.format(context=context))]
        for msg in history:
            sender = msg.get("sender") if isinstance(msg, dict) else getattr(msg, "sender", None)
            text = msg.get("text") if isinstance(msg, dict) else getattr(msg, "text", None)
            if sender == "user":
                inference_messages.append(HumanMessage(content=text))
            elif sender == "bot":
                inference_messages.append(AIMessage(content=text))
        inference_messages.append(HumanMessage(content=question))
        
        # Stream response chunks from LLM
        async for chunk in llm.astream(inference_messages):
            content = chunk.content
            # Extract plain text string if content is structured (e.g. list of dicts/objects)
            text_val = ""
            if isinstance(content, str):
                text_val = content
            elif isinstance(content, list):
                for part in content:
                    if isinstance(part, dict) and "text" in part:
                        text_val += part["text"]
                    elif isinstance(part, str):
                        text_val += part
                    elif hasattr(part, "get"):
                        text_val += part.get("text", "")
                    elif hasattr(part, "text"):
                        text_val += part.text
            
            yield f"data: {json.dumps({'type': 'token', 'data': text_val}, ensure_ascii=False)}\n\n"
            
    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'data': str(e)}, ensure_ascii=False)}\n\n"
