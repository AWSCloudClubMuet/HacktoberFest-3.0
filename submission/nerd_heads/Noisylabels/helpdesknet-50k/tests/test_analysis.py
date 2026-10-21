from src.analysis import corrected_accuracy, stratified_interval, tier_test, wilson_interval, CONFUSIONS

def test_error_totals():
    assert sum(x[2] for x in CONFUSIONS) == 60

def test_wilson_bounds():
    lo, hi = wilson_interval(60,400)
    assert .11 < lo < .13 and .18 < hi < .20

def test_weighted_rate():
    rate, (lo,hi) = stratified_interval()
    assert abs(rate-.15084) < .0001
    assert lo < rate < hi

def test_tier_comparison():
    assert tier_test()['two_sided_p'] < .05

def test_accuracy():
    assert abs(corrected_accuracy()-.9634146341463414) < 1e-12
