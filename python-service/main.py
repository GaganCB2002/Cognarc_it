from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
import io
import os
import tempfile
import cv2
from PIL import Image
from transformers import pipeline, AutoProcessor, AutoModelForDocumentQuestionAnswering
import logging
import moviepy.editor as mp

app = FastAPI(title="Cognarc IT - AI Service")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Load Models Globally ---
logger.info("Initializing AI Pipelines...")

try:
    # 1. Document QA
    model_name_doc = "tiennvcs/layoutlmv2-base-uncased-finetuned-docvqa"
    processor_doc = AutoProcessor.from_pretrained(model_name_doc)
    model_doc = AutoModelForDocumentQuestionAnswering.from_pretrained(model_name_doc)
    doc_pipe = pipeline("document-question-answering", model=model_doc, tokenizer=processor_doc.tokenizer)
    logger.info("Document QA model loaded.")
except Exception as e:
    logger.error(f"Error loading Document QA model: {e}")
    doc_pipe = None

try:
    # 2. Audio Transcription (Whisper)
    audio_pipe = pipeline("automatic-speech-recognition", model="openai/whisper-tiny")
    logger.info("Audio Transcription model loaded.")
except Exception as e:
    logger.error(f"Error loading Audio model: {e}")
    audio_pipe = None

try:
    # 3. Vision/Video Captioning (BLIP)
    vision_pipe = pipeline("image-to-text", model="Salesforce/blip-image-captioning-base")
    logger.info("Vision Captioning model loaded.")
except Exception as e:
    logger.error(f"Error loading Vision model: {e}")
    vision_pipe = None

# --- Endpoints ---

@app.post("/api/doc-qa")
async def document_qa(file: UploadFile = File(...), question: str = Form(...)):
    if not doc_pipe:
        raise HTTPException(status_code=500, detail="Document QA Model not loaded.")
    try:
        content = await file.read()
        image = Image.open(io.BytesIO(content)).convert("RGB")
        result = doc_pipe(image=image, question=question)
        return JSONResponse(content={"success": True, "answer": result})
    except Exception as e:
        logger.error(f"DocQA error: {e}")
        return JSONResponse(status_code=500, content={"success": False, "message": str(e)})

@app.post("/api/audio-analyze")
async def audio_analyze(file: UploadFile = File(...)):
    if not audio_pipe:
        raise HTTPException(status_code=500, detail="Audio Model not loaded.")
    
    try:
        content = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_audio:
            tmp_audio.write(content)
            tmp_audio_path = tmp_audio.name

        result = audio_pipe(tmp_audio_path)
        os.unlink(tmp_audio_path)

        return JSONResponse(content={"success": True, "transcript": result["text"]})
    except Exception as e:
        logger.error(f"Audio error: {e}")
        if 'tmp_audio_path' in locals() and os.path.exists(tmp_audio_path):
            os.unlink(tmp_audio_path)
        return JSONResponse(status_code=500, content={"success": False, "message": str(e)})

@app.post("/api/video-analyze")
async def video_analyze(file: UploadFile = File(...)):
    if not audio_pipe or not vision_pipe:
        raise HTTPException(status_code=500, detail="Audio/Vision Models not loaded.")
    
    try:
        content = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp_video:
            tmp_video.write(content)
            tmp_video_path = tmp_video.name

        # Extract Audio
        audio_transcript = ""
        try:
            video_clip = mp.VideoFileClip(tmp_video_path)
            if video_clip.audio:
                audio_path = tmp_video_path + ".wav"
                video_clip.audio.write_audiofile(audio_path, logger=None)
                audio_result = audio_pipe(audio_path)
                audio_transcript = audio_result["text"]
                os.unlink(audio_path)
            video_clip.close()
        except Exception as ae:
            logger.warning(f"Audio extraction failed: {ae}")

        # Extract Keyframes
        cap = cv2.VideoCapture(tmp_video_path)
        fps = int(cap.get(cv2.CAP_PROP_FPS)) or 30
        frame_interval = fps * 5
        
        captions = []
        frame_count = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            if frame_count % frame_interval == 0:
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_img = Image.fromarray(frame_rgb)
                caption = vision_pipe(pil_img)[0]['generated_text']
                time_sec = frame_count // fps
                captions.append({"time": f"{time_sec}s", "caption": caption})
            
            frame_count += 1
            if len(captions) >= 5:
                break

        cap.release()
        os.unlink(tmp_video_path)

        analysis = {
            "success": True,
            "transcript": audio_transcript,
            "visual_summary": captions
        }
        return JSONResponse(content=analysis)
    except Exception as e:
        logger.error(f"Video error: {e}")
        if 'tmp_video_path' in locals() and os.path.exists(tmp_video_path):
            os.unlink(tmp_video_path)
        return JSONResponse(status_code=500, content={"success": False, "message": str(e)})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
