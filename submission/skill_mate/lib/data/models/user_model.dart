class UserModel {
  final String id, name, major, bio;
  final int semester;
  final List<String> skills;

  const UserModel({
    required this.id,
    required this.name,
    required this.major,
    required this.semester,
    required this.bio,
    required this.skills,
  });

  Map<String, dynamic> toMap() => {
    'id': id,
    'name': name,
    'major': major,
    'semester': semester,
    'bio': bio,
    'skills': skills,
  };

  factory UserModel.fromMap(Map m) => UserModel(
    id: m['id'],
    name: m['name'],
    major: m['major'],
    semester: m['semester'],
    bio: m['bio'],
    skills: List<String>.from(m['skills']),
  );
}

class ProfileStats {
  final UserModel user;
  final int posted, completed, reviewCount;
  final double avgRating;
  ProfileStats(this.user, this.posted, this.completed, this.avgRating, this.reviewCount);
}