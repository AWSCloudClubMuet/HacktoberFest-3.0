// =============================================================================
// main.cpp  -  Smart Parking Fee Calculator (terminal interface)
//
// This file handles everything the user sees: prompts, menus, receipts, history
// and the session summary. ALL business rules (rates, rounding, discounts,
// validation, money arithmetic) live in parking_core.h and are only CALLED here.
//
// Build:  g++ -std=c++17 -Wall -Wextra -Wpedantic src/main.cpp -o parking.exe
// =============================================================================

#include <iomanip>
#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

#include "parking_core.h"

namespace {

using namespace parking;

// ----------------------------- Layout constants ------------------------------

constexpr int kLineWidth = 64;
constexpr int kLabelWidth = 24;

const char* const kApplicationName = "SMART PARKING FEE CALCULATOR";
const char* const kUniversityName = "MEHRAN UNIVERSITY - CAMPUS PARKING SYSTEM";  // fictional

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

    const std::optional<ParkingFeeResult> fee = calculateParkingFee(vehicle, duration, isStaff);
    if (!fee.has_value()) {
        printError("The fee could not be calculated safely. Nothing was recorded.");
        return;
    }
    if (!session.statistics.record(*fee)) {
        printError("Session totals reached their safe limit. Nothing was recorded.");
        return;
    }

    ParkingRecord record;
    record.receiptNumber = session.nextReceiptNumber++;
    record.registration = registration;
    record.fee = *fee;
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