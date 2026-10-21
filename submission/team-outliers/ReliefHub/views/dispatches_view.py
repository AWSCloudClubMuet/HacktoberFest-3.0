"""
ReliefHub Dispatches View (Milestone 3)
Tracks dispatch lifecycle, atomic inventory reservation, and status transition pipeline.
"""

import streamlit as st
import pandas as pd
from services.dispatch_service import DispatchService
from services.camp_service import CampService
from services.need_service import NeedService
from services.inventory_service import InventoryService
import config

def render_dispatches(current_role: str):
    st.markdown('<div class="section-title">Dispatch Pipeline & Convoy Tracking</div>', unsafe_allow_html=True)
    st.markdown('<div class="section-subtitle">Coordinate outgoing relief convoys with guaranteed stock reservation and anti-over-dispatch rules.</div>', unsafe_allow_html=True)

    is_admin = (current_role == config.ROLE_COORDINATOR)

    # Fetch data
    dispatches, err_d = DispatchService.get_all_dispatches()
    camps, err_c = CampService.get_all_camps()
    needs, err_n = NeedService.get_all_needs()
    inventory, err_i = InventoryService.get_all_inventory()

    if err_d or err_c or err_n or err_i:
        st.error(f"Failed to synchronize dispatch records: {err_d or err_c or err_n or err_i}")
        return

    camp_dict = {str(c["id"]): c for c in camps}
    need_dict = {str(n["id"]): n for n in needs}
    inv_dict = {str(i["id"]): i for i in inventory}

    # Pipeline counts
    cnt_pending = sum(1 for d in dispatches if d.get("status") == "Pending")
    cnt_transit = sum(1 for d in dispatches if d.get("status") == "In Transit")
    cnt_delivered = sum(1 for d in dispatches if d.get("status") == "Delivered")
    cnt_cancelled = sum(1 for d in dispatches if d.get("status") == "Cancelled")

    c1, c2, c3, c4 = st.columns(4)
    with c1:
        st.metric("Pending Reservations", cnt_pending, delta="Reserved at Warehouse", delta_color="off")
    with c2:
        st.metric("In Transit Convoys", cnt_transit, delta="En Route to Shelter", delta_color="off")
    with c3:
        st.metric("Delivered Dispatches", cnt_delivered, delta="Fulfillment Recorded", delta_color="normal")
    with c4:
        st.metric("Cancelled Convoys", cnt_cancelled, delta="Stock Returned to Balance", delta_color="off")

    st.markdown("<br>", unsafe_allow_html=True)

    # Filter controls
    f1, f2 = st.columns(2)
    with f1:
        st_opts = ["All Statuses"] + config.DISPATCH_STATUSES
        sel_st = st.selectbox("Filter by Status", st_opts)
    with f2:
        camp_opts = ["All Destination Camps"] + [f"#{c['id']} — {c['name']}" for c in camps]
        sel_c = st.selectbox("Filter by Destination", camp_opts)

    filtered_disp = dispatches
    if sel_st != "All Statuses":
        filtered_disp = [d for d in filtered_disp if d.get("status") == sel_st]
    if sel_c != "All Destination Camps":
        cid = sel_c.split(" — ")[0].replace("#", "")
        filtered_disp = [d for d in filtered_disp if str(d.get("camp_id")) == cid]

    # Pipeline Table
    disp_rows = []
    for d in filtered_disp:
        c_info = camp_dict.get(str(d.get("camp_id")), {})
        n_info = need_dict.get(str(d.get("need_id")), {})
        i_info = inv_dict.get(str(n_info.get("inventory_item_id")), {}) if n_info else {}

        disp_rows.append({
            "Dispatch ID": str(d.get("id")),
            "Destination Camp": c_info.get("name", f"Camp #{d.get('camp_id')}"),
            "District": c_info.get("district", "N/A"),
            "Supply Item": i_info.get("name", "N/A"),
            "Quantity": int(d.get("quantity", 0)),
            "Unit": i_info.get("unit", "units"),
            "Status": d.get("status"),
            "Logged Timestamp": d.get("timestamp", "-")
        })

    if disp_rows:
        st.dataframe(pd.DataFrame(disp_rows), use_container_width=True, hide_index=True)
    else:
        st.info("No dispatches match the selected filter.")

    # Coordinator Dispatch Actions (Admin ONLY)
    if is_admin:
        st.markdown("<br>", unsafe_allow_html=True)
        st.markdown('<div class="section-title">Coordinator Dispatch Control Center</div>', unsafe_allow_html=True)
        tab_new_disp, tab_actions = st.tabs(["Authorize New Dispatch", "Convoy Lifecycle & Status Transitions"])

        with tab_new_disp:
            st.caption("Guaranteed stock reservation: Stock is immediately reserved in the warehouse upon dispatch authorization.")

            active_camps = [c for c in camps if c.get("status") != "Closed"]
            if not active_camps:
                st.warning("No active camps currently open to receive dispatches.")
            else:
                camp_map = {f"#{c['id']} — {c['name']} ({c['district']})": c for c in active_camps}
                chosen_camp_label = st.selectbox("Step 1: Select Destination Camp", list(camp_map.keys()))
                chosen_camp = camp_map[chosen_camp_label]
                chosen_camp_id = str(chosen_camp["id"])

                camp_needs = [n for n in needs if str(n.get("camp_id")) == chosen_camp_id]
                
                unmet_needs = []
                for n in camp_needs:
                    unres, _ = NeedService.get_remaining_unreserved(str(n["id"]))
                    if unres > 0:
                        unmet_needs.append((n, unres))

                if not unmet_needs:
                    st.info(f"All registered needs for '{chosen_camp['name']}' are currently fully satisfied or covered by pending convoys.")
                else:
                    need_labels = {}
                    for n, unres in unmet_needs:
                        item_info = inv_dict.get(str(n.get("inventory_item_id")), {})
                        item_name = item_info.get("name", "Resource")
                        curr_stock = item_info.get("stock", 0)
                        unit = item_info.get("unit", "units")
                        label = f"Need #{n['id']} — {item_name} (Unreserved Need: {unres} {unit} | Warehouse Stock: {curr_stock} {unit} | Priority: {n.get('priority')})"
                        need_labels[label] = (n, unres, curr_stock, unit, item_info)

                    chosen_need_label = st.selectbox("Step 2: Select Unmet Camp Need", list(need_labels.keys()))
                    target_need, unres_qty, warehouse_stock, unit_name, item_obj = need_labels[chosen_need_label]

                    max_dispatchable = min(unres_qty, warehouse_stock)

                    col_stat1, col_stat2, col_stat3 = st.columns(3)
                    with col_stat1:
                        st.metric("Remaining Unreserved Need", f"{unres_qty} {unit_name}")
                    with col_stat2:
                        st.metric("Warehouse Balance Available", f"{warehouse_stock} {unit_name}")
                    with col_stat3:
                        st.metric("Maximum Allowable Dispatch", f"{max_dispatchable} {unit_name}")

                    if max_dispatchable <= 0:
                        st.error(f"Cannot authorize dispatch: Warehouse currently has 0 available {unit_name}. Restock or record an in-kind donation first.")
                    else:
                        with st.form("create_dispatch_form"):
                            dispatch_qty = st.number_input(
                                f"Dispatch Quantity ({unit_name})*",
                                min_value=1,
                                max_value=max_dispatchable,
                                value=min(max_dispatchable, 20),
                                step=1,
                                help=f"Cannot exceed available warehouse stock ({warehouse_stock}) or unmet need ({unres_qty})."
                            )
                            btn_send = st.form_submit_button("Reserve Stock & Authorize Dispatch", use_container_width=True)
                            if btn_send:
                                success, disp_rec, err_msg = DispatchService.create_dispatch(
                                    camp_id=chosen_camp_id,
                                    need_id=str(target_need["id"]),
                                    quantity=int(dispatch_qty)
                                )
                                if success:
                                    st.success(f"Dispatch #{disp_rec.get('id')} authorized. Reserved {dispatch_qty} {unit_name} from warehouse balance.")
                                    st.rerun()
                                else:
                                    st.error(f"Dispatch failed: {err_msg}")

        with tab_actions:
            st.caption("Advance convoy state through the distribution lifecycle or abort to restore reserved stock.")
            
            active_dispatches = [d for d in dispatches if d.get("status") in ("Pending", "In Transit")]
            if not active_dispatches:
                st.info("No active (Pending or In Transit) dispatches awaiting status transition.")
            else:
                action_map = {}
                for d in active_dispatches:
                    c_name = camp_dict.get(str(d.get("camp_id")), {}).get("name", "Camp")
                    n_info = need_dict.get(str(d.get("need_id")), {})
                    i_name = inv_dict.get(str(n_info.get("inventory_item_id")), {}).get("name", "Item") if n_info else "Item"
                    action_map[f"Dispatch #{d['id']} -> {c_name} ({d.get('quantity')} units of {i_name}) [Status: {d.get('status')}]"] = d

                sel_action_key = st.selectbox("Select Active Dispatch", list(action_map.keys()))
                target_d = action_map[sel_action_key]
                d_id = str(target_d["id"])
                curr_st = target_d.get("status")

                st.write(f"**Current Status:** `{curr_st}` | **Quantity:** {target_d.get('quantity')} units")

                col_btn1, col_btn2, col_btn3 = st.columns(3)
                with col_btn1:
                    if curr_st == "Pending":
                        if st.button("Mark In Transit", key=f"btn_transit_{d_id}", use_container_width=True):
                            s, _, err_msg = DispatchService.update_status(d_id, "In Transit")
                            if s:
                                st.success(f"Dispatch #{d_id} marked as In Transit.")
                                st.rerun()
                            else:
                                st.error(err_msg)
                    else:
                        st.info("Status: En Route (In Transit)")

                with col_btn2:
                    if st.button("Confirm Delivery", key=f"btn_deliver_{d_id}", use_container_width=True, type="primary"):
                        s, _, err_msg = DispatchService.update_status(d_id, "Delivered")
                        if s:
                            st.success(f"Dispatch #{d_id} delivered. Need fulfillment successfully incremented.")
                            st.rerun()
                        else:
                            st.error(err_msg)

                with col_btn3:
                    if st.button("Cancel Convoy (Restore Stock)", key=f"btn_cancel_{d_id}", use_container_width=True):
                        s, _, err_msg = DispatchService.update_status(d_id, "Cancelled")
                        if s:
                            st.warning(f"Dispatch #{d_id} cancelled. {target_d.get('quantity')} units restored to warehouse balance.")
                            st.rerun()
                        else:
                            st.error(err_msg)
