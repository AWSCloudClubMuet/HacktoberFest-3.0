"""
ReliefHub Donations View (Milestone 4)
Records Cash and In-Kind donations, automatic warehouse replenishment, and contribution analytics.
"""

import streamlit as st
import pandas as pd
import plotly.express as px
from services.donation_service import DonationService
from services.inventory_service import InventoryService
import config

def render_donations(current_role: str):
    st.markdown('<div class="section-title">Relief Aid & Donations Ledger</div>', unsafe_allow_html=True)
    st.markdown('<div class="section-subtitle">Audit incoming monetary grants and physical supplies with real-time warehouse inventory replenishment.</div>', unsafe_allow_html=True)

    # Fetch data
    donations, err_don = DonationService.get_all_donations()
    inventory, err_inv = InventoryService.get_all_inventory()
    summary, _ = DonationService.get_donation_summary()

    if err_don or err_inv:
        st.error(f"Failed to synchronize donations data: {err_don or err_inv}")
        return

    inv_dict = {str(i["id"]): i for i in inventory}

    # Top summary metrics
    total_cash = summary.get("total_cash", 0.0)
    total_in_kind = summary.get("total_in_kind_units", 0)
    total_donors = len(donations)

    m1, m2, m3 = st.columns(3)
    with m1:
        st.metric(
            label="Monetary Aid Received",
            value=f"PKR {total_cash:,.0f}",
            delta=f"{len([d for d in donations if d.get('type') == 'Cash'])} Cash Deposits",
            delta_color="off"
        )
    with m2:
        st.metric(
            label="Physical Supplies Received",
            value=f"{total_in_kind:,} Units",
            delta="Restocked to Central Depot",
            delta_color="off"
        )
    with m3:
        st.metric(
            label="Logged Contributions",
            value=f"{total_donors}",
            delta="Institutional & Public Donors",
            delta_color="off"
        )

    st.markdown("<br>", unsafe_allow_html=True)

    # Visualizations housed in elegant card containers
    col_chart1, col_chart2 = st.columns(2)
    with col_chart1:
        st.markdown("""
        <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 1.25rem 1.4rem; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04); height: 100%;">
            <div style="font-weight: 800; color: #0F172A; font-size: 1.05rem; letter-spacing: -0.02em; margin-bottom: 0.2rem;">Monetary Aid by Relief Sector</div>
            <div style="font-size: 0.8rem; color: #64748B; margin-bottom: 0.8rem;">Distribution of cash deposits across humanitarian relief funds.</div>
        """, unsafe_allow_html=True)
        cash_by_cat = summary.get("cash_by_category", {})
        if cash_by_cat:
            df_cash = pd.DataFrame(list(cash_by_cat.items()), columns=["Sector", "Amount (PKR)"])
            fig_cash = px.pie(
                df_cash,
                names="Sector",
                values="Amount (PKR)",
                hole=0.55,
                color_discrete_sequence=["#0F172A", "#1E3A8A", "#2563EB", "#0284C7", "#38BDF8", "#94A3B8"]
            )
            fig_cash.update_layout(
                margin=dict(l=10, r=10, t=10, b=10),
                height=260,
                legend=dict(font=dict(size=10))
            )
            st.plotly_chart(fig_cash, use_container_width=True)
        else:
            st.info("No cash donations recorded.")
        st.markdown("</div>", unsafe_allow_html=True)

    with col_chart2:
        st.markdown("""
        <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 1.25rem 1.4rem; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04); height: 100%;">
            <div style="font-weight: 800; color: #0F172A; font-size: 1.05rem; letter-spacing: -0.02em; margin-bottom: 0.2rem;">In-Kind Supplies by Sector</div>
            <div style="font-size: 0.8rem; color: #64748B; margin-bottom: 0.8rem;">Total physical goods restocked into central emergency warehouse.</div>
        """, unsafe_allow_html=True)
        in_kind_cat = summary.get("in_kind_by_category", {})
        if in_kind_cat:
            df_inkind = pd.DataFrame(list(in_kind_cat.items()), columns=["Sector", "Total Units"])
            fig_inkind = px.bar(
                df_inkind,
                x="Sector",
                y="Total Units",
                text="Total Units"
            )
            fig_inkind.update_traces(
                marker_color="#0F172A",
                textposition="outside",
                cliponaxis=False
            )
            fig_inkind.update_layout(
                margin=dict(l=10, r=10, t=10, b=20),
                height=260,
                plot_bgcolor="#FFFFFF",
                paper_bgcolor="#FFFFFF",
                xaxis=dict(title="", showgrid=False),
                yaxis=dict(title="Physical Units", showgrid=True, gridcolor="#E2E8F0"),
                font=dict(family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif", size=10, color="#334155")
            )
            st.plotly_chart(fig_inkind, use_container_width=True)
        else:
            st.info("No in-kind donations recorded.")
        st.markdown("</div>", unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)

    # Tabs
    tab_record, tab_ledger = st.tabs(["Record Incoming Contribution", "Contribution Ledger & Audit"])

    with tab_record:
        st.markdown('<div class="section-title">Register Inbound Relief Contribution</div>', unsafe_allow_html=True)
        st.caption("Recording in-kind physical supplies automatically updates available warehouse inventory stock.")

        with st.form("record_donation_form", clear_on_submit=True):
            col_d1, col_d2 = st.columns(2)
            with col_d1:
                dtype = st.radio("Contribution Type*", config.DONATION_TYPES, horizontal=True)
                donor = st.text_input("Donor / Organization Name*", placeholder="e.g., Al-Khidmat Foundation, Red Crescent, Anonymous")
                category = st.selectbox("Relief Sector / Fund*", config.DONATION_CATEGORIES)

            with col_d2:
                if dtype == "Cash":
                    amount = st.number_input("Amount in PKR*", min_value=100.0, value=25000.0, step=1000.0)
                    selected_item_id = None
                else:
                    item_choices = {f"#{i['id']} — {i['name']} [Balance: {i['stock']} {i['unit']}]": i for i in inventory}
                    sel_item_label = st.selectbox("Target Warehouse Catalog Item*", list(item_choices.keys()))
                    selected_item_id = str(item_choices[sel_item_label]["id"])
                    amount = st.number_input("Quantity Received*", min_value=1.0, value=50.0, step=5.0)

            btn_submit_don = st.form_submit_button("Record Contribution", use_container_width=True)
            if btn_submit_don:
                success, data, err_msg = DonationService.record_donation(
                    donation_type=dtype,
                    amount_or_quantity=amount,
                    category=category,
                    donor_name=donor,
                    item_id=selected_item_id
                )
                if success:
                    st.success(f"Contribution #{data.get('id')} recorded successfully ({dtype}).")
                    if dtype == "In-Kind":
                        st.info("Warehouse balance incremented automatically.")
                    st.rerun()
                else:
                    st.error(f"Failed to record contribution: {err_msg}")

    with tab_ledger:
        st.markdown('<div class="section-title">Official Contribution Ledger</div>', unsafe_allow_html=True)
        
        col_fl1, col_fl2 = st.columns(2)
        with col_fl1:
            sel_type_fl = st.selectbox("Filter Contribution Type", ["All Types", "Cash", "In-Kind"])
        with col_fl2:
            search_donor = st.text_input("Search Donor Entity", "").strip().lower()

        filtered_don = donations
        if sel_type_fl != "All Types":
            filtered_don = [d for d in filtered_don if d.get("type") == sel_type_fl]
        if search_donor:
            filtered_don = [d for d in filtered_don if search_donor in d.get("donor_name", "").lower()]

        don_rows = []
        for d in filtered_don:
            d_type = d.get("type")
            amt = d.get("amount_or_quantity", 0)
            item_name = "-"
            if d_type == "In-Kind" and d.get("item_id"):
                item_obj = inv_dict.get(str(d.get("item_id")), {})
                item_name = f"{item_obj.get('name', 'Item')} ({item_obj.get('unit', 'units')})"

            formatted_amt = f"PKR {float(amt):,.0f}" if d_type == "Cash" else f"{int(amt)} units"

            don_rows.append({
                "ID": str(d.get("id")),
                "Type": d_type,
                "Donor Entity": d.get("donor_name", "Anonymous"),
                "Amount / Quantity": formatted_amt,
                "Resource Item": item_name,
                "Sector / Fund": d.get("category"),
                "Date Logged": d.get("date", "-")
            })

        if don_rows:
            st.dataframe(pd.DataFrame(don_rows), use_container_width=True, hide_index=True)
        else:
            st.info("No contribution records found matching the filter.")
