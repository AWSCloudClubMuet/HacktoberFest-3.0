import 'package:flutter/material.dart';

import '../app_state.dart';
import '../constants.dart';
import '../models.dart';
import '../widgets/listing_card.dart';
import 'listing_detail_screen.dart';

class MarketplaceScreen extends StatefulWidget {
  const MarketplaceScreen({super.key});

  @override
  State<MarketplaceScreen> createState() => _MarketplaceScreenState();
}

class _MarketplaceScreenState extends State<MarketplaceScreen> {
  String _query = '';
  String? _cropId;
  String? _district;
  String? _grade;
  String _sort = 'newest';

  Widget _filter({
    required String label,
    required String? value,
    required List<DropdownMenuItem<String>> items,
    required ValueChanged<String?> onChanged,
  }) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: SizedBox(
        width: 150,
        child: DropdownButtonFormField<String>(
          initialValue: value,
          isExpanded: true,
          decoration: InputDecoration(
            labelText: label,
            border: const OutlineInputBorder(),
            isDense: true,
          ),
          items: items,
          onChanged: onChanged,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: appState,
      builder: (context, _) {
        final active = appState.listings.where((l) => l.isActive).toList();
        final districtOptions = (active.map((l) => l.district).toSet().toList())
          ..sort();

        final q = _query.toLowerCase();
        final shown = active.where((l) {
          if (_cropId != null && l.cropId != _cropId) return false;
          if (_district != null && l.district != _district) return false;
          if (_grade != null && l.grade != _grade) return false;
          if (q.isNotEmpty) {
            final text =
                '${appState.cropName(l.cropId)} ${l.district}'.toLowerCase();
            if (!text.contains(q)) return false;
          }
          return true;
        }).toList();

        int idOf(Listing l) => int.tryParse(l.id) ?? 0;
        if (_sort == 'price') {
          shown.sort((a, b) => a.askingPrice.compareTo(b.askingPrice));
        } else {
          shown.sort((a, b) => idOf(b).compareTo(idOf(a)));
        }

        return Scaffold(
          appBar: AppBar(title: const Text('Marketplace')),
          body: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 12, 12, 8),
                child: TextField(
                  decoration: const InputDecoration(
                    hintText: 'Search crop or district',
                    prefixIcon: Icon(Icons.search),
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                  onChanged: (v) => setState(() => _query = v),
                ),
              ),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Row(
                  children: [
                    _filter(
                      label: 'Crop',
                      value: _cropId,
                      items: [
                        const DropdownMenuItem<String>(
                            value: null, child: Text('All crops')),
                        for (final c in appState.crops)
                          DropdownMenuItem(value: c.id, child: Text(c.name)),
                      ],
                      onChanged: (v) => setState(() => _cropId = v),
                    ),
                    _filter(
                      label: 'District',
                      value: _district,
                      items: [
                        const DropdownMenuItem<String>(
                            value: null, child: Text('All districts')),
                        for (final d in districtOptions)
                          DropdownMenuItem(value: d, child: Text(d)),
                      ],
                      onChanged: (v) => setState(() => _district = v),
                    ),
                    _filter(
                      label: 'Grade',
                      value: _grade,
                      items: [
                        const DropdownMenuItem<String>(
                            value: null, child: Text('All grades')),
                        for (final g in grades)
                          DropdownMenuItem(value: g, child: Text('Grade $g')),
                      ],
                      onChanged: (v) => setState(() => _grade = v),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
                child: SegmentedButton<String>(
                  segments: const [
                    ButtonSegment(value: 'newest', label: Text('Newest')),
                    ButtonSegment(value: 'price', label: Text('Price: low to high')),
                  ],
                  selected: {_sort},
                  onSelectionChanged: (s) => setState(() => _sort = s.first),
                ),
              ),
              Expanded(
                child: RefreshIndicator(
                  onRefresh: appState.refresh,
                  child: shown.isEmpty
                      ? ListView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          children: [
                            const SizedBox(height: 100),
                            Center(
                              child: Text(appState.listings.isEmpty
                                  ? (appState.error ?? 'No listings yet.')
                                  : 'No listings match your filters.'),
                            ),
                          ],
                        )
                      : ListView.builder(
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: const EdgeInsets.only(bottom: 16),
                          itemCount: shown.length,
                          itemBuilder: (_, i) => ListingCard(
                            listing: shown[i],
                            onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) => ListingDetailScreen(
                                      listingId: shown[i].id)),
                            ),
                          ),
                        ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}