"""Milestone 2 experiments: softmax stability, 1/sqrt(d), causal mask, memory, tiled forward."""
import numpy as np

from attention import backward, forward, softmax, tiled_forward


def naive_softmax(x):
    """Textbook softmax with no max subtraction, so exp can overflow."""
    e = np.exp(x)
    return e / e.sum()


def stability_demo():
    print("=== 1. Softmax stability ===")
    logits = np.array([1000.0, 999.0, 998.0])
    with np.errstate(over="ignore", invalid="ignore"):  # the naive version is expected to overflow
        print("naive softmax  :", naive_softmax(logits))
    print("stable softmax :", softmax(logits))
    # Softmax ignores a constant shift, so [2, 1, 0] must give the same answer.
    print("softmax([2,1,0]):", naive_softmax(np.array([2.0, 1.0, 0.0])))
    for dtype in (np.float16, np.float32, np.float64):
        # exp(x) overflows once x is larger than log(largest finite number).
        limit = np.log(float(np.finfo(dtype).max))
        print(f"exp overflows above {limit:.2f} in {np.dtype(dtype).name}")


def attention_stats(Q, K, V, dO, scaled):
    """Logit std, mean of each row's largest weight in P, and ||dS||."""
    d = Q.shape[1]
    # forward() always divides by sqrt(d). Multiplying Q by sqrt(d) first cancels that,
    # which gives the unscaled logits Q Kᵀ without a second version of forward().
    Q_in = Q if scaled else Q * d ** 0.5
    _, cache = forward(Q_in, K, V)
    backward(dO, cache)
    logits = Q_in @ K.T / d ** 0.5
    return np.std(logits), cache["P"].max(axis=-1).mean(), np.linalg.norm(cache["dS"])


def scaling_experiment():
    print("\n=== 2. Why scale by 1/sqrt(d) (n = m = 128, d_v = 64) ===")
    print(f"{'d':>5} | {'scaled: std':>11} {'maxP':>6} {'||dS||':>9} | "
          f"{'unscaled: std':>13} {'maxP':>6} {'||dS||':>9}")
    rng = np.random.default_rng(0)
    for d in (16, 64, 256, 1024):
        Q = rng.standard_normal((128, d))
        K = rng.standard_normal((128, d))
        V = rng.standard_normal((128, 64))
        dO = rng.standard_normal((128, 64))
        std_s, maxp_s, ds_s = attention_stats(Q, K, V, dO, scaled=True)
        std_u, maxp_u, ds_u = attention_stats(Q, K, V, dO, scaled=False)
        print(f"{d:>5} | {std_s:>11.3f} {maxp_s:>6.3f} {ds_s:>9.3e} | "
              f"{std_u:>13.3f} {maxp_u:>6.3f} {ds_u:>9.3e}")


def causal_checks():
    print("\n=== 3. Causal mask (n = 6) ===")
    n = 6
    rng = np.random.default_rng(0)
    Q = rng.standard_normal((n, 8))
    K = rng.standard_normal((n, 8))
    V = rng.standard_normal((n, 4))
    dO = rng.standard_normal((n, 4))
    O, cache = forward(Q, K, V, causal=True)
    dQ, _, _ = backward(dO, cache)

    # Query 0 sees only key 0, so P[0, 0] = 1 and its gradient cancels exactly.
    print(f"dQ[0] exactly zero           : {np.all(dQ[0] == 0)}")

    # Changing key or value j must not affect any query i < j, because those queries cannot see j.
    largest_change = 0.0
    for j in range(n):
        K_changed = K.copy()
        K_changed[j] += rng.standard_normal(8)
        O_new, _ = forward(Q, K_changed, V, causal=True)
        largest_change = max(largest_change, np.abs(O_new[:j] - O[:j]).max(initial=0.0))

        V_changed = V.copy()
        V_changed[j] += rng.standard_normal(4)
        O_new, _ = forward(Q, K, V_changed, causal=True)
        largest_change = max(largest_change, np.abs(O_new[:j] - O[:j]).max(initial=0.0))
    print(f"O[i<j] unchanged by K[j], V[j]: {largest_change == 0}  (max change {largest_change:.1e})")

    masked = np.triu(np.ones((n, n), dtype=bool), k=1)  # True where j > i
    print(f"dS == 0 at masked positions  : {np.all(cache['dS'][masked] == 0)}  ({masked.sum()} entries)")


def format_size(num_bytes):
    if num_bytes >= 2**30:
        return f"{num_bytes / 2**30:.2f} GiB"
    return f"{num_bytes / 2**20:.0f} MiB"


def memory_table():
    print("\n=== 4. Memory for one n x n matrix (S or P), one head ===")
    print(f"{'n':>7} {'fp16':>10} {'fp32':>10}")
    for n in (1024, 4096, 16384, 65536):
        fp16 = format_size(n * n * 2)  # 2 bytes per number
        fp32 = format_size(n * n * 4)  # 4 bytes per number
        print(f"{n // 1024:>6}k {fp16:>10} {fp32:>10}")
    print("Multiply by batch x heads x layers; P is also kept for backward.")


def logsumexp(S):
    """Per-row log(sum(exp(S))), computed stably."""
    row_max = S.max(axis=-1)
    return np.log(np.exp(S - row_max[:, None]).sum(axis=-1)) + row_max


def tiled_check():
    print("\n=== 5. Tiled forward vs naive (n=37, m=53, d=16, d_v=8) ===")
    rng = np.random.default_rng(0)
    Q = rng.standard_normal((37, 16))
    K = rng.standard_normal((53, 16))
    V = rng.standard_normal((53, 8))
    O_naive, _ = forward(Q, K, V)
    lse_naive = logsumexp(Q @ K.T / 16 ** 0.5)

    print(f"{'block':>5} {'max |O diff|':>13} {'max |lse diff|':>15} {'< 1e-12':>8}")
    # 53 is not a multiple of most block sizes, so the last block is usually partial.
    for block in (1, 3, 7, 16, 53):
        O_tiled, lse_tiled = tiled_forward(Q, K, V, block)
        o_diff = np.abs(O_tiled - O_naive).max()
        lse_diff = np.abs(lse_tiled - lse_naive).max()
        both_ok = o_diff < 1e-12 and lse_diff < 1e-12
        print(f"{block:>5} {o_diff:>13.2e} {lse_diff:>15.2e} {str(both_ok):>8}")


if __name__ == "__main__":
    stability_demo()
    scaling_experiment()
    causal_checks()
    memory_table()
    tiled_check()
