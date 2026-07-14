from transformers import AutoModel

model = AutoModel.from_pretrained("google/gemma-4-12B-it-qat-q4_0-gguf", dtype="auto")
