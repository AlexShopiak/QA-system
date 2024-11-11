import sys
import json
import nltk
import pinecone
import time
import os

from sklearn.feature_extraction.text import CountVectorizer
from sklearn.decomposition import LatentDirichletAllocation
from nltk.corpus import stopwords
from dotenv import load_dotenv

nltk.download('stopwords')
load_dotenv()

#Pinecone initializing
pinecone_api_key = os.getenv("PINCONE_API_KEY")
index_name = os.getenv("PINECONE_INDEX_NAME")

pc = pinecone.Pinecone(api_key=pinecone_api_key)
index = pc.Index(index_name)


'''
Preprocesses the input texts by converting them to lowercase, 
splitting into words, and removing stop words.
'''
def preprocess_text(texts):
    stop_words = set(stopwords.words('english'))
    cleaned_texts = []
    
    for text in texts:
        # Convert text to lowercase and split into words
        words = text.lower().split()
        # Remove stop words
        filtered_words = [word for word in words if word not in stop_words]
        cleaned_texts.append(" ".join(filtered_words))
    
    return cleaned_texts


"""
Performs topic modeling on the input texts using Latent Dirichlet Allocation (LDA).
"""
def model_topics(input_data):
    try:
        # Convert the input JSON string to a Python object
        data = json.loads(input_data)
        texts = data['text']
          
        # Preprocess the text
        cleaned_texts = preprocess_text(texts)
        
        # Convert the text into a vector representation (bag of words)
        vectorizer = CountVectorizer()
        X = vectorizer.fit_transform(cleaned_texts)
        
        # Perform LDA to extract topics
        lda = LatentDirichletAllocation(n_components=1, random_state=42)  # 1 темa для примера
        lda.fit(X)
        
        # Extract top words for each topic
        feature_names = vectorizer.get_feature_names_out()
        topics = []
        
        for topic_idx, topic in enumerate(lda.components_):
            top_words = [feature_names[i] for i in topic.argsort()[:-6:-1]]  # Top-5 words for each topic
            topics.append({
                "topic": topic_idx + 1,
                "top_words": top_words
            })
        
        # Return result with topics
        result = {"doc_id": data['doc_id'], "topics": topics[0]["top_words"]}
        
        return result
    
    except Exception as e:
        print(json.dumps({"error": str(e)}))


"""
Updates the Pinecone index with the document's topics.
"""
def update_pinecone_index(doc_id, topics):
    try:
        # Retry mechanism to handle Pinecone bugs
        retries = 0
        max_retries = 20

        while retries < max_retries:
            fetch_response = index.fetch(ids=[doc_id])

            if doc_id in fetch_response['vectors']:
                current_metadata = fetch_response['vectors'][doc_id]['metadata']
                current_vector   = fetch_response['vectors'][doc_id]['values']
                break
            else:
                retries += 1
                time.sleep(1)
        else:
            current_metadata = {}
            current_vector = []

        # Update metadata with the topics
        current_metadata['topics'] = topics
        
        # Perform upsert with the new metadata
        response = index.upsert(
            vectors = [(doc_id, current_vector, current_metadata)]
        )
        return response
        
    except Exception as e:
        print(f"Error updating metadata {doc_id}: {str(e)}")

# Main block to process input data
if __name__ == "__main__":
    input_data = sys.argv[1]
    result = model_topics(input_data)
    response = update_pinecone_index(result["doc_id"], result["topics"])
    print(json.dumps(result))
