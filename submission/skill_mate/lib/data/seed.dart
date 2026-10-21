import 'package:hive_flutter/hive_flutter.dart';
import 'models/application_model.dart';
import 'models/review_model.dart';
import 'models/gig_model.dart';
import 'models/user_model.dart';

/// 12 users, 25 gigs, 20 applications, 8 reviews. Runs once.
class Seed {
  static Future<void> run() async {
    final usersBox = Hive.box('users');
    if (usersBox.isNotEmpty) return;
    final now = DateTime.now();

    UserModel u(String id, String n, String m, int s, String bio, List<String> sk) =>
        UserModel(id: id, name: n, major: m, semester: s, bio: bio, skills: sk);

    final users = [
      u('u1', 'Umar Khan', 'Software Engineering', 5, 'Flutter dev who loves clean UI.', ['Flutter', 'Dart', 'Firebase']),
      u('u2', 'Ayesha Malik', 'Computer Science', 6, 'Algorithms and teaching.', ['C++', 'Data Structures', 'Python']),
      u('u3', 'Haya Siddiqui', 'Software Engineering', 5, 'UI/UX and poster design.', ['Figma', 'Illustrator', 'UI Design']),
      u('u4', 'Shumail Ahmed', 'Computer Systems', 4, 'Backend and logos.', ['Node.js', 'Logo Design', 'SQL']),
      u('u5', 'Sabra Noor', 'Telecommunication', 3, 'Writer and note taker.', ['Proofreading', 'Blogging']),
      u('u6', 'Bilal Raza', 'English Linguistics', 7, 'Essays, reports, translation.', ['Writing', 'Editing', 'Urdu']),
      u('u7', 'Hina Farooq', 'Electrical Engineering', 6, 'Math and physics tutor.', ['Calculus', 'Physics', 'MATLAB']),
      u('u8', 'Danish Ali', 'Architecture', 5, 'Visual design and 3D.', ['AutoCAD', 'Photoshop', 'Posters']),
      u('u9', 'Zainab Shah', 'Software Engineering', 7, 'Full-stack web developer.', ['React', 'Django', 'Git']),
      u('u10', 'Hamza Qureshi', 'Computer Systems', 6, 'Web and Git mentor.', ['HTML/CSS', 'JavaScript', 'Git']),
      u('u11', 'Mariam Baig', 'Industrial Engineering', 3, 'Notes and translation.', ['Urdu', 'English', 'Excel']),
      u('u12', 'Fahad Memon', 'Software Engineering', 4, 'Branding and video editing.', ['Branding', 'Premiere', 'Canva']),
    ];
    for (final x in users) {
      await usersBox.put(x.id, x.toMap());
    }

    var i = 0;
    Gig g(String owner, String type, String cat, String pay, int? budget, int days,
        String status, String? acc, String title, String desc) {
      i++;
      return Gig(
        id: 'g$i',
        userId: owner,
        title: title,
        description: desc,
        type: type,
        category: cat,
        paymentType: pay,
        budget: budget,
        deadline: now.add(Duration(days: days)),
        status: status,
        acceptedApplicantId: acc,
        createdAt: now.subtract(Duration(days: 30 - i, hours: i)),
      );
    }

    const O = 'Offering', R = 'Requesting';
    const P = 'Programming', D = 'Design', W = 'Writing', T = 'Tutoring';
    const paid = 'Paid', swap = 'SkillSwap', free = 'Free';
    const open = 'Open', prog = 'In Progress', done = 'Completed';

    final gigs = [
      g('u1', R, P, paid, 3000, -10, done, 'u2', 'Fix bugs in Flutter login screen', 'Login screen crashes on empty fields, need it fixed and tested.'),
      g('u3', O, D, swap, null, -8, done, 'u4', 'Logo design for your project', 'I design clean logos, looking for backend help in exchange.'),
      g('u5', R, W, paid, 1500, -6, done, 'u6', 'Proofread final year report', 'Need grammar and structure check on a 40 page report.'),
      g('u2', O, T, free, null, -5, done, 'u7', 'Data Structures revision session', 'Free revision of trees and graphs before the exam.'),
      g('u8', R, D, paid, 2500, -4, done, 'u3', 'Poster for society event', 'Need an A3 poster for the architecture week.'),
      g('u9', O, P, paid, 2000, -3, done, 'u10', 'Build a portfolio website', 'Responsive portfolio site with 4 pages.'),
      g('u4', R, P, swap, null, 5, prog, 'u1', 'Mobile app for lab inventory', 'Need a simple Flutter app, can offer logo and backend work.'),
      g('u6', O, W, paid, 1000, 4, prog, 'u9', 'Blog and article writing', 'I write tech blogs and articles on request.'),
      g('u7', R, T, paid, 800, 6, prog, 'u11', 'Need Excel tutor', 'Looking for help with formulas and pivot tables.'),
      g('u10', R, D, free, null, 3, prog, 'u12', 'Banner for coding club', 'Simple banner for the coding club event.'),
      g('u1', O, P, paid, 1500, 7, open, null, 'Flutter app mentoring', 'One-on-one help with your Flutter project.'),
      g('u3', R, W, paid, 1200, 5, open, null, 'Write LinkedIn bio and CV', 'Need a professional CV and LinkedIn summary.'),
      g('u4', O, D, paid, 2000, 9, open, null, 'Figma UI mockups', 'I will design mobile app mockups in Figma.'),
      g('u5', R, T, swap, null, 6, open, null, 'Calculus help, can teach Python', 'Need calculus tutoring, I can teach Python basics.'),
      g('u6', O, W, free, null, 8, open, null, 'Free essay feedback', 'I review essays and give feedback for free.'),
      g('u7', R, P, paid, 4000, 10, open, null, 'REST API for society website', 'Need a small REST API with login and posts.'),
      g('u8', O, T, paid, 600, 4, open, null, 'Physics tutoring for first years', 'Mechanics and waves, one hour sessions.'),
      g('u9', R, D, swap, null, 12, open, null, 'Poster design swap', 'I build websites, need posters designed in return.'),
      g('u10', O, P, free, null, 7, open, null, 'Git and GitHub workshop', 'Free beginner workshop on Git and GitHub.'),
      g('u11', R, W, paid, 900, 3, open, null, 'Translate notes Urdu to English', 'About 15 pages of lecture notes.'),
      g('u12', O, D, paid, 1800, 11, open, null, 'Brand kit for startups', 'Logo, colors and fonts for your student startup.'),
      g('u1', R, T, paid, 700, 5, open, null, 'Need Database Systems tutor', 'Help with normalization and SQL joins.'),
      g('u2', O, P, swap, null, 9, open, null, 'Debug your C++ for design help', 'I fix C++ bugs, need a poster in return.'),
      g('u3', R, P, paid, 2500, 5, 'Cancelled', null, 'Chatbot for society', 'Cancelled, plans changed.'),
      g('u4', O, W, paid, 500, -2, open, null, 'Resume proofreading', 'Quick resume proofreading (deadline passed, shows Expired).'),
    ];
    final gigsBox = Hive.box('gigs');
    for (final x in gigs) {
      await gigsBox.put(x.id, x.toMap());
    }

    GigApplication a(int n, String gig, String who, String st, String msg) => GigApplication(
      id: 'a$n',
      gigId: gig,
      applicantId: who,
      message: msg,
      status: st,
      createdAt: now.subtract(Duration(days: 25 - n)),
    );
    const acc = 'Accepted', rej = 'Rejected', pen = 'Pending';
    final apps = [
      a(1, 'g1', 'u2', acc, 'I can fix this today.'),
      a(2, 'g2', 'u4', acc, 'Happy to swap, I know Node.js.'),
      a(3, 'g3', 'u6', acc, 'I proofread reports often.'),
      a(4, 'g4', 'u7', acc, 'Would love to join the session.'),
      a(5, 'g5', 'u3', acc, 'I can deliver in 2 days.'),
      a(6, 'g6', 'u10', acc, 'I build portfolio sites regularly.'),
      a(7, 'g7', 'u1', acc, 'I can build this in Flutter.'),
      a(8, 'g8', 'u9', acc, 'I need articles for my blog.'),
      a(9, 'g9', 'u11', acc, 'I am good with Excel.'),
      a(10, 'g10', 'u12', acc, 'Banner is easy for me.'),
      a(11, 'g1', 'u5', rej, 'I know some Flutter.'),
      a(12, 'g2', 'u8', rej, 'Can I help with logo ideas?'),
      a(13, 'g7', 'u12', rej, 'I can help with UI.'),
      a(14, 'g8', 'u2', rej, 'Interested in your writing.'),
      a(15, 'g11', 'u2', pen, 'Need help with state management.'),
      a(16, 'g11', 'u5', pen, 'Please mentor me on Flutter basics.'),
      a(17, 'g12', 'u7', pen, 'I can write your CV.'),
      a(18, 'g13', 'u1', pen, 'Need mockups for my app.'),
      a(19, 'g14', 'u9', pen, 'I can tutor calculus.'),
      a(20, 'g15', 'u3', pen, 'Please review my essay.'),
    ];
    final appsBox = Hive.box('applications');
    for (final x in apps) {
      await appsBox.put(x.id, x.toMap());
    }

    Review r(int n, String gig, String by, String to, int rating, String c) =>
        Review(id: 'r$n', gigId: gig, reviewerId: by, revieweeId: to, rating: rating, comment: c);
    final reviews = [
      r(1, 'g1', 'u1', 'u2', 5, 'Fixed everything fast.'),
      r(2, 'g1', 'u2', 'u1', 5, 'Clear requirements, quick payment.'),
      r(3, 'g2', 'u3', 'u4', 4, 'Good backend help.'),
      r(4, 'g2', 'u4', 'u3', 5, 'Beautiful logo.'),
      r(5, 'g3', 'u5', 'u6', 5, 'Very careful proofreading.'),
      r(6, 'g3', 'u6', 'u5', 4, 'Nice to work with.'),
      r(7, 'g4', 'u2', 'u7', 4, 'Asked great questions.'),
      r(8, 'g5', 'u8', 'u3', 5, 'Poster looked amazing.'),
    ];
    final revBox = Hive.box('reviews');
    for (final x in reviews) {
      await revBox.put(x.id, x.toMap());
    }
  }
}