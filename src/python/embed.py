import sys
import json
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")
text = sys.argv[1]
embedding = model.encode(text).tolist()
print(json.dumps(embedding))