// Smart Parking Fee// Smart Parking Fee Calculator
#include <iostream>
#include <string>
#include <cmath>
#include <cctype>
#include <cstdlib>
#include <sstream>
#include <iomanip>
using namespace std;

// ---------- Helpers ----------
string trim(const string& s) {
    size_t a = s.find_first_not_of(" \t\r\n");
    if (a == string::npos) return "";
    size_t b = s.find_last_not_of(" \t\r\n");
    return s.substr(a, b - a + 1);
}

string toLower(string s) {
    for (size_t i = 0; i < s.size(); i++) s[i] = tolower((unsigned char)s[i]);
    return s;
}

// Prints 350 as "350" and 1.5 as "1.50"
string money(double x) {
    ostringstream out;
    if (fabs(x - floor(x + 0.5)) < 1e-9) out << fixed << setprecision(0) << x;
    else                                 out << fixed << setprecision(2) << x;
    return out.str();
}

// ---------- Milestone 1: input + rates ----------
bool validRegistration(const string& reg) { return !trim(reg).empty(); }

// Returns hourly rate, or -1 if the type is not supported.
// Also normalises the name ("car" -> "Car").
int hourlyRate(const string& typeIn, string& typeOut) {
    string t = toLower(trim(typeIn));
    if (t == "bike") { typeOut = "Bike"; return 30; }
    if (t == "car")  { typeOut = "Car";  return 50; }
    if (t == "van")  { typeOut = "Van";  return 80; }
    return -1;
}

// Parses hours; returns false if not a number or not positive.
bool parseHours(const string& s, double& hours) {
    string t = trim(s);
    if (t.empty()) return false;
    char* end;
    hours = strtod(t.c_str(), &end);
    if (end == t.c_str() || *end != '\0') return false;   // "abc" or "5abc"
    return hours > 0 && hours < 1000000;   // positive and sensible
}

// ---------- Milestone 2: duration + discounts ----------
int billedHours(double hours) { return (int)ceil(hours); }   // 2.5 -> 3

int durationDiscount(int billed) {
    if (billed > 10) return 20;   // 20% instead of 10%, not cumulative
    if (billed > 5)  return 10;
    return 0;
}

// Bonus: +5% for staff, total capped at 25%
int totalDiscount(int billed, bool staff) {
    int d = durationDiscount(billed) + (staff ? 5 : 0);
    return d > 25 ? 25 : d;
}

// ---------- Milestone 3: receipt ----------
void printReceipt(const string& reg, const string& type, int billed,
                  int rate, int discountPct) {
    double original = billed * rate;
    double discountAmt = original * discountPct / 100.0;
    double finalAmt = original - discountAmt;

    cout << "\n----- PARKING RECEIPT -----\n";
    cout << "Vehicle Registration: " << reg << "\n";
    cout << "Vehicle Type: " << type << "\n";
    cout << "Charged Duration: " << billed << (billed == 1 ? " hour" : " hours") << "\n";
    cout << "Original Fee: Rs. " << money(original) << "\n";
    cout << "Discount: " << discountPct << "%\n";
    cout << "Discount Amount: Rs. " << money(discountAmt) << "\n";
    cout << "Final Amount: Rs. " << money(finalAmt) << "\n";
    cout << "---------------------------\n";
}

// ---------- Tests (Milestone 3) ----------
int failures = 0;
void check(bool cond, const string& name) {
    cout << (cond ? "[PASS] " : "[FAIL] ") << name << "\n";
    if (!cond) failures++;
}

void runTests() {
    string t; double h;
    // Invalid values
    check(!validRegistration(""),        "empty registration rejected");
    check(!validRegistration("   "),     "blank registration rejected");
    check(hourlyRate("Truck", t) == -1,  "unsupported type rejected");
    check(hourlyRate("car", t) == 50 && t == "Car", "type is case-insensitive");
    check(!parseHours("0", h),           "zero hours rejected");
    check(!parseHours("-3", h),          "negative hours rejected");
    check(!parseHours("abc", h),         "non-numeric hours rejected");
    check(!parseHours("5x", h),          "trailing junk rejected");
    // Fractional durations
    check(billedHours(2.5) == 3,         "2.5 -> 3 hours");
    check(billedHours(3.0) == 3,         "3.0 stays 3 hours");
    check(billedHours(0.1) == 1,         "0.1 -> 1 hour");
    // Discount thresholds
    check(durationDiscount(5) == 0,      "exactly 5h -> 0%");
    check(durationDiscount(6) == 10,     "6h -> 10%");
    check(durationDiscount(10) == 10,    "exactly 10h -> 10%");
    check(durationDiscount(11) == 20,    "11h -> 20% (not 30%)");
    check(durationDiscount(billedHours(5.2)) == 10, "5.2h billed 6 -> 10%");
    // Sample scenario: ABC-123, Car, 6.5h -> 7h, 350, 10%, 35, 315
    int b = billedHours(6.5);
    double orig = b * 50, disc = orig * durationDiscount(b) / 100.0;
    check(b == 7 && orig == 350 && disc == 35 && orig - disc == 315, "sample scenario");
    // Bonus: staff discount
    check(totalDiscount(3, true) == 5,   "staff, 3h -> 5%");
    check(totalDiscount(7, true) == 15,  "staff, 7h -> 15%");
    check(totalDiscount(12, true) == 25, "staff, 12h -> 25% (capped)");

    cout << (failures == 0 ? "\nAll tests passed.\n" : "\nSome tests FAILED.\n");
}

// ---------- Main program ----------
int main(int argc, char* argv[]) {
    if (argc > 1 && string(argv[1]) == "--test") { runTests(); return failures; }

    cout << "=== Smart Parking Fee Calculator ===\n";
    string again = "y";
    while (toLower(trim(again)) == "y") {
        string reg, typeIn, type, hoursIn, staffIn;
        int rate; double hours;

        // Re-ask each field until it's valid (bonus: clear error messages)
        while (true) {
            cout << "Enter registration number: ";
            if (!getline(cin, reg)) return 0;
            if (validRegistration(reg)) { reg = trim(reg); break; }
            cout << "Error: registration number cannot be empty.\n";
        }
        while (true) {
            cout << "Enter vehicle type (Bike/Car/Van): ";
            if (!getline(cin, typeIn)) return 0;
            rate = hourlyRate(typeIn, type);
            if (rate != -1) break;
            cout << "Error: unsupported vehicle type. Use Bike, Car or Van.\n";
        }
        while (true) {
            cout << "Enter hours parked: ";
            if (!getline(cin, hoursIn)) return 0;
            if (parseHours(hoursIn, hours)) break;
            cout << "Error: hours must be a positive number.\n";
        }
        cout << "University staff? (y/n): ";
        if (!getline(cin, staffIn)) return 0;
        bool staff = toLower(trim(staffIn)) == "y";

        int billed = billedHours(hours);
        printReceipt(reg, type, billed, rate, totalDiscount(billed, staff));

        cout << "\nCalculate another? (y/n): ";
        if (!getline(cin, again)) return 0;
    }
    cout << "Goodbye!\n";
    return 0;
}