#!/usr/bin/env python3
"""
Generate embeddings with CORRECT IDs from the current index
"""

import json
import sys
from pathlib import Path

# First, show what we're reading
index_path = Path('data/internal-links/posts-index.json')
print(f"Reading index from: {index_path.absolute()}", file=sys.stderr)

# Read the index
with open(index_path, 'r', encoding='utf-8') as f:
    index_data = json.load(f)

posts = index_data['posts']
japanese_posts = [p for p in posts if p.get('language') == 'ja']

print(f"Found {len(japanese_posts)} Japanese posts", file=sys.stderr)
print(f"First 5 IDs: {[p['id'] for p in japanese_posts[:5]]}", file=sys.stderr)

try:
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer('all-MiniLM-L6-v2')
    HAS_MODEL = True
except ImportError:
    HAS_MODEL = False
    print("Warning: Using random embeddings", file=sys.stderr)
    import random
    random.seed(42)

# Generate embeddings
embeddings_data = {}

if HAS_MODEL:
    # Prepare texts
    texts = []
    for post in japanese_posts:
        text_parts = [
            post.get('title', ''),
            ' '.join(post.get('anchorPhrases', [])[:20]),
            ' '.join(post.get('keywords', [])[:10]),
            post.get('textContent', '')[:500]
        ]
        text = ' '.join(filter(None, text_parts))
        texts.append(text)
    
    print(f"Generating embeddings for {len(texts)} texts...", file=sys.stderr)
    
    # Generate embeddings
    embeddings = model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
    
    # Store with CORRECT IDs
    for i, post in enumerate(japanese_posts):
        post_id = str(post['id'])  # Ensure it's a string
        embeddings_data[post_id] = embeddings[i].tolist()
        if i < 5:
            print(f"  Stored embedding for ID {post_id}", file=sys.stderr)
else:
    # Fallback
    for post in japanese_posts:
        post_id = str(post['id'])
        embeddings_data[post_id] = [random.random() for _ in range(384)]

print(f"\nGenerated {len(embeddings_data)} embeddings", file=sys.stderr)
print(f"IDs in embeddings: {list(embeddings_data.keys())[:5]}", file=sys.stderr)

# Save embeddings
output_path = Path('data/internal-links/embeddings.json')
output = {
    'model': 'all-MiniLM-L6-v2' if HAS_MODEL else 'random',
    'dimension': 384,
    'embeddings': embeddings_data,
    'timestamp': index_data.get('timestamp')
}

with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(output, f, indent=2)

print(f"✅ Saved to {output_path}", file=sys.stderr)