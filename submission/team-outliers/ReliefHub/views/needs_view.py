"""
ReliefHub Camp Needs View (Milestone 2)
Tracks resource requests per relief camp, priority rankings, and fulfillment progress.
"""

import streamlit as st
import pandas as pd
from services.need_service import NeedService
from services.camp_service import CampService
from services.inventory_service import InventoryService
import config

def render_needs(current_role: str):
    st.markdown('<div class="section-title">Camp Resource Requests</div>', unsafe_allow_html=True)
    st.markdown('<div class="section-subtitle">Formal resource demand tickets submitted by camp focal points, prioritized by emergency severity.</div>', unsafe_allow_html=True)

    is_admin = (current_role == config.ROLE_COORDINATOR)

    # Fetch data
    needs, err_n = NeedService.get_all_needs()
    camps, err_c = CampService.get_all_camps()
    inventory, err_i = InventoryService.get_all_inventory()

    if err_n or err_c or err_i:
        st.error(f"Error synchronizing resource requests: {err_n or err_c or err_i}")
        return

    camp_dict = {str(c["id"]): c for c in camps}
    inv_dict = {str(i["id"]): i for i in inventory}

    # Summary metrics
    total_needs = len(needs)
    critical_count = sum(1 for n in needs if NeedService.is_critical_gap(n))
    high_count = sum(1 for n in needs if n.get("priority") == "High")
    avg_fulfillment = (
        sum(NeedService.calculate_fulfillment_ratio(n) for n in needs) / total_needs * 100
        if total_needs > 0 else 0.0
    )

    m1, m2, m3, m4 = st.columns(4)
    with m1:
        st.metric("Total Active Requests", total_needs)
    with m2:
        st.metric("Critical Deficits", critical_count, "High Priority & < 40%", delta_color="inverse")
    with m3:
        st.metric("High Priority Demand", high_count)
    with m4:
        st.metric("Mean Fulfillment", f"{avg_fulfillment:.1f}%")

    st.markdown("<br>", unsafe_allow_html=True)

    # Search & filters
    f_col1, f_col2, f_col3 = st.columns([2, 1, 1])
    with f_col1:
        camp_filter_opts = ["All Camps"] + [f"#{c['id']} — {c['name']} ({c['district']})" for c in camps]
        sel_camp_filter = st.selectbox("Filter by Camp", camp_filter_opts)
    with f_col2:
        prio_filter_opts = ["All Priorities"] + config.NEED_PRIORITIES
        sel_prio_filter = st.selectbox("Filter by Priority", prio_filter_opts)
    with f_col3:
        show_critical_only = st.checkbox("Show Critical Deficits Only", value=False)

    filtered_needs = needs
    if sel_camp_filter != "All Camps":
        target_cid = sel_camp_filter.split(" — ")[0].replace("#", "")
        filtered_needs = [n for n in filtered_needs if str(n.get("camp_id")) == target_cid]
    if sel_prio_filter != "All Priorities":
        filtered_needs = [n for n in filtered_needs if n.get("priority") == sel_prio_filter]
    if show_critical_only:
        filtered_needs = [n for n in filtered_needs if NeedService.is_critical_gap(n)]

    # Needs Table
    needs_rows = []
    for n in filtered_needs:
        c_info = camp_dict.get(str(n.get("camp_id")), {})
        i_info = inv_dict.get(str(n.get("inventory_item_id")), {})
        req = int(n.get("required_quantity", 0))
        ful = int(n.get("fulfilled_quantity", 0))
        pct = round((ful / req * 100), 1) if req > 0 else 100.0
        is_crit = NeedService.is_critical_gap(n)

        needs_rows.append({
            "Need ID": str(n.get("id")),
            "Camp": c_info.get("name", "N/A"),
            "District": c_info.get("district", "N/A"),
            "Resource Requested": i_info.get("name", "N/A"),
            "Unit": i_info.get("unit", "units"),
            "Required": req,
            "Fulfilled": ful,
            "Unmet Deficit": max(0, req - ful),
            "Fulfillment Rate": f"{pct}%",
            "Priority": n.get("priority"),
            "Status": "Critical Deficit (<40%)" if is_crit else ("Fulfilled" if ful >= req else "In Progress")
        })

    if needs_rows:
        st.dataframe(pd.DataFrame(needs_rows), use_container_width=True, hide_index=True)
    else:
        st.info("No resource requests found for this filter combination.")

    st.markdown("<br>", unsafe_allow_html=True)

    # Request Management Tabs
    if is_admin:
        tabs = st.tabs(["Update & Prioritize Requests", "Submit Camp Resource Request"])

        with tabs[0]:
            st.markdown('<div class="section-title">Update or Prioritize Camp Requests</div>', unsafe_allow_html=True)
            if not needs:
                st.info("No requests available.")
            else:
                need_labels = {
                    f"Need #{n['id']} — {camp_dict.get(str(n.get('camp_id')), {}).get('name', 'Camp')} ({inv_dict.get(str(n.get('inventory_item_id')), {}).get('name', 'Item')})": n
                    for n in needs
                }
                sel_need_label = st.selectbox("Select Request to Modify", list(need_labels.keys()), key="need_edit_select")
                target_need = need_labels[sel_need_label]

                with st.form("edit_need_form"):
                    col_un1, col_un2 = st.columns(2)
                    with col_un1:
                        u_req = st.number_input("Required Quantity", min_value=1, value=int(target_need.get("required_quantity", 10)), step=5)
                        u_ful = st.number_input("Fulfilled Quantity", min_value=0, value=int(target_need.get("fulfilled_quantity", 0)), step=5)
                    with col_un2:
                        u_prio = st.selectbox(
                            "Priority Tier",
                            config.NEED_PRIORITIES,
                            index=config.NEED_PRIORITIES.index(target_need.get("priority", "Medium"))
                        )

                    col_u_save, col_u_del = st.columns([3, 1])
                    with col_u_save:
                        btn_save_need = st.form_submit_button("Save Updates", use_container_width=True)
                    with col_u_del:
                        btn_del_need = st.form_submit_button("Remove Request", type="primary")

                    if btn_save_need:
                        success, updated, err_msg = NeedService.update_need(str(target_need["id"]), {
                            "required_quantity": int(u_req),
                            "fulfilled_quantity": int(u_ful),
                            "priority": u_prio
                        })
                        if success:
                            st.success(f"Need #{target_need['id']} updated successfully.")
                            st.rerun()
                        else:
                            st.error(f"Update failed: {err_msg}")

                    if btn_del_need:
                        del_success, del_err = NeedService.delete_need(str(target_need["id"]))
                        if del_success:
                            st.success(f"Need #{target_need['id']} removed.")
                            st.rerun()
                        else:
                            st.error(f"Deletion blocked: {del_err}")

        with tabs[1]:
            st.markdown('<div class="section-title">Submit Resource Request for Camp</div>', unsafe_allow_html=True)
            with st.form("create_need_form_adm", clear_on_submit=True):
                col_cn1, col_cn2 = st.columns(2)
                with col_cn1:
                    camp_choices = {f"#{c['id']} — {c['name']} ({c['district']})": c for c in camps}
                    chosen_camp = st.selectbox("Target Relief Camp*", list(camp_choices.keys()))
                    item_choices = {f"#{i['id']} — {i['name']} [Warehouse Balance: {i['stock']} {i['unit']}]": i for i in inventory}
                    chosen_item = st.selectbox("Resource Required*", list(item_choices.keys()))
                with col_cn2:
                    req_qty = st.number_input("Required Unit Quantity*", min_value=1, value=50, step=5)
                    need_prio = st.selectbox("Emergency Priority Tier*", config.NEED_PRIORITIES, index=0)
                    initial_ful = st.number_input("Initially Fulfilled Quantity", min_value=0, value=0, step=5)

                btn_sub_need = st.form_submit_button("Submit Camp Request", use_container_width=True)
                if btn_sub_need:
                    c_id = str(camp_choices[chosen_camp]["id"])
                    i_id = str(item_choices[chosen_item]["id"])
                    success, data, err_msg = NeedService.add_need(
                        camp_id=c_id,
                        inventory_item_id=i_id,
                        required_quantity=req_qty,
                        priority=need_prio,
                        fulfilled_quantity=initial_ful
                    )
                    if success:
                        st.success(f"Resource request for {req_qty} units created successfully (Need ID #{data.get('id')}).")
                        st.rerun()
                    else:
                        st.error(f"Failed to submit request: {err_msg}")

    else:
        # Non-admin persona
        tabs = st.tabs(["Submit Resource Request"])

        with tabs[0]:
            st.markdown('<div class="section-title">Submit Resource Request for Camp</div>', unsafe_allow_html=True)
            with st.form("create_need_form", clear_on_submit=True):
                col_cn1, col_cn2 = st.columns(2)
                with col_cn1:
                    camp_choices = {f"#{c['id']} — {c['name']} ({c['district']})": c for c in camps}
                    chosen_camp = st.selectbox("Target Relief Camp*", list(camp_choices.keys()))
                    item_choices = {f"#{i['id']} — {i['name']} [Warehouse Balance: {i['stock']} {i['unit']}]": i for i in inventory}
                    chosen_item = st.selectbox("Resource Required*", list(item_choices.keys()))
                with col_cn2:
                    req_qty = st.number_input("Required Unit Quantity*", min_value=1, value=50, step=5)
                    need_prio = st.selectbox("Emergency Priority Tier*", config.NEED_PRIORITIES, index=0)
                    initial_ful = st.number_input("Initially Fulfilled Quantity", min_value=0, value=0, step=5)

                btn_sub_need = st.form_submit_button("Submit Camp Request", use_container_width=True)
                if btn_sub_need:
                    c_id = str(camp_choices[chosen_camp]["id"])
                    i_id = str(item_choices[chosen_item]["id"])
                    success, data, err_msg = NeedService.add_need(
                        camp_id=c_id,
                        inventory_item_id=i_id,
                        required_quantity=req_qty,
                        priority=need_prio,
                        fulfilled_quantity=initial_ful
                    )
                    if success:
                        st.success(f"Resource request for {req_qty} units created successfully (Need ID #{data.get('id')}).")
                        st.rerun()
                    else:
                        st.error(f"Failed to submit request: {err_msg}")
