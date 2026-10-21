"""
ReliefHub Authentication Gate
Solid pure white auth card with high-contrast UI, full trilingual support,
and kid water bottle background image as requested.
"""

import streamlit as st
import base64
import os
from i18n import t

ASSETS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets")
KID_PHOTO = os.path.join(ASSETS_DIR, "kid_water.png")
WORKER_PHOTO = os.path.join(ASSETS_DIR, "relief_workers.jpg")

def _get_bg_data_uri():
    target = KID_PHOTO if os.path.exists(KID_PHOTO) else WORKER_PHOTO
    if os.path.exists(target):
        ext = os.path.splitext(target)[1].lower()
        mime = "image/png" if ext == ".png" else "image/jpeg"
        with open(target, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("utf-8")
        return f"data:{mime};base64,{b64}"
    return ""

def render_login_gate():
    bg_uri = _get_bg_data_uri()
    lang = st.session_state.get("app_lang", "en")

    # CSS to guarantee the right card is 100% solid, opaque white with crisp dark text
    st.markdown(f"""
    <style>
        /* Full-bleed background photo using the uploaded kid image */
        .stApp {{
            background: linear-gradient(to right, rgba(15, 23, 42, 0.55) 0%, rgba(15, 23, 42, 0.75) 100%),
                        url("{bg_uri}") no-repeat center center fixed !important;
            background-size: cover !important;
        }}
        header[data-testid="stHeader"] {{ background: transparent !important; }}
        [data-testid="stSidebar"] {{ display: none !important; }}
        [data-testid="collapsedControl"] {{ display: none !important; }}

        .block-container {{
            padding-top: 3.5rem !important;
            padding-bottom: 3rem !important;
            max-width: 1220px !important;
        }}

        /* The Solid White Card Container */
        div[data-testid="stVerticalBlockBorderWrapper"],
        div[data-testid="stVerticalBlockBorderWrapper"] > div,
        div[data-testid="stColumn"]:nth-of-type(2),
        div[data-testid="column"]:nth-of-type(2),
        div.stColumn:nth-of-type(2),
        div[data-testid="stColumn"]:last-child,
        div[data-testid="column"]:last-child {{
            background: #FFFFFF !important;
            background-color: #FFFFFF !important;
            border-radius: 18px !important;
            box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(226, 232, 240, 0.9) !important;
            border: 1px solid #CBD5E1 !important;
            opacity: 1 !important;
        }}

        div[data-testid="stVerticalBlockBorderWrapper"] {{
            padding: 2.2rem 2.2rem 2rem 2.2rem !important;
        }}

        /* High contrast dark text inside the white card */
        div[data-testid="stVerticalBlockBorderWrapper"] *,
        div[data-testid="stColumn"]:nth-of-type(2) *,
        div[data-testid="column"]:nth-of-type(2) *,
        div.stColumn:nth-of-type(2) * {{
            color: #0F172A;
        }}

        /* Radio button pill row styling */
        div[data-testid="stVerticalBlockBorderWrapper"] div[role="radiogroup"],
        div[data-testid="stColumn"]:nth-of-type(2) div[role="radiogroup"],
        div[data-testid="column"]:nth-of-type(2) div[role="radiogroup"],
        div.stColumn:nth-of-type(2) div[role="radiogroup"] {{
            display: flex !important;
            flex-direction: row !important;
            gap: 0.4rem !important;
            background: #F1F5F9 !important;
            padding: 5px !important;
            border-radius: 10px !important;
            border: 1px solid #E2E8F0 !important;
        }}

        div[data-testid="stVerticalBlockBorderWrapper"] label[data-baseweb="radio"],
        div[data-testid="stColumn"]:nth-of-type(2) label[data-baseweb="radio"],
        div[data-testid="column"]:nth-of-type(2) label[data-baseweb="radio"],
        div.stColumn:nth-of-type(2) label[data-baseweb="radio"] {{
            background: #FFFFFF !important;
            padding: 0.45rem 0.65rem !important;
            border-radius: 7px !important;
            border: 1px solid #CBD5E1 !important;
            flex: 1 !important;
            justify-content: center !important;
            margin: 0 !important;
            cursor: pointer !important;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
        }}

        div[data-testid="stVerticalBlockBorderWrapper"] label[data-baseweb="radio"] span,
        div[data-testid="stColumn"]:nth-of-type(2) label[data-baseweb="radio"] span,
        div[data-testid="column"]:nth-of-type(2) label[data-baseweb="radio"] span,
        div.stColumn:nth-of-type(2) label[data-baseweb="radio"] span {{
            color: #0F172A !important;
            font-weight: 700 !important;
            font-size: 0.85rem !important;
        }}

        /* Text inputs styling */
        div[data-testid="stVerticalBlockBorderWrapper"] input,
        div[data-testid="stColumn"]:nth-of-type(2) input,
        div[data-testid="column"]:nth-of-type(2) input,
        div.stColumn:nth-of-type(2) input {{
            background-color: #FFFFFF !important;
            background: #FFFFFF !important;
            border: 1.5px solid #CBD5E1 !important;
            border-radius: 8px !important;
            color: #0F172A !important;
            padding: 0.65rem 0.85rem !important;
            font-size: 0.92rem !important;
        }}

        div[data-testid="stVerticalBlockBorderWrapper"] input:focus,
        div[data-testid="stColumn"]:nth-of-type(2) input:focus,
        div[data-testid="column"]:nth-of-type(2) input:focus,
        div.stColumn:nth-of-type(2) input:focus {{
            border-color: #2563EB !important;
            outline: none !important;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15) !important;
        }}

        /* Buttons styling */
        div[data-testid="stVerticalBlockBorderWrapper"] button[kind="primary"],
        div[data-testid="stColumn"]:nth-of-type(2) button[kind="primary"],
        div[data-testid="column"]:nth-of-type(2) button[kind="primary"],
        div.stColumn:nth-of-type(2) button[kind="primary"] {{
            background-color: #0F172A !important;
            background: #0F172A !important;
            color: #FFFFFF !important;
            border: 1px solid #0F172A !important;
            border-radius: 8px !important;
            font-weight: 700 !important;
            font-size: 0.95rem !important;
            padding: 0.7rem 1.2rem !important;
            box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.25) !important;
            width: 100% !important;
        }}

        div[data-testid="stVerticalBlockBorderWrapper"] button[kind="primary"] *,
        div[data-testid="stColumn"]:nth-of-type(2) button[kind="primary"] *,
        div[data-testid="column"]:nth-of-type(2) button[kind="primary"] *,
        div.stColumn:nth-of-type(2) button[kind="primary"] * {{
            color: #FFFFFF !important;
            font-weight: 700 !important;
        }}

        div[data-testid="stVerticalBlockBorderWrapper"] button[kind="primary"]:hover,
        div[data-testid="stColumn"]:nth-of-type(2) button[kind="primary"]:hover,
        div[data-testid="column"]:nth-of-type(2) button[kind="primary"]:hover,
        div.stColumn:nth-of-type(2) button[kind="primary"]:hover {{
            background-color: #1E293B !important;
            border-color: #1E293B !important;
        }}

        div[data-testid="stVerticalBlockBorderWrapper"] button[kind="secondary"],
        div[data-testid="stColumn"]:nth-of-type(2) button[kind="secondary"],
        div[data-testid="column"]:nth-of-type(2) button[kind="secondary"],
        div.stColumn:nth-of-type(2) button[kind="secondary"] {{
            background-color: #F8FAFC !important;
            background: #F8FAFC !important;
            border: 1px solid #CBD5E1 !important;
            border-radius: 8px !important;
            font-weight: 600 !important;
            font-size: 0.88rem !important;
            padding: 0.5rem 0.8rem !important;
        }}

        div[data-testid="stVerticalBlockBorderWrapper"] button[kind="secondary"] *,
        div[data-testid="stColumn"]:nth-of-type(2) button[kind="secondary"] *,
        div[data-testid="column"]:nth-of-type(2) button[kind="secondary"] *,
        div.stColumn:nth-of-type(2) button[kind="secondary"] * {{
            color: #334155 !important;
        }}

        div[data-testid="stVerticalBlockBorderWrapper"] button[kind="secondary"]:hover,
        div[data-testid="stColumn"]:nth-of-type(2) button[kind="secondary"]:hover,
        div[data-testid="column"]:nth-of-type(2) button[kind="secondary"]:hover,
        div.stColumn:nth-of-type(2) button[kind="secondary"]:hover {{
            background-color: #E2E8F0 !important;
            border-color: #94A3B8 !important;
        }}

        div[data-testid="stVerticalBlockBorderWrapper"] button[kind="secondary"]:hover *,
        div[data-testid="stColumn"]:nth-of-type(2) button[kind="secondary"]:hover *,
        div[data-testid="column"]:nth-of-type(2) button[kind="secondary"]:hover *,
        div.stColumn:nth-of-type(2) button[kind="secondary"]:hover * {{
            color: #0F172A !important;
        }}

        .brand-header {{
            text-align: center;
            margin-bottom: 0.8rem;
        }}
        .brand-icon {{
            width: 44px;
            height: 44px;
            background: #5B8296;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: white !important;
            font-size: 22px;
            margin-bottom: 0.25rem;
        }}
        .brand-name {{
            font-size: 1.6rem;
            font-weight: 800;
            color: #0F172A !important;
            letter-spacing: -0.03em;
            line-height: 1.1;
        }}
        .brand-sub {{
            font-size: 0.68rem;
            font-weight: 700;
            color: #64748B !important;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            display: block;
        }}

        .welcome-title {{
            font-size: 1.75rem;
            font-weight: 800;
            color: #0F172A !important;
            text-align: center;
            margin-top: 0.3rem;
            margin-bottom: 0.1rem;
            letter-spacing: -0.02em;
        }}
        .welcome-sub {{
            font-size: 0.88rem;
            color: #64748B !important;
            text-align: center;
            margin-bottom: 1.1rem;
        }}
    </style>
    """, unsafe_allow_html=True)

    col_left, col_card = st.columns([1.1, 1], gap="large")

    with col_left:
        st.markdown(f"""
        <div style="padding-top: 6vh; color: #FFFFFF; text-shadow: 0 2px 8px rgba(0,0,0,0.7);">
            <div style="display: inline-block; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(8px); padding: 0.35rem 0.85rem; border-radius: 20px; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 1rem; border: 1px solid rgba(255,255,255,0.25);">
                🌊 {t("hero_headline", lang)}
            </div>
            <h1 style="color: #FFFFFF; font-size: 2.8rem; font-weight: 800; line-height: 1.15; margin-bottom: 1rem; letter-spacing: -0.03em;">
                {t("app_title", lang)}
            </h1>
            <p style="color: #F1F5F9; font-size: 1.1rem; line-height: 1.6; max-width: 520px; text-shadow: 0 1px 4px rgba(0,0,0,0.6); margin-bottom: 1.5rem;">
                {t("hero_body", lang)}
            </p>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; max-width: 480px; margin-top: 1.5rem;">
                <div style="background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.2); border-radius: 10px; padding: 0.85rem 1rem;">
                    <div style="font-size: 1.55rem; font-weight: 800; color: #FFFFFF;">8</div>
                    <div style="font-size: 0.75rem; color: #CBD5E1; text-transform: uppercase; font-weight: 600;">{t("nav_camps", lang)}</div>
                </div>
                <div style="background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.2); border-radius: 10px; padding: 0.85rem 1rem;">
                    <div style="font-size: 1.55rem; font-weight: 800; color: #38BDF8;">15,400+</div>
                    <div style="font-size: 0.75rem; color: #CBD5E1; text-transform: uppercase; font-weight: 600;">Individuals</div>
                </div>
                <div style="background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.2); border-radius: 10px; padding: 0.85rem 1rem;">
                    <div style="font-size: 1.55rem; font-weight: 800; color: #4ADE80;">PKR 3.4M</div>
                    <div style="font-size: 0.75rem; color: #CBD5E1; text-transform: uppercase; font-weight: 600;">{t("nav_donations", lang)}</div>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)

    with col_card:
        # Solid white container card
        with st.container(border=True):
            st.markdown(f"""
            <div class="brand-header">
                <div class="brand-icon">✛</div>
                <div class="brand-name">ReliefHub</div>
                <span class="brand-sub">{t("hero_headline", lang)}</span>
            </div>
            <div class="welcome-title">{t("welcome_title", lang)}</div>
            <div class="welcome-sub">{t("welcome_sub", lang)}</div>
            """, unsafe_allow_html=True)

            # Language Switcher
            c_lang1, c_lang2, c_lang3 = st.columns(3)
            with c_lang1:
                if st.button("English", use_container_width=True, type="primary" if lang == "en" else "secondary", key="gate_en"):
                    st.session_state["app_lang"] = "en"
                    st.rerun()
            with c_lang2:
                if st.button("اردو", use_container_width=True, type="primary" if lang == "ur" else "secondary", key="gate_ur"):
                    st.session_state["app_lang"] = "ur"
                    st.rerun()
            with c_lang3:
                if st.button("سنڌي", use_container_width=True, type="primary" if lang == "sd" else "secondary", key="gate_sd"):
                    st.session_state["app_lang"] = "sd"
                    st.rerun()

            st.markdown("<br>", unsafe_allow_html=True)

            # 3 Public Role Options (NO Admin in main radio)
            role_map = {
                t("role_donor", lang): "Donor",
                t("role_volunteer", lang): "Volunteer",
                t("role_visitor", lang): "Visitor"
            }
            role_keys = list(role_map.keys())

            selected_label = st.radio(
                "Access Pathway",
                role_keys,
                index=0,
                horizontal=True,
                label_visibility="collapsed",
                key="portal_radio_select"
            )
            selected_mode = role_map[selected_label]

            st.markdown("<br>", unsafe_allow_html=True)

            if selected_mode == "Donor":
                st.markdown(f'<div style="font-size: 0.88rem; font-weight: 700; color: #0F172A; margin-bottom: 0.2rem;">{t("role_donor", lang)}</div>', unsafe_allow_html=True)
                st.markdown(f'<div style="font-size: 0.8rem; color: #475569; margin-bottom: 0.85rem; line-height: 1.4;">{t("donor_login_desc", lang)}</div>', unsafe_allow_html=True)
                donor_email = st.text_input("Email / رابطہ ای میل", placeholder="donor@organization.org", key="auth_donor_email")

                if st.button(t("btn_continue_donor", lang), type="primary", use_container_width=True, key="btn_donor_go"):
                    cleaned_email = donor_email.strip()
                    if not cleaned_email:
                        st.error(t("email_required_error", lang))
                    elif "@" not in cleaned_email or "." not in cleaned_email:
                        st.error(t("email_invalid_error", lang))
                    else:
                        st.session_state["user_authenticated"] = True
                        st.session_state["active_role"] = "Donor"
                        st.session_state["user_email"] = cleaned_email
                        st.session_state["is_admin"] = False
                        st.rerun()

            elif selected_mode == "Volunteer":
                st.markdown(f'<div style="font-size: 0.88rem; font-weight: 700; color: #0F172A; margin-bottom: 0.2rem;">{t("role_volunteer", lang)}</div>', unsafe_allow_html=True)
                st.markdown(f'<div style="font-size: 0.8rem; color: #475569; margin-bottom: 0.85rem; line-height: 1.4;">{t("vol_login_desc", lang)}</div>', unsafe_allow_html=True)
                vol_name = st.text_input("Full Name or Email / نالو يا ايميل", placeholder="e.g., Dr. Ayesha Noor", key="auth_vol_name")

                if st.button(t("btn_continue_vol", lang), type="primary", use_container_width=True, key="btn_vol_go"):
                    cleaned_name = vol_name.strip()
                    if not cleaned_name:
                        st.error(t("name_required_error", lang))
                    else:
                        st.session_state["user_authenticated"] = True
                        st.session_state["active_role"] = "Volunteer"
                        st.session_state["user_email"] = cleaned_name
                        st.session_state["is_admin"] = False
                        st.rerun()

            else:
                # Visitor
                st.markdown(f'<div style="font-size: 0.88rem; font-weight: 700; color: #0F172A; margin-bottom: 0.2rem;">{t("role_visitor", lang)}</div>', unsafe_allow_html=True)
                st.markdown(f'<div style="font-size: 0.8rem; color: #475569; margin-bottom: 0.85rem; line-height: 1.4;">{t("visitor_login_desc", lang)}</div>', unsafe_allow_html=True)

                if st.button(t("btn_continue_visitor", lang), type="primary", use_container_width=True, key="btn_visitor_go"):
                    st.session_state["user_authenticated"] = True
                    st.session_state["active_role"] = "Visitor"
                    st.session_state["user_email"] = "visitor@reliefhub.org"
                    st.session_state["is_admin"] = False
                    st.rerun()

            st.markdown("<hr style='border: none; border-top: 1px solid #E2E8F0; margin: 1.4rem 0;'>", unsafe_allow_html=True)

            # Discrete Staff Login Link
            show_staff = st.checkbox(t("staff_portal_link", lang), value=False, key="cb_show_staff")
            if show_staff:
                staff_pin = st.text_input(t("staff_pin_placeholder", lang), type="password", key="auth_staff_pin")
                if st.button(t("staff_login_btn", lang), use_container_width=True, key="btn_staff_go"):
                    if staff_pin.strip() in ("admin2026", "2026", "admin"):
                        st.session_state["user_authenticated"] = True
                        st.session_state["active_role"] = "Coordinator"
                        st.session_state["user_email"] = "coordinator@reliefhub.org"
                        st.session_state["is_admin"] = True
                        st.success("Authorized!")
                        st.rerun()
                    else:
                        st.error("Invalid Coordinator Passcode. (PIN: admin2026)")

            st.markdown("""
            <div style="text-align: center; font-size: 0.72rem; color: #64748B; margin-top: 1rem;">
                Privacy Policy &bull; Humanitarian Ethics Standards &bull; ReliefHub 2026
            </div>
            """, unsafe_allow_html=True)
