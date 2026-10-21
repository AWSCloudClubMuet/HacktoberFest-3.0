import 'package:flutter/material.dart';

import '../models/models.dart';
import '../services/app_state.dart';
import '../utils/constants.dart';
import '../widgets/common.dart';
import '../widgets/listing_card.dart';

class MarketplaceScreen extends StatefulWidget {
  const MarketplaceScreen({super.key});

  @override
  State<MarketplaceScreen> createState() => _MarketplaceScreenState();
}

class _MarketplaceScreenState extends State<MarketplaceScreen> {
  String searchText = '';
  String selectedDistrict = kAll;
  String selectedGrade = kAll;
  String selectedSort = 'newest';

  List<Listing> getFilteredListings(AppState app) {
    final search = searchText.trim().toLowerCase();
    final List<Listing> result = [];

    for (final listing in app.activeListings) {
      final crop = app.cropById(listing.cropId);
      String cropName = '';
      if (crop != null) {
        cropName = crop.name.toLowerCase();
      }

      final nameMatches = cropName.contains(search);
      final districtMatches =
          selectedDistrict == kAll || listing.district == selectedDistrict;
      final gradeMatches =
          selectedGrade == kAll || listing.grade == selectedGrade;

      if (nameMatches && districtMatches && gradeMatches) {
        result.add(listing);
      }
    }
    return result;
  }

  void sortListings(List<Listing> listings) {
    if (selectedSort == 'price_asc') {
      listings.sort((a, b) => a.pricePerMaund.compareTo(b.pricePerMaund));
    } else if (selectedSort == 'price_desc') {
      listings.sort((a, b) => b.pricePerMaund.compareTo(a.pricePerMaund));
    } else if (selectedSort == 'qty_desc') {
      listings.sort((a, b) => b.quantity.compareTo(a.quantity));
    } else {
      listings.sort((a, b) {
        final byTime = b.createdAt.compareTo(a.createdAt);
        if (byTime != 0) {
          return byTime;
        }
        return (b.id ?? 0).compareTo(a.id ?? 0);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);

    final listings = getFilteredListings(app);
    sortListings(listings);

    final List<Widget> cards = [];
    for (final listing in listings) {
      cards.add(ListingCard(listing: listing));
    }

    return RefreshIndicator(
      onRefresh: () => refreshData(context),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        children: [
          buildSearchBox(),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: buildDistrictDropdown()),
              const SizedBox(width: 8),
              Expanded(child: buildSortDropdown()),
            ],
          ),
          const SizedBox(height: 8),
          buildGradeChips(),
          const SizedBox(height: 4),
          Text(
            '${listings.length} active listing(s)',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          if (listings.isEmpty)
            const EmptyView('No listings match these filters.'),
          ...cards,
        ],
      ),
    );
  }

  Widget buildSearchBox() {
    return TextField(
      decoration: const InputDecoration(
        prefixIcon: Icon(Icons.search),
        hintText: 'Search crop',
        border: OutlineInputBorder(),
      ),
      onChanged: (value) {
        setState(() {
          searchText = value;
        });
      },
    );
  }

  Widget buildDistrictDropdown() {
    final List<DropdownMenuItem<String>> items = [];
    items
        .add(const DropdownMenuItem(value: kAll, child: Text('All districts')));
    for (final district in kDistricts) {
      items.add(DropdownMenuItem(value: district, child: Text(district)));
    }

    return LabeledDropdown<String>(
      label: 'District',
      value: selectedDistrict,
      items: items,
      onChanged: (value) {
        setState(() {
          selectedDistrict = value ?? selectedDistrict;
        });
      },
    );
  }

  Widget buildSortDropdown() {
    return LabeledDropdown<String>(
      label: 'Sort by',
      value: selectedSort,
      items: const [
        DropdownMenuItem(value: 'newest', child: Text('Newest')),
        DropdownMenuItem(value: 'price_asc', child: Text('Price low-high')),
        DropdownMenuItem(value: 'price_desc', child: Text('Price high-low')),
        DropdownMenuItem(value: 'qty_desc', child: Text('Quantity')),
      ],
      onChanged: (value) {
        setState(() {
          selectedSort = value ?? selectedSort;
        });
      },
    );
  }

  Widget buildGradeChips() {
    final List<String> grades = [kAll, ...kGrades];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          const Text(
            'Grade:',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF556353)),
          ),
          const SizedBox(width: 8),
          for (final grade in grades)
            Padding(
              padding: const EdgeInsets.only(right: 6),
              child: ChoiceChip(
                label: Text(grade == kAll ? 'All' : 'Grade $grade'),
                selected: selectedGrade == grade,
                onSelected: (_) {
                  setState(() {
                    selectedGrade = grade;
                  });
                },
              ),
            ),
        ],
      ),
    );
  }
}
