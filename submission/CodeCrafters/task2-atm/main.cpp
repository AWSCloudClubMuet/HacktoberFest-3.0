// =============================================================================
//  Smart ATM Transaction Simulator
//  A menu-driven, terminal-based ATM simulation written in standard C++17.
//
//  EDUCATIONAL PROTOTYPE ONLY.
//  - All account data, names and numbers are fictional demonstration data.
//  - The PIN below is hardcoded so the project is easy to demonstrate. A real
//    bank NEVER stores or compares a plain-text PIN like this; real systems use
//    hardware security modules, salted hashes and server-side verification.
//
//  MONEY POLICY
//  - All money is stored as a whole number of Pakistani rupees in a 64-bit
//    signed integer (Money). Floating-point types are never used for money
//    because they cannot represent most decimal values exactly.
//  - Paisa (decimal) amounts are rejected. This ATM handles whole rupees only.
//
//  PROGRAM LAYOUT (top to bottom)
//    1. Configuration constants      5. Pure business rules (no input/output)
//    2. Data structures              6. Transaction commit (the only code that
//    3. Formatting helpers              changes the balance)
//    4. Input parsing and reading    7. Screens, authentication, menu, main()
// =============================================================================

#include <algorithm>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <limits>
#include <string>
#include <vector>

// -----------------------------------------------------------------------------
// 1. CONFIGURATION  (edit these values to change the demonstration)
// -----------------------------------------------------------------------------
using Money = std::int64_t;  // whole rupees

namespace config {

constexpr const char* kBankName = "CodeCrafters BANK";

// Demonstration credentials. Hardcoded on purpose - see the disclaimer above.
constexpr const char* kDemoPin = "1234";
constexpr std::size_t kPinLength = 4;
constexpr int kMaxPinAttempts = 3;

constexpr Money kInitialBalance = 30000;
// Largest balance the application supports (Rs. 100 million). Deposits that
// would push the balance above this are rejected.
constexpr Money kMaxBalance = 100000000;

constexpr Money kMaxWithdrawalPerTransaction = 25000;
constexpr Money kFeeThreshold = 10000;  // fee applies when amount is STRICTLY above this
constexpr Money kWithdrawalFee = 50;

// Optional "daily" limit. It is a SESSION limit: it counts withdrawal AMOUNTS
// only (fees are not counted) and resets whenever the program restarts.
constexpr Money kSessionWithdrawalLimit = 50000;

constexpr int kLineWidth = 72;
constexpr int kMenuMin = 1;
constexpr int kMenuMax = 6;

// Fictional demonstration account details.
constexpr const char* kHolderName = "CodeCrafters";
constexpr const char* kMaskedAccountNumber = "XXXX-XXXX-4821";
constexpr const char* kAccountType = "Savings";

static_assert(kInitialBalance >= 0 && kInitialBalance <= kMaxBalance,
              "The initial balance must be inside the supported range");
static_assert(kWithdrawalFee >= 0, "The withdrawal fee cannot be negative");

}  // namespace config

// -----------------------------------------------------------------------------
// 2. DATA STRUCTURES
// -----------------------------------------------------------------------------
enum class TransactionType { Deposit, Withdrawal };

// One COMPLETED financial transaction. The receipt, the history list and the
// session summary all read from this same record, so they cannot disagree.
struct Transaction {
    int number = 0;
    TransactionType type = TransactionType::Deposit;
    Money amount = 0;         // requested amount
    Money fee = 0;            // fee charged (always 0 for deposits)
    Money total = 0;          // amount credited (deposit) or amount + fee debited (withdrawal)
    Money balanceBefore = 0;
    Money balanceAfter = 0;
};

// Account data only. Credentials are deliberately NOT stored here, which keeps
// authentication separate from transaction logic.
struct Account {
    std::string holderName;
    std::string maskedNumber;
    std::string type;
    Money balance = 0;
};

// Everything that lives for the duration of one program run.
struct AtmSession {
    Account account;
    Money openingBalance = 0;
    Money withdrawnThisSession = 0;  // successful withdrawal amounts, fees excluded
    std::vector<Transaction> history;  // completed transactions, oldest first
};

enum class InputStatus { Ok, EndOfInput, Empty, NotANumber, DecimalNotAllowed, TooLarge };

struct ParsedNumber {
    InputStatus status = InputStatus::Ok;
    Money value = 0;
};

enum class DepositCheck { Ok, NotPositive, ExceedsMaxBalance };

enum class WithdrawalCheck {
    Ok,
    NotPositive,
    ExceedsPerTransactionLimit,
    ExceedsSessionLimit,
    InsufficientFunds
};

// The result of evaluating a proposed withdrawal WITHOUT changing anything.
struct WithdrawalQuote {
    WithdrawalCheck status = WithdrawalCheck::Ok;
    Money amount = 0;
    Money fee = 0;
    Money totalDeduction = 0;
    Money balanceAfter = 0;
};

enum class AuthResult { Authenticated, Denied, InputEnded };

// -----------------------------------------------------------------------------
// 3. FORMATTING HELPERS
// -----------------------------------------------------------------------------

// Formats rupees with thousands separators, e.g. 30000 -> "Rs. 30,000".
std::string formatCurrency(Money amount) {
    const bool negative = amount < 0;
    // Work with an unsigned magnitude so negating the most negative value is safe.
    const std::uint64_t magnitude = negative ? 0 - static_cast<std::uint64_t>(amount)
                                             : static_cast<std::uint64_t>(amount);
    const std::string digits = std::to_string(magnitude);

    std::string grouped;
    std::size_t count = 0;
    for (auto it = digits.rbegin(); it != digits.rend(); ++it) {
        if (count > 0 && count % 3 == 0) {
            grouped.push_back(',');
        }
        grouped.push_back(*it);
        ++count;
    }
    std::reverse(grouped.begin(), grouped.end());
    return std::string(negative ? "-Rs. " : "Rs. ") + grouped;
}

// Formats a session transaction number as "TXN-0001".
std::string formatTransactionNumber(int number) {
    std::string text = std::to_string(number);
    while (text.size() < 4) {
        text.insert(text.begin(), '0');
    }
    return "TXN-" + text;
}

const char* transactionTypeName(TransactionType type) {
    return type == TransactionType::Deposit ? "Deposit" : "Withdrawal";
}

void printSeparator(char symbol) {
    std::cout << std::string(static_cast<std::size_t>(config::kLineWidth), symbol) << '\n';
}

void printCentered(const std::string& text) {
    const std::size_t width = static_cast<std::size_t>(config::kLineWidth);
    const std::size_t padding = text.size() < width ? (width - text.size()) / 2 : 0;
    std::cout << std::string(padding, ' ') << text << '\n';
}

void printHeading(const std::string& title) {
    printSeparator('=');
    printCentered(title);
    printSeparator('=');
}

// One aligned "Label : value" line, used by receipts and information screens.
void printRow(const std::string& label, const std::string& value) {
    std::cout << "  " << std::left << std::setw(26) << label << ": " << value << '\n';
}

void printSuccess(const std::string& message) { std::cout << "[SUCCESS] " << message << '\n'; }
void printWarning(const std::string& message) { std::cout << "[WARNING] " << message << '\n'; }
void printError(const std::string& message) { std::cout << "[ERROR]   " << message << '\n'; }
void printInfo(const std::string& message) { std::cout << "[INFO]    " << message << '\n'; }

// -----------------------------------------------------------------------------
// 4. INPUT PARSING AND READING
//    Every number typed by the user goes through parseWholeNumber() first.
//    Reading whole lines (std::getline) and parsing them ourselves means a bad
//    entry such as "abc" can never leave std::cin in a failed state.
// -----------------------------------------------------------------------------

// Removes leading and trailing spaces, tabs and line-ending characters.
std::string trim(const std::string& text) {
    const char* whitespace = " \t\r\n";
    const std::size_t first = text.find_first_not_of(whitespace);
    if (first == std::string::npos) {
        return "";
    }
    const std::size_t last = text.find_last_not_of(whitespace);
    return text.substr(first, last - first + 1);
}

// Converts text to a whole number without throwing and without overflow.
// Accepts an optional leading + or -, then digits only. A negative number is
// parsed successfully (value < 0); the business rules decide to reject it.
ParsedNumber parseWholeNumber(const std::string& rawText) {
    const std::string text = trim(rawText);
    if (text.empty()) {
        return {InputStatus::Empty, 0};
    }

    std::size_t position = 0;
    bool negative = false;
    if (text[0] == '+' || text[0] == '-') {
        negative = (text[0] == '-');
        position = 1;
    }

    // Pass 1: make sure the text is made of digits (and at most one '.').
    std::size_t digitCount = 0;
    std::size_t dotCount = 0;
    for (std::size_t i = position; i < text.size(); ++i) {
        if (text[i] >= '0' && text[i] <= '9') {
            ++digitCount;
        } else if (text[i] == '.') {
            ++dotCount;
        } else {
            return {InputStatus::NotANumber, 0};
        }
    }
    if (digitCount == 0 || dotCount > 1) {
        return {InputStatus::NotANumber, 0};
    }
    if (dotCount == 1) {
        return {InputStatus::DecimalNotAllowed, 0};
    }

    // Pass 2: build the value one digit at a time, stopping before overflow.
    constexpr Money kMaxValue = std::numeric_limits<Money>::max();
    Money value = 0;
    for (std::size_t i = position; i < text.size(); ++i) {
        const Money digit = text[i] - '0';
        if (value > (kMaxValue - digit) / 10) {
            return {InputStatus::TooLarge, 0};
        }
        value = value * 10 + digit;
    }
    return {InputStatus::Ok, negative ? -value : value};
}

// Reads one line from standard input. Returns false at end-of-file or if the
// input stream is unusable, so callers can stop instead of looping forever.
bool readLine(std::string& line) {
    return static_cast<bool>(std::getline(std::cin, line));
}

// Shows a prompt, reads a line and parses it as a whole number.
InputStatus readWholeNumber(const std::string& prompt, Money& value) {
    std::cout << prompt;
    std::string line;
    if (!readLine(line)) {
        return InputStatus::EndOfInput;
    }
    const ParsedNumber parsed = parseWholeNumber(line);
    if (parsed.status == InputStatus::Ok) {
        value = parsed.value;
    }
    return parsed.status;
}

std::string describeInputProblem(InputStatus status) {
    switch (status) {
        case InputStatus::Empty:
            return "No amount was entered. Please type a whole number of rupees.";
        case InputStatus::NotANumber:
            return "Invalid amount. Use digits only (no letters, commas or symbols).";
        case InputStatus::DecimalNotAllowed:
            return "Decimal amounts are not supported. This ATM handles whole rupees only.";
        case InputStatus::TooLarge:
            return "The number entered is too large to process.";
        case InputStatus::Ok:
        case InputStatus::EndOfInput:
            break;
    }
    return "Invalid input.";
}

// -----------------------------------------------------------------------------
// 5. PURE BUSINESS RULES  (no input, no output, no state changes)
//    Because these functions only calculate, they are easy to unit test and the
//    same rules are used for the balance, the receipt and the history.
// -----------------------------------------------------------------------------

// Rs. 50 fee only when the amount is STRICTLY greater than Rs. 10,000.
Money calculateWithdrawalFee(Money amount) {
    return amount > config::kFeeThreshold ? config::kWithdrawalFee : 0;
}

Money remainingSessionAllowance(Money withdrawnThisSession) {
    return config::kSessionWithdrawalLimit - withdrawnThisSession;
}

// The subtraction form (amount > max - balance) avoids ever computing a sum
// that could overflow. balance is always within 0..kMaxBalance.
DepositCheck validateDeposit(Money balance, Money amount) {
    if (amount <= 0) {
        return DepositCheck::NotPositive;
    }
    if (amount > config::kMaxBalance - balance) {
        return DepositCheck::ExceedsMaxBalance;
    }
    return DepositCheck::Ok;
}

// Evaluates a withdrawal and reports the first rule it breaks, or Ok.
// The checks run in this order so that later arithmetic is always safe:
//   positive -> per-withdrawal limit -> session limit -> funds (amount + fee).
WithdrawalQuote quoteWithdrawal(Money balance, Money withdrawnThisSession, Money amount) {
    WithdrawalQuote quote;
    quote.amount = amount;
    quote.balanceAfter = balance;  // unchanged unless the withdrawal is approved

    if (amount <= 0) {
        quote.status = WithdrawalCheck::NotPositive;
        return quote;
    }
    if (amount > config::kMaxWithdrawalPerTransaction) {
        quote.status = WithdrawalCheck::ExceedsPerTransactionLimit;
        return quote;
    }
    if (amount > remainingSessionAllowance(withdrawnThisSession)) {
        quote.status = WithdrawalCheck::ExceedsSessionLimit;
        return quote;
    }

    // amount <= 25,000 here, so adding the fee cannot overflow.
    quote.fee = calculateWithdrawalFee(amount);
    quote.totalDeduction = amount + quote.fee;
    if (quote.totalDeduction > balance) {
        quote.status = WithdrawalCheck::InsufficientFunds;
        return quote;
    }

    quote.balanceAfter = balance - quote.totalDeduction;
    quote.status = WithdrawalCheck::Ok;
    return quote;
}

// -----------------------------------------------------------------------------
// 6. TRANSACTION COMMIT
//    These two functions are the ONLY place where the balance is changed.
//    They are called only after validation has passed. The record is added to
//    the history first (the only step that could throw, e.g. out of memory);
//    the remaining updates are plain integer assignments that cannot fail.
//    So the withdrawal and its fee are applied together, or not at all.
// -----------------------------------------------------------------------------
AtmSession createSession(Money initialBalance) {
    AtmSession session;
    session.account.holderName = config::kHolderName;
    session.account.maskedNumber = config::kMaskedAccountNumber;
    session.account.type = config::kAccountType;
    session.account.balance = initialBalance;
    session.openingBalance = initialBalance;
    return session;
}

// Precondition: validateDeposit(...) returned DepositCheck::Ok.
Transaction commitDeposit(AtmSession& session, Money amount) {
    Transaction record;
    record.number = static_cast<int>(session.history.size()) + 1;
    record.type = TransactionType::Deposit;
    record.amount = amount;
    record.fee = 0;
    record.total = amount;
    record.balanceBefore = session.account.balance;
    record.balanceAfter = record.balanceBefore + amount;

    session.history.push_back(record);
    session.account.balance = record.balanceAfter;
    return record;
}

// Precondition: quote.status == WithdrawalCheck::Ok for the CURRENT balance.
Transaction commitWithdrawal(AtmSession& session, const WithdrawalQuote& quote) {
    Transaction record;
    record.number = static_cast<int>(session.history.size()) + 1;
    record.type = TransactionType::Withdrawal;
    record.amount = quote.amount;
    record.fee = quote.fee;
    record.total = quote.totalDeduction;
    record.balanceBefore = session.account.balance;
    record.balanceAfter = quote.balanceAfter;

    session.history.push_back(record);
    session.account.balance = record.balanceAfter;
    session.withdrawnThisSession += quote.amount;  // amount only; the fee is not counted
    return record;
}

// -----------------------------------------------------------------------------
// 7. SCREENS, AUTHENTICATION, MENU AND MAIN
// -----------------------------------------------------------------------------
void displayWelcomeScreen() {
    printHeading(std::string(config::kBankName) + " - ATM");
    printCentered("Smart ATM Transaction Simulator");
    printCentered("Educational simulation. All data is fictional.");
    printSeparator('-');
    printRow("Maximum PIN attempts", std::to_string(config::kMaxPinAttempts));
    printSeparator('=');
}

// A PIN is exactly four digits (kPinLength).
bool isValidPinFormat(const std::string& pin) {
    if (pin.size() != config::kPinLength) {
        return false;
    }
    return std::all_of(pin.begin(), pin.end(), [](char c) { return c >= '0' && c <= '9'; });
}

// Gives the user at most kMaxPinAttempts tries. It never prints the PIN that
// was typed, and it knows nothing about balances or transactions.
AuthResult authenticateUser(const std::string& correctPin) {
    printHeading("AUTHENTICATION");
    for (int attempt = 1; attempt <= config::kMaxPinAttempts; ++attempt) {
        std::cout << "Enter your " << config::kPinLength << "-digit PIN: ";
        std::string enteredPin;
        if (!readLine(enteredPin)) {
            std::cout << '\n';
            printError("Input ended before authentication was completed.");
            return AuthResult::InputEnded;
        }
        enteredPin = trim(enteredPin);

        if (isValidPinFormat(enteredPin) && enteredPin == correctPin) {
            printSuccess("PIN accepted. Welcome!");
            std::cout << '\n';
            return AuthResult::Authenticated;
        }

        // Wrong or malformed entries both count as one failed attempt.
        const int remaining = config::kMaxPinAttempts - attempt;
        if (!isValidPinFormat(enteredPin)) {
            printError("Invalid PIN format. A PIN is exactly " +
                       std::to_string(config::kPinLength) + " digits.");
        } else {
            printError("Incorrect PIN.");
        }
        if (remaining > 0) {
            printWarning("Attempts remaining: " + std::to_string(remaining));
        }
    }

    printSeparator('-');
    printError("Access denied. Maximum PIN attempts reached.");
    printInfo("For your security this session is now closed. No transactions are available.");
    printSeparator('-');
    return AuthResult::Denied;
}

void displayMenu() {
    printHeading("MAIN MENU");
    std::cout << "  1. Check Balance\n"
              << "  2. Deposit Money\n"
              << "  3. Withdraw Money\n"
              << "  4. Transaction History\n"
              << "  5. Account Information\n"
              << "  6. Exit\n";
    printSeparator('-');
}

void checkBalance(const AtmSession& session) {
    printHeading("BALANCE ENQUIRY");
    printRow("Available Balance", formatCurrency(session.account.balance));
    printSeparator('-');
}

void displayReceipt(const Transaction& record) {
    const bool isDeposit = (record.type == TransactionType::Deposit);
    printSeparator('=');
    printCentered("TRANSACTION RECEIPT");
    printCentered(std::string(config::kBankName) + " (Simulated)");
    printSeparator('-');
    printRow("Transaction No.", formatTransactionNumber(record.number));
    printRow("Transaction Type", transactionTypeName(record.type));
    printRow("Amount", formatCurrency(record.amount));
    printRow("Transaction Fee", formatCurrency(record.fee));
    printRow(isDeposit ? "Total Credited" : "Total Deducted", formatCurrency(record.total));
    printRow("Previous Balance", formatCurrency(record.balanceBefore));
    printRow("Updated Balance", formatCurrency(record.balanceAfter));
    printRow("Status", "COMPLETED");
    printSeparator('=');
}

// Returns false only when input has ended, so the caller can stop cleanly.
bool depositMoney(AtmSession& session) {
    printHeading("DEPOSIT MONEY");
    printInfo("Whole rupees only. Maximum balance: " + formatCurrency(config::kMaxBalance));

    Money amount = 0;
    const InputStatus status = readWholeNumber("Enter deposit amount: Rs. ", amount);
    if (status == InputStatus::EndOfInput) {
        return false;
    }
    if (status != InputStatus::Ok) {
        printError(describeInputProblem(status));
        printInfo("Deposit cancelled. Balance unchanged: " +
                  formatCurrency(session.account.balance));
        return true;
    }

    switch (validateDeposit(session.account.balance, amount)) {
        case DepositCheck::NotPositive:
            printError("Deposit amount must be greater than Rs. 0.");
            break;
        case DepositCheck::ExceedsMaxBalance:
            printError("This deposit would take the balance above the maximum of " +
                       formatCurrency(config::kMaxBalance) + ".");
            break;
        case DepositCheck::Ok: {
            const Transaction record = commitDeposit(session, amount);
            printSuccess("Deposit completed. Your new balance is " +
                         formatCurrency(record.balanceAfter) + ".");
            displayReceipt(record);
            return true;
        }
    }
    printInfo("Deposit rejected. Balance unchanged: " + formatCurrency(session.account.balance));
    return true;
}

std::string describeWithdrawalProblem(const WithdrawalQuote& quote, const AtmSession& session) {
    switch (quote.status) {
        case WithdrawalCheck::NotPositive:
            return "Withdrawal amount must be greater than Rs. 0.";
        case WithdrawalCheck::ExceedsPerTransactionLimit:
            return "Amount exceeds the per-withdrawal limit of " +
                   formatCurrency(config::kMaxWithdrawalPerTransaction) + ".";
        case WithdrawalCheck::ExceedsSessionLimit:
            return "Amount exceeds the session withdrawal limit. Remaining allowance: " +
                   formatCurrency(remainingSessionAllowance(session.withdrawnThisSession)) +
                   " of " + formatCurrency(config::kSessionWithdrawalLimit) + ".";
        case WithdrawalCheck::InsufficientFunds:
            return "Insufficient funds. This withdrawal needs " +
                   formatCurrency(quote.totalDeduction) + " (amount " +
                   formatCurrency(quote.amount) + " + fee " + formatCurrency(quote.fee) +
                   ") but your balance is " + formatCurrency(session.account.balance) + ".";
        case WithdrawalCheck::Ok:
            break;
    }
    return "Withdrawal could not be processed.";
}

// Returns false only when input has ended, so the caller can stop cleanly.
bool withdrawMoney(AtmSession& session) {
    printHeading("WITHDRAW MONEY");
    printInfo("Limit per withdrawal: " + formatCurrency(config::kMaxWithdrawalPerTransaction));
    printInfo("Fee: " + formatCurrency(config::kWithdrawalFee) + " for amounts above " +
              formatCurrency(config::kFeeThreshold));
    printInfo("Session withdrawal allowance left: " +
              formatCurrency(remainingSessionAllowance(session.withdrawnThisSession)));

    Money amount = 0;
    const InputStatus status = readWholeNumber("Enter withdrawal amount: Rs. ", amount);
    if (status == InputStatus::EndOfInput) {
        return false;
    }
    if (status != InputStatus::Ok) {
        printError(describeInputProblem(status));
        printInfo("Withdrawal cancelled. Balance unchanged: " +
                  formatCurrency(session.account.balance));
        return true;
    }

    // Validate first. Nothing below this line changes the balance unless the
    // quote is approved.
    const WithdrawalQuote quote =
        quoteWithdrawal(session.account.balance, session.withdrawnThisSession, amount);
    if (quote.status != WithdrawalCheck::Ok) {
        printError(describeWithdrawalProblem(quote, session));
        printInfo("Withdrawal rejected. Balance unchanged: " +
                  formatCurrency(session.account.balance));
        return true;
    }

    const Transaction record = commitWithdrawal(session, quote);
    printSuccess("Withdrawal completed. Please take your cash.");
    printRow("Withdrawal amount", formatCurrency(record.amount));
    printRow("Transaction fee", formatCurrency(record.fee));
    printRow("Updated balance", formatCurrency(record.balanceAfter));
    displayReceipt(record);
    return true;
}

void displayTransactionHistory(const AtmSession& session) {
    printHeading("TRANSACTION HISTORY");
    if (session.history.empty()) {
        printInfo("No transactions have been made in this session yet.");
        printSeparator('-');
        return;
    }

    std::cout << std::left << std::setw(6) << "No." << std::setw(12) << "Type" << std::right
              << std::setw(16) << "Amount" << std::setw(12) << "Fee" << std::setw(16)
              << "Balance After" << "  " << std::left << "Status" << '\n';
    printSeparator('-');
    for (const Transaction& record : session.history) {  // oldest first
        std::cout << std::left << std::setw(6) << record.number << std::setw(12)
                  << transactionTypeName(record.type) << std::right << std::setw(16)
                  << formatCurrency(record.amount) << std::setw(12)
                  << formatCurrency(record.fee) << std::setw(16)
                  << formatCurrency(record.balanceAfter) << "  " << std::left << "Completed"
                  << '\n';
    }
    printSeparator('-');
    printInfo("Only completed transactions are listed. Rejected attempts are not recorded.");
}

void displayAccountInformation(const AtmSession& session) {
    printHeading("ACCOUNT INFORMATION");
    printWarning("SIMULATED DEMONSTRATION DATA - not a real bank account.");
    printRow("Account Holder", session.account.holderName);
    printRow("Account Number", session.account.maskedNumber);
    printRow("Account Type", session.account.type);
    printRow("Current Balance", formatCurrency(session.account.balance));
    printRow("Per-Withdrawal Limit", formatCurrency(config::kMaxWithdrawalPerTransaction));
    printRow("Session Allowance Left", formatCurrency(remainingSessionAllowance(
                                           session.withdrawnThisSession)));
    printSeparator('-');
}

void displaySessionSummary(const AtmSession& session) {
    const auto deposits = std::count_if(
        session.history.begin(), session.history.end(),
        [](const Transaction& t) { return t.type == TransactionType::Deposit; });
    const auto withdrawals = std::count_if(
        session.history.begin(), session.history.end(),
        [](const Transaction& t) { return t.type == TransactionType::Withdrawal; });
    Money totalFees = 0;
    for (const Transaction& record : session.history) {
        totalFees += record.fee;
    }

    printHeading("SESSION SUMMARY");
    printRow("Opening Balance", formatCurrency(session.openingBalance));
    printRow("Successful Deposits", std::to_string(deposits));
    printRow("Successful Withdrawals", std::to_string(withdrawals));
    printRow("Completed Transactions", std::to_string(session.history.size()));
    printRow("Total Fees Charged", formatCurrency(totalFees));
    printRow("Final Balance", formatCurrency(session.account.balance));
    printSeparator('=');
    printCentered("Thank you for banking with " + std::string(config::kBankName) + ".");
    printCentered("Please take your card. Goodbye!");
    printSeparator('=');
}

// Shows the menu until the user exits or the input ends.
void runMenuLoop(AtmSession& session) {
    bool running = true;
    while (running) {
        displayMenu();
        Money choice = 0;
        const InputStatus status = readWholeNumber("Select an option (1-6): ", choice);

        if (status == InputStatus::EndOfInput) {
            std::cout << '\n';
            printWarning("Input ended unexpectedly. Closing the session safely.");
            return;
        }
        if (status != InputStatus::Ok || choice < config::kMenuMin || choice > config::kMenuMax) {
            printError("Invalid selection. Please enter a whole number from " +
                       std::to_string(config::kMenuMin) + " to " +
                       std::to_string(config::kMenuMax) + ".");
            std::cout << '\n';
            continue;  // back to the menu; the program does not terminate
        }

        bool inputEnded = false;
        switch (choice) {
            case 1:
                checkBalance(session);
                break;
            case 2:
                inputEnded = !depositMoney(session);
                break;
            case 3:
                inputEnded = !withdrawMoney(session);
                break;
            case 4:
                displayTransactionHistory(session);
                break;
            case 5:
                displayAccountInformation(session);
                break;
            default:  // 6 = Exit
                running = false;
                break;
        }
        if (inputEnded) {
            // Input vanished in the middle of a transaction prompt. Nothing was
            // committed for that transaction, so the session can close safely.
            std::cout << '\n';
            printWarning("Input ended unexpectedly. Closing the session safely.");
            return;
        }
        std::cout << '\n';
    }
}

// Runs one complete ATM session. Returns the process exit code:
//   0 = session completed (Exit chosen, or input ended after login)
//   1 = authentication failed or input ended before login
int runAtm(Money initialBalance) {
    AtmSession session = createSession(initialBalance);

    displayWelcomeScreen();
    if (authenticateUser(config::kDemoPin) != AuthResult::Authenticated) {
        return 1;  // no balance is shown and no transaction is possible
    }

    runMenuLoop(session);
    displaySessionSummary(session);
    return 0;
}

// Optional command-line argument: a starting balance, for demonstrations and
// testing, e.g.  smart_atm.exe 12030
bool parseStartingBalance(int argc, char* argv[], Money& balance) {
    balance = config::kInitialBalance;
    if (argc == 1) {
        return true;
    }
    if (argc > 2) {
        return false;
    }
    const ParsedNumber parsed = parseWholeNumber(argv[1]);
    if (parsed.status != InputStatus::Ok || parsed.value < 0 ||
        parsed.value > config::kMaxBalance) {
        return false;
    }
    balance = parsed.value;
    return true;
}

// The tests include this file with ATM_NO_MAIN defined so they can call the
// functions above without a second main().
#ifndef ATM_NO_MAIN
int main(int argc, char* argv[]) {
    Money initialBalance = 0;
    if (!parseStartingBalance(argc, argv, initialBalance)) {
        std::cerr << "Usage: " << argv[0] << " [starting balance 0-" << config::kMaxBalance
                  << "]\n";
        return 2;
    }
    return runAtm(initialBalance);
}
#endif