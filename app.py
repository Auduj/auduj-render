from flask import Flask, request, jsonify
from paddleocr import PaddleOCR
from PIL import Image
import io

app = Flask(__name__)
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
    # Redimensionner l'image pour limiter la RAM
    img.thumbnail((1024, 1024))
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes = img_bytes.getvalue()
    result = ocr.ocr(img_bytes, cls=False)  # cls=False pour économiser la RAM
    # Récupère toutes les lignes reconnues
    lines = [' '.join([word_info[1][0] for word_info in line]) for line in result[0]]
    full_text = '\n'.join(lines)
    return jsonify({'lines': lines, 'full_text': full_text})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)