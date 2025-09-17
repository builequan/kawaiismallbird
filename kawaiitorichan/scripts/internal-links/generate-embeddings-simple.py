#!/usr/bin/env python3
"""
Simple embeddings generator for the fixed index format
"""

import json
import sys
from pathlib import Path

try:
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer('all-MiniLM-L6-v2')
    HAS_MODEL = True
except ImportError:
    HAS_MODEL = False
    print("Warning: sentence-transformers not installed, using random embeddings", file=sys.stderr)
    import random
    random.seed(42)

def generate_embeddings():
    # Read the index
    index_path = Path('data/internal-links/posts-index.json')
    with open(index_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    posts = data['posts']
    embeddings_data = {}
    
    # Filter Japanese posts
    japanese_posts = [p for p in posts if p.get('language') == 'ja']
    print(f"Processing {len(japanese_posts)} Japanese posts...", file=sys.stderr)
    
    if HAS_MODEL:
        # Prepare texts
        texts = []
        for post in japanese_posts:
            # Combine title, top phrases, and some content
            text_parts = [
                post.get('title', ''),
                ' '.join(post.get('anchorPhrases', [])[:20]),
                ' '.join(post.get('keywords', [])[:10]),
                post.get('textContent', '')[:500]
            ]
            text = ' '.join(filter(None, text_parts))
            texts.append(text)
        
        # Generate embeddings
        embeddings = model.encode(texts, convert_to_numpy=True)
        
        # Store embeddings
        for i, post in enumerate(japanese_posts):
            embeddings_data[post['id']] = embeddings[i].tolist()
    else:
        # Generate random embeddings as fallback
        for post in japanese_posts:
            embeddings_data[post['id']] = [random.random() for _ in range(384)]
    
    # Save embeddings
    output = {
        'model': 'all-MiniLM-L6-v2' if HAS_MODEL else 'random',
        'dimension': 384,
        'embeddings': embeddings_data,
        'timestamp': data.get('timestamp')
    }
    
    output_path = Path('data/internal-links/embeddings.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2)
    
    print(f"✅ Generated embeddings for {len(embeddings_data)} posts", file=sys.stderr)
    print(f"📁 Saved to {output_path}", file=sys.stderr)

if __name__ == '__main__':
    generate_embeddings()