import 'package:flutter/material.dart';

import '../models/models.dart';
import '../services/app_state.dart';
import '../utils/constants.dart';
import '../utils/theme.dart';
import '../widgets/common.dart';
import '../widgets/listing_card.dart';

class MarketplaceScreen extends StatefulWidget {
  const MarketplaceScreen({super.key});

  @override
  State<MarketplaceScreen> createState() => _MarketplaceScreenState();
}

class _MarketplaceScreenState extends State<MarketplaceScreen> {
  final TextEditingController searchController = TextEditingController();
  String searchText = '';
  String selectedDistrict = kAll;
  String selectedGrade = kAll;
  String selectedSort = 'newest';

  @override
  void dispose() {
    searchController.dispose();
    super.dispose();
  }

  List<Listing> getFilteredListings(AppState app) {
    final search = searchText.trim().toLowerCase();
    final List<Listing> result = [];

    for (final listing in app.activeListings) {
      final crop = app.cropById(listing.cropId);
      String cropName = '';
      String localName = '';
      if (crop != null) {
        cropName = crop.name.toLowerCase();
        localName = getCropLocalName(crop.name).toLowerCase();
      }

      final nameMatches =
          cropName.contains(search) || localName.contains(search);
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
      color: AppColors.green,
      onRefresh: () => refreshData(context),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 18, 16, 20),
        children: [
          buildSearchBox(),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(child: buildDistrictDropdown()),
              const SizedBox(width: 10),
              Expanded(child: buildSortDropdown()),
            ],
          ),
          const SizedBox(height: 14),
          buildGradeChips(),
          const SizedBox(height: 16),
          SectionTitle(
            '${listings.length} active listing${listings.length == 1 ? '' : 's'}',
            subtitle:
                '${selectedDistrict == kAll ? 'All Sindh' : selectedDistrict} • ${selectedGrade == kAll ? 'All grades' : 'Grade $selectedGrade'}',
          ),
          const SizedBox(height: 8),
          if (listings.isEmpty)
            const EmptyView('No listings match these filters.',
                icon: Icons.storefront_outlined),
          ...cards,
        ],
      ),
    );
  }

  Widget buildSearchBox() {
    return AppSearchField(
      controller: searchController,
      hint: 'Search listings by crop (e.g. Wheat, چاول)',
      hasText: searchText.isNotEmpty,
      onClear: () {
        searchController.clear();
        setState(() {
          searchText = '';
        });
      },
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
    return HScroll(
      children: [
        for (final grade in grades)
          PillChip(
            icon: grade == kAll ? Icons.grid_view_rounded : Icons.verified_outlined,
            label: grade == kAll ? 'All grades' : 'Grade $grade',
            selected: selectedGrade == grade,
            onTap: () {
              setState(() {
                selectedGrade = grade;
              });
            },
          ),
      ],
    );
  }
}
