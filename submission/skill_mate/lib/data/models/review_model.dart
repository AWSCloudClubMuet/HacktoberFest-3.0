class Review {
  final String id, gigId, reviewerId, revieweeId, comment;
  final int rating;

  const Review({
    required this.id,
    required this.gigId,
    required this.reviewerId,
    required this.revieweeId,
    required this.rating,
    required this.comment,
  });

  Map<String, dynamic> toMap() => {
    'id': id,
    'gig_id': gigId,
    'reviewer_id': reviewerId,
    'reviewee_id': revieweeId,
    'rating': rating,
    'comment': comment,
  };

  factory Review.fromMap(Map m) => Review(
    id: m['id'],
    gigId: m['gig_id'],
    reviewerId: m['reviewer_id'],
    revieweeId: m['reviewee_id'],
    rating: m['rating'],
    comment: m['comment'],
  );
}