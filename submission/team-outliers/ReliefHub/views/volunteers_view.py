"""
ReliefHub Volunteer Management View (Milestone 4)
Volunteer application, responder roster, and coordinator assignment controls.
"""

import streamlit as st
import pandas as pd
from services.volunteer_service import VolunteerService
from services.camp_service import CampService
import config

def render_volunteers(current_role: str):
    st.markdown('<div class="section-title">Volunteer Mobilization & Responder Roster</div>', unsafe_allow_html=True)
    st.markdown('<div class="section-subtitle">Join the Sindh flood relief corps, verify field assignments, and coordinate responder deployment.</div>', unsafe_allow_html=True)

    is_admin = (current_role == config.ROLE_COORDINATOR)

    # Fetch data
    volunteers, err_v = VolunteerService.get_all_volunteers()
    camps, err_c = CampService.get_all_camps()

    if err_v or err_c:
        st.error(f"Failed to synchronize responder records: {err_v or err_c}")
        return

    camp_dict = {str(c["id"]): c for c in camps}

    # Summary metrics
    total_volunteers = len(volunteers)
    deployed_count = sum(1 for v in volunteers if v.get("camp_id") is not None and str(v.get("camp_id")) != "")
    available_count = total_volunteers - deployed_count

    m1, m2, m3 = st.columns(3)
    with m1:
        st.metric("Registered Responders", total_volunteers)
    with m2:
        st.metric(
            "Active Deployments",
            deployed_count,
            delta=f"Assigned across {len(set(str(v.get('camp_id')) for v in volunteers if v.get('camp_id')))} Camps",
            delta_color="off"
        )
    with m3:
        st.metric("Available for Tasking", available_count, delta="Ready on Standby", delta_color="off")

    st.markdown("<br>", unsafe_allow_html=True)

    # Tabs structure tailored to user persona
    if is_admin:
        tabs = st.tabs([
            "Coordinator Deployment Controls",
            "Responder Roster & Deployment Status",
            "Register New Responder"
        ])

        # Tab 1 for Admin: Deployment & Camp Assignment Controls
        with tabs[0]:
            st.markdown("""
            <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 1.4rem 1.6rem; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04); margin-bottom: 1.2rem;">
                <div style="font-weight: 800; color: #0F172A; font-size: 1.15rem; letter-spacing: -0.02em; margin-bottom: 0.2rem;">Assign or Unassign Volunteer Deployments</div>
                <div style="font-size: 0.84rem; color: #64748B; margin-bottom: 1.2rem;">Deployment Policy: Each responder can hold at most one active camp assignment. Assignment to Closed camps is prohibited.</div>
            """, unsafe_allow_html=True)

            if not volunteers:
                st.info("No volunteers available.")
            else:
                vol_opts = {
                    f"#{v['id']} — {v['name']} ({v['skill']}) [Current: {camp_dict.get(str(v.get('camp_id')), {}).get('name', 'Unassigned')}]": v
                    for v in volunteers
                }
                sel_v_label = st.selectbox("Select Volunteer Responder", list(vol_opts.keys()))
                target_v = vol_opts[sel_v_label]
                v_id = str(target_v["id"])

                col_action, col_camp_sel = st.columns(2)
                with col_action:
                    assign_mode = st.radio("Deployment Action", ["Assign / Reassign to Camp", "Unassign from Camp (Mark Available)"])

                with col_camp_sel:
                    if assign_mode == "Assign / Reassign to Camp":
                        active_camps = [c for c in camps if c.get("status") != "Closed"]
                        camp_select_map = {f"#{c['id']} — {c['name']} ({c['district']}) [Status: {c['status']}]": c for c in active_camps}
                        chosen_camp_lbl = st.selectbox("Select Target Shelter", list(camp_select_map.keys()))
                        new_camp_id = str(camp_select_map[chosen_camp_lbl]["id"])
                    else:
                        new_camp_id = None
                        st.info("Will mark responder as Available on Standby Roster.")

                if st.button("Save Deployment Change", type="primary", use_container_width=True):
                    success, updated, err_msg = VolunteerService.assign_to_camp(v_id, new_camp_id)
                    if success:
                        if new_camp_id:
                            st.success(f"Volunteer '{target_v['name']}' assigned to Camp #{new_camp_id}.")
                        else:
                            st.success(f"Volunteer '{target_v['name']}' unassigned and marked Available.")
                        st.rerun()
                    else:
                        st.error(f"Deployment rejected: {err_msg}")
            st.markdown("</div>", unsafe_allow_html=True)

        # Tab 2 for Admin: Roster Table
        with tabs[1]:
            st.markdown("""
            <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 1.4rem 1.6rem; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04); margin-bottom: 1.2rem;">
                <div style="font-weight: 800; color: #0F172A; font-size: 1.15rem; letter-spacing: -0.02em; margin-bottom: 0.2rem;">Active Volunteer Directory</div>
                <div style="font-size: 0.84rem; color: #64748B; margin-bottom: 1rem;">Filter responders by emergency skill or search by full name.</div>
            """, unsafe_allow_html=True)
            col_search, col_skill = st.columns([2, 1])
            with col_search:
                search_v = st.text_input("Search volunteer by name", "", key="adm_search_v").strip().lower()
            with col_skill:
                skill_opts = ["All Skills"] + config.VOLUNTEER_SKILLS
                selected_skill = st.selectbox("Filter Skill", skill_opts, key="adm_filter_skill")

            filtered_vols = volunteers
            if search_v:
                filtered_vols = [v for v in filtered_vols if search_v in v.get("name", "").lower()]
            if selected_skill != "All Skills":
                filtered_vols = [v for v in filtered_vols if v.get("skill") == selected_skill]

            v_rows = []
            for v in filtered_vols:
                cid = str(v.get("camp_id")) if v.get("camp_id") else None
                c_info = camp_dict.get(cid, {}) if cid else {}
                camp_display = f"{c_info.get('name')} ({c_info.get('district')})" if c_info else "Available (Standby Roster)"
                
                v_rows.append({
                    "Volunteer ID": str(v.get("id")),
                    "Full Name": v.get("name"),
                    "Skill Specialization": v.get("skill"),
                    "Contact Phone": v.get("phone", "-"),
                    "Assigned Shelter": camp_display,
                    "Shelter Status": c_info.get("status", "-")
                })

            if v_rows:
                st.dataframe(pd.DataFrame(v_rows), use_container_width=True, hide_index=True)
            else:
                st.info("No volunteers match your search criteria.")
            st.markdown("</div>", unsafe_allow_html=True)

        # Tab 3 for Admin: Register Walk-In Volunteer
        with tabs[2]:
            st.markdown("""
            <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 1.4rem 1.6rem; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04); margin-bottom: 1.2rem;">
                <div style="font-weight: 800; color: #0F172A; font-size: 1.15rem; letter-spacing: -0.02em; margin-bottom: 0.2rem;">Register Field Responder</div>
                <div style="font-size: 0.84rem; color: #64748B; margin-bottom: 1.2rem;">Direct coordinator intake for on-site medical, driving, cooking, or logistics volunteers.</div>
            """, unsafe_allow_html=True)
            with st.form("quick_vol_apply_form_admin", clear_on_submit=True):
                col_v1, col_v2 = st.columns(2)
                with col_v1:
                    applicant_name = st.text_input("Full Name*", placeholder="e.g., Dr. Hamza Baloch")
                    applicant_phone = st.text_input("Emergency Phone Contact*", placeholder="+92 300 1234567")
                with col_v2:
                    applicant_skill = st.selectbox("Primary Skill Specialization*", config.VOLUNTEER_SKILLS)
                    eligible_camps = [c for c in camps if c.get("status") != "Closed"]
                    camp_options = ["Any Camp (Where Most Needed)"] + [f"{c['name']} ({c['district']})" for c in eligible_camps]
                    preferred_camp_label = st.selectbox("Preferred Deployment Camp", camp_options)

                btn_apply = st.form_submit_button("Register Volunteer", type="primary", use_container_width=True)
                if btn_apply:
                    if not applicant_name.strip() or len(applicant_name.strip()) < 3:
                        st.error("Please enter a valid full legal name.")
                    elif not applicant_phone.strip() or len(applicant_phone.strip()) < 7:
                        st.error("Please enter a valid contact phone number.")
                    else:
                        target_cid = None
                        if preferred_camp_label != "Any Camp (Where Most Needed)":
                            matched = next((c for c in eligible_camps if f"{c['name']} ({c['district']})" == preferred_camp_label), None)
                            if matched:
                                target_cid = str(matched["id"])

                        success, data, err_msg = VolunteerService.register_volunteer(
                            name=applicant_name.strip(),
                            skill=applicant_skill,
                            phone=applicant_phone.strip(),
                            camp_id=target_cid
                        )
                        if success:
                            st.success(f"Volunteer #{data.get('id')} ({applicant_name}) registered successfully.")
                            st.rerun()
                        else:
                            st.error(f"Registration failed: {err_msg}")
            st.markdown("</div>", unsafe_allow_html=True)

    else:
        # Non-admin persona (Field Volunteer or Public Visitor)
        tabs = st.tabs(["Apply as Volunteer", "Responder Roster & Deployment Status"])

        with tabs[0]:
            st.markdown("""
            <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 1.4rem 1.6rem; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04); margin-bottom: 1.2rem;">
                <div style="font-weight: 800; color: #0F172A; font-size: 1.15rem; letter-spacing: -0.02em; margin-bottom: 0.2rem;">Field Responder Application</div>
                <div style="font-size: 0.84rem; color: #64748B; margin-bottom: 1.2rem;">We urgently need skilled hands on the ground in Sindh. Fill out this brief 1-minute form to register.</div>
            """, unsafe_allow_html=True)

            with st.form("quick_vol_apply_form", clear_on_submit=True):
                col_v1, col_v2 = st.columns(2)
                with col_v1:
                    applicant_name = st.text_input("Full Name*", placeholder="e.g., Dr. Hamza Baloch")
                    applicant_phone = st.text_input("Emergency Phone Contact*", placeholder="+92 300 1234567")
                with col_v2:
                    applicant_skill = st.selectbox("Primary Skill Specialization*", config.VOLUNTEER_SKILLS)
                    eligible_camps = [c for c in camps if c.get("status") != "Closed"]
                    camp_options = ["Any Camp (Where Most Needed)"] + [f"{c['name']} ({c['district']})" for c in eligible_camps]
                    preferred_camp_label = st.selectbox("Preferred Deployment Camp", camp_options)

                btn_apply = st.form_submit_button("Submit Volunteer Application", type="primary", use_container_width=True)
                if btn_apply:
                    if not applicant_name.strip() or len(applicant_name.strip()) < 3:
                        st.error("Please enter your valid full legal name.")
                    elif not applicant_phone.strip() or len(applicant_phone.strip()) < 7:
                        st.error("Please enter a valid contact phone number.")
                    else:
                        target_cid = None
                        if preferred_camp_label != "Any Camp (Where Most Needed)":
                            matched = next((c for c in eligible_camps if f"{c['name']} ({c['district']})" == preferred_camp_label), None)
                            if matched:
                                target_cid = str(matched["id"])

                        success, data, err_msg = VolunteerService.register_volunteer(
                            name=applicant_name.strip(),
                            skill=applicant_skill,
                            phone=applicant_phone.strip(),
                            camp_id=target_cid
                        )
                        if success:
                            st.success(f"Application Accepted! Welcome aboard, {applicant_name}. Your Volunteer ID is #{data.get('id')}.")
                            st.balloons()
                            st.rerun()
                        else:
                            st.error(f"Application rejected: {err_msg}")
            st.markdown("</div>", unsafe_allow_html=True)

        with tabs[1]:
            st.markdown("""
            <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 1.4rem 1.6rem; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04); margin-bottom: 1.2rem;">
                <div style="font-weight: 800; color: #0F172A; font-size: 1.15rem; letter-spacing: -0.02em; margin-bottom: 0.2rem;">Active Volunteer Directory</div>
                <div style="font-size: 0.84rem; color: #64748B; margin-bottom: 1rem;">Live registry of mobilized flood responders across Sindh shelters.</div>
            """, unsafe_allow_html=True)
            col_search, col_skill = st.columns([2, 1])
            with col_search:
                search_v = st.text_input("Search volunteer by name", "").strip().lower()
            with col_skill:
                skill_opts = ["All Skills"] + config.VOLUNTEER_SKILLS
                selected_skill = st.selectbox("Filter Skill", skill_opts)

            filtered_vols = volunteers
            if search_v:
                filtered_vols = [v for v in filtered_vols if search_v in v.get("name", "").lower()]
            if selected_skill != "All Skills":
                filtered_vols = [v for v in filtered_vols if v.get("skill") == selected_skill]

            v_rows = []
            for v in filtered_vols:
                cid = str(v.get("camp_id")) if v.get("camp_id") else None
                c_info = camp_dict.get(cid, {}) if cid else {}
                camp_display = f"{c_info.get('name')} ({c_info.get('district')})" if c_info else "Available (Standby Roster)"
                
                v_rows.append({
                    "Volunteer ID": str(v.get("id")),
                    "Full Name": v.get("name"),
                    "Skill Specialization": v.get("skill"),
                    "Contact Phone": v.get("phone", "-"),
                    "Assigned Shelter": camp_display,
                    "Shelter Status": c_info.get("status", "-")
                })

            if v_rows:
                st.dataframe(pd.DataFrame(v_rows), use_container_width=True, hide_index=True)
            else:
                st.info("No volunteers match your search criteria.")
            st.markdown("</div>", unsafe_allow_html=True)
