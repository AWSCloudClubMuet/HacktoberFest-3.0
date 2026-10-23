const String kAll = 'All';

const List<String> kDistricts = [
  'Hyderabad',
  'Sukkur',
  'Mirpurkhas',
  'Larkana',
  'Karachi',
  'Nawabshah',
  'Thatta',
  'Badin',
  'Khairpur',
  'Dadu',
  'Sanghar',
  'Jacobabad',
];

const List<String> kGrades = ['A', 'B', 'C'];

const Map<String, String> kCropLocalNames = {
  'Wheat': 'گندم • ڪڻڪ',
  'Rice (IRRI-6)': 'چاول • ڇانور',
  'Cotton (Phutti)': 'کپاس • ڦٽي',
  'Sugarcane': 'کماد • ڪمند',
  'Onion': 'پیاز • بصر',
  'Tomato': 'ٹماٹر • ٽماٽر',
  'Green Chilli': 'سبز مرچ • ساوا مرچ',
  'Mango (Sindhri)': 'آم • انب سنڌڙي',
  'Banana (Basrai)': 'کیلا • ڪيلو',
  'Red Chilli (Kunri)': 'لال مرچ • ڳاڙها مرچ',
  'Dates (Aseel)': 'کھجور • کجين',
  'Mustard (Sarson)': 'سرسوں • سريھن',
};

String getCropLocalName(String cropName) {
  return kCropLocalNames[cropName] ?? '';
}
