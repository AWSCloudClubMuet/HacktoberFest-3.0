"""Single-head NumPy attention. Boolean masks use True for allowed entries."""
from dataclasses import dataclass
import numpy as np

@dataclass(frozen=True)
class Cache:
    q: np.ndarray
    k: np.ndarray
    v: np.ndarray
    p: np.ndarray
    allowed: np.ndarray
    scale: float

def _matrix(value, name):
    value = np.array(value, dtype=np.float64, copy=True)
    if value.ndim != 2 or 0 in value.shape:
        raise ValueError(f'{name} must be a nonempty 2D matrix')
    if not np.isfinite(value).all():
        raise ValueError(f'{name} must contain finite values')
    return value

def probabilities(scores, allowed):
    """Stable row softmax; a row with no allowed key is an invalid input."""
    if not allowed.any(axis=1).all():
        raise ValueError('fully masked rows are not supported')
    scores = np.where(allowed, scores, -np.inf)
    scores = scores - scores.max(axis=1, keepdims=True)
    weights = np.exp(scores)
    return weights / weights.sum(axis=1, keepdims=True)

def forward(q, k, v, causal=False, mask=None):
    """q:(nq,d), k:(nk,d), v:(nk,dv); returns output and backward cache.

    Rectangular attention is supported without a causal flag. Causal mode is
    square self-attention with diagonal entries included. Extra masks combine
    with the causal mask. Inputs are copied so later caller edits are harmless.
    """
    q, k, v = _matrix(q, 'q'), _matrix(k, 'k'), _matrix(v, 'v')
    if q.shape[1] != k.shape[1] or k.shape[0] != v.shape[0]:
        raise ValueError('q/k feature sizes and k/v sequence lengths must match')
    allowed = np.ones((q.shape[0], k.shape[0]), dtype=bool)
    if causal:
        if q.shape[0] != k.shape[0]:
            raise ValueError('causal mode requires equal query/key lengths')
        allowed &= np.tri(q.shape[0], dtype=bool)
    if mask is not None:
        mask = np.asarray(mask)
        if mask.dtype != np.bool_ or mask.shape != allowed.shape:
            raise ValueError('mask must be boolean with shape (nq,nk)')
        allowed &= mask
    scale = 1.0 / np.sqrt(q.shape[1])
    try:
        with np.errstate(over='raise', invalid='raise', divide='raise'):
            p = probabilities((q @ k.T) * scale, allowed)
            out = p @ v
    except FloatingPointError as error:
        raise ValueError('attention arithmetic overflow; reduce input magnitude') from error
    return out, Cache(q, k, v, p, allowed, scale)

def backward(dout, cache):
    """Return gradients of sum(output*dout); no autograd is used."""
    dout = _matrix(dout, 'dout')
    if dout.shape != (cache.q.shape[0], cache.v.shape[1]):
        raise ValueError('dout must have the output shape')
    try:
        with np.errstate(over='raise', invalid='raise'):
            dv = cache.p.T @ dout
            dp = dout @ cache.v.T
            ds = cache.p * (dp - (dp * cache.p).sum(axis=1, keepdims=True))
            ds = np.where(cache.allowed, ds, 0.0)
            dq = (ds @ cache.k) * cache.scale
            dk = (ds.T @ cache.q) * cache.scale
    except FloatingPointError as error:
        raise ValueError('gradient arithmetic overflow; reduce input magnitude') from error
    return {'dq': dq, 'dk': dk, 'dv': dv, 'dp': dp, 'ds': ds}
