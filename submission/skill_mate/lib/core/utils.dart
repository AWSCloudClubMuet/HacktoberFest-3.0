import 'package:flutter/material.dart';
import 'constants.dart';

const _months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

String fmtDate(DateTime d) => '${d.day} ${_months[d.month - 1]} ${d.year}';

String payLabel(String p) => p == Pay.swap ? 'Skill Swap' : p;

Color statusColor(String s) {
  switch (s) {
    case Status.open:
    case AppStatus.accepted:
      return Colors.green;
    case Status.progress:
    case AppStatus.pending:
      return Colors.orange;
    case Status.completed:
      return Colors.blue;
    case Status.cancelled:
    case AppStatus.rejected:
      return Colors.red;
    default:
      return Colors.grey;
  }
}

void snack(BuildContext c, String m) => ScaffoldMessenger.of(c).showSnackBar(
  SnackBar(content: Text(m), behavior: SnackBarBehavior.floating),
);