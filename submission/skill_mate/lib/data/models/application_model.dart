class GigApplication {
  final String id, gigId, applicantId, message, status;
  final DateTime createdAt;

  const GigApplication({
    required this.id,
    required this.gigId,
    required this.applicantId,
    required this.message,
    required this.status,
    required this.createdAt,
  });

  GigApplication copyWith({String? status}) => GigApplication(
    id: id,
    gigId: gigId,
    applicantId: applicantId,
    message: message,
    createdAt: createdAt,
    status: status ?? this.status,
  );

  Map<String, dynamic> toMap() => {
    'id': id,
    'gig_id': gigId,
    'applicant_id': applicantId,
    'message': message,
    'status': status,
    'created_at': createdAt.toIso8601String(),
  };

  factory GigApplication.fromMap(Map m) => GigApplication(
    id: m['id'],
    gigId: m['gig_id'],
    applicantId: m['applicant_id'],
    message: m['message'],
    status: m['status'],
    createdAt: DateTime.parse(m['created_at']),
  );
}