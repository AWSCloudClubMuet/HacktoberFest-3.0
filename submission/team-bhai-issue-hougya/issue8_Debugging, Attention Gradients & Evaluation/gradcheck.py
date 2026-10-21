"""Numerical gradient check for attention.backward, plus a sweep over the step size h."""
import matplotlib
matplotlib.use("Agg")  # save the plot to a file; no window needed
import matplotlib.pyplot as plt
import numpy as np

from attention import backward, forward

# Central differences have truncation error ~h² and round-off error ~ε/h.
# The total is smallest near h ≈ ε^(1/3) ≈ 6e-6 for float64, so 1e-6 sits right next to it.
H = 1e-6


def relative_error(analytic, numeric):
    # The 1e-12 floor avoids dividing by zero when both gradients are zero.
    diff = np.linalg.norm(analytic - numeric)
    return diff / max(np.linalg.norm(analytic) + np.linalg.norm(numeric), 1e-12)


def verdict(error):
    if error < 1e-7:
        return "PASS"
    if error <= 1e-4:
        return "WARN"
    return "FAIL"


def random_inputs(seed, n, m, d=5, d_v=3, dtype=np.float64):
    """Random Q (n,d), K (m,d), V (m,d_v) and loss weights G (n,d_v)."""
    rng = np.random.default_rng(seed)
    Q = rng.standard_normal((n, d)).astype(dtype)
    K = rng.standard_normal((m, d)).astype(dtype)
    V = rng.standard_normal((m, d_v)).astype(dtype)
    G = rng.standard_normal((n, d_v)).astype(dtype)
    return Q, K, V, G


def numerical_gradient(X, compute_loss, h):
    """Nudge each entry of X up and down by h. X is changed in place and then restored."""
    grad = np.zeros_like(X)
    for index in np.ndindex(X.shape):
        original = X[index]
        X[index] = original + h
        loss_up = compute_loss()
        X[index] = original - h
        loss_down = compute_loss()
        X[index] = original
        grad[index] = (loss_up - loss_down) / (2 * h)
    return grad


def gradient_errors(Q, K, V, G, causal=False, h=H):
    """Relative errors of backward() against central differences, for dQ, dK and dV."""

    def compute_loss():
        # L = sum(O * G), so dL/dO = G exactly and G can be passed to backward as dO.
        O, _ = forward(Q, K, V, causal)
        return (O * G).sum()

    _, cache = forward(Q, K, V, causal)
    dQ, dK, dV = backward(G, cache)
    return [relative_error(analytic, numerical_gradient(X, compute_loss, h))
            for X, analytic in ((Q, dQ), (K, dK), (V, dV))]


def property_checks():
    """Return (max |row sum of dS|, max |rowsum(P⊙dP) - rowsum(dO⊙O)|)."""
    Q, K, V, G = random_inputs(3, 4, 6)
    O, cache = forward(Q, K, V)
    backward(G, cache)
    # Softmax ignores a constant added to a whole row, so each row of dS must sum to 0.
    row_sum_error = np.abs(cache["dS"].sum(axis=-1)).max()
    # D computed two ways; the O form is what FlashAttention uses, since it never stores P.
    D_from_P = (cache["P"] * (G @ V.T)).sum(axis=-1)
    D_from_O = (G * O).sum(axis=-1)
    return row_sum_error, np.abs(D_from_P - D_from_O).max()


def print_row(case, tensor, error, note=""):
    print(f"{case:<24} {tensor:<7} {error:<11.3e} {verdict(error)}{note}")


def step_size_sweep(Q, K, V, G):
    """Repeat the check for h from 1e-1 down to 1e-12, print the table and save h_sweep.png."""
    hs = np.logspace(-1, -12, 23)
    errors = np.array([gradient_errors(Q, K, V, G, h=h) for h in hs])  # (23, 3): columns dQ, dK, dV

    print("\nh-sweep on case a")
    print(f"{'h':<10} {'dQ':<11} {'dK':<11} dV")
    for h, (err_q, err_k, err_v) in zip(hs, errors):
        print(f"{h:<10.1e} {err_q:<11.3e} {err_k:<11.3e} {err_v:.3e}")
    best_h = hs[errors.argmin(axis=0)]
    print(f"best h: dQ {best_h[0]:.1e}, dK {best_h[1]:.1e}, dV {best_h[2]:.1e}")

    plt.figure(figsize=(6, 4))
    for name, column in zip(("dQ", "dK", "dV"), errors.T):
        plt.loglog(hs, column, marker="o", label=name)
    plt.axvline(H, color="gray", linestyle="--", label="h = 1e-6")
    plt.axhline(1e-7, color="green", linestyle=":", label="PASS line 1e-7")
    plt.xlabel("step size h")
    plt.ylabel("relative error")
    plt.title("Gradient check error vs h (float64)")
    plt.grid(True, which="both", alpha=0.3)
    plt.legend()
    plt.tight_layout()
    plt.savefig("h_sweep.png", dpi=120)


def main():
    case_a = random_inputs(0, 4, 6)                # n != m, so a missing transpose fails loudly
    Q, K, V, G = random_inputs(1, 4, 6)
    case_b = (Q * 30, K, V, G)                     # large logits push the softmax to saturate
    case_c = random_inputs(2, 5, 5)                # causal mask needs n == m
    case_f = random_inputs(0, 4, 6, dtype=np.float32)

    print(f"Gradient check (h = {H:g}, PASS < 1e-07, FAIL > 1e-04)")
    print(f"{'case':<24} {'tensor':<7} {'rel. error':<11} verdict")
    for case, errors in (("a) random n=4 m=6", gradient_errors(*case_a)),
                         ("b) large logits Qx30", gradient_errors(*case_b)),
                         ("c) causal n=m=5", gradient_errors(*case_c, causal=True))):
        for tensor, error in zip("QKV", errors):
            print_row(case, tensor, error)
    row_sum_error, D_error = property_checks()
    print_row("d) rowsum(dS) = 0", "dS", row_sum_error)
    print_row("e) D identity", "D", D_error)
    # float32 is only a demonstration of why the check must run in float64
    for tensor, error in zip("QKV", gradient_errors(*case_f)):
        print_row("f) float32 (case a)", tensor, error, note=" (demo)")
    print("(d and e are max absolute deviations, not relative errors)")

    step_size_sweep(*case_a)


if __name__ == "__main__":
    main()
