import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../data/store.dart';
import '../../domain/models.dart';
import '../theme.dart';
import '../widgets.dart';

Future<void> showListingForm(
  BuildContext context,
  AppStore store, {
  ProduceListing? listing,
}) => showModalBottomSheet<void>(
  context: context,
  isScrollControlled: true,
  useSafeArea: true,
  backgroundColor: cream,
  builder: (_) => ListingForm(store: store, listing: listing),
);

class MarketplaceScreen extends StatefulWidget {
  final AppStore store;
  final bool ownOnly;
  const MarketplaceScreen({
    super.key,
    required this.store,
    this.ownOnly = false,
  });
  @override
  State<MarketplaceScreen> createState() => _MarketplaceScreenState();
}

class _MarketplaceScreenState extends State<MarketplaceScreen> {
  String query = '',
      cropId = 'all',
      district = 'all',
      grade = 'all',
      sort = 'newest';
  @override
  Widget build(BuildContext context) {
    final s = widget.store;
    final listings =
        s.listings
            .where(
              (l) =>
                  (widget.ownOnly
                      ? l.userId == s.user!.id
                      : l.status == 'Active') &&
                  s
                      .crop(l.cropId)
                      .name
                      .toLowerCase()
                      .contains(query.toLowerCase()) &&
                  (cropId == 'all' || cropId == l.cropId) &&
                  (district == 'all' || district == l.district) &&
                  (grade == 'all' || grade == l.grade),
            )
            .toList()
          ..sort(
            (a, b) => sort == 'price'
                ? a.askingPrice.compareTo(b.askingPrice)
                : b.createdAt.compareTo(a.createdAt),
          );
    return RefreshIndicator(
      onRefresh: s.refresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(22),
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  widget.ownOnly
                      ? 'Your harvest.\nYour listings.'
                      : 'Fresh from\nSindh’s fields.',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
              ),
              if (s.user!.isFarmer)
                IconButton.filled(
                  tooltip: 'Post produce listing',
                  onPressed: () => showListingForm(context, s),
                  icon: const Icon(Icons.add),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            widget.ownOnly
                ? 'Manage what you’re selling. Keep buyers in the loop.'
                : 'Good produce. Direct conversations. No middlemen.',
            style: const TextStyle(color: muted),
          ),
          const SizedBox(height: 22),
          TextField(
            onChanged: (v) => setState(() => query = v),
            decoration: const InputDecoration(
              hintText: 'Find a crop…',
              prefixIcon: Icon(Icons.search),
            ),
          ),
          const SizedBox(height: 14),
          DropField(
            label: 'Crop',
            value: cropId,
            options: {
              'all': 'All crops',
              for (final c in s.crops) c.id: c.name,
            },
            onChanged: (v) => setState(() => cropId = v),
          ),
          const SizedBox(height: 12),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(color: line),
              borderRadius: BorderRadius.circular(16),
            ),
            child: ExpansionTile(
              shape: const Border(),
              collapsedShape: const Border(),
              leading: const Icon(Icons.tune, size: 20),
              title: const Text(
                'Filters & sort',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
              ),
              subtitle: Text(
                '${district == 'all' ? 'All districts' : district} · ${grade == 'all' ? 'All grades' : 'Grade $grade'} · ${sort == 'newest' ? 'Newest' : 'Lowest price'}',
                style: const TextStyle(fontSize: 11, color: muted),
              ),
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                  child: Column(
                    children: [
                      DropField(
                        label: 'District',
                        value: district,
                        options: {
                          'all': 'All districts',
                          for (final d in districts) d: d,
                        },
                        onChanged: (v) => setState(() => district = v),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: DropField(
                              label: 'Grade',
                              value: grade,
                              options: const {
                                'all': 'All grades',
                                'A': 'Grade A',
                                'B': 'Grade B',
                                'C': 'Grade C',
                              },
                              onChanged: (v) => setState(() => grade = v),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: DropField(
                              label: 'Sort by',
                              value: sort,
                              options: const {
                                'newest': 'Newest',
                                'price': 'Price: low first',
                              },
                              onChanged: (v) => setState(() => sort = v),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          SectionTitle(
            widget.ownOnly ? 'My listings' : 'Available produce',
            note: '${listings.length} listings',
          ),
          if (listings.isEmpty)
            EmptyState(
              title: widget.ownOnly
                  ? 'Your next buyer starts here'
                  : 'No listings found',
              message: widget.ownOnly
                  ? 'Post your first crop with a quantity and asking price.'
                  : 'Try another crop, district or grade.',
              icon: Icons.storefront_outlined,
            ),
          for (final l in listings)
            Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: Material(
                color: Colors.white,
                borderRadius: BorderRadius.circular(22),
                child: InkWell(
                  borderRadius: BorderRadius.circular(22),
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute<void>(
                      builder: (_) =>
                          ListingDetailScreen(store: s, listingId: l.id),
                    ),
                  ),
                  child: Paper(
                    padding: const EdgeInsets.all(18),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            CropIcon(s.crop(l.cropId).name, size: 56),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    s.crop(l.cropId).name,
                                    style: Theme.of(
                                      context,
                                    ).textTheme.titleLarge,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${l.district} · Grade ${l.grade}',
                                    style: const TextStyle(
                                      color: muted,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            if (widget.ownOnly && l.status == 'Sold')
                              const Tag('Sold', color: muted),
                          ],
                        ),
                        const SizedBox(height: 18),
                        Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '${money(l.askingPrice)} / maund',
                                    style: const TextStyle(
                                      fontSize: 19,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: -.4,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${money(l.quantity, currency: false)} maunds available',
                                    style: const TextStyle(
                                      color: muted,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const Icon(
                              Icons.arrow_outward,
                              color: leaf,
                              size: 20,
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        Wrap(
                          spacing: 8,
                          runSpacing: 6,
                          children: [
                            Tag(
                              marketLabel(
                                l.askingPrice,
                                s.averagePrice(l.cropId),
                              ),
                              color:
                                  marketLabel(
                                        l.askingPrice,
                                        s.averagePrice(l.cropId),
                                      ) ==
                                      'Above market'
                                  ? amber
                                  : leaf,
                            ),
                            Tag('From ${l.availableFrom}', color: muted),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class ListingDetailScreen extends StatefulWidget {
  final AppStore store;
  final String listingId;
  const ListingDetailScreen({
    super.key,
    required this.store,
    required this.listingId,
  });
  @override
  State<ListingDetailScreen> createState() => _ListingDetailScreenState();
}

class _ListingDetailScreenState extends State<ListingDetailScreen> {
  bool busy = false;
  Future<void> contact(ProduceListing l, bool whatsapp) async {
    final uri = whatsapp
        ? Uri.https('wa.me', '/${l.phone.replaceAll(RegExp(r'[^0-9]'), '')}', {
            'text':
                'Salaam! I’m interested in your ${widget.store.crop(l.cropId).name} listing on KisanMandi.',
          })
        : Uri(scheme: 'tel', path: l.phone);
    try {
      if (!await launchUrl(uri, mode: LaunchMode.externalApplication) &&
          mounted) {
        showError(
          context,
          'No app could open this contact action. Number: ${l.phone}',
        );
      }
    } catch (_) {
      if (mounted) {
        showError(context, 'Unable to open contact app. Number: ${l.phone}');
      }
    }
  }

  Future<void> change(ProduceListing l, bool delete) async {
    if (delete && !await confirmDelete(context, 'listing')) return;
    setState(() => busy = true);
    try {
      await widget.store.mutate(
        delete ? 'DELETE' : 'PATCH',
        'listings/${l.id}',
        delete ? null : {'status': 'Sold'},
      );
      if (delete && mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: widget.store,
    builder: (context, _) {
      final s = widget.store,
          l = s.listings.where((l) => l.id == widget.listingId).firstOrNull;
      if (l == null) {
        return Scaffold(
          appBar: AppBar(),
          body: const EmptyState(
            title: 'Listing unavailable',
            message: 'This listing may have been removed.',
          ),
        );
      }
      final c = s.crop(l.cropId), own = l.userId == s.user!.id;
      return Scaffold(
        appBar: AppBar(title: const Text('From farm to buyer')),
        body: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 650),
            child: ListView(
              padding: const EdgeInsets.all(22),
              children: [
                Container(
                  height: 160,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE8EDD9),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Center(child: CropIcon(c.name, size: 110)),
                ),
                const SizedBox(height: 22),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        c.name,
                        style: Theme.of(context).textTheme.headlineLarge,
                      ),
                    ),
                    Tag(l.status, color: l.status == 'Sold' ? muted : leaf),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  '${l.district} · Grade ${l.grade}',
                  style: const TextStyle(color: muted),
                ),
                const SizedBox(height: 20),
                Text(
                  '${money(l.askingPrice)} / maund',
                  style: const TextStyle(
                    fontSize: 30,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -1,
                  ),
                ),
                const SizedBox(height: 12),
                Wrap(
                  children: [
                    Tag(marketLabel(l.askingPrice, s.averagePrice(c.id))),
                  ],
                ),
                const SizedBox(height: 22),
                Paper(
                  child: Column(
                    children: [
                      _row(
                        'Quantity',
                        '${money(l.quantity, currency: false)} maunds',
                      ),
                      _row(
                        'Total asking value',
                        money(l.quantity * l.askingPrice),
                      ),
                      _row('Available from', l.availableFrom),
                      _row('Grade', l.grade),
                      _row('District', l.district),
                      _row(
                        'Market average',
                        '${money(s.averagePrice(c.id))} / maund',
                      ),
                      _row('Contact', l.phone),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Market labels use today’s average across all three markets. Prices within ±5% are “At market”.',
                  style: TextStyle(color: muted, fontSize: 11),
                ),
                const SizedBox(height: 24),
                if (l.status == 'Active') ...[
                  FilledButton.icon(
                    onPressed: () => contact(l, false),
                    icon: const Icon(Icons.call_outlined),
                    label: const Text('Call farmer'),
                  ),
                  const SizedBox(height: 10),
                  OutlinedButton.icon(
                    onPressed: () => contact(l, true),
                    icon: const Icon(Icons.chat_bubble_outline),
                    label: const Text('Contact on WhatsApp'),
                  ),
                ],
                if (own && s.user!.isFarmer) ...[
                  const SectionTitle('Manage your listing'),
                  OutlinedButton.icon(
                    onPressed: busy
                        ? null
                        : () => showListingForm(context, s, listing: l),
                    icon: const Icon(Icons.edit_outlined),
                    label: const Text('Edit listing'),
                  ),
                  if (l.status == 'Active') ...[
                    const SizedBox(height: 10),
                    OutlinedButton.icon(
                      onPressed: busy ? null : () => change(l, false),
                      icon: const Icon(Icons.check_circle_outline),
                      label: const Text('Mark as sold'),
                    ),
                  ],
                  const SizedBox(height: 8),
                  TextButton.icon(
                    onPressed: busy ? null : () => change(l, true),
                    icon: const Icon(Icons.delete_outline),
                    label: const Text('Delete listing'),
                  ),
                ],
                const SizedBox(height: 16),
                const Text(
                  'Fictional demo contact. No real farmer or buyer is represented.',
                  style: TextStyle(color: muted, fontSize: 11),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      );
    },
  );
  Widget _row(String label, String value) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 8),
    child: Row(
      children: [
        Expanded(
          child: Text(
            label,
            style: const TextStyle(color: muted, fontSize: 13),
          ),
        ),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
          ),
        ),
      ],
    ),
  );
}

class ListingForm extends StatefulWidget {
  final AppStore store;
  final ProduceListing? listing;
  const ListingForm({super.key, required this.store, this.listing});
  @override
  State<ListingForm> createState() => _ListingFormState();
}

class _ListingFormState extends State<ListingForm> {
  final form = GlobalKey<FormState>();
  late String cropId = widget.listing?.cropId ?? widget.store.crops.first.id;
  late String district =
      widget.listing?.district ?? widget.store.user!.district;
  late String grade = widget.listing?.grade ?? 'A';
  late DateTime available = widget.listing == null
      ? DateTime.now()
      : DateTime.parse(widget.listing!.availableFrom);
  late final quantity = TextEditingController(
    text: widget.listing?.quantity.toString() ?? '',
  );
  late final price = TextEditingController(
    text: widget.listing?.askingPrice.toString() ?? '',
  );
  late final phone = TextEditingController(
    text: widget.listing?.phone ?? widget.store.user!.phone,
  );
  bool busy = false;
  @override
  void dispose() {
    quantity.dispose();
    price.dispose();
    phone.dispose();
    super.dispose();
  }

  String? number(String? v) {
    final n = double.tryParse(v ?? '');
    return n == null || !n.isFinite || n <= 0 || n > 1e10
        ? 'Enter a value > 0, up to 10 billion'
        : null;
  }

  Future<void> save() async {
    if (!form.currentState!.validate()) return;
    setState(() => busy = true);
    try {
      await widget.store.mutate(
        widget.listing == null ? 'POST' : 'PATCH',
        widget.listing == null ? 'listings' : 'listings/${widget.listing!.id}',
        {
          'crop_id': cropId,
          'quantity': double.parse(quantity.text),
          'asking_price': double.parse(price.text),
          'district': district,
          'grade': grade,
          'available_from': dateOnly(available),
          'contact_phone': phone.text.trim(),
        },
      );
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Padding(
    padding: EdgeInsets.fromLTRB(
      22,
      24,
      22,
      MediaQuery.viewInsetsOf(context).bottom + 24,
    ),
    child: SingleChildScrollView(
      child: Form(
        key: form,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.listing == null
                  ? 'Put your harvest\non the map.'
                  : 'Edit your listing',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 20),
            DropField(
              label: 'Crop',
              value: cropId,
              options: {for (final c in widget.store.crops) c.id: c.name},
              onChanged: (v) => setState(() => cropId = v),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: quantity,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    validator: number,
                    decoration: const InputDecoration(
                      labelText: 'Quantity (maunds)',
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: price,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    validator: number,
                    decoration: const InputDecoration(
                      labelText: 'PKR per maund',
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            DropField(
              label: 'District',
              value: district,
              options: {for (final d in districts) d: d},
              onChanged: (v) => setState(() => district = v),
            ),
            const SizedBox(height: 14),
            DropField(
              label: 'Grade',
              value: grade,
              options: const {
                'A': 'A — Premium',
                'B': 'B — Standard',
                'C': 'C — Economy',
              },
              onChanged: (v) => setState(() => grade = v),
            ),
            const SizedBox(height: 14),
            OutlinedButton.icon(
              onPressed: () async {
                final now = DateUtils.dateOnly(DateTime.now());
                final selected = await showDatePicker(
                  context: context,
                  initialDate: available.isBefore(now) ? now : available,
                  firstDate: now,
                  lastDate: DateTime(now.year + 5, 12, 31),
                );
                if (selected != null) setState(() => available = selected);
              },
              icon: const Icon(Icons.calendar_today_outlined, size: 18),
              label: Text('Available from ${dateOnly(available)}'),
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: phone,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'Contact phone'),
              validator: (v) =>
                  RegExp(r'^\+?[0-9]{10,15}$').hasMatch(v?.trim() ?? '')
                  ? null
                  : 'Enter 10–15 digits',
            ),
            const SizedBox(height: 22),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: busy ? null : save,
                child: Text(
                  busy
                      ? 'Saving…'
                      : widget.listing == null
                      ? 'Publish listing'
                      : 'Save changes',
                ),
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              '1 maund = 40 kg. Your listing will be visible to farmers and buyers.',
              style: TextStyle(color: muted, fontSize: 11),
            ),
          ],
        ),
      ),
    ),
  );
}
