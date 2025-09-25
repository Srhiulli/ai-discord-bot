import sys
import json
import traceback
from sentence_transformers import SentenceTransformer

def log(msg, level="INFO"):
    print(f"[{level}] {msg}", file=sys.stderr, flush=True)

try:
    model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
except Exception:
    sys.exit(1)

def get_embedding(text):
    embedding = model.encode(text, convert_to_tensor=False)
    log(f"Embedding gerado com dimensão {len(embedding)}.")
    return embedding.tolist()

log("Servidor iniciado. Aguardando entrada...")

while True:
    try:
        line = sys.stdin.readline()
        if not line:
            log("Entrada vazia detectada. Encerrando servidor.")
            break

        data = json.loads(line.strip())

        if data.get('action') == 'embed':
            embedding = get_embedding(data['text'])
            result = json.dumps({'embedding': embedding})
            print(result, flush=True)
            log("Embedding enviado.")

    except Exception:
        err = traceback.format_exc()
        print(json.dumps({'error': str(err)}), flush=True)
        log("Erro durante processamento:\n" + err, level="ERROR")