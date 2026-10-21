// =============================================================================
// Smart Parking Fee Calculator (single-file version)
//
// PART 1: business rules and validation
//
// Part 1 contains ONLY pure logic: parsing/validating text, calculating
// fees and formatting values as strings. It never reads from or writes to the
// terminal. PART 2 (below) is the terminal interface that calls it.
//
// Build:  g++ -std=c++17 -Wall -Wextra -Wpedantic parking.cpp -o parking.exe
//
// MONEY POLICY
//   * All money is stored as a 64-bit integer number of PAISA (Rs. 1 = 100 paisa).
//     No float/double is ever used for money.
//   * Discount amount = round-half-up( original fee x discount percent / 100 ),
//     rounded to the nearest paisa. With the whole-rupee rates and whole-number
//     percentages of this assignment the division is always exact (so rounding
//     never actually changes a value), but the policy is kept so the code stays
//     correct if rates or percentages change later.
//   * Final amount = original fee - discount amount (always reconciles exactly).
//   * Every multiplication/addition that could overflow is checked first.
//
// DURATION POLICY
//   * Durations are typed by the user as decimal text (e.g. "6.5") and are
//     parsed WITHOUT floating point into whole units of 1/10000 hour. That makes
//     comparisons such as "is the duration strictly greater than 5 hours?"
//     exact: 5.0000 is NOT greater than 5, while 5.0001 is.
//   * At most 4 decimal places are accepted and the maximum is 8760 hours
//     (one year), so no later calculation can overflow.
// =============================================================================
#include <algorithm>
#include <array>
#include <cctype>
#include <iomanip>
#include <iostream>
#include <stdexcept>
#include <vector>
#include <cstddef>
#include <cstdint>
#include <limits>
#include <string>
#include <utility>

namespace parking {

// ----------------------------- Types and constants ---------------------------

using Paisa = std::int64_t;          // money in the smallest unit
using DurationUnits = std::int64_t;  // duration in 1/10000 hour

constexpr Paisa kPaisaPerRupee = 100;

constexpr DurationUnits kUnitsPerHour = 10000;
constexpr int kMaxDecimalPlaces = 4;  // must match kUnitsPerHour = 10^4
constexpr std::int64_t kMaxParkingHours = 8760;  // one year
constexpr DurationUnits kMaxDurationUnits = kMaxParkingHours * kUnitsPerHour;

// Hourly rates (Rs. per billed hour).
constexpr Paisa kBikeRatePaisa = 30 * kPaisaPerRupee;
constexpr Paisa kCarRatePaisa = 50 * kPaisaPerRupee;
constexpr Paisa kVanRatePaisa = 80 * kPaisaPerRupee;

// Duration discount thresholds. The comparison is "strictly greater than" and
// uses the ACTUAL duration, never the rounded (billed) duration.
constexpr DurationUnits kFirstDiscountThresholdUnits = 5 * kUnitsPerHour;
constexpr DurationUnits kSecondDiscountThresholdUnits = 10 * kUnitsPerHour;

// Discount percentages.
constexpr int kNoDiscountPercent = 0;
constexpr int kFirstTierDiscountPercent = 10;   // > 5 hours
constexpr int kSecondTierDiscountPercent = 20;  // > 10 hours (replaces the 10%)
constexpr int kStaffDiscountPercent = 5;        // extra percentage POINTS for staff
constexpr int kMaxTotalDiscountPercent = 25;    // hard cap on the total
constexpr std::int64_t kPercentBase = 100;

constexpr std::size_t kMaxRegistrationLength = 15;

enum class VehicleType { Bike, Car, Van };

constexpr std::array<VehicleType, 3> kAllVehicleTypes = {
    VehicleType::Bike, VehicleType::Car, VehicleType::Van};

inline const char* vehicleTypeName(VehicleType type) {
    switch (type) {
        case VehicleType::Bike: return "Bike";
        case VehicleType::Car: return "Car";
        case VehicleType::Van: return "Van";
    }
    return "Unknown";  // unreachable; keeps compilers happy
}

inline Paisa hourlyRate(VehicleType type) {
    switch (type) {
        case VehicleType::Bike: return kBikeRatePaisa;
        case VehicleType::Car: return kCarRatePaisa;
        case VehicleType::Van: return kVanRatePaisa;
    }
    return 0;  // unreachable
}

// ----------------------------- Parse result ----------------------------------

// Result of validating one piece of user input: either a value or an error text.
template <typename T>
struct ParseResult {
    bool ok = false;
    T value{};
    std::string error;
};

template <typename T>
ParseResult<T> parseSuccess(T value) {
    ParseResult<T> result;
    result.ok = true;
    result.value = std::move(value);
    return result;
}

template <typename T>
ParseResult<T> parseFailure(std::string message) {
    ParseResult<T> result;
    result.error = std::move(message);
    return result;
}

// ----------------------------- String helpers --------------------------------

inline bool isSpaceChar(char c) { return std::isspace(static_cast<unsigned char>(c)) != 0; }
inline bool isDigitChar(char c) { return std::isdigit(static_cast<unsigned char>(c)) != 0; }
inline bool isAlnumChar(char c) { return std::isalnum(static_cast<unsigned char>(c)) != 0; }

// Removes leading and trailing whitespace.
inline std::string trim(const std::string& text) {
    std::size_t begin = 0;
    std::size_t end = text.size();
    while (begin < end && isSpaceChar(text[begin])) ++begin;
    while (end > begin && isSpaceChar(text[end - 1])) --end;
    return text.substr(begin, end - begin);
}

inline std::string toUpperAscii(std::string text) {
    for (char& c : text) c = static_cast<char>(std::toupper(static_cast<unsigned char>(c)));
    return text;
}

inline std::string toLowerAscii(std::string text) {
    for (char& c : text) c = static_cast<char>(std::tolower(static_cast<unsigned char>(c)));
    return text;
}

// Shortens long user text so error messages stay readable.
inline std::string previewText(const std::string& text) {
    constexpr std::size_t kMaxPreview = 24;
    if (text.size() <= kMaxPreview) return text;
    return text.substr(0, kMaxPreview) + "...";
}

// ----------------------------- Overflow-safe arithmetic ----------------------

// Both helpers handle NON-NEGATIVE operands only (all money/hours here are
// non-negative). They return false instead of overflowing.
inline bool checkedAdd(std::int64_t a, std::int64_t b, std::int64_t& result) {
    if (a < 0 || b < 0) return false;
    if (a > std::numeric_limits<std::int64_t>::max() - b) return false;
    result = a + b;
    return true;
}

inline bool checkedMultiply(std::int64_t a, std::int64_t b, std::int64_t& result) {
    if (a < 0 || b < 0) return false;
    if (a != 0 && b > std::numeric_limits<std::int64_t>::max() / a) return false;
    result = a * b;
    return true;
}

// ----------------------------- Input validation ------------------------------

// Registration number: trimmed, 1..15 characters of letters, digits, spaces or
// hyphens. Stored in UPPER CASE so "abc-123" and "ABC-123" are the same vehicle.
inline ParseResult<std::string> parseRegistration(const std::string& rawText) {
    const std::string text = trim(rawText);
    if (text.empty()) {
        return parseFailure<std::string>("Registration number cannot be empty or only spaces.");
    }
    if (text.size() > kMaxRegistrationLength) {
        return parseFailure<std::string>("Registration number is too long (maximum " +
                                         std::to_string(kMaxRegistrationLength) + " characters).");
    }
    for (char c : text) {
        if (!(isAlnumChar(c) || c == '-' || c == ' ')) {
            return parseFailure<std::string>(
                "Registration may contain only letters, digits, spaces and hyphens.");
        }
    }
    return parseSuccess(toUpperAscii(text));
}

// Vehicle type: "bike", "car" or "van" in any letter case, surrounding spaces ignored.
inline ParseResult<VehicleType> parseVehicleType(const std::string& rawText) {
    const std::string text = toLowerAscii(trim(rawText));
    if (text == "bike") return parseSuccess(VehicleType::Bike);
    if (text == "car") return parseSuccess(VehicleType::Car);
    if (text == "van") return parseSuccess(VehicleType::Van);
    if (text.empty()) {
        return parseFailure<VehicleType>("Vehicle type cannot be empty. Enter Bike, Car or Van.");
    }
    return parseFailure<VehicleType>("'" + previewText(trim(rawText)) +
                                     "' is not a supported vehicle type. Enter Bike, Car or Van.");
}

// Duration in hours, e.g. "2", "6.5", "10.0001". Returns 1/10000-hour units.
//   Accepted : digits with an optional decimal point and 1-4 decimal places.
//   Rejected : empty text, letters, "nan", "inf", exponents ("1e3"), signs other
//              than a leading '-' (which is then rejected as non-positive),
//              zero, negative values, more than 4 decimals, values > 8760 hours.
// No floating point is used, so overflow and precision problems cannot occur.
inline ParseResult<DurationUnits> parseDuration(const std::string& rawText) {
    const std::string text = trim(rawText);
    if (text.empty()) {
        return parseFailure<DurationUnits>(
            "Duration cannot be empty. Enter hours such as 2 or 6.5.");
    }

    const std::string malformed = "'" + previewText(text) +
                                  "' is not a valid number of hours (example: 6.5).";

    std::size_t pos = 0;
    const bool negative = (text[0] == '-');
    if (negative) pos = 1;

    // Whole-hours part. Stop accumulating once it exceeds the maximum so the
    // running value can never overflow, but keep scanning to validate the format.
    std::int64_t wholeHours = 0;
    bool tooLarge = false;
    std::size_t wholeDigits = 0;
    while (pos < text.size() && isDigitChar(text[pos])) {
        if (!tooLarge) {
            wholeHours = wholeHours * 10 + (text[pos] - '0');
            if (wholeHours > kMaxParkingHours) tooLarge = true;
        }
        ++wholeDigits;
        ++pos;
    }

    // Optional fractional part.
    std::int64_t fraction = 0;
    std::size_t fractionDigits = 0;
    bool hasPoint = false;
    if (pos < text.size() && text[pos] == '.') {
        hasPoint = true;
        ++pos;
        while (pos < text.size() && isDigitChar(text[pos])) {
            if (fractionDigits < static_cast<std::size_t>(kMaxDecimalPlaces)) {
                fraction = fraction * 10 + (text[pos] - '0');
            }
            ++fractionDigits;
            ++pos;
        }
    }

    // Format checks: nothing left over, at least one digit, no bare "5." or "-".
    if (pos != text.size()) return parseFailure<DurationUnits>(malformed);
    if (wholeDigits == 0 && fractionDigits == 0) return parseFailure<DurationUnits>(malformed);
    if (hasPoint && fractionDigits == 0) return parseFailure<DurationUnits>(malformed);

    // Value checks.
    if (negative) {
        return parseFailure<DurationUnits>("Duration must be greater than zero (negative is not allowed).");
    }
    if (fractionDigits > static_cast<std::size_t>(kMaxDecimalPlaces)) {
        return parseFailure<DurationUnits>("Please use at most " + std::to_string(kMaxDecimalPlaces) +
                                           " decimal places.");
    }
    if (tooLarge) {
        return parseFailure<DurationUnits>("Duration is too large. The maximum is " +
                                           std::to_string(kMaxParkingHours) + " hours (one year).");
    }

    // Scale the fraction to exactly 4 decimal places (".5" -> 5000).
    for (std::size_t i = fractionDigits; i < static_cast<std::size_t>(kMaxDecimalPlaces); ++i) {
        fraction *= 10;
    }
    const DurationUnits units = wholeHours * kUnitsPerHour + fraction;

    if (units == 0) {
        return parseFailure<DurationUnits>("Duration must be greater than zero.");
    }
    if (units > kMaxDurationUnits) {
        return parseFailure<DurationUnits>("Duration is too large. The maximum is " +
                                           std::to_string(kMaxParkingHours) + " hours (one year).");
    }
    return parseSuccess(units);
}

// Yes/No answer: y, yes, n, no (any letter case).
inline ParseResult<bool> parseYesNo(const std::string& rawText) {
    const std::string text = toLowerAscii(trim(rawText));
    if (text == "y" || text == "yes") return parseSuccess(true);
    if (text == "n" || text == "no") return parseSuccess(false);
    return parseFailure<bool>("Please answer Y (yes) or N (no).");
}

// ----------------------------- Billing rules ---------------------------------

// Billed hours = CEILING of the actual duration, using exact integer arithmetic.
// Examples: 1.0 -> 1, 1.1 -> 2, 2.5 -> 3, 5.0 -> 5, 5.01 -> 6, 10.5 -> 11.
// Returns 0 for non-positive input (callers reject that earlier).
inline std::int64_t calculateBilledHours(DurationUnits actualUnits) {
    if (actualUnits <= 0) return 0;
    return (actualUnits + kUnitsPerHour - 1) / kUnitsPerHour;
}

// Standard duration discount, based on the ACTUAL duration.
//   <= 5 h : 0%      > 5 h : 10%      > 10 h : 20% (replaces the 10%, never adds)
inline int calculateStandardDiscountPercent(DurationUnits actualUnits) {
    if (actualUnits > kSecondDiscountThresholdUnits) return kSecondTierDiscountPercent;
    if (actualUnits > kFirstDiscountThresholdUnits) return kFirstTierDiscountPercent;
    return kNoDiscountPercent;
}

struct DiscountBreakdown {
    int standardPercent = 0;  // from the duration rules
    int staffPercent = 0;     // extra percentage points actually added for staff
    int totalPercent = 0;     // min(standard + staff, 25)
    bool capApplied = false;  // true if the 25% cap reduced the staff addition
};

// Total discount = min(standard + 5 points if staff, 25). The staff discount is
// ADDED to the standard percentage; it is not applied to an already-discounted price.
inline DiscountBreakdown calculateDiscountBreakdown(DurationUnits actualUnits, bool isStaff) {
    DiscountBreakdown breakdown;
    breakdown.standardPercent = calculateStandardDiscountPercent(actualUnits);
    const int requestedStaff = isStaff ? kStaffDiscountPercent : 0;
    const int uncappedTotal = breakdown.standardPercent + requestedStaff;
    breakdown.totalPercent = std::min(uncappedTotal, kMaxTotalDiscountPercent);
    breakdown.capApplied = uncappedTotal > kMaxTotalDiscountPercent;
    breakdown.staffPercent = breakdown.totalPercent - breakdown.standardPercent;
    return breakdown;
}

// Discount amount in paisa, always computed from the ORIGINAL fee, rounded half up.
// Returns false (and leaves 'amount' unchanged) if the input is invalid or would overflow.
inline bool calculateDiscountAmount(Paisa originalFee, int percent, Paisa& amount) {
    if (originalFee < 0 || percent < 0 || percent > kPercentBase) return false;
    Paisa product = 0;
    if (!checkedMultiply(originalFee, percent, product)) return false;
    if (product > std::numeric_limits<Paisa>::max() - kPercentBase / 2) return false;
    amount = (product + kPercentBase / 2) / kPercentBase;
    return true;
}

// Every figure that appears on the receipt, history and summary comes from this
// single structure, so the screens can never disagree with each other.
struct ParkingFeeResult {
    VehicleType vehicle = VehicleType::Car;
    bool isStaff = false;
    DurationUnits actualUnits = 0;
    std::int64_t billedHours = 0;
    Paisa hourlyRatePaisa = 0;
    Paisa originalFee = 0;
    DiscountBreakdown discount;
    Paisa discountAmount = 0;
    Paisa finalAmount = 0;
};

// Fills 'result' and returns true; returns false for an invalid duration or if
// any step would overflow.
inline bool calculateParkingFee(VehicleType vehicle, DurationUnits actualUnits, bool isStaff,
                                ParkingFeeResult& result) {
    if (actualUnits <= 0 || actualUnits > kMaxDurationUnits) return false;

    ParkingFeeResult fee;
    fee.vehicle = vehicle;
    fee.isStaff = isStaff;
    fee.actualUnits = actualUnits;
    fee.billedHours = calculateBilledHours(actualUnits);
    fee.hourlyRatePaisa = hourlyRate(vehicle);

    if (!checkedMultiply(fee.billedHours, fee.hourlyRatePaisa, fee.originalFee)) return false;
    fee.discount = calculateDiscountBreakdown(actualUnits, isStaff);

    Paisa discountAmount = 0;
    if (!calculateDiscountAmount(fee.originalFee, fee.discount.totalPercent, discountAmount)) return false;
    if (discountAmount > fee.originalFee) return false;

    fee.discountAmount = discountAmount;
    fee.finalAmount = fee.originalFee - fee.discountAmount;
    result = fee;
    return true;
}

// ----------------------------- Session statistics ----------------------------

struct SessionStatistics {
    std::int64_t calculationCount = 0;
    std::int64_t bikeCount = 0;
    std::int64_t carCount = 0;
    std::int64_t vanCount = 0;
    Paisa totalOriginalFees = 0;
    Paisa totalDiscounts = 0;
    Paisa totalFinalCharges = 0;

    // Adds one completed calculation. All additions are checked FIRST, so on
    // failure (returns false) nothing is changed.
    bool record(const ParkingFeeResult& fee) {
        Paisa newOriginal = 0;
        Paisa newDiscounts = 0;
        Paisa newFinal = 0;
        std::int64_t newCount = 0;
        if (!checkedAdd(totalOriginalFees, fee.originalFee, newOriginal)) return false;
        if (!checkedAdd(totalDiscounts, fee.discountAmount, newDiscounts)) return false;
        if (!checkedAdd(totalFinalCharges, fee.finalAmount, newFinal)) return false;
        if (!checkedAdd(calculationCount, 1, newCount)) return false;

        totalOriginalFees = newOriginal;
        totalDiscounts = newDiscounts;
        totalFinalCharges = newFinal;
        calculationCount = newCount;
        switch (fee.vehicle) {
            case VehicleType::Bike: ++bikeCount; break;
            case VehicleType::Car: ++carCount; break;
            case VehicleType::Van: ++vanCount; break;
        }
        return true;
    }
};

// ----------------------------- Formatting helpers ----------------------------

// 1234550 paisa -> "12,345.50" (no currency prefix).
inline std::string formatPlainAmount(Paisa paisa) {
    const bool negative = paisa < 0;
    const unsigned long long magnitude =
        negative ? 0ULL - static_cast<unsigned long long>(paisa) : static_cast<unsigned long long>(paisa);
    const unsigned long long rupees = magnitude / static_cast<unsigned long long>(kPaisaPerRupee);
    const unsigned long long cents = magnitude % static_cast<unsigned long long>(kPaisaPerRupee);

    const std::string digits = std::to_string(rupees);
    std::string grouped;
    for (std::size_t i = 0; i < digits.size(); ++i) {
        if (i > 0 && (digits.size() - i) % 3 == 0) grouped += ',';
        grouped += digits[i];
    }
    std::string result = negative ? "-" : "";
    result += grouped + "." + (cents < 10 ? "0" : "") + std::to_string(cents);
    return result;
}

// 35000 paisa -> "Rs. 350.00"
inline std::string formatMoney(Paisa paisa) { return "Rs. " + formatPlainAmount(paisa); }

// 65000 units -> "6.5 hours", 10000 -> "1 hour", 50001 -> "5.0001 hours"
inline std::string formatDuration(DurationUnits units) {
    const DurationUnits whole = units / kUnitsPerHour;
    const DurationUnits fraction = units % kUnitsPerHour;
    std::string text = std::to_string(whole);
    if (fraction != 0) {
        std::string digits = std::to_string(fraction);
        digits = std::string(static_cast<std::size_t>(kMaxDecimalPlaces) - digits.size(), '0') + digits;
        while (!digits.empty() && digits.back() == '0') digits.pop_back();
        text += "." + digits;
    }
    text += (units == kUnitsPerHour) ? " hour" : " hours";
    return text;
}

// 7 -> "7 hours", 1 -> "1 hour"
inline std::string formatBilledHours(std::int64_t hours) {
    return std::to_string(hours) + (hours == 1 ? " hour" : " hours");
}

inline std::string formatPercent(int percent) { return std::to_string(percent) + "%"; }

// 1 -> "PKG-0001"
inline std::string formatReceiptNumber(int number) {
    std::string digits = std::to_string(number);
    if (digits.size() < 4) digits = std::string(4 - digits.size(), '0') + digits;
    return "PKG-" + digits;
}

}  // namespace parking

// =============================================================================
// PART 2: terminal interface (prompts, menu, receipt, history, summary)
// =============================================================================

namespace {

using namespace parking;

// ----------------------------- Layout constants ------------------------------

constexpr int kLineWidth = 64;
constexpr int kLabelWidth = 24;

const char* const kApplicationName = "SMART PARKING FEE CALCULATOR";
const char* const kUniversityName = "CRESTVIEW UNIVERSITY - CAMPUS PARKING SYSTEM";  // fictional

// ----------------------------- Session data ----------------------------------

// One completed calculation (a receipt). Only finished calculations are stored.
struct ParkingRecord {
    int receiptNumber = 0;
    std::string registration;
    ParkingFeeResult fee;
};

// Everything that lives for the duration of one program run.
struct SessionState {
    std::vector<ParkingRecord> history;
    SessionStatistics statistics;
    int nextReceiptNumber = 1;  // receipt numbers are sequential within a session
};

enum class MenuChoice { Calculate, ViewHistory, SearchHistory, Exit };

// Thrown when the input stream ends (Ctrl+Z / Ctrl+D / end of a piped file).
class InputClosed : public std::runtime_error {
public:
    InputClosed() : std::runtime_error("input stream closed") {}
};

// ----------------------------- Output helpers --------------------------------

void printSeparator(char symbol) { std::cout << std::string(kLineWidth, symbol) << '\n'; }

void printCentered(const std::string& text) {
    const int width = static_cast<int>(text.size());
    const int padding = width >= kLineWidth ? 0 : (kLineWidth - width) / 2;
    std::cout << std::string(static_cast<std::size_t>(padding), ' ') << text << '\n';
}

void printHeading(const std::string& title) {
    std::cout << '\n';
    printSeparator('-');
    std::cout << ' ' << title << '\n';
    printSeparator('-');
}

// Distinct message styles (plain text, no colours, works in any terminal).
void printSuccess(const std::string& message) { std::cout << "  [OK]      " << message << '\n'; }
void printInfo(const std::string& message) { std::cout << "  [INFO]    " << message << '\n'; }
void printWarning(const std::string& message) { std::cout << "  [WARNING] " << message << '\n'; }
void printError(const std::string& message) { std::cout << "  [ERROR]   " << message << '\n'; }

// "  Label                   : value"
void printRow(const std::string& label, const std::string& value) {
    std::cout << "  " << std::left << std::setw(kLabelWidth) << label << ": " << value << '\n';
}

// ----------------------------- Input helpers ---------------------------------

// Prints the prompt and reads one line. Throws InputClosed on end-of-file, so no
// loop can ever spin forever on a closed input stream.
std::string readLine(const std::string& prompt) {
    std::cout << prompt << std::flush;
    std::string line;
    if (!std::getline(std::cin, line)) throw InputClosed();
    if (!line.empty() && line.back() == '\r') line.pop_back();  // tolerate Windows line endings
    return line;
}

std::string readRegistrationNumber(const std::string& prompt) {
    for (;;) {
        const ParseResult<std::string> result = parseRegistration(readLine(prompt));
        if (result.ok) return result.value;
        printError(result.error);
    }
}

void printVehicleOptions() {
    std::cout << "\n  Vehicle types and hourly rates:\n";
    for (const VehicleType type : kAllVehicleTypes) {
        std::cout << "    " << std::left << std::setw(6) << vehicleTypeName(type) << "- "
                  << formatMoney(hourlyRate(type)) << " per billed hour\n";
    }
    std::cout << '\n';
}

VehicleType readVehicleType() {
    printVehicleOptions();
    for (;;) {
        const ParseResult<VehicleType> result = parseVehicleType(readLine("  Vehicle type (Bike / Car / Van): "));
        if (result.ok) return result.value;
        printError(result.error);
    }
}

DurationUnits readParkingDuration() {
    for (;;) {
        const ParseResult<DurationUnits> result = parseDuration(readLine(
            "  Parking duration in hours (e.g. 2 or 6.5; max " + std::to_string(kMaxParkingHours) + "): "));
        if (result.ok) return result.value;
        printError(result.error);
    }
}

bool readStaffStatus() {
    for (;;) {
        const ParseResult<bool> result =
            parseYesNo(readLine("  Is the customer university staff? (Y/N, self-declared): "));
        if (result.ok) return result.value;
        printError(result.error);
    }
}

MenuChoice readMenuChoice() {
    std::cout << "\n  MAIN MENU\n"
              << "    1. Calculate a parking fee\n"
              << "    2. View session history\n"
              << "    3. Search history by registration number\n"
              << "    4. Exit and show session summary\n\n";
    for (;;) {
        const std::string choice = trim(readLine("  Enter your choice (1-4): "));
        if (choice == "1") return MenuChoice::Calculate;
        if (choice == "2") return MenuChoice::ViewHistory;
        if (choice == "3") return MenuChoice::SearchHistory;
        if (choice == "4") return MenuChoice::Exit;
        printError("Invalid choice. Please enter 1, 2, 3 or 4.");
    }
}

// ----------------------------- Screens ---------------------------------------

void displayWelcomeScreen() {
    printSeparator('=');
    printCentered(kApplicationName);
    printCentered(kUniversityName);
    printSeparator('=');
    printInfo("Educational prototype: it CALCULATES parking charges only.");
    printInfo("No payment is taken and staff status is not verified.");
}

void displayClosingMessage() {
    std::cout << '\n';
    printSeparator('=');
    printCentered("Thank you for using the Smart Parking Fee Calculator.");
    printCentered("Drive safe and park smart. Goodbye!");
    printSeparator('=');
}

std::string customerCategory(bool isStaff) {
    return isStaff ? "University Staff (self-declared)" : "Student / Visitor";
}

// Short explanation of how the final amount was derived (Enhancement 3).
void displayCalculationSummary(const ParkingRecord& record) {
    const ParkingFeeResult& fee = record.fee;

    printHeading("CALCULATION SUMMARY");
    printRow("Vehicle", vehicleTypeName(fee.vehicle));

    std::string durationText = formatBilledHours(fee.billedHours);
    if (fee.actualUnits != fee.billedHours * kUnitsPerHour) {
        durationText += " (actual " + formatDuration(fee.actualUnits) + ", rounded up)";
    }
    printRow("Billed duration", durationText);
    printRow("Hourly rate", formatMoney(fee.hourlyRatePaisa));
    printRow("Original fee", std::to_string(fee.billedHours) + " x " + formatMoney(fee.hourlyRatePaisa) +
                                 " = " + formatMoney(fee.originalFee));

    std::string discountText = formatPercent(fee.discount.standardPercent) + " standard";
    if (fee.isStaff) discountText += " + " + formatPercent(fee.discount.staffPercent) + " staff";
    discountText += " = " + formatPercent(fee.discount.totalPercent);
    if (fee.discount.capApplied) discountText += " (capped at " + formatPercent(kMaxTotalDiscountPercent) + ")";
    printRow("Discount percentage", discountText);

    printRow("Discount amount", formatPercent(fee.discount.totalPercent) + " of " +
                                    formatMoney(fee.originalFee) + " = " + formatMoney(fee.discountAmount));
    printRow("Final amount", formatMoney(fee.originalFee) + " - " + formatMoney(fee.discountAmount) +
                                 " = " + formatMoney(fee.finalAmount));
}

void displayReceipt(const ParkingRecord& record) {
    const ParkingFeeResult& fee = record.fee;

    std::cout << '\n';
    printSeparator('=');
    printCentered(kUniversityName);
    printCentered("PARKING FEE RECEIPT (CALCULATED)");
    printSeparator('=');
    printRow("Receipt number", formatReceiptNumber(record.receiptNumber));
    printRow("Vehicle registration", record.registration);
    printRow("Vehicle type", vehicleTypeName(fee.vehicle));
    printRow("Actual parking duration", formatDuration(fee.actualUnits));
    printRow("Billed parking duration", formatBilledHours(fee.billedHours));
    printRow("Hourly rate", formatMoney(fee.hourlyRatePaisa));
    printRow("Original fee", formatMoney(fee.originalFee));
    printRow("Customer category", customerCategory(fee.isStaff));
    printRow("Standard discount", formatPercent(fee.discount.standardPercent));
    printRow("Staff discount", fee.isStaff ? "+" + formatPercent(fee.discount.staffPercent) : "Not applicable");
    printRow("Total discount", formatPercent(fee.discount.totalPercent));
    printRow("Discount amount", formatMoney(fee.discountAmount));
    printSeparator('-');
    printRow("FINAL PAYABLE AMOUNT", formatMoney(fee.finalAmount));
    printRow("Payment status", "CALCULATED - NOT PAID");
    printSeparator('=');
    printInfo("This is a fee calculation only. No payment has been made.");
    if (fee.isStaff) printInfo("Staff status was self-declared and has not been verified.");
}

void printHistoryTableHeader() {
    std::cout << std::left << std::setw(9) << "Receipt" << std::setw(16) << "Registration"
              << std::setw(8) << "Vehicle" << std::setw(9) << "Billed" << std::right << std::setw(11)
              << "Original" << std::setw(11) << "Discount" << std::setw(11) << "Final" << '\n';
    printSeparator('-');
}

void printHistoryTableRow(const ParkingRecord& record) {
    const ParkingFeeResult& fee = record.fee;
    std::cout << std::left << std::setw(9) << formatReceiptNumber(record.receiptNumber) << std::setw(16)
              << record.registration << std::setw(8) << vehicleTypeName(fee.vehicle) << std::setw(9)
              << (std::to_string(fee.billedHours) + " h") << std::right << std::setw(11)
              << formatPlainAmount(fee.originalFee) << std::setw(11) << formatPlainAmount(fee.discountAmount)
              << std::setw(11) << formatPlainAmount(fee.finalAmount) << '\n';
}

void displayHistory(const SessionState& session) {
    printHeading("SESSION HISTORY");
    printInfo("History is temporary: it is cleared when the program exits.");
    if (session.history.empty()) {
        printInfo("No parking fees have been calculated in this session yet.");
        return;
    }
    std::cout << "\n  Amounts are in Rs.\n";
    printHistoryTableHeader();
    for (const ParkingRecord& record : session.history) printHistoryTableRow(record);
    printSeparator('-');
    printInfo(std::to_string(session.history.size()) + " calculation(s) in this session.");
}

void searchHistory(const SessionState& session) {
    printHeading("SEARCH HISTORY");
    const std::string key = readRegistrationNumber("  Registration number to search: ");  // trimmed + upper case

    std::vector<const ParkingRecord*> matches;
    for (const ParkingRecord& record : session.history) {
        if (record.registration == key) matches.push_back(&record);
    }

    if (matches.empty()) {
        printWarning("No calculation found for '" + key + "' in this session.");
        printInfo("Check the spelling, or calculate a fee first (search covers this session only).");
        return;
    }
    std::cout << "\n  Amounts are in Rs.\n";
    printHistoryTableHeader();
    for (const ParkingRecord* record : matches) printHistoryTableRow(*record);
    printSeparator('-');
    printSuccess(std::to_string(matches.size()) + " match(es) found for '" + key + "'.");
}

void displaySessionSummary(const SessionState& session) {
    const SessionStatistics& stats = session.statistics;
    printHeading("SESSION SUMMARY");
    printRow("Calculations completed", std::to_string(stats.calculationCount));
    printRow("Bikes processed", std::to_string(stats.bikeCount));
    printRow("Cars processed", std::to_string(stats.carCount));
    printRow("Vans processed", std::to_string(stats.vanCount));
    printRow("Total original fees", formatMoney(stats.totalOriginalFees));
    printRow("Total discounts granted", formatMoney(stats.totalDiscounts));
    printRow("Total final charges", formatMoney(stats.totalFinalCharges));
    printInfo("These are CALCULATED charges, not collected revenue.");
}

// ----------------------------- Main workflow ---------------------------------

// Collects the four inputs, calculates the fee and shows the receipt. If input
// ends part-way (InputClosed) nothing has been recorded, so no half-finished
// receipt can ever appear in the history or the statistics.
void performCalculation(SessionState& session) {
    printHeading("NEW PARKING FEE CALCULATION");
    const std::string registration = readRegistrationNumber("  Registration number (e.g. ABC-123): ");
    const VehicleType vehicle = readVehicleType();
    const DurationUnits duration = readParkingDuration();
    const bool isStaff = readStaffStatus();

    ParkingFeeResult fee;
    if (!calculateParkingFee(vehicle, duration, isStaff, fee)) {
        printError("The fee could not be calculated safely. Nothing was recorded.");
        return;
    }
    if (!session.statistics.record(fee)) {
        printError("Session totals reached their safe limit. Nothing was recorded.");
        return;
    }

    ParkingRecord record;
    record.receiptNumber = session.nextReceiptNumber++;
    record.registration = registration;
    record.fee = fee;
    session.history.push_back(record);

    displayCalculationSummary(record);
    displayReceipt(record);
    printSuccess("Calculation complete. Choose an option below to continue.");
}

int runApplication() {
    SessionState session;
    displayWelcomeScreen();

    try {
        bool running = true;
        while (running) {
            switch (readMenuChoice()) {
                case MenuChoice::Calculate: performCalculation(session); break;
                case MenuChoice::ViewHistory: displayHistory(session); break;
                case MenuChoice::SearchHistory: searchHistory(session); break;
                case MenuChoice::Exit: running = false; break;
            }
        }
    } catch (const InputClosed&) {
        std::cout << '\n';
        printWarning("Input ended (end-of-file). Closing the program.");
    }

    displaySessionSummary(session);
    displayClosingMessage();
    return 0;
}

}  // namespace

int main() { return runApplication(); }