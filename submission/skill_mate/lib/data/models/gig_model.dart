import '../../core/constants.dart';

class Gig {
  final String id, userId, title, description, type, category, paymentType, status;
  final int? budget;
  final DateTime deadline, createdAt;
  final String? acceptedApplicantId;

  const Gig({
    required this.id,
    required this.userId,
    required this.title,
    required this.description,
    required this.type,
    required this.category,
    required this.paymentType,
    required this.status,
    required this.deadline,
    required this.createdAt,
    this.budget,
    this.acceptedApplicantId,
  });

  Gig copyWith({String? status, String? acceptedApplicantId}) => Gig(
    id: id,
    userId: userId,
    title: title,
    description: description,
    type: type,
    category: category,
    paymentType: paymentType,
    budget: budget,
    deadline: deadline,
    createdAt: createdAt,
    status: status ?? this.status,
    acceptedApplicantId: acceptedApplicantId ?? this.acceptedApplicantId,
  );

  String get priceLabel =>
      paymentType == Pay.paid ? 'Rs $budget' : (paymentType == Pay.swap ? 'Skill Swap' : 'Free');

  Map<String, dynamic> toMap() => {
    'id': id,
    'user_id': userId,
    'title': title,
    'description': description,
    'type': type,
    'category': category,
    'payment_type': paymentType,
    'budget': budget,
    'deadline': deadline.toIso8601String(),
    'status': status,
    'accepted_applicant_id': acceptedApplicantId,
    'created_at': createdAt.toIso8601String(),
  };

  factory Gig.fromMap(Map m) => Gig(
    id: m['id'],
    userId: m['user_id'],
    title: m['title'],
    description: m['description'],
    type: m['type'],
    category: m['category'],
    paymentType: m['payment_type'],
    budget: m['budget'],
    deadline: DateTime.parse(m['deadline']),
    status: m['status'],
    acceptedApplicantId: m['accepted_applicant_id'],
    createdAt: DateTime.parse(m['created_at']),
  );
}