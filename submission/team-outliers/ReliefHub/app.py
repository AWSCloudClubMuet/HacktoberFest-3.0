"""
ReliefHub — Flood Relief Operations Platform
Trilingual Humanitarian System (English, Urdu, Sindhi)
Role-isolated interface for Donors, Volunteers, Visitors, and Staff.
"""

import streamlit as st
from datetime import datetime, timezone
import os

from services.api_client import client
import config
from i18n import t, LANGUAGES

# Page configuration
st.set_page_config(
    page_title="ReliefHub — Flood Relief Operations",
    page_icon="🌊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Import View Modules
import importlib
import views.auth_view
import views.dashboard_view
import views.volunteers_view
import views.needs_view
import views.donations_view
import views.home_view
importlib.reload(views.auth_view)
importlib.reload(views.dashboard_view)
importlib.reload(views.volunteers_view)
importlib.reload(views.needs_view)
importlib.reload(views.donations_view)
importlib.reload(views.home_view)
from views.auth_view import render_login_gate
from views.home_view import render_home
from views.dashboard_view import render_dashboard
from views.camps_view import render_camps
from views.inventory_view import render_inventory
from views.needs_view import render_needs
from views.dispatches_view import render_dispatches
from views.donations_view import render_donations
from views.volunteers_view import render_volunteers

def main():
    # Session state initialization
    if "user_authenticated" not in st.session_state:
        st.session_state["user_authenticated"] = False
    if "active_role" not in st.session_state:
        st.session_state["active_role"] = "Visitor"
    if "is_admin" not in st.session_state:
        st.session_state["is_admin"] = False
    if "user_email" not in st.session_state:
        st.session_state["user_email"] = ""
    if "app_lang" not in st.session_state:
        st.session_state["app_lang"] = "en"
    if "nav_target" not in st.session_state:
        st.session_state["nav_target"] = ""

    lang = st.session_state["app_lang"]

    # 1. AUTHENTICATION GATE (Matches reliefhub.app)
    if not st.session_state["user_authenticated"]:
        render_login_gate()
        return

    # 2. AUTHENTICATED WORKSPACE STYLING
    is_rtl = (lang in ("ur", "sd"))

    st.markdown(f"""
    <style>
        .stApp {{
            background-color: #F8FAFC !important;
            color: #0F172A !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            {'direction: rtl; text-align: right;' if is_rtl else ''}
        }}

        /* Subtle smooth page entrance transition */
        @keyframes pageFadeIn {{
            from {{ opacity: 0; transform: translateY(6px); }}
            to {{ opacity: 1; transform: translateY(0); }}
        }}
        .main .block-container {{
            animation: pageFadeIn 0.22s ease-out;
            padding-top: 1.2rem !important;
            padding-bottom: 2.5rem !important;
            max-width: 1400px;
        }}

        [data-testid="stSidebar"] {{
            display: block !important;
            background-color: #FFFFFF !important;
            border-right: 1px solid #E2E8F0 !important;
            box-shadow: 1px 0 3px rgba(0, 0, 0, 0.02) !important;
        }}
        [data-testid="collapsedControl"] {{
            display: flex !important;
        }}

        /* Top Command Header - Deep Navy with Subtle Sheen */
        .command-header {{
            background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            padding: 1rem 1.6rem;
            margin-bottom: 1.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 0.85rem;
            box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.1);
        }}
        .command-header-title {{
            color: #FFFFFF !important;
            font-size: 1.35rem;
            font-weight: 800;
            letter-spacing: -0.025em;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }}
        .command-header-subtitle {{
            color: #94A3B8 !important;
            font-size: 0.82rem;
            font-weight: 500;
            margin-top: 0.25rem;
            letter-spacing: 0.01em;
        }}

        /* Refined Status Pills */
        .sys-pill {{
            display: inline-flex;
            align-items: center;
            padding: 0.3rem 0.75rem;
            border-radius: 20px;
            font-size: 0.74rem;
            font-weight: 700;
            letter-spacing: 0.03em;
            text-transform: uppercase;
            box-shadow: 0 1px 2px rgba(0,0,0,0.06);
        }}
        .sys-pill-donor {{ background-color: #0284C7; color: #FFFFFF; border: 1px solid rgba(255,255,255,0.2); }}
        .sys-pill-vol {{ background-color: #16A34A; color: #FFFFFF; border: 1px solid rgba(255,255,255,0.2); }}
        .sys-pill-admin {{ background-color: #DC2626; color: #FFFFFF; border: 1px solid rgba(255,255,255,0.2); }}
        .sys-pill-visitor {{ background-color: #475569; color: #FFFFFF; border: 1px solid rgba(255,255,255,0.2); }}

        /* Polished Metric Cards */
        [data-testid="stMetric"] {{
            background-color: #FFFFFF !important;
            border: 1px solid #E2E8F0 !important;
            border-radius: 12px !important;
            padding: 1.1rem 1.25rem !important;
            box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02) !important;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }}
        [data-testid="stMetric"]:hover {{
            transform: translateY(-2px);
            box-shadow: 0 8px 16px -4px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.04) !important;
            border-color: #CBD5E1 !important;
        }}
        [data-testid="stMetricLabel"] {{
            color: #64748B !important;
            font-size: 0.76rem !important;
            font-weight: 700 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.05em !important;
        }}
        [data-testid="stMetricValue"] {{
            color: #0F172A !important;
            font-size: 1.7rem !important;
            font-weight: 800 !important;
            letter-spacing: -0.03em !important;
        }}

        .section-title {{
            font-size: 1.3rem;
            font-weight: 800;
            color: #0F172A !important;
            letter-spacing: -0.025em;
            margin-bottom: 0.25rem;
        }}
        .section-subtitle {{
            font-size: 0.88rem;
            color: #64748B !important;
            margin-bottom: 1.2rem;
            line-height: 1.45;
        }}

        /* Buttons with tactile feedback */
        button[kind="primary"] {{
            background: #0F172A !important;
            background-color: #0F172A !important;
            color: #FFFFFF !important;
            border: 1px solid #0F172A !important;
            border-radius: 8px !important;
            font-weight: 700 !important;
            font-size: 0.92rem !important;
            padding: 0.6rem 1.1rem !important;
            box-shadow: 0 2px 4px rgba(15, 23, 42, 0.15) !important;
            transition: all 0.15s ease-in-out !important;
        }}
        button[kind="primary"]:hover {{
            background: #1E293B !important;
            background-color: #1E293B !important;
            border-color: #1E293B !important;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(15, 23, 42, 0.2) !important;
        }}
        button[kind="secondary"] {{
            background: #FFFFFF !important;
            background-color: #FFFFFF !important;
            color: #1E293B !important;
            border: 1.5px solid #CBD5E1 !important;
            border-radius: 8px !important;
            font-weight: 600 !important;
            font-size: 0.9rem !important;
            padding: 0.55rem 1rem !important;
            transition: all 0.15s ease-in-out !important;
        }}
        button[kind="secondary"]:hover {{
            background: #F8FAFC !important;
            background-color: #F8FAFC !important;
            border-color: #94A3B8 !important;
            color: #0F172A !important;
        }}

        /* Input and Select Styling */
        div[data-testid="stTextInput"] input,
        div[data-testid="stNumberInput"] input,
        div[data-testid="stSelectbox"] > div {{
            border-radius: 8px !important;
            border: 1.5px solid #CBD5E1 !important;
            background-color: #FFFFFF !important;
            color: #0F172A !important;
            font-size: 0.92rem !important;
            transition: border-color 0.15s ease, box-shadow 0.15s ease !important;
        }}
        div[data-testid="stTextInput"] input:focus,
        div[data-testid="stNumberInput"] input:focus {{
            border-color: #2563EB !important;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12) !important;
        }}

        /* Data Tables Styling */
        div[data-testid="stDataFrame"] {{
            border: 1px solid #E2E8F0 !important;
            border-radius: 10px !important;
            overflow: hidden !important;
            background: #FFFFFF !important;
        }}

        /* Tabs styling */
        div[data-testid="stTabs"] button[role="tab"] {{
            font-weight: 700 !important;
            font-size: 0.88rem !important;
            color: #64748B !important;
            border-radius: 6px 6px 0 0 !important;
            padding: 0.6rem 1rem !important;
            transition: color 0.15s ease !important;
        }}
        div[data-testid="stTabs"] button[role="tab"][aria-selected="true"] {{
            color: #0F172A !important;
            border-bottom: 2.5px solid #0F172A !important;
        }}
    </style>
    """, unsafe_allow_html=True)

    active_role = st.session_state["active_role"]
    is_admin = st.session_state["is_admin"]

    # Role-Tailored Menus (Strictly role-isolated)
    if is_admin:
        # Full Staff Command Center
        menu_items = [
            t("nav_admin_cmd", lang),
            t("nav_camps", lang),
            t("nav_inventory", lang),
            t("nav_needs", lang),
            t("nav_dispatches", lang),
            t("nav_donate", lang),
            t("nav_vol_portal", lang),
            t("nav_home", lang)
        ]
    elif active_role == "Volunteer":
        # Volunteer Only Features
        menu_items = [
            t("nav_home", lang),
            t("nav_vol_portal", lang),
            t("nav_needs", lang),
            t("nav_camps", lang),
            t("nav_dispatches", lang)
        ]
    elif active_role == "Donor":
        # Donor Only Features
        menu_items = [
            t("nav_home", lang),
            t("nav_donate", lang),
            t("nav_camps", lang),
            t("nav_inventory", lang),
            t("nav_needs", lang)
        ]
    else:
        # Public Visitor Features (Limited Overview)
        menu_items = [
            t("nav_home", lang),
            t("nav_camps", lang),
            t("nav_needs", lang)
        ]

    # Sidebar Navigation & User Session
    with st.sidebar:
        st.markdown("### RELIEFHUB")
        st.caption(t("app_subtitle", lang))

        st.markdown("---")

        # Trilingual Language Switcher in Sidebar
        st.markdown(f"**{t('language_label', lang)}:**")
        lang_choice = st.selectbox(
            "Language",
            ["English", "اردو (Urdu)", "سنڌي (Sindhi)"],
            index=0 if lang == "en" else (1 if lang == "ur" else 2),
            label_visibility="collapsed"
        )
        new_lang = "en" if lang_choice == "English" else ("ur" if "اردو" in lang_choice else "sd")
        if new_lang != st.session_state["app_lang"]:
            st.session_state["app_lang"] = new_lang
            st.rerun()

        st.markdown("---")

        # Identity Card (matching sign-in page visual identity)
        role_label = t("role_admin", lang) if is_admin else (t("role_volunteer", lang) if active_role == "Volunteer" else (t("role_donor", lang) if active_role == "Donor" else t("role_visitor", lang)))
        pill_class = "sys-pill-admin" if is_admin else ("sys-pill-vol" if active_role == "Volunteer" else ("sys-pill-donor" if active_role == "Donor" else "sys-pill-visitor"))

        st.markdown(f"""
        <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 10px; padding: 0.9rem; margin-bottom: 0.9rem; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
                <div style="width: 28px; height: 28px; border-radius: 50%; background: #0F172A; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: bold;">✛</div>
                <div style="font-size: 0.72rem; color: #64748B; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;">{t("signed_in_as", lang)}</div>
            </div>
            <div style="font-size: 0.88rem; font-weight: 800; color: #0F172A; word-break: break-all; margin-bottom: 0.5rem; line-height: 1.2;">{st.session_state['user_email']}</div>
            <div><span class="sys-pill {pill_class}">{role_label}</span></div>
        </div>
        """, unsafe_allow_html=True)

        if st.button(t("btn_sign_out", lang), use_container_width=True):
            st.session_state["user_authenticated"] = False
            st.session_state["is_admin"] = False
            st.session_state["active_role"] = "Visitor"
            st.session_state["nav_target"] = ""
            st.rerun()

        st.markdown("---")

        # Navigation Selector
        st.markdown("**Navigation:**")
        if st.session_state["nav_target"] in menu_items:
            sel_idx = menu_items.index(st.session_state["nav_target"])
        else:
            sel_idx = 0

        chosen_page = st.radio("Navigation Menu:", menu_items, index=sel_idx, label_visibility="collapsed")
        st.session_state["nav_target"] = chosen_page

    # Top Utility Command Header
    current_time_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    st.markdown(f"""
    <div class="command-header">
        <div>
            <div class="command-header-title">{t("app_title", lang)}</div>
            <div class="command-header-subtitle">{t("app_subtitle", lang)}</div>
        </div>
        <div>
            <span class="sys-pill {pill_class}">{role_label}</span>
            <span style="font-size: 0.75rem; color: #94A3B8; font-family: monospace; margin-left: 0.5rem;">{current_time_str}</span>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # Route Views based on translated keys
    effective_role = config.ROLE_COORDINATOR if is_admin else config.ROLE_VOLUNTEER

    if chosen_page in (t("nav_home", lang),):
        render_home()
    elif chosen_page in (t("nav_admin_cmd", lang),):
        render_dashboard()
    elif chosen_page in (t("nav_camps", lang),):
        render_camps(effective_role)
    elif chosen_page in (t("nav_inventory", lang),):
        render_inventory(effective_role)
    elif chosen_page in (t("nav_needs", lang),):
        render_needs(effective_role)
    elif chosen_page in (t("nav_dispatches", lang),):
        render_dispatches(effective_role)
    elif chosen_page in (t("nav_donate", lang),):
        render_donations(effective_role)
    elif chosen_page in (t("nav_vol_portal", lang),):
        render_volunteers(effective_role)

if __name__ == "__main__":
    main()
