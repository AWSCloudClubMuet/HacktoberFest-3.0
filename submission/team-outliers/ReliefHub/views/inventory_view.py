"""
ReliefHub Inventory Management View (Milestone 2)
Central warehouse stock catalog, category management, reorder alerts, and physical adjustments.
"""

import streamlit as st
import pandas as pd
from services.inventory_service import InventoryService
import config

def render_inventory(current_role: str):
    st.markdown('<div class="section-title">Warehouse Inventory Catalog</div>', unsafe_allow_html=True)
    st.markdown('<div class="section-subtitle">Central supply depot balances, sector classification, units of measure, and automated reorder alerts.</div>', unsafe_allow_html=True)

    is_admin = (current_role == config.ROLE_COORDINATOR)

    # Fetch inventory
    items, err = InventoryService.get_all_inventory()
    if err:
        st.error(f"Failed to synchronize warehouse inventory: {err}")
        return

    # Metrics
    total_items = len(items)
    low_stock_list = [i for i in items if InventoryService.is_low_stock(i)]
    total_categories = len(set(i.get("category") for i in items))
    total_stock_units = sum(int(i.get("stock", 0)) for i in items)

    m1, m2, m3, m4 = st.columns(4)
    with m1:
        st.metric("Cataloged Items", total_items)
    with m2:
        st.metric("Low-Stock Warnings", len(low_stock_list), delta="Items <= Reorder Threshold", delta_color="inverse")
    with m3:
        st.metric("Resource Sectors", total_categories)
    with m4:
        st.metric("Total Physical Units", f"{total_stock_units:,}")

    st.markdown("<br>", unsafe_allow_html=True)

    # Search & filters
    col_search, col_cat, col_low = st.columns([2, 1, 1])
    with col_search:
        search_query = st.text_input("Search catalog items", "").strip().lower()
    with col_cat:
        cat_choices = ["All Sectors"] + config.INVENTORY_CATEGORIES
        selected_cat = st.selectbox("Sector Filter", cat_choices)
    with col_low:
        filter_low_only = st.checkbox("Show Low Stock Only", value=False)

    filtered_items = items
    if search_query:
        filtered_items = [i for i in filtered_items if search_query in i.get("name", "").lower()]
    if selected_cat != "All Sectors":
        filtered_items = [i for i in filtered_items if i.get("category") == selected_cat]
    if filter_low_only:
        filtered_items = [i for i in filtered_items if InventoryService.is_low_stock(i)]

    # Display table
    inv_rows = []
    for i in filtered_items:
        is_low = InventoryService.is_low_stock(i)
        inv_rows.append({
            "ID": str(i.get("id")),
            "Item Description": i.get("name"),
            "Sector": i.get("category"),
            "Available Balance": int(i.get("stock", 0)),
            "Unit": i.get("unit"),
            "Reorder Minimum": int(i.get("reorder_level", 0)),
            "Status": "Low Stock (Reorder Alert)" if is_low else "Nominal"
        })

    if inv_rows:
        st.dataframe(pd.DataFrame(inv_rows), use_container_width=True, hide_index=True)
    else:
        st.info("No catalog items found matching the specified parameters.")

    # Admin Operations (STRICTLY HIDDEN if not coordinator/admin)
    if is_admin:
        st.markdown("<br>", unsafe_allow_html=True)
        st.markdown('<div class="section-title">Coordinator Warehouse Management</div>', unsafe_allow_html=True)
        tab_adjust, tab_add, tab_edit = st.tabs(["Stock Balances & Audits", "Add Catalog Item", "Manage Specifications"])

        with tab_adjust:
            st.caption("Record warehouse inventory audits, physical cycle counts, or inbound batch arrivals.")
            if not items:
                st.info("No items in warehouse.")
            else:
                item_map = {f"#{i['id']} — {i['name']} (Balance: {i['stock']} {i['unit']})": i for i in items}
                adj_choice = st.selectbox("Select Catalog Item to Adjust", list(item_map.keys()))
                target_item = item_map[adj_choice]

                with st.form("quick_adj_form"):
                    col_type, col_delta = st.columns(2)
                    with col_type:
                        adj_direction = st.radio("Adjustment Action", ["Add Balance (Inbound Delivery)", "Reduce Balance (Audit Correction / Spoilage)"])
                    with col_delta:
                        adj_units = st.number_input("Unit Quantity", min_value=1, value=10, step=1)
                    
                    btn_adj = st.form_submit_button("Post Balance Adjustment", use_container_width=True)
                    if btn_adj:
                        delta = int(adj_units) if "Add Balance" in adj_direction else -int(adj_units)
                        success, updated, err_msg = InventoryService.adjust_stock(str(target_item["id"]), delta)
                        if success:
                            st.success(f"Stock for '{target_item['name']}' updated to {updated.get('stock')} {target_item.get('unit')}.")
                            st.rerun()
                        else:
                            st.error(f"Adjustment rejected: {err_msg}")

        with tab_add:
            with st.form("add_item_form", clear_on_submit=True):
                col_a1, col_a2 = st.columns(2)
                with col_a1:
                    new_item_name = st.text_input("Item Name / Description*", placeholder="e.g., Family Tents (4-Person Heavy Duty)")
                    new_item_cat = st.selectbox("Resource Sector*", config.INVENTORY_CATEGORIES)
                    new_item_unit = st.text_input("Unit of Measure*", placeholder="e.g., kits, bags, bottles, cartons")
                with col_a2:
                    new_item_stock = st.number_input("Initial Warehouse Stock*", min_value=0, value=50, step=5)
                    new_item_reorder = st.number_input("Reorder Warning Threshold*", min_value=0, value=20, step=5)
                    st.caption("The system issues a low-stock alert when available balance is less than or equal to this threshold.")

                submit_item = st.form_submit_button("Add to Supply Catalog", use_container_width=True)
                if submit_item:
                    success, data, err_msg = InventoryService.add_item(
                        name=new_item_name,
                        category=new_item_cat,
                        unit=new_item_unit,
                        stock=new_item_stock,
                        reorder_level=new_item_reorder
                    )
                    if success:
                        st.success(f"Item '{new_item_name}' registered successfully with ID #{data.get('id')}.")
                        st.rerun()
                    else:
                        st.error(f"Catalog addition failed: {err_msg}")

        with tab_edit:
            if not items:
                st.info("No items to edit.")
            else:
                edit_item_map = {f"#{i['id']} — {i['name']}": i for i in items}
                edit_choice = st.selectbox("Select Item to Modify", list(edit_item_map.keys()), key="inv_edit_select")
                item_to_edit = edit_item_map[edit_choice]

                with st.form("edit_item_details_form"):
                    col_e1, col_e2 = st.columns(2)
                    with col_e1:
                        e_name = st.text_input("Item Name", value=item_to_edit.get("name"))
                        e_cat = st.selectbox(
                            "Sector",
                            config.INVENTORY_CATEGORIES,
                            index=config.INVENTORY_CATEGORIES.index(item_to_edit.get("category")) if item_to_edit.get("category") in config.INVENTORY_CATEGORIES else 0
                        )
                        e_unit = st.text_input("Unit of Measure", value=item_to_edit.get("unit"))
                    with col_e2:
                        e_stock = st.number_input("Current Warehouse Balance", min_value=0, value=int(item_to_edit.get("stock", 0)), step=5)
                        e_reorder = st.number_input("Reorder Minimum", min_value=0, value=int(item_to_edit.get("reorder_level", 0)), step=5)

                    col_btn_save, col_btn_del = st.columns([3, 1])
                    with col_btn_save:
                        save_item = st.form_submit_button("Save Item Details", use_container_width=True)
                    with col_btn_del:
                        del_item = st.form_submit_button("Delete Catalog Item", type="primary")

                    if save_item:
                        success, updated, err_msg = InventoryService.update_item(str(item_to_edit["id"]), {
                            "name": e_name.strip(),
                            "category": e_cat,
                            "unit": e_unit.strip(),
                            "stock": int(e_stock),
                            "reorder_level": int(e_reorder)
                        })
                        if success:
                            st.success(f"Item #{item_to_edit['id']} updated successfully.")
                            st.rerun()
                        else:
                            st.error(f"Update failed: {err_msg}")

                    if del_item:
                        success, err_msg = InventoryService.delete_item(str(item_to_edit["id"]))
                        if success:
                            st.success(f"Item #{item_to_edit['id']} removed from catalog.")
                            st.rerun()
                        else:
                            st.error(f"Cannot delete item: {err_msg}")
