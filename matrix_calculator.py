#!/usr/bin/env python3
"""
Matrix Subspace Calculator
Calculates the 4 fundamental subspaces of a matrix A:
1. Column Space C(A)
2. Null Space N(A)  
3. Row Space C(A^T)
4. Left Null Space N(A^T)
"""

import numpy as np
from scipy.linalg import qr, svd
from flask import Flask, request, jsonify
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)

class SubspaceCalculator:
    def __init__(self, matrix):
        self.A = np.array(matrix, dtype=float)
        self.m, self.n = self.A.shape
        self.rank = np.linalg.matrix_rank(self.A)
        
    def get_column_space(self):
        """Get orthonormal basis for column space using QR decomposition"""
        Q, R = qr(self.A, mode='economic')
        # Column space is spanned by first rank columns of Q
        basis = Q[:, :self.rank] if self.rank > 0 else np.zeros((self.m, 1))
        return basis.tolist()
    
    def get_null_space(self):
        """Get orthonormal basis for null space"""
        if self.rank == self.n:
            # Full column rank, null space is just {0}
            return np.zeros((self.n, 1)).tolist()
        
        # Use SVD to find null space
        U, S, Vt = svd(self.A)
        # Null space is spanned by last (n - rank) columns of V
        nullity = self.n - self.rank
        basis = Vt[-nullity:, :].T if nullity > 0 else np.zeros((self.n, 1))
        return basis.tolist()
    
    def get_row_space(self):
        """Get orthonormal basis for row space"""
        # Row space of A = Column space of A^T
        Q, R = qr(self.A.T, mode='economic')
        basis = Q[:, :self.rank] if self.rank > 0 else np.zeros((self.n, 1))
        return basis.tolist()
    
    def get_left_null_space(self):
        """Get orthonormal basis for left null space"""
        if self.rank == self.m:
            # Full row rank, left null space is just {0}
            return np.zeros((self.m, 1)).tolist()
        
        # Left null space is null space of A^T
        U, S, Vt = svd(self.A.T)
        nullity = self.m - self.rank
        basis = Vt[-nullity:, :].T if nullity > 0 else np.zeros((self.m, 1))
        return basis.tolist()
    
    def calculate_all_subspaces(self):
        """Calculate all 4 fundamental subspaces"""
        return {
            "matrix": self.A.tolist(),
            "dimensions": {"m": self.m, "n": self.n, "rank": self.rank},
            "column_space": {
                "name": "Column Space C(A)",
                "dimension": self.rank,
                "ambient": f"R^{self.m}",
                "basis": self.get_column_space()
            },
            "null_space": {
                "name": "Null Space N(A)",
                "dimension": self.n - self.rank,
                "ambient": f"R^{self.n}",
                "basis": self.get_null_space()
            },
            "row_space": {
                "name": "Row Space C(A^T)",
                "dimension": self.rank,
                "ambient": f"R^{self.n}",
                "basis": self.get_row_space()
            },
            "left_null_space": {
                "name": "Left Null Space N(A^T)",
                "dimension": self.m - self.rank,
                "ambient": f"R^{self.m}",
                "basis": self.get_left_null_space()
            },
            "orthogonality": {
                "column_null": "C(A) ⊥ N(A^T) - Orthogonal complements in R^m",
                "row_left_null": "C(A^T) ⊥ N(A) - Orthogonal complements in R^n"
            }
        }

@app.route('/calculate', methods=['POST'])
def calculate():
    try:
        data = request.get_json()
        matrix = data.get('matrix', [])
        
        if not matrix:
            return jsonify({"error": "No matrix provided"}), 400
        
        # Validate matrix dimensions (max 3x3 for visualization)
        m = len(matrix)
        n = len(matrix[0]) if m > 0 else 0
        
        if m > 3 or n > 3:
            return jsonify({"error": "Matrix must be at most 3x3 for visualization"}), 400
        
        calc = SubspaceCalculator(matrix)
        result = calc.calculate_all_subspaces()
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)