const Hospital = require('../models/Hospital');
const BloodBank = require('../models/BloodBank');
const BloodStock = require('../models/BloodStock');
const facilitiesData = require('../data/nepal-facilities.json');

/**
 * Seeds the database with default hospitals and blood banks from Nepal
 * Only seeds if the collections are empty or specific facilities don't exist
 */
async function seedFacilities() {
    try {
        console.log('🏥 Checking for default facilities...');

        // Seed Hospitals
        const hospitalCount = await Hospital.countDocuments();
        console.log(`Found ${hospitalCount} hospitals in database`);

        if (hospitalCount === 0) {
            console.log('🏥 Seeding default hospitals...');
            for (const hospitalData of facilitiesData.hospitals) {
                try {
                    const hospital = new Hospital(hospitalData);
                    await hospital.save();
                    console.log(`✓ Added hospital: ${hospitalData.hospitalName}`);
                } catch (error) {
                    console.log(`⚠ Skipped ${hospitalData.hospitalName}: ${error.message}`);
                }
            }
            console.log(`✓ Seeded ${facilitiesData.hospitals.length} hospitals`);
        } else {
            // Check for missing hospitals and add them
            let addedCount = 0;
            for (const hospitalData of facilitiesData.hospitals) {
                const exists = await Hospital.findOne({
                    hospitalRegistrationId: hospitalData.hospitalRegistrationId
                });
                if (!exists) {
                    try {
                        const hospital = new Hospital(hospitalData);
                        await hospital.save();
                        console.log(`✓ Added new hospital: ${hospitalData.hospitalName}`);
                        addedCount++;
                    } catch (error) {
                        console.log(`⚠ Could not add ${hospitalData.hospitalName}: ${error.message}`);
                    }
                }
            }
            if (addedCount > 0) {
                console.log(`✓ Added ${addedCount} new hospitals`);
            } else {
                console.log('✓ All default hospitals already exist');
            }
        }

        // Seed Blood Banks
        const bloodBankCount = await BloodBank.countDocuments();
        console.log(`Found ${bloodBankCount} blood banks in database`);

        if (bloodBankCount === 0) {
            console.log('🏦 Seeding default blood banks...');
            for (const bloodBankData of facilitiesData.bloodBanks) {
                try {
                    const bloodBank = new BloodBank(bloodBankData);
                    await bloodBank.save();
                    console.log(`✓ Added blood bank: ${bloodBankData.bloodBankName}`);

                    // Add default stock for each blood bank
                    await seedDefaultStock(bloodBank._id);
                } catch (error) {
                    console.log(`⚠ Skipped ${bloodBankData.bloodBankName}: ${error.message}`);
                }
            }
            console.log(`✓ Seeded ${facilitiesData.bloodBanks.length} blood banks`);
        } else {
            // Check for missing blood banks and add them
            let addedCount = 0;
            for (const bloodBankData of facilitiesData.bloodBanks) {
                const exists = await BloodBank.findOne({
                    registrationNumber: bloodBankData.registrationNumber
                });
                if (!exists) {
                    try {
                        const bloodBank = new BloodBank(bloodBankData);
                        await bloodBank.save();
                        console.log(`✓ Added new blood bank: ${bloodBankData.bloodBankName}`);

                        // Add default stock for new blood bank
                        await seedDefaultStock(bloodBank._id);
                        addedCount++;
                    } catch (error) {
                        console.log(`⚠ Could not add ${bloodBankData.bloodBankName}: ${error.message}`);
                    }
                }
            }
            if (addedCount > 0) {
                console.log(`✓ Added ${addedCount} new blood banks`);
            } else {
                console.log('✓ All default blood banks already exist');
            }
        }

        console.log('✅ Facility seeding complete!\n');
    } catch (error) {
        console.error('❌ Error seeding facilities:', error);
    }
}

/**
 * Seeds default blood stock for a blood bank
 * @param {string} bloodBankId - The ID of the blood bank
 */
async function seedDefaultStock(bloodBankId) {
    try {
        const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
        const stockPromises = bloodGroups.map(bloodGroup => {
            const units = Math.floor(Math.random() * 30) + 10; // Random units between 10-40
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 35); // 35 days from now

            const stock = new BloodStock({
                bloodBank: bloodBankId,
                bloodGroup,
                units,
                expiryDate
            });
            return stock.save();
        });

        await Promise.all(stockPromises);
        console.log(`  ✓ Added default stock for blood bank`);
    } catch (error) {
        console.log(`  ⚠ Could not add stock: ${error.message}`);
    }
}

module.exports = { seedFacilities };
