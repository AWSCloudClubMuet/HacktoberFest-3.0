// =============================================================================
// University Scholarship Eligibility Checker
// -----------------------------------------------------------------------------
// A console application that collects student details, validates every input,
// evaluates three scholarship categories INDEPENDENTLY, explains each decision,
// and prints a readable report. Includes multi-student processing and a summary.
//
// Language : C++17 (standard library only)
// Build    : g++ -std=c++17 -Wall -Wextra -Wpedantic main.cpp -o scholarship_checker
// =============================================================================

#include <cctype>
#include <cmath>
#include <cstddef>
#include <iomanip>
#include <iostream>
#include <limits>
#include <sstream>
#include <string>
#include <vector>

// -----------------------------------------------------------------------------
// Named constants (no magic numbers anywhere else in the program)
// -----------------------------------------------------------------------------
namespace config {

// Merit Scholarship: BOTH conditions must hold. Thresholds are inclusive (>=).
constexpr double kMeritMinCgpa = 3.7;
constexpr double kMeritMinAttendance = 85.0;

// Academic Scholarship: BOTH conditions must hold. Thresholds are inclusive (>=).
constexpr double kAcademicMinCgpa = 3.3;
constexpr double kAcademicMinAttendance = 80.0;

// Need-Based Scholarship: ALL THREE conditions must hold.
// CGPA and attendance are inclusive (>=); income is STRICT (< , not <=).
constexpr double kNeedMaxIncome = 50000.0;
constexpr double kNeedMinCgpa = 2.8;
constexpr double kNeedMinAttendance = 75.0;

// Valid input ranges.
constexpr double kMinCgpa = 0.0;
constexpr double kMaxCgpa = 4.0;
constexpr double kMinAttendance = 0.0;
constexpr double kMaxAttendance = 100.0;
constexpr double kMinIncome = 0.0;

// Weights for the OPTIONAL illustrative score (custom formula, not official policy).
constexpr double kScoreCgpaWeight = 70.0;
constexpr double kScoreAttendanceWeight = 30.0;

// Menu options.
constexpr int kMenuCheckStudent = 1;
constexpr int kMenuExit = 2;

}  // namespace config

// -----------------------------------------------------------------------------
// Data structures
// -----------------------------------------------------------------------------

/** Validated details of one student. */
struct Student {
    std::string name;
    double cgpa = 0.0;        // 0.0 - 4.0
    double attendance = 0.0;  // 0 - 100 (percent)
    double income = 0.0;      // monthly household income in PKR
};

/** Independent eligibility flags, one per scholarship category. */
struct EligibilityResult {
    bool merit = false;
    bool academic = false;
    bool needBased = false;

    int count() const {
        return (merit ? 1 : 0) + (academic ? 1 : 0) + (needBased ? 1 : 0);
    }
};

/** Running totals for a program session. */
struct SessionSummary {
    int studentsProcessed = 0;
    int meritCount = 0;
    int academicCount = 0;
    int needBasedCount = 0;
    int noScholarshipCount = 0;
};

/** Thrown when standard input is closed (EOF) so prompts never loop forever. */
struct InputClosedError {};

// -----------------------------------------------------------------------------
// Text helpers and formatting
// -----------------------------------------------------------------------------

/** Removes leading and trailing whitespace. */
std::string trim(const std::string& text) {
    std::size_t first = 0;
    while (first < text.size() && std::isspace(static_cast<unsigned char>(text[first]))) {
        ++first;
    }
    std::size_t last = text.size();
    while (last > first && std::isspace(static_cast<unsigned char>(text[last - 1]))) {
        --last;
    }
    return text.substr(first, last - first);
}

/** Formats a number with exactly `decimals` digits after the decimal point. */
std::string formatFixed(double value, int decimals) {
    std::ostringstream out;
    out << std::fixed << std::setprecision(decimals) << value;
    return out.str();
}

/** Formats a number with up to `maxDecimals` digits, trimming trailing zeros ("82", "82.5"). */
std::string formatTrimmed(double value, int maxDecimals) {
    std::string text = formatFixed(value, maxDecimals);
    if (text.find('.') != std::string::npos) {
        while (text.back() == '0') {
            text.pop_back();
        }
        if (text.back() == '.') {
            text.pop_back();
        }
    }
    return text;
}

/** Formats a percentage such as "85%" or "82.5%". */
std::string formatPercent(double value) {
    return formatTrimmed(value, 2) + "%";
}

/** Formats an amount as "Rs. 40,000" (thousands separators, decimals only when needed). */
std::string formatMoney(double amount) {
    const std::string text = formatFixed(amount, 2);
    const std::size_t dot = text.find('.');
    std::string whole = text.substr(0, dot);
    std::string fraction = text.substr(dot);
    if (fraction == ".00") {
        fraction.clear();
    }
    for (int i = static_cast<int>(whole.size()) - 3; i > 0; i -= 3) {
        whole.insert(static_cast<std::size_t>(i), ",");
    }
    return "Rs. " + whole + fraction;
}

/** Prints a horizontal separator line made of the given character. */
void printLine(char symbol) {
    std::cout << std::string(64, symbol) << "\n";
}

// -----------------------------------------------------------------------------
// Pure parsing / validation functions (no I/O, so they can be unit-tested)
// -----------------------------------------------------------------------------

/** True if the text is empty or contains only whitespace. */
bool isBlank(const std::string& text) {
    return trim(text).empty();
}

/**
 * Strictly parses a decimal number.
 * Accepts: optional sign, digits, at most one '.', surrounding whitespace.
 * Rejects: "abc", "3.5abc", "1e3", "nan", "inf", "3.5.1", "", "12,000".
 * Returns true and stores the value in `value` only on success.
 */
bool parseStrictDouble(const std::string& rawText, double& value) {
    const std::string text = trim(rawText);
    if (text.empty()) {
        return false;
    }

    std::size_t start = 0;
    if (text[0] == '+' || text[0] == '-') {
        start = 1;
    }

    bool sawDigit = false;
    bool sawDot = false;
    for (std::size_t i = start; i < text.size(); ++i) {
        const unsigned char ch = static_cast<unsigned char>(text[i]);
        if (std::isdigit(ch)) {
            sawDigit = true;
        } else if (ch == '.' && !sawDot) {
            sawDot = true;
        } else {
            return false;  // letters, commas, second dot, symbols, ...
        }
    }
    if (!sawDigit) {
        return false;  // "+", "-", "."
    }

    try {
        std::size_t used = 0;
        const double parsed = std::stod(text, &used);
        if (used != text.size() || !std::isfinite(parsed)) {
            return false;
        }
        value = parsed;
        return true;
    } catch (const std::exception&) {
        return false;  // out_of_range for absurdly long digit strings
    }
}

/** Parses a non-negative whole number made only of digits (used for the menu). */
bool parseMenuChoice(const std::string& rawText, int& choice) {
    const std::string text = trim(rawText);
    constexpr std::size_t kMaxDigits = 6;
    if (text.empty() || text.size() > kMaxDigits) {
        return false;
    }
    for (const char ch : text) {
        if (!std::isdigit(static_cast<unsigned char>(ch))) {
            return false;
        }
    }
    choice = std::stoi(text);
    return true;
}

/** Inclusive range check. */
bool isInRange(double value, double minValue, double maxValue) {
    return value >= minValue && value <= maxValue;
}

// -----------------------------------------------------------------------------
// Console input functions (each re-prompts until the input is valid)
// -----------------------------------------------------------------------------

/**
 * Reads one full line from standard input. Because whole lines are consumed,
 * the stream never stays in a failed state after bad input.
 * @throws InputClosedError if input ends (EOF).
 */
std::string readLine(const std::string& prompt) {
    std::cout << prompt;
    std::string line;
    if (!std::getline(std::cin, line)) {
        throw InputClosedError{};
    }
    return line;
}

/** Reads a non-empty name (spaces and punctuation allowed; whitespace-only rejected). */
std::string readNonEmptyName() {
    while (true) {
        const std::string line = readLine("Full name: ");
        if (isBlank(line)) {
            std::cout << "  [Error] Name cannot be empty or only spaces. Please try again.\n";
            continue;
        }
        return trim(line);
    }
}

/**
 * Reads a number within [minValue, maxValue]. Invalid input (non-numeric,
 * malformed, extra characters, out of range) is rejected and re-prompted;
 * nothing is silently replaced by a default.
 * @param rangeHint Text describing the accepted values, shown in error messages.
 */
double readValidatedDouble(const std::string& prompt, double minValue, double maxValue,
                           const std::string& rangeHint) {
    while (true) {
        const std::string line = readLine(prompt);
        double value = 0.0;
        if (!parseStrictDouble(line, value)) {
            std::cout << "  [Error] \"" << trim(line) << "\" is not a valid number. Enter "
                      << rangeHint << ".\n";
            continue;
        }
        if (!isInRange(value, minValue, maxValue)) {
            std::cout << "  [Error] Value out of range. Enter " << rangeHint << ".\n";
            continue;
        }
        return value;
    }
}

/** Reads a yes/no answer; accepts y, yes, n, no (any case). */
bool readYesNo(const std::string& prompt) {
    while (true) {
        std::string answer = trim(readLine(prompt));
        for (char& ch : answer) {
            ch = static_cast<char>(std::tolower(static_cast<unsigned char>(ch)));
        }
        if (answer == "y" || answer == "yes") {
            return true;
        }
        if (answer == "n" || answer == "no") {
            return false;
        }
        std::cout << "  [Error] Please answer with 'y' or 'n'.\n";
    }
}

/** Reads and validates a menu option. */
int readMenuChoice() {
    while (true) {
        const std::string line = readLine("Enter your choice (1-2): ");
        int choice = 0;
        if (parseMenuChoice(line, choice) &&
            isInRange(choice, config::kMenuCheckStudent, config::kMenuExit)) {
            return choice;
        }
        std::cout << "  [Error] Please enter 1 or 2.\n";
    }
}

/** Collects and validates all details for one student. */
Student inputStudentDetails() {
    Student student;
    student.name = readNonEmptyName();
    student.cgpa = readValidatedDouble("CGPA (0.0 - 4.0): ", config::kMinCgpa, config::kMaxCgpa,
                                       "a number from 0.0 to 4.0");
    student.attendance =
        readValidatedDouble("Attendance % (0 - 100): ", config::kMinAttendance,
                            config::kMaxAttendance, "a number from 0 to 100");
    student.income = readValidatedDouble(
        "Monthly household income in PKR (Rs.): ", config::kMinIncome,
        std::numeric_limits<double>::max(), "a non-negative amount in rupees, digits only");
    return student;
}

// -----------------------------------------------------------------------------
// Business logic: eligibility rules (no input/output here)
// -----------------------------------------------------------------------------

/** Merit: CGPA >= 3.7 AND attendance >= 85. Both thresholds are inclusive. */
bool checkMeritEligibility(const Student& student) {
    return student.cgpa >= config::kMeritMinCgpa &&
           student.attendance >= config::kMeritMinAttendance;
}

/** Academic: CGPA >= 3.3 AND attendance >= 80. Both thresholds are inclusive. */
bool checkAcademicEligibility(const Student& student) {
    return student.cgpa >= config::kAcademicMinCgpa &&
           student.attendance >= config::kAcademicMinAttendance;
}

/**
 * Need-Based: income < 50,000 AND CGPA >= 2.8 AND attendance >= 75.
 * Income is STRICT: exactly Rs. 50,000 does NOT qualify. CGPA and attendance
 * are inclusive.
 */
bool checkNeedBasedEligibility(const Student& student) {
    return student.income < config::kNeedMaxIncome && student.cgpa >= config::kNeedMinCgpa &&
           student.attendance >= config::kNeedMinAttendance;
}

/**
 * Evaluates all three categories independently.
 * Deliberately NOT an if / else-if chain: an else-if would stop after the first
 * match, but a student may qualify for several scholarships at once (e.g. a
 * 3.8 CGPA student with low income qualifies for all three). Each category is
 * therefore tested with its own separate `if`.
 */
EligibilityResult evaluateScholarships(const Student& student) {
    EligibilityResult result;
    if (checkMeritEligibility(student)) {
        result.merit = true;
    }
    if (checkAcademicEligibility(student)) {
        result.academic = true;
    }
    if (checkNeedBasedEligibility(student)) {
        result.needBased = true;
    }
    return result;
}

/**
 * OPTIONAL BONUS - Illustrative Performance Score (%).
 * Custom formula: (CGPA / 4.0) * 70 + (Attendance / 100.0) * 30.
 * It is NOT official university policy, it is NOT a scholarship amount, and it
 * never influences the eligibility decisions above. For validated inputs the
 * result always lies between 0 and 100.
 */
double calculateScholarshipPercentage(double cgpa, double attendance) {
    return (cgpa / config::kMaxCgpa) * config::kScoreCgpaWeight +
           (attendance / config::kMaxAttendance) * config::kScoreAttendanceWeight;
}

// -----------------------------------------------------------------------------
// Explanations: one reason per UNMET requirement (never just the first)
// -----------------------------------------------------------------------------

/** Appends a "CGPA is X; minimum required is Y." reason when CGPA is too low. */
void addCgpaReason(std::vector<std::string>& reasons, const Student& student, double minCgpa) {
    if (student.cgpa < minCgpa) {
        reasons.push_back("CGPA is " + formatFixed(student.cgpa, 2) + "; minimum required is " +
                          formatFixed(minCgpa, 2) + ".");
    }
}

/** Appends an attendance reason when attendance is too low. */
void addAttendanceReason(std::vector<std::string>& reasons, const Student& student,
                         double minAttendance) {
    if (student.attendance < minAttendance) {
        reasons.push_back("attendance is " + formatPercent(student.attendance) +
                          "; minimum required is " + formatPercent(minAttendance) + ".");
    }
}

std::vector<std::string> explainMeritIneligibility(const Student& student) {
    std::vector<std::string> reasons;
    addCgpaReason(reasons, student, config::kMeritMinCgpa);
    addAttendanceReason(reasons, student, config::kMeritMinAttendance);
    return reasons;
}

std::vector<std::string> explainAcademicIneligibility(const Student& student) {
    std::vector<std::string> reasons;
    addCgpaReason(reasons, student, config::kAcademicMinCgpa);
    addAttendanceReason(reasons, student, config::kAcademicMinAttendance);
    return reasons;
}

std::vector<std::string> explainNeedBasedIneligibility(const Student& student) {
    std::vector<std::string> reasons;
    // Strict comparison: an income equal to the limit also fails this condition.
    if (!(student.income < config::kNeedMaxIncome)) {
        reasons.push_back("monthly household income is " + formatMoney(student.income) +
                          "; it must be strictly less than " + formatMoney(config::kNeedMaxIncome) +
                          ".");
    }
    addCgpaReason(reasons, student, config::kNeedMinCgpa);
    addAttendanceReason(reasons, student, config::kNeedMinAttendance);
    return reasons;
}

// -----------------------------------------------------------------------------
// Reporting
// -----------------------------------------------------------------------------

void displayWelcomeScreen() {
    printLine('=');
    std::cout << "        UNIVERSITY SCHOLARSHIP ELIGIBILITY CHECKER\n";
    printLine('=');
    std::cout << " A console tool that screens a student against three scholarship\n"
              << " categories (Merit, Academic, Need-Based), explains every decision,\n"
              << " and prints a report. Currency: Pakistani Rupees (Rs.).\n";
    printLine('=');
}

void displayMenu() {
    std::cout << "\nMAIN MENU\n";
    printLine('-');
    std::cout << "  1. Check a new student\n"
              << "  2. Exit\n";
    printLine('-');
}

std::string statusText(bool eligible) {
    return eligible ? "ELIGIBLE" : "NOT ELIGIBLE";
}

/** Prints the detail line(s) for one category: a success line or one line per unmet rule. */
void printCategoryDetails(const std::string& title, bool eligible, const std::string& satisfiedText,
                          const std::vector<std::string>& reasons) {
    if (eligible) {
        std::cout << " " << title << ": Eligible - " << satisfiedText << "\n";
        return;
    }
    for (const std::string& reason : reasons) {
        std::cout << " " << title << ": Ineligible - " << reason << "\n";
    }
}

/** Prints the full report for one student. Uses the result computed by the logic layer. */
void displayStudentReport(const Student& student, const EligibilityResult& result) {
    std::cout << "\n";
    printLine('=');
    std::cout << " STUDENT ELIGIBILITY REPORT\n";
    printLine('=');
    std::cout << std::left;
    std::cout << " " << std::setw(24) << "Name" << ": " << student.name << "\n";
    std::cout << " " << std::setw(24) << "CGPA" << ": " << formatFixed(student.cgpa, 2) << "\n";
    std::cout << " " << std::setw(24) << "Attendance" << ": " << formatPercent(student.attendance)
              << "\n";
    std::cout << " " << std::setw(24) << "Monthly Family Income" << ": "
              << formatMoney(student.income) << "\n";
    printLine('-');

    std::cout << " SCHOLARSHIP STATUS\n";
    std::cout << " " << std::setw(24) << "Merit Scholarship" << ": " << statusText(result.merit)
              << "\n";
    std::cout << " " << std::setw(24) << "Academic Scholarship" << ": "
              << statusText(result.academic) << "\n";
    std::cout << " " << std::setw(24) << "Need-Based Scholarship" << ": "
              << statusText(result.needBased) << "\n";
    printLine('-');

    std::cout << " DETAILS\n";
    printCategoryDetails(
        "Merit Scholarship", result.merit,
        "all defined conditions are satisfied (CGPA >= " + formatTrimmed(config::kMeritMinCgpa, 2) +
            ", attendance >= " + formatPercent(config::kMeritMinAttendance) + ").",
        explainMeritIneligibility(student));
    printCategoryDetails(
        "Academic Scholarship", result.academic,
        "all defined conditions are satisfied (CGPA >= " +
            formatTrimmed(config::kAcademicMinCgpa, 2) +
            ", attendance >= " + formatPercent(config::kAcademicMinAttendance) + ").",
        explainAcademicIneligibility(student));
    printCategoryDetails(
        "Need-Based Scholarship", result.needBased,
        "all defined conditions are satisfied (income < " + formatMoney(config::kNeedMaxIncome) +
            ", CGPA >= " + formatTrimmed(config::kNeedMinCgpa, 2) +
            ", attendance >= " + formatPercent(config::kNeedMinAttendance) + ").",
        explainNeedBasedIneligibility(student));
    printLine('-');

    // Overall outcome.
    if (result.count() == 0) {
        std::cout << " Overall: Currently ineligible for all listed scholarships.\n";
    } else {
        std::string list;
        if (result.merit) {
            list += "Merit";
        }
        if (result.academic) {
            list += (list.empty() ? "" : ", ");
            list += "Academic";
        }
        if (result.needBased) {
            list += (list.empty() ? "" : ", ");
            list += "Need-Based";
        }
        std::cout << " Eligible scholarships: " << list << "\n";
    }
    std::cout << " Total eligible categories: " << result.count() << " of 3\n";
    std::cout << " (Eligibility only; actual awards and funding are not guaranteed.)\n";
    printLine('-');

    // Optional bonus feature, shown separately; it never affects eligibility.
    std::cout << " Illustrative Performance Score (%): "
              << formatFixed(calculateScholarshipPercentage(student.cgpa, student.attendance), 2)
              << "\n";
    std::cout << " Note: custom illustrative formula, not official university policy.\n";
    printLine('=');
}

/** Adds one student's outcome to the running totals. */
void updateSummary(SessionSummary& summary, const EligibilityResult& result) {
    ++summary.studentsProcessed;
    if (result.merit) {
        ++summary.meritCount;
    }
    if (result.academic) {
        ++summary.academicCount;
    }
    if (result.needBased) {
        ++summary.needBasedCount;
    }
    if (result.count() == 0) {
        ++summary.noScholarshipCount;
    }
}

/** Prints the concise end-of-session summary. */
void displaySummary(const SessionSummary& summary) {
    std::cout << "\n";
    printLine('=');
    std::cout << " SESSION SUMMARY\n";
    printLine('=');
    std::cout << std::left;
    std::cout << " " << std::setw(34) << "Students processed" << ": " << summary.studentsProcessed
              << "\n";
    std::cout << " " << std::setw(34) << "Eligible for Merit" << ": " << summary.meritCount << "\n";
    std::cout << " " << std::setw(34) << "Eligible for Academic" << ": " << summary.academicCount
              << "\n";
    std::cout << " " << std::setw(34) << "Eligible for Need-Based" << ": "
              << summary.needBasedCount << "\n";
    std::cout << " " << std::setw(34) << "Eligible for no scholarship" << ": "
              << summary.noScholarshipCount << "\n";
    printLine('=');
}

/** Repeatedly checks students until the user says no. One loop, no duplicated code. */
void processMultipleStudents(SessionSummary& summary) {
    bool another = true;
    while (another) {
        std::cout << "\nENTER STUDENT DETAILS\n";
        printLine('-');
        const Student student = inputStudentDetails();
        const EligibilityResult result = evaluateScholarships(student);
        displayStudentReport(student, result);
        updateSummary(summary, result);
        another = readYesNo("\nEvaluate another student? (y/n): ");
    }
}

// -----------------------------------------------------------------------------
// Entry point
// -----------------------------------------------------------------------------

int main() {
    SessionSummary summary;
    try {
        displayWelcomeScreen();
        bool running = true;
        while (running) {
            displayMenu();
            switch (readMenuChoice()) {
                case config::kMenuCheckStudent:
                    processMultipleStudents(summary);
                    break;
                default:  // config::kMenuExit (readMenuChoice only returns 1-2)
                    running = false;
                    break;
            }
        }
    } catch (const InputClosedError&) {
        std::cout << "\n\nInput stream closed. Exiting.\n";
    }
    displaySummary(summary);
    std::cout << "Thank you for using the University Scholarship Eligibility Checker.\n";
    return 0;
}