"""
ReliefHub Dashboard View (Milestone 5)
Executive operational metrics, critical gaps matrix, category fulfillment, and Sindh geospatial monitoring.
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from services.camp_service import CampService
from services.inventory_service import InventoryService
from services.need_service import NeedService
from services.dispatch_service import DispatchService
from services.volunteer_service import VolunteerService
from services.donation_service import DonationService
import config

def render_dashboard():
    st.markdown('<div class="section-title">Operations Overview</div>', unsafe_allow_html=True)
    st.markdown('<div class="section-subtitle">Real-time situational summary of Sindh flood relief camps, warehouse supplies, and critical deficits.</div>', unsafe_allow_html=True)

    # Fetch data
    with st.spinner("Synchronizing operational data from Mock API..."):
        camps, err_c = CampService.get_all_camps()
        inventory, err_i = InventoryService.get_all_inventory()
        needs, err_n = NeedService.get_all_needs()
        dispatches, err_d = DispatchService.get_all_dispatches()
        volunteers, err_v = VolunteerService.get_all_volunteers()
        don_summary, err_don = DonationService.get_donation_summary()

    if err_c or err_i or err_n:
        st.error(f"API Connection Failure: {err_c or err_i or err_n}")
        st.info("Verify that the Mock REST API is running at http://127.0.0.1:5000 (python api/server_runner.py).")
        return

    camp_dict = {str(c["id"]): c for c in camps}
    inv_dict = {str(i["id"]): i for i in inventory}

    # 1. Executive Key Performance Indicators
    active_camps = sum(1 for c in camps if c.get("status") == "Active")
    full_camps = sum(1 for c in camps if c.get("status") == "Full")
    closed_camps = sum(1 for c in camps if c.get("status") == "Closed")
    total_families = sum(int(c.get("current_families", 0)) for c in camps)
    
    total_req = sum(float(n.get("required_quantity", 0)) for n in needs)
    total_ful = sum(float(n.get("fulfilled_quantity", 0)) for n in needs)
    overall_fulfillment = (total_ful / total_req * 100) if total_req > 0 else 0.0

    low_stock_items = sum(1 for i in inventory if InventoryService.is_low_stock(i))
    volunteers_deployed = sum(1 for v in volunteers if v.get("camp_id") is not None and str(v.get("camp_id")) != "")
    in_transit_dispatches = sum(1 for d in dispatches if d.get("status") in ("Pending", "In Transit"))

    kpi1, kpi2, kpi3, kpi4, kpi5 = st.columns(5)
    with kpi1:
        st.metric(
            label="Active Relief Camps",
            value=f"{active_camps} / {len(camps)}",
            delta=f"{full_camps} Full | {closed_camps} Closed",
            delta_color="off"
        )
    with kpi2:
        st.metric(
            label="Families Sheltered",
            value=f"{total_families:,}",
            delta="7 Sindh Districts Reported",
            delta_color="off"
        )
    with kpi3:
        st.metric(
            label="Demand Fulfillment",
            value=f"{overall_fulfillment:.1f}%",
            delta=f"{int(total_ful):,} / {int(total_req):,} units",
            delta_color="normal"
        )
    with kpi4:
        st.metric(
            label="Low-Stock Warnings",
            value=f"{low_stock_items}",
            delta="Items <= Reorder Level",
            delta_color="inverse"
        )
    with kpi5:
        st.metric(
            label="Deployed Responders",
            value=f"{volunteers_deployed} / {len(volunteers)}",
            delta=f"{in_transit_dispatches} Active Dispatches",
            delta_color="off"
        )

    st.markdown("<br>", unsafe_allow_html=True)

    # 2. Critical Gaps Matrix (Milestone 5) - Housed in an elevated card
    st.markdown("""
    <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 1.4rem 1.6rem; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04); margin-bottom: 1.6rem;">
        <div style="font-weight: 800; color: #0F172A; font-size: 1.15rem; letter-spacing: -0.02em; margin-bottom: 0.2rem;">Critical Gaps Matrix</div>
        <div style="font-size: 0.84rem; color: #64748B; margin-bottom: 1rem;">High-priority camp requests where supply fulfillment is below 40%, ranked by severity of deficit.</div>
    """, unsafe_allow_html=True)

    critical_needs = []
    for n in needs:
        if NeedService.is_critical_gap(n):
            c_info = camp_dict.get(str(n.get("camp_id")), {})
            i_info = inv_dict.get(str(n.get("inventory_item_id")), {})
            req = float(n.get("required_quantity", 0))
            ful = float(n.get("fulfilled_quantity", 0))
            ratio = (ful / req * 100) if req > 0 else 0.0
            deficit = req - ful

            critical_needs.append({
                "Camp": c_info.get("name", f"Camp #{n.get('camp_id')}"),
                "District": c_info.get("district", "N/A"),
                "Supply Required": i_info.get("name", f"Item #{n.get('inventory_item_id')}"),
                "Sector": i_info.get("category", "General"),
                "Required": int(req),
                "Fulfilled": int(ful),
                "Deficit": int(deficit),
                "Unit": i_info.get("unit", "units"),
                "Fulfillment Ratio": f"{ratio:.1f}%",
                "Warehouse Balance": int(i_info.get("stock", 0)),
                "raw_pct": ratio,
                "raw_deficit": deficit
            })

    if critical_needs:
        df_crit = pd.DataFrame(critical_needs).sort_values(by=["raw_pct", "raw_deficit"], ascending=[True, False])
        display_cols = [
            "Camp", "District", "Supply Required", "Sector",
            "Required", "Fulfilled", "Deficit", "Unit", "Fulfillment Ratio", "Warehouse Balance"
        ]
        st.dataframe(df_crit[display_cols], use_container_width=True, hide_index=True)
    else:
        st.info("No critical shortages identified. All high-priority resource requests currently exceed 40% fulfillment.")

    st.markdown("</div>", unsafe_allow_html=True)

    # 3. Analytics & Visualization Section
    col_chart1, col_chart2 = st.columns(2)

    with col_chart1:
        st.markdown("""
        <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 1.3rem 1.4rem; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04); height: 100%;">
            <div style="font-weight: 800; color: #0F172A; font-size: 1.05rem; letter-spacing: -0.02em; margin-bottom: 0.2rem;">Fulfillment by Resource Sector</div>
            <div style="font-size: 0.82rem; color: #64748B; margin-bottom: 0.8rem;">Aggregate fulfillment percentage across operational supply categories.</div>
        """, unsafe_allow_html=True)

        cat_stats = {}
        for n in needs:
            i_info = inv_dict.get(str(n.get("inventory_item_id")), {})
            cat = i_info.get("category", "General")
            req = float(n.get("required_quantity", 0))
            ful = float(n.get("fulfilled_quantity", 0))
            if cat not in cat_stats:
                cat_stats[cat] = {"req": 0.0, "ful": 0.0}
            cat_stats[cat]["req"] += req
            cat_stats[cat]["ful"] += ful

        cat_rows = []
        for cat, vals in cat_stats.items():
            pct = (vals["ful"] / vals["req"] * 100) if vals["req"] > 0 else 0.0
            cat_rows.append({
                "Category": cat,
                "Fulfillment": round(pct, 1),
                "Fulfilled": int(vals["ful"]),
                "Required": int(vals["req"])
            })

        if cat_rows:
            df_cat = pd.DataFrame(cat_rows).sort_values(by="Fulfillment", ascending=True)
            fig_bar = px.bar(
                df_cat,
                x="Fulfillment",
                y="Category",
                orientation="h",
                text="Fulfillment",
                range_x=[0, 100]
            )
            fig_bar.update_traces(
                marker_color="#1E3A8A",
                texttemplate="%{text:.1f}%",
                textposition="outside",
                cliponaxis=False
            )
            fig_bar.update_layout(
                margin=dict(l=10, r=30, t=10, b=20),
                height=280,
                xaxis=dict(
                    title="Fulfillment Percentage (%)",
                    showgrid=True,
                    gridcolor="#E2E8F0",
                    zeroline=True,
                    zerolinecolor="#CBD5E1"
                ),
                yaxis=dict(title="", showgrid=False),
                plot_bgcolor="#FFFFFF",
                paper_bgcolor="#FFFFFF",
                font=dict(family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif", size=10, color="#334155")
            )
            st.plotly_chart(fig_bar, use_container_width=True)
        st.markdown("</div>", unsafe_allow_html=True)

    with col_chart2:
        st.markdown("""
        <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 1.3rem 1.4rem; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04); height: 100%;">
            <div style="font-weight: 800; color: #0F172A; font-size: 1.05rem; letter-spacing: -0.02em; margin-bottom: 0.2rem;">Warehouse Balance vs. Reorder Minimums</div>
            <div style="font-size: 0.82rem; color: #64748B; margin-bottom: 0.8rem;">Stock monitoring for central relief depot inventory items.</div>
        """, unsafe_allow_html=True)

        if inventory:
            inv_rows = []
            for item in inventory:
                inv_rows.append({
                    "Item": item.get("name", "").split("(")[0].strip()[:18],
                    "Stock": item.get("stock", 0),
                    "Reorder Level": item.get("reorder_level", 0),
                    "Is Low": InventoryService.is_low_stock(item)
                })
            df_inv = pd.DataFrame(inv_rows)
            fig_inv = go.Figure()
            fig_inv.add_trace(go.Bar(
                name="Available Stock",
                x=df_inv["Item"],
                y=df_inv["Stock"],
                marker_color=["#DC2626" if low else "#0F172A" for low in df_inv["Is Low"]]
            ))
            fig_inv.add_trace(go.Scatter(
                name="Reorder Threshold",
                x=df_inv["Item"],
                y=df_inv["Reorder Level"],
                mode="lines+markers",
                line=dict(color="#D97706", width=2, dash="dot"),
                marker=dict(size=5, color="#D97706")
            ))
            fig_inv.update_layout(
                margin=dict(l=10, r=20, t=10, b=30),
                height=280,
                plot_bgcolor="#FFFFFF",
                paper_bgcolor="#FFFFFF",
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1, font=dict(size=10)),
                xaxis=dict(showgrid=False, tickangle=-25),
                yaxis=dict(title="Physical Units", showgrid=True, gridcolor="#E2E8F0"),
                font=dict(family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif", size=10, color="#334155")
            )
            st.plotly_chart(fig_inv, use_container_width=True)
        st.markdown("</div>", unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)

    # 4. Geospatial Distribution Map - Housed in an elevated card
    st.markdown("""
    <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 1.4rem 1.6rem; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);">
        <div style="font-weight: 800; color: #0F172A; font-size: 1.15rem; letter-spacing: -0.02em; margin-bottom: 0.2rem;">Sindh Relief Camp Geospatial Distribution</div>
        <div style="font-size: 0.84rem; color: #64748B; margin-bottom: 1rem;">Geographic coordinates and live operational status of registered camps.</div>
    """, unsafe_allow_html=True)

    map_camps = []
    for c in camps:
        status = c.get("status", "Active")
        map_camps.append({
            "Name": c.get("name"),
            "District": c.get("district"),
            "Status": status,
            "Capacity": c.get("capacity"),
            "Families": c.get("current_families"),
            "Occupancy": f"{(int(c.get('current_families', 0)) / max(1, int(c.get('capacity', 1))) * 100):.1f}%",
            "lat": float(c.get("lat", 26.0)),
            "lon": float(c.get("lon", 68.5))
        })

    if map_camps:
        df_map = pd.DataFrame(map_camps)
        color_map = {
            "Active": "#16A34A",
            "Full": "#D97706",
            "Closed": "#64748B"
        }

        try:
            if hasattr(px, "scatter_map"):
                fig_map = px.scatter_map(
                    df_map,
                    lat="lat",
                    lon="lon",
                    hover_name="Name",
                    hover_data={
                        "District": True,
                        "Status": True,
                        "Capacity": True,
                        "Families": True,
                        "Occupancy": True,
                        "lat": False,
                        "lon": False
                    },
                    color="Status",
                    color_discrete_map=color_map,
                    size=[14] * len(df_map),
                    zoom=5.8,
                    center=dict(lat=26.3, lon=68.5),
                    map_style="carto-positron"
                )
            else:
                fig_map = px.scatter_mapbox(
                    df_map,
                    lat="lat",
                    lon="lon",
                    hover_name="Name",
                    hover_data={
                        "District": True,
                        "Status": True,
                        "Capacity": True,
                        "Families": True,
                        "Occupancy": True,
                        "lat": False,
                        "lon": False
                    },
                    color="Status",
                    color_discrete_map=color_map,
                    size=[14] * len(df_map),
                    zoom=5.8,
                    center=dict(lat=26.3, lon=68.5),
                    mapbox_style="carto-positron"
                )
            fig_map.update_layout(
                margin=dict(l=0, r=0, t=0, b=0),
                height=380,
                legend=dict(
                    orientation="h",
                    yanchor="top",
                    y=0.98,
                    xanchor="left",
                    x=0.02,
                    bgcolor="rgba(255, 255, 255, 0.9)",
                    bordercolor="#E2E8F0",
                    borderwidth=1
                )
            )
            st.plotly_chart(fig_map, use_container_width=True)
        except Exception:
            # Native Streamlit fallback
            st.map(df_map, latitude="lat", longitude="lon", size=20)
        st.markdown("</div>", unsafe_allow_html=True)
