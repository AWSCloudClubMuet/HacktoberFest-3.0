import 'package:hive_flutter/hive_flutter.dart';
import 'models/application_model.dart';
import '../core/constants.dart';
import 'models/review_model.dart';
import 'models/gig_model.dart';
import 'models/user_model.dart';

class ApiException implements Exception {
  final String message;
  ApiException(this.message);
  @override
  String toString() => message;
}

/// Mock REST backend stored in Hive. Every rule from the brief is enforced here.
class MockApi {
  Box get _users => Hive.box('users');
  Box get _gigs => Hive.box('gigs');
  Box get _apps => Hive.box('applications');
  Box get _reviews => Hive.box('reviews');

  Future<void> _wait() => Future.delayed(const Duration(milliseconds: 300));
  String _id() => DateTime.now().microsecondsSinceEpoch.toString();

  // Open gigs past their deadline become Expired.
  Gig _readGig(dynamic raw) {
    var g = Gig.fromMap(raw);
    if (g.status == Status.open && g.deadline.isBefore(DateTime.now())) {
      g = g.copyWith(status: Status.expired);
      _gigs.put(g.id, g.toMap());
    }
    return g;
  }

  Gig _gig(String id) {
    final raw = _gigs.get(id);
    if (raw == null) throw ApiException('Gig not found');
    return _readGig(raw);
  }

  // GET /users
  Future<List<UserModel>> getUsers() async {
    await _wait();
    return _users.values.map((e) => UserModel.fromMap(e)).toList();
  }

  // GET /gigs?category=&type=&payment=&minBudget=&maxBudget=&q=&userId=
  Future<List<Gig>> getGigs({
    String? category,
    String? type,
    String? payment,
    int? minBudget,
    int? maxBudget,
    String? q,
    String? userId,
  }) async {
    await _wait();
    final query = q?.trim().toLowerCase() ?? '';
    final list = _gigs.values.toList().map(_readGig).where((g) {
      if (userId != null && g.userId != userId) return false;
      if (category != null && g.category != category) return false;
      if (type != null && g.type != type) return false;
      if (payment != null && g.paymentType != payment) return false;
      if (minBudget != null || maxBudget != null) {
        final b = g.budget;
        if (b == null) return false;
        if (minBudget != null && b < minBudget) return false;
        if (maxBudget != null && b > maxBudget) return false;
      }
      if (query.isNotEmpty &&
          !(g.title.toLowerCase().contains(query) ||
              g.description.toLowerCase().contains(query))) {
        return false;
      }
      return true;
    }).toList();
    list.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return list;
  }

  // GET /gigs/:id
  Future<Gig> getGig(String id) async {
    await _wait();
    return _gig(id);
  }

  // POST /gigs
  Future<Gig> postGig({
    required String userId,
    required String title,
    required String description,
    required String type,
    required String category,
    required String paymentType,
    int? budget,
    required DateTime deadline,
  }) async {
    await _wait();
    if (title.trim().length < 5) throw ApiException('Title must be at least 5 characters');
    if (description.trim().length < 10) throw ApiException('Description must be at least 10 characters');
    if (paymentType == Pay.paid && (budget == null || budget <= 0)) {
      throw ApiException('Paid gigs need a budget');
    }
    if (!deadline.isAfter(DateTime.now())) throw ApiException('Deadline must be in the future');
    final gig = Gig(
      id: 'g${_id()}',
      userId: userId,
      title: title.trim(),
      description: description.trim(),
      type: type,
      category: category,
      paymentType: paymentType,
      budget: paymentType == Pay.paid ? budget : null,
      deadline: deadline,
      status: Status.open,
      createdAt: DateTime.now(),
    );
    await _gigs.put(gig.id, gig.toMap());
    return gig;
  }

  // PATCH /gigs/:id   (owner only: Open/InProgress -> Cancelled, InProgress -> Completed)
  Future<Gig> patchGig(String id, {required String status, required String actorId}) async {
    await _wait();
    final gig = _gig(id);
    if (gig.userId != actorId) throw ApiException('Only the gig owner can change status');
    final ok = (status == Status.completed && gig.status == Status.progress) ||
        (status == Status.cancelled && (gig.status == Status.open || gig.status == Status.progress));
    if (!ok) throw ApiException('Cannot move gig from ${gig.status} to $status');
    final updated = gig.copyWith(status: status);
    await _gigs.put(id, updated.toMap());
    if (status == Status.cancelled) await _rejectPending(id, exceptId: null);
    return updated;
  }

  Future<void> _rejectPending(String gigId, {String? exceptId}) async {
    for (final raw in _apps.values.toList()) {
      final a = GigApplication.fromMap(raw);
      if (a.gigId == gigId && a.id != exceptId && a.status == AppStatus.pending) {
        await _apps.put(a.id, a.copyWith(status: AppStatus.rejected).toMap());
      }
    }
  }

  // GET /applications?gigId=&applicantId=
  Future<List<GigApplication>> getApplications({String? gigId, String? applicantId}) async {
    await _wait();
    final list = _apps.values
        .map((e) => GigApplication.fromMap(e))
        .where((a) =>
    (gigId == null || a.gigId == gigId) &&
        (applicantId == null || a.applicantId == applicantId))
        .toList();
    list.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return list;
  }

  // POST /applications
  Future<GigApplication> postApplication({
    required String gigId,
    required String applicantId,
    required String message,
  }) async {
    await _wait();
    final gig = _gig(gigId);
    if (message.trim().isEmpty) throw ApiException('Please write a short message');
    if (gig.userId == applicantId) throw ApiException('You cannot apply to your own gig');
    if (gig.status != Status.open) throw ApiException('This gig is ${gig.status}, not accepting applications');
    final dup = _apps.values
        .map((e) => GigApplication.fromMap(e))
        .any((a) => a.gigId == gigId && a.applicantId == applicantId);
    if (dup) throw ApiException('You already applied to this gig');
    final app = GigApplication(
      id: 'a${_id()}',
      gigId: gigId,
      applicantId: applicantId,
      message: message.trim(),
      status: AppStatus.pending,
      createdAt: DateTime.now(),
    );
    await _apps.put(app.id, app.toMap());
    return app;
  }

  // PATCH /applications/:id  (owner only: Accept one -> gig In Progress, others rejected)
  Future<GigApplication> patchApplication(String id,
      {required String status, required String actorId}) async {
    await _wait();
    final raw = _apps.get(id);
    if (raw == null) throw ApiException('Application not found');
    final app = GigApplication.fromMap(raw);
    final gig = _gig(app.gigId);
    if (gig.userId != actorId) throw ApiException('Only the gig owner can do this');
    if (app.status != AppStatus.pending) throw ApiException('Application is already ${app.status}');
    if (status == AppStatus.accepted) {
      if (gig.status != Status.open) throw ApiException('Gig is not open');
      await _rejectPending(gig.id, exceptId: app.id);
      await _gigs.put(
        gig.id,
        gig.copyWith(status: Status.progress, acceptedApplicantId: app.applicantId).toMap(),
      );
    } else if (status != AppStatus.rejected) {
      throw ApiException('Invalid status');
    }
    final updated = app.copyWith(status: status);
    await _apps.put(id, updated.toMap());
    return updated;
  }

  // GET /reviews?gigId=&revieweeId=
  Future<List<Review>> getReviews({String? gigId, String? revieweeId}) async {
    await _wait();
    return _reviews.values
        .map((e) => Review.fromMap(e))
        .where((r) =>
    (gigId == null || r.gigId == gigId) &&
        (revieweeId == null || r.revieweeId == revieweeId))
        .toList();
  }

  // POST /reviews
  Future<Review> postReview({
    required String gigId,
    required String reviewerId,
    required int rating,
    required String comment,
  }) async {
    await _wait();
    final gig = _gig(gigId);
    if (gig.status != Status.completed) throw ApiException('Reviews open after the gig is completed');
    final acc = gig.acceptedApplicantId;
    if (acc == null) throw ApiException('No accepted applicant');
    final String reviewee;
    if (reviewerId == gig.userId) {
      reviewee = acc;
    } else if (reviewerId == acc) {
      reviewee = gig.userId;
    } else {
      throw ApiException('Only the owner and accepted applicant can review');
    }
    if (rating < 1 || rating > 5) throw ApiException('Rating must be 1 to 5');
    final dup = _reviews.values
        .map((e) => Review.fromMap(e))
        .any((r) => r.gigId == gigId && r.reviewerId == reviewerId);
    if (dup) throw ApiException('You already reviewed this gig');
    final r = Review(
      id: 'r${_id()}',
      gigId: gigId,
      reviewerId: reviewerId,
      revieweeId: reviewee,
      rating: rating,
      comment: comment.trim(),
    );
    await _reviews.put(r.id, r.toMap());
    return r;
  }

  // GET /profile/:id  (average is calculated from stored reviews)
  Future<ProfileStats> getProfile(String userId) async {
    await _wait();
    final raw = _users.get(userId);
    if (raw == null) throw ApiException('User not found');
    final gigs = _gigs.values.toList().map(_readGig).toList();
    final posted = gigs.where((g) => g.userId == userId).length;
    final done = gigs
        .where((g) =>
    g.status == Status.completed &&
        (g.userId == userId || g.acceptedApplicantId == userId))
        .length;
    final rs = _reviews.values
        .map((e) => Review.fromMap(e))
        .where((r) => r.revieweeId == userId)
        .toList();
    final avg = rs.isEmpty ? 0.0 : rs.fold<int>(0, (s, r) => s + r.rating) / rs.length;
    return ProfileStats(UserModel.fromMap(raw), posted, done, avg, rs.length);
  }
}