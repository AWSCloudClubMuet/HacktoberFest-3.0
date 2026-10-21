
#include <iostream>
#include <string>
#include <cmath>
using namespace std;

class Parking {
private:
    string registration_number;

public:
    string vehicle_type;
    double duration;
    char staff;
    Parking(string registration_number, string vehicle_type, double duration,char staff = 'n') {
        this->registration_number = registration_number;
        this->vehicle_type = vehicle_type;
        this->duration = duration;
        this->staff = staff;
    }

    void calculateParkingFee() {
        int billedHours = ceil(duration);
        double rate = 0;

        if (vehicle_type == "car") {
            rate = 50;
        }
        else if (vehicle_type == "bike") {
            rate = 30;
        }
        else if (vehicle_type == "van") {
            rate = 80;
        }

        double originalFee = billedHours * rate;
        double discountRate = 0;

        if (billedHours > 10) {
            discountRate = 0.20;
        }
        else if (billedHours > 5) {
            discountRate = 0.10;
        }

        if (staff == 'y' || staff == 'Y') {
        discountRate += 0.05;
        }


        double discountAmount = originalFee * discountRate;
        double finalAmount = originalFee - discountAmount;

        cout << "\n--- Parking Bill ---\n";
        cout << "Registration Number: " << registration_number << endl;
        cout << "Vehicle Type: " << vehicle_type << endl;
        cout << "Actual Duration: " << duration << " hours\n";
        cout << "Billed Hours: " << billedHours << endl;
        cout << "Original Fee: Rs. " << originalFee << endl;
        cout << "Discount: " << discountRate * 100 << "%\n";
        cout << "Discount Amount: Rs. " << discountAmount << endl; 
        cout << "Final Payable Amount: Rs. " << finalAmount << endl;
    }
};

void runParkingSystem() {
    string registration_number;
    string vehicle_type;
    double duration;
    char ch,staff;

    do {
        do {
            cout << "\nEnter registration number: ";
             getline(cin, registration_number);

          if (registration_number.empty()) {
            cout << "Error: Registration number cannot be empty!\n";
         }

} while (registration_number.empty());
   
do
{
    cout << "Enter vehicle type (car/bike/van): ";
        cin >> vehicle_type;
if (vehicle_type != "car" &&  vehicle_type != "bike" && vehicle_type != "van") {
            cout << "Error: Unsupported vehicle type.\n";
        }
} while (vehicle_type != "car" && vehicle_type != "bike" && vehicle_type != "van");

        do
        {
            cout << "Enter parking duration in hours: ";
        cin >> duration;

         if (duration <= 0) {
            cout << "Error: Duration must be positive.\n";
        }
        } while (duration <= 0);
        
            cout << "Is the vehicle owner a staff member? (y/n): ";
            cin >> staff;
            Parking c1(registration_number, vehicle_type, duration, staff);
            c1.calculateParkingFee();

        cout << "\nDo you want to continue (y/n)? ";
        cin >> ch;
        cin.ignore();

    } while (ch != 'n' && ch != 'N');
}

int main() {
    
    runParkingSystem();

    return 0;
}