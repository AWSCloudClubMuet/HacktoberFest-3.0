class GigType {
  static const offering = 'Offering', requesting = 'Requesting';
  static const all = [offering, requesting];
}

class Category {
  static const all = ['Programming', 'Design', 'Writing', 'Tutoring'];
}

class Pay {
  static const paid = 'Paid', swap = 'SkillSwap', free = 'Free';
  static const all = [paid, swap, free];
}

class Status {
  static const open = 'Open',
      progress = 'In Progress',
      completed = 'Completed',
      expired = 'Expired',
      cancelled = 'Cancelled';
}

class AppStatus {
  static const pending = 'Pending', accepted = 'Accepted', rejected = 'Rejected';
}