/**
 * Firebase Cloud Messaging Notification Service
 * Robust notification handling with error recovery and batch support
 * Supports all user types: Requester, Donor, Hospital, Blood Bank
 */

const Donor = require('../models/Donor');
const Requester = require('../models/Requester');
const Hospital = require('../models/Hospital');
const BloodBank = require('../models/BloodBank');

class NotificationService {

    /**
     * Get user model and name field by type
     */
    static getUserModel(userType) {
        const models = {
            'requester': { model: Requester, nameField: 'fullName' },
            'donor': { model: Donor, nameField: 'fullName' },
            'hospital': { model: Hospital, nameField: 'hospitalName' },
            'blood_bank': { model: BloodBank, nameField: 'bloodBankName' },
        };
        return models[userType] || models['requester'];
    }

    /**
     * Get user by ID and type
     */
    static async getUser(userId, userType) {
        const { model } = this.getUserModel(userType);
        return await model.findById(userId);
    }

    /**
     * Get display name for a user
     */
    static getDisplayName(user, userType) {
        if (!user) return 'Someone';
        switch (userType) {
            case 'hospital': return user.hospitalName || 'Hospital';
            case 'blood_bank': return user.bloodBankName || 'Blood Bank';
            default: return user.fullName || 'User';
        }
    }

    /**
     * Send notification to a single device
     */
    static async sendToDevice(fcmToken, notification, data = {}) {
        if (!fcmToken || !global.firebaseAdmin) {
            console.log('FCM not available or no token provided');
            return false;
        }

        try {
            const message = {
                token: fcmToken,
                notification: {
                    title: notification.title,
                    body: notification.body,
                },
                data: {
                    ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
                    click_action: 'FLUTTER_NOTIFICATION_CLICK',
                },
                android: {
                    priority: 'high',
                    notification: {
                        channelId: 'blood_requests',
                        priority: 'high',
                        defaultSound: true,
                        defaultVibrateTimings: true,
                    },
                },
            };

            await global.firebaseAdmin.messaging().send(message);
            console.log(`✅ Notification sent: "${notification.title}"`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to send notification:`, error.message);

            if (error.code === 'messaging/invalid-registration-token' ||
                error.code === 'messaging/registration-token-not-registered') {
                await this.removeInvalidToken(fcmToken);
            }
            return false;
        }
    }

    /**
     * Send notification to multiple devices
     */
    static async sendToMultipleDevices(fcmTokens, notification, data = {}) {
        if (!fcmTokens?.length || !global.firebaseAdmin) {
            return { success: 0, failure: 0 };
        }

        const validTokens = fcmTokens.filter(t => t && t.length > 0);
        if (validTokens.length === 0) {
            return { success: 0, failure: 0 };
        }

        try {
            const message = {
                notification: {
                    title: notification.title,
                    body: notification.body,
                },
                data: {
                    ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
                    click_action: 'FLUTTER_NOTIFICATION_CLICK',
                },
                android: {
                    priority: 'high',
                    notification: {
                        channelId: 'blood_requests',
                        priority: 'high',
                    },
                },
                tokens: validTokens,
            };

            const response = await global.firebaseAdmin.messaging().sendEachForMulticast(message);

            console.log(`📬 Batch: ${response.successCount} sent, ${response.failureCount} failed`);

            if (response.failureCount > 0) {
                response.responses.forEach((resp, idx) => {
                    if (!resp.success && resp.error?.code?.includes('registration-token')) {
                        this.removeInvalidToken(validTokens[idx]);
                    }
                });
            }

            return { success: response.successCount, failure: response.failureCount };
        } catch (error) {
            console.error('Batch notification failed:', error.message);
            return { success: 0, failure: validTokens.length };
        }
    }

    /**
     * Remove invalid FCM token from all user collections
     */
    static async removeInvalidToken(fcmToken) {
        try {
            await Promise.all([
                Donor.updateMany({ fcmToken }, { fcmToken: null }),
                Requester.updateMany({ fcmToken }, { fcmToken: null }),
                Hospital.updateMany({ fcmToken }, { fcmToken: null }),
                BloodBank.updateMany({ fcmToken }, { fcmToken: null }),
            ]);
            console.log('Removed invalid FCM token');
        } catch (error) {
            console.error('Failed to remove invalid token:', error.message);
        }
    }

    // ============================================================
    // BLOOD REQUEST NOTIFICATIONS - DYNAMIC FOR ALL USER TYPES
    // ============================================================

    /**
     * Notify potential donors when a new blood request is created
     * Works for requests from: Requester, Hospital, Blood Bank
     */
    static async notifyMatchingDonors(bloodRequest, requesterType = 'requester') {
        try {
            // Get requester info for the message
            let requesterName = 'A patient';
            let locationInfo = bloodRequest.location || bloodRequest.hospitalName || 'nearby location';

            if (bloodRequest.requester) {
                const { model } = this.getUserModel(requesterType);
                const requester = await model.findById(bloodRequest.requester);
                requesterName = this.getDisplayName(requester, requesterType);
            }

            // Find donors with matching blood group
            const matchingDonors = await Donor.find({
                bloodGroup: bloodRequest.bloodGroup,
                isAvailable: true,
                fcmToken: { $exists: true, $ne: null },
            }).select('fcmToken fullName');

            if (matchingDonors.length === 0) {
                console.log('No matching donors found');
                return;
            }

            const tokens = matchingDonors.map(d => d.fcmToken).filter(Boolean);

            // Dynamic message based on requester type
            let body;
            switch (requesterType) {
                case 'hospital':
                    body = `${requesterName} urgently needs ${bloodRequest.bloodGroup} blood. Can you help save a life?`;
                    break;
                case 'blood_bank':
                    body = `${requesterName} needs ${bloodRequest.bloodGroup} blood donors. Your donation can help!`;
                    break;
                default:
                    body = `${bloodRequest.bloodGroup} blood needed at ${locationInfo}. ${bloodRequest.units || 1} unit(s) required urgently.`;
            }

            await this.sendToMultipleDevices(tokens, {
                title: '🩸 Urgent Blood Request!',
                body,
            }, {
                type: 'new_blood_request',
                requestId: bloodRequest._id.toString(),
                bloodGroup: bloodRequest.bloodGroup,
                requesterType,
            });

            console.log(`Notified ${tokens.length} donors for ${bloodRequest.bloodGroup}`);
        } catch (error) {
            console.error('Failed to notify donors:', error.message);
        }
    }

    /**
     * Notify the request creator when a donor accepts
     * Works for: Requester, Hospital, Blood Bank
     */
    static async notifyRequestAccepted(bloodRequest, donor, requesterType = 'requester') {
        try {
            const { model } = this.getUserModel(requesterType);
            const requester = await model.findById(bloodRequest.requester).select('fcmToken');

            if (!requester?.fcmToken) return;

            const donorName = donor.fullName || 'A donor';

            await this.sendToDevice(requester.fcmToken, {
                title: '✅ Donor Found!',
                body: `${donorName} has volunteered to donate ${bloodRequest.bloodGroup} blood. Contact: ${donor.phone || 'See details'}`,
            }, {
                type: 'request_accepted',
                requestId: bloodRequest._id.toString(),
                donorId: donor._id.toString(),
                donorName,
                donorPhone: donor.phone || '',
            });
        } catch (error) {
            console.error('Failed to notify requester:', error.message);
        }
    }

    /**
     * Notify when blood request is fulfilled
     */
    static async notifyRequestFulfilled(bloodRequest, requesterType = 'requester') {
        try {
            const { model } = this.getUserModel(requesterType);
            const requester = await model.findById(bloodRequest.requester).select('fcmToken');

            if (!requester?.fcmToken) return;

            await this.sendToDevice(requester.fcmToken, {
                title: '🎉 Request Fulfilled!',
                body: `Your ${bloodRequest.bloodGroup} blood request has been fulfilled. Thank you for using Jeevan Dhara!`,
            }, {
                type: 'request_fulfilled',
                requestId: bloodRequest._id.toString(),
            });
        } catch (error) {
            console.error('Failed to notify fulfillment:', error.message);
        }
    }

    /**
     * Notify donor when a request they accepted is cancelled
     */
    static async notifyRequestCancelled(bloodRequest, donorId, cancelledBy = 'requester') {
        try {
            const donor = await Donor.findById(donorId).select('fcmToken');
            if (!donor?.fcmToken) return;

            const cancellerName = cancelledBy === 'requester' ? 'the requester' :
                cancelledBy === 'hospital' ? 'the hospital' :
                    cancelledBy === 'blood_bank' ? 'the blood bank' : 'the requester';

            await this.sendToDevice(donor.fcmToken, {
                title: '❌ Request Cancelled',
                body: `The ${bloodRequest.bloodGroup} blood request has been cancelled by ${cancellerName}.`,
            }, {
                type: 'request_cancelled',
                requestId: bloodRequest._id.toString(),
            });
        } catch (error) {
            console.error('Failed to notify cancellation:', error.message);
        }
    }

    /**
     * Thank donor after successful donation
     */
    static async notifyDonorThankYou(donor, bloodRequest) {
        try {
            if (!donor?.fcmToken) return;

            await this.sendToDevice(donor.fcmToken, {
                title: '🙏 Thank You, Hero!',
                body: `Your ${bloodRequest.bloodGroup} blood donation saved a life. You're a true hero!`,
            }, {
                type: 'donation_complete',
                requestId: bloodRequest._id.toString(),
                bloodGroup: bloodRequest.bloodGroup,
            });
        } catch (error) {
            console.error('Failed to send thank you:', error.message);
        }
    }

    // ============================================================
    // HOSPITAL & BLOOD BANK SPECIFIC NOTIFICATIONS
    // ============================================================

    /**
     * Notify hospital when blood stock is low
     */
    static async notifyLowStock(hospital, bloodGroup, currentUnits) {
        try {
            if (!hospital?.fcmToken) return;

            await this.sendToDevice(hospital.fcmToken, {
                title: '⚠️ Low Blood Stock Alert',
                body: `${bloodGroup} stock is critically low (${currentUnits} units). Consider requesting donations.`,
            }, {
                type: 'low_stock_alert',
                bloodGroup,
                units: currentUnits,
            });
        } catch (error) {
            console.error('Failed to send low stock alert:', error.message);
        }
    }

    /**
     * Notify blood bank of incoming donation
     */
    static async notifyIncomingDonation(bloodBank, donor, bloodGroup) {
        try {
            if (!bloodBank?.fcmToken) return;

            const donorName = donor.fullName || 'A donor';

            await this.sendToDevice(bloodBank.fcmToken, {
                title: '📍 Incoming Donation',
                body: `${donorName} is coming to donate ${bloodGroup} blood. Prepare for collection.`,
            }, {
                type: 'incoming_donation',
                donorId: donor._id.toString(),
                bloodGroup,
            });
        } catch (error) {
            console.error('Failed to notify blood bank:', error.message);
        }
    }

    /**
     * Notify all nearby hospitals/blood banks about emergency request
     */
    static async notifyEmergencyRequest(bloodRequest, location) {
        try {
            // Get all hospitals and blood banks with FCM tokens
            const hospitals = await Hospital.find({
                fcmToken: { $exists: true, $ne: null }
            }).select('fcmToken hospitalName');

            const bloodBanks = await BloodBank.find({
                fcmToken: { $exists: true, $ne: null }
            }).select('fcmToken bloodBankName');

            const allTokens = [
                ...hospitals.map(h => h.fcmToken),
                ...bloodBanks.map(b => b.fcmToken)
            ].filter(Boolean);

            if (allTokens.length === 0) return;

            await this.sendToMultipleDevices(allTokens, {
                title: '🚨 EMERGENCY Blood Request!',
                body: `${bloodRequest.bloodGroup} blood needed URGENTLY at ${location}. ${bloodRequest.units || 1} units required.`,
            }, {
                type: 'emergency_request',
                requestId: bloodRequest._id.toString(),
                bloodGroup: bloodRequest.bloodGroup,
                priority: 'emergency',
            });

            console.log(`Emergency alert sent to ${allTokens.length} facilities`);
        } catch (error) {
            console.error('Failed to send emergency alert:', error.message);
        }
    }
}

module.exports = NotificationService;
