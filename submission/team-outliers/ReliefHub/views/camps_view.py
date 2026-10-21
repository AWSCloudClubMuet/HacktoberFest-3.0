"""
ReliefHub Camp Management View (Milestone 1)
Official relief camp registry, district classification, occupancy tracking, and capacity enforcement.
"""

import streamlit as st
import pandas as pd
from services.camp_service import CampService
from services.volunteer_service import VolunteerService
import config

def render_camps(current_role: str):
    st.markdown('<div class="section-title">Relief Camps Directory</div>', unsafe_allow_html=True)
    st.markdown('<div class="section-subtitle">Official Sindh relief shelter registry, real-time occupancy monitoring, and capacity status control.</div>', unsafe_allow_html=True)

    is_admin = (current_role == config.ROLE_COORDINATOR)

    # Fetch camps
    camps, err = CampService.get_all_camps()
    if err:
        st.error(f"Failed to synchronize camp records: {err}")
        return

    volunteers, _ = VolunteerService.get_all_volunteers()
    vol_counts = {}
    for v in (volunteers or []):
        cid = str(v.get("camp_id"))
        vol_counts[cid] = vol_counts.get(cid, 0) + 1

    # Filter Controls
    col_search, col_district, col_status = st.columns([2, 1, 1])
    with col_search:
        search_query = st.text_input("Search by camp name or district", "").strip().lower()
    with col_district:
        district_options = ["All Districts"] + sorted(list(set(c.get("district") for c in camps if c.get("district"))))
        selected_district = st.selectbox("District Filter", district_options)
    with col_status:
        status_options = ["All Statuses"] + config.CAMP_STATUSES
        selected_status = st.selectbox("Status Filter", status_options)

    # Filter evaluation
    filtered_camps = camps
    if search_query:
        filtered_camps = [
            c for c in filtered_camps
            if search_query in c.get("name", "").lower() or search_query in c.get("district", "").lower()
        ]
    if selected_district != "All Districts":
        filtered_camps = [c for c in filtered_camps if c.get("district") == selected_district]
    if selected_status != "All Statuses":
        filtered_camps = [c for c in filtered_camps if c.get("status") == selected_status]

    st.caption(f"Displaying {len(filtered_camps)} of {len(camps)} registered shelters.")

    # Table
    camp_table_data = []
    for c in filtered_camps:
        cap = int(c.get("capacity", 1))
        fam = int(c.get("current_families", 0))
        util = f"{(fam / cap * 100):.1f}%"
        cid = str(c.get("id"))
        camp_table_data.append({
            "ID": cid,
            "Camp Name": c.get("name"),
            "District": c.get("district"),
            "Capacity": cap,
            "Sheltered Families": fam,
            "Occupancy Rate": util,
            "Status": c.get("status"),
            "Personnel Deployed": vol_counts.get(cid, 0),
            "Focal Person": c.get("contact_person", "-"),
            "Contact Phone": c.get("phone", "-")
        })

    if camp_table_data:
        st.dataframe(pd.DataFrame(camp_table_data), use_container_width=True, hide_index=True)
    else:
        st.info("No camps match the current search or filter criteria.")

    st.markdown("<br>", unsafe_allow_html=True)

    # Detailed Inspection (Visible to everyone)
    st.markdown('<div class="section-title">Camp Inspection & Occupancy</div>', unsafe_allow_html=True)
    if not camps:
        st.info("No camps recorded in the registry.")
    else:
        camp_names = {f"{c['name']} ({c['district']}) — Status: {c['status']}": c for c in camps}
        selected_camp_label = st.selectbox("Select Camp to inspect", list(camp_names.keys()))
        selected_camp = camp_names[selected_camp_label]

        col_d1, col_d2, col_d3 = st.columns(3)
        with col_d1:
            st.write(f"**District:** {selected_camp.get('district')}")
            st.write(f"**Operational Status:** `{selected_camp.get('status')}`")
            st.write(f"**Coordinates:** `{selected_camp.get('lat')}, {selected_camp.get('lon')}`")
        with col_d2:
            cap = int(selected_camp.get("capacity", 1))
            fam = int(selected_camp.get("current_families", 0))
            st.write(f"**Current Families Sheltered:** {fam}")
            st.write(f"**Total Designated Capacity:** {cap}")
            st.progress(min(1.0, fam / max(1, cap)))
        with col_d3:
            st.write(f"**Focal Point:** {selected_camp.get('contact_person', 'Unassigned')}")
            st.write(f"**Emergency Line:** {selected_camp.get('phone', 'N/A')}")
            assigned_vols = [v for v in (volunteers or []) if str(v.get("camp_id")) == str(selected_camp.get("id"))]
            st.write(f"**Deployed Personnel:** {len(assigned_vols)}")

    # Admin Operations (STRICTLY HIDDEN if not coordinator/admin)
    if is_admin:
        st.markdown("<br>", unsafe_allow_html=True)
        st.markdown('<div class="section-title">Coordinator Administrative Controls</div>', unsafe_allow_html=True)
        tab_add, tab_edit = st.tabs(["Register New Relief Shelter", "Modify Shelter Specifications"])

        with tab_add:
            with st.form("add_camp_form", clear_on_submit=True):
                col_a1, col_a2 = st.columns(2)
                with col_a1:
                    new_name = st.text_input("Camp Facility Name*", placeholder="e.g., Sukkur Model High School Camp")
                    new_district = st.selectbox("District*", config.SINDH_DISTRICTS)
                    new_capacity = st.number_input("Maximum Capacity (Families)*", min_value=1, value=200, step=10)
                    new_families = st.number_input("Current Families Sheltered*", min_value=0, value=0, step=5)
                with col_a2:
                    new_status = st.selectbox("Initial Operational Status", ["Active", "Closed"])
                    new_contact = st.text_input("Camp Focal Person Name", placeholder="e.g., Tariq Soomro")
                    new_phone = st.text_input("Emergency Phone Contact", placeholder="+92 300 1234567")
                    col_lat, col_lon = st.columns(2)
                    with col_lat:
                        new_lat = st.number_input("Latitude", value=26.5, format="%.4f")
                    with col_lon:
                        new_lon = st.number_input("Longitude", value=68.5, format="%.4f")

                submit_camp = st.form_submit_button("Register Camp Facility", use_container_width=True)
                if submit_camp:
                    if not new_name.strip():
                        st.error("Camp facility name cannot be blank.")
                    elif new_families > new_capacity:
                        st.error(f"Sheltered families ({new_families}) cannot exceed designated facility capacity ({new_capacity}).")
                    else:
                        success, data, err_msg = CampService.add_camp(
                            name=new_name,
                            district=new_district,
                            capacity=new_capacity,
                            current_families=new_families,
                            status=new_status,
                            lat=new_lat,
                            lon=new_lon,
                            contact_person=new_contact,
                            phone=new_phone
                        )
                        if success:
                            st.success(f"Camp '{new_name}' registered successfully. System status: {data.get('status')}")
                            st.rerun()
                        else:
                            st.error(f"Registration rejected: {err_msg}")

        with tab_edit:
            if not camps:
                st.info("No camps to edit.")
            else:
                edit_camp_choice = st.selectbox(
                    "Select Shelter to Modify",
                    [f"#{c['id']} — {c['name']} ({c['district']})" for c in camps],
                    key="edit_camp_select"
                )
                selected_id = edit_camp_choice.split(" — ")[0].replace("#", "")
                target_camp = next((c for c in camps if str(c["id"]) == selected_id), None)

                if target_camp:
                    with st.form("edit_camp_form"):
                        col_e1, col_e2 = st.columns(2)
                        with col_e1:
                            edit_name = st.text_input("Facility Name", value=target_camp.get("name", ""))
                            edit_district = st.selectbox(
                                "District",
                                config.SINDH_DISTRICTS,
                                index=config.SINDH_DISTRICTS.index(target_camp.get("district")) if target_camp.get("district") in config.SINDH_DISTRICTS else 0
                            )
                            edit_capacity = st.number_input(
                                "Capacity (Families)",
                                min_value=1,
                                value=int(target_camp.get("capacity", 100)),
                                step=10
                            )
                            edit_families = st.number_input(
                                "Current Families Sheltered",
                                min_value=0,
                                value=int(target_camp.get("current_families", 0)),
                                step=5
                            )
                        with col_e2:
                            edit_status = st.selectbox(
                                "Operational Status",
                                config.CAMP_STATUSES,
                                index=config.CAMP_STATUSES.index(target_camp.get("status", "Active"))
                            )
                            edit_contact = st.text_input("Focal Person", value=target_camp.get("contact_person", ""))
                            edit_phone = st.text_input("Emergency Phone", value=target_camp.get("phone", ""))
                            st.caption("Automated Rule: If Sheltered Families reaches Capacity, status updates to 'Full'.")

                        col_save, col_del = st.columns([3, 1])
                        with col_save:
                            update_submit = st.form_submit_button("Save Changes", use_container_width=True)
                        with col_del:
                            delete_submit = st.form_submit_button("Delete Facility", type="primary")

                        if update_submit:
                            if edit_families > edit_capacity:
                                st.error("Sheltered families cannot exceed designated capacity.")
                            else:
                                up_data = {
                                    "name": edit_name.strip(),
                                    "district": edit_district,
                                    "capacity": int(edit_capacity),
                                    "current_families": int(edit_families),
                                    "status": edit_status,
                                    "contact_person": edit_contact.strip(),
                                    "phone": edit_phone.strip()
                                }
                                success, updated, err_msg = CampService.update_camp(selected_id, up_data)
                                if success:
                                    st.success(f"Camp record updated. Operational status: {updated.get('status')}")
                                    st.rerun()
                                else:
                                    st.error(f"Update failed: {err_msg}")

                        if delete_submit:
                            del_success, del_err = CampService.delete_camp(selected_id)
                            if del_success:
                                st.success(f"Camp #{selected_id} removed from system.")
                                st.rerun()
                            else:
                                st.error(f"Deletion blocked: {del_err}")
