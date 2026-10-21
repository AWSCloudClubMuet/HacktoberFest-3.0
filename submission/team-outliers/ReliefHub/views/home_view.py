"""
ReliefHub Home & Mission Overview
Features the uploaded photograph of Sindh flood-affected children, simple charts, and guided features.
Supports English, Urdu, and Sindhi.
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import os
from i18n import t

ASSETS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets")
CHILDREN_PHOTO = os.path.join(ASSETS_DIR, "children_water.png")
WORKER_PHOTO = os.path.join(ASSETS_DIR, "relief_workers.jpg")

from services.camp_service import CampService
from services.inventory_service import InventoryService
from services.need_service import NeedService

def render_home():
    lang = st.session_state.get("app_lang", "en")

    # Unified Hero Section Card
    st.markdown("""
    <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 1.8rem 2rem; box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.03), 0 2px 4px -2px rgba(15, 23, 42, 0.03); margin-bottom: 1.6rem;">
    """, unsafe_allow_html=True)

    col_img, col_info = st.columns([1, 1.3], gap="large")

    with col_img:
        target_img = CHILDREN_PHOTO if os.path.exists(CHILDREN_PHOTO) else WORKER_PHOTO
        if os.path.exists(target_img):
            st.image(
                target_img,
                use_container_width=True,
                caption="Sindh Flood Relief: Two children carrying clean drinking water." if lang == "en" else ("سندھ میں پینے کے صاف پانی کی فراہمی" if lang == "ur" else "سنڌ ۾ پيئڻ جي صاف پاڻيءَ جي فراهمي")
            )

    with col_info:
        st.markdown(f"""
        <div style="padding-top: 0.2rem;">
            <div style="display: inline-flex; align-items: center; background: #F1F5F9; border: 1px solid #CBD5E1; color: #0F172A; padding: 0.3rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.6rem;">
                ✛ {t("hero_headline", lang)}
            </div>
            <h1 style="color: #0F172A; font-size: 2.15rem; font-weight: 800; line-height: 1.2; margin-bottom: 0.6rem; letter-spacing: -0.025em;">
                {t("app_title", lang)}
            </h1>
            <p style="color: #475569; font-size: 1.02rem; line-height: 1.55; margin-bottom: 1.3rem;">
                {t("hero_body", lang)}
            </p>
        </div>
        """, unsafe_allow_html=True)

        # Quick stats row
        c1, c2, c3 = st.columns(3)
        with c1:
            st.metric(
                label=t("metric_active_camps", lang),
                value="8 Camps" if lang == "en" else ("8 کیمپس" if lang == "ur" else "8 ڪئمپون"),
                delta="7 Districts" if lang == "en" else ("7 اضلاع" if lang == "ur" else "7 ضلعا"),
                delta_color="off"
            )
        with c2:
            st.metric(
                label=t("metric_families", lang),
                value="1,750+",
                delta="Sheltered" if lang == "en" else ("پناہ گزین" if lang == "ur" else "پناهه گزين"),
                delta_color="off"
            )
        with c3:
            st.metric(
                label=t("metric_fulfillment", lang),
                value="68.2%",
                delta="Supplies Delivered" if lang == "en" else ("راشن فراہم" if lang == "ur" else "راشن مهيا"),
                delta_color="normal"
            )

        st.markdown("<br>", unsafe_allow_html=True)

        # Fast action buttons based on persona
        user_role = st.session_state.get("active_role", "Visitor")
        if user_role == "Donor":
            if st.button("Donate Food & Clean Water Now", type="primary", use_container_width=True):
                st.session_state["nav_target"] = t("nav_donate", lang)
                st.rerun()
        elif user_role == "Volunteer":
            if st.button("Register / Apply for Deployment", type="primary", use_container_width=True):
                st.session_state["nav_target"] = t("nav_vol_portal", lang)
                st.rerun()
        else:
            col_b1, col_b2 = st.columns(2)
            with col_b1:
                if st.button("Support Relief Efforts", type="primary", use_container_width=True):
                    st.session_state["nav_target"] = t("nav_camps", lang)
                    st.rerun()
            with col_b2:
                if st.button("View Urgent Needs", use_container_width=True):
                    st.session_state["nav_target"] = t("nav_needs", lang)
                    st.rerun()

    st.markdown("</div>", unsafe_allow_html=True)

    # Simple Visual Charts Section in Elevated Cards
    st.markdown(f'<div class="section-title">{"Current Aid Status & What Is Needed Most" if lang == "en" else ("امدادی صورتحال اور فوری ضروریات" if lang == "ur" else "امدادي صورتحال ۽ فوري ضرورتون")}</div>', unsafe_allow_html=True)
    st.markdown(f'<div class="section-subtitle">{"Live tracking of life-saving provisions and family shelter across Sindh districts." if lang == "en" else ("سندھ بھر میں امدادی راشن اور خیموں کی ترسیل کا لائیو جائزہ۔" if lang == "ur" else "سموري سنڌ ۾ امدادي راشن ۽ تنبن جي ورهاست جو جائزو.")}</div>', unsafe_allow_html=True)

    chart_c1, chart_c2 = st.columns(2)

    with chart_c1:
        st.markdown("""
        <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 1.25rem 1.4rem; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);">
            <div style="font-weight: 700; color: #0F172A; font-size: 0.95rem; margin-bottom: 0.8rem;">
        """ + ("Essential Supplies Needed by Families" if lang == "en" else ("خاندانوں کو درکار بنیادی سامان" if lang == "ur" else "خاندانن کي گهربل بنيادي سامان")) + """
            </div>
        """, unsafe_allow_html=True)

        df_needs = pd.DataFrame([
            {"Resource": "Clean Water" if lang == "en" else ("صاف پانی" if lang == "ur" else "صاف پاڻي"), "Delivered": 345, "Needed": 430},
            {"Resource": "Flour & Rations" if lang == "en" else ("آٹا اور راشن" if lang == "ur" else "اٽو ۽ راشن"), "Delivered": 230, "Needed": 340},
            {"Resource": "Medical Kits" if lang == "en" else ("طبی کٹس" if lang == "ur" else "طبي ڪٽس"), "Delivered": 110, "Needed": 225},
            {"Resource": "Tents" if lang == "en" else ("خیمے" if lang == "ur" else "تنبو"), "Delivered": 195, "Needed": 240},
            {"Resource": "Hygiene Kits" if lang == "en" else ("صفائی کٹس" if lang == "ur" else "صفائي ڪٽس"), "Delivered": 160, "Needed": 290}
        ])
        fig_bar = px.bar(
            df_needs,
            x="Resource",
            y=["Delivered", "Needed"],
            barmode="group",
            color_discrete_sequence=["#16A34A", "#0F172A"]
        )
        fig_bar.update_layout(
            margin=dict(l=10, r=10, t=10, b=20),
            height=270,
            plot_bgcolor="#FFFFFF",
            paper_bgcolor="#FFFFFF",
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1, font=dict(size=10)),
            font=dict(family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif", size=10, color="#334155")
        )
        st.plotly_chart(fig_bar, use_container_width=True)
        st.markdown("</div>", unsafe_allow_html=True)

    with chart_c2:
        st.markdown("""
        <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 1.25rem 1.4rem; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);">
            <div style="font-weight: 700; color: #0F172A; font-size: 0.95rem; margin-bottom: 0.8rem;">
        """ + ("Families Sheltered Across Sindh Districts" if lang == "en" else ("سندھ کے اضلاع میں پناہ گزین خاندان" if lang == "ur" else "سنڌ جي ضلعن ۾ پناهه گزين خاندان")) + """
            </div>
        """, unsafe_allow_html=True)

        df_districts = pd.DataFrame([
            {"District": "Sukkur", "Families": 380},
            {"District": "Dadu", "Families": 300},
            {"District": "Jamshoro", "Families": 310},
            {"District": "Larkana", "Families": 220},
            {"District": "Badin", "Families": 200},
            {"District": "Khairpur", "Families": 340}
        ])
        fig_pie = px.pie(
            df_districts,
            names="District",
            values="Families",
            hole=0.5,
            color_discrete_sequence=["#0F172A", "#1E3A8A", "#2563EB", "#0284C7", "#38BDF8", "#94A3B8"]
        )
        fig_pie.update_layout(
            margin=dict(l=10, r=10, t=10, b=10),
            height=270,
            font=dict(family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif", size=10, color="#334155")
        )
        st.plotly_chart(fig_pie, use_container_width=True)
        st.markdown("</div>", unsafe_allow_html=True)
