#!/usr/bin/env python3
"""
Embedding service for generating text embeddings using sentence-transformers.
Fallback to TF-IDF if sentence-transformers is not available.
"""

import sys
import json
import hashlib
from typing import List, Dict, Any

try:
    from sentence_transformers import SentenceTransformer
    HAS_SENTENCE_TRANSFORMERS = True
except ImportError:
    HAS_SENTENCE_TRANSFORMERS = False
    from sklearn.feature_extraction.text import TfidfVectorizer
    import numpy as np

class EmbeddingService:
    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        self.model_name = model_name
        if HAS_SENTENCE_TRANSFORMERS:
            # Use sentence transformers for semantic embeddings
            self.model = SentenceTransformer(model_name)
            self.embedding_dim = self.model.get_sentence_embedding_dimension()
        else:
            # Fallback to TF-IDF
            self.vectorizer = TfidfVectorizer(max_features=384, stop_words='english')
            self.embedding_dim = 384
    
    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of texts."""
        if HAS_SENTENCE_TRANSFORMERS:
            # Generate semantic embeddings
            embeddings = self.model.encode(texts, convert_to_numpy=True)
            return embeddings.tolist()
        else:
            # Generate TF-IDF vectors
            tfidf_matrix = self.vectorizer.fit_transform(texts)
            # Pad or truncate to fixed dimension
            embeddings = []
            for i in range(tfidf_matrix.shape[0]):
                vec = tfidf_matrix[i].toarray().flatten()
                if len(vec) < self.embedding_dim:
                    # Pad with zeros
                    vec = np.pad(vec, (0, self.embedding_dim - len(vec)))
                else:
                    # Truncate
                    vec = vec[:self.embedding_dim]
                embeddings.append(vec.tolist())
            return embeddings
    
    def generate_single_embedding(self, text: str) -> List[float]:
        """Generate embedding for a single text."""
        return self.generate_embeddings([text])[0]
    
    def compute_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """Compute cosine similarity between two embeddings."""
        import numpy as np
        vec1 = np.array(embedding1)
        vec2 = np.array(embedding2)
        
        # Compute cosine similarity
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return float(dot_product / (norm1 * norm2))
    
    def text_hash(self, text: str) -> str:
        """Generate a hash for text content."""
        return hashlib.md5(text.encode()).hexdigest()

def main():
    """Main entry point for command-line usage."""
    if len(sys.argv) < 2:
        print(json.dumps({
            "error": "Usage: python embedding-service.py <command> [args]",
            "commands": ["embed", "embed_batch", "similarity", "info"]
        }))
        sys.exit(1)
    
    command = sys.argv[1]
    service = EmbeddingService()
    
    try:
        if command == "info":
            # Return service information
            result = {
                "has_sentence_transformers": HAS_SENTENCE_TRANSFORMERS,
                "model": service.model_name if HAS_SENTENCE_TRANSFORMERS else "tfidf",
                "embedding_dim": service.embedding_dim
            }
            print(json.dumps(result))
        
        elif command == "embed":
            # Embed single text from stdin
            text = sys.stdin.read()
            embedding = service.generate_single_embedding(text)
            print(json.dumps({"embedding": embedding}))
        
        elif command == "embed_batch":
            # Embed multiple texts from stdin (JSON array)
            data = json.loads(sys.stdin.read())
            if not isinstance(data, list):
                raise ValueError("Input must be a JSON array of strings")
            embeddings = service.generate_embeddings(data)
            print(json.dumps({"embeddings": embeddings}))
        
        elif command == "similarity":
            # Compute similarity between two embeddings
            data = json.loads(sys.stdin.read())
            if "embedding1" not in data or "embedding2" not in data:
                raise ValueError("Input must contain 'embedding1' and 'embedding2'")
            similarity = service.compute_similarity(data["embedding1"], data["embedding2"])
            print(json.dumps({"similarity": similarity}))
        
        else:
            print(json.dumps({"error": f"Unknown command: {command}"}))
            sys.exit(1)
    
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()