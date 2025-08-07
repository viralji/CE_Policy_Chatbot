import os
from flask import Flask, request, jsonify
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
def load_all_pdfs(folder='data'):
    text = ""
    for file in os.listdir(folder):
        if file.endswith('.pdf'):
            reader = PdfReader(os.path.join(folder, file))
            for page in reader.pages:
                content = page.extract_text()
                if content:
                    text += content
    return text


print("Loading PDFs...")
raw_text = load_all_pdfs()
print(f"Total text length: {len(raw_text)} characters")

# Use RecursiveCharacterTextSplitter for better chunking
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=100)
texts = text_splitter.split_text(raw_text)
print(f"Total chunks: {len(texts)}")

# ---------------------- Create Embeddings and Vectorstore ----------------------
print("Creating embeddings...")
embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
vectorstore = FAISS.from_texts(texts, embedding=embeddings)
print("Vectorstore ready!")

# ---------------------- Setup Chatbot Chain ----------------------
memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
qa_chain = ConversationalRetrievalChain.from_llm(
    llm=ChatGoogleGenerativeAI(model="models/gemini-2.5-pro", temperature=0),
    retriever=vectorstore.as_retriever(),
    memory=memory
)

# ---------------------- API Endpoints ----------------------
@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        question = data.get('question', '').strip()
        if not question:
            return jsonify({'error': 'Question is required'}), 400
        
        result = qa_chain({'question': question})
        answer = result['answer']
        return jsonify({'response': answer})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

# ---------------------- Run App ----------------------
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
