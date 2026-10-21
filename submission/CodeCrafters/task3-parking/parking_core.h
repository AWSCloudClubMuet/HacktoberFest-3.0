// =============================================================================
// parking_core.h  -  Smart Parking Fee Calculator: business rules and validation
//
// This header contains ONLY pure logic: parsing/validating text, calculating
// fees and formatting values as strings. It never reads from or writes to the
// terminal, so the same code is used by the interactive program (main.cpp) and
// by the automated tests (tests/test_core.cpp).
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
#ifndef PARKING_CORE_H
#define PARKING_CORE_H

#include <algorithm>
#include <array>
#include <cctype>
#include <cstddef>
#include <cstdint>
#include <limits>
#include <optional>
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
    using Result = ParseResult<DurationUnits>;
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
    return Result{true, units, ""};
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
inline std::optional<Paisa> calculateDiscountAmount(Paisa originalFee, int percent) {
    if (originalFee < 0 || percent < 0 || percent > kPercentBase) return std::nullopt;
    Paisa product = 0;
    if (!checkedMultiply(originalFee, percent, product)) return std::nullopt;
    if (product > std::numeric_limits<Paisa>::max() - kPercentBase / 2) return std::nullopt;
    return (product + kPercentBase / 2) / kPercentBase;
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

// Returns std::nullopt for an invalid duration or if any step would overflow.
inline std::optional<ParkingFeeResult> calculateParkingFee(VehicleType vehicle,
                                                           DurationUnits actualUnits,
                                                           bool isStaff) {
    if (actualUnits <= 0 || actualUnits > kMaxDurationUnits) return std::nullopt;

    ParkingFeeResult result;
    result.vehicle = vehicle;
    result.isStaff = isStaff;
    result.actualUnits = actualUnits;
    result.billedHours = calculateBilledHours(actualUnits);
    result.hourlyRatePaisa = hourlyRate(vehicle);

    if (!checkedMultiply(result.billedHours, result.hourlyRatePaisa, result.originalFee)) {
        return std::nullopt;
    }
    result.discount = calculateDiscountBreakdown(actualUnits, isStaff);

    const std::optional<Paisa> discountAmount =
        calculateDiscountAmount(result.originalFee, result.discount.totalPercent);
    if (!discountAmount.has_value() || *discountAmount > result.originalFee) return std::nullopt;

    result.discountAmount = *discountAmount;
    result.finalAmount = result.originalFee - result.discountAmount;
    return result;
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

#endif  // PARKING_CORE_H