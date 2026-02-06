# Strang 4 Fundamental Subspaces Visualizer

An interactive visualization of the four fundamental subspaces in linear algebra, based on Gilbert Strang's teachings.

## The Four Fundamental Subspaces

For any m × n matrix A:

1. **Column Space C(A)** - All possible outputs Ax (in R^m)
2. **Null Space N(A)** - All solutions to Ax = 0 (in R^n)
3. **Row Space C(A^T)** - All combinations of rows (in R^n)
4. **Left Null Space N(A^T)** - All solutions to A^T y = 0 (in R^m)

## Features

- Interactive 3D visualization (up to 3×3 matrices)
- Real-time matrix input
- Visual representation of all 4 subspaces
- Orthogonality relationships shown
- Educational tool for linear algebra students

## Installation

```bash
npm install
python3 -m pip install -r requirements.txt
```

## Usage

```bash
npm start
```

Then open http://localhost:3000 in your browser.

## Technology Stack

- **Frontend**: Node.js, Express, Three.js
- **Backend**: Python, NumPy, SciPy
- **Math**: Linear algebra computations for subspace calculations