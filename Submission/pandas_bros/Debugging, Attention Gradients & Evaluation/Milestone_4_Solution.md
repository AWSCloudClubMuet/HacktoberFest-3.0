# Milestone 4: Learning Curves

## Case A: Train 62%, Val 60%, both flat
**Diagnosis:** underfitting (high bias). The model is too weak, or the features carry little signal. Both scores are low and close together.

**Fixes:**
- Use a bigger or more powerful model.
- Add better features.
- Train longer or tune the learning rate.
- Reduce regularization.

**Why:** more data won't help, because the model can't even fit the data it already has. Also check for a bug, such as wrong labels.

## Case B: Train 99%, Val 78%, gap shrinks slowly
**Diagnosis:** overfitting (high variance). The model memorizes the training data but doesn't generalize.

**Fixes:**
- Add more data, since validation is still improving.
- Add regularization (dropout, weight decay) and early stopping.
- Use data augmentation.
- Use a smaller model or fewer features.

**Why:** these reduce memorization. More data helps, but it works slowly because the gap is large.

## Case C: Train 85%, Val 91%, both rise slightly
**Diagnosis:** validation is higher than train, which is unusual. Likely causes:
- Dropout or augmentation is active when measuring train accuracy but off for validation.
- Validation is an easier or different set.
- Validation leaks (duplicates of training rows).

The model is also still learning, since both curves are rising.

**Fixes:**
- Measure train accuracy in eval mode.
- Check the split for duplicates and leakage.
- Train longer.

**Why:** if the train/validation gap disappears after these checks, the result was an artifact. If it stays, you need a harder, more representative validation set.

## Case D: Train 88%, Val 70%, gap stays with 4× data
A gap that doesn't close with more data means the problem is **not** simply "too little data".

**Two plausible explanations:**
1. **Distribution shift:** train and validation come from different data (different time, source or class mix).
2. **Label noise or leakage in train:** the model memorizes noisy or duplicated training examples, and this doesn't generalize.

(A third: the model is too large and memorizes, but more data would normally help here.)

**One experiment to tell them apart:** create a small **train-dev set**, a slice of data taken from the *same distribution as training* and held out from training. Evaluate on it.
- If train-dev accuracy is **about 70%** (low) → memorization or noise or leakage in train.
- If train-dev accuracy is **about 88%** (close to train) → distribution shift between train and validation.

**Why it works:** it separates "the model can't generalize at all" from "the validation data is just different".

> **Note:** These are the standard diagnoses for these patterns, but they are inferred from the accuracy numbers alone. Confirm them with the checks above on your actual data.