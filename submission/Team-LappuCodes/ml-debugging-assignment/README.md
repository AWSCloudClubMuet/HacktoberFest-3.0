# Machine Learning Debugging, Gradients & Evaluation

## Project Overview

This project focuses on debugging machine learning pipelines, verifying neural network gradients, evaluating fraud detection models, and diagnosing learning curves. It demonstrates important machine learning concepts through Python scripts, numerical experiments, evaluation metrics, and visualizations.

The project is divided into four milestones, each addressing a different machine learning problem.

## Objectives

- Identify common machine learning pipeline bugs and understand their effects.
- Implement scaled dot-product attention and verify its gradients using numerical gradient checking.
- Evaluate a fraud detection model using metrics suitable for highly imbalanced datasets.
- Diagnose underfitting, overfitting, and generalization problems using learning curves.

## Project Structure

```text
ml-debugging-assignment/
│
├── requirements.txt
│
├── milestone1_debugging.py
├── milestone1_answer.md
│
├── milestone2_attention.py
├── milestone2_answer.md
│
├── milestone3_fraud_detection.py
├── milestone3_answer.md
│
├── milestone4_learning_curves.py
├── milestone4_answer.md
│
├── milestone4_graphs/
│
├── final_technical_report.md
└── README.md
```

## Technologies Used

- Python
- NumPy
- PyTorch
- Scikit-learn
- Matplotlib
- Pandas

## Installation and Setup

### 1. Install Python

Install Python 3.10 or a compatible version and ensure Python is added to your system PATH.

### 2. Open the Project

Open the project folder in Visual Studio Code.

### 3. Create a Virtual Environment

Open the VS Code terminal and run:

```powershell
python -m venv .venv
```

### 4. Activate the Virtual Environment

On Windows PowerShell, run:

```powershell
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, you can run the project's Python executable directly using the commands shown below without activating the environment.

### 5. Install Dependencies

```powershell
python -m pip install -r requirements.txt
```

If the virtual environment is not activated, use:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

## How to Run the Project

Run each milestone separately from the project directory.

### Milestone 1: Machine Learning Pipeline Debugging

```powershell
python milestone1_debugging.py
```

This milestone demonstrates common pipeline problems, including data leakage, incorrect data alignment, evaluation-mode issues, and training/evaluation practices.

### Milestone 2: Attention and Gradient Checking

```powershell
python milestone2_attention.py
```

This milestone implements scaled dot-product attention and checks analytical gradients against numerical gradients using finite differences.

The successful gradient checks reported during testing were:

- Gradient for Q: relative error approximately `3.847e-10`
- Gradient for K: relative error approximately `8.348e-09`
- Gradient for V: relative error approximately `5.847e-11`

These results indicate close agreement between the analytical and numerical gradients for the tested inputs.

### Milestone 3: Fraud Detection Evaluation

```powershell
python milestone3_fraud_detection.py
```

This milestone demonstrates fraud detection on a highly imbalanced synthetic dataset. It uses a chronological data split, training-only preprocessing, threshold selection, and evaluation metrics such as precision, recall, and PR-AUC.

One reported test run produced:

- Test PR-AUC (average precision): `0.6877`
- Precision: `0.2143`
- Recall: `0.7500`
- True positives: `3`
- False positives: `11`
- False negatives: `1`

The script also reports the estimated cost of false-positive and false-negative decisions.

### Milestone 4: Learning Curve Diagnosis

```powershell
python milestone4_learning_curves.py
```

This milestone examines learning-curve patterns to identify underfitting, overfitting, and possible generalization problems. The script generates visualizations in the `milestone4_graphs/` directory.

## Main Findings

### Milestone 1

Machine learning results can be misleading when data preprocessing, feature-label alignment, or evaluation procedures are incorrect. A reliable pipeline must prevent data leakage and keep training and evaluation procedures consistent.

### Milestone 2

Numerical gradient checking provides a practical way to verify manually implemented backpropagation. Very small relative errors indicate that the analytical gradients agree closely with finite-difference estimates for the tested inputs.

### Milestone 3

Accuracy alone is not sufficient for highly imbalanced fraud detection. Precision, recall, PR-AUC, decision thresholds, and the costs of different types of errors provide a more useful evaluation.

### Milestone 4

Learning curves help distinguish high bias from high variance and can reveal possible distribution mismatch or pipeline problems. Diagnosis should be followed by targeted experiments rather than relying on the graph alone.

## Limitations

- The fraud detection experiment uses synthetic data and does not establish performance on real financial transactions.
- The learning-curve visualizations are illustrative and should not be interpreted as results from training a real model unless the script explicitly performs that training.
- Gradient-checking results apply to the tested implementation and inputs.
- Real-world fraud systems require additional checks for delayed labels, changing data distributions, calibration, and operational costs.

## Project Documentation

The project includes individual Markdown answer files for each milestone:

- `milestone1_answer.md`
- `milestone2_answer.md`
- `milestone3_answer.md`
- `milestone4_answer.md`

The file `final_technical_report.md` provides the detailed technical discussion, methodology, results, and analysis for the project.

## Conclusion

This project demonstrates practical machine learning debugging and evaluation techniques, from identifying pipeline issues and verifying gradients to evaluating imbalanced classification and interpreting learning curves. It emphasizes reliable experimental design, appropriate evaluation metrics, and careful interpretation of results.
