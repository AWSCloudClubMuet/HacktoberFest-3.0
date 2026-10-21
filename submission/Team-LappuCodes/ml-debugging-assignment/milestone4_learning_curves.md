# Milestone 4: Learning Curves and Model Diagnosis

## 1. Introduction

Learning curves help us understand how a machine learning model performs on training and validation data. By comparing training and validation accuracy, we can identify possible underfitting, overfitting, and generalization problems.

This milestone analyzes four scenarios and suggests experiments to diagnose and improve model performance.

## 2. Scenario A: Underfitting

**Given:**
- Training accuracy: 62%
- Validation accuracy: 60%
- Both curves are flat.

**Diagnosis: Underfitting (High Bias)**

Both training and validation accuracy are low and close to each other. This indicates that the model may be too simple to learn the underlying patterns in the data.

**Possible causes:**
- The model has insufficient complexity.
- The input features are not informative enough.
- Regularization is too strong.
- The model has not trained sufficiently.

**Suggested solutions:**
- Increase model complexity.
- Improve feature engineering.
- Reduce excessive regularization.
- Tune the learning rate and training duration.

**Experiment:** Increase the model's capacity while keeping the dataset and evaluation procedure unchanged. If training and validation accuracy both improve, underfitting was likely a major problem.

## 3. Scenario B: Overfitting

**Given:**
- Training accuracy: 99%
- Validation accuracy: 78%
- The gap slowly shrinks but remains large.

**Diagnosis: Overfitting (High Variance)**

The model performs extremely well on training data but considerably worse on validation data. It may be memorizing training examples rather than learning patterns that generalize to unseen data.

**Possible causes:**
- The model is too complex.
- The training dataset is too small or unrepresentative.
- The model is trained for too long.
- Regularization is insufficient.

**Suggested solutions:**
- Apply early stopping.
- Use dropout or weight decay where appropriate.
- Collect more representative training data.
- Simplify the model if necessary.

**Experiment:** Train the same model with stronger regularization and compare its validation accuracy with the original model. An improvement in validation performance and a smaller generalization gap would support the overfitting diagnosis.

## 4. Scenario C: Validation Accuracy Exceeds Training Accuracy

**Given:**
- Training accuracy: 85%
- Validation accuracy: 91%
- Both curves rise slightly.

**Diagnosis: Potentially Healthy Generalization**

Validation accuracy can exceed training accuracy when training uses regularization techniques such as dropout or data augmentation. These techniques make training more difficult, while evaluation is usually performed without dropout and without random training-time augmentation.

However, this pattern alone does not prove that the model generalizes well. The validation set may be easier than the training set, or there may be data leakage or distribution differences.

**Suggested actions:**
- Check whether dropout and augmentation are applied differently during training and evaluation.
- Verify that training and validation data are representative.
- Check for data leakage.
- Evaluate the final model on an independent test set.

**Experiment:** Evaluate training data in evaluation mode, with dropout disabled and without random training-time augmentation. Compare its accuracy with validation accuracy using the same evaluation procedure. This helps identify whether the difference is caused by training-time regularization or dataset differences.

## 5. Scenario D: Persistent Generalization Gap

**Given:**
- Training accuracy: 88%
- Validation accuracy: 70%
- The gap remains even after using four times more data.

**Diagnosis: Persistent Generalization Gap Requiring Investigation**

The model performs substantially better on training data than on validation data. Since increasing the amount of data does not remove the gap, simply collecting more data may not solve the problem.

**Possible causes:**

1. **Distribution shift:** Training and validation data may come from different distributions.
2. **Data leakage:** Information unavailable at prediction time may influence training, or the evaluation procedure may be flawed.
3. **Preprocessing mismatch:** Training and validation data may be processed differently.
4. **Label noise:** Training or validation labels may be inaccurate or inconsistent.
5. **Model complexity:** The model may still overfit or fail to generalize.
6. **Non-representative data:** The training set may not reflect the examples encountered in real-world use.

**Experiment to distinguish the causes:**

First, compare feature distributions, label distributions, preprocessing steps, and label quality between training and validation data. Also check for leakage.

Next, evaluate the model on a validation subset sampled from the same distribution as the training data.

- If performance improves substantially on the same-distribution validation subset, distribution shift is a likely explanation.
- If the gap remains, investigate overfitting, label noise, preprocessing, and leakage.
- Compare a regularized model with the original model to determine whether reducing model complexity improves generalization.

## 6. Summary Table

| Scenario | Diagnosis | Recommended action |
|---|---|---|
| A | Underfitting / high bias | Increase model capacity or improve features |
| B | Overfitting / high variance | Regularization, early stopping, or more representative data |
| C | Potentially healthy generalization | Check evaluation mode, data quality, and leakage |
| D | Persistent generalization gap | Investigate distribution shift and other data/model issues |

## 7. Conclusion

Learning curves are useful for diagnosing machine learning model behavior. Low and similar training and validation accuracy may indicate underfitting, while a large gap may indicate overfitting or a data-related problem. Validation accuracy higher than training accuracy can occur because of regularization or differences between datasets.

However, learning curves alone cannot establish the exact cause of every problem. Controlled experiments, careful data splitting, leakage checks, and independent test evaluation are necessary to confirm diagnoses and improve generalization.

The Python demonstration for this milestone uses illustrative curves based on the given scenarios. It explains the diagnostic reasoning but does not train a model on a real dataset.
