from flask import Flask, request, jsonify
from flask_cors import CORS
from paddleocr import PaddleOCR
from PIL import Image
import io

app = Flask(__name__)
CORS(app)

ocr = PaddleOCR(
    use_angle_cls=False,
    det_limit_side_len=512,  # ou même 320 si possible
    lang='fr'  # ou 'en' selon tes screenshots
)

@app.route('/ocr', methods=['POST'])
def ocr_stats():
    if 'image' not in request.files:
        return jsonify({'error': 'No image'}), 400
    img = Image.open(request.files['image'].stream)
    img.thumbnail((1024, 1024))
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes = img_bytes.getvalue()
    result = ocr.ocr(img_bytes, cls=False)
    # Correction : ne traite que les lignes qui sont bien des listes
    lines = []
    for line in result[0]:
        if isinstance(line, list):
            # line = [[box, (text, conf)], ...]
            words = []
            for word_info in line:
                if isinstance(word_info, list) and len(word_info) > 1 and isinstance(word_info[1], tuple):
                    words.append(word_info[1][0])
            if words:
                lines.append(' '.join(words))
    full_text = '\n'.join(lines)
    return jsonify({'lines': lines, 'full_text': full_text})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)