import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../data/mock_api.dart';
import '../data/models/user_model.dart';

class AppState extends ChangeNotifier {
  final MockApi api;
  AppState(this.api);

  Map<String, UserModel> users = {};
  String currentUserId = 'u1';
  int tick = 0; // bumps after any change so screens reload

  UserModel get me => users[currentUserId]!;

  Future<void> init() async {
    users = {for (final u in await api.getUsers()) u.id: u};
    currentUserId = Hive.box('settings').get('me', defaultValue: 'u1');
  }

  String nameOf(String id) => users[id]?.name ?? 'Unknown';

  void switchUser(String id) {
    currentUserId = id;
    Hive.box('settings').put('me', id);
    refresh();
  }

  void refresh() {
    tick++;
    notifyListeners();
  }
}