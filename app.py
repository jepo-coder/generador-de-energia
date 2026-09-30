"""API Flask opcional: sirve el sitio y calcula la simulación con generador.py."""
from pathlib import Path

from flask import Flask, abort, jsonify, request, send_from_directory

from generador import Agua, RuedaAgua, SistemaHidraulico

RAIZ = Path(__file__).resolve().parent.parent
app = Flask(__name__)


@app.get("/api/simular")
def simular():
    try:
        altura = float(request.args.get("altura", 1))
        masa = float(request.args.get("masa", 0.5))
        perdidas = float(request.args.get("perdidas", 50)) / 100
        return jsonify(SistemaHidraulico(Agua(masa, altura), RuedaAgua(perdidas)).simular())
    except ValueError as error:
        return jsonify(error=str(error)), 400


@app.get("/")
def inicio():
    return send_from_directory(RAIZ, "index.html")


@app.get("/<carpeta>/<path:archivo>")
def estaticos(carpeta, archivo):
    if carpeta not in {"css", "js", "assets"}:
        abort(404)
    return send_from_directory(RAIZ / carpeta, archivo)


if __name__ == "__main__":
    app.run(debug=True)
