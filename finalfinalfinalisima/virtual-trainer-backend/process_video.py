# Fichero: process_video.py (Versión Final)

import tensorflow as tf
import tensorflow_hub as hub
import numpy as np
import cv2
import json
import sys
import os

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
tf.get_logger().setLevel('ERROR')

def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)

MODEL_URL = "https://tfhub.dev/google/movenet/singlepose/lightning/4"
INPUT_SIZE = 192

KEYPOINT_DICT = {
    0: 'nose', 1: 'left_eye', 2: 'right_eye', 3: 'left_ear', 4: 'right_ear',
    5: 'left_shoulder', 6: 'right_shoulder', 7: 'left_elbow', 8: 'right_elbow',
    9: 'left_wrist', 10: 'right_wrist', 11: 'left_hip', 12: 'right_hip',
    13: 'left_knee', 14: 'right_knee', 15: 'left_ankle', 16: 'right_ankle'
}

def process_video_and_extract_poses(video_path):
    eprint("[Python] Iniciando el procesamiento del video...")
    
    try:
        eprint("[Python] Cargando el modelo MoveNet...")
        model = hub.load(MODEL_URL)
        movenet = model.signatures['serving_default']
        eprint("[Python] Modelo MoveNet cargado.")
    except Exception as e:
        raise RuntimeError(f"Fallo al cargar el modelo de TensorFlow Hub: {e}")

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise IOError(f"No se pudo abrir el video con OpenCV: {video_path}")
    eprint("[Python] Video abierto con OpenCV.")

    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    
    all_frame_poses = []
    
    frame_count = 0
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_skip = max(1, round(fps / 15))
    eprint(f"[Python] Procesando a ~15 FPS (saltando cada {frame_skip} frames).")
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        if frame_count % frame_skip != 0:
            frame_count += 1
            continue
            
        image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        image_tensor = tf.convert_to_tensor(image_rgb, dtype=tf.uint8)
        
        input_image = tf.expand_dims(image_tensor, axis=0)
        input_image = tf.image.resize_with_pad(input_image, INPUT_SIZE, INPUT_SIZE)
        input_image = tf.cast(input_image, dtype=tf.int32)

        results = movenet(input_image)
        keypoints_with_scores = results['output_0'].numpy()
        
        keypoints = np.squeeze(keypoints_with_scores)
        
        frame_keypoints = []
        # --- ¡AQUÍ ESTÁ LA CORRECCIÓN FINAL! ---
        for i in range(keypoints.shape[0]):
            y, x, score = keypoints[i]
            frame_keypoints.append({
                "part": KEYPOINT_DICT.get(i),
                "x": float(x * frame_width),
                "y": float(y * frame_height),
                "score": float(score)
            })
        
        all_frame_poses.append(frame_keypoints)
        frame_count += 1

    cap.release()
    eprint(f"[Python] Análisis completado. Se procesaron {len(all_frame_poses)} frames.")
    
    return {
        "video_path": video_path,
         "video_width": frame_width,    # <-- AÑADE ESTA LÍNEA
        "video_height": frame_height,  # <-- AÑADE ESTA LÍNEA
        "total_frames": len(all_frame_poses),
        "keypoints_sequence": all_frame_poses
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        eprint("Error: Se requiere la ruta del video.")
        print(json.dumps({"error": "Argumento de ruta de video faltante."}))
        sys.exit(1)
        
    video_file_path = sys.argv[1]
    
    try:
        pose_data = process_video_and_extract_poses(video_file_path)
        print(json.dumps(pose_data))
    except Exception as e:
        eprint(f"ERROR FATAL en process_video.py: {e}")
        print(json.dumps({"error": str(e)}))
        sys.exit(1)