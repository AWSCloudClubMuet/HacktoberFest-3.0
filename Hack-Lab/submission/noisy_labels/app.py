"""
LabelGuard AI - Data-Centric AI Platform for Noisy Label Auditing & Cleansing
Interactive Streamlit Application for Hackathon 2026
"""

import io
import json
import joblib
import numpy as np
import pandas as pd
import streamlit as st

from src.datasets import load_benchmark_dataset, load_custom_csv, inject_noise
from src.noise_detector import LabelNoiseAuditor
from src.remediation import DatasetHealer
from src.benchmark import run_benchmark
from src.visualizer import (
    plot_latent_space,
    plot_noise_transition_matrix,
    plot_noise_score_distribution,
    plot_benchmark_comparison,
    plot_confusion_matrices,
)

# -----------------------------------------------------------------------------
# Streamlit Page Setup & Custom Styling
# -----------------------------------------------------------------------------
st.set_page_config(
    page_title="LabelGuard AI | Data-Centric AI Studio",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown(
    """
    <style>
    .main-header {
        font-size: 2.2rem;
        font-weight: 800;
        background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0px;
    }
    .sub-header {
        font-size: 1.05rem;
        color: #9E9E9E;
        margin-bottom: 20px;
    }
    .metric-card {
        background-color: #1a1c23;
        border: 1px solid #2e3440;
        border-radius: 8px;
        padding: 16px;
        text-align: center;
    }
    .metric-title {
        font-size: 0.85rem;
        color: #8892b0;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .metric-value {
        font-size: 1.8rem;
        font-weight: 700;
        color: #64ffda;
        margin-top: 4px;
    }
    .metric-delta {
        font-size: 0.85rem;
        color: #a8b2d1;
    }
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
    }
    .stTabs [data-baseweb="tab"] {
        padding: 8px 18px;
        font-weight: 600;
        border-radius: 6px 6px 0 0;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# -----------------------------------------------------------------------------
# Initialize Session State
# -----------------------------------------------------------------------------
if "X_raw" not in st.session_state:
    st.session_state.X_raw = None
    st.session_state.y_raw = None
    st.session_state.class_names = []
    st.session_state.y_noisy = None
    st.session_state.is_corrupted = None
    st.session_state.noise_metadata = {}
    st.session_state.audit_df = None
    st.session_state.auditor = None
    st.session_state.X_clean = None
    st.session_state.y_clean = None
    st.session_state.remediation_summary = None
    st.session_state.benchmark_results = None
    st.session_state.manual_overrides = {}

# -----------------------------------------------------------------------------
# Sidebar Configuration
# -----------------------------------------------------------------------------
with st.sidebar:
    st.markdown("### 🛡️ **LabelGuard AI**")
    st.caption("Data-Centric AI Platform • Hacktoberfest 2026")
    st.markdown("---")

    st.subheader("1. Dataset Source")
    data_source = st.radio(
        "Choose Data Origin",
        ["Built-in Benchmark", "Upload Custom CSV"],
        index=0,
    )

    if data_source == "Built-in Benchmark":
        benchmark_choice = st.selectbox(
            "Select Benchmark Dataset",
            [
                "Breast Cancer Diagnostic (Healthcare)",
                "Wine Quality (Chemical Profiling)",
                "Handwritten Digits (10 Classes)",
                "Synthetic Multiclass Challenge",
            ],
            index=0,
        )
        custom_file = None
    else:
        custom_file = st.file_uploader("Upload CSV File", type=["csv"])
        target_col_input = st.text_input("Target Column Name", value="target")

    st.markdown("---")
    st.subheader("2. Noise Simulation Lab")
    inject_noise_enabled = st.checkbox("Inject Controllable Label Noise", value=True)

    if inject_noise_enabled:
        noise_rate = st.slider("Corruption Rate (%)", min_value=0, max_value=50, value=20, step=5) / 100.0
        noise_type = st.selectbox(
            "Noise Mechanism",
            ["symmetric", "asymmetric"],
            format_func=lambda x: "Symmetric (Uniform Random)" if x == "symmetric" else "Asymmetric (Class Swap / Confusion)",
        )
    else:
        noise_rate = 0.0
        noise_type = "symmetric"

    st.markdown("---")
    st.subheader("3. DCAI Auditor Settings")
    base_model_choice = st.selectbox(
        "Cross-Validation Auditor Model",
        ["rf", "lr"],
        format_func=lambda x: "Random Forest (Non-linear)" if x == "rf" else "Logistic Regression (Linear)",
    )
    cv_splits = st.slider("Stratified K-Folds", min_value=3, max_value=10, value=5)
    knn_k = st.slider("k-NN Neighborhood Size", min_value=3, max_value=25, value=10)
    suspect_threshold = st.slider("Suspect Flagging Threshold", min_value=0.30, max_value=0.80, value=0.50, step=0.05)

    load_btn = st.button("🚀 Load Data & Run Audit", use_container_width=True, type="primary")

# -----------------------------------------------------------------------------
# Data Loading & Auditing Execution
# -----------------------------------------------------------------------------
if load_btn or (st.session_state.X_raw is None and data_source == "Built-in Benchmark"):
    with st.spinner("Preparing dataset and running multi-engine label audit..."):
        try:
            if data_source == "Built-in Benchmark":
                X, y, class_names = load_benchmark_dataset(benchmark_choice)
            else:
                if custom_file is None:
                    st.warning("Please upload a CSV file to continue.")
                    st.stop()
                X, y, class_names = load_custom_csv(custom_file, target_col_input)

            st.session_state.X_raw = X
            st.session_state.y_raw = y
            st.session_state.class_names = class_names

            # Inject noise if requested
            if inject_noise_enabled and noise_rate > 0:
                y_noisy, is_corrupted, meta = inject_noise(
                    y, noise_rate=noise_rate, noise_type=noise_type, random_state=42
                )
            else:
                y_noisy = y.copy()
                is_corrupted = np.zeros(len(y), dtype=bool)
                meta = {"injected_count": 0, "actual_noise_rate": 0.0, "noise_type": "none"}

            st.session_state.y_noisy = y_noisy
            st.session_state.is_corrupted = is_corrupted
            st.session_state.noise_metadata = meta

            # Run Auditor
            auditor = LabelNoiseAuditor(
                n_splits=cv_splits,
                base_model_type=base_model_choice,
                knn_neighbors=knn_k,
                random_state=42,
            )
            audit_df = auditor.fit_audit(X, y_noisy, class_names=class_names)
            # Re-evaluate suspect status based on user slider
            audit_df["is_suspect"] = (audit_df["noise_score"] >= suspect_threshold) | (audit_df["cl_error_flag"])

            st.session_state.auditor = auditor
            st.session_state.audit_df = audit_df

            # Initial auto-heal
            healer = DatasetHealer(relabel_threshold=0.55, min_relabel_confidence=0.60)
            X_clean, y_clean, summary = healer.heal_dataset(X, y_noisy, audit_df)
            st.session_state.X_clean = X_clean
            st.session_state.y_clean = y_clean
            st.session_state.remediation_summary = summary
            st.session_state.benchmark_results = None

        except Exception as e:
            st.error(f"Error during loading or auditing: {str(e)}")
            st.stop()

# -----------------------------------------------------------------------------
# Main Header
# -----------------------------------------------------------------------------
st.markdown('<div class="main-header">🛡️ LabelGuard AI: Data-Centric AI Studio</div>', unsafe_allow_html=True)
st.markdown(
    '<div class="sub-header">Multi-Engine Label Noise Detection, Confident Learning Auditing & Model Healing</div>',
    unsafe_allow_html=True,
)

if st.session_state.audit_df is None:
    st.info("👈 Select your dataset options in the sidebar and click **'🚀 Load Data & Run Audit'** to begin.")
    st.stop()

# -----------------------------------------------------------------------------
# Main Tabs
# -----------------------------------------------------------------------------
tab1, tab2, tab3, tab4, tab5 = st.tabs(
    [
        "🧪 1. Dataset & Noise Lab",
        "🔍 2. Audit & Diagnostic Studio",
        "🛠️ 3. Remediation & Healing",
        "📊 4. Before-vs-After Benchmark",
        "💾 5. Export & Report Center",
    ]
)

# =============================================================================
# TAB 1: Dataset & Noise Lab
# =============================================================================
with tab1:
    st.subheader("🧪 Dataset Profile & Noise Simulation")
    
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.markdown(
            f"""<div class="metric-card">
                <div class="metric-title">Total Samples</div>
                <div class="metric-value">{len(st.session_state.X_raw):,}</div>
            </div>""",
            unsafe_allow_html=True,
        )
    with col2:
        st.markdown(
            f"""<div class="metric-card">
                <div class="metric-title">Feature Dimensions</div>
                <div class="metric-value">{st.session_state.X_raw.shape[1]}</div>
            </div>""",
            unsafe_allow_html=True,
        )
    with col3:
        st.markdown(
            f"""<div class="metric-card">
                <div class="metric-title">Distinct Classes</div>
                <div class="metric-value">{len(st.session_state.class_names)}</div>
            </div>""",
            unsafe_allow_html=True,
        )
    with col4:
        injected_pct = st.session_state.noise_metadata.get("actual_noise_rate", 0.0) * 100
        st.markdown(
            f"""<div class="metric-card">
                <div class="metric-title">Noise Injected</div>
                <div class="metric-value">{injected_pct:.1f}%</div>
                <div class="metric-delta">{st.session_state.noise_metadata.get('injected_count', 0)} corrupted labels</div>
            </div>""",
            unsafe_allow_html=True,
        )

    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown("#### Sample Dataset Preview (Features & Target)")
    preview_df = st.session_state.X_raw.copy()
    preview_df["Observed_Target"] = [
        st.session_state.class_names[c] for c in st.session_state.y_noisy
    ]
    if np.any(st.session_state.is_corrupted):
        preview_df["Is_Injected_Noise"] = st.session_state.is_corrupted

    st.dataframe(preview_df.head(20), use_container_width=True)

# =============================================================================
# TAB 2: Audit & Diagnostic Studio
# =============================================================================
with tab2:
    st.subheader("🔍 Label Noise Audit & Latent Geometry")

    audit_df = st.session_state.audit_df
    total_samples = len(audit_df)
    suspect_count = int(audit_df["is_suspect"].sum())
    suspect_pct = (suspect_count / total_samples) * 100
    cl_count = int(audit_df["cl_error_flag"].sum())

    c1, c2, c3, c4 = st.columns(4)
    with c1:
        st.metric("Flagged Suspect Errors", f"{suspect_count} ({suspect_pct:.1f}%)")
    with c2:
        st.metric("Confident Learning Flags", f"{cl_count}")
    with c3:
        st.metric("Avg Consensus Noise Score", f"{audit_df['noise_score'].mean():.3f}")
    with c4:
        # If synthetic noise was injected, calculate Auditor Precision & Recall
        if np.any(st.session_state.is_corrupted):
            actual_noise = st.session_state.is_corrupted
            predicted_noise = audit_df["is_suspect"].to_numpy()
            tp = np.sum(actual_noise & predicted_noise)
            precision = (tp / predicted_noise.sum()) * 100 if predicted_noise.sum() > 0 else 0
            recall = (tp / actual_noise.sum()) * 100 if actual_noise.sum() > 0 else 0
            st.metric("Noise Detection F1/Recall", f"{recall:.1f}%", delta=f"{precision:.1f}% Precision")
        else:
            st.metric("Auditor Health", "Active (Zero-Shot)")

    st.markdown("<br>", unsafe_allow_html=True)

    col_viz1, col_viz2 = st.columns(2)
    with col_viz1:
        st.plotly_chart(
            plot_latent_space(st.session_state.X_raw, audit_df, st.session_state.class_names),
            use_container_width=True,
        )
    with col_viz2:
        st.plotly_chart(
            plot_noise_transition_matrix(
                st.session_state.auditor.joint_distribution,
                st.session_state.class_names,
            ),
            use_container_width=True,
        )

    st.plotly_chart(
        plot_noise_score_distribution(audit_df, threshold=suspect_threshold),
        use_container_width=True,
    )

    st.markdown("#### Ranked Suspect Samples Table")
    st.caption("Sorted from highest noise probability to lowest. Inspect rows with high prediction margins and discordant k-NN neighborhoods.")
    
    display_cols = [
        "row_index",
        "given_label",
        "suggested_label",
        "noise_score",
        "given_label_prob",
        "suggested_label_prob",
        "prediction_margin",
        "knn_discordance",
        "cl_error_flag",
        "is_suspect",
    ]
    st.dataframe(audit_df[display_cols].sort_values(by="noise_score", ascending=False).head(50), use_container_width=True)

# =============================================================================
# TAB 3: Remediation & Human-in-the-Loop Studio
# =============================================================================
with tab3:
    st.subheader("🛠️ Data-Centric Remediation & Human-in-the-Loop Studio")
    st.write(
        "Remediate corrupt labels automatically or manually inspect edge cases before retraining your downstream models."
    )

    rem_col1, rem_col2, rem_col3 = st.columns(3)
    with rem_col1:
        relabel_thresh = st.slider("Auto-Relabel Threshold", 0.40, 0.90, 0.55, 0.05)
    with rem_col2:
        min_conf = st.slider("Minimum Model Confidence for Relabel", 0.50, 0.95, 0.60, 0.05)
    with rem_col3:
        prune_flag = st.checkbox("Prune Ambiguous Outliers (Drop Low Confidence Noise)", value=False)

    if st.button("⚡ Apply Remediation Strategy", type="primary"):
        healer = DatasetHealer(
            relabel_threshold=relabel_thresh,
            min_relabel_confidence=min_conf,
            prune_unconfident=prune_flag,
        )
        X_clean, y_clean, summary = healer.heal_dataset(
            st.session_state.X_raw,
            st.session_state.y_noisy,
            st.session_state.audit_df,
            manual_overrides=st.session_state.manual_overrides,
        )
        st.session_state.X_clean = X_clean
        st.session_state.y_clean = y_clean
        st.session_state.remediation_summary = summary
        st.success(f"Successfully healed dataset! Relabeled {summary['relabeled_count']} samples, pruned {summary['pruned_count']} samples.")

    if st.session_state.remediation_summary:
        s = st.session_state.remediation_summary
        m1, m2, m3, m4 = st.columns(4)
        m1.metric("Original Dataset Rows", s["original_samples"])
        m2.metric("Auto-Relabeled Samples", s["relabeled_count"])
        m3.metric("Pruned Outliers", s["pruned_count"])
        m4.metric("Final Cleansed Rows", s["final_samples"])

    st.markdown("---")
    st.markdown("#### 👤 Human-in-the-Loop Sample Inspector & Manual Override")
    
    suspect_rows = st.session_state.audit_df[st.session_state.audit_df["is_suspect"]].index.tolist()
    if suspect_rows:
        selected_row = st.selectbox("Select Suspect Row to Review", suspect_rows)
        row_data = st.session_state.audit_df.loc[selected_row]

        info_col1, info_col2, info_col3 = st.columns(3)
        info_col1.markdown(f"**Observed Label:** `{row_data['given_label']}` (P = {row_data['given_label_prob']:.2f})")
        info_col2.markdown(f"**Recommended Label:** `{row_data['suggested_label']}` (P = {row_data['suggested_label_prob']:.2f})")
        info_col3.markdown(f"**Consensus Noise Score:** `{row_data['noise_score']:.3f}`")

        new_label = st.selectbox(
            "Assign Valid Label",
            range(len(st.session_state.class_names)),
            index=int(row_data["suggested_label_idx"]),
            format_func=lambda x: st.session_state.class_names[x],
        )

        if st.button("💾 Apply Manual Override for this Row"):
            st.session_state.manual_overrides[selected_row] = new_label
            st.success(f"Row {selected_row} manually assigned to '{st.session_state.class_names[new_label]}'.")
    else:
        st.info("No suspect rows found with the current threshold.")

# =============================================================================
# TAB 4: Before vs. After Benchmark
# =============================================================================
with tab4:
    st.subheader("📊 Empirical Proof: Model Performance Delta (Before vs. After)")
    st.write(
        "Train dual downstream machine learning classifiers on **Raw Noisy Data** vs **LabelGuard Healed Data** and evaluate both on a clean held-out test split."
    )

    b_col1, b_col2, b_col3 = st.columns(3)
    with b_col1:
        bench_model = st.selectbox(
            "Benchmark Downstream Model",
            ["rf", "gb", "lr"],
            format_func=lambda x: "Random Forest" if x == "rf" else ("Gradient Boosting" if x == "gb" else "Logistic Regression"),
        )
    with b_col2:
        test_split_pct = st.slider("Held-out Test Split", 0.15, 0.40, 0.25, 0.05)
    with b_col3:
        st.write("")
        st.write("")
        run_bench_btn = st.button("🏃 Run Live Model Benchmark", type="primary", use_container_width=True)

    if run_bench_btn or st.session_state.benchmark_results is None:
        with st.spinner("Training baseline models and evaluating generalization performance..."):
            res = run_benchmark(
                X_noisy=st.session_state.X_raw,
                y_noisy=st.session_state.y_noisy,
                X_clean=st.session_state.X_clean,
                y_clean=st.session_state.y_clean,
                y_ground_truth=st.session_state.y_raw,
                test_size=test_split_pct,
                classifier_name=bench_model,
                random_state=42,
            )
            st.session_state.benchmark_results = res

    res = st.session_state.benchmark_results
    if res:
        k1, k2, k3, k4 = st.columns(4)
        k1.metric("Noisy Model Accuracy", f"{res['acc_noisy']*100:.2f}%")
        k2.metric(
            "Healed Model Accuracy",
            f"{res['acc_clean']*100:.2f}%",
            delta=f"{res['acc_delta']*100:+.2f}%",
        )
        k3.metric("Noisy Model Macro F1", f"{res['f1_noisy']*100:.2f}%")
        k4.metric(
            "Healed Model Macro F1",
            f"{res['f1_clean']*100:.2f}%",
            delta=f"{res['f1_delta']*100:+.2f}%",
        )

        st.markdown("<br>", unsafe_allow_html=True)
        col_plot1, col_plot2 = st.columns([1, 1])
        with col_plot1:
            st.plotly_chart(plot_benchmark_comparison(res["metrics_table"]), use_container_width=True)
        with col_plot2:
            st.markdown("#### Performance Scorecard")
            st.dataframe(res["metrics_table"], use_container_width=True)

        st.markdown("<br>", unsafe_allow_html=True)
        st.markdown("#### Test Set Confusion Matrix Comparison")
        fig_noisy_cm, fig_clean_cm = plot_confusion_matrices(
            res["cm_noisy"],
            res["cm_clean"],
            st.session_state.class_names,
        )
        cm_col1, cm_col2 = st.columns(2)
        with cm_col1:
            st.plotly_chart(fig_noisy_cm, use_container_width=True)
        with cm_col2:
            st.plotly_chart(fig_clean_cm, use_container_width=True)

# =============================================================================
# TAB 5: Export & Report Center
# =============================================================================
with tab5:
    st.subheader("💾 Export Cleansed Assets & Audit Reports")
    st.write(
        "Download your healed dataset, serialized clean models, and full audit logs for production deployment or submission."
    )

    exp_col1, exp_col2, exp_col3 = st.columns(3)

    with exp_col1:
        st.markdown("#### 📄 Healed Dataset (CSV)")
        healed_export_df = st.session_state.X_clean.copy()
        healed_export_df["target"] = st.session_state.y_clean
        csv_buffer = io.StringIO()
        healed_export_df.to_csv(csv_buffer, index=False)
        st.download_button(
            label="📥 Download Cleaned CSV",
            data=csv_buffer.getvalue(),
            file_name="labelguard_cleaned_dataset.csv",
            mime="text/csv",
            use_container_width=True,
        )

    with exp_col2:
        st.markdown("#### 🔍 Audit Diagnostics (CSV)")
        audit_csv = io.StringIO()
        st.session_state.audit_df.to_csv(audit_csv, index=False)
        st.download_button(
            label="📥 Download Audit Log CSV",
            data=audit_csv.getvalue(),
            file_name="labelguard_audit_log.csv",
            mime="text/csv",
            use_container_width=True,
        )

    with exp_col3:
        st.markdown("#### 🤖 Trained Clean Model")
        if st.session_state.benchmark_results and "model_clean" in st.session_state.benchmark_results:
            model_bytes = io.BytesIO()
            joblib.dump(st.session_state.benchmark_results["model_clean"], model_bytes)
            st.download_button(
                label="📥 Download Model (.joblib)",
                data=model_bytes.getvalue(),
                file_name="labelguard_clean_model.joblib",
                mime="application/octet-stream",
                use_container_width=True,
            )

    st.markdown("---")
    st.markdown("#### 📋 Executive Audit Summary")
    summary_report = {
        "dataset_name": benchmark_choice if data_source == "Built-in Benchmark" else "Custom CSV",
        "total_samples": len(st.session_state.X_raw),
        "feature_count": st.session_state.X_raw.shape[1],
        "class_count": len(st.session_state.class_names),
        "injected_noise_rate": st.session_state.noise_metadata.get("actual_noise_rate", 0.0),
        "flagged_suspects": int(st.session_state.audit_df["is_suspect"].sum()),
        "confident_learning_errors": int(st.session_state.audit_df["cl_error_flag"].sum()),
        "accuracy_improvement": f"{st.session_state.benchmark_results['acc_delta']*100:+.2f}%" if st.session_state.benchmark_results else "N/A",
        "f1_improvement": f"{st.session_state.benchmark_results['f1_delta']*100:+.2f}%" if st.session_state.benchmark_results else "N/A",
    }
    st.json(summary_report)
