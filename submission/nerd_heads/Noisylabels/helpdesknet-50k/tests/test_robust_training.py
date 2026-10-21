
import numpy as np
import pytest

from src.robust_training import (
    smooth_target,
    cross_entropy,
)


def test_smoothed_target_sums_to_one():
    target = smooth_target(1, num_classes=6, epsilon=0.1)
    assert np.isclose(target.sum(), 1.0)


def test_smoothed_target_values():
    target = smooth_target(1, num_classes=6, epsilon=0.1)
    assert np.isclose(target[1], 0.9166666667)
    assert np.allclose(np.delete(target, 1), 1 / 60)


def test_no_smoothing_is_one_hot():
    target = smooth_target(1, num_classes=6, epsilon=0.0)
    assert target[1] == 1.0
    assert np.count_nonzero(target) == 1


def test_invalid_epsilon():
    with pytest.raises(ValueError):
        smooth_target(1, epsilon=1.5)


def test_cross_entropy_matches_expected():
    target = np.array([1.0, 0.0])
    predictions = np.array([0.7, 0.3])

    loss = cross_entropy(target, predictions)

    assert np.isclose(loss, -np.log(0.7))
