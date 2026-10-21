"""
HelpDeskNet-50K — Modern Website-Style Analytics Dashboard
Team SheNova • AWS Hackathon Submission
Author: Team SheNova
"""

import sys
import io
import math
import numpy as np
import pandas as pd
import altair as alt
import streamlit as st

# Configure standard output to UTF-8
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Import verified milestone modules
from milestone2_analysis import (
    OFFICIAL_TRANSITIONS,
    get_transition_summary,
    get_bidirectional_pairs,
    get_other_class_involvement,
)
from milestone3_analysis import (
    estimate_true_accuracy,
    reconstruct_noisy_accuracy,
    get_derivation_details,
)
estimate_clean_accuracy = estimate_true_accuracy
from milestone4_selection import (
    PROPOSED_PLAN,
    TicketSelectionPipeline,
    ReviewAllocationPlan,
    VALID_CLASSES,
    VALID_TIERS,
)
from milestone5_robustness import (
    LabelSmoothingCrossEntropy,
    CoTeachingSelector,
    EvaluationMetricsCalculator,
    verify_split_disjointness,
)

# ==============================================================================
# STREAMLIT PAGE CONFIGURATION
# ==============================================================================
st.set_page_config(
    page_title="HelpDeskNet-50K | Enterprise Analytics",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ==============================================================================
# MODERN SAAS / ENTERPRISE DESIGN SYSTEM CSS
# ==============================================================================
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');

    /* Global Typography & Background */
    html, body, [class*="css"] {
        font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        color: #0f172a;
        background-color: #f8fafc;
    }

    /* Remove default streamlit header clutter */
    header[data-testid="stHeader"] {
        background: transparent;
    }
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    
    .block-container {
        padding-top: 1.5rem !important;
        padding-bottom: 3rem !important;
        max-width: 1380px !important;
    }

    /* Hero Section */
    .hero-container {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        border-radius: 16px;
        padding: 2.2rem 2.5rem;
        color: #ffffff;
        margin-bottom: 1.8rem;
        box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.08);
        position: relative;
        overflow: hidden;
    }
    
    .hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(13, 148, 136, 0.2);
        color: #2dd4bf;
        border: 1px solid rgba(45, 212, 191, 0.4);
        padding: 4px 12px;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        margin-bottom: 1rem;
    }

    .hero-title {
        font-size: 2.25rem;
        font-weight: 800;
        letter-spacing: -0.03em;
        line-height: 1.15;
        margin-bottom: 0.5rem;
        color: #ffffff;
    }

    .hero-title span {
        background: linear-gradient(90deg, #2dd4bf 0%, #38bdf8 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .hero-desc {
        font-size: 1.02rem;
        color: #94a3b8;
        max-width: 860px;
        line-height: 1.5;
        margin-bottom: 0;
    }

    /* KPI Cards */
    .kpi-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 1rem;
        margin-bottom: 1.8rem;
    }

    .kpi-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1.1rem 1.25rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .kpi-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px -2px rgba(0, 0, 0, 0.08);
        border-color: #cbd5e1;
    }

    .kpi-card.accent {
        border-left: 4px solid #0d9488;
        background: linear-gradient(to bottom right, #ffffff, #f0fdfa);
    }

    .kpi-label {
        font-size: 0.75rem;
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.35rem;
    }

    .kpi-value {
        font-size: 1.85rem;
        font-weight: 800;
        color: #0f172a;
        letter-spacing: -0.02em;
        line-height: 1;
        margin-bottom: 0.35rem;
    }

    .kpi-value.accent {
        color: #0d9488;
    }

    .kpi-value.danger {
        color: #e11d48;
    }

    .kpi-subtext {
        font-size: 0.78rem;
        color: #64748b;
        font-weight: 500;
    }

    /* Content Cards */
    .content-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 1.4rem 1.6rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        margin-bottom: 1.25rem;
        height: 100%;
    }

    .card-title {
        font-size: 1.05rem;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 0.3rem;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .card-subtitle {
        font-size: 0.82rem;
        color: #64748b;
        margin-bottom: 1rem;
    }

    /* Insight Badges & Boxes */
    .insight-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
    }

    .insight-badge.teal {
        background: #ccfbf1;
        color: #0f766e;
    }

    .insight-badge.rose {
        background: #ffe4e6;
        color: #be123c;
    }

    .insight-badge.blue {
        background: #e0f2fe;
        color: #0369a1;
    }

    .insight-callout {
        background: #f8fafc;
        border-left: 3px solid #0d9488;
        border-radius: 0 8px 8px 0;
        padding: 0.85rem 1rem;
        font-size: 0.84rem;
        color: #334155;
        line-height: 1.45;
        margin-top: 0.8rem;
    }

    /* Clean Tabs Styling */
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
        background: #f1f5f9;
        padding: 6px;
        border-radius: 10px;
        border: 1px solid #e2e8f0;
        margin-bottom: 1.4rem;
    }

    .stTabs [data-baseweb="tab"] {
        border-radius: 8px;
        padding: 8px 18px;
        font-size: 0.86rem;
        font-weight: 600;
        color: #64748b;
        background: transparent;
        border: none !important;
        transition: all 0.15s ease;
    }

    .stTabs [aria-selected="true"] {
        background: #ffffff !important;
        color: #0d9488 !important;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    /* Minimalist Footer */
    .dashboard-footer {
        text-align: center;
        padding: 2rem 0 1rem 0;
        color: #94a3b8;
        font-size: 0.8rem;
        border-top: 1px solid #e2e8f0;
        margin-top: 2rem;
    }
</style>
""", unsafe_allow_html=True)

# ==============================================================================
# REUSABLE PLOTLY-GRADE ALTAIR VISUALIZATIONS (MINIMALIST & CRISP)
# ==============================================================================

COLOR_TEAL = "#0d9488"
COLOR_SLATE = "#475569"
COLOR_ROSE = "#e11d48"
COLOR_BLUE = "#0284c7"
COLOR_LIGHT_TEAL = "#14b8a6"
COLOR_MUTED = "#cbd5e1"

def create_class_dist_chart():
    df = pd.DataFrame({
        "Class": ["Billing", "Technical", "Refund", "Account Access", "Shipping", "Other"],
        "Share": [30.0, 25.0, 15.0, 15.0, 10.0, 5.0],
        "Tickets": ["15,000", "12,500", "7,500", "7,500", "5,000", "2,500"],
    })
    chart = alt.Chart(df).mark_bar(cornerRadiusTopRight=5, cornerRadiusBottomRight=5, color=COLOR_TEAL).encode(
        y=alt.Y("Class:N", sort="-x", title=None, axis=alt.Axis(labelFontSize=11, labelFontWeight="bold")),
        x=alt.X("Share:Q", title="Dataset Proportion (%)", scale=alt.Scale(domain=[0, 36])),
        tooltip=[
            alt.Tooltip("Class:N", title="Category"),
            alt.Tooltip("Share:Q", title="Share (%)", format=".1f"),
            alt.Tooltip("Tickets:N", title="Total Tickets"),
        ]
    ).properties(height=230)
    
    text = chart.mark_text(
        align="left", baseline="middle", dx=6, color=COLOR_SLATE, fontSize=11, fontWeight="bold"
    ).encode(text=alt.Text("Share:Q", format=".1f"))
    
    return (chart + text).configure_view(strokeWidth=0)


def create_tier_disagreement_chart():
    df = pd.DataFrame({
        "Cohort": ["Tier A (Experienced)", "Combined Audit Pool", "Tier B (Newer)"],
        "ErrorRate": [6.67, 15.00, 21.82],
        "Ratio": ["12 / 180 audited", "60 / 400 audited", "48 / 220 audited"],
        "Color": [COLOR_TEAL, COLOR_SLATE, COLOR_ROSE],
    })
    chart = alt.Chart(df).mark_bar(cornerRadiusTopLeft=5, cornerRadiusTopRight=5).encode(
        x=alt.X("Cohort:N", sort=None, title=None, axis=alt.Axis(labelAngle=0, labelFontSize=11, labelFontWeight="bold")),
        y=alt.Y("ErrorRate:Q", title="Audit Disagreement Rate (%)", scale=alt.Scale(domain=[0, 26])),
        color=alt.Color("Color:N", scale=None),
        tooltip=[
            alt.Tooltip("Cohort:N", title="Annotator Cohort"),
            alt.Tooltip("ErrorRate:Q", title="Disagreement Rate", format=".2f"),
            alt.Tooltip("Ratio:N", title="Audit Ratio"),
        ]
    ).properties(height=230)

    text = chart.mark_text(
        align="center", baseline="bottom", dy=-4, color="#0f172a", fontSize=12, fontWeight="bold"
    ).encode(text=alt.Text("ErrorRate:Q", format=".2f"))

    return (chart + text).configure_view(strokeWidth=0)


def create_top_transitions_chart():
    summary = get_transition_summary()
    df = pd.DataFrame([
        {
            "Transition": item["transition"],
            "Count": item["count"],
            "Share": item["percentage"],
            "Cluster": "Billing ↔ Refund" if "Billing" in item["transition"] and "Refund" in item["transition"]
                       else ("Tech ↔ Account" if "Technical" in item["transition"] and "Account" in item["transition"]
                       else "Other Transitions"),
        }
        for item in summary
    ])
    
    chart = alt.Chart(df).mark_bar(cornerRadiusTopRight=5, cornerRadiusBottomRight=5).encode(
        y=alt.Y("Transition:N", sort="-x", title=None, axis=alt.Axis(labelFontSize=11, labelFontWeight="bold")),
        x=alt.X("Count:Q", title="Disagreement Count (Total = 60)", scale=alt.Scale(domain=[0, 16])),
        color=alt.Color("Cluster:N", scale=alt.Scale(
            domain=["Billing ↔ Refund", "Tech ↔ Account", "Other Transitions"],
            range=[COLOR_TEAL, COLOR_LIGHT_TEAL, "#94a3b8"]
        ), legend=alt.Legend(title="Confusion Cluster", orient="bottom", labelFontSize=11, titleFontSize=11)),
        tooltip=[
            alt.Tooltip("Transition:N", title="Confusion Pair"),
            alt.Tooltip("Count:Q", title="Disagreements"),
            alt.Tooltip("Share:Q", title="% of Total Noise", format=".2f"),
        ]
    ).properties(height=280)

    text = chart.mark_text(
        align="left", baseline="middle", dx=5, color=COLOR_SLATE, fontSize=11, fontWeight="bold"
    ).encode(text=alt.Text("Count:Q"))

    return (chart + text).configure_view(strokeWidth=0)


def create_observed_vs_clean_chart():
    df = pd.DataFrame({
        "Metric": ["Observed (Contaminated Test Set)", "Estimated Clean Capability (Symmetric)"],
        "Accuracy": [82.00, 96.34],
        "Category": ["Observed Benchmark", "Theoretical Ceiling"],
        "Color": ["#64748b", COLOR_TEAL]
    })
    chart = alt.Chart(df).mark_bar(cornerRadiusTopLeft=5, cornerRadiusTopRight=5).encode(
        x=alt.X("Metric:N", sort=None, title=None, axis=alt.Axis(labelAngle=0, labelFontSize=11, labelFontWeight="bold")),
        y=alt.Y("Accuracy:Q", title="Test Accuracy (%)", scale=alt.Scale(domain=[0, 110])),
        color=alt.Color("Color:N", scale=None),
        tooltip=[
            alt.Tooltip("Metric:N", title="Evaluation Scope"),
            alt.Tooltip("Accuracy:Q", title="Accuracy (%)", format=".2f"),
        ]
    ).properties(height=230)

    text = chart.mark_text(
        align="center", baseline="bottom", dy=-4, color="#0f172a", fontSize=12, fontWeight="bold"
    ).encode(text=alt.Text("Accuracy:Q", format=".2f"))

    return (chart + text).configure_view(strokeWidth=0)


def create_review_allocation_chart():
    df = pd.DataFrame({
        "Stratum": ["High-Risk Priority", "Stratified Diversity", "Random Unbiased Anchor"],
        "Tickets": [1000, 600, 400],
        "Share": [50.0, 30.0, 20.0],
        "Color": [COLOR_TEAL, COLOR_BLUE, "#64748b"]
    })
    chart = alt.Chart(df).mark_bar(cornerRadiusTopRight=5, cornerRadiusBottomRight=5).encode(
        y=alt.Y("Stratum:N", sort="-x", title=None, axis=alt.Axis(labelFontSize=11, labelFontWeight="bold")),
        x=alt.X("Tickets:Q", title="Assigned Tickets (Total = 2,000)", scale=alt.Scale(domain=[0, 1200])),
        color=alt.Color("Color:N", scale=None),
        tooltip=[
            alt.Tooltip("Stratum:N", title="Sampling Objective"),
            alt.Tooltip("Tickets:Q", title="Tickets Allocated"),
            alt.Tooltip("Share:Q", title="Share (%)", format=".1f"),
        ]
    ).properties(height=180)

    text = chart.mark_text(
        align="left", baseline="middle", dx=6, color=COLOR_SLATE, fontSize=11, fontWeight="bold"
    ).encode(text=alt.Text("Tickets:Q"))

    return (chart + text).configure_view(strokeWidth=0)


# ==============================================================================
# HERO HEADER SECTION
# ==============================================================================
st.markdown("""
<div class="hero-container">
    <div class="hero-badge">STATISTICAL AUDIT & ROBUST EVALUATION PLATFORM</div>
    <div class="hero-title">HelpDeskNet-50K <span>Analytics Platform</span></div>
    <div class="hero-desc">
        An enterprise diagnostic suite evaluating annotator reliability, label noise quantification, and systematic class confusion across 50,000 customer support tickets.<br>
</div>
""", unsafe_allow_html=True)

# ==============================================================================
# TOP-LEVEL KPI METRIC STRIP
# ==============================================================================
st.markdown("""
<div class="kpi-grid">
    <div class="kpi-card">
        <div class="kpi-label">Corpus Scale</div>
        <div class="kpi-value">50,000</div>
        <div class="kpi-subtext">45k crowd (90%) • 5k expert (10%)</div>
    </div>
    <div class="kpi-card accent">
        <div class="kpi-label">Audit Disagreement Rate</div>
        <div class="kpi-value accent">15.00%</div>
        <div class="kpi-subtext">60 / 400 tickets • Wilson CI [11.8%, 18.8%]</div>
    </div>
    <div class="kpi-card">
        <div class="kpi-label">Annotator Tier Disparity</div>
        <div class="kpi-value danger">3.27×</div>
        <div class="kpi-subtext">Tier B: 21.8% vs. Tier A: 6.7% (p &lt; 0.0001)</div>
    </div>
    <div class="kpi-card">
        <div class="kpi-label">Clean Accuracy (Theoretical)</div>
        <div class="kpi-value accent">96.34%</div>
        <div class="kpi-subtext">+14.34% above observed 82% plateau</div>
    </div>
    <div class="kpi-card">
        <div class="kpi-label">Expert Review Plan</div>
        <div class="kpi-value">2,000</div>
        <div class="kpi-subtext">1,000 risk • 600 stratified • 400 random</div>
    </div>
</div>
""", unsafe_allow_html=True)

# ==============================================================================
# MAIN NAVIGATION TABS (UNIFIED INTERFACE)
# ==============================================================================
(
    tab_unified,
    tab_m1,
    tab_m2,
    tab_m3,
    tab_m4,
    tab_m5,
    tab_meta,
) = st.tabs([
    "Executive Overview",
    "M1 — Noise Rate & Tiers",
    "M2 — Error Characterization",
    "M3 — Clean Accuracy",
    "M4 — Review Strategy",
    "M5 — Robust Architecture",
    "Methodology & Reference",
])

# ==============================================================================
# TAB 1: UNIFIED EXECUTIVE STORY (COMBINES ALL 5 MILESTONES)
# ==============================================================================
with tab_unified:
    # Row 1: Problem Identification & Diagnosis (M1 + M2)
    col_u1, col_u2 = st.columns(2)
    
    with col_u1:
        st.markdown("""
        <div class="content-card">
            <div class="card-title">M1 — Worker Quality Disparity</div>
            <div class="card-subtitle">Comparing disagreement rates between 10 experienced (Tier A) and 30 newer (Tier B) crowd annotators.</div>
        """, unsafe_allow_html=True)
        st.altair_chart(create_tier_disagreement_chart(), use_container_width=True)
        st.markdown("""
            <div class="insight-callout">
                <strong>Executive Takeaway:</strong> Noise is not uniformly distributed. 
                Tier B workers exhibit an error rate <strong>3.27× higher</strong> than Tier A (21.82% vs. 6.67%, <em>z</em> = 4.22, <em>p</em> &lt; 0.0001). 
                Because Tier B labeled 50% of the entire corpus (25,000 tickets), targeted quality interventions here deliver 80% of data cleanup value.
            </div>
        </div>
        """, unsafe_allow_html=True)

    with col_u2:
        st.markdown("""
        <div class="content-card">
            <div class="card-title">M2 — Systematic Confusion Dynamics</div>
            <div class="card-subtitle">Diagnosing semantic failure boundaries across the 60 audited disagreements.</div>
        """, unsafe_allow_html=True)
        st.altair_chart(create_top_transitions_chart(), use_container_width=True)
        st.markdown("""
            <div class="insight-callout">
                <strong>Executive Takeaway:</strong> Annotation errors are structured, not random. 
                Just two bidirectional pairs account for <strong>68.33%</strong> of all noise: 
                <strong>Billing ↔ Refund</strong> (43.33%) and <strong>Technical ↔ Account Access</strong> (25.00%). 
                Additionally, <strong>Other</strong> acts as an ambiguous catch-all destination for 26.67% of errors.
            </div>
        </div>
        """, unsafe_allow_html=True)

    # Row 2: Theoretical Clean Capability & Action Strategy (M3 + M4)
    col_u3, col_u4 = st.columns(2)

    with col_u3:
        st.markdown("""
        <div class="content-card">
            <div class="card-title">M3 — Clean Accuracy Recovery Under Symmetric Noise</div>
            <div class="card-subtitle">Mathematical inversion of symmetric noise reveals underlying model competence.</div>
        """, unsafe_allow_html=True)
        st.altair_chart(create_observed_vs_clean_chart(), use_container_width=True)
        st.markdown(r"""
            <div class="insight-callout">
                <strong>Executive Takeaway:</strong> The reported 82% plateau does <em>not</em> indicate an incapable model. 
                Under symmetric noise ($q = 15\%$), evaluating against noisy crowd test labels masks roughly <strong>14.34%</strong> of real accuracy. 
                The model's theoretical clean capability is <strong>96.34%</strong> ($a = 0.79 / 0.82$). 
                <em>Note: This is an analytical estimate, not an empirical guarantee.</em>
            </div>
        </div>
        """, unsafe_allow_html=True)

    with col_u4:
        st.markdown("""
        <div class="content-card">
            <div class="card-title">M4 — Targeted 2,000-Ticket Expert Review</div>
            <div class="card-subtitle">Proposed multi-objective allocation balancing precision and population coverage.</div>
        """, unsafe_allow_html=True)
        st.altair_chart(create_review_allocation_chart(), use_container_width=True)
        st.markdown("""
            <div class="insight-callout">
                <strong>Executive Takeaway:</strong> A tri-partite budget maximizes ROI:
                <strong>1,000 High-Risk</strong> tickets fix high-uncertainty training samples, 
                <strong>600 Stratified</strong> tickets guarantee 50 tickets across all 12 class/tier strata, and 
                <strong>400 Random</strong> tickets provide an uncorrupted statistical anchor. 
                Strict sequential deduplication ensures zero wasted review capacity.
            </div>
        </div>
        """, unsafe_allow_html=True)

    # Row 3: Robust Training & Trustworthy Evaluation Architecture (M5)
    st.markdown("""
    <div class="content-card">
        <div class="card-title">M5 — Noise-Robust Training & Evaluation Architecture</div>
        <div class="card-subtitle">A dual-pronged mitigation framework to handle remaining crowd noise without sacrificing generalizability.</div>
    """, unsafe_allow_html=True)
    
    col_m5_1, col_m5_2, col_m5_3 = st.columns(3)
    with col_m5_1:
        st.markdown(r"""
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; height:100%;">
            <div style="font-weight:700; color:#0d9488; font-size:0.95rem; margin-bottom:6px;">Method A — Label Smoothing</div>
            <div style="font-size:0.82rem; color:#475569; line-height:1.45;">
                Replaces rigid one-hot targets ($y=1.0$) with softened probability distributions ($\epsilon = 0.10$). 
                Target class receives <strong>0.9167</strong> and 5 non-target classes receive <strong>0.0167</strong>. 
                Penalizes overconfident gradient updates on corrupted crowd labels.
            </div>
        </div>
        """, unsafe_allow_html=True)
        
    with col_m5_2:
        st.markdown(r"""
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; height:100%;">
            <div style="font-weight:700; color:#0284c7; font-size:0.95rem; margin-bottom:6px;">Method B — Co-Teaching Paradigm</div>
            <div style="font-size:0.82rem; color:#475569; line-height:1.45;">
                Dual independent networks cross-train by exchanging small-loss instances. 
                Retention schedule $R(t) = 1 - \min(t/10, 1)\cdot 0.15$ progressively filters out the top 15% suspect instances, 
                preventing either network from memorizing noise.
            </div>
        </div>
        """, unsafe_allow_html=True)

    with col_m5_3:
        st.markdown("""
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; height:100%;">
            <div style="font-weight:700; color:#475569; font-size:0.95rem; margin-bottom:6px;">10-Point Trustworthy Gold Evaluation</div>
            <div style="font-size:0.82rem; color:#475569; line-height:1.45;">
                Evaluation <em>must</em> utilize an untouched, disjoint <strong>expert-labeled gold test set</strong>. 
                Reports macro-averaged F1, class-wise precision/recall, and confidence intervals to ensure verified production readiness.
            </div>
        </div>
        """, unsafe_allow_html=True)
        
    st.markdown("</div>", unsafe_allow_html=True)


# ==============================================================================
# TAB 2: M1 NOISE RATE & WORKER TIERS DEEP DIVE
# ==============================================================================
with tab_m1:
    st.markdown("### Milestone 1 — Quantify Label Noise")
    st.caption("Rigorous statistical analysis of the 400-ticket crowd audit and worker tier error heterogeneity.")

    col1, col2, col3 = st.columns([1, 1, 1.2])
    with col1:
        st.markdown("""
        <div class="content-card">
            <div class="kpi-label">Overall Disagreement Rate</div>
            <div class="kpi-value accent">15.00%</div>
            <div class="kpi-subtext">60 disagreements / 400 audited tickets</div>
            <div style="margin-top:14px; font-size:0.82rem; color:#334155;">
                <strong>95% Wilson Confidence Interval:</strong><br>
                <code style="color:#0d9488; font-weight:700;">[11.83%, 18.83%]</code><br>
                Reflects exact binomial confidence interval accounting for finite sample size.
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown("""
        <div class="content-card">
            <div class="kpi-label">Annotator Disparity Gap</div>
            <div class="kpi-value danger">+15.15%</div>
            <div class="kpi-subtext">Tier B (21.82%) vs. Tier A (6.67%)</div>
            <div style="margin-top:14px; font-size:0.82rem; color:#334155;">
                <strong>Relative Risk Ratio:</strong><br>
                <code style="color:#e11d48; font-weight:700;">3.27× Error Multiplier</code><br>
                Newer workers generate over 3× the error rate of experienced staff.
            </div>
        </div>
        """, unsafe_allow_html=True)

    with col3:
        st.markdown("""
        <div class="content-card">
            <div class="kpi-label">Two-Proportion Hypothesis Test</div>
            <div class="kpi-value" style="font-size:1.5rem;">z = 4.22 (p &lt; 0.0001)</div>
            <div class="kpi-subtext">Two-sided pooled test: p = 2.42 × 10⁻⁵</div>
            <div style="margin-top:10px; font-size:0.8rem; color:#64748b; line-height:1.4;">
                Null hypothesis $H_0: p_B = p_A$ is rejected with extreme statistical confidence. 
                The odds of this gap occurring by chance are less than 1 in 40,000.
            </div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("#### Audit Sample Composition Table")
    audit_summary_df = pd.DataFrame({
        "Annotator Cohort": [
            "Tier A (10 Experienced Crowdworkers)",
            "Tier B (30 Newer Crowdworkers)",
            "Combined Crowd Sample"
        ],
        "Audited Tickets (n)": [180, 220, 400],
        "Disagreements (x)": [12, 48, 60],
        "Observed Error Rate": ["6.67%", "21.82%", "15.00%"],
        "Wilson 95% Confidence Interval": ["[3.85%, 11.27%]", "[16.89%, 27.69%]", "[11.83%, 18.83%]"],
        "Corpus Impact": ["Labeled 20,000 tickets (40%)", "Labeled 25,000 tickets (50%)", "Audited 400 tickets"]
    })
    st.dataframe(audit_summary_df, hide_index=True, use_container_width=True)


# ==============================================================================
# TAB 3: M2 ERROR CHARACTERIZATION & CONFUSION HEATMAP
# ==============================================================================
with tab_m2:
    st.markdown("### Milestone 2 — Characterize the Noise")
    st.caption("Detailed taxonomy of all 8 observed disagreement transitions across the 60 audited tickets.")

    c_m2_left, c_m2_right = st.columns([1.2, 1])

    with c_m2_left:
        st.markdown("""
        <div class="content-card">
            <div class="card-title">Disagreement Transition Ranking</div>
            <div class="card-subtitle">Exact counts and shares across the 8 official error paths.</div>
        """, unsafe_allow_html=True)
        st.altair_chart(create_top_transitions_chart(), use_container_width=True)
        st.markdown("</div>", unsafe_allow_html=True)

    with c_m2_right:
        st.markdown("""
        <div class="content-card">
            <div class="card-title">Bidirectional Clusters & 'Other' Ambiguity</div>
            <div class="card-subtitle">Grouping mutual error axes to identify guideline ambiguities.</div>
        """, unsafe_allow_html=True)
        
        pairs = get_bidirectional_pairs()
        pairs_df = pd.DataFrame([
            {
                "Semantic Pair": p["pair"],
                "Breakdown": f"{p['forward_count']} + {p['reverse_count']}",
                "Disagreements": f"{p['total_count']} / 60",
                "Share of Noise": f"{p['percentage']:.2f}%"
            }
            for p in pairs
        ])
        st.dataframe(pairs_df, hide_index=True, use_container_width=True)

        st.markdown("<div style='height:10px;'></div>", unsafe_allow_html=True)
        st.markdown("<strong>'Other' Category Involvement Analysis:</strong>", unsafe_allow_html=True)
        other_stats = get_other_class_involvement()
        other_df = pd.DataFrame({
            "Measurement Metric": [
                "Other as Destination (Expert = Other)",
                "Other as Origin (Crowd = Other)",
                "Other Involved in Either Direction"
            ],
            "Count & Percentage": [
                f"{other_stats['destination_count']} / 60 ({other_stats['destination_pct']:.2f}%)",
                f"{other_stats['origin_count']} / 60 ({other_stats['origin_pct']:.2f}%)",
                f"{other_stats['either_direction_count']} / 60 ({other_stats['either_direction_pct']:.2f}%)",
            ]
        })
        st.dataframe(other_df, hide_index=True, use_container_width=True)
        st.markdown("</div>", unsafe_allow_html=True)

    st.markdown("""
    <div class="insight-callout">
        <strong>Recommended Guidelines Overhaul:</strong> 
        1. Establish a strict refund policy rule: If a ticket requests monetary compensation, route to <strong>Refund</strong> regardless of billing terminology. 
        2. Introduce a technical authentication boundary: Password resets and 2FA belong strictly to <strong>Account Access</strong>; system crashes belong to <strong>Technical</strong>. 
        3. Eliminate the catch-all "Other" default by requiring annotators to select a specific sub-category reason.
    </div>
    """, unsafe_allow_html=True)


# ==============================================================================
# TAB 4: M3 ESTIMATE CLEAN ACCURACY UNDER SYMMETRIC NOISE
# ==============================================================================
with tab_m3:
    st.markdown("### Milestone 3 — Estimate Clean Accuracy Under Symmetric Noise")
    st.caption("Mathematical derivation of true model capacity and sensitivity analysis across theoretical noise levels.")

    col_m3_a, col_m3_b = st.columns([1, 1.2])

    with col_m3_a:
        st.markdown("""
        <div class="content-card">
            <div class="card-title">Theoretical Derivation Formula</div>
            <div class="card-subtitle">Inverting symmetric label noise to recover underlying classifier accuracy.</div>
            <div style="background:#f8fafc; padding:12px; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:12px;">
                <p style="margin:0; font-size:0.85rem; color:#334155;">Forward Noise Formulation:</p>
                <p style="margin:4px 0 10px 0; font-weight:700; color:#0f172a; font-size:0.95rem;">
                    A<sub>noisy</sub> = (1 - q)·a + [q / (K - 1)]·(1 - a)
                </p>
                <p style="margin:0; font-size:0.85rem; color:#334155;">Inverted Recovery Equation:</p>
                <p style="margin:4px 0 0 0; font-weight:700; color:#0d9488; font-size:1.05rem;">
                    a = [A<sub>noisy</sub> - q/(K-1)] / [1 - q·K/(K-1)]
                </p>
            </div>
            <div style="font-size:0.82rem; color:#475569; line-height:1.5;">
                • <strong>K = 6</strong> classes &nbsp;|&nbsp; <strong>q = 0.15</strong> noise rate &nbsp;|&nbsp; <strong>A<sub>noisy</sub> = 0.82</strong><br>
                • 0.82 = 0.85·a + 0.03·(1 - a) = 0.82·a + 0.03<br>
                • a = 0.79 / 0.82 ≈ <strong>96.34%</strong>
            </div>
        </div>
        """, unsafe_allow_html=True)

    with col_m3_b:
        st.markdown("""
        <div class="content-card">
            <div class="card-title">Interactive Sensitivity Simulation</div>
            <div class="card-subtitle">Explore how theoretical clean accuracy behaves under different assumed noise rates.</div>
        """, unsafe_allow_html=True)
        
        sim_q = st.slider("Select Assumed Noise Rate (q)", min_value=0.05, max_value=0.25, value=0.15, step=0.01)
        sim_a = estimate_clean_accuracy(0.82, sim_q, 6)
        
        st.markdown(f"""
        <div style="display:flex; gap:16px; align-items:center; margin-bottom:14px; background:#f0fdfa; padding:10px 14px; border-radius:8px; border:1px solid #ccfbf1;">
            <div>
                <div style="font-size:0.75rem; color:#0f766e; font-weight:700; text-transform:uppercase;">Estimated Clean Accuracy</div>
                <div style="font-size:1.6rem; color:#0d9488; font-weight:800;">{sim_a * 100:.2f}%</div>
            </div>
            <div style="font-size:0.8rem; color:#334155; line-height:1.4;">
                At <strong>q = {sim_q*100:.1f}%</strong> and observed test accuracy of <strong>82.0%</strong>, 
                the model would achieve {sim_a*100:.2f}% on a noise-free test set under symmetric noise.
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        # Sensitivity Curve
        q_steps = np.linspace(0.05, 0.25, 21)
        a_steps = [estimate_clean_accuracy(0.82, q_val, 6) * 100 for q_val in q_steps]
        curve_data = pd.DataFrame({"Noise Rate (%)": q_steps * 100, "Clean Accuracy (%)": a_steps})
        
        sens_chart = alt.Chart(curve_data).mark_line(color=COLOR_TEAL, strokeWidth=3).encode(
            x=alt.X("Noise Rate (%):Q", title="Assumed Symmetric Noise Rate q (%)"),
            y=alt.Y("Clean Accuracy (%):Q", title="Theoretical Clean Accuracy a (%)", scale=alt.Scale(domain=[80, 105])),
            tooltip=["Noise Rate (%)", alt.Tooltip("Clean Accuracy (%):Q", format=".2f")]
        ).properties(height=180)
        
        st.altair_chart(sens_chart.configure_view(strokeWidth=0), use_container_width=True)
        st.markdown("</div>", unsafe_allow_html=True)

    st.markdown("""
    <div class="insight-callout">
        <strong>Academic Disclaimer & Limitations:</strong> The estimate of 96.34% is strictly a <em>theoretical reference point</em> under uniform symmetric noise assumptions. 
        As proven in Milestone 2, real-world label errors in HelpDeskNet-50K are highly asymmetric (e.g., Billing ↔ Refund accounts for 43.3% of noise). 
        Therefore, 96.34% must not be interpreted as an empirical benchmark, guarantee, or measured performance.
    </div>
    """, unsafe_allow_html=True)


# ==============================================================================
# TAB 5: M4 EXPERT REVIEW STRATEGY & DEDUPLICATION PIPELINE
# ==============================================================================
with tab_m4:
    st.markdown("### Milestone 4 — Expert Review Strategy")
    st.caption("Optimal allocation of a 2,000-ticket human-in-the-loop audit budget across three distinct sampling objectives.")

    c_m4_1, c_m4_2 = st.columns([1.1, 1])

    with c_m4_1:
        st.markdown("""
        <div class="content-card">
            <div class="card-title">Three-Tier Review Allocation Strategy</div>
            <div class="card-subtitle">Balancing error correction, stratum representation, and unbiased estimation.</div>
        """, unsafe_allow_html=True)
        st.altair_chart(create_review_allocation_chart(), use_container_width=True)
        
        plan_table = pd.DataFrame({
            "Selection Cohort": ["1. High-Risk Pool", "2. Stratified Pool", "3. Random Pool", "Total Review Budget"],
            "Target Size": ["1,000 tickets", "600 tickets", "400 tickets", "2,000 tickets"],
            "Allocation Share": ["50.0%", "30.0%", "20.0%", "100.0%"],
            "Operational Purpose": [
                "Targets model uncertainty & high disagreement probability",
                "Guarantees 50 tickets across all 12 class/tier strata",
                "Unbiased population anchor for sound statistical estimation",
                "Maximum feasible review capacity for in-house experts"
            ]
        })
        st.dataframe(plan_table, hide_index=True, use_container_width=True)
        st.markdown("</div>", unsafe_allow_html=True)

    with c_m4_2:
        st.markdown("""
        <div class="content-card">
            <div class="card-title">Deterministic Sequential Deduplication</div>
            <div class="card-subtitle">Zero-waste pipeline preventing duplicate review assignments.</div>
            <div style="font-size:0.82rem; color:#475569; line-height:1.5; margin-bottom:14px;">
                Tickets are assigned sequentially across pools to prevent overlapping expert effort:
                <ol style="margin-top:6px; padding-left:18px;">
                    <li><strong>Stage 1 (High-Risk):</strong> Top 1,000 tickets with highest uncertainty scores are locked.</li>
                    <li><strong>Stage 2 (Stratified):</strong> Remaining candidates are stratified into 12 cells (6 classes × 2 tiers), drawing 50 distinct tickets per cell.</li>
                    <li><strong>Stage 3 (Random):</strong> 400 tickets are sampled uniformly at random from all remaining unselected records.</li>
                </ol>
            </div>
            <div style="background:#f0fdfa; border:1px solid #ccfbf1; border-radius:8px; padding:12px; font-size:0.8rem; color:#0f766e;">
                <strong>Audit Trail Schema:</strong> Each reviewed ticket records original crowd label, worker ID, expert label, timestamp, confidence score, and sampling pool provenance for complete auditability.
            </div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("""
    <div class="insight-callout">
        <strong>Selection Bias & Weighting Warning:</strong> When evaluating population statistics on the reviewed tickets, 
        analysts <em>cannot</em> treat the 2,000 tickets as an i.i.d. sample. Importance sampling weights ($w_i = 1 / P(\text{selected})$) 
        must be applied to correct for the over-representation of high-risk tickets.
    </div>
    """, unsafe_allow_html=True)


# ==============================================================================
# TAB 6: M5 NOISE-ROBUST TRAINING & EVALUATION ARCHITECTURE
# ==============================================================================
with tab_m5:
    st.markdown("### Milestone 5 — Noise-Robust Training & Evaluation")
    st.caption("Algorithmic noise mitigation during training and gold-standard evaluation protocol.")

    col_m5_a, col_m5_b = st.columns(2)

    with col_m5_a:
        st.markdown("""
        <div class="content-card">
            <div class="card-title">Method A — Label Smoothing Cross-Entropy</div>
            <div class="card-subtitle">Softening hard targets to penalize overconfident learning on corrupted labels.</div>
        """, unsafe_allow_html=True)
        
        ls_df = pd.DataFrame({
            "Label Type": ["Hard One-Hot Target", "Smoothed Target (ε = 0.10)"],
            "Target Class Probability": ["1.0000 (100.0%)", "0.9167 (91.67%)"],
            "5 Non-Target Class Probabilities": ["0.0000 (0.0% each)", "0.0167 (1.67% each)"],
            "Total Probability Sum": ["1.0000", "1.0000"]
        })
        st.dataframe(ls_df, hide_index=True, use_container_width=True)
        
        st.markdown(r"""
        <div style="font-size:0.82rem; color:#475569; line-height:1.5; margin-top:12px;">
            <strong>Mechanism:</strong> By truncating the maximum target probability to $1 - \epsilon + \epsilon/K = 0.9167$, 
            gradients do not grow infinitely large when a crowdworker incorrectly labels a refund ticket as billing. 
            This stabilizes feature embeddings and curbs memorization.
        </div>
        </div>
        """, unsafe_allow_html=True)

    with col_m5_b:
        st.markdown("""
        <div class="content-card">
            <div class="card-title">Method B — Co-Teaching Paradigm</div>
            <div class="card-subtitle">Dual networks exchanging small-loss instances under dynamic retention schedule R(t).</div>
        """, unsafe_allow_html=True)

        epochs = list(range(1, 16))
        retention = [1.0 - min(e / 10.0, 1.0) * 0.15 for e in epochs]
        ret_df = pd.DataFrame({"Epoch": epochs, "Retention Rate R(t)": retention})

        ret_chart = alt.Chart(ret_df).mark_line(color=COLOR_BLUE, strokeWidth=3).encode(
            x=alt.X("Epoch:Q", title="Training Epoch"),
            y=alt.Y("Retention Rate R(t):Q", scale=alt.Scale(domain=[0.8, 1.02]), title="Sample Retention Fraction"),
            tooltip=["Epoch:Q", alt.Tooltip("Retention Rate R(t):Q", format=".3f")]
        ).properties(height=160)

        st.altair_chart(ret_chart.configure_view(strokeWidth=0), use_container_width=True)
        st.markdown("""
        <div style="font-size:0.82rem; color:#475569; line-height:1.4;">
            <strong>Mechanism:</strong> Deep networks memorize clean patterns before noise. By selecting the fraction $R(t)$ with smallest loss 
            at each epoch and training the peer network, Co-teaching filters out corrupted samples dynamically.
        </div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("""
    <div class="content-card">
        <div class="card-title">10-Point Trustworthy Gold Evaluation Protocol</div>
        <div class="card-subtitle">Mandatory checklist for unbiased deployment validation.</div>
        <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:12px; font-size:0.82rem; color:#334155;">
            <div><span style="color:#0d9488; font-weight:700;">1.</span> <strong>Gold-Standard Isolation:</strong> Test set evaluated exclusively on expert labels.</div>
            <div><span style="color:#0d9488; font-weight:700;">2.</span> <strong>Zero Split Leakage:</strong> Enforce strict ticket ID disjointness across train/val/test.</div>
            <div><span style="color:#0d9488; font-weight:700;">3.</span> <strong>Multi-Class Metrics:</strong> Report macro-averaged F1 alongside per-class precision/recall.</div>
            <div><span style="color:#0d9488; font-weight:700;">4.</span> <strong>Statistical Bounds:</strong> Compute 95% confidence intervals on all benchmark scores.</div>
            <div><span style="color:#0d9488; font-weight:700;">5.</span> <strong>Provable Audit Trail:</strong> Maintain immutable records of all label adjustments and overrides.</div>
            <div><span style="color:#0d9488; font-weight:700;">6.</span> <strong>Empirical Validation:</strong> Prohibit reporting unverified claims as measured performance.</div>
        </div>
    </div>
    """, unsafe_allow_html=True)


# ==============================================================================
# TAB 7: METHODOLOGY, REFERENCE & BOUNDS
# ==============================================================================
with tab_meta:
    st.markdown("### Reference Parameters & Project Bounds")
    st.caption("Complete official scenario metrics, statistical assumptions, and compliance statements.")

    param_df = pd.DataFrame({
        "Official Parameter": [
            "Total Dataset Size",
            "Number of Classes",
            "Class Distribution",
            "Expert-Labeled Corpus",
            "Crowd-Labeled Corpus",
            "Crowd Worker Tiers",
            "Audit Sample Size",
            "Audit Disagreements",
            "Observed Crowd Test Accuracy",
            "Theoretical Clean Accuracy"
        ],
        "Value / Ratio": [
            "50,000 tickets",
            "6 categories",
            "Billing 30%, Technical 25%, Refund 15%, Account Access 15%, Shipping 10%, Other 5%",
            "5,000 tickets (10% of total)",
            "45,000 tickets (90% of total)",
            "Tier A: 20,000 tickets (10 workers) • Tier B: 25,000 tickets (30 workers)",
            "400 tickets (180 Tier A, 220 Tier B)",
            "60 disagreements (12 Tier A, 48 Tier B)",
            "82.00% (crowd-evaluated plateau)",
            "96.34% (derived under symmetric noise assumption a = 79/82)"
        ],
        "Statistical Authority": [
            "Official Problem Specification",
            "Official Problem Specification",
            "Official Aggregate Statistics",
            "Official Dataset Composition",
            "Official Dataset Composition",
            "Official Worker Distribution",
            "Random Audit Pool",
            "Expert vs. Crowd Audit Results",
            "Reported Baseline Benchmark",
            "Milestone 3 Analytical Inversion"
        ]
    })
    st.dataframe(param_df, hide_index=True, use_container_width=True)

    st.markdown("""
    <div class="insight-callout">
        <strong>Data Compliance & Academic Integrity Statement:</strong>
        <ul style="margin:6px 0 0 0; padding-left:18px;">
            <li>No external ticket records were downloaded or fabricated.</li>
            <li>No synthetic test predictions are presented as empirical model training results.</li>
            <li>All calculations and algorithmic components are independently verified and covered by 36 unit tests.</li>
        </ul>
    </div>
    """, unsafe_allow_html=True)


# ==============================================================================
# MINIMALIST FOOTER
# ==============================================================================
st.markdown("""
<div class="dashboard-footer">
    HelpDeskNet-50K Analytics Platform • Fictional scenario analysis for statistical audit and robust evaluation.
</div>
""", unsafe_allow_html=True)
