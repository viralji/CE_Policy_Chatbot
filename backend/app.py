import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import FAISS
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
import google.generativeai as genai

# ---------------------- Load API key from .env ----------------------
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY not found in .env file")

os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY
genai.configure(api_key=GOOGLE_API_KEY)

# ---------------------- Flask App Setup ----------------------
app = Flask(__name__)
CORS(app)

# ---------------------- Load and Split PDFs ----------------------
def load_all_pdfs_with_metadata(folder='data'):
    docs = []
    for file in os.listdir(folder):
        if file.endswith('.pdf'):
            reader = PdfReader(os.path.join(folder, file))
            for i, page in enumerate(reader.pages):
                content = page.extract_text()
                if content:
                    docs.append({
                        'text': content,
                        'metadata': {
                            'source': file,
                            'page': i + 1
                        }
                    })
    return docs

print("Loading PDFs...")
docs = load_all_pdfs_with_metadata()
total_text_length = sum(len(doc['text']) for doc in docs)
print(f"Total text length: {total_text_length} characters")

text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
chunks = []
for doc in docs:
    splits = text_splitter.split_text(doc['text'])
    for split in splits:
        chunks.append({
            'text': split,
            'metadata': doc['metadata']
        })
print(f"Total chunks: {len(chunks)}")

# ---------------------- Create Embeddings and Vectorstore ----------------------
print("Creating/loading FAISS index...")
embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
faiss_index_dir = "faiss_index"
faiss_index_file = os.path.join(faiss_index_dir, "index.faiss")

if os.path.exists(faiss_index_file):
    print("Loading FAISS index from disk...")
    vectorstore = FAISS.load_local(faiss_index_dir, embeddings, allow_dangerous_deserialization=True)
else:
    print("Building FAISS index and saving to disk...")
    texts = [chunk['text'] for chunk in chunks]
    metadatas = [chunk['metadata'] for chunk in chunks]
    vectorstore = FAISS.from_texts(texts, embedding=embeddings, metadatas=metadatas)
    vectorstore.save_local(faiss_index_dir)
print("Vectorstore ready!")

# ---------------------- Setup Chatbot Chain ----------------------
memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True,
    output_key="answer"
)
retriever = vectorstore.as_retriever(search_kwargs={"k": 4})
qa_chain = ConversationalRetrievalChain.from_llm(
    llm=ChatGoogleGenerativeAI(model="models/gemini-2.5-pro", temperature=0),
    retriever=retriever,
    memory=memory,
    return_source_documents=True,
    get_chat_history=lambda h: h
)

# ---------------------- API Endpoints ----------------------
@app.route('/files/<path:filename>')
def serve_file(filename):
    return send_from_directory('data', filename)

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        question = data.get('question', '').strip()
        if not question:
            return jsonify({'error': 'Question is required'}), 400

        # Pass the question directly to the chain.
        result = qa_chain({"question": question})
        answer = result['answer']
        source_docs = result.get('source_documents', [])

        # Collect sources and format as a list of dictionaries
        sources = []
        for doc in source_docs:
            meta = doc.metadata if hasattr(doc, 'metadata') else doc.get('metadata', {})
            file = meta.get('source')
            page = meta.get('page')
            if file:
                link = f"http://localhost:5000/files/{file}#page={page}" if page else f"http://localhost:5000/files/{file}"
                sources.append({
                    'file': file,
                    'page': page,
                    'link': link
                })

        # Split the answer into bullet points for the frontend to format
        answer_lines = [line.strip('-*• ') for line in answer.split('\n') if line.strip()]

        # Return a structured JSON response
        return jsonify({
            'response': answer_lines, # A list of strings
            'sources': sources
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

# ---------------------- Run App ----------------------
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)