/// Real photos for the splash and every crop (free to use, Unsplash License).
/// Loaded over the network; the app shows an icon fallback if a photo fails.
const String _u = 'https://images.unsplash.com/photo-';

const String kTractorPhotoId = '1750987661701-428e0d4201fe';

const Map<String, String> _cropPhotoIds = {
  'Wheat': '1723530934765-063453910f35',
  'Rice (IRRI-6)': '1753018302272-282d3ea2c430',
  'Cotton (Phutti)': '1761069183521-fc1a0d8be3dd',
  'Sugarcane': '1752010102949-083b83957fda',
  'Onion': '1681758442447-f36ed14c0a8a',
  'Tomato': '1741517287377-3fdbd87ac5f2',
  'Green Chilli': '1597115580039-b849ed2d6398',
  'Mango (Sindhri)': '1757281096712-d0c9fb17d608',
  'Banana (Basrai)': '1656055917498-acfe69ff46aa',
  'Red Chilli (Kunri)': '1602237514002-c2d8ae2da393',
  'Dates (Aseel)': '1785531191261-2207cb51381d',
  'Mustard (Sarson)': '1693083784085-9f09be3cd204',
};

String _url(String id, int w, int q) =>
    '$_u$id?auto=format&fit=crop&w=$w&q=$q';

/// Splash / hero photo.
String tractorPhotoUrl({int width = 1100}) => _url(kTractorPhotoId, width, 75);

/// Photo for a crop by its name; null if we have none.
String? cropPhotoUrl(String cropName, {int width = 400}) {
  final id = _cropPhotoIds[cropName];
  if (id == null) return null;
  return _url(id, width, 70);
}
